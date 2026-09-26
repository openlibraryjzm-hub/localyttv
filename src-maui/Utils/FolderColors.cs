using System.Collections.Generic;

namespace Yttv.Utils
{
    public class FolderColor
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Hex { get; set; } = string.Empty;
    }

    public static class FolderColors
    {
        public static readonly List<FolderColor> All = new List<FolderColor>
        {
            new FolderColor { Id = "red", Name = "Red", Hex = "#ef4444" },
            new FolderColor { Id = "orange", Name = "Orange", Hex = "#f97316" },
            new FolderColor { Id = "amber", Name = "Amber", Hex = "#f59e0b" },
            new FolderColor { Id = "yellow", Name = "Yellow", Hex = "#eab308" },
            new FolderColor { Id = "lime", Name = "Lime", Hex = "#84cc16" },
            new FolderColor { Id = "green", Name = "Green", Hex = "#22c55e" },
            new FolderColor { Id = "emerald", Name = "Emerald", Hex = "#10b981" },
            new FolderColor { Id = "teal", Name = "Teal", Hex = "#14b8a6" },
            new FolderColor { Id = "cyan", Name = "Cyan", Hex = "#06b6d4" },
            new FolderColor { Id = "sky", Name = "Sky", Hex = "#0ea5e9" },
            new FolderColor { Id = "blue", Name = "Blue", Hex = "#3b82f6" },
            new FolderColor { Id = "indigo", Name = "Indigo", Hex = "#6366f1" },
            new FolderColor { Id = "violet", Name = "Violet", Hex = "#8b5cf6" },
            new FolderColor { Id = "purple", Name = "Purple", Hex = "#a855f7" },
            new FolderColor { Id = "fuchsia", Name = "Fuchsia", Hex = "#d946ef" },
            new FolderColor { Id = "pink", Name = "Pink", Hex = "#ec4899" }
        };

        public static FolderColor GetById(string id)
        {
            return All.Find(c => c.Id == id) ?? All[0];
        }
    }
}
