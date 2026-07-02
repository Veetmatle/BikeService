using BikeService.DTOs;
using BikeService.Events;
using BikeService.Exceptions;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using BikeService.Services.Interfaces;

namespace BikeService.Services;

public class ServiceOrderService : IServiceOrderService
{
    private static readonly HashSet<string> AllowedPhotoExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxPhotoSizeBytes = 10 * 1024 * 1024;

    private readonly IServiceOrderRepository _repo;
    private readonly IWebHostEnvironment _env;
    private readonly IOrderEventDispatcher _dispatcher;
    private readonly INotificationService _notificationService;

    public ServiceOrderService(
        IServiceOrderRepository repo,
        IWebHostEnvironment env,
        IOrderEventDispatcher dispatcher,
        INotificationService notificationService)
    {
        _repo = repo;
        _env = env;
        _dispatcher = dispatcher;
        _notificationService = notificationService;
    }

    public async Task<OrderTrackingResponse> GetByTrackingTokenAsync(Guid token)
    {
        var order = await _repo.GetByTrackingTokenAsync(token)
            ?? throw new NotFoundException("Zlecenie o podanym tokenie nie istnieje.");

        return new OrderTrackingResponse
        {
            Status = order.Status.ToString(),
            BikeBrand = order.BikeBrand,
            BikeModel = order.BikeModel,
            Description = order.Description,
            EstimatedPrice = order.EstimatedPrice,
            FinalPrice = order.FinalPrice,
            EstimatedPickupDate = order.EstimatedPickupDate,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Photos = order.Photos.Select(p => new OrderPhotoResponse
            {
                Id = p.Id,
                FileName = p.FileName,
                Url = p.FilePath,
                UploadedAt = p.UploadedAt
            }).ToList()
        };
    }

    public async Task<PagedResult<ServiceOrderSummaryResponse>> GetAllAsync(
        int page, int pageSize, string? status, string? search, string? searchField = null)
    {
        ServiceOrderStatus? parsedStatus = null;
        if (status is not null)
        {
            if (!Enum.TryParse<ServiceOrderStatus>(status, ignoreCase: true, out var s))
                throw new BusinessException($"Nieprawidłowy status: '{status}'.");
            parsedStatus = s;
        }

        var (items, total) = await _repo.GetAllAsync(page, pageSize, parsedStatus, search, searchField);

        return new PagedResult<ServiceOrderSummaryResponse>
        {
            Items = items.Select(MapToSummary).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<ServiceOrderResponse> GetByIdAsync(int id)
    {
        var order = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Zlecenie", id);
        var response = MapToResponse(order);
        response.TaggedUsers = await _notificationService.GetTaggedUsersAsync(id);
        return response;
    }

    public async Task<ServiceOrderResponse> CreateAsync(ServiceOrderCreateRequest request, int createdById)
    {
        var order = new ServiceOrder
        {
            ClientFirstName = request.ClientFirstName,
            ClientLastName = request.ClientLastName,
            ClientPhone = request.ClientPhone,
            ClientEmail = request.ClientEmail,
            BikeBrand = request.BikeBrand ?? string.Empty,
            BikeModel = request.BikeModel ?? string.Empty,
            BikeType = request.BikeType ?? string.Empty,
            BikeFrameNumber = request.BikeFrameNumber,
            BikeColor = request.BikeColor,
            Description = request.Description ?? string.Empty,
            EstimatedPrice = request.EstimatedPrice,
            EstimatedPickupDate = request.EstimatedPickupDate.HasValue
                ? DateTime.SpecifyKind(request.EstimatedPickupDate.Value, DateTimeKind.Utc)
                : null,
            CreatedById = createdById,
        };

        await _repo.AddAsync(order);

        var created = await _repo.GetByIdAsync(order.Id)
            ?? throw new InvalidOperationException("Błąd podczas pobierania utworzonego zlecenia.");

        if (!string.IsNullOrEmpty(created.ClientEmail))
            await _dispatcher.InvokeOrderCreatedAsync(new OrderCreatedEventArgs(
                created.ClientEmail,
                created.ClientFirstName,
                created.Id,
                created.TrackingToken));

        return MapToResponse(created);
    }

    public async Task<ServiceOrderResponse> UpdateAsync(int id, ServiceOrderUpdateRequest request, int editorId)
    {
        var order = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Zlecenie", id);

        if (order.RowVersion != request.RowVersion)
            throw new ConflictException();

        if (request.ClientFirstName is not null) order.ClientFirstName = request.ClientFirstName;
        if (request.ClientLastName is not null)  order.ClientLastName  = request.ClientLastName;
        if (request.ClientPhone is not null)     order.ClientPhone     = request.ClientPhone;
        if (request.ClientEmail is not null)     order.ClientEmail     = request.ClientEmail;
        if (request.BikeBrand is not null)       order.BikeBrand       = request.BikeBrand;
        if (request.BikeModel is not null)       order.BikeModel       = request.BikeModel;
        if (request.BikeType is not null)        order.BikeType        = request.BikeType;
        if (request.Description is not null)     order.Description     = request.Description;

        order.BikeFrameNumber     = request.BikeFrameNumber;
        order.BikeColor           = request.BikeColor;
        order.Notes               = request.Notes;
        order.EstimatedPrice      = request.EstimatedPrice;
        order.FinalPrice          = request.FinalPrice;
        order.EstimatedPickupDate = request.EstimatedPickupDate.HasValue
            ? DateTime.SpecifyKind(request.EstimatedPickupDate.Value, DateTimeKind.Utc)
            : null;

        order.RowVersion++;
        order.LastEditedById = editorId;
        order.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(order);
        await _notificationService.UpdateTagsAsync(id, request.TaggedUserIds ?? [], editorId);

        return MapToResponse(order);
    }

    public async Task<ServiceOrderResponse> ChangeStatusAsync(int id, ServiceOrderStatusRequest request, int editorId)
    {
        var order = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Zlecenie", id);

        if (order.RowVersion != request.RowVersion)
            throw new ConflictException();

        order.Status = request.Status;
        order.RowVersion++;
        order.LastEditedById = editorId;
        order.UpdatedAt = DateTime.UtcNow;

        if (request.Status == ServiceOrderStatus.ReadyForPickup && order.CompletedAt is null)
            order.CompletedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(order);

        if (request.Status == ServiceOrderStatus.ReadyForPickup && !string.IsNullOrEmpty(order.ClientEmail))
            await _dispatcher.InvokeOrderReadyForPickupAsync(new OrderReadyForPickupEventArgs(
                order.ClientEmail,
                order.ClientFirstName,
                order.Id,
                order.TrackingToken));

        if (request.Status == ServiceOrderStatus.Cancelled || request.Status == ServiceOrderStatus.PickedUp)
            await _notificationService.RemoveByOrderAsync(id);

        return MapToResponse(order);
    }

    public async Task DeleteAsync(int id)
    {
        var order = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Zlecenie", id);

        foreach (var photo in order.Photos)
            DeletePhotoFile(photo.FilePath);

        await _repo.DeleteAsync(order);
    }

    public async Task<OrderPhotoResponse> AddPhotoAsync(int orderId, IFormFile file)
    {
        var order = await _repo.GetByIdAsync(orderId)
            ?? throw new NotFoundException("Zlecenie", orderId);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedPhotoExtensions.Contains(ext))
            throw new BusinessException($"Niedozwolony format pliku. Dozwolone: {string.Join(", ", AllowedPhotoExtensions)}");

        if (file.Length > MaxPhotoSizeBytes)
            throw new BusinessException("Plik jest za duży. Maksymalny rozmiar to 10 MB.");

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var uploadDir = Path.Combine(webRoot, "uploads", "orders", orderId.ToString());
        Directory.CreateDirectory(uploadDir);

        var safeFileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadDir, safeFileName);

        await using (var stream = File.Create(filePath))
            await file.CopyToAsync(stream);

        var relativeUrl = $"/uploads/orders/{orderId}/{safeFileName}";
        var photo = new OrderPhoto
        {
            FileName = file.FileName,
            FilePath = relativeUrl,
            ServiceOrderId = orderId
        };

        order.Photos.Add(photo);
        order.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(order);

        return new OrderPhotoResponse { Id = photo.Id, FileName = photo.FileName, Url = photo.FilePath, UploadedAt = photo.UploadedAt };
    }

