using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;

namespace KSWeb.Api.Services;

public sealed class DailyRegistrosService
{
    private readonly DbConnectionFactory _connectionFactory;

    public DailyRegistrosService(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<DailyRegistrosResponse> ListarPorDailyAsync(int dailyId)
    {
        using var connection = _connectionFactory.CreateConnection();

        const string sql = """
            SELECT
                reg_id AS RegId,
                daily_id AS DailyId,
                reg_data AS RegData,
                os_id AS OsId,
                reg_cliente AS RegCliente,
                reg_descricao AS RegDescricao,
                reg_status AS RegStatus
            FROM dailyregistros
            WHERE daily_id = @DailyId
            ORDER BY reg_data, reg_id;
            """;

        var registros = await connection.QueryAsync<DailyRegistroItem>(
            sql,
            new { DailyId = dailyId }
        );

        List<DailyRegistroItem> items = registros.AsList();

        return new DailyRegistrosResponse
        {
            DailyId = dailyId,
            Total = items.Count,
            Items = items
        };
    }

    public async Task<DailyRegistroItem?> ObterRegistroAsync(int dailyId, int regId)
    {
        using var connection = _connectionFactory.CreateConnection();

        const string sql = """
            SELECT
                reg_id AS RegId,
                daily_id AS DailyId,
                reg_data AS RegData,
                os_id AS OsId,
                reg_cliente AS RegCliente,
                reg_descricao AS RegDescricao,
                reg_status AS RegStatus
            FROM dailyregistros
            WHERE daily_id = @DailyId
              AND reg_id = @RegId;
            """;

        return await connection.QueryFirstOrDefaultAsync<DailyRegistroItem>(
            sql,
            new
            {
                DailyId = dailyId,
                RegId = regId
            }
        );
    }

    public async Task<DailyRegistroSalvarResponse> InserirAsync(
        int dailyId,
        DailyRegistroSalvarRequest request)
    {
        if (dailyId <= 0)
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = "Código da daily inválido.",
                DailyId = dailyId
            };
        }

        string validacao = ValidarRequest(request);

