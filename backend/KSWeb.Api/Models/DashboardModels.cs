namespace KSWeb.Api.Models;

public sealed record DashboardResumo(
    int TotalOS,
    int TotalAbertas,
    int TotalComResolucao,
    int TotalSemResolucao,
    IReadOnlyList<DashboardStatusItem> Status);

public sealed class DashboardStatusItem
{
    public long StatusId { get; set; }

    public string Status { get; set; } = string.Empty;

    public long Total { get; set; }
}
