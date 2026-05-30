namespace KSWeb.Api.Models;

public sealed record DashboardResumo(
    int TotalOS,
    int TotalAbertas,
    int TotalComResolucao,
    int TotalSemResolucao,
    IReadOnlyList<DashboardStatusItem> Status);

public sealed record DashboardStatusItem(
    long StatusId,
    string Status,
    int Total);
