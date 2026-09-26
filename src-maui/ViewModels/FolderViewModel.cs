using CommunityToolkit.Mvvm.ComponentModel;
using Yttv.Models;
using System.Collections.Generic;

namespace Yttv.ViewModels
{
    public partial class FolderViewModel : ObservableObject
    {
        [ObservableProperty]
        private string? _selectedFolder;

        [ObservableProperty]
        private string? _quickAssignFolder;

        [ObservableProperty]
        private Dictionary<int, List<string>> _videoFolderAssignments = new();

        public void SetAssignments(Dictionary<int, List<string>> assignments)
        {
            VideoFolderAssignments = assignments;
        }
    }
}
