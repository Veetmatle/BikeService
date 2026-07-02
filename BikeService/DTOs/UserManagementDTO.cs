using System.ComponentModel.DataAnnotations;
using BikeService.Models;

namespace BikeService.DTOs;

public class CreateUserRequest
{
    [Required(ErrorMessage = "Nazwa użytkownika jest wymagana.")]
    [MinLength(3)]
    [MaxLength(70)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email jest wymagany.")]
    [EmailAddress]
    [MaxLength(50)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hasło jest wymagane.")]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; set; }

    [Required(ErrorMessage = "Rola jest wymagana.")]
    public string Role { get; set; } = Roles.Mechanic;  
}

public class UpdateUserRequest
{
    [MinLength(3)]
    [MaxLength(70)]
    public string? Username { get; set; }

    [EmailAddress]
    [MaxLength(50)]
    public string? Email { get; set; }

    [Phone]
    public string? PhoneNumber { get; set; }

    public string? Role { get; set; }

    public bool? IsActive { get; set; }
}

public class ResetPasswordRequest
{
    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

public class UserResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}