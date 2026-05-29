using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KSWeb.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/setores")]
public sealed class SetoresController : ControllerBase
{
    private readonly SetoresService _setoresService;

    public SetoresController(SetoresService setoresService)
    {
        _setoresService = setoresService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        return Ok(await _setoresService.ListarAsync());
    }
}