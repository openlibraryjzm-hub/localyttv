using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Interop;
using Microsoft.Web.WebView2.Core;

namespace YTTV
{
    public partial class MainWindow : Window
    {
        private readonly DatabaseService _databaseService;
        private AudioVisualizerService? _audioVisualizerService;
        private StreamingServer? _streamingServer;


        public MainWindow()
        {
            InitializeComponent();
            _databaseService = new DatabaseService();
            InitializeAsync();


        }

        private async void InitializeAsync()
        {
            try
            {
                // Ensure CoreWebView2 is initialized in the local appdata user folder
                string appDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "YTTV");
                string udfPath = Path.Combine(appDataFolder, "WebView2");
                if (!Directory.Exists(udfPath))
                {
                    Directory.CreateDirectory(udfPath);
                }
                var env = await CoreWebView2Environment.CreateAsync(null, udfPath);
                await webView.EnsureCoreWebView2Async(env);

                // Set up virtual host name mapping for local files (banners, orbs, thumbnails)
                if (!Directory.Exists(appDataFolder))
                {
                    Directory.CreateDirectory(appDataFolder);
                }

                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "cache.local",
                    appDataFolder,
                    CoreWebView2HostResourceAccessKind.Allow
                );

                // Start streaming server for local video files
                _streamingServer = new StreamingServer(1422);
                _streamingServer.Start();

#if DEBUG
                // Point source to the React local dev server
                webView.Source = new Uri("http://localhost:1420");
#else
                // Resolve the static 'dist' directory next to the executable
                string uiFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "dist");
                
                // Map https://app.local/ to serve the local dist/ files
                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "app.local",
                    uiFolder,
                    CoreWebView2HostResourceAccessKind.Allow
                );
                webView.Source = new Uri("https://app.local/index.html");
