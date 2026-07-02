namespace BikeService.DTOs;

public class OrderPhotoResponse
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;       
    public DateTime UploadedAt { get; set; }
}