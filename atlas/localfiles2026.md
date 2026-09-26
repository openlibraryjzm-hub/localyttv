# Local File System Integration (2026)

Documentation for the full local video ingestion pipeline: streaming server, browser-side thumbnail extraction, database insertion, and the unified folder-aware import UI built into `PlaylistUploader`.

**Related Documentation:**
- `videoplayer.md` — Player engine selection logic (YouTube vs LocalVideoPlayer)
- `modal-addcontent.md` — PlaylistUploader UI & bubble system
- `database-schema.md` — `is_local` column, `playlist_items` schema
- `api-bridge.md` — Tauri command catalog

---

## 1. Architecture Overview

Local video support is a fully **client-side pipeline** — no external transcoding, no server API calls. It works entirely within the Tauri runtime using three coordinated layers:

```
┌──────────────────────────────────────────────────────────────┐
│  User picks file(s) or folder via OS picker                  │
│              ↓                                               │
│  Tauri backend returns absolute file path(s)                 │
│              ↓                                               │
│  Axum Streaming Server exposes path as http://localhost:PORT  │
│              ↓                                               │
│  Hidden <video> element loads stream URL → metadata capture  │
│              ↓                                               │
│  <canvas> captures frame → base64 JPEG thumbnail             │
│              ↓                                               │
│  addVideoToPlaylist() → SQLite (is_local=1, thumbnail, dur.) │
│              ↓                                               │
│  LocalVideoPlayer streams the same URL for playback         │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Axum Streaming Server

### Purpose
The WebView (browser context) cannot access raw Windows filesystem paths like `C:\Users\jodyn\Videos\clip.mp4` directly via `<video src="...">`. The Tauri backend runs a lightweight **Axum HTTP server** that maps file paths to local HTTP URLs, bridging the gap.

### How it Works
- On startup, Tauri launches an Axum server on a dynamic localhost port (e.g. `http://127.0.0.1:7891`).
- The Rust command `get_video_stream_url` takes an absolute file path and returns a `http://127.0.0.1:{PORT}/stream?path=...` URL.
- The Axum handler streams the file bytes with HTTP range request support (needed for scrubbing).
- CORS is permissive for localhost origins so the WebView can fetch freely.

### Key Files
| File | Role |
|------|------|
| `src-tauri/src/commands.rs` | `get_video_stream_url` command — maps path → stream URL |
| `src-tauri/src/lib.rs` | Axum server startup, port binding |

### `get_video_stream_url` Signature
```rust
#[tauri::command]
pub fn get_video_stream_url(file_path: String) -> Result<String, String>
```
Returns: `"http://127.0.0.1:{PORT}/stream?path={encoded_path}"`

---

## 3. Client-Side Metadata Extraction (`extractVideoMetadata`)

### Location
`src/components/PlaylistUploader.jsx` (top-level helper, outside component)

### What it Does
Given a stream URL (from `get_video_stream_url`), this function:
1. Creates a hidden `<video>` element off-screen.
2. Sets `crossOrigin = 'anonymous'`, `preload = 'metadata'`.
3. Waits for `loadedmetadata` → captures `video.duration`.
4. Seeks to **10% of duration** (avoids black opening frames).
5. Waits for `seeked` → draws the frame onto a `<canvas>`.
6. Calls `canvas.toDataURL('image/jpeg', 0.7)` → base64 JPEG string.
7. Cleans up both elements and resolves the Promise.

### Return Shape
```js
{
  thumbnailUrl: "data:image/jpeg;base64,...",  // null on failure
  duration: 312.4                               // seconds, null on failure
}
```

### Error Handling
- Any network error, codec failure, or timeout resolves `{ thumbnailUrl: null, duration: null }` rather than throwing — so bulk imports continue even if one file fails.

### Aspect Ratio Awareness
`extractVideoMetadata` also captures `video.videoWidth` / `video.videoHeight` (available after `loadedmetadata`). This is used downstream by `LocalVideoPlayer` and `CardThumbnail` for correct letterboxing:
- **Portrait videos** (height > width) → `object-fit: contain` with black bars.
- **Landscape/square** → `object-fit: cover`.

---

## 4. LocalVideoPlayer Component

### Location
`src/components/LocalVideoPlayer.jsx`

### Role
HTML5 `<video>` player used when `isCurrentVideoLocal === true` in `App.jsx`. Completely replaces the YouTube IFrame player for local content.

