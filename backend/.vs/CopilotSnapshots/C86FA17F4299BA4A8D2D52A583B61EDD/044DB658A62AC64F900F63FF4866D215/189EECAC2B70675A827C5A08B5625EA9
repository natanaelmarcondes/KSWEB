using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KSWeb.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/status")]
public sealed class StatusController : ControllerBase
{
    private readonly StatusService _statusService;

    public StatusController(StatusService statusService)
    {
        _statusService = statusService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        return Ok(await _statusService.ListarAsync());
    }
}