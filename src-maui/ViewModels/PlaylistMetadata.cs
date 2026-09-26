using Yttv.Models;

namespace Yttv.ViewModels
{
    public class PlaylistMetadata
    {
        public Playlist Playlist { get; set; } = new();
        public int ItemCount { get; set; }
        public string? ThumbnailUrl { get; set; }
    }
}