### Key Behaviours
- Resolves the file path to a stream URL via `invoke('get_video_stream_url', { filePath: videoUrl })` on mount.
- Renders a native `<video>` element with custom controls overlay (progress bar, time counter, play/pause, volume).
- Handles `onLoadedMetadata` to capture `videoWidth`/`videoHeight` → dynamically sets `aspect-ratio` CSS property on the video element so the browser letterboxes correctly without cropping.
- CSS uses `object-fit: contain` + `max-width: 100%` / `max-height: 100%` inside an `overflow: hidden` container that is constrained by CSS Grid `min-height: 0` (see `LayoutShell.css`).

### How `App.jsx` Selects the Player
```js
const isCurrentVideoLocal = React.useMemo(() => {
  if (currentPlaylistItems.length > 0 && ...) {
    const item = currentPlaylistItems[currentVideoIndex];
    const isYouTube = item.video_url?.includes('youtube.com') || item.video_url?.includes('youtu.be');
    return item.is_local || !isYouTube;   // ← dual guard: DB flag OR URL shape
  }
  if (currentVideoUrl) {
    return !currentVideoUrl.includes('youtube.com') && !currentVideoUrl.includes('youtu.be');
  }
  return false;
}, [...]);
```

> **Critical**: The dual guard (`item.is_local || !isYouTube`) was introduced to fix a startup crash. If the app restores from watch history and the DB `is_local` field hasn't been read yet, the URL-shape check catches the local file and prevents `YouTubePlayer` from trying to use the file path as a YouTube video ID (which throws an uncaught IFrame API error).

---

## 5. Database Integration

### `playlist_items` Column
```sql
is_local INTEGER NOT NULL DEFAULT 0
```
`1` = local file, `0` = YouTube. Added via migration (safe on existing databases).

### How Local Videos Are Stored
| Field | Value |
|-------|-------|
| `video_url` | Absolute OS path: `C:\Users\...\clip.mp4` |
| `video_id` | `local_C__Users___clip_mp4` (sanitized path, all non-alphanumeric → `_`) |
| `title` | Filename: `clip.mp4` |
| `thumbnail_url` | base64 JPEG data URL (or `null` if extraction failed) |
| `duration_seconds` | Integer seconds (or `null`) |
| `author` | `"Local File"` |
| `is_local` | `1` |

### Thumbnail Storage Note
Thumbnails are stored as base64 strings directly in the `thumbnail_url` column. This is pragmatic for typical libraries. For very large libraries (1000+ local videos), consider migrating to a file-system thumbnail cache to reduce DB size.

---

## 6. PlaylistUploader Integration

### The Add Tab — Unified Workflow
Local videos are imported **within the primary Add tab** alongside YouTube links. There is no dedicated local video tab. This means all local files benefit from:
- **Folder Prism pre-assignment** — select a color tab before picking files, all selected content lands in that colored folder.
- **Same progress UI** — the status bar shows per-file extraction progress.
- **Duplicate detection** — the same `video_id` dedup logic applies.

### Upload Buttons
Two buttons sit below the Link Bubble input box:

| Button | Color | Handler | Backend Command |
|--------|-------|---------|----------------|
| **Upload from Device** | Slate/grey | `handleSelectLocalVideosForAdd` | `select_video_files` |
| **Upload Folder** | Teal | `handleSelectLocalFolderForAdd` | `select_video_folder` |

### Upload from Device (Individual Files)
- Opens native multi-select file picker filtered to video extensions.
- Each selected path is appended directly to the active segment's link input as a raw file path.
- Renders as a **emerald-green "Local Video"** bubble in `LinkBubbleInput`.

### Upload Folder (Whole Directory)
- Opens native folder/directory picker (single selection).
- The selected path is stored as a **`local:device_folder:<path>` token** in the bubble input.
- Renders as a distinct **teal "Device Folder"** bubble.
- **Folder Tracker Card Creation**: On import, instead of just flat-importing files once, the system creates a **Folder Tracker Card** (`isFolderTracker: true` and `video_url` prefixed with `local:device_folder:`). This card persists in the playlist, showing the folder path on hover and serving as the anchor for future syncs.
- **Initial Sync**: The system immediately performs an initial sync by scanning the directory for media files (videos and images), extracting base64 thumbnails and durations, and inserting them into SQLite.
- **Ongoing Synchronization**: The Folder Tracker Card appears in the Subscriptions Manager under "Tracked Folders", permitting manual or bulk background updates to pull in new media files as they are added to the directory.

