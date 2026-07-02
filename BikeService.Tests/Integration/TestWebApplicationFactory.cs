using BikeService.Data;
using BikeService.Models;
using BikeService.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace BikeService.Tests.Integration;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"TestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));

            var emailDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IEmailService));
            if (emailDescriptor != null)
                services.Remove(emailDescriptor);

            services.AddScoped<IEmailService>(_ =>
            {
                var mock = new Mock<IEmailService>();
                mock.Setup(s => s.SendOrderConfirmationAsync(
                        It.IsAny<string>(), It.IsAny<string>(),
                        It.IsAny<int>(), It.IsAny<Guid>()))
                    .Returns(Task.CompletedTask);
                mock.Setup(s => s.SendReadyForPickupAsync(
                        It.IsAny<string>(), It.IsAny<string>(),
                        It.IsAny<int>(), It.IsAny<Guid>()))
                    .Returns(Task.CompletedTask);
                return mock.Object;
            });
        });
    }

    public async Task InitializeDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        if (!db.Roles.Any())
        {
            db.Roles.AddRange(
                new Role { Name = Roles.Admin },
                new Role { Name = Roles.Mechanic });
            await db.SaveChangesAsync();
        }
    }

    public async Task<Guid> GetOrderTrackingTokenAsync(int orderId)
    {
        using var scope = Services.CreateScope();
        var db    = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var order = await db.ServiceOrders.FindAsync(orderId);
        return order!.TrackingToken;
    }

    public async Task<(int AdminId, int MechanicId)> SeedUsersAsync(
        string adminEmail    = "admin@test.com",
        string adminPassword = "AdminPass123!",
        string mechEmail     = "mechanic@test.com",
        string mechPassword  = "MechPass123!")
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var adminRole    = db.Roles.First(r => r.Name == Roles.Admin);
        var mechanicRole = db.Roles.First(r => r.Name == Roles.Mechanic);

        int adminId, mechId;

        if (!db.Users.Any(u => u.Email == adminEmail))
        {
            var admin = new User
            {
                Username     = "admin",
                Email        = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                IsActive     = true,
                RoleId       = adminRole.Id,
                Role         = adminRole,
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();
            adminId = admin.Id;
        }
        else
        {
            adminId = db.Users.First(u => u.Email == adminEmail).Id;
        }

        if (!db.Users.Any(u => u.Email == mechEmail))
        {
            var mech = new User
            {
                Username     = "mechanic",
                Email        = mechEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(mechPassword),
                IsActive     = true,
                RoleId       = mechanicRole.Id,
                Role         = mechanicRole,
            };
            db.Users.Add(mech);
            await db.SaveChangesAsync();
            mechId = mech.Id;
        }
        else
        {
            mechId = db.Users.First(u => u.Email == mechEmail).Id;
        }

        return (adminId, mechId);
    }
}
