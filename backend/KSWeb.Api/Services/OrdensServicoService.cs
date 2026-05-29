using KSWeb.Api.Models;
using MySqlConnector;
using System.Data;

namespace KSWeb.Api.Services;

public sealed class OrdensServicoService
{
    private readonly IConfiguration _configuration;

    public OrdensServicoService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<SalvarOrdemServicoResponse> SalvarAsync(long? id, SalvarOrdemServicoRequest request, long userId)
    {
        if (userId <= 0)
        {
            return new SalvarOrdemServicoResponse
            {
                Sucesso = false,
                Mensagem = "Usuário autenticado inválido.",
                WorkOrderId = id.GetValueOrDefault()
            };
        }

        if (request == null)
        {
            return new SalvarOrdemServicoResponse
            {
                Sucesso = false,
                Mensagem = "Request inválido.",
                WorkOrderId = id.GetValueOrDefault()
            };
        }

        if (request.RequesterId <= 0)
        {
            return new SalvarOrdemServicoResponse
            {
                Sucesso = false,
                Mensagem = "Solicitante inválido.",
                WorkOrderId = id.GetValueOrDefault()
            };
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return new SalvarOrdemServicoResponse
            {
                Sucesso = false,
                Mensagem = "Título é obrigatório.",
                WorkOrderId = id.GetValueOrDefault()
            };
        }

        var connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionString 'DefaultConnection' não encontrada no appsettings.json.");

        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        var nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        if (id.HasValue && id.Value > 0)
        {
            var exists = await WorkOrderExistsAsync(connection, transaction, id.Value);

            if (!exists)
            {
                await transaction.RollbackAsync();

                return new SalvarOrdemServicoResponse
                {
                    Sucesso = false,
                    Mensagem = "O.S não encontrada.",
                    WorkOrderId = id.Value
                };
            }

            var updated = await AtualizarAsync(connection, transaction, id.Value, request, userId, nowMs);

            if (!updated)
            {
                await transaction.RollbackAsync();

                return new SalvarOrdemServicoResponse
                {
                    Sucesso = false,
                    Mensagem = "Não foi possível atualizar a O.S.",
                    WorkOrderId = id.Value
                };
            }

            await transaction.CommitAsync();

            return new SalvarOrdemServicoResponse
            {
                Sucesso = true,
                Mensagem = "O.S atualizada com sucesso.",
                WorkOrderId = id.Value,
                Criada = false
            };
        }

        var newId = await ObterProximoWorkOrderIdAsync(connection, transaction);
        await InserirNovaAsync(connection, transaction, newId, request, userId, nowMs);

        await transaction.CommitAsync();

        return new SalvarOrdemServicoResponse
        {
            Sucesso = true,
            Mensagem = "O.S criada com sucesso.",
            WorkOrderId = newId,
            Criada = true
        };
    }

    private static async Task<bool> WorkOrderExistsAsync(MySqlConnection connection, MySqlTransaction transaction, long id)
    {
        const string sql = """
        SELECT COUNT(1)
        FROM workorder
        WHERE WORKORDERID = @id;
        """;

        await using var command = new MySqlCommand(sql, connection, transaction);
        command.Parameters.Add(new MySqlParameter("@id", id));

        var result = await command.ExecuteScalarAsync();
        return result != null && result != DBNull.Value && Convert.ToInt64(result) > 0;
    }

    private static async Task<long> ObterProximoWorkOrderIdAsync(MySqlConnection connection, MySqlTransaction transaction)
    {
        const string sql = """
        SELECT COALESCE(MAX(WORKORDERID), 0) + 1
        FROM workorder;
        """;

        await using var command = new MySqlCommand(sql, connection, transaction);
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt64(result);
    }

    private static async Task<long> ObterProximoHistoryIdAsync(MySqlConnection connection, MySqlTransaction transaction)
    {
        const string sql = """
        SELECT COALESCE(MAX(HISTORYID), 0) + 1
        FROM workorderhistory;
        """;

        await using var command = new MySqlCommand(sql, connection, transaction);
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt64(result);
    }

