using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KSWeb.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/usuarios")]
public sealed class UsuariosController : ControllerBase
{
    private readonly UsuariosService _usuariosService;

    public UsuariosController(UsuariosService usuariosService)
    {
        _usuariosService = usuariosService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? termo)
    {
        return Ok(await _usuariosService.ListarAsync(termo));
    }
}