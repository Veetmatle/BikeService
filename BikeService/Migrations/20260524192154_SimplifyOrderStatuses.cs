using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikeService.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyOrderStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Accepted (usunięty status) → InProgress (Realizacja)
            migrationBuilder.Sql("UPDATE \"ServiceOrders\" SET \"Status\" = 'InProgress' WHERE \"Status\" = 'Accepted'");
            // Done (usunięty status) → ReadyForPickup (Do odbioru)
            migrationBuilder.Sql("UPDATE \"ServiceOrders\" SET \"Status\" = 'ReadyForPickup' WHERE \"Status\" = 'Done'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Przywrócenie jest stratne – nie można odróżnić oryginalnych od skonwertowanych
        }
    }
}
