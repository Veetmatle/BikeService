using BikeService.DTOs;
using BikeService.Exceptions;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using BikeService.Services.Interfaces;

namespace BikeService.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<UserResponse>> GetAllAsync()
    {
        var users = await _repo.GetAllAsync();
        return users.Select(MapToResponse).ToList();
    }

    public async Task<UserResponse> GetByIdAsync(int id)
    {
        var user = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Użytkownik", id);
        return MapToResponse(user);
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request)
    {
        if (await _repo.EmailExistsAsync(request.Email))
            throw new BusinessException("Użytkownik z tym adresem email już istnieje.");

        var role = await _repo.GetRoleByNameAsync(request.Role)
            ?? throw new BusinessException($"Rola '{request.Role}' nie istnieje.");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            PhoneNumber = request.PhoneNumber,
            RoleId = role.Id,
            Role = role
        };

        await _repo.AddAsync(user);
        return MapToResponse(user);
    }

    public async Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Użytkownik", id);

        if (request.Username is not null) user.Username = request.Username;
        if (request.PhoneNumber is not null) user.PhoneNumber = request.PhoneNumber;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        if (request.Email is not null && request.Email != user.Email)
        {
            if (await _repo.EmailExistsAsync(request.Email))
                throw new BusinessException("Podany adres email jest już zajęty.");
            user.Email = request.Email;
        }

        if (request.Role is not null)
        {
            var role = await _repo.GetRoleByNameAsync(request.Role)
                ?? throw new BusinessException($"Rola '{request.Role}' nie istnieje.");
            user.RoleId = role.Id;
            user.Role = role;
        }

        await _repo.UpdateAsync(user);
        return MapToResponse(user);
    }

    public async Task ResetPasswordAsync(int id, ResetPasswordRequest request)
    {
        var user = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Użytkownik", id);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _repo.UpdateAsync(user);
    }

    public async Task DeleteAsync(int id)
    {
        var user = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Użytkownik", id);
        await _repo.DeleteAsync(user);
    }

    private static UserResponse MapToResponse(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        Role = user.Role.Name,
        IsActive = user.IsActive
    };
}
