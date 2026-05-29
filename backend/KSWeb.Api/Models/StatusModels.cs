namespace KSWeb.Api.Models;

public sealed class StatusListItem
{
    public long StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public bool IsPending { get; set; }
    public bool StatusStopClock { get; set; }
    public string StatusDescription { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public string InternalName { get; set; } = string.Empty;
}