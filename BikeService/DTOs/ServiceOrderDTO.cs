using System.ComponentModel.DataAnnotations;
using BikeService.Models;

namespace BikeService.DTOs;

public class ServiceOrderCreateRequest
{
    [Required(ErrorMessage = "Imię klienta jest wymagane.")]
    [MaxLength(100)]
    public string ClientFirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nazwisko klienta jest wymagane.")]
    [MaxLength(100)]
    public string ClientLastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Numer telefonu jest wymagany.")]
    [Phone(ErrorMessage = "Nieprawidłowy format numeru telefonu.")]
    public string ClientPhone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email klienta jest wymagany.")]
    [EmailAddress(ErrorMessage = "Nieprawidłowy format adresu email.")]
    public string ClientEmail { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? BikeBrand { get; set; }

    [MaxLength(500)]
    public string? BikeModel { get; set; }

    [MaxLength(200)]
    public string? BikeType { get; set; }

    [MaxLength(100)]
    public string? BikeFrameNumber { get; set; }

    [MaxLength(50)]
    public string? BikeColor { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0, 100000)]
    public decimal? EstimatedPrice { get; set; }

    public DateTime? EstimatedPickupDate { get; set; }
}

public class ServiceOrderUpdateRequest
{
    [Required(ErrorMessage = "RowVersion jest wymagany do zapisu zmian.")]
    public int RowVersion { get; set; }

    [MaxLength(100)]
    public string? ClientFirstName { get; set; }

    [MaxLength(100)]
    public string? ClientLastName { get; set; }

    [Phone]
    public string? ClientPhone { get; set; }

    [EmailAddress]
    public string? ClientEmail { get; set; }

    [MaxLength(500)]
    public string? BikeBrand { get; set; }

    [MaxLength(500)]
    public string? BikeModel { get; set; }

    [MaxLength(200)]
    public string? BikeType { get; set; }

    [MaxLength(100)]
    public string? BikeFrameNumber { get; set; }

    [MaxLength(50)]
    public string? BikeColor { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public List<int>? TaggedUserIds { get; set; }

    [Range(0, 100000)]
    public decimal? EstimatedPrice { get; set; }

    [Range(0, 100000)]
    public decimal? FinalPrice { get; set; }

    public DateTime? EstimatedPickupDate { get; set; }
}

public class ServiceOrderStatusRequest
{
    [Required(ErrorMessage = "Status jest wymagany.")]
    public ServiceOrderStatus Status { get; set; }

    [Required(ErrorMessage = "RowVersion jest wymagany do zapisu zmian.")]
    public int RowVersion { get; set; }
}

public class ServiceOrderResponse
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid TrackingToken { get; set; }
    public int RowVersion { get; set; }

    public string ClientFirstName { get; set; } = string.Empty;
    public string ClientLastName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;

    public string BikeBrand { get; set; } = string.Empty;
    public string BikeModel { get; set; } = string.Empty;
    public string BikeType { get; set; } = string.Empty;
    public string? BikeFrameNumber { get; set; }
    public string? BikeColor { get; set; }

    public string Description { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public decimal? EstimatedPrice { get; set; }
    public decimal? FinalPrice { get; set; }
    public DateTime? EstimatedPickupDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
    public string? LastEditedBy { get; set; }

    public List<OrderPhotoResponse> Photos { get; set; } = [];
    public List<TaggedUserDto> TaggedUsers { get; set; } = [];
}

public class ServiceOrderSummaryResponse
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ClientFirstName { get; set; } = string.Empty;
    public string ClientLastName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public string BikeBrand { get; set; } = string.Empty;
    public string BikeModel { get; set; } = string.Empty;
    public decimal? EstimatedPrice { get; set; }
    public DateTime? EstimatedPickupDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? LastEditedBy { get; set; }
}

public class OrderTrackingResponse
{
    public string Status { get; set; } = string.Empty;
    public string BikeBrand { get; set; } = string.Empty;
    public string BikeModel { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? EstimatedPrice { get; set; }
    public decimal? FinalPrice { get; set; }
    public DateTime? EstimatedPickupDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<OrderPhotoResponse> Photos { get; set; } = [];
}

