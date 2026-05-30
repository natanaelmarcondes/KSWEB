namespace KSWeb.Api.Models;

public sealed record LoginRequest(
    string Email,
    string Senha,
    bool ManterConectado);

public sealed record RefreshRequest(string RefreshToken);

public sealed record LogoutRequest(string RefreshToken);

public sealed record AuthResponse(
    AuthUsuario Usuario,
    string AccessToken,
    int ExpiresIn,
    string? RefreshToken);

public sealed record AuthUsuario(
    int UsrCodigo,
    long UserId,
    string Nome,
    string Email,
    string Nivel,
    string Setor,
    IReadOnlyList<string> Queues);

