using System.Data;
using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;

namespace KSWeb.Api.Services;

public sealed class UsuariosService
{
    private const string SenhaPadrao = "123456";

    private readonly DbConnectionFactory _connectionFactory;

    public UsuariosService(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<FilaOption>> ListarFilasAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var filas = await connection.QueryAsync<FilaOption>(
            """
            SELECT QUEUEID AS QueueId, QUEUENAME AS QueueName
            FROM queuedefinition
            ORDER BY QUEUENAME;
            """);

        return filas.AsList();
    }

    public async Task<IReadOnlyList<UsuarioResumo>> ListarAsync(string? termo)
    {
        using var connection = _connectionFactory.CreateConnection();

        string sql = """
            SELECT
                us.usr_codigo AS UsrCodigo,
                us.USER_ID AS UserId,
                us.usr_nome AS Nome,
                us.usr_email AS Email,
                us.usr_nivel AS Nivel,
                COALESCE(qt.QUEUEID, us.QUEUEID) AS QueueId,
                COALESCE(qdQt.QUEUENAME, qdUs.QUEUENAME) AS Setor
            FROM usuarios us
            LEFT JOIN queue_technician qt ON us.USER_ID = qt.TECHNICIANID
            LEFT JOIN queuedefinition qdQt ON qt.QUEUEID = qdQt.QUEUEID
            LEFT JOIN queuedefinition qdUs ON us.QUEUEID = qdUs.QUEUEID
            """;

        object? parameters = null;

        if (!string.IsNullOrWhiteSpace(termo))
        {
            sql += """

            WHERE us.usr_nome LIKE CONCAT('%', @termo, '%')
            """;
            parameters = new { termo = termo.Trim() };
        }

        sql += """

            ORDER BY us.usr_nome;
            """;

        var usuarios = await connection.QueryAsync<UsuarioResumo>(sql, parameters);
        return usuarios.AsList();
    }

    public async Task<UsuarioEdicao?> ObterAsync(int codigo)
    {
        using var connection = _connectionFactory.CreateConnection();

        return await connection.QueryFirstOrDefaultAsync<UsuarioEdicao>(
            """
            SELECT
                us.usr_codigo AS UsrCodigo,
                us.set_codigo AS SetCodigo,
                us.USER_ID AS UserId,
                us.usr_nome AS Nome,
                us.usr_email AS Email,
                us.usr_nivel AS Nivel,
                COALESCE(qt.QUEUEID, us.QUEUEID) AS QueueId,
                COALESCE(qdQt.QUEUENAME, qdUs.QUEUENAME) AS Setor
            FROM usuarios us
            LEFT JOIN queue_technician qt ON us.USER_ID = qt.TECHNICIANID
            LEFT JOIN queuedefinition qdQt ON qt.QUEUEID = qdQt.QUEUEID
            LEFT JOIN queuedefinition qdUs ON us.QUEUEID = qdUs.QUEUEID
            WHERE us.usr_codigo = @codigo
            ORDER BY us.usr_nome;
            """,
            new { codigo });
    }

