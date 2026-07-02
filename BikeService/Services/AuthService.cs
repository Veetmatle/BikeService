using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BikeService.DTOs;
using BikeService.Exceptions;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using BikeService.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace BikeService.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IRefreshTokenRepository _tokenRepo;
    private readonly IConfiguration _config;

    public AuthService(
        IUserRepository userRepo,
        IRefreshTokenRepository tokenRepo,
        IConfiguration config)
    {
        _userRepo = userRepo;
        _tokenRepo = tokenRepo;
        _config = config;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepo.GetByEmailAsync(request.Email)
            ?? throw new BusinessException("Nieprawidłowy email lub hasło.");

        if (!user.IsActive)
            throw new BusinessException("Konto jest nieaktywne.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new BusinessException("Nieprawidłowy email lub hasło.");

        return await BuildAuthResponseAsync(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var stored = await _tokenRepo.GetByTokenAsync(refreshToken)
            ?? throw new UnauthorizedAccessException("Refresh token jest nieprawidłowy lub wygasł.");

        await _tokenRepo.RevokeAsync(stored);
        return await BuildAuthResponseAsync(stored.User);
    }

    public async Task RevokeTokenAsync(string refreshToken)
    {
        var stored = await _tokenRepo.GetByTokenAsync(refreshToken);
        if (stored is not null)
            await _tokenRepo.RevokeAsync(stored);
    }

    public async Task<UserProfileResponse> GetProfileAsync(int userId)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new NotFoundException("Użytkownik", userId);
        return MapToProfile(user);
    }

    public async Task<UserProfileResponse> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new NotFoundException("Użytkownik", userId);

        if (request.Username is not null) user.Username = request.Username;
        if (request.PhoneNumber is not null) user.PhoneNumber = request.PhoneNumber;

        if (request.Email is not null && request.Email != user.Email)
        {
            if (await _userRepo.EmailExistsAsync(request.Email))
                throw new BusinessException("Podany adres email jest już zajęty.");
            user.Email = request.Email;
        }

        await _userRepo.UpdateAsync(user);
        return MapToProfile(user);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new NotFoundException("Użytkownik", userId);

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new BusinessException("Aktualne hasło jest nieprawidłowe.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _userRepo.UpdateAsync(user);
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(User user)
    {
        var (accessToken, expiresAt) = GenerateJwt(user);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        return new AuthResponse
        {
            AccessToken = accessToken,
            Username = user.Username,
            Role = user.Role.Name,
            ExpiresAt = expiresAt,
            RefreshToken = refreshToken
        };
    }

    private (string Token, DateTime ExpiresAt) GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var hours = int.Parse(_config["Jwt:ExpiresInHours"] ?? "2");
        var expiresAt = DateTime.UtcNow.AddHours(hours);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.Name)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private async Task<string> CreateRefreshTokenAsync(int userId)
    {
        var tokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        await _tokenRepo.AddAsync(new RefreshToken
        {
            Token = tokenValue,
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        });
        return tokenValue;
    }

    private static UserProfileResponse MapToProfile(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        Role = user.Role.Name
    };
}
