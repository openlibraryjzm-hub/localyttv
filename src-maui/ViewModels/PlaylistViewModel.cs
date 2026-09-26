using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CommunityToolkit.Mvvm.Messaging;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using Yttv.Models;
using Yttv.Services;

namespace Yttv.ViewModels
{
    public partial class PlaylistViewModel : ObservableObject
    {
        private readonly DatabaseService _databaseService;
        private readonly YouTubeApiService _youtubeApiService;

        public PlaylistViewModel(DatabaseService databaseService, YouTubeApiService youtubeApiService)
        {
            _databaseService = databaseService;
            _youtubeApiService = youtubeApiService;
        }

        [ObservableProperty]
        private ObservableCollection<PlaylistItem> _currentPlaylistItems = new();

        [ObservableProperty]
        private int? _currentPlaylistId;

        [ObservableProperty]
        private int _currentVideoIndex = 0;

        [ObservableProperty]
        private ObservableCollection<PlaylistMetadata> _allPlaylists = new();

        [RelayCommand]
        public async Task SelectPlaylist(PlaylistMetadata metadata)
        {
            var items = await _databaseService.GetPlaylistItemsAsync(metadata.Playlist.Id);
            await SetPlaylistItems(items, metadata.Playlist.Id);
            CurrentPlaylistTitle = metadata.Playlist.Name;
            
            // Navigate to videos page via message
            WeakReferenceMessenger.Default.Send(new NavigationMessage("videos"));
        }

        [ObservableProperty]
        private int _currentPlaylistIndex = -1;

        [ObservableProperty]
        private ObservableCollection<NavigationItem> _navigationItems = new();

        [ObservableProperty]
        private int _currentNavigationIndex = -1;

        [ObservableProperty]
        private FolderWithVideos? _currentFolder;

        [ObservableProperty]
        private string? _currentPlaylistTitle;

        [ObservableProperty]
        private bool _isImporting;

        [RelayCommand]
        public async Task ImportPlaylist(object[] parameters)
        {
            if (parameters.Length < 2) return;
            string name = parameters[0] as string ?? "";
            string url = parameters[1] as string ?? "";
            
            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(url)) return;

            IsImporting = true;
            try
            {
                var playlistId = ExtractPlaylistId(url);
                if (string.IsNullOrEmpty(playlistId)) return;

                // 1. Save Playlist to DB
                var playlist = new Playlist { Name = name, YoutubeId = playlistId };
                await _databaseService.SavePlaylistAsync(playlist);

                // 2. Fetch items from YouTube
                var items = await _youtubeApiService.FetchPlaylistItemsAsync(playlistId);
                foreach (var item in items)
                {
                    item.PlaylistId = playlist.Id;
                    await _databaseService.AddVideoToPlaylistAsync(item);
                }

                // 3. Refresh and close
                WeakReferenceMessenger.Default.Send(new RefreshPlaylistsMessage(true));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Import Error: {ex.Message}");
            }
            finally
            {
                IsImporting = false;
            }
        }

        private string? ExtractPlaylistId(string url)
        {
            if (url.Contains("list="))
            {
                var parts = url.Split("list=");
                if (parts.Length > 1) return parts[1].Split('&')[0];
            }
            return url; // Assume it's just the ID
        }

        [ObservableProperty]
        private string _activeFolderFilter = "all"; // "all", "red", "orange", etc.

        public PlaylistItem? CurrentVideo => (CurrentPlaylistItems.Count > 0 && CurrentVideoIndex >= 0 && CurrentVideoIndex < CurrentPlaylistItems.Count)
            ? CurrentPlaylistItems[CurrentVideoIndex]
            : null;

        [RelayCommand]
        public void SetCurrentVideo(PlaylistItem item)
        {
            var index = CurrentPlaylistItems.IndexOf(item);
            if (index >= 0)
            {
                CurrentVideoIndex = index;
                OnPropertyChanged(nameof(CurrentVideo));
            }
        }

        public async Task SetPlaylistItems(List<PlaylistItem> items, int? playlistId = null, FolderWithVideos? folderInfo = null)
        {
            CurrentPlaylistItems = new ObservableCollection<PlaylistItem>(items);
            CurrentPlaylistId = playlistId;
            CurrentFolder = folderInfo;

            if (playlistId.HasValue)
            {
                // Restore last video index from DB
                var lastIndexStr = await _databaseService.GetAppStateAsync($"last_video_index_{playlistId}");
                if (int.TryParse(lastIndexStr, out int lastIndex) && lastIndex >= 0 && lastIndex < items.Count)
                {
                    CurrentVideoIndex = lastIndex;
                }
                else
                {
                    CurrentVideoIndex = 0;
                }

                // Update current playlist index
                for (int i = 0; i < AllPlaylists.Count; i++)
                {
                    if (AllPlaylists[i].Playlist.Id == playlistId.Value)
                    {
                        CurrentPlaylistIndex = i;
                        break;
                    }
                }

                // Update navigation index
                UpdateNavigationIndex();
            }
            
            OnPropertyChanged(nameof(CurrentVideo));
        }