#endif

                // Attach IPC bridge handler
                webView.WebMessageReceived += OnWebMessageReceived;

                _audioVisualizerService = new AudioVisualizerService(webView);

                Console.WriteLine("[WPF Backend] WebView2 initialized and mapped cache.local to AppData/YTTV");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"WebView2 Initialization failed: {ex.Message}", "Initialization Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var jsonString = e.WebMessageAsJson;
                using var doc = JsonDocument.Parse(jsonString);
                var root = doc.RootElement;

                if (!root.TryGetProperty("command", out var commandProp)) return;
                string command = commandProp.GetString() ?? "";

                // Retrieve arguments if present
                JsonElement args = root.TryGetProperty("args", out var argsProp) ? argsProp : default;
                string requestId = root.TryGetProperty("requestId", out var reqProp) ? reqProp.GetString() ?? "" : "";

                Console.WriteLine($"[JS => C#] Command: {command} | RequestId: {requestId}");

                // Handle system window operations
                switch (command)
                {
                    case "window_drag":
                        this.DragMove();
                        break;
                    case "window_minimize":
                        this.WindowState = WindowState.Minimized;
                        break;
                    case "window_toggle_maximize":
                        this.WindowState = this.WindowState == WindowState.Maximized 
                            ? WindowState.Normal 
                            : WindowState.Maximized;
                        break;
                    case "window_close":
                        this.Close();
                        break;
                    case "window_is_maximized":
                        SendResponse(requestId, this.WindowState == WindowState.Maximized);
                        break;

                    case "get_setting":
                        SendResponse(requestId, _databaseService.GetSetting(GetStringArg(args, "key") ?? ""));
                        break;
                    case "set_setting":
                        _databaseService.SetSetting(
                            GetStringArg(args, "key") ?? "", 
                            GetStringArg(args, "value") ?? ""
                        );
                        SendResponse(requestId, true);
                        break;

                    // --- Database Operations ---
                    case "get_all_playlists":
                        SendResponse(requestId, _databaseService.GetAllPlaylists());
                        break;
                    case "get_all_playlist_metadata":
                        SendResponse(requestId, _databaseService.GetAllPlaylistMetadata());
                        break;
                    case "get_playlist":
                        SendResponse(requestId, _databaseService.GetPlaylist(GetLongArg(args, "id")));
                        break;
                    case "create_playlist":
                        SendResponse(requestId, _databaseService.CreatePlaylist(
                            GetStringArg(args, "name") ?? "", 
                            GetStringArg(args, "description")
                        ));
                        break;
                    case "update_playlist":
                        SendResponse(requestId, _databaseService.UpdatePlaylist(
                            GetLongArg(args, "id"),
                            GetStringArg(args, "name"),
                            GetStringArg(args, "description"),
                            GetStringArg(args, "customAscii"),
                            GetStringArg(args, "customThumbnailUrl")
                        ));
                        break;
                    case "delete_playlist":
                        SendResponse(requestId, _databaseService.DeletePlaylist(GetLongArg(args, "id")));
                        break;
                    case "delete_playlist_by_name":
                        SendResponse(requestId, _databaseService.DeletePlaylistByName(GetStringArg(args, "name") ?? ""));
                        break;

                    // --- Playlist Items ---
                    case "get_playlist_items":
                        SendResponse(requestId, _databaseService.GetPlaylistItems(GetLongArg(args, "playlistId")));
                        break;
                    case "get_playlist_items_preview":
                        SendResponse(requestId, _databaseService.GetPlaylistItemsPreview(
                            GetLongArg(args, "playlistId"), 
                            GetIntArg(args, "limit", 4)
                        ));
                        break;
                    case "add_video_to_playlist":
                        long resultId = _databaseService.AddVideoToPlaylist(
                            GetLongArg(args, "playlistId"),
                            GetStringArg(args, "videoUrl") ?? "",
                            GetStringArg(args, "videoId") ?? "",
                            GetStringArg(args, "title"),
                            GetStringArg(args, "thumbnailUrl"),
                            GetBoolArg(args, "isLocal") ? 1 : 0,
                            GetStringArg(args, "author"),
                            GetStringArg(args, "viewCount"),
                            GetStringArg(args, "publishedAt"),
                            GetStringArg(args, "profileImageUrl"),
                            args.TryGetProperty("durationSeconds", out var dsProp) && dsProp.ValueKind == JsonValueKind.Number ? dsProp.GetInt64() : (long?)null,
                            GetStringArg(args, "description"),
                            GetStringArg(args, "tags"),
                            GetStringArg(args, "likeCount"),
                            GetStringArg(args, "commentCount")
                        );
                        SendResponse(requestId, resultId);
                        break;
                    case "remove_video_from_playlist":
                        SendResponse(requestId, _databaseService.RemoveVideoFromPlaylist(
                            GetLongArg(args, "playlistId"), 
                            GetLongArg(args, "itemId")
                        ));
                        break;
                    case "reorder_playlist_item":
                        SendResponse(requestId, _databaseService.ReorderPlaylistItem(
                            GetLongArg(args, "playlistId"),
                            GetLongArg(args, "itemId"),
                            GetIntArg(args, "newPosition")
                        ));
                        break;
                    case "get_playlists_for_video_ids":
                        SendResponse(requestId, _databaseService.GetPlaylistsForVideoIds(GetStringListArg(args, "videoIds")));
                        break;

                    // --- Folder Assignments ---
                    case "assign_video_to_folder":
                        SendResponse(requestId, _databaseService.AssignVideoToFolder(
                            GetLongArg(args, "playlistId"),
                            GetLongArg(args, "itemId"),
                            GetStringArg(args, "folderColor") ?? ""
                        ));
                        break;
                    case "unassign_video_from_folder":
                        SendResponse(requestId, _databaseService.UnassignVideoFromFolder(
                            GetLongArg(args, "playlistId"),
                            GetLongArg(args, "itemId"),
                            GetStringArg(args, "folderColor") ?? ""
                        ));
                        break;
                    case "get_videos_in_folder":
                        SendResponse(requestId, _databaseService.GetVideosInFolder(
                            GetLongArg(args, "playlistId"),
                            GetStringArg(args, "folderColor") ?? ""
                        ));
                        break;
                    case "get_video_folder_assignments":
                        SendResponse(requestId, _databaseService.GetVideoFolderAssignments(
                            GetLongArg(args, "playlistId"),
                            GetLongArg(args, "itemId")
                        ));
                        break;
                    case "get_all_folder_assignments":
                        SendResponse(requestId, _databaseService.GetAllFolderAssignments(GetLongArg(args, "playlistId")));
                        break;
                    case "get_folders_for_playlist":
                        SendResponse(requestId, _databaseService.GetFoldersForPlaylist(GetLongArg(args, "playlistId")));
                        break;
                    case "get_all_folders_with_videos":
                        SendResponse(requestId, _databaseService.GetAllFoldersWithVideos());
                        break;

                    // --- Stuck Folders & Metadata ---
                    case "toggle_stuck_folder":
                        SendResponse(requestId, _databaseService.ToggleStuckFolder(
                            GetLongArg(args, "playlistId"),
                            GetStringArg(args, "folderColor") ?? ""
                        ));
                        break;
                    case "is_folder_stuck":
                        SendResponse(requestId, _databaseService.IsFolderStuck(
                            GetLongArg(args, "playlistId"),
                            GetStringArg(args, "folderColor") ?? ""
                        ));
                        break;
                    case "get_all_stuck_folders":
                        SendResponse(requestId, _databaseService.GetAllStuckFolders());
                        break;
                    case "get_folder_metadata":
                        SendResponse(requestId, _databaseService.GetFolderMetadata(
                            GetLongArg(args, "playlistId"),
                            GetStringArg(args, "folderColor") ?? ""
                        ));
                        break;
                    case "set_folder_metadata":
                        SendResponse(requestId, _databaseService.SetFolderMetadata(
                            GetLongArg(args, "playlistId"),
                            GetStringArg(args, "folderColor") ?? "",
                            GetStringArg(args, "name"),
                            GetStringArg(args, "description"),
                            GetStringArg(args, "customAscii")
                        ));
                        break;

                    // --- Watch History ---
                    case "add_to_watch_history":
                        SendResponse(requestId, _databaseService.AddToWatchHistory(
                            GetStringArg(args, "videoUrl") ?? "",
                            GetStringArg(args, "videoId") ?? "",
                            GetStringArg(args, "title"),
                            GetStringArg(args, "thumbnailUrl")
                        ));
                        break;
                    case "get_watch_history":
                        SendResponse(requestId, _databaseService.GetWatchHistory(GetIntArg(args, "limit", 100)));
                        break;
                    case "clear_watch_history":
                        SendResponse(requestId, _databaseService.ClearWatchHistory());
                        break;

                    // --- Progress & Ratings ---
                    case "update_video_progress":
                        double? durVal = args.TryGetProperty("duration", out var durProp) && durProp.ValueKind == JsonValueKind.Number ? durProp.GetDouble() : (double?)null;
                        SendResponse(requestId, _databaseService.UpdateVideoProgress(
                            GetStringArg(args, "videoId") ?? "",
                            GetStringArg(args, "videoUrl") ?? "",
                            durVal,
                            GetDoubleArg(args, "currentTime")
                        ));
                        break;
                    case "get_video_progress":
                        SendResponse(requestId, _databaseService.GetVideoProgress(GetStringArg(args, "videoId") ?? ""));
                        break;
                    case "get_all_video_progress":
                        SendResponse(requestId, _databaseService.GetAllVideoProgress());
                        break;
                    case "get_watched_video_ids":
                        SendResponse(requestId, _databaseService.GetWatchedVideoIds());
                        break;
                    case "get_drumstick_rating":
                        SendResponse(requestId, _databaseService.GetDrumstickRating(
                            GetLongArg(args, "playlistId"),
                            GetLongArg(args, "itemId")
                        ));
                        break;
                    case "set_drumstick_rating":
                        SendResponse(requestId, _databaseService.SetDrumstickRating(
                            GetLongArg(args, "playlistId"),
                            GetLongArg(args, "itemId"),
                            GetIntArg(args, "rating")
                        ));
                        break;

                    // --- Audio Visualizer ---
                    case "start_audio_capture":
                        _audioVisualizerService?.Start();
                        SendResponse(requestId, true);
                        break;
                    case "stop_audio_capture":
                        _audioVisualizerService?.Stop();
                        SendResponse(requestId, true);
                        break;
                    case "test_audio_command":
                        SendResponse(requestId, "WPF WASAPI active");
                        break;

                    case "save_image_to_cache":
                        SendResponse(requestId, _databaseService.SaveBase64ImageToCache(
                            GetStringArg(args, "base64Data"),
                            GetStringArg(args, "prefix") ?? "image"
                        ));
                        break;

                    case "get_video_stream_url":
                        {
                            string? filePath = GetStringArg(args, "filePath");
                            if (string.IsNullOrEmpty(filePath))
                            {
                                SendResponse(requestId, "");
                            }
                            else
                            {
                                string streamUrl = _streamingServer?.GetStreamUrl(filePath) ?? "";
                                SendResponse(requestId, streamUrl);
                            }
                        }
                        break;

                    case "select_video_files":
                        {
                            var openFileDialog = new Microsoft.Win32.OpenFileDialog
                            {
                                Multiselect = true,
                                Filter = "Media Files|*.mp4;*.mkv;*.avi;*.mov;*.webm;*.flv;*.wmv;*.m4v;*.mpg;*.mpeg;*.png;*.jpg;*.jpeg;*.gif;*.webp;*.bmp;*.svg|All Files|*.*"
                            };
                            bool? fileResult = openFileDialog.ShowDialog(this);
                            if (fileResult == true)
                            {
                                SendResponse(requestId, openFileDialog.FileNames);
                            }
                            else
                            {
                                SendResponse(requestId, (object?)null);
                            }
                        }
                        break;

                    case "select_video_folder":
                        {
                            var openFolderDialog = new Microsoft.Win32.OpenFolderDialog
                            {
                                Multiselect = false
                            };
                            bool? folderResult = openFolderDialog.ShowDialog(this);
                            if (folderResult == true)
                            {
                                SendResponse(requestId, openFolderDialog.FolderName);
                            }
                            else
                            {
                                SendResponse(requestId, (object?)null);
                            }
                        }
                        break;

                    case "get_videos_in_directory":
                        {
                            string? dirPath = GetStringArg(args, "dirPath");
                            var fileList = new List<string>();
                            if (!string.IsNullOrEmpty(dirPath) && Directory.Exists(dirPath))
                            {
                                string[] extensions = { ".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv", ".m4v", ".mpg", ".mpeg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg" };
                                foreach (var file in Directory.GetFiles(dirPath))
                                {
                                    string ext = Path.GetExtension(file).ToLower();
                                    if (Array.IndexOf(extensions, ext) >= 0)
                                    {
                                        fileList.Add(file);
                                    }
                                }
                                fileList.Sort();
                            }
                            SendResponse(requestId, fileList);
                        }
                        break;



                    default:
                        // Log remaining unhandled commands (visualizer, local file picking) to execute local mock fallbacks
                        Console.WriteLine($"[WPF Backend] Unhandled command routing to JS fallback: '{command}'");
                        SendResponse(requestId, new { unhandled = true });
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WPF Backend] Error parsing web message: {ex.Message}");
            }
        }

        private void SendResponse(string requestId, object? payload)
        {
            if (string.IsNullOrEmpty(requestId)) return;

            var response = new
            {
                requestId = requestId,
                payload = payload
            };

            string json = JsonSerializer.Serialize(response);
            webView.CoreWebView2.PostWebMessageAsJson(json);
        }

        // --- JSON Helper Extractions ---

        private string? GetStringArg(JsonElement args, string key)
        {
            if (args.ValueKind == JsonValueKind.Object && args.TryGetProperty(key, out var prop) && prop.ValueKind != JsonValueKind.Null)
            {
                return prop.GetString();
            }
            return null;
        }

        private long GetLongArg(JsonElement args, string key)
        {
            if (args.ValueKind == JsonValueKind.Object && args.TryGetProperty(key, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number) return prop.GetInt64();
                if (prop.ValueKind == JsonValueKind.String && long.TryParse(prop.GetString(), out long val)) return val;
            }
            return 0;
        }

        private int GetIntArg(JsonElement args, string key, int defaultVal = 0)
        {
            if (args.ValueKind == JsonValueKind.Object && args.TryGetProperty(key, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number) return prop.GetInt32();
                if (prop.ValueKind == JsonValueKind.String && int.TryParse(prop.GetString(), out int val)) return val;
            }
            return defaultVal;
        }

        private double GetDoubleArg(JsonElement args, string key)
        {
            if (args.ValueKind == JsonValueKind.Object && args.TryGetProperty(key, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number) return prop.GetDouble();
                if (prop.ValueKind == JsonValueKind.String && double.TryParse(prop.GetString(), out double val)) return val;
            }
            return 0.0;
        }

        private bool GetBoolArg(JsonElement args, string key)
        {
            if (args.ValueKind == JsonValueKind.Object && args.TryGetProperty(key, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.True) return true;
                if (prop.ValueKind == JsonValueKind.False) return false;
                if (prop.ValueKind == JsonValueKind.Number) return prop.GetInt32() != 0;
            }
            return false;
        }

        private List<string> GetStringListArg(JsonElement args, string key)
        {
            var list = new List<string>();
            if (args.ValueKind == JsonValueKind.Object && args.TryGetProperty(key, out var prop) && prop.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in prop.EnumerateArray())
                {
                    string? s = item.GetString();
                    if (s != null) list.Add(s);
                }
            }
            return list;
        }

        protected override void OnClosed(EventArgs e)
        {
            _audioVisualizerService?.Dispose();
            _streamingServer?.Dispose();



            base.OnClosed(e);
        }



        // --- Win32 Window Maximization Taskbar Respect Fix ---

        [StructLayout(LayoutKind.Sequential)]
        public struct POINT
        {
            public int x;
            public int y;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct MINMAXINFO
        {
            public POINT ptReserved;
            public POINT ptMaxSize;
            public POINT ptMaxPosition;
            public POINT ptMinTrackSize;
            public POINT ptMaxTrackSize;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int left;
            public int top;
            public int right;
            public int bottom;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        public struct MONITORINFO
        {
            public int cbSize;
            public RECT rcMonitor;
            public RECT rcWork;
            public uint dwFlags;
        }

        [DllImport("user32.dll")]
        private static extern IntPtr MonitorFromWindow(IntPtr handle, int flags);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);



        protected override void OnSourceInitialized(EventArgs e)
        {
            base.OnSourceInitialized(e);
            IntPtr handle = new WindowInteropHelper(this).Handle;
            HwndSource.FromHwnd(handle)?.AddHook(WindowProc);
        }

        private IntPtr WindowProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == 0x0024)
            {
                WmGetMinMaxInfo(hwnd, lParam);
                handled = false;
            }
            return IntPtr.Zero;
        }

        private void WmGetMinMaxInfo(IntPtr hwnd, IntPtr lParam)
        {
            IntPtr hMonitor = MonitorFromWindow(hwnd, 2);
            MONITORINFO mi = new MONITORINFO { cbSize = Marshal.SizeOf(typeof(MONITORINFO)) };
            if (GetMonitorInfo(hMonitor, ref mi))
            {
                MINMAXINFO mmi = (MINMAXINFO)Marshal.PtrToStructure(lParam, typeof(MINMAXINFO))!;

                int monitorHeight = mi.rcMonitor.bottom - mi.rcMonitor.top;
                int monitorWidth = mi.rcMonitor.right - mi.rcMonitor.left;

                int x = mi.rcWork.left - mi.rcMonitor.left;
                int y = mi.rcWork.top - mi.rcMonitor.top;
                int width = mi.rcWork.right - mi.rcWork.left;
                int height = mi.rcWork.bottom - mi.rcWork.top;

                bool isAutoHideBottom = false;
                if (height == monitorHeight)
                {
                    height -= 2;
                    isAutoHideBottom = true;
                }

                int leftOvershoot = (x == 0) ? 8 : 0;
                int topOvershoot = (y == 0) ? 8 : 0;
                int rightOvershoot = (mi.rcWork.right == mi.rcMonitor.right) ? 8 : 0;
                int bottomOvershoot = (mi.rcWork.bottom == mi.rcMonitor.bottom && !isAutoHideBottom) ? 8 : 0;

                mmi.ptMaxPosition.x = x - leftOvershoot;
                mmi.ptMaxPosition.y = y - topOvershoot;
                mmi.ptMaxSize.x = width + leftOvershoot + rightOvershoot;
                mmi.ptMaxSize.y = height + topOvershoot + bottomOvershoot;

                mmi.ptMaxTrackSize.x = mmi.ptMaxSize.x;
                mmi.ptMaxTrackSize.y = mmi.ptMaxSize.y;

                Marshal.StructureToPtr(mmi, lParam, true);
            }
        }
    }
}