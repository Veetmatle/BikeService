using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BikeService.Tests.Integration;

public class ServiceOrderIntegrationTests : IClassFixture<TestWebApplicationFactory>, IAsyncLifetime
{
    private readonly TestWebApplicationFactory _factory;

    public ServiceOrderIntegrationTests(TestWebApplicationFactory factory)
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
        var response = await NewClient().PostAsJsonAsync("/api/auth/login", new { email, password });
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

    private async Task<HttpClient> MechanicClientAsync() =>
        AuthenticatedClient(await LoginAsync("mechanic@test.com", "MechPass123!"));

    private async Task<HttpClient> AdminClientAsync() =>
        AuthenticatedClient(await LoginAsync("admin@test.com", "AdminPass123!"));

    private static object ValidOrderPayload(string suffix = "") => new
    {
        clientFirstName       = "Jan",
        clientLastName        = "Kowalski" + suffix,
        clientPhone           = "123456789",
        clientEmail           = $"jan{suffix}@test.com",
        bikeBrand             = "Trek",
        bikeModel             = "Marlin 7",
        bikeType              = "Górski",
        description           = "Wymiana przerzutki tylnej",
    };


    [Fact]
    public async Task GetOrders_WithoutToken_Returns401()
    {
        var response = await NewClient().GetAsync("/api/orders");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateOrder_WithMechanicToken_Returns201WithOrderId()
    {
        var client   = await MechanicClientAsync();
        var response = await client.PostAsJsonAsync("/api/orders", ValidOrderPayload("_create"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("id").GetInt32() > 0);
    }

    [Fact]
    public async Task GetOrders_WithToken_Returns200WithPagedResult()
    {
        var client   = await MechanicClientAsync();
        var response = await client.GetAsync("/api/orders?page=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("items", out _));
        Assert.True(body.TryGetProperty("totalCount", out _));
        Assert.True(body.TryGetProperty("totalPages", out _));
    }

    [Fact]
    public async Task GetOrderById_ExistingOrder_Returns200WithDetails()
    {
        var client = await MechanicClientAsync();

        var createResp = await client.PostAsJsonAsync("/api/orders", ValidOrderPayload("_getbyid"));
        createResp.EnsureSuccessStatusCode();
        var created = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var id      = created.GetProperty("id").GetInt32();

        var getResp = await client.GetAsync($"/api/orders/{id}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);

        var body = await getResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(id, body.GetProperty("id").GetInt32());
        Assert.Equal("Trek", body.GetProperty("bikeBrand").GetString());
    }

    [Fact]
    public async Task GetOrderById_NonExistentId_Returns404()
    {
        var client   = await MechanicClientAsync();
        var response = await client.GetAsync("/api/orders/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ChangeStatus_ValidTransition_Returns200WithNewStatus()
    {
        var client = await MechanicClientAsync();

        var createResp = await client.PostAsJsonAsync("/api/orders", ValidOrderPayload("_status"));
        createResp.EnsureSuccessStatusCode();
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
                    .GetProperty("id").GetInt32();

        var patchResp = await client.PatchAsJsonAsync($"/api/orders/{id}/status", new
        {
            status = 1,
        });

        Assert.Equal(HttpStatusCode.OK, patchResp.StatusCode);
        var body = await patchResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("InProgress", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task UpdateOrder_WithMechanicToken_Returns200WithUpdatedData()
    {
        var client = await MechanicClientAsync();

        var createResp = await client.PostAsJsonAsync("/api/orders", ValidOrderPayload("_upd"));
        createResp.EnsureSuccessStatusCode();
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
                    .GetProperty("id").GetInt32();

        var putResp = await client.PutAsJsonAsync($"/api/orders/{id}", new
        {
            clientFirstName = "Janusz",
            clientLastName  = "Nowak",
            clientPhone     = "987654321",
            clientEmail     = "janusz_upd@test.com",
            bikeBrand       = "Giant",
            bikeModel       = "Talon 3",
            bikeType        = "MTB",
            description     = "Regulacja przerzutek",
        });

        Assert.Equal(HttpStatusCode.OK, putResp.StatusCode);
        var body = await putResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Giant", body.GetProperty("bikeBrand").GetString());
    }

    [Fact]
    public async Task TrackOrder_WithValidToken_Returns200()
    {
        var client = await MechanicClientAsync();

        var createResp = await client.PostAsJsonAsync("/api/orders", ValidOrderPayload("_track"));
        createResp.EnsureSuccessStatusCode();
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
                    .GetProperty("id").GetInt32();

        var trackingToken = await _factory.GetOrderTrackingTokenAsync(id);
        var trackResp = await NewClient().GetAsync($"/api/orders/track/{trackingToken}");
        Assert.Equal(HttpStatusCode.OK, trackResp.StatusCode);
    }

    [Fact]
    public async Task DeleteOrder_WithAdminToken_Returns204()
    {
        var mechClient  = await MechanicClientAsync();
        var adminClient = await AdminClientAsync();

        var createResp = await mechClient.PostAsJsonAsync("/api/orders", ValidOrderPayload("_del"));
        createResp.EnsureSuccessStatusCode();
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
                    .GetProperty("id").GetInt32();

        var deleteResp = await adminClient.DeleteAsync($"/api/orders/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);
    }
}
