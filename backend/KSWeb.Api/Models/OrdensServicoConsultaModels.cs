namespace KSWeb.Api.Models;

public sealed class OrdensServicoConsultaFiltro
{
    public long? NumeroOs { get; set; }
    public string? Solicitante { get; set; }
    public string? CriadoPor { get; set; }
    public string? Responsavel { get; set; }
    public List<string> Status { get; set; } = [];

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

public sealed class OrdensServicoConsultaResponse
{
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPaginas { get; set; }
    public List<OrdemServicoConsultaItem> Items { get; set; } = [];
}

public sealed class OrdemServicoConsultaItem
{
    public long NumeroOs { get; set; }
    public string Titulo { get; set; } = string.Empty;

    public long? CriadoEmMs { get; set; }
    public DateTime? CriadoEm { get; set; }

    public long? SolicitanteId { get; set; }
    public string Solicitante { get; set; } = string.Empty;

    public long? CriadoPorId { get; set; }
    public string CriadoPor { get; set; } = string.Empty;

    public long? ResponsavelId { get; set; }
    public string Responsavel { get; set; } = string.Empty;

    public long? SetorId { get; set; }
    public string Setor { get; set; } = string.Empty;

    public long? StatusId { get; set; }
    public string StatusNome { get; set; } = string.Empty;

    public bool? Atrasada { get; set; }
    public bool? Lida { get; set; }
}