# Porting Checklist: React/Rust to C# WebView2

## 1. Frontend Core (The View)
These files constitute the UI and client-side logic. They run inside WebView2.

### Configuration & Build
- [ ] `package.json` (Dependencies and scripts)
- [ ] `vite.config.js` (Build configuration)
- [ ] `tailwind.config.js` (Styling configuration)
- [ ] `postcss.config.js` (CSS processing)
- [ ] `index.html` (Entry point)

### Source Code
- [ ] `src/main.jsx` (React Bootstrapper)
- [ ] `src/App.jsx` (Root Component)
- [ ] `src/LayoutShell.jsx` (Main Layout)
- [ ] `src/App.css` & `src/LayoutShell.css` (Global Styles)
- [ ] `src/components/` (Directory: All React Components)
- [ ] `src/store/` (Directory: State Management)
- [ ] `src/utils/` (Directory: Helper Utils)
- [ ] `src/assets/` (Directory: Static Assets)

### The Bridge (Critical)
- [ ] `src/api/playlistApi.js`
    *   **Action**: This file calls `invoke('command_name')`. You must refactor this to call C# (e.g. `window.chrome.webview.postMessage`) or inject a polyfill for `invoke`.

### Implicit Plugin Dependencies (Hidden Logic)
Some components call Tauri "Plugins" directly, bypassing `commands.rs`. You must implement handlers for these string keys in C# as well.

- [ ] **`src/components/NativeVideoPlayer.jsx`**
    *   **Dependencies**: Uses `tauri-plugin-mpv-api`.
    *   **Calls**: `plugin:mpv|init`, `plugin:mpv|command`, `plugin:mpv|destroy`.
    *   **C# Action**: Your `Invoke` handler must trap these strings. `init` should embed the MPV HWND into the window. `command` should forward args to the C# MPV wrapper.


---

## 2. Backend Core (The Logic)
These files contain the business logic that usually runs in Rust/Node. You must port this logic to C# classes/controllers.

### API Definition (The Interface)
- [ ] **`src-tauri/src/commands.rs`**
    *   **Purpose**: Defines every function callable from the frontend.
    *   **C# Action**: Create a `Bridge` or `Controller` class in C# that implements methods with matching names (or simpler names if you refactor the JS).
    *   **Key Methods**: `get_all_playlists`, `update_video_progress`, `start_audio_capture`, etc.

### Data Layer (The Model)
- [ ] **`src-tauri/src/database.rs`**
    *   **Purpose**: Handles all SQLite database interactions.
    *   **C# Action**: Port to generic ADO.NET, Dapper, or Entity Framework. Replicate the SQL queries found here.
- [ ] **`src-tauri/src/models.rs`**
    *   **Purpose**: Rust structs defining the data shape (Playlist, Video, Folder).
    *   **C# Action**: Create matching C# `class` or `record` types to ensure JSON serialization matches what the frontend expects.
- [ ] **`src-tauri/Cargo.toml`** (Reference)
    *   **Purpose**: Lists dependencies.
    *   **C# Action**: Use to identify necessary Nuget packages (e.g. `rusqlite` -> `System.Data.SQLite` or `Microsoft.Data.Sqlite`).
- [ ] **`playlists.db`**
    *   **Purpose**: The pre-populated SQLite database file containing all your potential data.
    *   **C# Action**: Copy to your C# project (e.g. to the output directory or `AppDate`). Ensure the connection string points to this file.

### Streaming & Media Services
- [ ] **`src-tauri/src/streaming_server.rs`**
    *   **Purpose**: Creates a local HTTP server to stream large video files from disk to the generic HTML5 video player.
    *   **C# Action**: Implement a localized `HttpListener` or ASP.NET Core `Kestrel` instance to serve files from `localhost`.
- [ ] **`src-tauri/src/audio_capture.rs`**
    *   **Purpose**: Captures system audio for the visualizer.
    *   **C# Action**: Port to `NAudio` (WASAPI Loopback Capture). This needs to send FFT data arrays to the frontend around 60 times a second.

### App Orchestration
- [ ] **`src-tauri/src/lib.rs`** (Reference)
    *   **Purpose**: Shows how the database and servers are initialized and threaded.
    *   **C# Action**: Use as a guide for your `MainWindow.xaml.cs` or `App.xaml.cs` startup logic (Init DB -> Start Server -> Init WebView).
