namespace BikeService.DTOs;

public class NotificationResponse
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string TaggedBy { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TaggedUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
}
