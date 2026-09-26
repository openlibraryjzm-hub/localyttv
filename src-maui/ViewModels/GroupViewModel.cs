using CommunityToolkit.Mvvm.ComponentModel;
using System.Threading.Tasks;
using System.Collections.ObjectModel;
using Yttv.Models;
using Yttv.Services;

namespace Yttv.ViewModels
{
    public partial class GroupViewModel : ObservableObject
    {
        private readonly DatabaseService _databaseService;

        public GroupViewModel(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        [ObservableProperty]
        private ObservableCollection<PlaylistGroup> _allGroups = new();

        [ObservableProperty]
        private int? _activeGroupId;

        public async Task LoadGroupsAsync()
        {
            var groups = await _databaseService.GetAllGroupsAsync();
            AllGroups = new ObservableCollection<PlaylistGroup>(groups);
        }
    }
}
