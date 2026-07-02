using BikeService.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BikeService.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _service;
    private readonly IUserService _userService;

    public NotificationController(INotificationService service, IUserService userService)
    {
        _service = service;
        _userService = userService;
    }

    [HttpGet("mentionable-users")]
    public async Task<IActionResult> GetMentionableUsers()
    {
        var users = await _userService.GetAllAsync();
        var result = users
            .Where(u => u.IsActive)
            .Select(u => new { u.Id, u.Username })
            .ToList();
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetByUserAsync(GetCurrentUserId());
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _service.GetUnreadCountAsync(GetCurrentUserId());
        return Ok(new { count });
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        await _service.MarkReadAsync(id, GetCurrentUserId());
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _service.MarkAllReadAsync(GetCurrentUserId());
        return NoContent();
    }

    private int GetCurrentUserId()
        => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
