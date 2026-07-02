using BikeService.DTOs;

namespace BikeService.Services.Interfaces;

public interface IServiceOrderService
{
    Task<PagedResult<ServiceOrderSummaryResponse>> GetAllAsync(int page, int pageSize, string? status, string? search, string? searchField = null);
    Task<ServiceOrderResponse> GetByIdAsync(int id);
    Task<OrderTrackingResponse> GetByTrackingTokenAsync(Guid token);
    Task<ServiceOrderResponse> CreateAsync(ServiceOrderCreateRequest request, int createdByUserId);
    Task<ServiceOrderResponse> UpdateAsync(int id, ServiceOrderUpdateRequest request, int editedByUserId);
    Task<ServiceOrderResponse> ChangeStatusAsync(int id, ServiceOrderStatusRequest request, int editedByUserId);
    Task DeleteAsync(int id);
    Task<OrderPhotoResponse> AddPhotoAsync(int orderId, IFormFile file);
    Task DeletePhotoAsync(int orderId, int photoId);
}
