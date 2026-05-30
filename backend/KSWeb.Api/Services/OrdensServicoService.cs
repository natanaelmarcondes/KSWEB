using System.Data;
using System.Text;
using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;

namespace KSWeb.Api.Services;

public sealed class OrdensServicoService
{
    private static readonly string[] StatusExcluidosPadrao =
    [
        "CLOSED",
        "RESOLVED",
        "DESCONTINUADO",
        "CAIU NO ESQUECIMENTO"
    ];

    private readonly DbConnectionFactory _connectionFactory;

    public OrdensServicoService(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<OrdemServicoListResponse> ListarAsync(OrdemServicoFiltro filtro, UsuarioContexto usuario)
    {
        using var connection = _connectionFactory.CreateConnection();

        long usrIdLogado = usuario.UserId.GetValueOrDefault();
        if (usrIdLogado <= 0 && usuario.UsuarioId > 0)
        {
            usrIdLogado = await connection.QuerySingleOrDefaultAsync<long>(
                """
                SELECT USER_ID
                FROM usuarios
                WHERE usr_codigo = @UsuarioId;
                """,
                new { usuario.UsuarioId });
        }

        string? usuarioLogadoNome = null;
        if (!filtro.TemFiltrosRelevantes && usrIdLogado > 0)
        {
            usuarioLogadoNome = await connection.QuerySingleOrDefaultAsync<string>(
                """
                SELECT FIRST_NAME
                FROM aaauser
                WHERE USER_ID = @usrIdLogado;
                """,
                new { usrIdLogado });
        }

        var parameters = new DynamicParameters();
        parameters.Add("PageSize", filtro.PageSize);
        parameters.Add("Offset", (filtro.Page - 1) * filtro.PageSize);
        parameters.Add("usrIdLogado", usrIdLogado);

        var joins = new StringBuilder(
            """
            FROM workorder os
            JOIN aaauser ua ON ua.USER_ID = os.CREATEDBYID
            JOIN aaauser ar ON ar.USER_ID = os.REQUESTERID
            LEFT JOIN workorderstates ws ON ws.WORKORDERID = os.WORKORDERID
            LEFT JOIN aaauser ao ON ao.USER_ID = ws.OWNERID
            LEFT JOIN statusdefinition st ON st.STATUSID = ws.STATUSID
            """);

        var where = new StringBuilder("WHERE 1 = 1");

        IReadOnlyList<long> filtroUsuarioIds = [];
        if (!string.IsNullOrWhiteSpace(filtro.FiltroUsuarioNome))
        {
            filtroUsuarioIds = (await connection.QueryAsync<long>(
                """
                SELECT USER_ID
                FROM aaauser
                WHERE FIRST_NAME LIKE CONCAT('%', @filtroUsuarioNome, '%')
                ORDER BY FIRST_NAME
                LIMIT 200;
                """,
                new { filtroUsuarioNome = filtro.FiltroUsuarioNome.Trim() })).AsList();

            if (filtroUsuarioIds.Count == 0)
            {
                return new OrdemServicoListResponse([], 0, filtro.Page, filtro.PageSize, usuarioLogadoNome);
            }

            parameters.Add("filtroUsuarioIds", filtroUsuarioIds);
        }

        if (filtro.Numero is > 0)
        {
            where.AppendLine();
            where.Append("AND os.WORKORDERID = @numero");
            parameters.Add("numero", filtro.Numero.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtro.Texto))
        {
            where.AppendLine();
            where.Append(
                """
                AND (
                    os.TITLE LIKE CONCAT('%', @texto, '%')
                    OR os.DESCRIPTION LIKE CONCAT('%', @texto, '%')
                )
                """);
            parameters.Add("texto", filtro.Texto.Trim());
        }

        if (filtro.StatusIds.Count > 0)
        {
            where.AppendLine();
            where.Append("AND ws.STATUSID IN @statusIds");
            parameters.Add("statusIds", filtro.StatusIds);
        }
        else if ((filtro.Numero is null or <= 0) && !filtro.ListarTudo)
        {
            where.AppendLine();
            where.Append(
                """
                AND (
                    st.STATUSNAME IS NULL
                    OR UPPER(TRIM(st.STATUSNAME)) NOT IN @statusExcluidosPadrao
                )
                """);
            parameters.Add("statusExcluidosPadrao", StatusExcluidosPadrao);
        }

        if (filtroUsuarioIds.Count > 0)
        {
            switch (filtro.FiltroPessoa)
            {
                case "cliente":
                    where.AppendLine();
                    where.Append("AND os.REQUESTERID IN @filtroUsuarioIds");
                    break;
                case "responsavel":
                    where.AppendLine();
                    where.Append("AND ws.OWNERID IN @filtroUsuarioIds");
                    break;
                case "criado":
                    joins.AppendLine();
                    joins.Append(
                        """
                        JOIN workorderhistory wc
                            ON wc.WORKORDERID = os.WORKORDERID
                           AND wc.OPERATION = 'CREATE'
                        """);
                    where.AppendLine();
                    where.Append("AND wc.OPERATIONOWNERID IN @filtroUsuarioIds");
                    break;
                default:
                    where.AppendLine();
                    where.Append(
                        """
                        AND (
                            os.CREATEDBYID IN @filtroUsuarioIds
                            OR os.REQUESTERID IN @filtroUsuarioIds
                            OR ws.OWNERID IN @filtroUsuarioIds
                        )
                        """);
                    break;
            }
        }

        if (usuario.IsAdmin && filtro.UsuarioId is > 0)
        {
            where.AppendLine();
            where.Append(
                """
                AND (
                    os.CREATEDBYID = @usuarioId
                    OR os.REQUESTERID = @usuarioId
                    OR ws.OWNERID = @usuarioId
                )
                """);
            parameters.Add("usuarioId", filtro.UsuarioId.Value);
        }
        else if (!usuario.IsAdmin && !filtro.ListarTudo && filtroUsuarioIds.Count == 0 && usrIdLogado > 0)
        {
            where.AppendLine();
            where.Append(
                """
                AND (
                    os.CREATEDBYID = @usrIdLogado
                    OR os.REQUESTERID = @usrIdLogado
                    OR ws.OWNERID = @usrIdLogado
                )
                """);
        }

        string selectSql =
            $$"""
            SELECT
                os.WORKORDERID AS OsCodigo,
                os.CREATEDTIME AS OsData,
                os.TITLE AS OsTitulo,
                ar.FIRST_NAME AS Cliente,
                ua.FIRST_NAME AS UsuarioAbertura,
                st.STATUSNAME AS Status,
                ws.ISREAD AS IsRead,
                COALESCE(ao.FIRST_NAME, ar.FIRST_NAME) AS UsuarioResponsavel
            {{joins}}
            {{where}}
            ORDER BY os.WORKORDERID DESC
            LIMIT @PageSize OFFSET @Offset;
            """;

        string countSql =
            $$"""
            SELECT COUNT(DISTINCT os.WORKORDERID)
            {{joins}}
            {{where}};
            """;

        var items = await connection.QueryAsync<OrdemServicoListItem>(selectSql, parameters);
        int total = await connection.QuerySingleAsync<int>(countSql, parameters);

        return new OrdemServicoListResponse(items.AsList(), total, filtro.Page, filtro.PageSize, usuarioLogadoNome);
    }

    public async Task<OrdemServicoFiltrosResponse> ObterFiltrosAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var status = await connection.QueryAsync<OrdemServicoStatusOption>(
            """
            SELECT STATUSID AS StatusId, STATUSNAME AS StatusName
            FROM statusdefinition
            WHERE ISDELETED = 0
            ORDER BY STATUSNAME;
            """);

        var usuarios = await connection.QueryAsync<OrdemServicoUsuarioOption>(
            """
            SELECT USER_ID AS UserId, FIRST_NAME AS FirstName
            FROM aaauser
            ORDER BY FIRST_NAME;
            """);

        return new OrdemServicoFiltrosResponse(status.AsList(), usuarios.AsList());
    }

