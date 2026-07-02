using System.Text.Json;
using BikeService.Exceptions;
using Microsoft.AspNetCore.Http;

namespace BikeService.Middleware;

public class GlobalExceptionHandler : IMiddleware
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            NotFoundException e => (StatusCodes.Status404NotFound, e.Message),
            BusinessException e => (StatusCodes.Status400BadRequest, e.Message),
            ForbiddenException e => (StatusCodes.Status403Forbidden, e.Message),
            ConflictException e => (StatusCodes.Status409Conflict, e.Message),
            UnauthorizedAccessException
                                e => (StatusCodes.Status401Unauthorized, e.Message),
            _ => (StatusCodes.Status500InternalServerError,
                                      "Wystąpił nieoczekiwany błąd serwera.")
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
            _logger.LogError(exception, "Nieobsłużony wyjątek");
        else
            _logger.LogInformation("Obsłużony wyjątek aplikacji: {Message}", exception.Message);

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = JsonSerializer.Serialize(new
        {
            status = statusCode,
            message,
            path = context.Request.Path.ToString()
        });

        await context.Response.WriteAsync(response);
    }
}