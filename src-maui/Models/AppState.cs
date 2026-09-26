using SQLite;

namespace Yttv.Models
{
    [Table("app_state")]
    public class AppState
    {
        [PrimaryKey]
        [Column("key")]
        public string Key { get; set; } = string.Empty;

        [Column("value")]
        public string? Value { get; set; }
    }
}
