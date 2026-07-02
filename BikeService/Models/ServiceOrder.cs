namespace BikeService.Models;

public enum ServiceOrderStatus
{
    InProgress     = 1,   
    ReadyForPickup = 3,   
    PickedUp       = 4,  
    Cancelled      = 5   
}

public class ServiceOrder
{
    public int Id { get; set; }
    public string ClientFirstName { get; set; } = string.Empty;
    public string ClientLastName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public string BikeBrand { get; set; } = string.Empty;
    public string BikeModel { get; set; } = string.Empty;
    public string BikeType { get; set; } = string.Empty;         
    public string? BikeFrameNumber { get; set; }                 
    public string? BikeColor { get; set; }
    public ServiceOrderStatus Status { get; set; } = ServiceOrderStatus.InProgress;
    public string Description { get; set; } = string.Empty;      
    public string? Notes { get; set; }                            
    public decimal? EstimatedPrice { get; set; }                
    public decimal? FinalPrice { get; set; }                      
    public DateTime? EstimatedPickupDate { get; set; }            
    public Guid TrackingToken { get; set; } = Guid.NewGuid();
    public int RowVersion { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }                    
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;                  
    public int? LastEditedById { get; set; }
    public User? LastEditedBy { get; set; }                       
    public List<OrderPhoto> Photos { get; set; } = [];            
}