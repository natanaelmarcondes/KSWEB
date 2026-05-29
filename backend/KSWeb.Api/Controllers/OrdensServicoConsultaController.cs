using KSWeb.Api.Models;
using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace KSWeb.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/ordens-servico-consulta")]
public sealed class OrdensServicoConsultaController : ControllerBase
{
    private readonly OrdensServicoConsultaService _ordensServicoConsultaService;

    public OrdensServicoConsultaController(OrdensServicoConsultaService ordensServicoConsultaService)
    {
        _ordensServicoConsultaService = ordensServicoConsultaService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] OrdensServicoConsultaFiltro filtro)
    {
        return Ok(await _ordensServicoConsultaService.ListarAsync(filtro));
    }

    [HttpPut("{id:long}/lida")]
    public async Task<IActionResult> MarcarComoLida([FromRoute] long id)
    {
        if (id <= 0)
            return BadRequest(new { mensagem = "Código da O.S inválido." });

        var ok = await _ordensServicoConsultaService.MarcarComoLidaAsync(id);

        if (!ok)
            return NotFound(new { mensagem = "Ordem de serviço não encontrada." });

        return NoContent();
    }

    [HttpGet("{id:long}/resolucoes")]
    public async Task<IActionResult> ListarResolucoes([FromRoute] long id)
    {
        if (id <= 0)
            return BadRequest(new { mensagem = "Código da O.S inválido." });

        var items = await _ordensServicoConsultaService.ListarResolucoesAsync(id);
        return Ok(items);
    }

    [HttpGet("/api/ordens-servico-consulta/{id:long}")]
    public async Task<IActionResult> ObterOrdemServicoHistorico([FromRoute] long id)
    {
        if (id <= 0)
            return BadRequest(new { mensagem = "Código da O.S inválido." });

        var os = await _ordensServicoConsultaService.ObterPorIdAsync(id);

        if (os == null)
            return NotFound(new { mensagem = "Ordem de serviço não encontrada." });

        return Ok(os);
    }

    [HttpGet("/api/ordens-servico-consulta/{id:long}/resolucao")]
    public async Task<IActionResult> ObterResolucaoHistorico([FromRoute] long id)
    {
        if (id <= 0)
            return BadRequest(new { mensagem = "Código da O.S inválido." });

        var resolucao = await _ordensServicoConsultaService.ObterUltimaResolucaoAsync(id);

        if (string.IsNullOrWhiteSpace(resolucao))
            return NotFound(new { mensagem = "Resolução não encontrada." });

        return Ok(new { resolucao });
    }

    [HttpPost("/api/ordens-servico-consulta/{id:long}/resolucao")]
    public async Task<IActionResult> SalvarResolucao(
        [FromRoute] long id,
        [FromBody] OrdemServicoSalvarResolucaoRequest request)
    {
        if (id <= 0)
            return BadRequest(new { mensagem = "Código da O.S inválido." });

        var userId = long.TryParse(User.FindFirstValue("USER_ID"), out var parsedUserId)
            ? parsedUserId
            : 0;

        var response = await _ordensServicoConsultaService.SalvarResolucaoAsync(id, userId, request);

        if (!response.Sucesso)
        {
            if (response.Mensagem.Equals("Ordem de serviço não encontrada.", StringComparison.OrdinalIgnoreCase))
                return NotFound(response);

            return BadRequest(response);
        }

        return Ok(response);
    }

    [HttpGet("/api/ordens-servico-consulta/{id:long}/historico")]
    public async Task<IActionResult> ListarHistorico([FromRoute] long id)
    {
        if (id <= 0)
            return BadRequest(new { mensagem = "Código da O.S inválido." });

        var items = await _ordensServicoConsultaService.ListarResolucoesAsync(id);
        return Ok(items);
    }
}