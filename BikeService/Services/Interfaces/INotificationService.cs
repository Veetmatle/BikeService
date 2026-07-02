using BikeService.DTOs;

namespace BikeService.Services.Interfaces;

public interface INotificationService
{
    Task<List<NotificationResponse>> GetByUserAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkReadAsync(int notificationId, int userId);
    Task MarkAllReadAsync(int userId);

    Task UpdateTagsAsync(int orderId, List<int> taggedUserIds, int taggerId);
    Task RemoveByOrderAsync(int orderId);
    Task<List<TaggedUserDto>> GetTaggedUsersAsync(int orderId);
}
