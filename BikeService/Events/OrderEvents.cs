namespace BikeService.Events;

public record OrderCreatedEventArgs(
    string Email,
    string ClientName,
    int OrderId,
    Guid TrackingToken);

public record OrderReadyForPickupEventArgs(
    string Email,
    string ClientName,
    int OrderId,
    Guid TrackingToken);
