using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace YTTV
{
    public class DatabaseService
    {
        private readonly string _connectionString;

        public DatabaseService()
        {
            string dbPath = ResolveDbPath();
            _connectionString = $"Data Source={dbPath};";
            Console.WriteLine($"[WPF Backend] Connected to SQLite database at: {dbPath}");
            InitializeSchema();
        }

        private string ResolveDbPath()
        {
            // 1. Walk up the directory tree to find workspace root during local dev
            string currentDir = AppDomain.CurrentDomain.BaseDirectory;
            while (!string.IsNullOrEmpty(currentDir))
            {
                string candidate = Path.Combine(currentDir, "playlists.db");
                if (File.Exists(candidate))
                {
                    return candidate;
                }
                string? parent = Path.GetDirectoryName(currentDir);
                if (parent == currentDir) break; // Root reached
                currentDir = parent ?? "";
            }

            // 2. Fallback to special AppData folder for production portability
            string appData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "YTTV", "playlists.db");
            if (!File.Exists(appData))
            {
                string templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "playlists_default.db");
                if (File.Exists(templatePath))
                {
                    try
                    {
                        string? appDataDir = Path.GetDirectoryName(appData);
                        if (!string.IsNullOrEmpty(appDataDir) && !Directory.Exists(appDataDir))
                        {
                            Directory.CreateDirectory(appDataDir);
                        }
                        File.Copy(templatePath, appData, true);
                        Console.WriteLine($"[WPF Backend] Seeded database from template: {templatePath} to {appData}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[WPF Backend] Error seeding database: {ex.Message}");
                    }
                }
            }
            string? fallbackDir = Path.GetDirectoryName(appData);
            if (!string.IsNullOrEmpty(fallbackDir) && !Directory.Exists(fallbackDir))
            {
                Directory.CreateDirectory(fallbackDir);
            }
            return appData;
        }

        private void InitializeSchema()
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            // Enable Foreign Keys
            using var pragmaCmd = new SqliteCommand("PRAGMA foreign_keys = ON;", connection);
            pragmaCmd.ExecuteNonQuery();

            // Perform schema checks. In Tauri, init_schema() runs CREATE TABLE IF NOT EXISTS.
            // We do the same to guarantee that if playlists.db is empty, it initializes successfully.
            string createPlaylistsTable = @"
                CREATE TABLE IF NOT EXISTS playlists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    custom_ascii TEXT,
                    custom_thumbnail_url TEXT
                );";

            string createPlaylistItemsTable = @"
                CREATE TABLE IF NOT EXISTS playlist_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    playlist_id INTEGER NOT NULL,
                    video_url TEXT NOT NULL,
                    video_id TEXT NOT NULL,
                    title TEXT,
                    thumbnail_url TEXT,
                    author TEXT,
                    view_count TEXT,
                    position INTEGER NOT NULL,
                    added_at TEXT NOT NULL,
                    is_local INTEGER NOT NULL DEFAULT 0,
                    published_at TEXT,
                    profile_image_url TEXT,
                    drumstick_rating INTEGER NOT NULL DEFAULT 0,
                    duration_seconds INTEGER,
                    description TEXT,
                    tags TEXT,
                    like_count TEXT,
                    comment_count TEXT,
                    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
                CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(playlist_id, position);";

            string createFolderAssignmentsTable = @"
                CREATE TABLE IF NOT EXISTS video_folder_assignments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    playlist_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    folder_color TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                    FOREIGN KEY (item_id) REFERENCES playlist_items(id) ON DELETE CASCADE,
                    UNIQUE(playlist_id, item_id, folder_color)
                );
                CREATE INDEX IF NOT EXISTS idx_folder_assignments_playlist_color ON video_folder_assignments(playlist_id, folder_color);
                CREATE INDEX IF NOT EXISTS idx_folder_assignments_item ON video_folder_assignments(item_id);";

            string createWatchHistoryTable = @"
                CREATE TABLE IF NOT EXISTS watch_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    video_url TEXT NOT NULL,
                    video_id TEXT NOT NULL,
                    title TEXT,
                    thumbnail_url TEXT,
                    watched_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON watch_history(watched_at DESC);
                CREATE INDEX IF NOT EXISTS idx_watch_history_video_id ON watch_history(video_id);";

            string createVideoProgressTable = @"
                CREATE TABLE IF NOT EXISTS video_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    video_id TEXT NOT NULL UNIQUE,
                    video_url TEXT NOT NULL,
                    duration REAL,
                    last_progress REAL NOT NULL DEFAULT 0,
                    progress_percentage REAL NOT NULL DEFAULT 0,
                    last_updated TEXT NOT NULL,
                    has_fully_watched INTEGER NOT NULL DEFAULT 0,
                    watch_count INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON video_progress(video_id);";

            string createStuckFoldersTable = @"
                CREATE TABLE IF NOT EXISTS stuck_folders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    playlist_id INTEGER NOT NULL,
                    folder_color TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                    UNIQUE(playlist_id, folder_color)
                );
                CREATE INDEX IF NOT EXISTS idx_stuck_folders_playlist_color ON stuck_folders(playlist_id, folder_color);";

            string createFolderMetadataTable = @"
                CREATE TABLE IF NOT EXISTS folder_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    playlist_id INTEGER NOT NULL,
                    folder_color TEXT NOT NULL,
                    custom_name TEXT,
                    description TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    custom_ascii TEXT,
                    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                    UNIQUE(playlist_id, folder_color)
                );
                CREATE INDEX IF NOT EXISTS idx_folder_metadata_playlist_color ON folder_metadata(playlist_id, folder_color);";

            string createAppSettingsTable = @"
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );";

            ExecuteNonQuery(createPlaylistsTable, connection);
            ExecuteNonQuery(createPlaylistItemsTable, connection);
            ExecuteNonQuery(createFolderAssignmentsTable, connection);
            ExecuteNonQuery(createWatchHistoryTable, connection);
            ExecuteNonQuery(createVideoProgressTable, connection);
            ExecuteNonQuery(createStuckFoldersTable, connection);
            ExecuteNonQuery(createFolderMetadataTable, connection);
            ExecuteNonQuery(createAppSettingsTable, connection);
        }

        private void ExecuteNonQuery(string sql, SqliteConnection conn)
        {
            using var cmd = new SqliteCommand(sql, conn);
            cmd.ExecuteNonQuery();
        }

        private List<Dictionary<string, object>> ExecuteQuery(string sql, Dictionary<string, object>? parameters = null)
        {
            var results = new List<Dictionary<string, object>>();
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            using var cmd = new SqliteCommand(sql, connection);
            if (parameters != null)
            {
                foreach (var p in parameters)
                {
                    cmd.Parameters.AddWithValue(p.Key, p.Value ?? DBNull.Value);
                }
            }

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                var row = new Dictionary<string, object>();
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null! : reader.GetValue(i);
                }
                results.Add(row);
            }
            return results;
        }

        private object? ExecuteScalar(string sql, Dictionary<string, object>? parameters = null)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            using var cmd = new SqliteCommand(sql, connection);
            if (parameters != null)
            {
                foreach (var p in parameters)
                {
                    cmd.Parameters.AddWithValue(p.Key, p.Value ?? DBNull.Value);
                }
            }
            return cmd.ExecuteScalar();
        }

        // --- API Commands Implementation ---

        public List<Dictionary<string, object>> GetAllPlaylists()
        {
            // Tauri: SELECT * FROM playlists ORDER BY created_at DESC (database-schema.md states created_at DESC)
            return ExecuteQuery("SELECT id, name, description, created_at, updated_at, custom_ascii, custom_thumbnail_url FROM playlists ORDER BY created_at DESC;");
        }

        public List<Dictionary<string, object>> GetAllPlaylistMetadata()
        {
            // Returns count, thumbnail, recent titles for playlist view
            // Tauri logic queries all playlists and aggregates video count / thumbnails
            string sql = @"
                SELECT 
                    p.id, 
                    p.name, 
                    p.description,
                    p.custom_ascii,
                    p.custom_thumbnail_url,
                    COUNT(pi.id) as video_count,
                    MAX(CASE WHEN pi.position = 0 THEN pi.thumbnail_url END) as thumbnail_url,
                    MAX(CASE WHEN pi.position = 0 THEN pi.title END) as recent_title
                FROM playlists p
                LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
                GROUP BY p.id
                ORDER BY p.created_at DESC;";
            return ExecuteQuery(sql);
        }

        public Dictionary<string, object>? GetPlaylist(long id)
        {
            var list = ExecuteQuery("SELECT id, name, description, created_at, updated_at, custom_ascii, custom_thumbnail_url FROM playlists WHERE id = @id LIMIT 1;", 
                new Dictionary<string, object> { { "@id", id } });
            return list.Count > 0 ? list[0] : null;
        }

        public long CreatePlaylist(string name, string? description)
        {
            string now = DateTime.UtcNow.ToString("o"); // RFC3339 format
            string sql = "INSERT INTO playlists (name, description, created_at, updated_at) VALUES (@name, @desc, @now, @now); SELECT last_insert_rowid();";
            var idObj = ExecuteScalar(sql, new Dictionary<string, object> {
                { "@name", name },
                { "@desc", description ?? (object)DBNull.Value },
                { "@now", now }
            });
            return Convert.ToInt64(idObj);
        }

        public bool UpdatePlaylist(long id, string? name, string? description, string? customAscii, string? customThumbnailUrl)
        {
            string? finalCustomThumbnailUrl = SaveBase64ImageToCache(customThumbnailUrl, "cover");
            string now = DateTime.UtcNow.ToString("o");
            string sql = @"
                UPDATE playlists 
                SET name = COALESCE(@name, name), 
                    description = COALESCE(@desc, description),
                    custom_ascii = COALESCE(@ascii, custom_ascii),
                    custom_thumbnail_url = COALESCE(@thumb, custom_thumbnail_url),
                    updated_at = @now
                WHERE id = @id;";
            
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@name", (object?)name ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@desc", (object?)description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ascii", (object?)customAscii ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@thumb", (object?)finalCustomThumbnailUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@now", now);

            int affected = cmd.ExecuteNonQuery();
            return affected > 0;
        }

        public bool DeletePlaylist(long id)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand("DELETE FROM playlists WHERE id = @id;", connection);
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool DeletePlaylistByName(string name)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand("DELETE FROM playlists WHERE name = @name;", connection);
            cmd.Parameters.AddWithValue("@name", name);
            return cmd.ExecuteNonQuery() > 0;
        }

        public List<Dictionary<string, object>> GetPlaylistItems(long playlistId)
        {
            string sql = "SELECT * FROM playlist_items WHERE playlist_id = @pid ORDER BY position ASC;";
            return ExecuteQuery(sql, new Dictionary<string, object> { { "@pid", playlistId } });
        }

        public List<Dictionary<string, object>> GetPlaylistItemsPreview(long playlistId, int limit)
        {
            string sql = "SELECT * FROM playlist_items WHERE playlist_id = @pid ORDER BY position ASC LIMIT @limit;";
            return ExecuteQuery(sql, new Dictionary<string, object> { 
                { "@pid", playlistId }, 
                { "@limit", limit } 
            });
        }

        public long AddVideoToPlaylist(
            long playlistId, string videoUrl, string videoId, string? title, string? thumbnailUrl,
            int isLocal, string? author, string? viewCount, string? publishedAt, string? profileImageUrl,
            long? durationSeconds, string? description, string? tags, string? likeCount, string? commentCount)
        {
            string? finalThumbnailUrl = SaveBase64ImageToCache(thumbnailUrl, "thumb");
            // Position calculation: max position + 1
            object? maxPosObj = ExecuteScalar("SELECT MAX(position) FROM playlist_items WHERE playlist_id = @pid;", 
                new Dictionary<string, object> { { "@pid", playlistId } });
            int nextPos = maxPosObj == null || maxPosObj == DBNull.Value ? 0 : Convert.ToInt32(maxPosObj) + 1;

            string now = DateTime.UtcNow.ToString("o");
            string sql = @"
                INSERT INTO playlist_items (
                    playlist_id, video_url, video_id, title, thumbnail_url, position, added_at,
                    is_local, author, view_count, published_at, profile_image_url, duration_seconds,
                    description, tags, like_count, comment_count
                ) VALUES (
                    @pid, @url, @vid, @title, @thumb, @pos, @now,
                    @isLocal, @author, @viewCount, @pub, @profile, @duration,
                    @desc, @tags, @likes, @comments
                );
                SELECT last_insert_rowid();";

            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@pid", playlistId);
            cmd.Parameters.AddWithValue("@url", videoUrl);
            cmd.Parameters.AddWithValue("@vid", videoId);
            cmd.Parameters.AddWithValue("@title", (object?)title ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@thumb", (object?)finalThumbnailUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@pos", nextPos);
            cmd.Parameters.AddWithValue("@now", now);
            cmd.Parameters.AddWithValue("@isLocal", isLocal);
            cmd.Parameters.AddWithValue("@author", (object?)author ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@viewCount", (object?)viewCount ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@pub", (object?)publishedAt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@profile", (object?)profileImageUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@duration", (object?)durationSeconds ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@desc", (object?)description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tags", (object?)tags ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@likes", (object?)likeCount ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@comments", (object?)commentCount ?? DBNull.Value);

            return Convert.ToInt64(cmd.ExecuteScalar());
        }

        public bool RemoveVideoFromPlaylist(long playlistId, long itemId)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                // Delete item
                using var deleteCmd = new SqliteCommand("DELETE FROM playlist_items WHERE playlist_id = @pid AND id = @id;", connection, transaction);
                deleteCmd.Parameters.AddWithValue("@pid", playlistId);
                deleteCmd.Parameters.AddWithValue("@id", itemId);
                int deleted = deleteCmd.ExecuteNonQuery();

                if (deleted > 0)
                {
                    // Re-order remaining positions to keep sequential 0-indexed list intact
                    string updateSql = @"
                        WITH Ordered AS (
                            SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC) - 1 as new_pos
                            FROM playlist_items
                            WHERE playlist_id = @pid
                        )
                        UPDATE playlist_items
                        SET position = (SELECT new_pos FROM Ordered WHERE Ordered.id = playlist_items.id)
                        WHERE playlist_id = @pid;";

                    using var reorderCmd = new SqliteCommand(updateSql, connection, transaction);
                    reorderCmd.Parameters.AddWithValue("@pid", playlistId);
                    reorderCmd.ExecuteNonQuery();
                }

                transaction.Commit();
                return deleted > 0;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public bool ReorderPlaylistItem(long playlistId, long itemId, int newPosition)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                // Get current item position
                object? curPosObj = new SqliteCommand($"SELECT position FROM playlist_items WHERE id = {itemId};", connection, transaction).ExecuteScalar();
                if (curPosObj == null || curPosObj == DBNull.Value) return false;
                int currentPosition = Convert.ToInt32(curPosObj);

                if (currentPosition == newPosition) return true;

                // Shift intermediate items
                if (currentPosition < newPosition)
                {
                    string sql = @"
                        UPDATE playlist_items 
                        SET position = position - 1 
                        WHERE playlist_id = @pid AND position > @cur AND position <= @new;";
                    using var cmd = new SqliteCommand(sql, connection, transaction);
                    cmd.Parameters.AddWithValue("@pid", playlistId);
                    cmd.Parameters.AddWithValue("@cur", currentPosition);
                    cmd.Parameters.AddWithValue("@new", newPosition);
                    cmd.ExecuteNonQuery();
                }
                else
                {
                    string sql = @"
                        UPDATE playlist_items 
                        SET position = position + 1 
                        WHERE playlist_id = @pid AND position >= @new AND position < @cur;";
                    using var cmd = new SqliteCommand(sql, connection, transaction);
                    cmd.Parameters.AddWithValue("@pid", playlistId);
                    cmd.Parameters.AddWithValue("@cur", currentPosition);
                    cmd.Parameters.AddWithValue("@new", newPosition);
                    cmd.ExecuteNonQuery();
                }

                // Put item in its target spot
                using var finalCmd = new SqliteCommand("UPDATE playlist_items SET position = @pos WHERE id = @id;", connection, transaction);
                finalCmd.Parameters.AddWithValue("@pos", newPosition);
                finalCmd.Parameters.AddWithValue("@id", itemId);
                finalCmd.ExecuteNonQuery();

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public Dictionary<string, List<string>> GetPlaylistsForVideoIds(List<string> videoIds)
        {
            var result = new Dictionary<string, List<string>>();
            if (videoIds.Count == 0) return result;

            // Simple batch check: which video IDs belong to which playlist name
            string inClause = string.Join(",", videoIds.ConvertAll(id => $"'{id.Replace("'", "''")}'"));
            string sql = $@"
                SELECT pi.video_id, p.name 
                FROM playlist_items pi
                INNER JOIN playlists p ON pi.playlist_id = p.id
                WHERE pi.video_id IN ({inClause});";

            var rows = ExecuteQuery(sql);
            foreach (var r in rows)
            {
                string vid = r["video_id"]?.ToString() ?? "";
                string pName = r["name"]?.ToString() ?? "";
                if (!result.ContainsKey(vid))
                {
                    result[vid] = new List<string>();
                }
                result[vid].Add(pName);
            }
            return result;
        }

        // --- Folder Assignments ---

        public long AssignVideoToFolder(long playlistId, long itemId, string folderColor)
        {
            string now = DateTime.UtcNow.ToString("o");
            string sql = @"
                INSERT OR REPLACE INTO video_folder_assignments (playlist_id, item_id, folder_color, created_at)
                VALUES (@pid, @itemId, @color, @now);
                SELECT last_insert_rowid();";
            
            var id = ExecuteScalar(sql, new Dictionary<string, object> {
                { "@pid", playlistId },
                { "@itemId", itemId },
                { "@color", folderColor },
                { "@now", now }
            });
            return Convert.ToInt64(id);
        }

        public bool UnassignVideoFromFolder(long playlistId, long itemId, string folderColor)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand("DELETE FROM video_folder_assignments WHERE playlist_id = @pid AND item_id = @itemId AND folder_color = @color;", connection);
            cmd.Parameters.AddWithValue("@pid", playlistId);
            cmd.Parameters.AddWithValue("@itemId", itemId);
            cmd.Parameters.AddWithValue("@color", folderColor);
            return cmd.ExecuteNonQuery() > 0;
        }

        public List<Dictionary<string, object>> GetVideosInFolder(long playlistId, string folderColor)
        {
            string sql = @"
                SELECT pi.* FROM playlist_items pi
                INNER JOIN video_folder_assignments vfa ON pi.id = vfa.item_id AND pi.playlist_id = vfa.playlist_id
                WHERE vfa.playlist_id = @pid AND vfa.folder_color = @color
                ORDER BY pi.position ASC;";
            return ExecuteQuery(sql, new Dictionary<string, object> {
                { "@pid", playlistId },
                { "@color", folderColor }
            });
        }

        public List<string> GetVideoFolderAssignments(long playlistId, long itemId)
        {
            string sql = "SELECT folder_color FROM video_folder_assignments WHERE playlist_id = @pid AND item_id = @itemId;";
            var rows = ExecuteQuery(sql, new Dictionary<string, object> {
                { "@pid", playlistId },
                { "@itemId", itemId }
            });
            var list = new List<string>();
            foreach (var r in rows)
            {
                list.Add(r["folder_color"]?.ToString() ?? "");
            }
            return list;
        }

        public Dictionary<string, List<string>> GetAllFolderAssignments(long playlistId)
        {
            var result = new Dictionary<string, List<string>>();
            string sql = "SELECT item_id, folder_color FROM video_folder_assignments WHERE playlist_id = @pid;";
            var rows = ExecuteQuery(sql, new Dictionary<string, object> { { "@pid", playlistId } });
            
            foreach (var r in rows)
            {
                string itemId = r["item_id"]?.ToString() ?? "";
                string color = r["folder_color"]?.ToString() ?? "";
                if (!result.ContainsKey(itemId))
                {
                    result[itemId] = new List<string>();
                }
                result[itemId].Add(color);
            }
            return result;
        }

        public List<string> GetFoldersForPlaylist(long playlistId)
        {
            string sql = "SELECT DISTINCT folder_color FROM video_folder_assignments WHERE playlist_id = @pid;";
            var rows = ExecuteQuery(sql, new Dictionary<string, object> { { "@pid", playlistId } });
            var list = new List<string>();
            foreach (var r in rows)
            {
                list.Add(r["folder_color"]?.ToString() ?? "");
            }
            return list;
        }

        public List<Dictionary<string, object>> GetAllFoldersWithVideos()
        {
            string sql = @"
                SELECT DISTINCT playlist_id, folder_color 
                FROM video_folder_assignments;";
            return ExecuteQuery(sql);
        }

        // --- Stuck Folders ---

        public bool ToggleStuckFolder(long playlistId, string folderColor)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            // Check if exists
            using var checkCmd = new SqliteCommand("SELECT COUNT(1) FROM stuck_folders WHERE playlist_id = @pid AND folder_color = @color;", connection);
            checkCmd.Parameters.AddWithValue("@pid", playlistId);
            checkCmd.Parameters.AddWithValue("@color", folderColor);
            long count = Convert.ToInt64(checkCmd.ExecuteScalar());

            if (count > 0)
            {
                using var delCmd = new SqliteCommand("DELETE FROM stuck_folders WHERE playlist_id = @pid AND folder_color = @color;", connection);
                delCmd.Parameters.AddWithValue("@pid", playlistId);
                delCmd.Parameters.AddWithValue("@color", folderColor);
                delCmd.ExecuteNonQuery();
                return false; // Now unstuck
            }
            else
            {
                string now = DateTime.UtcNow.ToString("o");
                using var insCmd = new SqliteCommand("INSERT INTO stuck_folders (playlist_id, folder_color, created_at) VALUES (@pid, @color, @now);", connection);
                insCmd.Parameters.AddWithValue("@pid", playlistId);
                insCmd.Parameters.AddWithValue("@color", folderColor);
                insCmd.Parameters.AddWithValue("@now", now);
                insCmd.ExecuteNonQuery();
                return true; // Now stuck
            }
        }

        public bool IsFolderStuck(long playlistId, string folderColor)
        {
            object? res = ExecuteScalar("SELECT 1 FROM stuck_folders WHERE playlist_id = @pid AND folder_color = @color LIMIT 1;",
                new Dictionary<string, object> {
                    { "@pid", playlistId },
                    { "@color", folderColor }
                });
            return res != null && res != DBNull.Value;
        }

        public List<List<object>> GetAllStuckFolders()
        {
            var list = new List<List<object>>();
            string sql = "SELECT playlist_id, folder_color FROM stuck_folders;";
            var rows = ExecuteQuery(sql);
            foreach (var r in rows)
            {
                list.Add(new List<object> {
                    Convert.ToInt64(r["playlist_id"]),
                    r["folder_color"]?.ToString() ?? ""
                });
            }
            return list;
        }

        // --- Folder Metadata ---

        public bool SetFolderMetadata(long playlistId, string folderColor, string? name, string? description, string? customAscii)
        {
            string now = DateTime.UtcNow.ToString("o");
            string sql = @"
                INSERT INTO folder_metadata (playlist_id, folder_color, custom_name, description, custom_ascii, created_at, updated_at)
                VALUES (@pid, @color, @name, @desc, @ascii, @now, @now)
                ON CONFLICT(playlist_id, folder_color) DO UPDATE SET
                    custom_name = COALESCE(@name, custom_name),
                    description = COALESCE(@desc, description),
                    custom_ascii = COALESCE(@ascii, custom_ascii),
                    updated_at = @now;";

            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@pid", playlistId);
            cmd.Parameters.AddWithValue("@color", folderColor);
            cmd.Parameters.AddWithValue("@name", (object?)name ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@desc", (object?)description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ascii", (object?)customAscii ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@now", now);

            return cmd.ExecuteNonQuery() > 0;
        }

        public Dictionary<string, object>? GetFolderMetadata(long playlistId, string folderColor)
        {
            var list = ExecuteQuery("SELECT custom_name, description, custom_ascii FROM folder_metadata WHERE playlist_id = @pid AND folder_color = @color LIMIT 1;",
                new Dictionary<string, object> {
                    { "@pid", playlistId },
                    { "@color", folderColor }
                });
            return list.Count > 0 ? list[0] : null;
        }

        // --- Watch History ---

        public long AddToWatchHistory(string videoUrl, string videoId, string? title, string? thumbnailUrl)
        {
            string now = DateTime.UtcNow.ToString("o");
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                // De-duplicate: Remove previous references of this video in history
                using var delCmd = new SqliteCommand("DELETE FROM watch_history WHERE video_id = @vid;", connection, transaction);
                delCmd.Parameters.AddWithValue("@vid", videoId);
                delCmd.ExecuteNonQuery();

                // Add record
                string sql = "INSERT INTO watch_history (video_url, video_id, title, thumbnail_url, watched_at) VALUES (@url, @vid, @title, @thumb, @now); SELECT last_insert_rowid();";
                using var insCmd = new SqliteCommand(sql, connection, transaction);
                insCmd.Parameters.AddWithValue("@url", videoUrl);
                insCmd.Parameters.AddWithValue("@vid", videoId);
                insCmd.Parameters.AddWithValue("@title", (object?)title ?? DBNull.Value);
                insCmd.Parameters.AddWithValue("@thumb", (object?)thumbnailUrl ?? DBNull.Value);
                insCmd.Parameters.AddWithValue("@now", now);
                long id = Convert.ToInt64(insCmd.ExecuteScalar());

                // Cap at 100 history items
                string trimSql = @"
                    DELETE FROM watch_history 
                    WHERE id NOT IN (
                        SELECT id FROM watch_history 
                        ORDER BY watched_at DESC 
                        LIMIT 100
                    );";
                using var trimCmd = new SqliteCommand(trimSql, connection, transaction);
                trimCmd.ExecuteNonQuery();

                transaction.Commit();
                return id;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public List<Dictionary<string, object>> GetWatchHistory(int limit)
        {
            string sql = "SELECT * FROM watch_history ORDER BY watched_at DESC LIMIT @limit;";
            return ExecuteQuery(sql, new Dictionary<string, object> { { "@limit", limit } });
        }

        public bool ClearWatchHistory()
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand("DELETE FROM watch_history;", connection);
            return cmd.ExecuteNonQuery() > 0;
        }

        // --- Video Progress ---

        public long UpdateVideoProgress(string videoId, string videoUrl, double? duration, double currentTime)
        {
            // Tauri logic check sticky: get existing has_fully_watched
            object? existingFullyWatched = ExecuteScalar("SELECT has_fully_watched FROM video_progress WHERE video_id = @vid;",
                new Dictionary<string, object> { { "@vid", videoId } });
            
            int wasFullyWatched = existingFullyWatched == null || existingFullyWatched == DBNull.Value ? 0 : Convert.ToInt32(existingFullyWatched);
            double dur = duration ?? 100.0;
            double pct = dur > 0 ? (currentTime / dur) * 100.0 : 0.0;
            
            // ≥85% progress sets the sticky flag
            int isFullyWatched = pct >= 85.0 || wasFullyWatched == 1 ? 1 : 0;
            string now = DateTime.UtcNow.ToString("o");

            string sql = @"
                INSERT INTO video_progress (
                    video_id, video_url, duration, last_progress, progress_percentage, last_updated, has_fully_watched, watch_count
                ) VALUES (
                    @vid, @url, @duration, @progress, @pct, @now, @fully, 1
                ) ON CONFLICT(video_id) DO UPDATE SET
                    video_url = @url,
                    duration = COALESCE(@duration, duration),
                    last_progress = @progress,
                    progress_percentage = @pct,
                    last_updated = @now,
                    has_fully_watched = @fully,
                    watch_count = watch_count + (CASE WHEN @progress = 0 THEN 1 ELSE 0 END);
                SELECT id FROM video_progress WHERE video_id = @vid;";

            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@vid", videoId);
            cmd.Parameters.AddWithValue("@url", videoUrl);
            cmd.Parameters.AddWithValue("@duration", (object?)duration ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@progress", currentTime);
            cmd.Parameters.AddWithValue("@pct", pct);
            cmd.Parameters.AddWithValue("@now", now);
            cmd.Parameters.AddWithValue("@fully", isFullyWatched);

            return Convert.ToInt64(cmd.ExecuteScalar());
        }

        public Dictionary<string, object>? GetVideoProgress(string videoId)
        {
            var list = ExecuteQuery("SELECT video_id, video_url, duration, last_progress as lastProgress, progress_percentage as progressPercentage, last_updated as lastUpdated, has_fully_watched as hasFullyWatched, watch_count as watchCount FROM video_progress WHERE video_id = @vid LIMIT 1;",
                new Dictionary<string, object> { { "@vid", videoId } });
            
            if (list.Count > 0)
            {
                // Map keys specifically to match JavaScript frontend expectations (camelCase for the progress structure, matching tauri serialization)
                var row = list[0];
                return new Dictionary<string, object> {
                    { "videoId", row["video_id"] },
                    { "videoUrl", row["video_url"] },
                    { "duration", row["duration"] },
                    { "lastProgress", row["lastProgress"] },
                    { "progressPercentage", row["progressPercentage"] },
                    { "lastUpdated", row["lastUpdated"] },
                    { "hasFullyWatched", Convert.ToInt32(row["hasFullyWatched"]) == 1 },
                    { "watchCount", row["watchCount"] }
                };
            }
            return null;
        }

        public List<Dictionary<string, object>> GetAllVideoProgress()
        {
            string sql = "SELECT video_id, video_url, duration, last_progress, progress_percentage, last_updated, has_fully_watched, watch_count FROM video_progress;";
            var rows = ExecuteQuery(sql);
            var result = new List<Dictionary<string, object>>();
            foreach (var r in rows)
            {
                result.Add(new Dictionary<string, object> {
                    { "videoId", r["video_id"] },
                    { "videoUrl", r["video_url"] },
                    { "duration", r["duration"] },
                    { "lastProgress", r["last_progress"] },
                    { "progressPercentage", r["progress_percentage"] },
                    { "lastUpdated", r["last_updated"] },
                    { "hasFullyWatched", Convert.ToInt32(r["has_fully_watched"]) == 1 },
                    { "watchCount", r["watch_count"] }
                });
            }
            return result;
        }

        public List<string> GetWatchedVideoIds()
        {
            string sql = "SELECT video_id FROM video_progress WHERE progress_percentage >= 85.0 OR has_fully_watched = 1;";
            var rows = ExecuteQuery(sql);
            var list = new List<string>();
            foreach (var r in rows)
            {
                list.Add(r["video_id"]?.ToString() ?? "");
            }
            return list;
        }

        // --- Ratings ---

        public int GetDrumstickRating(long playlistId, long itemId)
        {
            object? res = ExecuteScalar("SELECT drumstick_rating FROM playlist_items WHERE playlist_id = @pid AND id = @id;",
                new Dictionary<string, object> {
                    { "@pid", playlistId },
                    { "@id", itemId }
                });
            return res == null || res == DBNull.Value ? 0 : Convert.ToInt32(res);
        }

        public bool SetDrumstickRating(long playlistId, long itemId, int rating)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            using var cmd = new SqliteCommand("UPDATE playlist_items SET drumstick_rating = @rating WHERE playlist_id = @pid AND id = @id;", connection);
            cmd.Parameters.AddWithValue("@rating", rating);
            cmd.Parameters.AddWithValue("@pid", playlistId);
            cmd.Parameters.AddWithValue("@id", itemId);
            return cmd.ExecuteNonQuery() > 0;
        }

        public string? SaveBase64ImageToCache(string? base64Data, string prefix)
        {
            if (string.IsNullOrEmpty(base64Data)) return base64Data;
            if (!base64Data.StartsWith("data:image/")) return base64Data; // Not base64

            try
            {
                int commaIndex = base64Data.IndexOf(',');
                if (commaIndex == -1) return base64Data;

                string header = base64Data.Substring(0, commaIndex);
                string payload = base64Data.Substring(commaIndex + 1);

                string extension = "jpg";
                if (header.Contains("image/png")) extension = "png";
                else if (header.Contains("image/gif")) extension = "gif";
                else if (header.Contains("image/webp")) extension = "webp";
                else if (header.Contains("image/svg+xml")) extension = "svg";
                else if (header.Contains("image/bmp")) extension = "bmp";

                byte[] bytes = Convert.FromBase64String(payload);

                string appDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "YTTV");
                string filename = $"{prefix}_{Guid.NewGuid().ToString("N")}.{extension}";
                string filePath = Path.Combine(appDataFolder, filename);

                string? dir = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }

                File.WriteAllBytes(filePath, bytes);
                Console.WriteLine($"[DatabaseService] Saved base64 image to cache: {filename}");

                return $"https://cache.local/{filename}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DatabaseService] Error saving base64 image: {ex.Message}");
                return base64Data;
            }
        }

        public string GetSetting(string key)
        {
            try
            {
                var rows = ExecuteQuery("SELECT value FROM app_settings WHERE key = @key LIMIT 1;",
                    new Dictionary<string, object> { { "@key", key } });
                if (rows.Count > 0)
                {
                    return rows[0]["value"]?.ToString() ?? "";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DatabaseService] Error getting setting {key}: {ex.Message}");
            }
            return "";
        }

        public void SetSetting(string key, string value)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();
                using var cmd = new SqliteCommand("INSERT OR REPLACE INTO app_settings (key, value) VALUES (@key, @value);", connection);
                cmd.Parameters.AddWithValue("@key", key);
                cmd.Parameters.AddWithValue("@value", value);
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DatabaseService] Error setting setting {key}: {ex.Message}");
            }
        }
    }
}
