using BikeService.DTOs;

namespace BikeService.Services.Interfaces;

public interface IUserService
{
    Task<List<UserResponse>> GetAllAsync();
    Task<UserResponse> GetByIdAsync(int id);
    Task<UserResponse> CreateAsync(CreateUserRequest request);
    Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request);
    Task ResetPasswordAsync(int id, ResetPasswordRequest request);
    Task DeleteAsync(int id);
}