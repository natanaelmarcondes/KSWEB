using Dapper;
using KSWeb.Api.Data;
using KSWeb.Api.Models;
using System.Data;

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

    public async Task<StatusListItem> CriarAsync(StatusCreateRequest request)
    {
        using var connection = _connectionFactory.CreateConnection();

        string statusName = (request.StatusName ?? string.Empty).Trim();
        string internalName = (request.InternalName ?? string.Empty).Trim();
        string? statusDescription = string.IsNullOrWhiteSpace(request.StatusDescription) ? null : request.StatusDescription.Trim();

        if (string.IsNullOrWhiteSpace(statusName))
        {
            throw new ArgumentException("StatusName é obrigatório.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(internalName))
        {
            throw new ArgumentException("InternalName é obrigatório.", nameof(request));
        }

        connection.Open();
        using IDbTransaction transaction = connection.BeginTransaction();

        try
        {
            long nextStatusId = await connection.ExecuteScalarAsync<long>(
                """
                SELECT COALESCE(MAX(STATUSID), 0) + 1
                FROM statusdefinition
                FOR UPDATE;
                """,
                transaction: transaction);

            await connection.ExecuteAsync(
                """
                INSERT INTO statusdefinition
                    (STATUSID, STATUSNAME, ISPENDING, STATUSSTOPCLOCK, STATUSDESCRIPTION, ISDELETED, INTERNALNAME)
                VALUES
                    (@nextStatusId, @statusName, @isPending, @statusStopClock, @statusDescription, 0, @internalName);
                """,
                new
                {
                    nextStatusId,
                    statusName,
                    isPending = request.IsPending,
                    statusStopClock = request.StatusStopClock,
                    statusDescription,
                    internalName
                },
                transaction: transaction);

            transaction.Commit();

            return new StatusListItem
            {
                StatusId = nextStatusId,
                StatusName = statusName,
                IsPending = request.IsPending,
                StatusStopClock = request.StatusStopClock,
                StatusDescription = statusDescription ?? string.Empty,
                IsDeleted = false,
                InternalName = internalName
            };
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task AtualizarAsync(long statusId, StatusUpdateRequest request)
    {
        using var connection = _connectionFactory.CreateConnection();

        string statusName = (request.StatusName ?? string.Empty).Trim();
        string internalName = (request.InternalName ?? string.Empty).Trim();
        string? statusDescription = string.IsNullOrWhiteSpace(request.StatusDescription) ? null : request.StatusDescription.Trim();

        if (string.IsNullOrWhiteSpace(statusName))
        {
            throw new ArgumentException("StatusName é obrigatório.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(internalName))
        {
            throw new ArgumentException("InternalName é obrigatório.", nameof(request));
        }

        int rows = await connection.ExecuteAsync(
            """
            UPDATE statusdefinition
            SET
                STATUSNAME = @statusName,
                ISPENDING = @isPending,
                STATUSSTOPCLOCK = @statusStopClock,
                STATUSDESCRIPTION = @statusDescription,
                INTERNALNAME = @internalName
            WHERE STATUSID = @statusId
              AND COALESCE(ISDELETED, 0) = 0;
            """,
            new
            {
                statusId,
                statusName,
                isPending = request.IsPending,
                statusStopClock = request.StatusStopClock,
                statusDescription,
                internalName
            });

        if (rows == 0)
        {
            throw new KeyNotFoundException($"Status não encontrado. StatusId={statusId}");
        }
    }

    public async Task ExcluirAsync(long statusId)
    {
        using var connection = _connectionFactory.CreateConnection();

        int rows = await connection.ExecuteAsync(
            """
            UPDATE statusdefinition
            SET ISDELETED = 1
            WHERE STATUSID = @statusId
              AND COALESCE(ISDELETED, 0) = 0;
            """,
            new { statusId });

        if (rows == 0)
        {
            throw new KeyNotFoundException($"Status não encontrado. StatusId={statusId}");
        }
    }
}