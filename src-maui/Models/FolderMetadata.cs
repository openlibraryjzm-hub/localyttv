using SQLite;

namespace Yttv.Models
{
    [Table("folder_metadata")]
    public class FolderMetadata
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }

        [Column("playlist_id"), Indexed, NotNull]
        public int PlaylistId { get; set; }

        [Column("folder_color"), NotNull]
        public string FolderColor { get; set; } = string.Empty;

        [Column("custom_name")]
        public string? CustomName { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("custom_ascii")]
        public string? CustomAscii { get; set; }

        [Column("created_at"), NotNull]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        [Column("updated_at"), NotNull]
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
    }
}
