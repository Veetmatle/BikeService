namespace BikeService.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;          
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public List<ServiceOrder> CreatedOrders { get; set; } = [];
    public List<ServiceOrder> LastEditedOrders { get; set; } = [];

    public List<Notification> Notifications { get; set; } = [];

    public List<Notification> CreatedNotifications { get; set; } = [];
}