using BikeService.Models;

namespace BikeService.Repository.Interfaces;

public interface INotificationRepository
{
    Task<List<Notification>> GetByUserAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task<Notification?> GetByIdAsync(int id);
    Task<List<Notification>> GetByOrderIdAsync(int orderId);
    Task AddAsync(Notification notification);
    Task UpdateAsync(Notification notification);
    Task MarkAllReadAsync(int userId);
    Task DeleteByOrderIdAsync(int orderId);
    Task DeleteByUserAndOrderAsync(int userId, int orderId);
}
