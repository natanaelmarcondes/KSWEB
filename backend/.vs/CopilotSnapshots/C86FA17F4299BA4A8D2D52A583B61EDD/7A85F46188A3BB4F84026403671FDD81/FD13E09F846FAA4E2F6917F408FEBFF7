using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;

namespace KSWeb.Api.Services;

public sealed class StatusService
{
    private readonly DbConnectionFactory _connectionFactory;

    public StatusService(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<StatusListItem>> ListarAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var status = await connection.QueryAsync<StatusListItem>(
            """
            SELECT
                STATUSID AS StatusId,
                STATUSNAME AS StatusName,
                ISPENDING AS IsPending,
                STATUSSTOPCLOCK AS StatusStopClock,
                COALESCE(STATUSDESCRIPTION, '') AS StatusDescription,
                COALESCE(ISDELETED, 0) AS IsDeleted,
                INTERNALNAME AS InternalName
            FROM statusdefinition
            WHERE COALESCE(ISDELETED, 0) = 0
            ORDER BY STATUSNAME;
            """);

        return status.AsList();
    }
}