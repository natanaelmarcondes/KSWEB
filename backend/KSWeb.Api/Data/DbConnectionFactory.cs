using MySqlConnector;
using System.Data;

namespace KSWeb.Api.Data;

public class DbConnectionFactory
{
    private readonly IConfiguration _configuration;

    public DbConnectionFactory(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public IDbConnection CreateConnection()
    {
        string? connectionString = _configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new Exception("ConnectionString DefaultConnection não configurada.");
        }

        return new MySqlConnection(connectionString);
    }
}