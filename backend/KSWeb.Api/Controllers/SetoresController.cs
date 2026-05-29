using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSWeb.Api.Models;

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

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] SetorCreateRequest request)
    {
        var setor = await _setoresService.CriarAsync(request.QueueName);
        return CreatedAtAction(nameof(Listar), new { id = setor.QueueId }, setor);
    }

    [HttpPut("{queueId:long}")]
    public async Task<IActionResult> Atualizar([FromRoute] long queueId, [FromBody] SetorUpdateRequest request)
    {
        await _setoresService.AtualizarAsync(queueId, request.QueueName);
        return NoContent();
    }

    [HttpDelete("{queueId:long}")]
    public async Task<IActionResult> Excluir([FromRoute] long queueId)
    {
        await _setoresService.ExcluirAsync(queueId);
        return NoContent();
    }
}