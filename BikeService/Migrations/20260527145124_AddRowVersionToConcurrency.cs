using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikeService.Migrations
{
    /// <inheritdoc />
    public partial class AddRowVersionToConcurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RowVersion",
                table: "ServiceOrders",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "ServiceOrders");
        }
    }
}
