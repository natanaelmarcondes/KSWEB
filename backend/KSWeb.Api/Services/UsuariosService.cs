using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;

namespace KSWeb.Api.Services;

public sealed class UsuariosService
{
    private readonly DbConnectionFactory _connectionFactory;

    public UsuariosService(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<UsuarioListItem>> ListarAsync(string? termo)
    {
        using var connection = _connectionFactory.CreateConnection();

        string sql = """
            SELECT
                us.usr_codigo AS UsrCodigo,
                au.USER_ID AS UserId,
                COALESCE(NULLIF(us.usr_nome, ''), au.FIRST_NAME, '') AS UsrNome,
                COALESCE(us.usr_email, '') AS UsrEmail,
                COALESCE(us.usr_nivel, '') AS UsrNivel,
                COALESCE(qt.QUEUEID, us.QUEUEID) AS QueueId,
                COALESCE(q.QUEUENAME, qUs.QUEUENAME, '') AS Setor
            FROM aaauser au

            LEFT JOIN usuarios us
                   ON us.USER_ID = au.USER_ID

            LEFT JOIN sduser su
                   ON su.USERID = au.USER_ID

            LEFT JOIN helpdeskcrew hc
                   ON hc.TECHNICIANID = au.USER_ID

            LEFT JOIN queue_technician qt
                   ON qt.TECHNICIANID = hc.TECHNICIANID

            LEFT JOIN queuedefinition q
                   ON q.QUEUEID = qt.QUEUEID

            LEFT JOIN queuedefinition qUs
                   ON qUs.QUEUEID = us.QUEUEID

            WHERE 1 = 1
            """;

        object? parameters = null;

        if (!string.IsNullOrWhiteSpace(termo))
        {
            sql += """

                AND (
                    au.FIRST_NAME LIKE CONCAT('%', @termo, '%')
                    OR us.usr_nome LIKE CONCAT('%', @termo, '%')
                    OR us.usr_email LIKE CONCAT('%', @termo, '%')
                    OR q.QUEUENAME LIKE CONCAT('%', @termo, '%')
                    OR qUs.QUEUENAME LIKE CONCAT('%', @termo, '%')
                    OR au.USER_ID = @termoNumerico
                )
            """;

            long.TryParse(termo.Trim(), out long termoNumerico);

            parameters = new
            {
                termo = termo.Trim(),
                termoNumerico
            };
        }

        sql += """

            ORDER BY
                COALESCE(NULLIF(us.usr_nome, ''), au.FIRST_NAME, '');
            """;

        var usuarios = await connection.QueryAsync<UsuarioListItem>(sql, parameters);

        return usuarios.AsList();
    }
}