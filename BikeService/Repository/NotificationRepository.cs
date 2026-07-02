using BikeService.Data;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BikeService.Repository;

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _db;

    public NotificationRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Notification>> GetByUserAsync(int userId)
        => await _db.Notifications
            .Include(n => n.Order)
            .Include(n => n.CreatedBy)
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

    public async Task<int> GetUnreadCountAsync(int userId)
        => await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

    public async Task<Notification?> GetByIdAsync(int id)
        => await _db.Notifications
            .Include(n => n.Order)
            .Include(n => n.CreatedBy)
            .FirstOrDefaultAsync(n => n.Id == id);

    public async Task<List<Notification>> GetByOrderIdAsync(int orderId)
        => await _db.Notifications
            .Include(n => n.User)
            .Where(n => n.OrderId == orderId)
            .ToListAsync();

    public async Task AddAsync(Notification notification)
    {
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Notification notification)
        => await _db.SaveChangesAsync();

    public async Task MarkAllReadAsync(int userId)
        => await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

    public async Task DeleteByOrderIdAsync(int orderId)
        => await _db.Notifications
            .Where(n => n.OrderId == orderId)
            .ExecuteDeleteAsync();

    public async Task DeleteByUserAndOrderAsync(int userId, int orderId)
        => await _db.Notifications
            .Where(n => n.UserId == userId && n.OrderId == orderId)
            .ExecuteDeleteAsync();
}
