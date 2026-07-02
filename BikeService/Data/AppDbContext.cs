using BikeService.Models;
using Microsoft.EntityFrameworkCore;

namespace BikeService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<ServiceOrder> ServiceOrders { get; set; }
    public DbSet<OrderPhoto> OrderPhotos { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ServiceOrder>()
            .HasOne(o => o.CreatedBy)
            .WithMany(u => u.CreatedOrders)
            .HasForeignKey(o => o.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ServiceOrder>()
            .HasOne(o => o.LastEditedBy)
            .WithMany(u => u.LastEditedOrders)
            .HasForeignKey(o => o.LastEditedById)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RefreshToken>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ServiceOrder>()
            .Property(o => o.Status)
            .HasConversion<string>();

        modelBuilder.Entity<ServiceOrder>()
            .HasIndex(o => o.TrackingToken)
            .IsUnique();

        modelBuilder.Entity<ServiceOrder>()
            .Property(o => o.RowVersion)
            .IsConcurrencyToken();

        modelBuilder.Entity<ServiceOrder>()
            .Property(o => o.EstimatedPrice)
            .HasPrecision(10, 2);

        modelBuilder.Entity<ServiceOrder>()
            .Property(o => o.FinalPrice)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.CreatedBy)
            .WithMany(u => u.CreatedNotifications)
            .HasForeignKey(n => n.CreatedByUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Order)
            .WithMany()
            .HasForeignKey(n => n.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
