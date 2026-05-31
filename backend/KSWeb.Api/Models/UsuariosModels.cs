namespace KSWeb.Api.Models;

public sealed class UsuarioListItem
{
    public int? UsrCodigo { get; set; }
    public long UserId { get; set; }
    public string UsrNome { get; set; } = string.Empty;
    public string UsrEmail { get; set; } = string.Empty;
    public string UsrNivel { get; set; } = string.Empty;
    public long? QueueId { get; set; }
    public string Setor { get; set; } = string.Empty;
}