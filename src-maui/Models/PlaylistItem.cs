using SQLite;

namespace Yttv.Models
{
    [Table("playlist_items")]
    public class PlaylistItem
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }

        [Column("playlist_id"), Indexed, NotNull]
        public int PlaylistId { get; set; }

        [Column("video_url"), NotNull]
        public string VideoUrl { get; set; } = string.Empty;

        [Column("video_id"), NotNull]
        public string VideoId { get; set; } = string.Empty;

        [Column("title")]
        public string? Title { get; set; }

        [Column("thumbnail_url")]
        public string? ThumbnailUrl { get; set; }

        [Column("author")]
        public string? Author { get; set; }

        [Column("view_count")]
        public string? ViewCount { get; set; }

        [Column("position"), NotNull]
        public int Position { get; set; }

        [Column("added_at"), NotNull]
        public string AddedAt { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        [Column("is_local"), NotNull]
        public int IsLocal { get; set; } = 0; // 0 = false, 1 = true

        [Column("published_at")]
        public string? PublishedAt { get; set; }

        [Column("profile_image_url")]
        public string? ProfileImageUrl { get; set; }

        [Column("drumstick_rating"), NotNull]
        public int DrumstickRating { get; set; } = 0;

        [Column("duration_seconds")]
        public int? DurationSeconds { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("tags")]
        public string? Tags { get; set; } // JSON array of strings

        [Column("like_count")]
        public string? LikeCount { get; set; }

        [Column("comment_count")]
        public string? CommentCount { get; set; }
    }
}
