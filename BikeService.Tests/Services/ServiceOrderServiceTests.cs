using BikeService.DTOs;
using BikeService.Events;
using BikeService.Exceptions;
using BikeService.Models;
using BikeService.Repository.Interfaces;
using BikeService.Services;
using BikeService.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Moq;

namespace BikeService.Tests.Services;

public class ServiceOrderServiceTests
{
    private readonly Mock<IServiceOrderRepository> _repoMock = new();
    private readonly Mock<IWebHostEnvironment> _envMock = new();
    private readonly Mock<IOrderEventDispatcher> _dispatcherMock = new();
    private readonly Mock<INotificationService> _notificationMock = new();
    private readonly ServiceOrderService _service;

    public ServiceOrderServiceTests()
    {
        _dispatcherMock
            .Setup(d => d.InvokeOrderCreatedAsync(It.IsAny<OrderCreatedEventArgs>()))
            .Returns(Task.CompletedTask);
        _dispatcherMock
            .Setup(d => d.InvokeOrderReadyForPickupAsync(It.IsAny<OrderReadyForPickupEventArgs>()))
            .Returns(Task.CompletedTask);
        _notificationMock
            .Setup(n => n.RemoveByOrderAsync(It.IsAny<int>()))
            .Returns(Task.CompletedTask);

        _service = new ServiceOrderService(
            _repoMock.Object,
            _envMock.Object,
            _dispatcherMock.Object,
            _notificationMock.Object);
    }

    [Fact]
    public async Task GetByIdAsync_OrderNotFound_ThrowsNotFoundException()
    {
        _repoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((ServiceOrder?)null);
        _notificationMock.Setup(n => n.GetTaggedUsersAsync(99)).ReturnsAsync([]);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetByIdAsync(99));
    }

    [Fact]
    public async Task GetAllAsync_InvalidStatus_ThrowsBusinessException()
    {
        await Assert.ThrowsAsync<BusinessException>(() =>
            _service.GetAllAsync(1, 10, "NIEZNANY_STATUS", null));
    }

    [Fact]
    public async Task ChangeStatusAsync_SetToReadyForPickup_SetsCompletedAt()
    {
        var order = new ServiceOrder
        {
            Id = 1,
            Status = ServiceOrderStatus.InProgress,
            RowVersion = 0,
            CompletedAt = null,
            CreatedBy = new User { Username = "mechanic" },
            Photos = []
        };

        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(order);
        _repoMock.Setup(r => r.UpdateAsync(order)).Returns(Task.CompletedTask);

        var result = await _service.ChangeStatusAsync(
            1,
            new ServiceOrderStatusRequest { Status = ServiceOrderStatus.ReadyForPickup, RowVersion = 0 },
            editorId: 1);

        Assert.Equal(ServiceOrderStatus.ReadyForPickup.ToString(), result.Status);
        Assert.NotNull(order.CompletedAt);
    }

    [Fact]
    public async Task UpdateAsync_StaleRowVersion_ThrowsConflictException()
    {
        var order = new ServiceOrder
        {
            Id = 1,
            RowVersion = 7,
            CreatedBy = new User { Username = "mechanic" },
            Photos = []
        };

        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(order);

        var request = new ServiceOrderUpdateRequest { RowVersion = 3 };

        await Assert.ThrowsAsync<ConflictException>(() =>
            _service.UpdateAsync(1, request, editorId: 1));
    }

    [Fact]
    public async Task ChangeStatusAsync_StaleRowVersion_ThrowsConflictException()
    {
        var order = new ServiceOrder
        {
            Id = 1,
            Status = ServiceOrderStatus.InProgress,
            RowVersion = 5,
            CreatedBy = new User { Username = "mechanic" },
            Photos = []
        };

        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(order);

        var request = new ServiceOrderStatusRequest
        {
            Status = ServiceOrderStatus.ReadyForPickup,
            RowVersion = 2
        };

        await Assert.ThrowsAsync<ConflictException>(() =>
            _service.ChangeStatusAsync(1, request, editorId: 1));
    }

    [Fact]
    public async Task AddPhotoAsync_InvalidExtension_ThrowsBusinessException()
    {
        var order = new ServiceOrder
        {
            Id = 1,
            CreatedBy = new User { Username = "mechanic" },
            Photos = []
        };

        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(order);

        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns("photo.bmp");
        fileMock.Setup(f => f.Length).Returns(1024);

        await Assert.ThrowsAsync<BusinessException>(() =>
            _service.AddPhotoAsync(1, fileMock.Object));
    }
}
