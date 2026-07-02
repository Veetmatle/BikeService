using BikeService.Events;
using BikeService.Services.Interfaces;

namespace BikeService.Services;

public class OrderEventDispatcher(IEmailService emailService, ILogger<OrderEventDispatcher> logger) : IOrderEventDispatcher
{
    public async Task InvokeOrderCreatedAsync(OrderCreatedEventArgs args)
    {
        try
        {
            await emailService.SendOrderConfirmationAsync(args.Email, args.ClientName, args.OrderId, args.TrackingToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Nie udało się wysłać maila potwierdzającego zlecenie #{OrderId}", args.OrderId);
        }
    }

    public async Task InvokeOrderReadyForPickupAsync(OrderReadyForPickupEventArgs args)
    {
        try
        {
            await emailService.SendReadyForPickupAsync(args.Email, args.ClientName, args.OrderId, args.TrackingToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Nie udało się wysłać maila o gotowości do odbioru #{OrderId}", args.OrderId);
        }
    }
}
