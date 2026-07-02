using BikeService.Events;

namespace BikeService.Services.Interfaces;

public interface IOrderEventDispatcher
{
    Task InvokeOrderCreatedAsync(OrderCreatedEventArgs args);
    Task InvokeOrderReadyForPickupAsync(OrderReadyForPickupEventArgs args);
}
