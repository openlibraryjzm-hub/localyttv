using SQLite;
using Yttv.Models;
using Yttv.ViewModels;

namespace Yttv.Services
{
    public class DatabaseService
    {
        private SQLiteAsyncConnection? _database;
        private readonly string _dbPath;

        public DatabaseService()
        {
            _dbPath = Path.Combine(FileSystem.AppDataDirectory, "playlists.db3");
        }

        private async Task Init()
        {
            if (_database is not null)
                return;

            try 
            {
                System.Diagnostics.Debug.WriteLine($"YTTV DB: Initializing at {_dbPath}");
                _database = new SQLiteAsyncConnection(_dbPath, SQLiteOpenFlags.ReadWrite | SQLiteOpenFlags.Create | SQLiteOpenFlags.SharedCache);

                await _database.CreateTableAsync<Playlist>();
                await _database.CreateTableAsync<PlaylistItem>();
                await _database.CreateTableAsync<VideoFolderAssignment>();
                await _database.CreateTableAsync<WatchHistoryEntry>();
                await _database.CreateTableAsync<VideoProgress>();
                await _database.CreateTableAsync<StuckFolder>();
                await _database.CreateTableAsync<FolderMetadata>();
                await _database.CreateTableAsync<PlaylistGroup>();
                await _database.CreateTableAsync<PlaylistGroupMember>();
                await _database.CreateTableAsync<AppState>();
                System.Diagnostics.Debug.WriteLine("YTTV DB: Tables Created Successfully");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"YTTV DB Error: {ex.Message}");
                throw;
            }
        }

        // Playlist Operations
        public async Task<List<Playlist>> GetAllPlaylistsAsync()
        {
            await Init();
            return await _database!.Table<Playlist>().OrderByDescending(p => p.CreatedAt).ToListAsync();
        }

        public async Task<Playlist?> GetPlaylistAsync(int id)
        {
            await Init();
            return await _database!.Table<Playlist>().Where(p => p.Id == id).FirstOrDefaultAsync();
        }

        public async Task<int> SavePlaylistAsync(Playlist playlist)
        {
            await Init();
            if (playlist.Id != 0)
            {
                playlist.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
                return await _database!.UpdateAsync(playlist);
            }
            else
            {
                return await _database!.InsertAsync(playlist);
            }
        }

        public async Task<int> DeletePlaylistAsync(int id)
        {
            await Init();
            await _database!.Table<PlaylistItem>().Where(i => i.PlaylistId == id).DeleteAsync();
            await _database!.Table<VideoFolderAssignment>().Where(a => a.PlaylistId == id).DeleteAsync();
            await _database!.Table<StuckFolder>().Where(f => f.PlaylistId == id).DeleteAsync();
            await _database!.Table<FolderMetadata>().Where(m => m.PlaylistId == id).DeleteAsync();
            await _database!.Table<PlaylistGroupMember>().Where(m => m.PlaylistId == id).DeleteAsync();
            
            return await _database!.Table<Playlist>().Where(p => p.Id == id).DeleteAsync();
        }

        public async Task<List<PlaylistMetadata>> GetAllPlaylistMetadataAsync()
        {
            await Init();
            var playlists = await GetAllPlaylistsAsync();
            var metadata = new List<PlaylistMetadata>();

            foreach (var p in playlists)
            {
                var itemCount = await _database!.Table<PlaylistItem>().Where(i => i.PlaylistId == p.Id).CountAsync();
                var firstItem = await _database!.Table<PlaylistItem>()
                    .Where(i => i.PlaylistId == p.Id)
                    .OrderBy(i => i.Position)
                    .FirstOrDefaultAsync();

                metadata.Add(new PlaylistMetadata
                {
                    Playlist = p,
                    ItemCount = itemCount,
                    ThumbnailUrl = p.CustomThumbnailUrl ?? firstItem?.ThumbnailUrl
                });
            }

            return metadata;
        }

        // Playlist Item Operations
        public async Task<List<PlaylistItem>> GetPlaylistItemsAsync(int playlistId)
        {
            await Init();
            return await _database!.Table<PlaylistItem>()
                .Where(i => i.PlaylistId == playlistId)
                .OrderBy(i => i.Position)
                .ToListAsync();
        }

        public async Task<int> AddVideoToPlaylistAsync(PlaylistItem item)
        {
            await Init();
            // Get max position
            var maxPos = await _database!.ExecuteScalarAsync<int>(
                "SELECT COALESCE(MAX(position), -1) FROM playlist_items WHERE playlist_id = ?", item.PlaylistId);
            
            item.Position = maxPos + 1;
            item.AddedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
            
            return await _database!.InsertAsync(item);
        }

        public async Task<int> RemoveVideoFromPlaylistAsync(int playlistId, int itemId)
        {
            await Init();
            await _database!.Table<VideoFolderAssignment>().Where(a => a.PlaylistId == playlistId && a.ItemId == itemId).DeleteAsync();
            return await _database!.Table<PlaylistItem>().Where(i => i.PlaylistId == playlistId && i.Id == itemId).DeleteAsync();
        }