    public async Task DeletePhotoAsync(int orderId, int photoId)
    {
        var photo = await _repo.GetPhotoAsync(orderId, photoId)
            ?? throw new NotFoundException($"Zdjęcie {photoId} nie istnieje w zleceniu {orderId}.");

        var order = await _repo.GetByIdAsync(orderId)!;
        order!.Photos.Remove(photo);
        order.UpdatedAt = DateTime.UtcNow;

        DeletePhotoFile(photo.FilePath);
        await _repo.UpdateAsync(order);
    }

    private void DeletePhotoFile(string relativeUrl)
    {
        if (string.IsNullOrEmpty(relativeUrl)) return;
        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var fullPath = Path.Combine(webRoot, relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }

    private static ServiceOrderSummaryResponse MapToSummary(ServiceOrder o) => new()
    {
        Id = o.Id,
        Status = o.Status.ToString(),
        ClientFirstName = o.ClientFirstName,
        ClientLastName = o.ClientLastName,
        ClientPhone = o.ClientPhone,
        ClientEmail = o.ClientEmail,
        BikeBrand = o.BikeBrand,
        BikeModel = o.BikeModel,
        EstimatedPrice = o.EstimatedPrice,
        EstimatedPickupDate = o.EstimatedPickupDate,
        CreatedAt = o.CreatedAt,
        CreatedBy = o.CreatedBy.Username,
        LastEditedBy = o.LastEditedBy?.Username
    };

    private static ServiceOrderResponse MapToResponse(ServiceOrder o) => new()
    {
        Id = o.Id,
        Status = o.Status.ToString(),
        TrackingToken = o.TrackingToken,
        RowVersion = o.RowVersion,
        ClientFirstName = o.ClientFirstName,
        ClientLastName = o.ClientLastName,
        ClientPhone = o.ClientPhone,
        ClientEmail = o.ClientEmail,
        BikeBrand = o.BikeBrand,
        BikeModel = o.BikeModel,
        BikeType = o.BikeType,
        BikeFrameNumber = o.BikeFrameNumber,
        BikeColor = o.BikeColor,
        Description = o.Description,
        Notes = o.Notes,
        EstimatedPrice = o.EstimatedPrice,
        FinalPrice = o.FinalPrice,
        EstimatedPickupDate = o.EstimatedPickupDate,
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt,
        CompletedAt = o.CompletedAt,
        CreatedBy = o.CreatedBy.Username,
        LastEditedBy = o.LastEditedBy?.Username,
        Photos = o.Photos.Select(p => new OrderPhotoResponse
        {
            Id = p.Id,
            FileName = p.FileName,
            Url = p.FilePath,
            UploadedAt = p.UploadedAt
        }).ToList()
    };
}
