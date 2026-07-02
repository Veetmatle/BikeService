using BikeService.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace BikeService.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public Task SendOrderConfirmationAsync(string toEmail, string clientName, int orderId, Guid trackingToken)
    {
        var trackingUrl = $"{_config["Email:AppUrl"]}/track/{trackingToken}";
        var body =
            $"Witaj {clientName},\n\n" +
            $"Twoje zlecenie serwisowe zostało przyjęte.\n\n" +
            $"Możesz śledzić status swojego roweru pod adresem:\n{trackingUrl}\n\n" +
            $"Do zobaczenia!\nZespół BikeService";

        return SendAsync(toEmail, "Twoje zlecenie – potwierdzenie przyjęcia", body);
    }

    public Task SendReadyForPickupAsync(string toEmail, string clientName, int orderId, Guid trackingToken)
    {
        var trackingUrl = $"{_config["Email:AppUrl"]}/track/{trackingToken}";
        var body =
            $"Witaj {clientName},\n\n" +
            $"Twoje zlecenie zostało zrealizowane. Zapraszamy do salonu po odbiór roweru.\n\n" +
            $"Status zlecenia możesz sprawdzić pod adresem:\n{trackingUrl}\n\n" +
            $"Do zobaczenia!\nZespół BikeService";

        return SendAsync(toEmail, "Twoje zlecenie – gotowe do odbioru", body);
    }

    private async Task SendAsync(string toEmail, string subject, string body)
    {
        var smtpHost = _config["Email:SmtpHost"];
        var smtpUser = _config["Email:Username"];
        var smtpPass = _config["Email:Password"];

        if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPass))
        {
            Console.WriteLine($"[EmailService] SMTP nie skonfigurowany. Pominięto wysyłkę do {toEmail}: {subject}");
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_config["Email:FromName"], smtpUser));
        message.To.Add(new MailboxAddress(string.Empty, toEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = body };

        using var client = new SmtpClient();
        await client.ConnectAsync(
            smtpHost,
            int.Parse(_config["Email:SmtpPort"] ?? "587"),
            SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(smtpUser, smtpPass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