    public async Task<OrdemServicoCombosResponse> ObterCombosFormAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var clientes = await connection.QueryAsync<OrdemServicoUsuarioOption>(
            """
            SELECT USER_ID AS UserId, FIRST_NAME AS FirstName
            FROM aaauser
            ORDER BY FIRST_NAME;
            """);

        var status = await connection.QueryAsync<OrdemServicoStatusOption>(
            """
            SELECT STATUSID AS StatusId, STATUSNAME AS StatusName
            FROM statusdefinition
            WHERE ISDELETED = 0
            ORDER BY STATUSNAME;
            """);

        var grupos = await ListarGruposAtribuicaoAsync();

        return new OrdemServicoCombosResponse(clientes.AsList(), status.AsList(), grupos);
    }

    public async Task<IReadOnlyList<OrdemServicoGrupoOption>> ListarGruposAtribuicaoAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var grupos = await connection.QueryAsync<OrdemServicoGrupoOption>(
            """
            SELECT DISTINCT qd.QUEUEID AS GrpId, qd.QUEUENAME AS GrpNome
            FROM queue_technician qt
            JOIN queuedefinition qd ON qt.QUEUEID = qd.QUEUEID
            ORDER BY qd.QUEUENAME;
            """);

        return grupos.AsList();
    }

    public async Task<IReadOnlyList<OrdemServicoUsuarioGrupoOption>> ListarUsuariosPorGrupoAsync(long queueId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var usuarios = await connection.QueryAsync<OrdemServicoUsuarioGrupoOption>(
            """
            SELECT au.USER_ID AS UsrCodigo, au.FIRST_NAME AS UsrNome
            FROM queue_technician qt
            JOIN aaauser au ON qt.TECHNICIANID = au.USER_ID
            WHERE qt.QUEUEID = @queueId
            ORDER BY au.FIRST_NAME;
            """,
            new { queueId });

        return usuarios.AsList();
    }

    public async Task<OrdemServicoFormResponse?> ObterFormAsync(long id, bool view, UsuarioContexto usuario)
    {
        using var connection = _connectionFactory.CreateConnection();
        long usrIdLogado = await ResolverUserIdLogadoAsync(connection, usuario);

        var ordem = await connection.QuerySingleOrDefaultAsync<OrdemServicoFormRow>(
            """
            SELECT
                w.WORKORDERID AS WorkorderId,
                w.REQUESTERID AS RequesterId,
                w.CREATEDBYID AS CreatedById,
                w.CREATEDTIME AS CreatedTime,
                w.TITLE AS Title,
                w.DESCRIPTION AS Description,
                d.FULLDESCRIPTION AS FullDescription,
                ws.OWNERID AS OwnerId,
                ws.STATUSID AS StatusId,
                st.STATUSNAME AS StatusName
            FROM workorder w
            LEFT JOIN workordertodescription d ON d.WORKORDERID = w.WORKORDERID
            LEFT JOIN workorderstates ws ON ws.WORKORDERID = w.WORKORDERID
            LEFT JOIN statusdefinition st ON st.STATUSID = ws.STATUSID
            WHERE w.WORKORDERID = @id;
            """,
            new { id });

        if (ordem is null)
        {
            return null;
        }

        string? requesterName = await ObterNomeUsuarioAsync(connection, ordem.RequesterId);
        string? createdByName = await ObterNomeUsuarioAsync(connection, ordem.CreatedById);
        string? ownerName = await ObterNomeUsuarioAsync(connection, ordem.OwnerId);
        long? queueId = await ObterQueueAtualAsync(connection, ordem.OwnerId);
        string? queueName = queueId is null ? null : await ObterQueueNomeAsync(connection, queueId.Value);

        var historico = await connection.QueryAsync<OrdemServicoHistoricoItem>(
            """
            SELECT
                HISTORYID AS HistoryId,
                WORKORDERID AS WorkorderId,
                OPERATIONOWNERID AS OperationOwnerId,
                OPERATIONTIME AS OperationTime,
                DESCRIPTION AS Description,
                OPERATION AS Operation
            FROM workorderhistory
            WHERE WORKORDERID = @id
            ORDER BY OPERATIONTIME DESC;
            """,
            new { id });

        var resolucoes = await connection.QueryAsync<OrdemServicoResolucaoItem>(
            """
            SELECT
                d.HISTORYDIFFID AS HistoryDiffId,
                d.HISTORYID AS HistoryId,
                d.COLUMNNAME AS ColumnName,
                d.PREV_VALUE AS PrevValue,
                d.CURRENT_VALUE AS CurrentValue,
                h.OPERATIONTIME AS OperationTime
            FROM workorderhistory h
            JOIN workorderhistorydiff d ON d.HISTORYID = h.HISTORYID
            WHERE h.WORKORDERID = @id
              AND d.COLUMNNAME = 'RESOLUTION'
            ORDER BY h.OPERATIONTIME DESC, d.HISTORYDIFFID DESC;
            """,
            new { id });

        string? lastResolution = await connection.QueryFirstOrDefaultAsync<string>(
            """
            SELECT d.CURRENT_VALUE
            FROM workorderhistory h
            JOIN workorderhistorydiff d ON d.HISTORYID = h.HISTORYID
            WHERE h.WORKORDERID = @id
              AND d.COLUMNNAME = 'RESOLUTION'
            ORDER BY h.OPERATIONTIME DESC
            LIMIT 1;
            """,
            new { id });

        if (view && usrIdLogado > 0)
        {
            await MarcarVisualizadaAsync(connection, id, usrIdLogado);
        }

        return new OrdemServicoFormResponse(
            ordem.WorkorderId,
            ordem.RequesterId,
            requesterName,
            ordem.CreatedById,
            createdByName,
            ordem.CreatedTime,
            ordem.Title,
            ordem.Description,
            ordem.FullDescription,
            ordem.OwnerId,
            ownerName,
            ordem.StatusId,
            ordem.StatusName,
            queueId,
            queueName,
            lastResolution,
            historico.AsList(),
            resolucoes.AsList());
    }

    public async Task<long> CriarAsync(SalvarOrdemServicoRequest request, UsuarioContexto usuario)
    {
        using var connection = _connectionFactory.CreateConnection();
        AbrirConexao(connection);
        using var transaction = connection.BeginTransaction();

        try
        {
            long usrIdLogado = await ResolverUserIdLogadoAsync(connection, usuario, transaction);
            long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            long nextId = await NextIdAsync(connection, transaction, "workorder", "WORKORDERID");
            long historyId = await NextIdAsync(connection, transaction, "workorderhistory", "HISTORYID");
            long diffId = await NextIdAsync(connection, transaction, "workorderhistorydiff", "HISTORYDIFFID");

            await connection.ExecuteAsync(
                """
                INSERT INTO workorder (
                    WORKORDERID, REQUESTERID, CREATEDBYID, CREATEDTIME,
                    RESPONDEDTIME, DUEBYTIME, COMPLETEDTIME, TIMESPENTONREQ,
                    TITLE, DESCRIPTION, ISPARENT, FR_DUETIME,
                    IS_CATALOG_TEMPLATE, HASCHANGE, HASPROBLEM,
                    SURVEYSTATUS, HASDRAFT, HASCAUSEDBYCHANGE
                )
                VALUES (
                    @nextId, @requesterid, @usrIdLogado, @nowMs,
                    0, 0, 0, 0,
                    @title, @plainDescription, 1, 0,
                    0, 0, 0,
                    0, 0, 0
                );
                """,
                new
                {
                    nextId,
                    requesterid = request.RequesterId,
                    usrIdLogado,
                    nowMs,
                    title = request.Title.Trim(),
                    plainDescription = request.Description
                },
                transaction);

            await connection.ExecuteAsync(
                """
                INSERT INTO workordertodescription (WORKORDERID, FULLDESCRIPTION)
                VALUES (@nextId, @fullDescription);
                """,
                new { nextId, fullDescription = request.FullDescription },
                transaction);

            await connection.ExecuteAsync(
                """
                INSERT INTO workorderstates (WORKORDERID, OWNERID, STATUSID)
                VALUES (@nextId, @ownerid, @statusid);
                """,
                new { nextId, ownerid = request.OwnerId, statusid = request.StatusId },
                transaction);

            await InserirHistoricoAsync(connection, transaction, historyId, nextId, usrIdLogado, nowMs, "Criou a O.S.", "CREATE");
            await InserirDiffAsync(connection, transaction, diffId++, historyId, "FULLDESCRIPTION", null, request.FullDescription);
            await InserirDiffAsync(connection, transaction, diffId++, historyId, "OWNERID", null, request.OwnerId?.ToString());
            await InserirDiffAsync(connection, transaction, diffId++, historyId, "STATUSID", null, request.StatusId?.ToString());
            await InserirDiffAsync(connection, transaction, diffId++, historyId, "ASSIGNEDTIME", null, nowMs.ToString());
            await InserirDiffAsync(connection, transaction, diffId++, historyId, "LASTUPDATEDTIME", null, nowMs.ToString());
            await InserirDiffAsync(connection, transaction, diffId, historyId, "TECHNICIANID", null, usrIdLogado.ToString());

            transaction.Commit();
            return nextId;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> AtualizarAsync(long id, SalvarOrdemServicoRequest request, UsuarioContexto usuario)
    {
        using var connection = _connectionFactory.CreateConnection();
        AbrirConexao(connection);
        using var transaction = connection.BeginTransaction();

        try
        {
            var atual = await connection.QuerySingleOrDefaultAsync<OrdemServicoFormRow>(
                """
                SELECT
                    w.WORKORDERID AS WorkorderId,
                    w.REQUESTERID AS RequesterId,
                    w.CREATEDBYID AS CreatedById,
                    w.CREATEDTIME AS CreatedTime,
                    w.TITLE AS Title,
                    w.DESCRIPTION AS Description,
                    d.FULLDESCRIPTION AS FullDescription,
                    ws.OWNERID AS OwnerId,
                    ws.STATUSID AS StatusId,
                    st.STATUSNAME AS StatusName
                FROM workorder w
                LEFT JOIN workordertodescription d ON d.WORKORDERID = w.WORKORDERID
                LEFT JOIN workorderstates ws ON ws.WORKORDERID = w.WORKORDERID
                LEFT JOIN statusdefinition st ON st.STATUSID = ws.STATUSID
                WHERE w.WORKORDERID = @id;
                """,
                new { id },
                transaction);

            if (atual is null)
            {
                return false;
            }

            long usrIdLogado = await ResolverUserIdLogadoAsync(connection, usuario, transaction);
            long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            await connection.ExecuteAsync(
                """
                UPDATE workorder
                SET REQUESTERID = @requesterid,
                    TITLE = @title,
                    DESCRIPTION = @plainDescription
                WHERE WORKORDERID = @workorderid;
                """,
                new
                {
                    requesterid = request.RequesterId,
                    title = request.Title.Trim(),
                    plainDescription = request.Description,
                    workorderid = id
                },
                transaction);

            int statesAffected = await connection.ExecuteAsync(
                """
                UPDATE workorderstates
                SET OWNERID = @ownerid,
                    STATUSID = @statusid
                WHERE WORKORDERID = @workorderid;
                """,
                new { ownerid = request.OwnerId, statusid = request.StatusId, workorderid = id },
                transaction);

            if (statesAffected == 0)
            {
                await connection.ExecuteAsync(
                    """
                    INSERT INTO workorderstates (WORKORDERID, OWNERID, STATUSID)
                    VALUES (@workorderid, @ownerid, @statusid);
                    """,
                    new { workorderid = id, ownerid = request.OwnerId, statusid = request.StatusId },
                    transaction);
            }

            int descAffected = await connection.ExecuteAsync(
                """
                UPDATE workordertodescription
                SET FULLDESCRIPTION = @fullDescription
                WHERE WORKORDERID = @workorderid;
                """,
                new { fullDescription = request.FullDescription, workorderid = id },
                transaction);

            if (descAffected == 0)
            {
                await connection.ExecuteAsync(
                    """
                    INSERT INTO workordertodescription (WORKORDERID, FULLDESCRIPTION)
                    VALUES (@workorderid, @fullDescription);
                    """,
                    new { workorderid = id, fullDescription = request.FullDescription },
                    transaction);
            }

            var diffs = new List<(string Column, string? Prev, string? Current)>();
            AddDiffIfChanged(diffs, "FULLDESCRIPTION", atual.FullDescription, request.FullDescription);
            AddDiffIfChanged(diffs, "OWNERID", atual.OwnerId?.ToString(), request.OwnerId?.ToString());
            AddDiffIfChanged(diffs, "STATUSID", atual.StatusId?.ToString(), request.StatusId?.ToString());

            if (diffs.Count > 0)
            {
                long historyId = await NextIdAsync(connection, transaction, "workorderhistory", "HISTORYID");
                long diffId = await NextIdAsync(connection, transaction, "workorderhistorydiff", "HISTORYDIFFID");
                await InserirHistoricoAsync(connection, transaction, historyId, id, usrIdLogado, nowMs, "Atualizou a O.S.", "UPDATE");

                foreach (var diff in diffs)
                {
                    await InserirDiffAsync(connection, transaction, diffId++, historyId, diff.Column, diff.Prev, diff.Current);
                }

                await InserirDiffAsync(connection, transaction, diffId++, historyId, "ASSIGNEDTIME", null, nowMs.ToString());
                await InserirDiffAsync(connection, transaction, diffId++, historyId, "LASTUPDATEDTIME", null, nowMs.ToString());
                await InserirDiffAsync(connection, transaction, diffId, historyId, "TECHNICIANID", null, usrIdLogado.ToString());
            }

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> SalvarResolucaoAsync(long id, SalvarResolucaoRequest request, UsuarioContexto usuario)
    {
        using var connection = _connectionFactory.CreateConnection();
        AbrirConexao(connection);
        using var transaction = connection.BeginTransaction();

        try
        {
            int exists = await connection.QuerySingleAsync<int>(
                "SELECT COUNT(1) FROM workorder WHERE WORKORDERID = @id;",
                new { id },
                transaction);

            if (exists == 0)
            {
                return false;
            }

            long usrIdLogado = await ResolverUserIdLogadoAsync(connection, usuario, transaction);
            long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            long historyId = await NextIdAsync(connection, transaction, "workorderhistory", "HISTORYID");
            long diffId = await NextIdAsync(connection, transaction, "workorderhistorydiff", "HISTORYDIFFID");
            string? prev = await ObterUltimaResolucaoAsync(connection, transaction, id);

            await InserirHistoricoAsync(connection, transaction, historyId, id, usrIdLogado, nowMs, "Salvou a resolução.", "UPDATE");
            await InserirDiffAsync(connection, transaction, diffId, historyId, "RESOLUTION", prev, request.Html);

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> AlterarStatusAtribuirAsync(long id, AlterarStatusAtribuirRequest request, UsuarioContexto usuario)
    {
        using var connection = _connectionFactory.CreateConnection();
        AbrirConexao(connection);
        using var transaction = connection.BeginTransaction();

        try
        {
            var atual = await connection.QuerySingleOrDefaultAsync<OrdemServicoFormRow>(
                """
                SELECT
                    w.WORKORDERID AS WorkorderId,
                    ws.OWNERID AS OwnerId,
                    ws.STATUSID AS StatusId
                FROM workorder w
                LEFT JOIN workorderstates ws ON ws.WORKORDERID = w.WORKORDERID
                WHERE w.WORKORDERID = @id;
                """,
                new { id },
                transaction);

            if (atual is null)
            {
                return false;
            }

            long? ownerId = request.OwnerId ?? atual.OwnerId;
            long? statusId = request.StatusId ?? atual.StatusId;

            int affected = await connection.ExecuteAsync(
                """
                UPDATE workorderstates
                SET OWNERID = @ownerId,
                    STATUSID = @statusId
                WHERE WORKORDERID = @id;
                """,
                new { ownerId, statusId, id },
                transaction);

            if (affected == 0)
            {
                await connection.ExecuteAsync(
                    """
                    INSERT INTO workorderstates (WORKORDERID, OWNERID, STATUSID)
                    VALUES (@id, @ownerId, @statusId);
                    """,
                    new { id, ownerId, statusId },
                    transaction);
            }

            long usrIdLogado = await ResolverUserIdLogadoAsync(connection, usuario, transaction);
            long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            long historyId = await NextIdAsync(connection, transaction, "workorderhistory", "HISTORYID");
            long diffId = await NextIdAsync(connection, transaction, "workorderhistorydiff", "HISTORYDIFFID");

            await InserirHistoricoAsync(connection, transaction, historyId, id, usrIdLogado, nowMs, "Alterou status/atribuição.", "UPDATE");
            var diffs = new List<(string Column, string? Prev, string? Current)>();
            AddDiffIfChanged(diffs, "OWNERID", atual.OwnerId?.ToString(), ownerId?.ToString());
            AddDiffIfChanged(diffs, "STATUSID", atual.StatusId?.ToString(), statusId?.ToString());

            foreach (var diff in diffs)
            {
                await InserirDiffAsync(connection, transaction, diffId++, historyId, diff.Column, diff.Prev, diff.Current);
            }

            await InserirDiffAsync(connection, transaction, diffId++, historyId, "ASSIGNEDTIME", null, nowMs.ToString());
            await InserirDiffAsync(connection, transaction, diffId++, historyId, "LASTUPDATEDTIME", null, nowMs.ToString());
            await InserirDiffAsync(connection, transaction, diffId, historyId, "TECHNICIANID", null, usrIdLogado.ToString());

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    private async Task MarcarVisualizadaAsync(IDbConnection connection, long workOrderId, long userId)
    {
        await connection.ExecuteAsync(
            """
            UPDATE workorderstates
            SET ISREAD = 1
            WHERE WORKORDERID = @workOrderId;
            """,
            new { workOrderId });

        string? title = await connection.QueryFirstOrDefaultAsync<string>(
            """
            SELECT TITLE
            FROM workorder
            WHERE WORKORDERID = @workOrderId;
            """,
            new { workOrderId });

        if (string.IsNullOrWhiteSpace(title))
        {
            return;
        }

        long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string url = $"/ordens-servico/{workOrderId}";

        long? itemId = await connection.QueryFirstOrDefaultAsync<long?>(
            """
            SELECT ITEMID
            FROM recentitems
            WHERE DETAILID = @workOrderId
              AND USERID = @userId
              AND MODULENAME = 'Request';
            """,
            new { workOrderId, userId });

        if (itemId is not null)
        {
            await connection.ExecuteAsync(
                """
                UPDATE recentitems
                SET DATE = @nowMs,
                    DISPLAYSTR = @title,
                    URL = @url
                WHERE ITEMID = @itemId;
                """,
                new { nowMs, title, url, itemId });

            return;
        }

        long nextItemId = await connection.QuerySingleAsync<long>("SELECT COALESCE(MAX(ITEMID), 0) + 1 FROM recentitems;");
        await connection.ExecuteAsync(
            """
            INSERT INTO recentitems (
                ITEMID,
                URL,
                DISPLAYSTR,
                USERID,
                DATE,
                MODULENAME,
                DETAILID,
                IMAGE
            )
            VALUES (
                @nextItemId,
                @url,
                @title,
                @userId,
                @nowMs,
                'Request',
                @workOrderId,
                NULL
            );
            """,
            new { nextItemId, url, title, userId, nowMs, workOrderId });
    }

    private static async Task InserirHistoricoAsync(IDbConnection connection, IDbTransaction transaction, long historyId, long workorderId, long ownerId, long operationTime, string description, string operation)
    {
        await connection.ExecuteAsync(
            """
            INSERT INTO workorderhistory (
                HISTORYID,
                WORKORDERID,
                OPERATIONOWNERID,
                OPERATIONTIME,
                DESCRIPTION,
                OPERATION
            )
            VALUES (
                @historyId,
                @workorderId,
                @ownerId,
                @operationTime,
                @description,
                @operation
            );
            """,
            new { historyId, workorderId, ownerId, operationTime, description, operation },
            transaction);
    }

    private static async Task InserirDiffAsync(IDbConnection connection, IDbTransaction transaction, long diffId, long historyId, string columnName, string? prevValue, string? currentValue)
    {
        await connection.ExecuteAsync(
            """
            INSERT INTO workorderhistorydiff (
                HISTORYDIFFID,
                HISTORYID,
                COLUMNNAME,
                PREV_VALUE,
                CURRENT_VALUE
            )
            VALUES (
                @diffId,
                @historyId,
                @columnName,
                @prevValue,
                @currentValue
            );
            """,
            new { diffId, historyId, columnName, prevValue, currentValue },
            transaction);
    }

    private static async Task<long> NextIdAsync(IDbConnection connection, IDbTransaction transaction, string table, string column)
    {
        return await connection.QuerySingleAsync<long>($"SELECT COALESCE(MAX({column}), 0) + 1 FROM {table};", transaction: transaction);
    }

    private static async Task<string?> ObterNomeUsuarioAsync(IDbConnection connection, long? userId)
    {
        if (userId is null or <= 0)
        {
            return null;
        }

        return await connection.QueryFirstOrDefaultAsync<string>(
            "SELECT FIRST_NAME FROM aaauser WHERE USER_ID = @userId;",
            new { userId });
    }

    private static async Task<long?> ObterQueueAtualAsync(IDbConnection connection, long? respUserId)
    {
        if (respUserId is null or <= 0)
        {
            return null;
        }

        return await connection.QueryFirstOrDefaultAsync<long?>(
            """
            SELECT qt.QUEUEID
            FROM queue_technician qt
            WHERE qt.TECHNICIANID = @respUserId
            ORDER BY qt.QUEUEID
            LIMIT 1;
            """,
            new { respUserId });
    }

    private static async Task<string?> ObterQueueNomeAsync(IDbConnection connection, long queueId)
    {
        return await connection.QueryFirstOrDefaultAsync<string>(
            "SELECT QUEUENAME FROM queuedefinition WHERE QUEUEID = @queueId;",
            new { queueId });
    }

    private static async Task<string?> ObterUltimaResolucaoAsync(IDbConnection connection, IDbTransaction transaction, long id)
    {
        return await connection.QueryFirstOrDefaultAsync<string>(
            """
            SELECT d.CURRENT_VALUE
            FROM workorderhistory h
            JOIN workorderhistorydiff d ON d.HISTORYID = h.HISTORYID
            WHERE h.WORKORDERID = @id
              AND d.COLUMNNAME = 'RESOLUTION'
            ORDER BY h.OPERATIONTIME DESC
            LIMIT 1;
            """,
            new { id },
            transaction);
    }

    private static async Task<long> ResolverUserIdLogadoAsync(IDbConnection connection, UsuarioContexto usuario, IDbTransaction? transaction = null)
    {
        long usrIdLogado = usuario.UserId.GetValueOrDefault();
        if (usrIdLogado <= 0 && usuario.UsuarioId > 0)
        {
            usrIdLogado = await connection.QuerySingleOrDefaultAsync<long>(
                """
                SELECT USER_ID
                FROM usuarios
                WHERE usr_codigo = @UsuarioId;
                """,
                new { usuario.UsuarioId },
                transaction);
        }

        return usrIdLogado;
    }

    private static void AddDiffIfChanged(List<(string Column, string? Prev, string? Current)> diffs, string column, string? prev, string? current)
    {
        if (!string.Equals(prev ?? string.Empty, current ?? string.Empty, StringComparison.Ordinal))
        {
            diffs.Add((column, prev, current));
        }
    }

    private static void AbrirConexao(IDbConnection connection)
    {
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
        }
    }

    private sealed class OrdemServicoFormRow
    {
        public long WorkorderId { get; init; }
        public long? RequesterId { get; init; }
        public long? CreatedById { get; init; }
        public long? CreatedTime { get; init; }
        public string Title { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public string FullDescription { get; init; } = string.Empty;
        public long? OwnerId { get; init; }
        public long? StatusId { get; init; }
        public string? StatusName { get; init; }
    }
}

public sealed record OrdemServicoFiltro(
    int Page,
    int PageSize,
    long? Numero,
    string? Texto,
    IReadOnlyList<long> StatusIds,
    string? FiltroUsuarioNome,
    string FiltroPessoa,
    bool ListarTudo,
    long? UsuarioId)
{
    public bool TemFiltrosRelevantes =>
        Numero is > 0 ||
        !string.IsNullOrWhiteSpace(Texto) ||
        StatusIds.Count > 0 ||
        !string.IsNullOrWhiteSpace(FiltroUsuarioNome) ||
        ListarTudo ||
        UsuarioId is > 0;
}

public sealed record UsuarioContexto(
    int UsuarioId,
    long? UserId,
    bool IsAdmin);
