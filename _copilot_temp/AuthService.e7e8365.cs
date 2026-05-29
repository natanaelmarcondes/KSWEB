using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace KSWeb.Api.Services;

public sealed class AuthService
{
    private const int ShortSessionSeconds = 8 * 60 * 60;
    private const int PersistentSessionSeconds = 30 * 24 * 60 * 60;

    private readonly DbConnectionFactory _connectionFactory;
    private readonly IConfiguration _configuration;

    public AuthService(DbConnectionFactory connectionFactory, IConfiguration configuration)
    {
        _connectionFactory = connectionFactory;
        _configuration = configuration;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Senha))
        {
            return null;
        }

        using var connection = _connectionFactory.CreateConnection();

        var usuario = await connection.QuerySingleOrDefaultAsync<UsuarioLoginRow>(
            """
            SELECT
                u.usr_codigo AS UsrCodigo,
                u.USER_ID AS UserId,
                u.usr_nome AS Nome,
                u.usr_email AS Email,
                u.usr_nivel AS Nivel,
                u.usr_senha_hash AS SenhaHash,
                s.set_nome AS Setor
            FROM usuarios u
            JOIN setores s ON s.set_codigo = u.set_codigo
            WHERE u.usr_email = @email;
            """,
            new { email = request.Email.Trim() });

        if (usuario is null || string.IsNullOrWhiteSpace(usuario.SenhaHash))
        {
            return null;
        }

        bool senhaValida;
        try
        {
            senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash);
        }
        catch
        {
            return null;
        }

        if (!senhaValida)
        {
            return null;
        }

        var queues = await LoadQueuesAsync(connection, usuario.UserId);
        int expiresIn = request.ManterConectado ? PersistentSessionSeconds : ShortSessionSeconds;
        var authUsuario = ToAuthUsuario(usuario, queues);
        string accessToken = CreateAccessToken(authUsuario, TimeSpan.FromSeconds(expiresIn));
        string refreshToken = await CreateRefreshTokenAsync(connection, usuario.UsrCodigo, TimeSpan.FromSeconds(expiresIn));

        return new AuthResponse(authUsuario, accessToken, expiresIn, refreshToken);
    }

    public async Task<AuthResponse?> RefreshAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return null;
        }

        string tokenHash = HashToken(refreshToken);
        using var connection = _connectionFactory.CreateConnection();
        await EnsureRefreshTokenTableAsync(connection);

        var sessao = await connection.QuerySingleOrDefaultAsync<RefreshTokenRow>(
            """
            SELECT id AS Id, usr_codigo AS UsrCodigo, expires_at AS ExpiresAt, revoked_at AS RevokedAt
            FROM auth_refresh_tokens
            WHERE token_hash = @tokenHash
            LIMIT 1;
            """,
            new { tokenHash });

        if (sessao is null || sessao.RevokedAt is not null || sessao.ExpiresAt <= DateTime.UtcNow)
        {
            return null;
        }

        var usuario = await connection.QuerySingleOrDefaultAsync<UsuarioLoginRow>(
            """
            SELECT
                u.usr_codigo AS UsrCodigo,
                u.USER_ID AS UserId,
                u.usr_nome AS Nome,
                u.usr_email AS Email,
                u.usr_nivel AS Nivel,
                u.usr_senha_hash AS SenhaHash,
                s.set_nome AS Setor
            FROM usuarios u
            JOIN setores s ON s.set_codigo = u.set_codigo
            WHERE u.usr_codigo = @usrCodigo;
            """,
            new { usrCodigo = sessao.UsrCodigo });

        if (usuario is null)
        {
            return null;
        }

        await connection.ExecuteAsync(
            "UPDATE auth_refresh_tokens SET revoked_at = UTC_TIMESTAMP() WHERE id = @id;",
            new { id = sessao.Id });

        var remaining = sessao.ExpiresAt - DateTime.UtcNow;
        if (remaining <= TimeSpan.Zero)
        {
            return null;
        }

        var queues = await LoadQueuesAsync(connection, usuario.UserId);
        var authUsuario = ToAuthUsuario(usuario, queues);
        string accessToken = CreateAccessToken(authUsuario, remaining);
        string newRefreshToken = await CreateRefreshTokenAsync(connection, usuario.UsrCodigo, remaining);

        return new AuthResponse(authUsuario, accessToken, (int)remaining.TotalSeconds, newRefreshToken);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        using var connection = _connectionFactory.CreateConnection();
        await EnsureRefreshTokenTableAsync(connection);

        await connection.ExecuteAsync(
            """
            UPDATE auth_refresh_tokens
            SET revoked_at = UTC_TIMESTAMP()
            WHERE token_hash = @tokenHash
              AND revoked_at IS NULL;
            """,
            new { tokenHash = HashToken(refreshToken) });
    }

    public AuthUsuario UsuarioFromClaims(ClaimsPrincipal user)
    {
        string queuesJson = user.FindFirstValue("queues") ?? "[]";
        IReadOnlyList<string> queues;

        try
        {
            queues = JsonSerializer.Deserialize<IReadOnlyList<string>>(queuesJson) ?? [];
        }
        catch
        {
            queues = [];
        }

        return new AuthUsuario(
            int.Parse(user.FindFirstValue("usr_codigo") ?? "0"),
            long.Parse(user.FindFirstValue("USER_ID") ?? "0"),
            user.FindFirstValue("usr_nome") ?? string.Empty,
            user.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
            user.FindFirstValue(ClaimTypes.Role) ?? string.Empty,
            user.FindFirstValue("setor") ?? string.Empty,
            queues);
    }

    private async Task<IReadOnlyList<string>> LoadQueuesAsync(System.Data.IDbConnection connection, long userId)
    {
        var queues = await connection.QueryAsync<string>(
            """
            SELECT qd.QUEUENAME
            FROM queue_technician qt
            JOIN queuedefinition qd ON qd.QUEUEID = qt.QUEUEID
            WHERE qt.TECHNICIANID = @userId
            ORDER BY qd.QUEUENAME;
            """,
            new { userId });

        return queues.AsList();
    }

    private static AuthUsuario ToAuthUsuario(UsuarioLoginRow usuario, IReadOnlyList<string> queues)
    {
        return new AuthUsuario(
            usuario.UsrCodigo,
            usuario.UserId,
            usuario.Nome,
            usuario.Email,
            usuario.Nivel,
            usuario.Setor,
            queues);
    }

    private string CreateAccessToken(AuthUsuario usuario, TimeSpan lifetime)
    {
        var jwt = _configuration.GetSection("Jwt");
        string key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key nao configurado.");
        string issuer = jwt["Issuer"] ?? "KSWeb.Api";
        string audience = jwt["Audience"] ?? "KSWeb.App";
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.UsrCodigo.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new("usr_codigo", usuario.UsrCodigo.ToString()),
            new("USER_ID", usuario.UserId.ToString()),
            new("usr_nome", usuario.Nome),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Role, usuario.Nivel),
            new("setor", usuario.Setor),
            new("queues", JsonSerializer.Serialize(usuario.Queues))
        };

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.Add(lifetime),
            signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> CreateRefreshTokenAsync(System.Data.IDbConnection connection, int usrCodigo, TimeSpan lifetime)
    {
        await EnsureRefreshTokenTableAsync(connection);

        string token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        string tokenHash = HashToken(token);

        await connection.ExecuteAsync(
            """
            INSERT INTO auth_refresh_tokens (usr_codigo, token_hash, expires_at, created_at)
            VALUES (@usrCodigo, @tokenHash, @expiresAt, UTC_TIMESTAMP());
            """,
            new
            {
                usrCodigo,
                tokenHash,
                expiresAt = DateTime.UtcNow.Add(lifetime)
            });

        return token;
    }

    private static async Task EnsureRefreshTokenTableAsync(System.Data.IDbConnection connection)
    {
        await connection.ExecuteAsync(
            """
            CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                usr_codigo INT NOT NULL,
                token_hash CHAR(64) NOT NULL,
                expires_at DATETIME NOT NULL,
                revoked_at DATETIME NULL,
                created_at DATETIME NOT NULL,
                UNIQUE KEY uq_auth_refresh_tokens_token_hash (token_hash),
                KEY ix_auth_refresh_tokens_usr_codigo (usr_codigo),
                KEY ix_auth_refresh_tokens_expires_at (expires_at)
            );
            """);
    }

    private static string HashToken(string token)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private sealed class UsuarioLoginRow
    {
        public int UsrCodigo { get; init; }
        public long UserId { get; init; }
        public string Nome { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public string Nivel { get; init; } = string.Empty;
        public string SenhaHash { get; init; } = string.Empty;
        public string Setor { get; init; } = string.Empty;
    }

    private sealed class RefreshTokenRow
    {
        public long Id { get; init; }
        public int UsrCodigo { get; init; }
        public DateTime ExpiresAt { get; init; }
        public DateTime? RevokedAt { get; init; }
    }
}

