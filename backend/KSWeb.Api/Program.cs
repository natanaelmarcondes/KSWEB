using KSWeb.Api.Data;
using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Informe o JWT retornado pelo login."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Serviços
builder.Services.AddScoped<DbConnectionFactory>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<OrdensServicoConsultaService>();
builder.Services.AddScoped<OrdensServicoService>();
builder.Services.AddScoped<SetoresService>();
builder.Services.AddScoped<UsuariosService>();
builder.Services.AddScoped<StatusService>();
builder.Services.AddScoped<DailyService>();
builder.Services.AddScoped<DailyRegistrosService>();

// JWT
IConfigurationSection jwtSection = builder.Configuration.GetSection("Jwt");

string jwtKey = jwtSection["Key"]
    ?? throw new InvalidOperationException("Jwt:Key nao configurado.");

string jwtIssuer = jwtSection["Issuer"] ?? "KSWeb.Api";
string jwtAudience = jwtSection["Audience"] ?? "KSWeb.App";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            ),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("KSWebCors", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "https://localhost:4200",
                "http://192.168.1.48:1515"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

WebApplication app = builder.Build();

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

// Arquivos estáticos da própria API
app.UseStaticFiles();

// Inline Images
string? inlineImagesPhysicalRoot =
    builder.Configuration["InlineImages:PhysicalRootPath"];

if (!string.IsNullOrWhiteSpace(inlineImagesPhysicalRoot))
{
    Directory.CreateDirectory(inlineImagesPhysicalRoot);

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
            inlineImagesPhysicalRoot
        ),
        RequestPath = "/inlineimages"
    });
}

// CORS deve vir antes da autenticação/autorização
app.UseCors("KSWebCors");

// Autenticação
app.UseAuthentication();

// Autorização
app.UseAuthorization();

// Controllers
app.MapControllers();

app.Run();