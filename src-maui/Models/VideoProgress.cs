using SQLite;

namespace Yttv.Models
{
    [Table("video_progress")]
    public class VideoProgress
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }

        [Column("video_id"), Unique, Indexed, NotNull]
        public string VideoId { get; set; } = string.Empty;

        [Column("video_url"), NotNull]
        public string VideoUrl { get; set; } = string.Empty;

        [Column("duration")]
        public double? Duration { get; set; }

        [Column("last_progress"), NotNull]
        public double LastProgress { get; set; } = 0;

        [Column("progress_percentage"), NotNull]
        public double ProgressPercentage { get; set; } = 0;

        [Column("last_updated"), NotNull]
        public string LastUpdated { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        [Column("has_fully_watched"), NotNull]
        public int HasFullyWatched { get; set; } = 0; // 0 = false, 1 = true
    }
}
