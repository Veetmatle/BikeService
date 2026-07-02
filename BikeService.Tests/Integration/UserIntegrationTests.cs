using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BikeService.Tests.Integration;

public class UserIntegrationTests : IClassFixture<TestWebApplicationFactory>, IAsyncLifetime
{
    private readonly TestWebApplicationFactory _factory;

    public UserIntegrationTests(TestWebApplicationFactory factory)
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

    private async Task<HttpClient> AdminClientAsync() =>
        AuthenticatedClient(await LoginAsync("admin@test.com", "AdminPass123!"));

    private async Task<HttpClient> MechanicClientAsync() =>
        AuthenticatedClient(await LoginAsync("mechanic@test.com", "MechPass123!"));

    [Fact]
    public async Task GetUsers_WithAdminToken_Returns200WithList()
    {
        var client   = await AdminClientAsync();
        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Array, body.ValueKind);
        Assert.True(body.GetArrayLength() >= 2);
    }

    [Fact]
    public async Task CreateUser_WithAdminToken_Returns201WithNewUser()
    {
        var client   = await AdminClientAsync();
        var response = await client.PostAsJsonAsync("/api/users", new
        {
            username = "newmechanic",
            email    = "newmech@test.com",
            password = "Mechanic123!",
            role     = "MECHANIC",
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("newmechanic", body.GetProperty("username").GetString());
        Assert.Equal("MECHANIC",    body.GetProperty("role").GetString());
    }

    [Fact]
    public async Task CreateUser_DuplicateEmail_Returns400()
    {
        var client = await AdminClientAsync();

        await client.PostAsJsonAsync("/api/users", new
        {
            username = "dup1",
            email    = "duplicate@test.com",
            password = "Pass123!",
            role     = "MECHANIC",
        });

        var response = await client.PostAsJsonAsync("/api/users", new
        {
            username = "dup2",
            email    = "duplicate@test.com",
            password = "Pass123!",
            role     = "MECHANIC",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetUserById_ExistingUser_Returns200()
    {
        var client = await AdminClientAsync();

        var createResp = await client.PostAsJsonAsync("/api/users", new
        {
            username = "getbyid_user",
            email    = "getbyid@test.com",
            password = "Pass123!",
            role     = "MECHANIC",
        });
        createResp.EnsureSuccessStatusCode();
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
                    .GetProperty("id").GetInt32();

        var getResp = await client.GetAsync($"/api/users/{id}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var body = await getResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("getbyid_user", body.GetProperty("username").GetString());
    }

    [Fact]
    public async Task UpdateUser_WithAdminToken_Returns200WithUpdatedData()
    {
        var client = await AdminClientAsync();

        var createResp = await client.PostAsJsonAsync("/api/users", new
        {
            username = "update_before",
            email    = "update_before@test.com",
            password = "Pass123!",
            role     = "MECHANIC",
        });
        createResp.EnsureSuccessStatusCode();
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
                    .GetProperty("id").GetInt32();

        var putResp = await client.PutAsJsonAsync($"/api/users/{id}", new
        {
            username = "update_after",
            email    = "update_before@test.com",
            role     = "MECHANIC",
            isActive = true,
        });

        Assert.Equal(HttpStatusCode.OK, putResp.StatusCode);
        var body = await putResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("update_after", body.GetProperty("username").GetString());
    }

    [Fact]
    public async Task DeleteUser_WithAdminToken_Returns204()
    {
        var client = await AdminClientAsync();

        var createResp = await client.PostAsJsonAsync("/api/users", new
        {
            username = "to_delete",
            email    = "to_delete@test.com",
            password = "Pass123!",
            role     = "MECHANIC",
        });
        createResp.EnsureSuccessStatusCode();
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
                    .GetProperty("id").GetInt32();

        var deleteResp = await client.DeleteAsync($"/api/users/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);
    }

    [Fact]
    public async Task CreateUser_InvalidRole_Returns400()
    {
        var client   = await AdminClientAsync();
        var response = await client.PostAsJsonAsync("/api/users", new
        {
            username = "badrole_user",
            email    = "badrole@test.com",
            password = "Pass123!",
            role     = "SUPERADMIN",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
