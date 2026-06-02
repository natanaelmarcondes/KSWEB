namespace KSWeb.Api.Models;

public sealed class DailyRegistroItem
{
    public int RegId { get; set; }
    public int DailyId { get; set; }
    public DateTime RegData { get; set; }
    public int? OsId { get; set; }
    public string? RegCliente { get; set; }
    public string? RegDescricao { get; set; }
    public string? RegStatus { get; set; }
}

public sealed class DailyRegistrosResponse
{
    public int DailyId { get; set; }
    public int Total { get; set; }
    public List<DailyRegistroItem> Items { get; set; } = [];
}

public sealed class DailyRegistroSalvarRequest
{
    public DateTime? RegData { get; set; }
    public int? OsId { get; set; }
    public string? RegCliente { get; set; }
    public string? RegDescricao { get; set; }
    public string? RegStatus { get; set; }
}

public sealed class DailyRegistroSalvarResponse
{
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public int DailyId { get; set; }
    public int RegId { get; set; }
}

public sealed class DailyRegistroExcluirResponse
{
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public int DailyId { get; set; }
    public int RegId { get; set; }
}