using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BikeService.Tests.Integration;

public class AuthIntegrationTests : IClassFixture<TestWebApplicationFactory>, IAsyncLifetime
{
    private readonly TestWebApplicationFactory _factory;

    public AuthIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        await _factory.SeedUsersAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private HttpClient NewClient() => _factory.CreateClient();

    private async Task<string> LoginAsync(string email, string password)
    {
        var client   = NewClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("accessToken").GetString()!;
    }

    private HttpClient AuthenticatedClient(string token)
    {
        var client = NewClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithAccessToken()
    {
        var response = await NewClient().PostAsJsonAsync("/api/auth/login", new
        {
            email    = "admin@test.com",
            password = "AdminPass123!",
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("accessToken", out var token));
        Assert.False(string.IsNullOrEmpty(token.GetString()));
    }

    [Fact]
    public async Task Login_WrongPassword_Returns400()
    {
        var response = await NewClient().PostAsJsonAsync("/api/auth/login", new
        {
            email    = "admin@test.com",
            password = "NotTheRightPassword!",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetProfile_WithValidToken_Returns200WithUserEmail()
    {
        var token  = await LoginAsync("mechanic@test.com", "MechPass123!");
        var client = AuthenticatedClient(token);

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("mechanic@test.com", body.GetProperty("email").GetString());
    }

    [Fact]
    public async Task GetProfile_WithoutToken_Returns401()
    {
        var response = await NewClient().GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
