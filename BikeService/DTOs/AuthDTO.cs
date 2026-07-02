using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BikeService.DTOs;
public class LoginRequest
{
    [Required(ErrorMessage = "Email jest wymagany.")]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hasło jest wymagane.")]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }

    [JsonIgnore]
    public string RefreshToken { get; set; } = string.Empty;
}

public class UserProfileResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    [MinLength(3)]
    [MaxLength(70)]
    public string? Username { get; set; }

    [EmailAddress]
    [MaxLength(50)]
    public string? Email { get; set; }

    [Phone]
    public string? PhoneNumber { get; set; }
}

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6, ErrorMessage = "Nowe hasło musi mieć co najmniej 6 znaków.")]
    public string NewPassword { get; set; } = string.Empty;
}