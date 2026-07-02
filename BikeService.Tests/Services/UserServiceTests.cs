using BikeService.DTOs;
using BikeService.Exceptions;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using BikeService.Services;
using Moq;

namespace BikeService.Tests.Services;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _repoMock = new();
    private readonly UserService _service;

    public UserServiceTests()
    {
        _service = new UserService(_repoMock.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllUsersMappedToDto()
    {
        var users = new List<User>
        {
            new() { Id = 1, Username = "admin", Email = "admin@test.com", Role = new Role { Name = Roles.Admin }, IsActive = true },
            new() { Id = 2, Username = "mech", Email = "mech@test.com", Role = new Role { Name = Roles.Mechanic }, IsActive = true }
        };

        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);

        var result = await _service.GetAllAsync();

        Assert.Equal(2, result.Count);
        Assert.Equal("admin", result[0].Username);
        Assert.Equal(Roles.Admin, result[0].Role);
    }

    [Fact]
    public async Task GetByIdAsync_UserNotFound_ThrowsNotFoundException()
    {
        _repoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((User?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetByIdAsync(99));
    }

    [Fact]
    public async Task CreateAsync_DuplicateEmail_ThrowsBusinessException()
    {
        _repoMock.Setup(r => r.EmailExistsAsync("taken@test.com")).ReturnsAsync(true);

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Email = "taken@test.com",
            Password = "Pass123!",
            Role = Roles.Mechanic
        };

        await Assert.ThrowsAsync<BusinessException>(() => _service.CreateAsync(request));
    }

    [Fact]
    public async Task CreateAsync_InvalidRole_ThrowsBusinessException()
    {
        _repoMock.Setup(r => r.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
        _repoMock.Setup(r => r.GetRoleByNameAsync("INVALID")).ReturnsAsync((Role?)null);

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Email = "new@test.com",
            Password = "Pass123!",
            Role = "INVALID"
        };

        await Assert.ThrowsAsync<BusinessException>(() => _service.CreateAsync(request));
    }
}
