using KSWeb.Api.Models;
using KSWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KSWeb.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/daily")]
public sealed class DailyController : ControllerBase
{
    private readonly DailyService _dailyService;
    private readonly DailyRegistrosService _dailyRegistrosService;

    public DailyController(
        DailyService dailyService,
        DailyRegistrosService dailyRegistrosService)
    {
        _dailyService = dailyService ?? throw new ArgumentNullException(nameof(dailyService));
        _dailyRegistrosService = dailyRegistrosService ?? throw new ArgumentNullException(nameof(dailyRegistrosService));
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] DailyFiltro filtro)
    {
        DailyResponse response = await _dailyService.ListarAsync(filtro);
        return Ok(response);
    }

    [HttpGet("{dailyId:int}")]
    public async Task<IActionResult> ObterPorId([FromRoute] int dailyId)
    {
        if (dailyId <= 0)
            return BadRequest(new { mensagem = "Código da daily inválido." });

        DailyItem? daily = await _dailyService.ObterPorIdAsync(dailyId);

        if (daily == null)
            return NotFound(new { mensagem = "Daily não encontrada." });

        return Ok(daily);
    }

    [HttpPost("nova")]
    public async Task<IActionResult> CriarNova([FromBody] DailyNovaRequest request)
    {
        DailyNovaResponse response = await _dailyService.CriarNovaAsync(request);

        if (!response.Sucesso)
            return BadRequest(response);

        return Ok(response);
    }

    [HttpDelete("{dailyId:int}")]
    public async Task<IActionResult> Excluir([FromRoute] int dailyId)
    {
        DailyExcluirResponse response = await _dailyService.ExcluirAsync(dailyId);

        if (!response.Sucesso)
        {
            if (response.Mensagem.Equals("Daily não encontrada.", StringComparison.OrdinalIgnoreCase))
                return NotFound(response);

            return BadRequest(response);
        }

        return Ok(response);
    }

    [HttpGet("{dailyId:int}/registros")]
    public async Task<IActionResult> ListarRegistros([FromRoute] int dailyId)
    {
        if (dailyId <= 0)
            return BadRequest(new { mensagem = "Código da daily inválido." });

        DailyRegistrosResponse response =
            await _dailyRegistrosService.ListarPorDailyAsync(dailyId);

        return Ok(response);
    }

    [HttpGet("{dailyId:int}/registros/{regId:int}")]
    public async Task<IActionResult> ObterRegistro(
        [FromRoute] int dailyId,
        [FromRoute] int regId)
    {
        if (dailyId <= 0)
            return BadRequest(new { mensagem = "Código da daily inválido." });

        if (regId <= 0)
            return BadRequest(new { mensagem = "Código do registro inválido." });

        DailyRegistroItem? registro =
            await _dailyRegistrosService.ObterRegistroAsync(dailyId, regId);

        if (registro == null)
            return NotFound(new { mensagem = "Registro da daily não encontrado." });

        return Ok(registro);
    }

    [HttpPost("{dailyId:int}/registros")]
    public async Task<IActionResult> InserirRegistro(
        [FromRoute] int dailyId,
        [FromBody] DailyRegistroSalvarRequest request)
    {
        DailyRegistroSalvarResponse response =
            await _dailyRegistrosService.InserirAsync(dailyId, request);

        if (!response.Sucesso)
        {
            if (response.Mensagem.Equals("Daily não encontrada.", StringComparison.OrdinalIgnoreCase))
                return NotFound(response);

            return BadRequest(response);
        }

        return Ok(response);
    }

    [HttpPut("{dailyId:int}/registros/{regId:int}")]
    public async Task<IActionResult> AtualizarRegistro(
        [FromRoute] int dailyId,
        [FromRoute] int regId,
        [FromBody] DailyRegistroSalvarRequest request)
    {
        DailyRegistroSalvarResponse response =
            await _dailyRegistrosService.AtualizarAsync(dailyId, regId, request);

        if (!response.Sucesso)
        {
            if (response.Mensagem.Equals("Daily não encontrada.", StringComparison.OrdinalIgnoreCase) ||
                response.Mensagem.Equals("Registro da daily não encontrado.", StringComparison.OrdinalIgnoreCase))
                return NotFound(response);

            return BadRequest(response);
        }

        return Ok(response);
    }

    [HttpDelete("{dailyId:int}/registros/{regId:int}")]
    public async Task<IActionResult> ExcluirRegistro(
        [FromRoute] int dailyId,
        [FromRoute] int regId)
    {
        DailyRegistroExcluirResponse response =
            await _dailyRegistrosService.ExcluirAsync(dailyId, regId);

        if (!response.Sucesso)
        {
            if (response.Mensagem.Equals("Registro da daily não encontrado.", StringComparison.OrdinalIgnoreCase))
                return NotFound(response);

            return BadRequest(response);
        }

        return Ok(response);
    }
}