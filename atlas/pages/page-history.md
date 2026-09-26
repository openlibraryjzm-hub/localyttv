# History Page

The History Page displays a vertically scrolling list of the last 100 watched videos, emphasizing cross-playlist contexts and relative timestamps.

**Related Documentation:**
- **Navigation Flows**: See `navigation-routing.md` for page changes.
- **Card Menus**: See `video-tweet-card-three-dot-menu.md`.
- **Card UI**: See `card-video.md` for standard card interactions.

---

## 1. Visual Structure & Layout

- **Vertical List Layout**:
  - Horizontal cards stacked vertically into a single column.
  - The page natively supports standard vertical scrolling.

- **Page Banner**:
  - Automatically generates interactive badges for every unique playlist that contains videos from the user's watch history.
  - **Badge Limit**: Limited to 2 rows of badges, with a toggleable expand button (`>>>`) to reveal the full set.
  - **Interactions**:
    - **Left Click**: Toggles a filter on the history list to display *only* videos belonging to that clicked playlist. The badge highlights brighter, displaying "Videos from '[Playlist Name]'".
    - **Right Click**: Executes a silent background fetch, routing the user completely away to the Videos Page for that playlist in **Preview Mode** without interrupting the currently playing video.

- **History Cards (Horizontal Formatting)**:
  - **Left Side (Thumbnail)**: Fixed width 16:9 thumbnail matching standard styling. Includes the "Currently Playing" red ring identifier.
  - **Right Side (Content)**: Video Title, Pin Marker (Amber/Sky), and two distinct metadata rows.
    - **Top Row (Playlist/Folder Labels)**: "Playlist Name - Folder Name". These elements are individually clickable (Left clicking playlist name routes to full playlist in preview mode; clicking folder name routes directly to the folder in preview mode).
    - **Bottom Row**: Relative time elapsed since watching ("Just now", "2 hours ago", "Jan 15, 2024").

## 2. Interaction & Logic

- **Deduplication Engine**:
  - Prevents listing the same video multiple times if repeatedly accessed.
  - If a video is re-watched, the previous history entry is automatically destroyed, and the entry is promoted to the top of the list (most recent).

- **Data Flow Initialization**:
  - `loadAllData()` triggers on component mount.
  - Calls `getAllPlaylists()`, then `getWatchHistory(100)`, followed seamlessly by `getPlaylistsForVideoIds(videoIds)` to establish the map linking videos to any playlists and folder assignments (`folderMap`/`folderNameMap`).

- **Video Clicks**:
  - Clicking any history card searches the internal databases for exactly *which* playlist the video lives in, natively loads that playlist state into the `playlistStore`, synchronizes the current index, and initiates playback perfectly.
