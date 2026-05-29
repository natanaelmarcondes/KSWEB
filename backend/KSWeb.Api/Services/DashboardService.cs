using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;

namespace KSWeb.Api.Services;

public sealed class DashboardService
{
    private readonly DbConnectionFactory _connectionFactory;

    public DashboardService(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<DashboardResumo> ObterResumoAsync(int usuarioId, long? userIdClaim)
    {
        using var connection = _connectionFactory.CreateConnection();

        long usrIdLogado = userIdClaim.GetValueOrDefault();

        if (usrIdLogado <= 0)
        {
            usrIdLogado = await connection.QuerySingleOrDefaultAsync<long>(
                """
                SELECT USER_ID
                FROM usuarios
                WHERE usr_codigo = @UsuarioId;
                """,
                new { UsuarioId = usuarioId });
        }

        int totalOS = await connection.QuerySingleAsync<int>(
            """
            SELECT COUNT(DISTINCT os.WORKORDERID) AS Total
            FROM workorderstates ws
            JOIN workorder os ON os.WORKORDERID = ws.WORKORDERID
            WHERE ws.OWNERID = @usrIdLogado;
            """,
            new { usrIdLogado });

        int totalAbertas = await connection.QuerySingleAsync<int>(
            """
            SELECT COUNT(DISTINCT os.WORKORDERID) AS Total
            FROM workorderstates ws
            JOIN workorder os ON os.WORKORDERID = ws.WORKORDERID
            WHERE ws.OWNERID = @usrIdLogado
              AND os.COMPLETEDTIME = 0;
            """,
            new { usrIdLogado });

        int totalComResolucao = await connection.QuerySingleAsync<int>(
            """
            SELECT COUNT(DISTINCT h.WORKORDERID) AS Total
            FROM workorderhistory h
            JOIN workorderhistorydiff d ON d.HISTORYID = h.HISTORYID
            JOIN workorderstates ws ON ws.WORKORDERID = h.WORKORDERID
            WHERE d.COLUMNNAME = 'RESOLUTION'
              AND ws.OWNERID = @usrIdLogado;
            """,
            new { usrIdLogado });

        var status = await connection.QueryAsync<DashboardStatusItem>(
            """
            SELECT
                COALESCE(st.STATUSID, 0) AS StatusId,
                COALESCE(st.STATUSNAME, 'SEM STATUS') AS Status,
                COUNT(os.WORKORDERID) AS Total
            FROM workorderstates ws
            JOIN workorder os ON os.WORKORDERID = ws.WORKORDERID
            LEFT JOIN statusdefinition st ON st.STATUSID = ws.STATUSID
            WHERE ws.OWNERID = @usrIdLogado
            GROUP BY
                COALESCE(st.STATUSID, 0),
                COALESCE(st.STATUSNAME, 'SEM STATUS')
            ORDER BY Total DESC;
            """,
            new { usrIdLogado });

        int totalSemResolucao = Math.Max(0, totalOS - totalComResolucao);

        return new DashboardResumo(
            totalOS,
            totalAbertas,
            totalComResolucao,
            totalSemResolucao,
            status.AsList());
    }
}
