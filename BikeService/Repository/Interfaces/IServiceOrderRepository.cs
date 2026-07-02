using BikeService.Models;

namespace BikeService.Repository.Interfaces;

public interface IServiceOrderRepository
{
    Task<ServiceOrder?> GetByIdAsync(int id);
    Task<ServiceOrder?> GetByTrackingTokenAsync(Guid token);
    Task<(List<ServiceOrder> Items, int TotalCount)> GetAllAsync(int page, int pageSize, ServiceOrderStatus? status, string? search, string? searchField = null);
    Task<ServiceOrder> AddAsync(ServiceOrder order);
    Task UpdateAsync(ServiceOrder order);
    Task DeleteAsync(ServiceOrder order);
    Task<OrderPhoto?> GetPhotoAsync(int orderId, int photoId);
}
