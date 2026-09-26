using SQLite;

namespace Yttv.Models
{
    [Table("playlist_groups")]
    public class PlaylistGroup
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }

        [Column("name"), NotNull]
        public string Name { get; set; } = string.Empty;

        [Column("folder_color_id")]
        public string? FolderColorId { get; set; }

        [Column("display_mode")]
        public string DisplayMode { get; set; } = "Large"; // Large, Small, Bar

        [Column("sort_order")]
        public int SortOrder { get; set; }
    }
}
