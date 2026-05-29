using System.ComponentModel.DataAnnotations;

namespace KSWeb.Api.Models;

public sealed class StatusCreateRequest
{
    [Required]
    [MaxLength(100)]
    public string StatusName { get; set; } = string.Empty;

    public bool IsPending { get; set; } = true;

    public bool StatusStopClock { get; set; }

    [MaxLength(250)]
    public string? StatusDescription { get; set; }

    [Required]
    [MaxLength(100)]
    public string InternalName { get; set; } = string.Empty;
}

public sealed class StatusUpdateRequest
{
    [Required]
    [MaxLength(100)]
    public string StatusName { get; set; } = string.Empty;

    public bool IsPending { get; set; } = true;

    public bool StatusStopClock { get; set; }

    [MaxLength(250)]
    public string? StatusDescription { get; set; }

    [Required]
    [MaxLength(100)]
    public string InternalName { get; set; } = string.Empty;
}