        private void UpdateNavigationIndex()
        {
            if (CurrentFolder != null)
            {
                for (int i = 0; i < NavigationItems.Count; i++)
                {
                    if (NavigationItems[i].Type == "folder" && 
                        NavigationItems[i].FolderData?.PlaylistId == CurrentFolder.PlaylistId &&
                        NavigationItems[i].FolderData?.FolderColor == CurrentFolder.FolderColor)
                    {
                        CurrentNavigationIndex = i;
                        return;
                    }
                }
            }
            else if (CurrentPlaylistId.HasValue)
            {
                for (int i = 0; i < NavigationItems.Count; i++)
                {
                    if (NavigationItems[i].Type == "playlist" && NavigationItems[i].PlaylistData?.Id == CurrentPlaylistId.Value)
                    {
                        CurrentNavigationIndex = i;
                        return;
                    }
                }
            }
            CurrentNavigationIndex = -1;
        }

        [RelayCommand]
        public async Task NextVideo()
        {
            if (CurrentPlaylistItems.Count == 0) return;
            CurrentVideoIndex = (CurrentVideoIndex + 1) % CurrentPlaylistItems.Count;
            
            if (CurrentPlaylistId.HasValue)
            {
                await _databaseService.SaveAppStateAsync($"last_video_index_{CurrentPlaylistId}", CurrentVideoIndex.ToString());
            }
            OnPropertyChanged(nameof(CurrentVideo));
        }

        [RelayCommand]
        public async Task PreviousVideo()
        {
            if (CurrentPlaylistItems.Count == 0) return;
            CurrentVideoIndex = CurrentVideoIndex == 0 ? CurrentPlaylistItems.Count - 1 : CurrentVideoIndex - 1;
            
            if (CurrentPlaylistId.HasValue)
            {
                await _databaseService.SaveAppStateAsync($"last_video_index_{CurrentPlaylistId}", CurrentVideoIndex.ToString());
            }
            OnPropertyChanged(nameof(CurrentVideo));
        }

        [RelayCommand]
        public async Task NextPlaylist()
        {
            if (NavigationItems.Count == 0) return;
            
            int nextIndex = (CurrentNavigationIndex + 1) % NavigationItems.Count;
            var nextItem = NavigationItems[nextIndex];
            
            await LoadNavigationItem(nextItem, nextIndex);
        }

        [RelayCommand]
        public async Task PreviousPlaylist()
        {
            if (NavigationItems.Count == 0) return;
            
            int prevIndex = CurrentNavigationIndex <= 0 ? NavigationItems.Count - 1 : CurrentNavigationIndex - 1;
            var prevItem = NavigationItems[prevIndex];
            
            await LoadNavigationItem(prevItem, prevIndex);
        }

        private async Task LoadNavigationItem(NavigationItem item, int index)
        {
            if (item.Type == "playlist" && item.PlaylistData != null)
            {
                var videos = await _databaseService.GetPlaylistItemsAsync(item.PlaylistData.Id);
                await SetPlaylistItems(videos, item.PlaylistData.Id);
            }
            else if (item.Type == "folder" && item.FolderData != null)
            {
                var videos = await _databaseService.GetVideosInFolderAsync(item.FolderData.PlaylistId, item.FolderData.FolderColor);
                await SetPlaylistItems(videos, item.FolderData.PlaylistId, item.FolderData);
            }
        }

        [RelayCommand]
        public async Task ShufflePlaylist()
        {
            if (CurrentPlaylistItems.Count <= 1) return;
            
            var list = CurrentPlaylistItems.ToList();
            Random rng = new Random();
            int n = list.Count;
            while (n > 1)
            {
                n--;
                int k = rng.Next(n + 1);
                var value = list[k];
                list[k] = list[n];
                list[n] = value;
            }
            
            CurrentPlaylistItems = new ObservableCollection<PlaylistItem>(list);
            CurrentVideoIndex = 0;
            
            if (CurrentPlaylistId.HasValue)
            {
                await _databaseService.SaveAppStateAsync($"last_video_index_{CurrentPlaylistId}", "0");
                // Shuffled order persistence could be added here if needed to survive app restart
            }
            OnPropertyChanged(nameof(CurrentVideo));
        }

        [RelayCommand]
        public void CycleFolderFilter()
        {
            // Simplified cycle for now, will be expanded in Phase 7
            // All -> Red -> Orange -> ... -> All
            // For now just toggle All/Red
            ActiveFolderFilter = ActiveFolderFilter == "all" ? "red" : "all";
        }

        public void BuildNavigationItems(List<Playlist> playlists, List<FolderWithVideos> folders)
        {
            var items = new List<NavigationItem>();
            var foldersByPlaylist = folders.GroupBy(f => f.PlaylistId).ToDictionary(g => g.Key, g => g.ToList());

            foreach (var p in playlists)
            {
                items.Add(new NavigationItem { Type = "playlist", PlaylistData = p });
                if (foldersByPlaylist.ContainsKey(p.Id))
                {
                    foreach (var f in foldersByPlaylist[p.Id].OrderBy(f => f.FolderColor))
                    {
                        items.Add(new NavigationItem { Type = "folder", FolderData = f });
                    }
                }
            }

            NavigationItems = new ObservableCollection<NavigationItem>(items);
            UpdateNavigationIndex();
        }
    }
}
