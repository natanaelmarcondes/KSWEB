namespace KSWeb.Api.Models;

public sealed class DailyFiltro
{
    public int? DailyNumero { get; set; }
    public string? Usuario { get; set; }
    public DateTime? DataInicial { get; set; }
    public DateTime? DataFinal { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

public sealed class DailyResponse
{
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPaginas { get; set; }
    public List<DailyItem> Items { get; set; } = [];
}

public sealed class DailyItem
{
    public int DailyId { get; set; }
    public int DailyNumero { get; set; }
    public DateTime DailyData { get; set; }
    public string DailyUsuario { get; set; } = string.Empty;
    public int TotalRegistros { get; set; }
}

public sealed class DailyNovaRequest
{
    public string DailyUsuario { get; set; } = string.Empty;
}

public sealed class DailyNovaResponse
{
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public int DailyId { get; set; }
    public int DailyNumero { get; set; }
}