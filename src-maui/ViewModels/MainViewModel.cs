using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CommunityToolkit.Mvvm.Messaging;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Yttv.Services;

namespace Yttv.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly DatabaseService _databaseService;
        private readonly YouTubeApiService _youtubeApiService;

        public ConfigViewModel Config { get; }
        public LayoutViewModel Layout { get; }
        public NavigationViewModel Navigation { get; }
        public PlaylistViewModel Playlist { get; }
        public FolderViewModel Folder { get; }
        public GroupViewModel Group { get; }

        public MainViewModel(DatabaseService databaseService, YouTubeApiService youtubeApiService)
        {
            _databaseService = databaseService;
            _youtubeApiService = youtubeApiService;

            Config = new ConfigViewModel();
            Layout = new LayoutViewModel();
            Navigation = new NavigationViewModel();
            Playlist = new PlaylistViewModel(databaseService, youtubeApiService);
            Folder = new FolderViewModel();
            Group = new GroupViewModel(databaseService);

            // Register for navigation messages
            WeakReferenceMessenger.Default.Register<NavigationMessage>(this, (r, m) =>
            {
                Navigation.SetCurrentPageCommand.Execute(m.Value);
            });

            // Register for refresh messages
            WeakReferenceMessenger.Default.Register<RefreshPlaylistsMessage>(this, (r, m) =>
            {
                MainThread.BeginInvokeOnMainThread(async () => {
                    await RefreshAllAsync();
                    IsImportModalVisible = false;
                });
            });
        }

        [ObservableProperty]
        private bool _isImportModalVisible;

        [RelayCommand]
        public void ToggleImportModal()
        {
            IsImportModalVisible = !IsImportModalVisible;
        }

        public async Task RefreshAllAsync()
        {
            var metadata = await _databaseService.GetAllPlaylistMetadataAsync();
            Playlist.AllPlaylists = new System.Collections.ObjectModel.ObservableCollection<PlaylistMetadata>(metadata);
            
            // Initial build of navigation items
            Playlist.BuildNavigationItems(metadata.Select(m => m.Playlist).ToList(), new List<FolderWithVideos>());
            
            await Group.LoadGroupsAsync();
        }
    }
}
