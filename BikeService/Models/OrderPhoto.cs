namespace BikeService.Models;

public class OrderPhoto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;       
    public string FilePath { get; set; } = string.Empty;       
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public int ServiceOrderId { get; set; }
    public ServiceOrder ServiceOrder { get; set; } = null!;
}