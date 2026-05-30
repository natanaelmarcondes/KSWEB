namespace KSWeb.Api.Models;

public sealed record OrdemServicoListItem(
    long OsCodigo,
    long OsData,
    string OsTitulo,
    string Cliente,
    string UsuarioAbertura,
    string? Status,
    bool? IsRead,
    string UsuarioResponsavel);

public sealed record OrdemServicoListResponse(
    IReadOnlyList<OrdemServicoListItem> Items,
    int Total,
    int Page,
    int PageSize,
    string? UsuarioLogadoNome);

public sealed record OrdemServicoStatusOption(
    long StatusId,
    string StatusName);

public sealed record OrdemServicoUsuarioOption(
    long UserId,
    string FirstName);

public sealed record OrdemServicoFiltrosResponse(
    IReadOnlyList<OrdemServicoStatusOption> Status,
    IReadOnlyList<OrdemServicoUsuarioOption> Usuarios);

public sealed record OrdemServicoGrupoOption(
    long GrpId,
    string GrpNome);

public sealed record OrdemServicoUsuarioGrupoOption(
    long UsrCodigo,
    string UsrNome);

public sealed record OrdemServicoCombosResponse(
    IReadOnlyList<OrdemServicoUsuarioOption> Clientes,
    IReadOnlyList<OrdemServicoStatusOption> Status,
    IReadOnlyList<OrdemServicoGrupoOption> Grupos);

public sealed record OrdemServicoFormResponse(
    long? WorkorderId,
    long? RequesterId,
    string? RequesterName,
    long? CreatedById,
    string? CreatedByName,
    long? CreatedTime,
    string Title,
    string Description,
    string FullDescription,
    long? OwnerId,
    string? OwnerName,
    long? StatusId,
    string? StatusName,
    long? QueueId,
    string? QueueName,
    string? LastResolution,
    IReadOnlyList<OrdemServicoHistoricoItem> Historico,
    IReadOnlyList<OrdemServicoResolucaoItem> Resolucoes);

public sealed record OrdemServicoHistoricoItem(
    long HistoryId,
    long WorkorderId,
    long? OperationOwnerId,
    long? OperationTime,
    string? Description,
    string? Operation);

public sealed record OrdemServicoResolucaoItem(
    long HistoryDiffId,
    long HistoryId,
    string ColumnName,
    string? PrevValue,
    string? CurrentValue,
    long? OperationTime);

public sealed record SalvarOrdemServicoRequest(
    long RequesterId,
    string Title,
    string Description,
    string FullDescription,
    long? OwnerId,
    long? StatusId);

public sealed record SalvarResolucaoRequest(string Html, string Texto);

public sealed record AlterarStatusAtribuirRequest(
    long? StatusId,
    long? QueueId,
    long? OwnerId);
