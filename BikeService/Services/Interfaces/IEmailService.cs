namespace BikeService.Services.Interfaces;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string clientName, int orderId, Guid trackingToken);
    Task SendReadyForPickupAsync(string toEmail, string clientName, int orderId, Guid trackingToken);
}