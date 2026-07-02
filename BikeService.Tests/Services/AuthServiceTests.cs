using BikeService.DTOs;
using BikeService.Exceptions;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using BikeService.Services;
using Microsoft.Extensions.Configuration;
using Moq;

namespace BikeService.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IRefreshTokenRepository> _tokenRepoMock = new();
    private readonly Mock<IConfiguration> _configMock = new();
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _configMock.Setup(c => c["Jwt:Key"]).Returns("super-secret-test-key-that-is-at-least-32-chars!!");
        _configMock.Setup(c => c["Jwt:ExpiresInHours"]).Returns("2");
        _configMock.Setup(c => c["Jwt:Issuer"]).Returns("test-issuer");
        _configMock.Setup(c => c["Jwt:Audience"]).Returns("test-audience");

        _service = new AuthService(_userRepoMock.Object, _tokenRepoMock.Object, _configMock.Object);
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsAuthResponse()
    {
        const string password = "TestPass123!";
        var user = new User
        {
            Id = 1,
            Username = "mechanic1",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            IsActive = true,
            Role = new Role { Id = 1, Name = Roles.Mechanic }
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        _tokenRepoMock.Setup(r => r.AddAsync(It.IsAny<RefreshToken>())).Returns(Task.CompletedTask);

        var result = await _service.LoginAsync(new LoginRequest { Email = user.Email, Password = password });

        Assert.NotNull(result.AccessToken);
        Assert.Equal(user.Username, result.Username);
        Assert.Equal(Roles.Mechanic, result.Role);
    }

    [Fact]
    public async Task LoginAsync_InactiveAccount_ThrowsBusinessException()
    {
        var user = new User
        {
            Email = "inactive@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass"),
            IsActive = false,
            Role = new Role { Name = Roles.Mechanic }
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        await Assert.ThrowsAsync<BusinessException>(() =>
            _service.LoginAsync(new LoginRequest { Email = user.Email, Password = "pass" }));
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsBusinessException()
    {
        var user = new User
        {
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            IsActive = true,
            Role = new Role { Name = Roles.Mechanic }
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        await Assert.ThrowsAsync<BusinessException>(() =>
            _service.LoginAsync(new LoginRequest { Email = user.Email, Password = "wrong-password" }));
    }

    [Fact]
    public async Task GetProfileAsync_UserNotFound_ThrowsNotFoundException()
    {
        _userRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((User?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetProfileAsync(99));
    }
}
