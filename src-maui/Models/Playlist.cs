using SQLite;

namespace Yttv.Models
{
    [Table("playlists")]
    public class Playlist
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }

        [Column("name"), NotNull]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("created_at"), NotNull]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        [Column("updated_at"), NotNull]
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        [Column("youtube_id")]
        public string? YoutubeId { get; set; }

        [Column("custom_ascii")]
        public string? CustomAscii { get; set; }

        [Column("custom_thumbnail_url")]
        public string? CustomThumbnailUrl { get; set; }
    }
}
