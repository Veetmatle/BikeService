namespace BikeService.Models;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int OrderId { get; set; }
    public ServiceOrder Order { get; set; } = null!;

    public int CreatedByUserId { get; set; }
    public User CreatedBy { get; set; } = null!;

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