---

## 7. Bubble System — Local Types

`LinkBubbleInput` (embedded in `PlaylistUploader`) recognises several local token formats:

| Token Shape | Bubble Label | Color |
|-------------|-------------|-------|
| Windows path (`C:\...`) or Unix path (`/...`) | **Local Video** | Emerald green |
| `local:device_folder:<path>` | **Device Folder** | Teal |
| `local:playlist:<id>` | **Local List** | Sky blue |
| `local:folder:<pid>:<color>` | **Local Folder** | Indigo |

The displayed text in each bubble strips the `local:…:` prefix via:
```js
link.replace(/^local:(playlist|folder|device_folder):/, '')
```
So the user sees the clean path, not the internal token format.

---

## 8. Import Task Processing (`handleAddSubmit`)

`parseLinks()` splits the bubble input text line-by-line. Local paths and tokens are treated as single atomic items (no whitespace splitting) to preserve paths with spaces.

The main task loop in `handleAddSubmit` uses branching to dispatch each URL type:

```
url is Windows/Unix path or ends in video extension
  → extract thumbnail + duration inline → insert as local video

url.startsWith('local:device_folder:')
  → invoke('get_videos_in_directory', { dirPath })
  → iterate returned paths
  → extract thumbnail + duration for each
  → insert all as local videos

url.startsWith('local:playlist:')  → fetchLocalPlaylistVideos()
url.startsWith('local:folder:')    → fetchLocalFolderVideos()
else                                → fetchPlaylistVideos() (YouTube API)
```

Progress updates are shown per-file during folder imports: `"Extracting thumbnail for folder video (3/12): clip.mp4..."`.

---

## 9. New Rust Commands (May 2026)

Two new commands were added to `src-tauri/src/commands.rs` and registered in `src-tauri/src/lib.rs`:

### `select_video_folder`
```rust
#[tauri::command]
pub async fn select_video_folder(app: tauri::AppHandle) -> Result<Option<String>, String>
```
Opens the native OS folder picker via `tauri-plugin-dialog`. Returns the selected folder path as a `String`, or `None` if cancelled.

### `get_videos_in_directory`
```rust
#[tauri::command]
pub fn get_videos_in_directory(dir_path: String) -> Result<Vec<String>, String>
```
Synchronously reads a directory, filters for files with video extensions (`mp4`, `mkv`, `avi`, `mov`, `webm`, `flv`, `wmv`, `m4v`, `mpg`, `mpeg`), sorts alphabetically, and returns absolute paths. Does **not** recurse into subdirectories (flat scan only).

---

## 10. CardThumbnail Aspect Ratio Handling

`src/components/CardThumbnail.jsx` avoids cropping portrait-orientation thumbnails by dynamically detecting aspect ratios.

### Detection Logic & Optimization
On `<img>` `onLoad`, the component calculates:
```js
const isPortrait = naturalHeight > naturalWidth * 1.05; // 5% tolerance
```
To prevent forced synchronous layout thrashing from repeatedly reading layout properties, this check is cached using a React ref (`hasCheckedRef`). The calculation only runs on the first load trigger, and the ref is reset via `useEffect` whenever the image's source `src` changes.

### Rendering
- **Portrait**: `object-fit: contain`, `background: black` → letterboxed with black bars.
- **Landscape/Square**: `object-fit: cover` → fills the card space (standard behaviour for YouTube thumbnails).

This is particularly important because local video thumbnails are captured at native video resolution, which can be anything from 9:16 portrait to 21:9 ultrawide.

---

## 11. Known Limitations & Future Work

| Item | Notes |
|------|-------|
| **Codec Support** | Thumbnail extraction uses the WebView's built-in codec support. HEVC/H.265 may fail on older WebView2 versions. Failures gracefully return `null` thumbnail. |
| **DB Thumbnail Size** | base64 thumbnails inflate DB size. Consider a file-system cache (`%APPDATA%/yttv2/thumbs/`) for large libraries. |
| **No Recursive Folder Scan** | `get_videos_in_directory` is flat (one level). Nested subfolders are not scanned. |
| **No Re-extraction** | If a local video's thumbnail is `null` after import, there is no built-in "retry thumbnail" action. |
| **Watch History Restore** | Local videos in watch history restore correctly via the non-YouTube URL fallback in `isCurrentVideoLocal`. If the path no longer exists on disk, the streaming server will return a 404 and the player will show an error. |
