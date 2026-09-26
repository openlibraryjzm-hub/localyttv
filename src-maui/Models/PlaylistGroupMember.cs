using SQLite;

namespace Yttv.Models
{
    [Table("playlist_group_members")]
    public class PlaylistGroupMember
    {
        [PrimaryKey, AutoIncrement]
        [Column("id")]
        public int Id { get; set; }

        [Column("group_id"), Indexed, NotNull]
        public int GroupId { get; set; }

        [Column("playlist_id"), Indexed, NotNull]
        public int PlaylistId { get; set; }

        [Column("position"), NotNull]
        public int Position { get; set; }
    }
}