    private static async Task<long> ObterProximoHistoryDiffIdAsync(MySqlConnection connection, MySqlTransaction transaction)
    {
        const string sql = """
        SELECT COALESCE(MAX(HISTORYDIFFID), 0) + 1
        FROM workorderhistorydiff;
        """;

        await using var command = new MySqlCommand(sql, connection, transaction);
        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt64(result);
    }

    private static async Task InserirNovaAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        long nextId,
        SalvarOrdemServicoRequest request,
        long userId,
        long nowMs)
    {
        const string insertWorkorderSql = """
        INSERT INTO workorder
        (
            WORKORDERID,
            REQUESTERID,
            CREATEDBYID,
            CREATEDTIME,
            RESPONDEDTIME,
            DUEBYTIME,
            COMPLETEDTIME,
            TIMESPENTONREQ,
            TITLE,
            DESCRIPTION,
            ISPARENT,
            FR_DUETIME,
            IS_CATALOG_TEMPLATE,
            HASCHANGE,
            HASPROBLEM,
            SURVEYSTATUS,
            HASDRAFT,
            HASCAUSEDBYCHANGE
        )
        VALUES
        (
            @nextId,
            @requesterId,
            @userId,
            @nowMs,
            0,
            0,
            0,
            0,
            @title,
            @plainDescription,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        );
        """;

        await using (var cmd = new MySqlCommand(insertWorkorderSql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@nextId", nextId));
            cmd.Parameters.Add(new MySqlParameter("@requesterId", request.RequesterId));
            cmd.Parameters.Add(new MySqlParameter("@userId", userId));
            cmd.Parameters.Add(new MySqlParameter("@nowMs", nowMs));
            cmd.Parameters.Add(new MySqlParameter("@title", request.Title.Trim()));
            cmd.Parameters.Add(new MySqlParameter("@plainDescription", request.Description?.Trim() ?? string.Empty));
            await cmd.ExecuteNonQueryAsync();
        }

        const string insertDescriptionSql = """
        INSERT INTO workordertodescription
        (
            WORKORDERID,
            FULLDESCRIPTION
        )
        VALUES
        (
            @nextId,
            @fullDescription
        );
        """;

        await using (var cmd = new MySqlCommand(insertDescriptionSql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@nextId", nextId));
            cmd.Parameters.Add(new MySqlParameter("@fullDescription", request.FullDescription ?? string.Empty));
            await cmd.ExecuteNonQueryAsync();
        }

        const string insertStatesSql = """
        INSERT INTO workorderstates
        (
            WORKORDERID,
            OWNERID,
            STATUSID
        )
        VALUES
        (
            @nextId,
            @ownerId,
            @statusId
        );
        """;

        await using (var cmd = new MySqlCommand(insertStatesSql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@nextId", nextId));
            cmd.Parameters.Add(new MySqlParameter("@ownerId", request.OwnerId ?? (object)DBNull.Value));
            cmd.Parameters.Add(new MySqlParameter("@statusId", request.StatusId ?? (object)DBNull.Value));
            await cmd.ExecuteNonQueryAsync();
        }

        var createHistoryId = await ObterProximoHistoryIdAsync(connection, transaction);

        const string insertHistorySql = """
        INSERT INTO workorderhistory
        (
            HISTORYID,
            WORKORDERID,
            OPERATIONOWNERID,
            OPERATIONTIME,
            DESCRIPTION,
            OPERATION
        )
        VALUES
        (
            @historyId,
            @workOrderId,
            @userId,
            @nowMs,
            'Criou a O.S.',
            'CREATE'
        );
        """;

        await using (var cmd = new MySqlCommand(insertHistorySql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@historyId", createHistoryId));
            cmd.Parameters.Add(new MySqlParameter("@workOrderId", nextId));
            cmd.Parameters.Add(new MySqlParameter("@userId", userId));
            cmd.Parameters.Add(new MySqlParameter("@nowMs", nowMs));
            await cmd.ExecuteNonQueryAsync();
        }

        await InsertCreateDiffsAsync(connection, transaction, createHistoryId, request, userId, nowMs);
    }

    private static async Task InsertCreateDiffsAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        long historyId,
        SalvarOrdemServicoRequest request,
        long userId,
        long nowMs)
    {
        var nextDiffId = await ObterProximoHistoryDiffIdAsync(connection, transaction);

        const string sql = """
        INSERT INTO workorderhistorydiff
        (
          HISTORYDIFFID,
          HISTORYID,
          COLUMNNAME,
          PREV_VALUE,
          CURRENT_VALUE
        )
        VALUES
          (@diffId1, @historyId, 'FULLDESCRIPTION', NULL, @fullDescription),
          (@diffId2, @historyId, 'OWNERID',        NULL, @ownerId),
          (@diffId3, @historyId, 'STATUSID',       NULL, @statusId),
          (@diffId4, @historyId, 'ASSIGNEDTIME',   NULL, @assignedTime),
          (@diffId5, @historyId, 'LASTUPDATEDTIME',NULL, @lastUpdatedTime),
          (@diffId6, @historyId, 'TECHNICIANID',   NULL, @technicianId);
        """;

        await using var cmd = new MySqlCommand(sql, connection, transaction);
        cmd.Parameters.Add(new MySqlParameter("@diffId1", nextDiffId));
        cmd.Parameters.Add(new MySqlParameter("@diffId2", nextDiffId + 1));
        cmd.Parameters.Add(new MySqlParameter("@diffId3", nextDiffId + 2));
        cmd.Parameters.Add(new MySqlParameter("@diffId4", nextDiffId + 3));
        cmd.Parameters.Add(new MySqlParameter("@diffId5", nextDiffId + 4));
        cmd.Parameters.Add(new MySqlParameter("@diffId6", nextDiffId + 5));
        cmd.Parameters.Add(new MySqlParameter("@historyId", historyId));

        cmd.Parameters.Add(new MySqlParameter("@fullDescription", request.FullDescription ?? string.Empty));
        cmd.Parameters.Add(new MySqlParameter("@ownerId", request.OwnerId.HasValue ? request.OwnerId.Value.ToString() : (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@statusId", request.StatusId.HasValue ? request.StatusId.Value.ToString() : (object)DBNull.Value));
        cmd.Parameters.Add(new MySqlParameter("@assignedTime", nowMs.ToString()));
        cmd.Parameters.Add(new MySqlParameter("@lastUpdatedTime", nowMs.ToString()));
        cmd.Parameters.Add(new MySqlParameter("@technicianId", userId.ToString()));

        await cmd.ExecuteNonQueryAsync();
    }

    private static async Task<bool> AtualizarAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        long workOrderId,
        SalvarOrdemServicoRequest request,
        long userId,
        long nowMs)
    {
        var before = await CarregarEstadoAtualAsync(connection, transaction, workOrderId);

        const string updateWorkorderSql = """
        UPDATE workorder
        SET
            REQUESTERID = @requesterId,
            TITLE = @title,
            DESCRIPTION = @description
        WHERE WORKORDERID = @id;
        """;

        await using (var cmd = new MySqlCommand(updateWorkorderSql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@requesterId", request.RequesterId));
            cmd.Parameters.Add(new MySqlParameter("@title", request.Title.Trim()));
            cmd.Parameters.Add(new MySqlParameter("@description", request.Description?.Trim() ?? string.Empty));
            cmd.Parameters.Add(new MySqlParameter("@id", workOrderId));
            await cmd.ExecuteNonQueryAsync();
        }

        await UpsertWorkorderToDescriptionAsync(connection, transaction, workOrderId, request.FullDescription ?? string.Empty);
        await UpsertWorkorderStatesAsync(connection, transaction, workOrderId, request.OwnerId, request.StatusId);

        var fullDescriptionMudou = !string.Equals(before.FullDescription ?? string.Empty, request.FullDescription ?? string.Empty, StringComparison.Ordinal);
        var ownerMudou = before.OwnerId != request.OwnerId;
        var statusMudou = before.StatusId != request.StatusId;

        if (!fullDescriptionMudou && !ownerMudou && !statusMudou)
            return true;

        var historyId = await ObterProximoHistoryIdAsync(connection, transaction);

        const string insertHistorySql = """
        INSERT INTO workorderhistory
        (
            HISTORYID,
            WORKORDERID,
            OPERATIONOWNERID,
            OPERATIONTIME,
            DESCRIPTION,
            OPERATION
        )
        VALUES
        (
            @historyId,
            @workOrderId,
            @userId,
            @nowMs,
            'Atualizou a O.S.',
            'UPDATE'
        );
        """;

        await using (var cmd = new MySqlCommand(insertHistorySql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@historyId", historyId));
            cmd.Parameters.Add(new MySqlParameter("@workOrderId", workOrderId));
            cmd.Parameters.Add(new MySqlParameter("@userId", userId));
            cmd.Parameters.Add(new MySqlParameter("@nowMs", nowMs));
            await cmd.ExecuteNonQueryAsync();
        }

        await InsertUpdateDiffsAsync(connection, transaction, historyId, before, request, userId, nowMs, fullDescriptionMudou, ownerMudou, statusMudou);
        return true;
    }

    private static async Task UpsertWorkorderToDescriptionAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        long workOrderId,
        string fullDescription)
    {
        const string existsSql = """
        SELECT COUNT(1)
        FROM workordertodescription
        WHERE WORKORDERID = @id;
        """;

        long count;
        await using (var cmd = new MySqlCommand(existsSql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@id", workOrderId));
            var result = await cmd.ExecuteScalarAsync();
            count = result == null || result == DBNull.Value ? 0 : Convert.ToInt64(result);
        }

        if (count > 0)
        {
            const string updateSql = """
            UPDATE workordertodescription
            SET FULLDESCRIPTION = @fullDescription
            WHERE WORKORDERID = @id;
            """;

            await using var cmd = new MySqlCommand(updateSql, connection, transaction);
            cmd.Parameters.Add(new MySqlParameter("@fullDescription", fullDescription));
            cmd.Parameters.Add(new MySqlParameter("@id", workOrderId));
            await cmd.ExecuteNonQueryAsync();
            return;
        }

        const string insertSql = """
        INSERT INTO workordertodescription
        (
          WORKORDERID,
          FULLDESCRIPTION
        )
        VALUES
        (
          @id,
          @fullDescription
        );
        """;

        await using (var cmd = new MySqlCommand(insertSql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@id", workOrderId));
            cmd.Parameters.Add(new MySqlParameter("@fullDescription", fullDescription));
            await cmd.ExecuteNonQueryAsync();
        }
    }

    private static async Task UpsertWorkorderStatesAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        long workOrderId,
        long? ownerId,
        long? statusId)
    {
        const string existsSql = """
        SELECT COUNT(1)
        FROM workorderstates
        WHERE WORKORDERID = @id;
        """;

        long count;
        await using (var cmd = new MySqlCommand(existsSql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@id", workOrderId));
            var result = await cmd.ExecuteScalarAsync();
            count = result == null || result == DBNull.Value ? 0 : Convert.ToInt64(result);
        }

        if (count > 0)
        {
            const string updateSql = """
            UPDATE workorderstates
            SET OWNERID = @ownerId,
                STATUSID = @statusId
            WHERE WORKORDERID = @id;
            """;

            await using var cmd = new MySqlCommand(updateSql, connection, transaction);
            cmd.Parameters.Add(new MySqlParameter("@ownerId", ownerId ?? (object)DBNull.Value));
            cmd.Parameters.Add(new MySqlParameter("@statusId", statusId ?? (object)DBNull.Value));
            cmd.Parameters.Add(new MySqlParameter("@id", workOrderId));
            await cmd.ExecuteNonQueryAsync();
            return;
        }

        const string insertSql = """
        INSERT INTO workorderstates
        (
          WORKORDERID,
          OWNERID,
          STATUSID
        )
        VALUES
        (
          @id,
          @ownerId,
          @statusId
        );
        """;

        await using (var cmd = new MySqlCommand(insertSql, connection, transaction))
        {
            cmd.Parameters.Add(new MySqlParameter("@id", workOrderId));
            cmd.Parameters.Add(new MySqlParameter("@ownerId", ownerId ?? (object)DBNull.Value));
            cmd.Parameters.Add(new MySqlParameter("@statusId", statusId ?? (object)DBNull.Value));
            await cmd.ExecuteNonQueryAsync();
        }
    }

    private sealed class EstadoAtual
    {
        public string? FullDescription { get; init; }
        public long? OwnerId { get; init; }
        public long? StatusId { get; init; }
    }

    private static async Task<EstadoAtual> CarregarEstadoAtualAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        long workOrderId)
    {
        const string sql = """
        SELECT
            d.FULLDESCRIPTION AS fulldescription,
            ws.OWNERID AS ownerid,
            ws.STATUSID AS statusid
        FROM workorder w
        LEFT JOIN workordertodescription d ON d.WORKORDERID = w.WORKORDERID
        LEFT JOIN workorderstates ws ON ws.WORKORDERID = w.WORKORDERID
        WHERE w.WORKORDERID = @id
        LIMIT 1;
        """;

        await using var cmd = new MySqlCommand(sql, connection, transaction);
        cmd.Parameters.Add(new MySqlParameter("@id", workOrderId));

        await using var reader = await cmd.ExecuteReaderAsync(CommandBehavior.SingleRow);

        if (!await reader.ReadAsync())
            return new EstadoAtual();

        return new EstadoAtual
        {
            FullDescription = reader.IsDBNull(reader.GetOrdinal("fulldescription")) ? null : Convert.ToString(reader["fulldescription"]),
            OwnerId = reader.IsDBNull(reader.GetOrdinal("ownerid")) ? null : Convert.ToInt64(reader["ownerid"]),
            StatusId = reader.IsDBNull(reader.GetOrdinal("statusid")) ? null : Convert.ToInt64(reader["statusid"]),
        };
    }

    private static async Task InsertUpdateDiffsAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        long historyId,
        EstadoAtual before,
        SalvarOrdemServicoRequest request,
        long userId,
        long nowMs,
        bool fullDescriptionMudou,
        bool ownerMudou,
        bool statusMudou)
    {
        var nextDiffId = await ObterProximoHistoryDiffIdAsync(connection, transaction);

        var diffs = new List<(long id, string col, string? prev, string? curr)>();

        if (fullDescriptionMudou)
        {
            diffs.Add((nextDiffId + diffs.Count, "FULLDESCRIPTION", before.FullDescription, request.FullDescription ?? string.Empty));
        }

        if (ownerMudou)
        {
            diffs.Add((nextDiffId + diffs.Count, "OWNERID", before.OwnerId?.ToString(), request.OwnerId?.ToString()));
        }

        if (statusMudou)
        {
            diffs.Add((nextDiffId + diffs.Count, "STATUSID", before.StatusId?.ToString(), request.StatusId?.ToString()));
        }

        // Sempre registra o last updated quando houve qualquer mudança relevante
        diffs.Add((nextDiffId + diffs.Count, "LASTUPDATEDTIME", null, nowMs.ToString()));

        // Se mudou o responsável, registra atribuicao e tecnico
        if (ownerMudou)
        {
            diffs.Add((nextDiffId + diffs.Count, "ASSIGNEDTIME", null, nowMs.ToString()));
            diffs.Add((nextDiffId + diffs.Count, "TECHNICIANID", null, userId.ToString()));
        }

        const string insertSql = """
        INSERT INTO workorderhistorydiff
        (
            HISTORYDIFFID,
            HISTORYID,
            COLUMNNAME,
            PREV_VALUE,
            CURRENT_VALUE
        )
        VALUES
            (@diffId, @historyId, @columnName, @prevValue, @currentValue);
        """;

        foreach (var diff in diffs)
        {
            await using var cmd = new MySqlCommand(insertSql, connection, transaction);
            cmd.Parameters.Add(new MySqlParameter("@diffId", diff.id));
            cmd.Parameters.Add(new MySqlParameter("@historyId", historyId));
            cmd.Parameters.Add(new MySqlParameter("@columnName", diff.col));
            cmd.Parameters.Add(new MySqlParameter("@prevValue", (object?)diff.prev ?? DBNull.Value));
            cmd.Parameters.Add(new MySqlParameter("@currentValue", (object?)diff.curr ?? DBNull.Value));
            await cmd.ExecuteNonQueryAsync();
        }
    }
}
