using Microsoft.AspNetCore.Mvc;

namespace KSWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            sistema = "KSWeb",
            api = "KSWeb.Api",
            status = "online",
            dataHora = DateTime.Now
        });
    }
}