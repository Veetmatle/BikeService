using BikeService.DTOs;
using BikeService.Exceptions;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using BikeService.Services.Interfaces;

namespace BikeService.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;

    public NotificationService(INotificationRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<NotificationResponse>> GetByUserAsync(int userId)
    {
        var notifications = await _repo.GetByUserAsync(userId);
        return notifications.Select(Map).ToList();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
        => await _repo.GetUnreadCountAsync(userId);

    public async Task MarkReadAsync(int notificationId, int userId)
    {
        var n = await _repo.GetByIdAsync(notificationId)
            ?? throw new NotFoundException($"Powiadomienie {notificationId} nie istnieje.");

        if (n.UserId != userId)
            throw new ForbiddenException("Brak dostępu do tego powiadomienia.");

        n.IsRead = true;
        await _repo.UpdateAsync(n);
    }

    public async Task MarkAllReadAsync(int userId)
        => await _repo.MarkAllReadAsync(userId);

    public async Task UpdateTagsAsync(int orderId, List<int> taggedUserIds, int taggerId)
    {
        var current = await _repo.GetByOrderIdAsync(orderId);
        var currentUserIds = current.Select(n => n.UserId).ToHashSet();
        var newUserIds = taggedUserIds.ToHashSet();

        foreach (var n in current.Where(n => !newUserIds.Contains(n.UserId)))
            await _repo.DeleteByUserAndOrderAsync(n.UserId, orderId);

        foreach (var userId in newUserIds)
        {
            if (userId == taggerId) continue;          
            if (currentUserIds.Contains(userId)) continue; 

            await _repo.AddAsync(new Notification
            {
                UserId = userId,
                OrderId = orderId,
                CreatedByUserId = taggerId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    public async Task RemoveByOrderAsync(int orderId)
        => await _repo.DeleteByOrderIdAsync(orderId);

    public async Task<List<TaggedUserDto>> GetTaggedUsersAsync(int orderId)
    {
        var notifications = await _repo.GetByOrderIdAsync(orderId);
        return notifications
            .Select(n => new TaggedUserDto { Id = n.UserId, Username = n.User.Username })
            .ToList();
    }

    private static NotificationResponse Map(Notification n) => new()
    {
        Id = n.Id,
        OrderId = n.OrderId,
        ClientName = $"{n.Order.ClientFirstName} {n.Order.ClientLastName}",
        TaggedBy = n.CreatedBy.Username,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt
    };
}
