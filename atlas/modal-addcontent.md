# Add Content Modal (Playlist Uploader)

The Add Content Modal (`PlaylistUploader.jsx`) is the primary interface for importing and assigning media into the app. It supports parsing raw URLs, fetching metadata from YouTube/Twitter endpoints, and delegating those items into the user's localized playlists and colored folders — including local video files from the device.

**Detailed local file pipeline:** See `localfiles2026.md`

---

## 1. Link Bubbles (`LinkBubbleInput`)

Instead of standard textareas, the modal uses a custom tagging system (Discord-style) where pasted links or text separated by spaces/newlines immediately tokenize into interactive blocks.

### Recognized Formats

| Label | Color | Trigger |
|-------|-------|---------|
| **Playlist** | Purple | `youtube.com/playlist?list=` |
| **Video** | Red | `youtube.com/watch?v=`, `youtu.be/` |
| **Channel** | Orange | `youtube.com/channel/`, `youtube.com/@` |
| **Local Video** | Emerald green | Windows path (`C:\...`), Unix path, or file ending in `.mp4/.mkv/...` |
| **Device Folder** | Teal | `local:device_folder:<path>` token (set by Upload Folder button) |
| **Local List** | Sky blue | `local:playlist:<id>` |
| **Local Folder** | Indigo | `local:folder:<pid>:<color>` |

The `local:…:` prefix is stripped from bubble display text, so users see the clean path rather than the internal token.

**Interactivity:** Bubbles can be deleted individually via an "x" button or erased sequentially using standard `Backspace` mechanics.

---

## 2. Folder Prism Assignment

Right above the link input box sits a segmented "Folder Prism" modeled after the sticky sort bars found on the Videos Page.

- **'All' Segment:** Serves as the "No Folder Assignment" default (white/black styling).
- **16 Colored Segments:** Dynamically update the context of the Link Bubble input. Clicking a red segment ensures all links pasted into the input are automatically assigned to the Red Folder upon successful addition.
- **Micro-Counters:** Tiny badges appear on the folder segments to give users a live count of how many links they have staged for each target folder.

---

## 3. Local Upload Buttons

Below the Link Bubble input, two device-upload buttons are available side-by-side:

### Upload from Device (individual files)
- Opens the native OS **multi-select file picker** filtered to video extensions.
- Each selected file path is appended to the currently active folder segment's bubble input.
- Files appear as **emerald "Local Video"** bubbles.

### Upload Folder (whole directory)
- Opens the native OS **folder picker** (single folder selection).
- The folder path is stored as a `local:device_folder:<path>` token in the bubble input.
- Appears as a **teal "Device Folder"** bubble.
- On import, the backend scans the directory (flat, non-recursive) for all video files, sorted alphabetically, and processes each with thumbnail + duration extraction.

Both buttons respect the **active Folder Prism segment** — picking files/folders while the Blue tab is active means all ingested videos will be assigned to the Blue folder.

---

## 4. Extraction & Import Mechanics

When the user clicks "Extract Content":

1. The app iterates through all Link Bubble inputs spanning the Folder Prism.
2. It evaluates the type of string provided:
   - **YouTube Videos/Playlists/Channels:** Fetched via YouTube Data API v3.
   - **Local video path:** Resolved via Axum streaming server → thumbnail and duration extracted client-side → inserted directly with `is_local = true`.
   - **Device Folder token (`local:device_folder:`):** Backend scans directory → each video file gets the same inline extraction treatment.
   - **`local:playlist:` / `local:folder:`:** Fetches existing videos from the local DB.
3. Duplicates strictly matching against the target playlist's `video_id` are skipped.
4. Accepted items are physically added to the app database with standard metadata (thumbnail, duration, author) populated.

---

## 5. Location

- Component: `src/components/PlaylistUploader.jsx`
- Bubble Input: inline `LinkBubbleInput` sub-component within `PlaylistUploader.jsx`
- Local Metadata Extraction: `extractVideoMetadata()` helper at top of `PlaylistUploader.jsx`
- Parsing Utilities: `src/utils/youtubeUtils.js`
- Backend Commands: `src-tauri/src/commands.rs` (`select_video_files`, `select_video_folder`, `get_videos_in_directory`, `get_video_stream_url`)
