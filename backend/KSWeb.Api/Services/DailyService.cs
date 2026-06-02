using System.Text;
using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;

namespace KSWeb.Api.Services;

public sealed class DailyService
{
    private readonly DbConnectionFactory _connectionFactory;

    public DailyService(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<DailyResponse> ListarAsync(DailyFiltro filtro)
    {
        if (filtro.Page <= 0)
            filtro.Page = 1;

        if (filtro.PageSize <= 0)
            filtro.PageSize = 25;

        if (filtro.PageSize > 200)
            filtro.PageSize = 200;

        int offset = (filtro.Page - 1) * filtro.PageSize;

        DynamicParameters parametros = new();

        StringBuilder where = new();
        where.AppendLine("WHERE 1 = 1");

        if (filtro.DailyNumero.HasValue)
        {
            where.AppendLine("AND d.daily_numero = @DailyNumero");
            parametros.Add("DailyNumero", filtro.DailyNumero.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtro.Usuario))
        {
            where.AppendLine("AND d.daily_usuario LIKE @Usuario");
            parametros.Add("Usuario", $"%{filtro.Usuario.Trim()}%");
        }

        if (filtro.DataInicial.HasValue)
        {
            where.AppendLine("AND d.daily_data >= @DataInicial");
            parametros.Add("DataInicial", filtro.DataInicial.Value.Date);
        }

        if (filtro.DataFinal.HasValue)
        {
            where.AppendLine("AND d.daily_data < @DataFinal");
            parametros.Add("DataFinal", filtro.DataFinal.Value.Date.AddDays(1));
        }

        parametros.Add("Limit", filtro.PageSize);
        parametros.Add("Offset", offset);

        using var connection = _connectionFactory.CreateConnection();

        string sqlTotal = $"""
            SELECT COUNT(*)
            FROM daily d
            {where};
            """;

        int total = await connection.ExecuteScalarAsync<int>(sqlTotal, parametros);

        string sqlItems = $"""
            SELECT
                d.daily_id AS DailyId,
                d.daily_numero AS DailyNumero,
                d.daily_data AS DailyData,
                d.daily_usuario AS DailyUsuario,
                COUNT(r.reg_id) AS TotalRegistros
            FROM daily d
            LEFT JOIN dailyregistros r ON r.daily_id = d.daily_id
            {where}
            GROUP BY
                d.daily_id,
                d.daily_numero,
                d.daily_data,
                d.daily_usuario
            ORDER BY d.daily_numero DESC
            LIMIT @Limit OFFSET @Offset;
            """;

        var items = await connection.QueryAsync<DailyItem>(sqlItems, parametros);

        int totalPaginas = total == 0
            ? 0
            : (int)Math.Ceiling(total / (double)filtro.PageSize);

        return new DailyResponse
        {
            Total = total,
            Page = filtro.Page,
            PageSize = filtro.PageSize,
            TotalPaginas = totalPaginas,
            Items = items.AsList()
        };
    }

    public async Task<DailyItem?> ObterPorIdAsync(int dailyId)
    {
        using var connection = _connectionFactory.CreateConnection();

        const string sql = """
            SELECT
                d.daily_id AS DailyId,
                d.daily_numero AS DailyNumero,
                d.daily_data AS DailyData,
                d.daily_usuario AS DailyUsuario,
                COUNT(r.reg_id) AS TotalRegistros
            FROM daily d
            LEFT JOIN dailyregistros r ON r.daily_id = d.daily_id
            WHERE d.daily_id = @DailyId
            GROUP BY
                d.daily_id,
                d.daily_numero,
                d.daily_data,
                d.daily_usuario;
            """;

        return await connection.QueryFirstOrDefaultAsync<DailyItem>(
            sql,
            new { DailyId = dailyId }
        );
    }

    public async Task<DailyNovaResponse> CriarNovaAsync(DailyNovaRequest request)
    {
        if (request == null)
        {
            return new DailyNovaResponse
            {
                Sucesso = false,
                Mensagem = "Dados da daily não foram enviados."
            };
        }

        if (string.IsNullOrWhiteSpace(request.DailyUsuario))
        {
            return new DailyNovaResponse
            {
                Sucesso = false,
                Mensagem = "Usuário da daily não informado."
            };
        }

        if (request.DailyUsuario.Trim().Length > 100)
        {
            return new DailyNovaResponse
            {
                Sucesso = false,
                Mensagem = "O usuário da daily não pode ter mais de 100 caracteres."
            };
        }

        using var connection = _connectionFactory.CreateConnection();

        const string sqlProximoNumero = """
            SELECT COALESCE(MAX(daily_numero), 0) + 1
            FROM daily;
            """;

        int proximoNumero = await connection.ExecuteScalarAsync<int>(sqlProximoNumero);

        const string sqlInsert = """
            INSERT INTO daily
            (
                daily_numero,
                daily_data,
                daily_usuario
            )
            VALUES
            (
                @DailyNumero,
                NOW(),
                @DailyUsuario
            );

            SELECT LAST_INSERT_ID();
            """;

        int dailyId = await connection.ExecuteScalarAsync<int>(
            sqlInsert,
            new
            {
                DailyNumero = proximoNumero,
                DailyUsuario = request.DailyUsuario.Trim()
            }
        );

        return new DailyNovaResponse
        {
            Sucesso = true,
            Mensagem = "Daily criada com sucesso.",
            DailyId = dailyId,
            DailyNumero = proximoNumero
        };
    }

    public async Task<DailyExcluirResponse> ExcluirAsync(int dailyId)
    {
        if (dailyId <= 0)
        {
            return new DailyExcluirResponse
            {
                Sucesso = false,
                Mensagem = "Código da daily inválido.",
                DailyId = dailyId
            };
        }

        using var connection = _connectionFactory.CreateConnection();

        const string sqlExisteDaily = """
            SELECT COUNT(*)
            FROM daily
            WHERE daily_id = @DailyId;
            """;

        int existeDaily = await connection.ExecuteScalarAsync<int>(
            sqlExisteDaily,
            new { DailyId = dailyId }
        );

        if (existeDaily == 0)
        {
            return new DailyExcluirResponse
            {
                Sucesso = false,
                Mensagem = "Daily não encontrada.",
                DailyId = dailyId
            };
        }

        const string sqlDelete = """
            DELETE FROM daily
            WHERE daily_id = @DailyId;
            """;

        int linhasAfetadas = await connection.ExecuteAsync(
            sqlDelete,
            new { DailyId = dailyId }
        );

        if (linhasAfetadas <= 0)
        {
            return new DailyExcluirResponse
            {
                Sucesso = false,
                Mensagem = "Nenhum registro foi excluído.",
                DailyId = dailyId
            };
        }

        return new DailyExcluirResponse
        {
            Sucesso = true,
            Mensagem = "Daily excluída com sucesso.",
            DailyId = dailyId
        };
    }
}

public sealed class DailyExcluirResponse
{
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public int DailyId { get; set; }
}