    public async Task<(bool Criado, string? Erro, UsuarioEdicao? Usuario)> CriarAsync(CriarUsuarioRequest request)
    {
        string? validationError = ValidarCriacao(request);
        if (validationError is not null)
        {
            return (false, validationError, null);
        }

        using var connection = _connectionFactory.CreateConnection();
        AbrirConexao(connection);
        using var transaction = connection.BeginTransaction();

        try
        {
            if (await EmailExisteAsync(connection, transaction, request.Email, null))
            {
                return (false, "E-mail ja cadastrado.", null);
            }

            long nextUserId = await connection.QuerySingleAsync<long>(
                """
                SELECT COALESCE(MAX(USER_ID), 0) + 1 AS nextId
                FROM aaauser;
                """,
                transaction: transaction);

            long createdTimeUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            string senhaHash = BCrypt.Net.BCrypt.HashPassword(SenhaPadrao);

            await connection.ExecuteAsync(
                """
                INSERT INTO aaauser (
                    USER_ID,
                    FIRST_NAME,
                    MIDDLE_NAME,
                    LAST_NAME,
                    CREATEDTIME,
                    DESCRIPTION
                )
                VALUES (
                    @nextUserId,
                    @nome,
                    NULL,
                    NULL,
                    @createdTimeUnixMs,
                    'No Description'
                );
                """,
                new
                {
                    nextUserId,
                    nome = request.Nome.Trim(),
                    createdTimeUnixMs
                },
                transaction);

            int usrCodigo = await connection.QuerySingleAsync<int>(
                """
                INSERT INTO usuarios (
                    set_codigo,
                    QUEUEID,
                    USER_ID,
                    usr_nome,
                    usr_email,
                    usr_nivel,
                    usr_senha_hash
                )
                VALUES (
                    1,
                    @queueId,
                    @nextUserId,
                    @nome,
                    @email,
                    @usrNivel,
                    @senhaHash
                );
                SELECT LAST_INSERT_ID();
                """,
                new
                {
                    queueId = request.QueueId,
                    nextUserId,
                    nome = request.Nome.Trim(),
                    email = request.Email.Trim(),
                    usrNivel = request.UsrNivel.Trim(),
                    senhaHash
                },
                transaction);

            await InserirVinculosServiceDeskAsync(connection, transaction, nextUserId, request.QueueId);

            transaction.Commit();

            return (true, null, await ObterAsync(usrCodigo));
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<(bool Atualizado, string? Erro, UsuarioEdicao? Usuario)> AtualizarAsync(int usrCodigo, AtualizarUsuarioRequest request)
    {
        string? validationError = ValidarAtualizacao(request);
        if (validationError is not null)
        {
            return (false, validationError, null);
        }

        using var connection = _connectionFactory.CreateConnection();
        AbrirConexao(connection);
        using var transaction = connection.BeginTransaction();

        try
        {
            if (await EmailExisteAsync(connection, transaction, request.Email, usrCodigo))
            {
                return (false, "E-mail ja cadastrado para outro usuario.", null);
            }

            int usuarioExiste = await connection.QuerySingleAsync<int>(
                """
                SELECT COUNT(1)
                FROM usuarios
                WHERE usr_codigo = @usrCodigo;
                """,
                new { usrCodigo },
                transaction);

            if (usuarioExiste == 0)
            {
                return (false, "Usuario nao encontrado.", null);
            }

            await connection.ExecuteAsync(
                """
                UPDATE aaauser
                SET FIRST_NAME = @nome
                WHERE USER_ID = @USER_ID;
                """,
                new
                {
                    nome = request.Nome.Trim(),
                    USER_ID = request.UserId
                },
                transaction);

            await connection.ExecuteAsync(
                """
                UPDATE usuarios
                SET
                    set_codigo = @setCodigo,
                    QUEUEID = @queueId,
                    USER_ID = @USER_ID,
                    usr_nome = @nome,
                    usr_email = @email,
                    usr_nivel = @usrNivel
                WHERE usr_codigo = @usrCodigo;
                """,
                new
                {
                    setCodigo = request.SetCodigo,
                    queueId = request.QueueId,
                    USER_ID = request.UserId,
                    nome = request.Nome.Trim(),
                    email = request.Email.Trim(),
                    usrNivel = request.UsrNivel.Trim(),
                    usrCodigo
                },
                transaction);

            await connection.ExecuteAsync(
                """
                DELETE FROM queue_technician
                WHERE TECHNICIANID = @USER_ID;
                """,
                new { USER_ID = request.UserId },
                transaction);

            await connection.ExecuteAsync(
                """
                INSERT INTO queue_technician (
                    QUEUEID,
                    TECHNICIANID
                )
                VALUES (
                    @queueId,
                    @USER_ID
                );
                """,
                new
                {
                    queueId = request.QueueId,
                    USER_ID = request.UserId
                },
                transaction);

            transaction.Commit();

            return (true, null, await ObterAsync(usrCodigo));
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> ResetarSenhaAsync(int usrCodigo)
    {
        using var connection = _connectionFactory.CreateConnection();
        string senhaHash = BCrypt.Net.BCrypt.HashPassword(SenhaPadrao);

        int affected = await connection.ExecuteAsync(
            """
            UPDATE usuarios
            SET usr_senha_hash = @senhaHash
            WHERE usr_codigo = @usrCodigo;
            """,
            new { senhaHash, usrCodigo });

        return affected > 0;
    }

    private static async Task InserirVinculosServiceDeskAsync(IDbConnection connection, IDbTransaction transaction, long nextUserId, long queueId)
    {
        await connection.ExecuteAsync(
            """
            INSERT INTO sduser (
                USERID,
                EMPLOYEEID,
                JOBTITLE,
                STATUS,
                SMSMAILID,
                DOMAIN_ID,
                SECONDEMAILID,
                LDAP_ID,
                USER_DN,
                CIID
            )
            VALUES (
                @nextUserId,
                '',
                '',
                'ACTIVE',
                '',
                NULL,
                '',
                NULL,
                '',
                NULL
            );
            """,
            new { nextUserId },
            transaction);

        await connection.ExecuteAsync(
            """
            INSERT INTO helpdeskcrew (
                COSTPERHOUR,
                ISDCLOGIN,
                TECHNICIANID
            )
            VALUES (
                0,
                0,
                @nextUserId
            );
            """,
            new { nextUserId },
            transaction);

        await connection.ExecuteAsync(
            """
            INSERT INTO queue_technician (
                QUEUEID,
                TECHNICIANID
            )
            VALUES (
                @queueId,
                @nextUserId
            );
            """,
            new { queueId, nextUserId },
            transaction);
    }

    private static async Task<bool> EmailExisteAsync(IDbConnection connection, IDbTransaction transaction, string email, int? usrCodigoIgnorado)
    {
        int exists = await connection.QuerySingleOrDefaultAsync<int>(
            usrCodigoIgnorado is null
                ? """
                  SELECT 1
                  FROM usuarios
                  WHERE LOWER(usr_email) = LOWER(@email)
                  LIMIT 1;
                  """
                : """
                  SELECT 1
                  FROM usuarios
                  WHERE LOWER(usr_email) = LOWER(@email)
                    AND usr_codigo <> @usrCodigo
                  LIMIT 1;
                  """,
            new
            {
                email = email.Trim(),
                usrCodigo = usrCodigoIgnorado
            },
            transaction);

        return exists == 1;
    }

    private static string? ValidarCriacao(CriarUsuarioRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nome))
        {
            return "Nome e obrigatorio.";
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return "E-mail e obrigatorio.";
        }

        if (string.IsNullOrWhiteSpace(request.UsrNivel))
        {
            return "Nivel e obrigatorio.";
        }

        if (request.QueueId <= 0)
        {
            return "Fila/setor e obrigatorio.";
        }

        return null;
    }

    private static string? ValidarAtualizacao(AtualizarUsuarioRequest request)
    {
        if (request.UserId <= 0)
        {
            return "USER_ID e obrigatorio.";
        }

        if (request.SetCodigo <= 0)
        {
            return "set_codigo e obrigatorio.";
        }

        if (string.IsNullOrWhiteSpace(request.Nome))
        {
            return "Nome e obrigatorio.";
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return "E-mail e obrigatorio.";
        }

        if (string.IsNullOrWhiteSpace(request.UsrNivel))
        {
            return "Nivel e obrigatorio.";
        }

        if (request.QueueId <= 0)
        {
            return "Fila/setor e obrigatorio.";
        }

        return null;
    }

    private static void AbrirConexao(IDbConnection connection)
    {
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
        }
    }
}