        // Folder Operations
        public async Task<List<PlaylistItem>> GetVideosInFolderAsync(int playlistId, string color)
        {
            await Init();
            var query = @"
                SELECT pi.* FROM playlist_items pi
                INNER JOIN video_folder_assignments vfa ON pi.id = vfa.item_id
                WHERE vfa.playlist_id = ? AND vfa.folder_color = ?
                ORDER BY pi.position ASC";
            
            return await _database!.QueryAsync<PlaylistItem>(query, playlistId, color);
        }

        public async Task<List<string>> GetVideoFolderAssignmentsAsync(int playlistId, int itemId)
        {
            await Init();
            var assignments = await _database!.Table<VideoFolderAssignment>()
                .Where(a => a.PlaylistId == playlistId && a.ItemId == itemId)
                .ToListAsync();
            
            return assignments.Select(a => a.FolderColor).ToList();
        }

        public async Task<Dictionary<int, List<string>>> GetAllFolderAssignmentsAsync(int playlistId)
        {
            await Init();
            var assignments = await _database!.Table<VideoFolderAssignment>()
                .Where(a => a.PlaylistId == playlistId)
                .ToListAsync();
            
            return assignments.GroupBy(a => a.ItemId)
                .ToDictionary(g => g.Key, g => g.Select(a => a.FolderColor).ToList());
        }

        // Stuck Folders
        public async Task<bool> ToggleStuckFolderAsync(int playlistId, string color)
        {
            await Init();
            var existing = await _database!.Table<StuckFolder>()
                .Where(f => f.PlaylistId == playlistId && f.FolderColor == color)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                await _database!.DeleteAsync(existing);
                return false;
            }
            else
            {
                await _database!.InsertAsync(new StuckFolder
                {
                    PlaylistId = playlistId,
                    FolderColor = color,
                    CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                });
                return true;
            }
        }

        // Folder Metadata
        public async Task SaveFolderMetadataAsync(FolderMetadata metadata)
        {
            await Init();
            var existing = await _database!.Table<FolderMetadata>()
                .Where(m => m.PlaylistId == metadata.PlaylistId && m.FolderColor == metadata.FolderColor)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                metadata.Id = existing.Id;
                metadata.UpdatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
                await _database!.UpdateAsync(metadata);
            }
            else
            {
                metadata.CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
                metadata.UpdatedAt = metadata.CreatedAt;
                await _database!.InsertAsync(metadata);
            }
        }

        // Watch History
        public async Task AddToWatchHistoryAsync(WatchHistoryEntry entry)
        {
            await Init();
            entry.WatchedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
            await _database!.InsertAsync(entry);
            
            // Limit to 100
            var count = await _database!.Table<WatchHistoryEntry>().CountAsync();
            if (count > 100)
            {
                var toDelete = await _database!.Table<WatchHistoryEntry>()
                    .OrderBy(h => h.WatchedAt)
                    .Take(count - 100)
                    .ToListAsync();
                foreach (var item in toDelete)
                    await _database!.DeleteAsync(item);
            }
        }

        // Video Progress
        public async Task UpdateVideoProgressAsync(VideoProgress progress)
        {
            await Init();
            progress.LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
            
            var existing = await _database!.Table<VideoProgress>()
                .Where(p => p.VideoId == progress.VideoId)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                progress.Id = existing.Id;
                if (existing.HasFullyWatched == 1) progress.HasFullyWatched = 1;
                await _database!.UpdateAsync(progress);
            }
            else
            {
                await _database!.InsertAsync(progress);
            }
        }

        // App State Operations
        public async Task<string?> GetAppStateAsync(string key)
        {
            await Init();
            var state = await _database!.Table<AppState>().Where(s => s.Key == key).FirstOrDefaultAsync();
            return state?.Value;
        }

        public async Task SaveAppStateAsync(string key, string value)
        {
            await Init();
            var state = new AppState { Key = key, Value = value };
            await _database!.InsertOrReplaceAsync(state);
        }

        // Group Operations (New)
        public async Task<List<PlaylistGroup>> GetAllGroupsAsync()
        {
            await Init();
            return await _database!.Table<PlaylistGroup>().OrderBy(g => g.SortOrder).ToListAsync();
        }

        public async Task<int> SaveGroupAsync(PlaylistGroup group)
        {
            await Init();
            if (group.Id != 0) return await _database!.UpdateAsync(group);
            return await _database!.InsertAsync(group);
        }

        public async Task AddPlaylistToGroupAsync(int groupId, int playlistId)
        {
            await Init();
            var maxPos = await _database!.ExecuteScalarAsync<int>(
                "SELECT COALESCE(MAX(position), -1) FROM playlist_group_members WHERE group_id = ?", groupId);
            
            await _database!.InsertAsync(new PlaylistGroupMember
            {
                GroupId = groupId,
                PlaylistId = playlistId,
                Position = maxPos + 1
            });
        }
    }
}
