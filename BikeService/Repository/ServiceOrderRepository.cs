using BikeService.Data;
using BikeService.Exceptions;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BikeService.Repository;

public class ServiceOrderRepository : IServiceOrderRepository
{
    private readonly AppDbContext _db;

    public ServiceOrderRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceOrder?> GetByIdAsync(int id)
        => await _db.ServiceOrders
            .Include(o => o.CreatedBy).ThenInclude(u => u.Role)
            .Include(o => o.LastEditedBy).ThenInclude(u => u!.Role)
            .Include(o => o.Photos)
            .FirstOrDefaultAsync(o => o.Id == id);

    public async Task<ServiceOrder?> GetByTrackingTokenAsync(Guid token)
        => await _db.ServiceOrders
            .Include(o => o.Photos)
            .FirstOrDefaultAsync(o => o.TrackingToken == token);

    public async Task<(List<ServiceOrder> Items, int TotalCount)> GetAllAsync(
        int page, int pageSize, ServiceOrderStatus? status, string? search, string? searchField = null)
    {
        var query = _db.ServiceOrders
            .Include(o => o.CreatedBy)
            .Include(o => o.LastEditedBy)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            var phoneTerm = new string(term.Where(char.IsDigit).ToArray());

            if (searchField == "lastname")
            {
                query = query.Where(o => o.ClientLastName.ToLower().Contains(term));
            }
            else if (searchField == "email")
            {
                query = query.Where(o => o.ClientEmail.ToLower().Contains(term));
            }
            else if (searchField == "phone")
            {
                if (phoneTerm.Length >= 3)
                    query = query.Where(o =>
                        o.ClientPhone.Replace(" ", "").Replace("-", "").Replace("+", "")
                            .Contains(phoneTerm));
                else
                    query = query.Where(o => false);
            }
            else if (searchField == "id")
            {
                if (int.TryParse(term, out var orderId))
                    query = query.Where(o => o.Id == orderId);
                else
                    query = query.Where(o => false);
            }
            else
            {
                query = query.Where(o =>
                    o.ClientLastName.ToLower().Contains(term) ||
                    o.ClientEmail.ToLower().Contains(term) ||
                    (phoneTerm.Length >= 3 && (
                        o.ClientPhone.Replace(" ", "").Replace("-", "").Replace("+", "")
                            .Contains(phoneTerm))));
            }
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<ServiceOrder> AddAsync(ServiceOrder order)
    {
        _db.ServiceOrders.Add(order);
        await _db.SaveChangesAsync();
        return order;
    }

    public async Task UpdateAsync(ServiceOrder order)
    {
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException();
        }
    }

    public async Task DeleteAsync(ServiceOrder order)
    {
        _db.ServiceOrders.Remove(order);
        await _db.SaveChangesAsync();
    }

    public async Task<OrderPhoto?> GetPhotoAsync(int orderId, int photoId)
        => await _db.OrderPhotos
            .FirstOrDefaultAsync(p => p.Id == photoId && p.ServiceOrderId == orderId);
}
