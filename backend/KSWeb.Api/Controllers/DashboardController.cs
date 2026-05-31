using System.Security.Claims;
using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KSWeb.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        int usuarioId = int.Parse(User.FindFirstValue("usr_codigo") ?? "0");

        long? userId = long.TryParse(User.FindFirstValue("USER_ID"), out long parsedUserId)
            ? parsedUserId
            : null;

        return Ok(await _dashboardService.ObterResumoAsync(usuarioId, userId));
    }
}
