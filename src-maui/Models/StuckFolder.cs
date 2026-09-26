using SQLite;

namespace Yttv.Models
{
    [Table("stuck_folders")]
    public class StuckFolder
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }

        [Column("playlist_id"), Indexed, NotNull]
        public int PlaylistId { get; set; }

        [Column("folder_color"), NotNull]
        public string FolderColor { get; set; } = string.Empty;

        [Column("created_at"), NotNull]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
    }
}
