namespace BikeService.Models;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<User> Users { get; set; } = [];
}

public static class Roles
{
    public const string Admin = "ADMIN";
    public const string Mechanic = "MECHANIC";
}