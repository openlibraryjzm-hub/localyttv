# Local Image Pipeline Integration

This document describes the end-to-end pipeline for importing, processing, storing, and reactively rendering local image files within yttv2 playlists.

**Related Documentation:**
- `localfiles2026.md` — Local video pipeline, Axum streaming server overview
- `cards/card-local-image.md` — Local Image Card component & visual design
- `database-schema.md` — Database schemas and the `playlist_items` table
- `api-bridge.md` — Tauri command bridge documentation

---

## 1. Architecture Overview

Local images are fully integrated alongside YouTube videos and local video files, achieving complete parity in playlist management, folder assignment, pinning, rating, and watch history tracking.

```
┌─────────────────────────────────────────────────────────────┐
│  User drags/uploads local image(s) via PlaylistUploader      │
│                            ↓                                │
│  Path parser identifies image extensions (.png, .jpg, etc.)  │
│                            ↓                                │
│  Axum HTTP server streams the raw image from disk            │
│                            ↓                                │
│  Client-side Canvas resizes & extracts base64 JPEG thumbnail │
│                            ↓                                │
│  Database checks for duplicate paths & deletes old records  │
│                            ↓                                │
│  SQLite inserts record: is_local = 1, thumbnail, no duration│
│                            ↓                                │
│  Zustand store triggers global reactive UI re-render        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion & File Processing

When a user imports content (via file drop or folder selection), the ingestion logic in [PlaylistUploader.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/PlaylistUploader.jsx) performs the following:

### Extension Detection
The path parser uses the following case-insensitive regular expression to distinguish local image assets from local video files:
```javascript
const isImg = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(videoPath);
```

### Thumbnail Extraction (`extractImageMetadata`)
Rather than saving heavy raw image files directly to the SQLite database (which would cause database bloat and performance degradation), the browser engine resizes the image down to a compact base64 JPEG:
1. An off-screen HTML `Image` object is created with `crossOrigin = 'anonymous'`.
2. A timeout is set for 6 seconds; if the image fails to load in that window, it resolves with `null` metadata to keep bulk uploads from hanging.
3. Upon loading, a `<canvas>` is instantiated with a maximum width of `640px` (preserving the natural aspect ratio).
4. The image is drawn to the canvas and exported:
   ```javascript
   const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
   ```
5. The function returns a base64 thumbnail string and `isPortrait` aspect ratio metadata.

---

## 3. Database Schema Mapping

Local images are saved in the SQLite `playlist_items` table with the following column configurations:

| Column | Value / Type | Purpose |
|--------|--------------|---------|
| `video_url` | `String` (absolute file path) | Path on the user's hard drive |
| `video_id` | `String` (e.g., `local_C__path_to_image_png`) | Safe alphanumeric identifier generated from path |
| `title` | `String` (filename) | Extracted file base name |
| `thumbnail_url` | `String` (base64 data URL) | Compact resized JPEG thumbnail |
| `author` | `"Local Image"` | String identifier for item category |
| `is_local` | `1` (Boolean `true`) | Flags item as local storage asset |
| `duration_seconds` | `NULL` | Explicitly null (no playback duration) |

---

## 4. Cache-Busting & Duplicate Management

Because local files have stable absolute paths, WebViews aggressively cache stream responses from the Tauri local HTTP server. To ensure correct updates when a file changes on disk, the system employs cache-busting and duplicate replacement workflows.

### Cache-Busting Query Parameters
When fetching the stream URL from the backend server, the app appends a unique timestamp query parameter:
```javascript
const streamUrl = await invoke('get_video_stream_url', { filePath: videoPath });
const streamUrlWithCacheBust = `${streamUrl}?t=${Date.now()}`;
```
This forces the browser's HTTP cache to fetch the fresh resource from disk rather than rendering stale cached bytes.

### Duplicate Replacement
If a user uploads a local image that already exists in the destination playlist, checking for duplicates triggers a deletion first:
1. The app invokes `removeVideoFromPlaylist(playlistId, videoId)` to purge the existing record.
2. The uploader extracts fresh thumbnail metadata from the file on disk.
3. The app invokes `addVideoToPlaylist()` to insert the clean record, updating the base64 thumbnail string.

---

## 5. Global Reactivity Sync

To ensure real-time UI updates (e.g., sidebar counts incrementing, page grid rendering immediately after upload completes):
1. Write/mutation functions in [playlistApi.js](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/api/playlistApi.js) call a global `triggerUpdate()` helper.
2. `triggerUpdate` increments a `playlistUpdateTrigger` counter in `usePlaylistStore` (Zustand).
3. Components like [PlaylistList.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/PlaylistList.jsx) subscribe to `playlistUpdateTrigger` and refresh their data automatically:
   ```javascript
   const playlistUpdateTrigger = usePlaylistStore(state => state.playlistUpdateTrigger);
   useEffect(() => {
     loadPlaylists();
   }, [playlistUpdateTrigger]);
   ```

---

## 6. Rendering Performance Optimizations

To address rendering lag and page transition stutter caused by mounting multiple heavy base64 image strings in the DOM:

### 6.1 Aspect-Ratio Recalculation Cache (`hasCheckedRef`)
- **Problem**: Reading `naturalWidth` and `naturalHeight` in standard image load events triggers forced synchronous layout reflows (layout thrashing) as the browser has to calculate dimensions dynamically.
- **Solution**: Implemented a React reference `hasCheckedRef` in `LocalImageCard.jsx` and `CardThumbnail.jsx`. The aspect ratio is measured on the first `onLoad` trigger and saved, with subsequent load events returning early.
- **Support for Virtualization/Recycling**: A `useEffect` hook resets `hasCheckedRef.current = false` when `thumbnailUrl` (or image `src`) changes, ensuring recycled cards re-calculate aspect ratios accurately.

### 6.2 CSS Transition Scopes
- **Problem**: Card wrapper elements used `transition-all`. Under CSS Grid layout, resizing or hovering triggered layout reflow computations for the parent grid containers.
- **Solution**: Replaced `transition-all` with explicit `transition-colors` on the card borders/backgrounds to prevent layout reflows during hover zooms.

### 6.3 Lazy Loading
- **Solution**: Added `loading="lazy"` to the `<img>` elements of all local image cards and thumbnail wrappers to defer resource load and decoding cycles until items approach the active viewport.

