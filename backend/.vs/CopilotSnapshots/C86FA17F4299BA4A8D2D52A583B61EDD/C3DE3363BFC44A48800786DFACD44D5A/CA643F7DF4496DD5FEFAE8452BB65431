using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;

namespace KSWeb.Api.Services;

public sealed class SetoresService
{
    private readonly DbConnectionFactory _connectionFactory;

    public SetoresService(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<SetorResponse>> ListarAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var setores = await connection.QueryAsync<SetorResponse>(
            """
            SELECT
                QUEUEID AS QueueId,
                QUEUENAME AS QueueName
            FROM queuedefinition
            ORDER BY QUEUENAME;
            """);

        return setores.AsList();
    }
}