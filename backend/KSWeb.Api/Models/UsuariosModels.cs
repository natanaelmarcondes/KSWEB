namespace KSWeb.Api.Models;

public sealed record UsuarioResumo(
    int UsrCodigo,
    long UserId,
    string Nome,
    string Email,
    string Nivel,
    long? QueueId,
    string? Setor);

public sealed record UsuarioEdicao(
    int UsrCodigo,
    int SetCodigo,
    long UserId,
    string Nome,
    string Email,
    string Nivel,
    long? QueueId,
    string? Setor);

public sealed record FilaOption(
    long QueueId,
    string QueueName);

public sealed record CriarUsuarioRequest(
    string Nome,
    string Email,
    string UsrNivel,
    long QueueId);

public sealed record AtualizarUsuarioRequest(
    int SetCodigo,
    long UserId,
    string Nome,
    string Email,
    string UsrNivel,
    long QueueId);

public sealed record ResetSenhaResponse(
    int UsrCodigo,
    string SenhaPadrao);

