# History Page

The History Page displays a vertically scrolling list of the last 100 watched videos, emphasizing cross-playlist contexts and relative timestamps.

**Related Documentation:**
- **Navigation Flows**: See `navigation-routing.md` for page changes.
- **Backdrop System**: See `blurred-banner-backdrop-system.md` for background styling.
- **Card UI**: See `card-video.md` for standard card interactions.

---

## 1. Visual Structure & Layout

- **Atmospheric Blurred App Banner Backdrop**:
  - Anchored on a solid `bg-slate-950` container with an absolute positioned blurred banner overlay (`filter: blur(36px)`, `transform: scale(1.25)`, `opacity: 0.85`), dynamically synced to the active App Banner / preset image in real-time.

- **Sticky Top Navbar (`BottomNavigation.jsx`)**:
  - A sticky top header card (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl p-2.5 shadow-md sticky top-0 z-40`).
  - **Left Side**: Page title ("Watch History") in bold dark navy text (`text-[#052F4A] font-black`).
  - **Right Side**: Action pills for **Back** (`ChevronLeft` chevron arrow) and **Close** (`X` button, toggles `setViewMode('full')`).

- **Vertical List Layout**:
  - Full-width edge-to-edge horizontal cards stacked vertically into a single column.
  - The page natively supports standard vertical scrolling.

- **History Cards (Horizontal Formatting)**:
  - **Backing**: Solid light card surface (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl shadow-md hover:bg-slate-200/95`).
  - **Left Side (Thumbnail)**: Fixed width 16:9 thumbnail matching standard styling with `#052F4A` border. Includes the "Currently Playing" red ring identifier when active.
  - **Right Side (Content)**: Video Title in dark navy (`#052F4A`), Pin Marker (Amber/Sky), and watch timestamp ("Just now", "2 hours ago", "Jan 15, 2024").

## 2. Interaction & Logic

- **Deduplication Engine**:
  - Prevents listing the same video multiple times if repeatedly accessed.
  - If a video is re-watched, the previous history entry is automatically destroyed, and the entry is promoted to the top of the list (most recent).

- **Data Flow Initialization**:
  - `loadAllData()` triggers on component mount.
  - Calls `getAllPlaylists()`, then `getWatchHistory(100)`, followed seamlessly by `getPlaylistsForVideoIds(videoIds)` to establish the map linking videos to any playlists and folder assignments (`folderMap`/`folderNameMap`).

- **Video Clicks**:
  - Clicking any history card searches the internal databases for exactly *which* playlist the video lives in, natively loads that playlist state into the `playlistStore`, synchronizes the current index, and initiates playback perfectly.
