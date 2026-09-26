# Session Updates: Broken Local Paths & Window Maximization Taskbar Fix
**Timestamp:** 18/07/2026 3:10pm

## 1. Key Accomplishments

### 1.1 Local Path Mapping & Base64-to-Disk Conversion
* **The Issue:** Local image assets (custom orbs, banners, profile avatars) and thumbnails were causing massive database bloating and loading stutters because they were stored as huge base64 strings in Zustand (IndexedDB) and SQLite.
* **The Fix:**
  * Configured WebView2's native **Virtual Host Folder Mapping** (`SetVirtualHostNameToFolderMapping`) inside [MainWindow.xaml.cs](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/MainWindow.xaml.cs) to bind `https://cache.local/` to the application's local `AppData` directory (`%USERPROFILE%/AppData/Local/YTTV`).
  * Implemented an **automatic base64 image interceptor** inside [DatabaseService.cs](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/DatabaseService.cs). When any database write/update command receives a base64 Data URL, C# automatically decodes the bytes, saves it as a `.jpg`/`.png` file in AppData, and stores the virtual `https://cache.local/...` URL instead.
  * Added the `save_image_to_cache` IPC command to the C# backend and exposed it as `saveImageToCache` inside the React platform bridge ([platformBridge.js](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/api/platformBridge.js)).
  * Updated React file uploaders in [AssetManagerPage.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/AssetManagerPage.jsx), [AppPage.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/AppPage.jsx), [EditPlaylistModal.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/EditPlaylistModal.jsx), [OrbPage.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/OrbPage.jsx), and [OrbConfigPlaceholderPage.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/OrbConfigPlaceholderPage.jsx) to automatically route uploaded files through the C# disk cache before saving them to Zustand.

### 1.2 Local Media Range Streaming Server
* **The Issue:** Standard local files cannot be loaded directly in WebView2 via raw filesystem paths.
* **The Fix:**
  * Implemented a lightweight, multi-threaded HTTP [StreamingServer.cs](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/StreamingServer.cs) running an `HttpListener` on port `1422` with permissive CORS headers.
  * Added complete **HTTP Range Request** parsing to allow HTML5 `<video>` elements to play, buffer, and scrub local video formats smoothly.
  * Wired up `get_video_stream_url` to register local files on-demand under MD5-hashed registry IDs for security, preventing raw filesystem path exposure.
  * Wired up WPF/Win32 file Dialog commands: `select_video_files`, `select_video_folder`, and `get_videos_in_directory` to handle folder ingestion natively in C#.

### 1.3 Window Maximization & Taskbar Respect
* **The Issue:** 
  * The window maximize button in [WindowControls.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/WindowControls.jsx) was calling legacy non-existent `maximize()`/`unmaximize()` functions.
  * WPF's `WindowChrome` had conflicts with default OS non-client area rendering, causing the maximized window to act like fullscreen and completely obscure the taskbar (including the Windows 11 auto-hide trigger zone).
* **The Fix:**
  * Changed the maximize button handler to call the bridge-defined `win.toggleMaximize()`.
  * Added `WindowStyle="None"` to [MainWindow.xaml](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/MainWindow.xaml) to remove the OS title-bar rendering conflict and let `WindowChrome` work cleanly.
  * Implemented a Win32 message hook inside `MainWindow.xaml.cs` to intercept `WM_GETMINMAXINFO` (`0x0024`). When Windows taskbar auto-hide mode is enabled, the hook dynamically shaves off **2 pixels** from the maximized height. This keeps the taskbar hover trigger zone uncovered.
  * Applied an asymmetric maximized trigger margin style (`Margin="8,8,8,0"`) on the root `Grid` in `MainWindow.xaml`. This offsets the 8px overshoot on the top, left, and right to prevent border clipping while keeping the bottom edge perfectly flush with the screen's bottom trigger edge.

---

## 2. Key Discoveries
* **WPF WindowStyle Conflicts:** When using custom `WindowChrome` in WPF, leaving `WindowStyle` as default (rather than `None`) causes hidden system borders to fight with custom chrome rendering, making window maximization behave like fullscreen games (covering taskbars and preventing hover triggers).
* **Auto-Hide Trigger Area:** Windows auto-hide taskbar requires a physical 2px margin at the edge of the monitor to capture mouse cursor hover events. Any chromeless window that maximizes to absolute fullscreen covers this trigger area, disabling the taskbar slide-up.

---

## 3. Project Compilation status
* Run `taskkill /F /IM YTTV.exe` to unlock binary hooks.
* Run `dotnet build` inside `src-csharp/YTTV/` to verify compiler correctness. 
* Compile status: **Successful (0 errors, 0 warnings).**
