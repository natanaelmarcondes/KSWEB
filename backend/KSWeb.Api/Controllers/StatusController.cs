using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSWeb.Api.Models;

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

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] StatusCreateRequest request)
    {
        var status = await _statusService.CriarAsync(request);
        return CreatedAtAction(nameof(Listar), new { id = status.StatusId }, status);
    }

    [HttpPut("{statusId:long}")]
    public async Task<IActionResult> Atualizar([FromRoute] long statusId, [FromBody] StatusUpdateRequest request)
    {
        await _statusService.AtualizarAsync(statusId, request);
        return NoContent();
    }

    [HttpDelete("{statusId:long}")]
    public async Task<IActionResult> Excluir([FromRoute] long statusId)
    {
        await _statusService.ExcluirAsync(statusId);
        return NoContent();
    }
}