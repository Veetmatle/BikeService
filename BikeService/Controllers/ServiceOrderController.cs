using BikeService.DTOs;
using BikeService.Models;
using BikeService.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BikeService.Controllers;

[ApiController]
[Route("api/orders")]
public class ServiceOrderController : ControllerBase
{
    private readonly IServiceOrderService _orderService;

    public ServiceOrderController(IServiceOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet("track/{token:guid}")]
    public async Task<IActionResult> Track(Guid token)
    {
        var result = await _orderService.GetByTrackingTokenAsync(token);
        return Ok(result);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] string? searchField = null)
    {
        var result = await _orderService.GetAllAsync(page, pageSize, status, search, searchField);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        return Ok(order);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] ServiceOrderCreateRequest request)
    {
        var order = await _orderService.CreateAsync(request, GetCurrentUserId());
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] ServiceOrderUpdateRequest request)
    {
        var order = await _orderService.UpdateAsync(id, request, GetCurrentUserId());
        return Ok(order);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] ServiceOrderStatusRequest request)
    {
        var order = await _orderService.ChangeStatusAsync(id, request, GetCurrentUserId());
        return Ok(order);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await _orderService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:int}/photos")]
    [Authorize]
    public async Task<IActionResult> AddPhoto(int id, [FromForm] IFormFile file)
    {
        var photo = await _orderService.AddPhotoAsync(id, file);
        return CreatedAtAction(nameof(GetById), new { id }, photo);
    }

    [HttpDelete("{id:int}/photos/{photoId:int}")]
    [Authorize]
    public async Task<IActionResult> DeletePhoto(int id, int photoId)
    {
        await _orderService.DeletePhotoAsync(id, photoId);
        return NoContent();
    }

    private int GetCurrentUserId()
        => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
