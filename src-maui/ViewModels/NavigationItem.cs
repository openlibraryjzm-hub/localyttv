using Yttv.Models;

namespace Yttv.ViewModels
{
    public class NavigationItem
    {
        public string Type { get; set; } = "playlist"; // "playlist" or "folder"
        public Playlist? PlaylistData { get; set; }
        public FolderWithVideos? FolderData { get; set; }
        
        public string Title => Type == "playlist" ? PlaylistData?.Name ?? "" : FolderData?.CustomName ?? FolderData?.FolderColor ?? "";
    }

    public class FolderWithVideos
    {
        public int PlaylistId { get; set; }
        public string FolderColor { get; set; } = string.Empty;
        public string? CustomName { get; set; }
        public string? Description { get; set; }
        public int VideoCount { get; set; }
    }
}
