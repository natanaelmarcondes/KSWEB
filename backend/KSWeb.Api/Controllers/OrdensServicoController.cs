using KSWeb.Api.Models;
using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace KSWeb.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/ordens-servico")]
public sealed class OrdensServicoController : ControllerBase
{
    private readonly OrdensServicoService _ordensServicoService;

    public OrdensServicoController(OrdensServicoService ordensServicoService)
    {
        _ordensServicoService = ordensServicoService;
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] SalvarOrdemServicoRequest request)
    {
        var userId = long.TryParse(User.FindFirstValue("USER_ID"), out var parsedUserId)
            ? parsedUserId
            : 0;

        var response = await _ordensServicoService.SalvarAsync(null, request, userId);

        if (!response.Sucesso)
            return BadRequest(response);

        return CreatedAtAction(nameof(Criar), new { id = response.WorkOrderId }, response);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Atualizar([FromRoute] long id, [FromBody] SalvarOrdemServicoRequest request)
    {
        if (id <= 0)
            return BadRequest(new { mensagem = "Código da O.S inválido." });

        var userId = long.TryParse(User.FindFirstValue("USER_ID"), out var parsedUserId)
            ? parsedUserId
            : 0;

        var response = await _ordensServicoService.SalvarAsync(id, request, userId);

        if (!response.Sucesso)
        {
            if (response.Mensagem.Equals("O.S não encontrada.", StringComparison.OrdinalIgnoreCase))
                return NotFound(response);

            return BadRequest(response);
        }

        return Ok(response);
    }
}
