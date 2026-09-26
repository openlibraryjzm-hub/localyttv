using SQLite;

namespace Yttv.Models
{
    [Table("watch_history")]
    public class WatchHistoryEntry
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }

        [Column("video_url"), NotNull]
        public string VideoUrl { get; set; } = string.Empty;

        [Column("video_id"), Indexed, NotNull]
        public string VideoId { get; set; } = string.Empty;

        [Column("title")]
        public string? Title { get; set; }

        [Column("thumbnail_url")]
        public string? ThumbnailUrl { get; set; }

        [Column("watched_at"), Indexed, NotNull]
        public string WatchedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
    }
}
