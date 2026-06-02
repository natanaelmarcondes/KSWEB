using System.ComponentModel.DataAnnotations;

namespace KSWeb.Api.Models;

public sealed class SetorCreateRequest
{
    [Required]
    [MaxLength(255)]
    public string QueueName { get; set; } = string.Empty;
}

public sealed class SetorUpdateRequest
{
    [Required]
    [MaxLength(255)]
    public string QueueName { get; set; } = string.Empty;
}