        if (!string.IsNullOrWhiteSpace(validacao))
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = validacao,
                DailyId = dailyId
            };
        }

        using var connection = _connectionFactory.CreateConnection();

        bool dailyExiste = await DailyExisteAsync(connection, dailyId);

        if (!dailyExiste)
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = "Daily não encontrada.",
                DailyId = dailyId
            };
        }

        const string sqlInsert = """
            INSERT INTO dailyregistros
            (
                daily_id,
                reg_data,
                os_id,
                reg_cliente,
                reg_descricao,
                reg_status
            )
            VALUES
            (
                @DailyId,
                @RegData,
                @OsId,
                @RegCliente,
                @RegDescricao,
                @RegStatus
            );

            SELECT LAST_INSERT_ID();
            """;

        int regId = await connection.ExecuteScalarAsync<int>(
            sqlInsert,
            new
            {
                DailyId = dailyId,
                RegData = request.RegData?.Date ?? DateTime.Today,
                request.OsId,
                RegCliente = TratarString(request.RegCliente, 120),
                RegDescricao = TratarString(request.RegDescricao, null),
                RegStatus = TratarString(request.RegStatus, 50)
            }
        );

        return new DailyRegistroSalvarResponse
        {
            Sucesso = true,
            Mensagem = "Registro da daily cadastrado com sucesso.",
            DailyId = dailyId,
            RegId = regId
        };
    }

    public async Task<DailyRegistroSalvarResponse> AtualizarAsync(
        int dailyId,
        int regId,
        DailyRegistroSalvarRequest request)
    {
        if (dailyId <= 0)
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = "Código da daily inválido.",
                DailyId = dailyId,
                RegId = regId
            };
        }

        if (regId <= 0)
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = "Código do registro inválido.",
                DailyId = dailyId,
                RegId = regId
            };
        }

        string validacao = ValidarRequest(request);

        if (!string.IsNullOrWhiteSpace(validacao))
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = validacao,
                DailyId = dailyId,
                RegId = regId
            };
        }

        using var connection = _connectionFactory.CreateConnection();

        bool dailyExiste = await DailyExisteAsync(connection, dailyId);

        if (!dailyExiste)
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = "Daily não encontrada.",
                DailyId = dailyId,
                RegId = regId
            };
        }

        const string sqlExisteRegistro = """
            SELECT COUNT(*)
            FROM dailyregistros
            WHERE daily_id = @DailyId
              AND reg_id = @RegId;
            """;

        int existeRegistro = await connection.ExecuteScalarAsync<int>(
            sqlExisteRegistro,
            new
            {
                DailyId = dailyId,
                RegId = regId
            }
        );

        if (existeRegistro == 0)
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = "Registro da daily não encontrado.",
                DailyId = dailyId,
                RegId = regId
            };
        }

        const string sqlUpdate = """
            UPDATE dailyregistros
            SET
                reg_data = @RegData,
                os_id = @OsId,
                reg_cliente = @RegCliente,
                reg_descricao = @RegDescricao,
                reg_status = @RegStatus
            WHERE daily_id = @DailyId
              AND reg_id = @RegId;
            """;

        int linhasAfetadas = await connection.ExecuteAsync(
            sqlUpdate,
            new
            {
                DailyId = dailyId,
                RegId = regId,
                RegData = request.RegData?.Date ?? DateTime.Today,
                request.OsId,
                RegCliente = TratarString(request.RegCliente, 120),
                RegDescricao = TratarString(request.RegDescricao, null),
                RegStatus = TratarString(request.RegStatus, 50)
            }
        );

        if (linhasAfetadas <= 0)
        {
            return new DailyRegistroSalvarResponse
            {
                Sucesso = false,
                Mensagem = "Nenhum registro foi atualizado.",
                DailyId = dailyId,
                RegId = regId
            };
        }

        return new DailyRegistroSalvarResponse
        {
            Sucesso = true,
            Mensagem = "Registro da daily atualizado com sucesso.",
            DailyId = dailyId,
            RegId = regId
        };
    }

    public async Task<DailyRegistroExcluirResponse> ExcluirAsync(int dailyId, int regId)
    {
        if (dailyId <= 0)
        {
            return new DailyRegistroExcluirResponse
            {
                Sucesso = false,
                Mensagem = "Código da daily inválido.",
                DailyId = dailyId,
                RegId = regId
            };
        }

        if (regId <= 0)
        {
            return new DailyRegistroExcluirResponse
            {
                Sucesso = false,
                Mensagem = "Código do registro inválido.",
                DailyId = dailyId,
                RegId = regId
            };
        }

        using var connection = _connectionFactory.CreateConnection();

        const string sqlDelete = """
            DELETE FROM dailyregistros
            WHERE daily_id = @DailyId
              AND reg_id = @RegId;
            """;

        int linhasAfetadas = await connection.ExecuteAsync(
            sqlDelete,
            new
            {
                DailyId = dailyId,
                RegId = regId
            }
        );

        if (linhasAfetadas <= 0)
        {
            return new DailyRegistroExcluirResponse
            {
                Sucesso = false,
                Mensagem = "Registro da daily não encontrado.",
                DailyId = dailyId,
                RegId = regId
            };
        }

        return new DailyRegistroExcluirResponse
        {
            Sucesso = true,
            Mensagem = "Registro da daily excluído com sucesso.",
            DailyId = dailyId,
            RegId = regId
        };
    }

    private static async Task<bool> DailyExisteAsync(
        System.Data.IDbConnection connection,
        int dailyId)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM daily
            WHERE daily_id = @DailyId;
            """;

        int total = await connection.ExecuteScalarAsync<int>(
            sql,
            new { DailyId = dailyId }
        );

        return total > 0;
    }

    private static string ValidarRequest(DailyRegistroSalvarRequest request)
    {
        if (request == null)
            return "Dados do registro da daily não foram enviados.";

        if (request.OsId.HasValue && request.OsId.Value <= 0)
            return "Número da O.S. inválido.";

        if (!string.IsNullOrWhiteSpace(request.RegCliente) &&
            request.RegCliente.Trim().Length > 120)
            return "O cliente não pode ter mais de 120 caracteres.";

        if (!string.IsNullOrWhiteSpace(request.RegStatus) &&
            request.RegStatus.Trim().Length > 50)
            return "O status não pode ter mais de 50 caracteres.";

        return string.Empty;
    }

    private static string? TratarString(string? valor, int? tamanhoMaximo)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;

        string tratado = valor.Trim();

        if (tamanhoMaximo.HasValue && tratado.Length > tamanhoMaximo.Value)
            return tratado[..tamanhoMaximo.Value];

        return tratado;
    }
}