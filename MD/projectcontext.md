# Project Context: YouTube TV v2 (yttv2)

## Overview

**yttv2** is a desktop application built with Tauri (Rust + React) for managing and playing YouTube playlists. The app provides a modern, grid-based interface for browsing playlists and videos, with full SQLite database integration for persistent storage.

### Core Features
- **Playlist Management**: Create, import, view, export, and delete YouTube playlists
- **Video Playback**: Play videos from playlists with a custom YouTube player with progress tracking
- **Database Storage**: SQLite backend for persistent playlist and video data
- **YouTube Integration**: Import playlists directly from YouTube using Data API v3
- **JSON Import/Export**: Bulk import playlists via JSON configuration files, export playlists with folder assignments
- **Colored Folders**: 16-color folder system for organizing videos within playlists
- **Watch History**: Track last 100 watched videos with timestamps
- **Watch Progress**: Track video playback progress (unwatched, partially watched, watched ≥85%)
- **Tab System**: Organize playlists into tabs with presets for different workspace configurations
- **Pin System**: Session-only pinning of videos for quick access
- **Bulk Operations**: Bulk tag videos to folders, bulk import playlists with folder assignments
- **Grid UI**: Modern 3-column grid layout for playlists and videos
- **Responsive Layout**: Multiple view modes (full, half, quarter) with flexible layout system
- **Sticky Folders**: Pin colored folders to remain visible regardless of parent playlist state
- **Radial Menu**: Animated radial menu system with scroll wheel navigation, positioned at top-left of layout

---

## Tech Stack

### Frontend
- **React 19.1.0** - UI framework
- **Vite 7.0.4** - Build tool and dev server
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Zustand 5.0.9** - Lightweight state management
- **GSAP 3.14.2** - Animation library for radial menu morphing animations
- **@tauri-apps/api ^2** - Tauri frontend API bindings

### Backend
- **Tauri 2** - Desktop app framework (Rust + WebView)
- **Rust** - Backend language
- **SQLite (rusqlite 0.32)** - Embedded database with bundled feature
- **serde/serde_json** - Serialization for Rust-JS communication
- **chrono 0.4** - Date/time handling

### Development Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **@vitejs/plugin-react** - React plugin for Vite

---

## Project Structure

```
yttv2/
├── src/                          # Frontend React application
│   ├── api/                      # API layer for Tauri commands
│   │   └── playlistApi.js       # All playlist/video database operations
│   ├── components/               # React components
│   │   ├── PlayerController.jsx  # Top controller (orb + rectangles UI) - Advanced version with preview navigation, colored shuffle, likes
│   │   ├── YouTubePlayer.jsx     # YouTube iframe player component
│   │   ├── TopNavigation.jsx     # Navigation tabs (Playlists/Videos/History)
│   │   ├── PlaylistsPage.jsx     # Main playlists grid view
│   │   ├── VideosPage.jsx        # Videos grid view for current playlist
│   │   ├── HistoryPage.jsx       # Watch history display (last 100 videos)
│   │   ├── PlaylistList.jsx      # Sidebar playlist list component
│   │   ├── PlaylistView.jsx      # Individual playlist video grid
│   │   ├── PlaylistUploader.jsx  # Import playlists (YouTube/JSON)
│   │   ├── PlaylistsButton.jsx   # Toggle button for sidebar
│   │   ├── Card.jsx              # Base card component
│   │   ├── CardThumbnail.jsx     # Thumbnail display component
│   │   ├── CardContent.jsx       # Card content (title, subtitle, metadata)
│   │   ├── CardActions.jsx       # Quick actions and menu management
│   │   ├── CardMenu.jsx          # Enhanced 3-dot menu with submenu support
│   │   ├── VideoCard.jsx         # Video card implementation
│   │   ├── FolderCard.jsx        # Colored folder card component
│   │   ├── FolderSelector.jsx    # 16-color folder selector
│   │   ├── BulkTagColorGrid.jsx  # Bulk tagging color grid
│   │   ├── TabBar.jsx            # Tab navigation component
│   │   ├── AddPlaylistToTabModal.jsx  # Modal for adding playlists to tabs
│   │   ├── TabPresetsDropdown.jsx     # Tab preset selector
│   │   ├── BulkPlaylistImporter.jsx   # Bulk import modal with 17 fields
│   │   └── PlaylistFolderSelector.jsx  # Universal playlist/folder selector
│   ├── store/                    # Zustand state management
│   │   ├── layoutStore.js        # View mode, menu state
│   │   ├── navigationStore.js    # Current page (playlists/videos/history)
│   │   ├── playlistStore.js      # Current playlist items, video index
│   │   ├── folderStore.js        # Folder state, bulk tagging, show folders
│   │   ├── tabStore.js           # Tab state management
│   │   ├── tabPresetStore.js     # Tab preset state management
│   │   └── pinStore.js           # Pin state management (session-only)
│   ├── utils/                    # Utility functions
│   │   ├── youtubeUtils.js       # YouTube URL parsing, thumbnails, API
│   │   ├── initDatabase.js       # Database initialization (no test data)
│   │   └── folderColors.js       # Folder color utilities
│   ├── LayoutShell.jsx           # Main layout component (grid system)
│   ├── LayoutShell.css           # Layout styles
│   ├── App.jsx                   # Root component, app orchestration
│   ├── App.css                   # App-level styles
│   └── main.jsx                  # React entry point
│
├── src-tauri/                    # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs               # Entry point (calls lib.rs)
│   │   ├── lib.rs                # Tauri app setup, command registration
│   │   ├── commands.rs           # Tauri command handlers (invoke from JS)
│   │   ├── database.rs           # SQLite database operations
│   │   └── models.rs             # Rust data structures
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
├── playlists.db                  # SQLite database file (project root)
├── package.json                  # Node.js dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── DATABASE_SETUP.md             # Database schema documentation
```

---

## File Breakdown

### Frontend Files

#### Core Application
- **`src/main.jsx`**: React entry point, renders App component
- **`src/App.jsx`**: Root component that:
  - Initializes database on mount
  - Manages layout modes (full/half/quarter)
  - Orchestrates component rendering based on state
  - Handles playlist/video selection logic
  - Tracks watch history (automatically adds videos to history when played)
  - Renders HistoryPage when history tab is active
- **`src/LayoutShell.jsx`**: Flexible layout system component that:
  - Manages view modes (full, half, quarter)
  - Handles menu quarter mode toggle
  - Provides slots for: topController, mainPlayer, miniHeader, sideMenu

#### State Management (`src/store/`)
- **`layoutStore.js`**: 
  - `viewMode`: 'full' | 'half' | 'quarter'
  - `menuQuarterMode`: boolean
  - Functions: `setViewMode`, `toggleMenuQuarterMode`
- **`navigationStore.js`**:
  - `currentPage`: 'playlists' | 'videos' | 'history'
  - Function: `setCurrentPage`
- **`playlistStore.js`**:
  - `showPlaylists`: boolean (sidebar toggle)
  - `currentPlaylistItems`: array of video items
  - `currentVideoIndex`: number
  - `previewPlaylistItems`: array of preview video items (null when not in preview)
  - `previewPlaylistId`: number | null (preview playlist ID)
  - `previewFolderInfo`: { playlist_id, folder_color } | null (preview folder info)
  - Functions: `setShowPlaylists`, `setPlaylistItems`, `setCurrentVideoIndex`, `nextVideo`, `previousVideo`, `nextPlaylist`, `previousPlaylist`, `setPreviewPlaylist`, `clearPreview`
- **`folderStore.js`**:
  - `currentFolder`: string | null (current folder color filter)
  - `bulkTagMode`: boolean
  - `bulkTagSelections`: Map<videoId, Set<folderColor>>
  - `showColoredFolders`: boolean
  - Functions: `setCurrentFolder`, `toggleBulkTagMode`, `setBulkTagSelections`, `setShowColoredFolders`
- **`tabStore.js`**:
  - `tabs`: array of tab objects
  - `activeTabId`: string | null
  - Functions: `createTab`, `deleteTab`, `renameTab`, `setActiveTab`, `addPlaylistToTab`
- **`tabPresetStore.js`**:
  - `presets`: array of preset objects
  - `currentPresetId`: string | null
  - Functions: `createPreset`, `deletePreset`, `loadPreset`, `saveCurrentTabsAsPreset`
- **`pinStore.js`**:
  - `pinnedVideos`: array of pinned video objects (session-only, no persistence)
  - Functions: `togglePin`, `isPinned`, `clearPins`

#### Components (`src/components/`)

**Layout & Navigation:**
- **`TopNavigation.jsx`**: Tab navigation (Playlists/Videos/History) in miniHeader, includes FolderSelector on Videos page
- **`PlaylistsButton.jsx`**: Toggle button for sidebar (currently unused, removed from UI)
- **`PlayerController.jsx`**: Visual controller with orb and rectangles (topController slot)
  - Left rectangle: Playlist navigation (prev/next, grid button, playlist title display)
  - Right rectangle: Video navigation (prev/next, shuffle, grid button, pinned videos display)
  - Top-right rectangle: Pinned video thumbnails for quick access

**Card System (Reusable Components):**
- **`Card.jsx`**: Base card component with click handling and state management
- **`CardThumbnail.jsx`**: Thumbnail display with badges, overlays, and proper 16:9 aspect ratio
- **`CardContent.jsx`**: Title, subtitle, metadata display with action slot
- **`CardActions.jsx`**: Quick actions and menu management component
- **`CardMenu.jsx`**: Enhanced 3-dot menu with submenu support
- **`VideoCard.jsx`**: Video card implementation with pin support and bulk tagging

**Playlist Management:**
- **`PlaylistsPage.jsx`**: Main page showing all playlists in 3-column grid
  - Displays playlists with thumbnails using Card system
  - Tab system for organizing playlists
  - Expandable folders: Individual playlists can expand to show colored folders inline
  - Sticky folders: Stuck folders remain visible regardless of parent state
  - Export button in playlist menu
  - Bulk import button
  - Colored folder toggle
  - Close button to return to full screen
- **`PlaylistList.jsx`**: Sidebar list view of playlists (when showPlaylists=true)
  - Compact list with thumbnails
  - Expandable folders per playlist
  - Colored folder display with toggle
  - Has its own import button
- **`PlaylistView.jsx`**: Grid view of videos in a selected playlist
- **`PlaylistUploader.jsx`**: Modal component for importing playlists
  - Two modes: YouTube URL or JSON config
  - YouTube mode: Uses API key to fetch playlist metadata and videos
  - JSON mode: Parses JSON and bulk imports videos (supports export format)
  - File upload support for JSON import
  - Progress tracking with progress bar
- **`BulkPlaylistImporter.jsx`**: Full editor modal with 17 input fields (1 "All" + 16 folder fields)
  - Smart link parsing (newlines, commas, semicolons, pipes, spaces)
  - Local reference support (`local:playlist:id`, `local:folder:playlistId:color`)
  - Progress tracking for playlist fetching and video adding
- **`PlaylistFolderSelector.jsx`**: Universal selector for existing playlists/folders
  - Shows all playlists with expandable folder dropdowns
  - Multi-selection support

**Video Management:**
- **`VideosPage.jsx`**: Grid view of all videos in current playlist
  - 3-column grid layout using Card system
  - Shows "Now Playing" indicator
  - Watch status sorting: Default, Unwatched, Partially Watched, Watched (≥85%)
  - Bulk tag mode with color grid on hover
  - Click to switch videos
- **`YouTubePlayer.jsx`**: YouTube iframe embed player with IFrame API integration
  - Takes videoUrl prop
  - Handles YouTube URL format
  - Tracks playback progress every 5 seconds
  - Saves progress on pause/stop
  - Retrieves video duration from API

**History & Tracking:**
- **`HistoryPage.jsx`**: Displays last 100 watched videos in 3-column grid
  - Shows video thumbnails, titles, and human-readable timestamps
  - Auto-populated from watch history

**Folder Management:**
- **`FolderCard.jsx`**: Colored folder display component
  - Shows folder color, playlist name, video count, thumbnail
  - 3-dot menu with "Stick Folder" / "Unstick Folder" option
- **`FolderSelector.jsx`**: 16 colored dots + "All" button at top of menu boundary
  - Quick folder filtering
  - User-selectable default folder for star button (persisted in localStorage)
- **`BulkTagColorGrid.jsx`**: 16-color grid for bulk tagging videos
  - Appears on hover in bulk tag mode
  - Visual feedback for selections

**Tab Management:**
- **`TabBar.jsx`**: Tab navigation component with plus button for creation
  - Double-click to rename tabs
  - Delete tabs via context menu
- **`AddPlaylistToTabModal.jsx`**: Modal for multi-selecting playlists to add to a tab
- **`TabPresetsDropdown.jsx`**: Tab preset selector in header
  - Save and load collections of tabs as presets

**Radial Menu:**
- **`RadialMenuStandalone.jsx`**: Standalone radial menu component (833 lines)
  - Canvas-based rendering with GSAP animations
  - Scroll wheel navigation with wrap-around support
  - Configurable via JSON (container config and dictionary)
  - Uses viewport box from config for automatic sizing
  - Positioned at top-left of layout, aligned with top controller
  - Toggleable visibility via "Menu" button
  - Currently uses bilinear interpolation fallback for text (perspective-transform disabled)

#### API Layer (`src/api/`)
- **`playlistApi.js`**: All Tauri command invocations
  - **Playlist operations**: `createPlaylist`, `getAllPlaylists`, `getPlaylist`, `updatePlaylist`, `deletePlaylist`
  - **Playlist item operations**: `addVideoToPlaylist`, `getPlaylistItems`, `removeVideoFromPlaylist`, `reorderPlaylistItem`
  - **Folder operations**: `assignVideoToFolder`, `unassignVideoFromFolder`, `getVideosInFolder`, `getVideoFolderAssignments`, `getFoldersForPlaylist`, `getAllFoldersWithVideos`
  - **Sticky folder operations**: `toggleStuckFolder`, `isFolderStuck`, `getAllStuckFolders`
  - **History operations**: `addToWatchHistory`, `getWatchHistory`, `clearWatchHistory`
  - **Progress operations**: `updateVideoProgress`, `getVideoProgress`, `getAllVideoProgress`, `getWatchedVideoIds`
  - **Export**: `exportPlaylist` (returns JSON with playlist data and folder assignments)

#### Utilities (`src/utils/`)
- **`youtubeUtils.js`**:
  - `extractVideoId(url)`: Extracts video ID from YouTube URLs
  - `extractPlaylistId(url)`: Extracts playlist ID from YouTube URLs
  - `getThumbnailUrl(videoId, quality)`: Generates YouTube thumbnail URLs
  - `fetchVideoMetadata(videoId)`: Fetches video metadata via oEmbed API
  - `fetchPlaylistMetadata(playlistId)`: Placeholder for playlist metadata (needs API)
- **`initDatabase.js`**:
  - `initializeTestData()`: Checks database accessibility (no test data creation)
  - `addTestVideosToPlaylist(playlistId)`: Helper function (not auto-called)
- **`folderColors.js`**: Folder color utilities
  - 16 predefined colors: Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink
  - Color ID to name mapping functions

### Backend Files (`src-tauri/src/`)

- **`main.rs`**: Entry point, calls `tauri_app_lib::run()`
- **`lib.rs`**: Tauri application setup
  - Initializes SQLite database
  - Registers all Tauri commands
  - Manages database connection as app state
- **`commands.rs`**: Tauri command handlers (called via `invoke()` from JS)
  - **Playlist commands**: `create_playlist`, `get_all_playlists`, `get_playlist`, `update_playlist`, `delete_playlist`
  - **Playlist item commands**: `add_video_to_playlist`, `get_playlist_items`, `remove_video_from_playlist`, `reorder_playlist_item`
  - **Folder commands**: `assign_video_to_folder`, `unassign_video_from_folder`, `get_videos_in_folder`, `get_video_folder_assignments`, `get_folders_for_playlist`, `get_all_folders_with_videos`
  - **Sticky folder commands**: `toggle_stuck_folder`, `is_folder_stuck`, `get_all_stuck_folders`
  - **History commands**: `add_to_watch_history`, `get_watch_history`, `clear_watch_history`
  - **Progress commands**: `update_video_progress`, `get_video_progress`, `get_all_video_progress`, `get_watched_video_ids`
- **`database.rs`**: SQLite database operations
  - `Database` struct with Connection
  - Schema initialization (playlists, playlist_items, video_folder_assignments, watch_history, video_progress, stuck_folders tables)
  - CRUD operations for playlists, items, folders, history, and progress
  - Position management for playlist ordering
  - Folder assignment and lookup operations
  - Watch history and progress tracking
- **`models.rs`**: Rust data structures
  - `Playlist`: id, name, description, created_at, updated_at
  - `PlaylistItem`: id, playlist_id, video_url, video_id, title, thumbnail_url, position, added_at
  - `VideoFolderAssignment`: id, playlist_id, item_id, folder_color, created_at
  - `WatchHistory`: id, video_url, video_id, title, thumbnail_url, watched_at
  - `VideoProgress`: id, video_id, video_url, duration, last_progress, progress_percentage, last_updated
  - `FolderWithVideos`: playlist_id, folder_color, video_count, first_video_thumbnail

---

## Database Schema

### `playlists` Table
- `id` (INTEGER PRIMARY KEY) - Auto-incrementing
- `name` (TEXT NOT NULL)
- `description` (TEXT)
- `created_at` (TEXT) - ISO 8601 timestamp
- `updated_at` (TEXT) - ISO 8601 timestamp

### `playlist_items` Table
- `id` (INTEGER PRIMARY KEY) - Auto-incrementing
- `playlist_id` (INTEGER NOT NULL) - Foreign key to playlists
- `video_url` (TEXT NOT NULL) - Full YouTube URL
- `video_id` (TEXT NOT NULL) - Extracted video ID
- `title` (TEXT) - Video title
- `thumbnail_url` (TEXT) - Thumbnail URL
- `position` (INTEGER NOT NULL) - Order in playlist (0-indexed)
- `added_at` (TEXT) - ISO 8601 timestamp
- Foreign key constraint: `ON DELETE CASCADE`

### `video_folder_assignments` Table
- `id` (INTEGER PRIMARY KEY) - Auto-incrementing
- `playlist_id` (INTEGER NOT NULL) - Foreign key to playlists
- `item_id` (INTEGER NOT NULL) - Foreign key to playlist_items
- `folder_color` (TEXT NOT NULL) - Folder color (e.g., "red", "blue")
- `created_at` (TEXT) - ISO 8601 timestamp
- Foreign key constraints: `ON DELETE CASCADE`
- Unique constraint: `(playlist_id, item_id, folder_color)`

### `watch_history` Table
- `id` (INTEGER PRIMARY KEY) - Auto-incrementing
- `video_url` (TEXT NOT NULL) - Full YouTube URL
- `video_id` (TEXT NOT NULL) - Extracted video ID
- `title` (TEXT) - Video title
- `thumbnail_url` (TEXT) - Thumbnail URL
- `watched_at` (TEXT NOT NULL) - ISO 8601 timestamp

### `video_progress` Table
- `id` (INTEGER PRIMARY KEY) - Auto-incrementing
- `video_id` (TEXT NOT NULL UNIQUE) - Video ID (unique per video)
- `video_url` (TEXT NOT NULL) - Full YouTube URL
- `duration` (REAL) - Video duration in seconds
- `last_progress` (REAL NOT NULL DEFAULT 0) - Last playback position in seconds
- `progress_percentage` (REAL NOT NULL DEFAULT 0) - Progress percentage (0-100)
- `last_updated` (TEXT NOT NULL) - ISO 8601 timestamp

### `stuck_folders` Table
- `id` (INTEGER PRIMARY KEY) - Auto-incrementing
- `playlist_id` (INTEGER NOT NULL) - Foreign key to playlists
- `folder_color` (TEXT NOT NULL) - Folder color
- `created_at` (TEXT NOT NULL) - ISO 8601 timestamp
- Foreign key constraint: `ON DELETE CASCADE`
- Unique constraint: `(playlist_id, folder_color)`

### Indexes
- `idx_playlist_items_playlist_id` on `playlist_items(playlist_id)`
- `idx_playlist_items_position` on `playlist_items(playlist_id, position)`
- `idx_folder_assignments_playlist_color` on `video_folder_assignments(playlist_id, folder_color)`
- `idx_folder_assignments_item` on `video_folder_assignments(item_id)`
- `idx_watch_history_watched_at` on `watch_history(watched_at DESC)`
- `idx_watch_history_video_id` on `watch_history(video_id)`
- `idx_video_progress_video_id` on `video_progress(video_id)`
- `idx_stuck_folders_playlist_color` on `stuck_folders(playlist_id, folder_color)`

---

## Key Features & Functionality

### Playlist Management
1. **View Playlists**: Grid view (3 columns) with thumbnails, names, descriptions, video counts using Card system
2. **Import Playlists**:
   - **YouTube**: Paste playlist URL, fetches via YouTube Data API v3 (API key: `AIzaSyBYPwv0a-rRbTrvMA9nF4Wa1ryC0b6l7xw`)
   - **JSON**: Paste JSON config with videos array (supports export format)
   - **File Upload**: Upload JSON files for import
   - **Bulk Import**: 17-field editor (1 "All" + 16 folder fields) with smart link parsing
   - **Local References**: Import existing local playlists/folders using `local:playlist:id` or `local:folder:playlistId:color` format
3. **Export Playlists**: Export playlists as JSON with metadata, videos, and folder assignments
4. **Delete Playlists**: Delete button in 3-dot menu, confirmation dialog
5. **Select Playlist**: Click card to load videos and start playing first video (or last viewed video)
6. **Tab System**: Organize playlists into tabs with create, rename, delete functionality
7. **Tab Presets**: Save and load collections of tabs as presets for different workspace configurations
8. **Expandable Folders**: Expand individual playlists to show colored folders inline in grid
9. **Sticky Folders**: Pin colored folders to remain visible regardless of parent playlist state

### Video Management
1. **View Videos**: Grid view (3 columns) showing all videos in current playlist using Card system
2. **Play Videos**: Click video to switch playback, remembers last position per video
3. **Navigation**: "Now Playing" indicator, position numbers
4. **Video Navigation**: Previous/next video functions in store, shuffle button
5. **Watch Status Sorting**: Sort by Default, Unwatched, Partially Watched (<85%), or Watched (≥85%)
6. **Bulk Tagging**: Bulk tag mode with 16-color grid on hover for multi-selection
7. **Pin Videos**: Pin icon on video cards for quick access (session-only, displayed in PlayerController)

### Colored Folders System
1. **16 Color Folders**: Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink
2. **Folder Assignment**: Assign videos to folders via star icon (quick assign) or 3-dot menu
3. **Folder Filtering**: Filter videos by folder color using FolderSelector component
4. **Folder Display**: Folders with videos appear in playlist menu/sidebar (toggleable)
5. **Sticky Folders**: Pin folders to remain visible even when parent playlist is collapsed
6. **Folder Navigation**: Click folder to load playlist and play first video in that folder

### Watch History & Progress
1. **Watch History**: Tracks last 100 watched videos with timestamps
2. **History Page**: Dedicated page showing watch history in 3-column grid
3. **Progress Tracking**: Tracks playback progress per video (duration, last position, percentage)
4. **Auto-tracking**: Videos automatically added to history when played
5. **Progress Persistence**: Progress saved every 5 seconds and on pause/stop
6. **Watch Status**: Videos categorized as unwatched (0%), partially watched (<85%), or watched (≥85%)

### Layout System
- **Full Mode**: Player only, no sidebar
- **Half Mode**: Player + sidebar (playlists/videos/history)
- **Quarter Mode**: Player + smaller sidebar
- **Menu Quarter Mode**: Additional layout variation
- **View Mode Toggle**: "View All Videos" and "View All Playlists" buttons toggle to half mode
- **Close Buttons**: Close button (X) on right-half menus to return to full screen

### Navigation
- **Top Navigation Tabs**: Playlists / Videos / History (in miniHeader)
- **Folder Selector**: 16-color folder selector on Videos page
- **Player Controller**:
  - Left rectangle: Playlist navigation (prev/next, grid button, playlist title)
  - Right rectangle: Video navigation (prev/next, shuffle, grid button)
  - Top-right rectangle: Pinned video thumbnails
- **Radial Menu**: Animated menu at top-left, scroll wheel navigation, toggleable via "Menu" button
- **Page Routing**: Based on `currentPage` state and `showPlaylists` flag

---

## Current State of Development

### ✅ Completed Features
- SQLite database integration with full CRUD operations
- Reusable Card component system (Card, CardThumbnail, CardContent, CardActions, CardMenu)
- Playlist grid view (3 columns) with thumbnails using Card system
- Video grid view (3 columns) for current playlist using Card system
- YouTube playlist import via Data API v3
- JSON playlist import/export with folder assignments
- Bulk playlist importer with 17-field editor
- Local reference support for importing existing playlists/folders
- Playlist deletion with confirmation
- Video playback with YouTube iframe player and IFrame API integration
- Playback position memory (remembers last video index per playlist and playback time per video)
- Multiple layout modes (full/half/quarter) with view mode toggles
- Navigation system (Playlists/Videos/History tabs)
- Thumbnail display for playlists and videos (fixed aspect ratio rendering)
- Database initialization (no auto test data)
- 16-color folder system for organizing videos within playlists
- Folder assignment via star icon (quick assign) or 3-dot menu
- Folder filtering and display in playlist menu
- Expandable folders in PlaylistsPage (inline grid expansion)
- Sticky folders feature (database-backed persistence)
- Watch history tracking (last 100 videos)
- Watch progress tracking (duration, position, percentage)
- Video sorting by watch status (unwatched, partially watched, watched)
- Bulk tagging mode for assigning multiple videos to folders
- Tab system for organizing playlists
- Tab presets for saving/loading workspace configurations
- Pin system for quick video access (session-only)
- Player controller enhancements (playlist/video navigation, shuffle, pinned videos display, playlist title)
- Playlist export/import with folder assignments
- **Advanced PlayerController** (see Development Log): Custom orb images, preview navigation, colored shuffle, likes playlist, watch history initialization
- **Preview Navigation System**: Browse playlists/videos without interrupting playback, with commit/revert functionality
- **Likes Playlist**: Special auto-created playlist for liked videos with toggle functionality
- **Playlist Preview Button**: Preview playlist videos from PlaylistsPage without changing current player

### ⚠️ Known Issues
- YouTube `postMessage` warning: "Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://www.youtube.com') does not match the recipient window's origin" - This is a benign warning from YouTube IFrame API and can be safely ignored
- Hierarchical playlist/folder navigation (stuck folders in navigation) was attempted but reverted due to crashes and glitches - feature shelved for future implementation
- Startup history loading was attempted but reverted due to missing YouTube link errors - feature shelved for future implementation (NOTE: This has since been successfully re-implemented - see Development Log)

### 🔄 Current Limitations
- YouTube API key is hardcoded in `PlaylistUploader.jsx` (should be moved to config/env)
- No video removal from playlists UI (API exists but no UI)
- No playlist editing UI (API exists but no UI)
- No drag-and-drop reordering (API exists but no UI)
- Playlist uploader doesn't handle very large playlists gracefully (may timeout)
- Hierarchical navigation between playlists and their stuck folders not implemented (reverted due to issues)
- Startup video loading from history not implemented (reverted due to issues) (NOTE: This has since been successfully re-implemented - see Development Log)

### 📋 Potential Future Enhancements
- Move API key to environment variables
- Add video removal from playlists UI
- Add playlist name/description editing UI
- Add drag-and-drop reordering UI
- Add playlist search/filter
- Add video search within playlists
- Add video metadata fetching on import
- Improve error handling and user feedback (replace alerts with toast notifications)
- Add loading states for all async operations
- Add keyboard shortcuts
- Implement hierarchical playlist/folder navigation (revisit failed attempt)
- Implement startup video loading from history (revisit failed attempt)
- Add playlist sharing functionality

---

## Development Setup

### Prerequisites
- Node.js (for frontend)
- Rust & Cargo (for Tauri backend)
- Tauri CLI

### Installation
```bash
npm install          # Install frontend dependencies
# Rust dependencies managed by Cargo automatically
```

### Running
```bash
npm run tauri dev    # Start development server
```

### Building
```bash
npm run tauri build  # Build production app
```

---

## Important Notes for AI Agents

1. **Dev Logs**: When making changes, create a dev log in `dev-logs/` using `dev-logs/TEMPLATE.md`. This helps track changes and ensures atlas documentation stays up-to-date. See `dev-logs/README.md` for details.

### Recent Development (See Development Log)
For detailed information about recent major changes, including PlayerController enhancements, preview navigation system, likes playlist, and watch history initialization, see the **Development Log** section at the bottom of this document. Key recent additions:
- Preview navigation system with commit/revert functionality
- Advanced PlayerController with custom orb images and state persistence
- Colored shuffle feature with quick shuffle color
- Likes playlist system with auto-creation
- Playlist preview button for browsing without interrupting playback
- Watch history initialization on app start

### Tauri Command Invocation
- All backend operations use `invoke()` from `@tauri-apps/api/core`
- Parameter names: Rust uses `snake_case`, JS uses `camelCase` (Tauri v2 auto-converts)
- Example: Rust `playlist_id` → JS `playlistId`

### State Management
- Uses Zustand for global state (lightweight, no Redux)
- Seven stores: layout, navigation, playlist, folder, tab, tabPreset, pin
- Stores are reactive and can be used in any component
- Some stores use localStorage for persistence (tabs, tab presets, folder preferences)
- Pin store is session-only (no persistence)

### Component Communication
- Props for parent-to-child
- Zustand stores for global state
- Callbacks for child-to-parent communication
- Tauri commands for frontend-backend communication

### Database Operations
- All database operations go through Tauri commands
- Database is initialized in `lib.rs` setup
- Database file: `playlists.db` in project root (moved from `src-tauri/` to prevent Tauri file watcher rebuilds)
- Foreign key constraints with CASCADE delete
- Database schema includes: playlists, playlist_items, video_folder_assignments, watch_history, video_progress, stuck_folders

### YouTube Integration
- API key is in `PlaylistUploader.jsx` (line ~43)
- Uses YouTube Data API v3 for playlist fetching
- Thumbnails use YouTube's public thumbnail service
- Video playback uses YouTube iframe embed with IFrame API integration
- IFrame API used for accurate playback time tracking (duration, current time, progress percentage)
- Progress tracked every 5 seconds and on pause/stop

### Styling
- Tailwind CSS utility classes throughout
- Custom CSS in `App.css` and `LayoutShell.css`
- Dark theme (slate colors) with sky blue accents
- Responsive grid layouts

### Error Handling
- Try-catch blocks around all async operations
- Error messages displayed to users via alerts
- Console logging for debugging
- Database errors propagate as strings from Rust

### Scrapped Features
- **Hierarchical Playlist/Folder Navigation**: Attempted to implement navigation between playlists and their stickied colored folders using the top playlist controller (PlayerController). This feature was scrapped due to crashes, glitches, and React DOM errors when navigating from playlists to folders. The implementation was reverted and shelved for future development. Do not attempt to re-implement this without careful consideration of state management and YouTube player cleanup timing.

---

## API Reference

### Tauri Commands (Backend → Frontend)

All commands are registered in `src-tauri/src/lib.rs` and defined in `src-tauri/src/commands.rs`.

**Playlist Commands:**
- `create_playlist(name: string, description?: string)` → `playlistId: number`
- `get_all_playlists()` → `Playlist[]`
- `get_playlist(id: number)` → `Playlist | null`
- `update_playlist(id: number, name?: string, description?: string)` → `boolean`
- `delete_playlist(id: number)` → `boolean`

**Playlist Item Commands:**
- `add_video_to_playlist(playlistId: number, videoUrl: string, videoId: string, title?: string, thumbnailUrl?: string)` → `itemId: number`
- `get_playlist_items(playlistId: number)` → `PlaylistItem[]`
- `remove_video_from_playlist(playlistId: number, itemId: number)` → `boolean`
- `reorder_playlist_item(playlistId: number, itemId: number, newPosition: number)` → `boolean`

**Folder Commands:**
- `assign_video_to_folder(playlistId: number, itemId: number, folderColor: string)` → `boolean`
- `unassign_video_from_folder(playlistId: number, itemId: number, folderColor: string)` → `boolean`
- `get_videos_in_folder(playlistId: number, folderColor: string)` → `PlaylistItem[]`
- `get_video_folder_assignments(playlistId: number, itemId: number)` → `string[]` (folder colors)
- `get_folders_for_playlist(playlistId: number)` → `string[]` (folder colors with at least 1 video)
- `get_all_folders_with_videos()` → `FolderWithVideos[]`

**Sticky Folder Commands:**
- `toggle_stuck_folder(playlistId: number, folderColor: string)` → `boolean`
- `is_folder_stuck(playlistId: number, folderColor: string)` → `boolean`
- `get_all_stuck_folders()` → `Array<[playlistId: number, folderColor: string]>`

**History Commands:**
- `add_to_watch_history(videoUrl: string, videoId: string, title?: string, thumbnailUrl?: string)` → `boolean`
- `get_watch_history(limit: number)` → `WatchHistory[]`
- `clear_watch_history()` → `boolean`

**Progress Commands:**
- `update_video_progress(videoId: string, videoUrl: string, duration?: number, lastProgress: number, progressPercentage: number)` → `boolean`
- `get_video_progress(videoId: string)` → `VideoProgress | null`
- `get_all_video_progress()` → `VideoProgress[]`
- `get_watched_video_ids()` → `string[]` (video IDs with progress ≥85%)

**Playlist Item Commands (Added):**
- `check_if_video_in_playlist(playlistId: number, videoId: string)` → `Option<i64>` (returns item ID if found, null otherwise)
- `remove_video_from_playlist(playlistId: number, itemId: number)` → `boolean`

### Data Models

**Playlist (Rust/JS):**
```typescript
{
  id: number;
  name: string;
  description: string | null;
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
}
```

**PlaylistItem (Rust/JS):**
```typescript
{
  id: number;
  playlist_id: number;
  video_url: string;
  video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  position: number;  // 0-indexed
  added_at: string;  // ISO 8601
}
```

**WatchHistory (Rust/JS):**
```typescript
{
  id: number;
  video_url: string;
  video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  watched_at: string;  // ISO 8601
}
```

**VideoProgress (Rust/JS):**
```typescript
{
  id: number;
  video_id: string;
  video_url: string;
  duration: number | null;  // seconds
  last_progress: number;  // seconds
  progress_percentage: number;  // 0-100
  last_updated: string;  // ISO 8601
}
```

**FolderWithVideos (Rust/JS):**
```typescript
{
  playlist_id: number;
  folder_color: string;
  video_count: number;
  first_video_thumbnail: string | null;
}
```

---

## Configuration Files

- **`package.json`**: Node.js dependencies and scripts
- **`vite.config.js`**: Vite build configuration
- **`tailwind.config.js`**: Tailwind CSS configuration
- **`src-tauri/Cargo.toml`**: Rust dependencies
- **`src-tauri/tauri.conf.json`**: Tauri app configuration (window settings, permissions, etc.)

---

## Testing & Debugging

- Console logs throughout for debugging
- Error messages shown via `alert()` (consider replacing with toast notifications)
- Database file location: `playlists.db` in project root
- View mode toggles available in dev (temporary UI)
- React Hooks violations fixed (hooks must be called unconditionally at top level)
- Thumbnail rendering issues fixed (proper aspect ratio with eager loading)

---

## Radial Menu System

### Overview
The radial menu system provides an animated, scrollable menu interface positioned at the top-left of the layout. The menu features GSAP-powered morphing animations, wrap-around scrolling, and canvas-based rendering. The system was successfully integrated using a standalone component approach after an initial failed attempt at extracting and integrating individual functions.

### Current Implementation (2024-12-19 - Successful)

**Component**: `RadialMenuStandalone.jsx` (833 lines)
- Standalone component that handles all menu rendering and animation internally
- Uses viewport box from config for automatic sizing (no manual bounding box calculation needed)
- Canvas-based rendering with GSAP animations
- Scroll wheel navigation with wrap-around support
- Positioned at top-left using `position: fixed` (top: 0, left: 0, width: 50vw, height: 200px)
- Toggleable via "Menu" button in view mode controls
- Config loaded from `/container-config (9).json` and `/dictionary.json`

**Configuration**:
- `public/container-config (9).json`: Contains bundles, containers, and viewport box
  - Viewport box: `{ x: 4.5, y: 209, width: 599, height: 234 }`
  - This eliminates the need for tight bounding box calculations
- `public/dictionary.json`: Letter/symbol dictionary for text rendering (904 lines)

**Integration Points**:
- `App.jsx`: Loads configs, manages visibility state, provides toggle button
- `LayoutShell.jsx`: Renders menu at fixed position (top-left, above top controller)

**Known Limitations**:
- Perspective transform library disabled (using bilinear interpolation fallback for text)
- Text rendering works but without full perspective warping
- Single menu instance (could be extended to multiple menus)

### Previous Failed Attempt (2024-12-19 - First Attempt)

An initial attempt was made to extract and integrate individual functions from the original TypeScript implementation. This approach failed due to:

### What Was Attempted
1. **Integration of External Radial Menu System**: Attempted to port a complex TypeScript/React radial menu component from another project
2. **Two Independent Menus**: Left menu for playlist operations, right menu for video operations
3. **Anchored Positioning**: Menus anchored to top controller (PlayerController) at specific points
4. **Resizable/Draggable Boundaries**: User-adjustable windows for menu positioning
5. **Dynamic Scaling**: Menu content scaling to match boundary window size
6. **Tight Bounding Box**: Visual boundary around actual menu content for precise positioning

### Components Created (All Removed)
- `RadialMenuWrapper.jsx`: Wrapper component handling config loading, scaling, and boundary management
- `RadialMenuRuntime.jsx`: Core rendering component with GSAP animations and canvas-based drawing
- `ResizableMenuBoundary.jsx`: Draggable/resizable boundary window component
- `RadialMenuPositionTool.jsx`: Drawing tool for visually defining menu positions
- `radialMenuStore.js`: Zustand store for menu state management

### Technical Challenges Encountered

#### 1. Coordinate System Confusion
**Problem**: Multiple coordinate systems (viewport, canvas, container) caused misalignment
- Boundary was `position: fixed` (viewport coordinates)
- Canvas was inside boundary (relative coordinates)
- Content bounds were in canvas coordinates
- Conversion between systems was error-prone

**Learnings**:
- When using `position: fixed` containers, all child coordinates should be relative to the fixed container
- Canvas coordinates should start at (0,0) relative to their container, not viewport
- Boundary position updates require careful coordinate conversion

#### 2. Scaling Issues
**Problem**: Menu content didn't scale properly when boundary was resized
- Initial scaling used `Math.min(scaleX, scaleY)` which left empty space
- Changed to `Math.max(scaleX, scaleY)` to fill window but caused cropping
- Canvas size needed to match boundary size exactly
- Scaling effect didn't always re-trigger on boundary changes

**Learnings**:
- Canvas size must directly use boundary dimensions when available
- Scaling effect dependencies must include boundary bounds
- `useEffect` dependencies are critical for reactive scaling
- Content bounds calculation must account for scaled coordinates

#### 3. Infinite Loop Prevention
**Problem**: Updating boundary from content bounds caused infinite re-render loops
- Content bounds calculation triggered boundary update
- Boundary update triggered re-scaling
- Re-scaling triggered content bounds recalculation
- React "Maximum update depth exceeded" error

**Solutions Attempted**:
- Added recursive update guard with ref flag
- Added change detection (only update if bounds changed significantly)
- Added timeout to reset guard flag
- Prevented updates during user interaction (dragging/resizing)

**Learnings**:
- Always guard against circular state updates
- Use refs for flags that shouldn't trigger re-renders
- Compare values before updating to prevent unnecessary changes
- Debounce/throttle rapid updates

#### 4. Container Size Measurement
**Problem**: Right menu container was 0x0, causing fallback to default size
- Parent container (`layout-shell__right-radial-menu`) was `position: fixed` with no explicit size
- Child container was `position: absolute` with `width: 100%, height: 100%`
- 100% of 0 is still 0
- ResizeObserver didn't help because parent had no size

**Learnings**:
- Fixed-position parents need explicit dimensions or children won't measure correctly
- `ResizeObserver` only works if parent has measurable size
- Fallback sizing strategies are necessary but can mask underlying issues
- Container measurement timing is critical (use `requestAnimationFrame`)

#### 5. Independent Menu Rendering
**Problem**: Left menu worked, right menu was empty despite identical code
- Both menus shared same config from store
- Both menus used same scaling logic
- Right menu's boundary bounds weren't being set correctly
- Coordinate conversion failed for right menu

**Learnings**:
- Separate state management needed for left/right menus
- Boundary bounds must be stored separately per menu
- Mirroring logic (using left bounds for right) can mask issues
- Each menu instance needs independent measurement and scaling

#### 6. Tight Bounding Box Implementation
**Problem**: Tight bounding box (visual boundary around content) didn't match window size
- Content bounds calculated in canvas coordinates
- Needed conversion to viewport coordinates
- Boundary window size didn't match content bounds
- Attempted to make tight bounds BE the window (circular dependency)

**Learnings**:
- Tight bounding box should be calculated from actual rendered content
- Coordinate conversion requires knowing boundary's viewport position
- Making bounds match window creates feedback loop
- Better approach: calculate bounds, then scale content to fit, then update window

### Dependencies Added (May Still Be Needed)
- `gsap`: GreenSock Animation Platform for animations
- `perspective-transform`: Library for 2D perspective transformations (caused errors, was removed)

### Files from External Project (Kept for Reference)
- `radial-menu-source/ElementEditor.tsx`: Original TypeScript implementation (4689 lines)
- `radialconsultant/`: Documentation and guides from original project
- `public/good2.json`: Menu configuration JSON
- `public/dictionary.json`: Letter/symbol dictionary for text rendering

### Key Technical Insights

#### React Patterns
- **Hooks Order**: All hooks must be called before any conditional returns (Rules of Hooks)
- **useCallback Dependencies**: Must include all values used inside callback
- **useEffect Dependencies**: Critical for reactive updates, missing deps cause stale closures
- **Refs vs State**: Use refs for values that shouldn't trigger re-renders (flags, timers)

#### Canvas Rendering
- Canvas coordinates are relative to canvas element, not viewport
- Canvas size should match container size exactly
- Content scaling requires recalculating all point coordinates
- Transparent backgrounds allow underlying content to show through

#### Layout Integration
- Fixed-position elements need explicit sizing
- Absolute positioning within fixed containers works well
- Overflow handling is critical for clipping
- Z-index management needed for layering

#### State Management
- Zustand stores work well for global state
- Separate stores for separate concerns (menu state vs layout state)
- Store updates trigger re-renders in all consuming components
- Persistence can be added via localStorage middleware

### What Worked
1. ✅ Debug bounds visualization system (kept in layoutStore)
2. ✅ Layout shell slot system (flexible prop-based architecture)
3. ✅ Config loading from JSON files
4. ✅ GSAP animation integration (animations worked when content was visible)
5. ✅ Canvas-based rendering (drawing worked correctly)
6. ✅ Resizable boundary component (dragging/resizing worked)

### What Didn't Work
1. ❌ Reliable coordinate system conversion
2. ❌ Consistent scaling across both menus
3. ❌ Preventing infinite update loops
4. ❌ Container size measurement for fixed-position parents
5. ❌ Making tight bounding box match window dynamically
6. ❌ Independent menu state management

### Recommendations for Future Attempts

#### If Rebuilding from Scratch
1. **Start Simple**: Begin with a basic radial menu, add complexity incrementally
2. **Single Coordinate System**: Use one coordinate system throughout (prefer viewport or canvas, not both)
3. **Explicit Sizing**: Always provide explicit dimensions for containers
4. **State Isolation**: Keep menu state completely separate from layout state
5. **Test Incrementally**: Test each feature in isolation before combining
6. **Avoid Circular Dependencies**: Design state flow to be unidirectional

#### Architecture Suggestions
1. **Component Hierarchy**: 
   - MenuContainer (fixed position, explicit size)
     - MenuCanvas (matches container size exactly)
       - MenuContent (scaled to fit canvas)

2. **State Flow**:
   - User resizes boundary → Update boundary bounds → Re-scale content → Re-render
   - No feedback from content bounds to boundary (unidirectional)

3. **Scaling Strategy**:
   - Calculate content bounds from config
   - Scale content to fit boundary (maintain aspect ratio or fill)
   - Position content within boundary (center or anchor)
   - Render at calculated scale

4. **Coordinate System**:
   - Use canvas-relative coordinates throughout
   - Boundary position stored separately (viewport coords)
   - Convert only when necessary (e.g., for positioning tool)

### Code Patterns That Worked

#### Debug Mode
```javascript
// Visual debug bounds - very useful for development
const { showDebugBounds, toggleDebugBounds } = useLayoutStore();
// Applied via CSS classes and conditional rendering
```

#### ResizeObserver Pattern
```javascript
useEffect(() => {
  const resizeObserver = new ResizeObserver(updateSize);
  if (containerRef.current) {
    resizeObserver.observe(containerRef.current);
  }
  return () => resizeObserver.disconnect();
}, []);
```

#### Guarded State Updates
```javascript
const isUpdatingRef = useRef(false);
if (isUpdatingRef.current) return; // Prevent recursive updates
isUpdatingRef.current = true;
// ... update state ...
setTimeout(() => { isUpdatingRef.current = false; }, 100);
```

### Conclusion
The radial menu integration attempt provided valuable insights into React state management, canvas rendering, coordinate systems, and layout integration. While the integration was not successful, the knowledge gained will be useful for future attempts to build a radial menu system from scratch within this project. The debug bounds system and flexible layout architecture remain as useful additions to the codebase.

---

### Implementation Details (Successful Approach)

**Why This Approach Succeeded**:
1. **Standalone Component**: Used pre-built component instead of extracting individual functions
2. **Viewport Box**: Config includes `viewportBox` property eliminating tight bounding box calculations
3. **Simple Integration**: No complex scaling, boundary management, or coordinate conversion needed
4. **Fixed Positioning**: Simple CSS positioning (`position: fixed`) works reliably

### Configuration Files Used
- **`public/container-config (9).json`**: Container configuration with viewport box
  - Contains bundles, containers, and viewport box definition
  - Viewport box: `{ x: 4.5, y: 209, width: 599, height: 234 }`
  - This viewport box eliminates the need for manual tight bounding box calculation
- **`public/dictionary.json`**: Letter/symbol dictionary for text rendering (904 lines)

**Integration Steps**:
1. Component copied from `radial-menu-source/` to `src/components/`
2. Config loading added in `App.jsx` (fetches JSON files on mount)
3. Menu positioned at top-left using `position: fixed` in `LayoutShell.jsx`
4. Visibility toggle added with "Menu" button (defaults to visible)
5. Perspective transform library replaced with bilinear interpolation fallback (library had initialization errors)

**Technical Details**:
- **Canvas Sizing**: Uses viewport box from config, falls back to container bounds calculation
- **Animation**: GSAP-powered morphing with wrap-around scrolling and fade effects
- **Rendering**: Canvas-based, draws containers as quadrilaterals, supports text (with fallback transform)
- **Navigation**: Scroll wheel triggers animations, throttled to prevent rapid-fire

**Current Status**:
- ✅ Menu renders and is positioned at top-left (aligned with top controller)
- ✅ Scroll wheel navigation working with wrap-around animations
- ✅ Visibility toggle functional via "Menu" button
- ✅ Config loading from JSON files working
- ✅ Debug mode compatible
- ⚠️ Text rendering uses fallback (perspective warping disabled)

**Future Enhancements**:
- Investigate alternative perspective transform library or fix for text warping
- Add second menu instance on right side for video operations
- Connect menu to playlist/video operations
- Customize menu content via config JSON
- Easy repositioning via CSS adjustments (top, left, padding values)

---

## Important Notes for AI Agents

### Radial Menu Development
When working on the radial menu system:
- **Component Location**: `src/components/RadialMenuStandalone.jsx` (833 lines)
- **Config Files**: 
  - `public/container-config (9).json` - Container configuration with viewport box
  - `public/dictionary.json` - Letter/symbol dictionary for text rendering
- **Positioning**: Currently fixed at top-left in `LayoutShell.jsx` (adjustable via CSS: `top: 0, left: 0, width: 50vw, height: 200px`)
- **Visibility**: Controlled by `radialMenuVisible` state in `App.jsx` (defaults to `true`)
- **Toggle Button**: "Menu" button in view mode controls (top of screen, turns green when active)
- **Text Rendering**: Currently uses bilinear interpolation fallback (perspective-transform library disabled due to initialization errors)
- **Reference Files**: Original implementation in `radial-menu-source/RadialMenuStandalone.jsx`

### Key Integration Points
- **Config Loading**: Happens in `App.jsx` useEffect hook (fetches JSON files on mount)
- **Menu Rendering**: Rendered in `LayoutShell.jsx` as fixed-position overlay (z-index: 1001)
- **Animation**: GSAP-powered morphing animations, scroll wheel triggers `animateDirection`
- **Canvas Sizing**: Uses viewport box from config (`{ x: 4.5, y: 209, width: 599, height: 234 }`)

### What Works
- ✅ Menu renders correctly at top-left position
- ✅ Scroll wheel navigation with wrap-around animations
- ✅ Visibility toggle functional
- ✅ Config loading from JSON files
- ✅ Debug mode compatible
- ⚠️ Text rendering uses fallback (perspective warping disabled)

### Future Enhancement Opportunities
- Fix or replace perspective-transform library for full text warping
- Add second menu instance on right side for video operations
- Connect menu items to playlist/video operations
- Customize menu content via config JSON
- Make menu draggable/resizable
- Add click handlers for menu items

---

This document should provide comprehensive context for any AI agent working on this project. For specific implementation details, refer to the source files mentioned above.

---



## Development Log

### 2024-12-XX - PlayerController Enhancement & Preview Navigation System

**Context**: Major overhaul of the PlayerController component and implementation of preview navigation system for browsing playlists/videos without interrupting playback.

**Changes Made**:

1. **PlayerController Replacement**:
   - Replaced barebones PlayerController with advanced version from `imports/PlayerControllerIMPORT.jsx`
   - Integrated with existing Zustand stores (`usePlaylistStore`, `useNavigationStore`, `usePinStore`, `useLayoutStore`, `useFolderStore`, `useTabStore`, `useTabPresetStore`)
   - Mapped internal UI actions to Zustand store actions and `onVideoSelect`/`onPlaylistSelect` props
   - Maintained existing navigation logic while adding new UI features

2. **State Persistence**:
   - **Custom Orb Image**: Added `localStorage` persistence for user-uploaded orb images
   - **Clipping State**: Added `localStorage` persistence for spill/clipping toggle state
   - **Quick Assign Color**: Added `localStorage` persistence for default folder color used by star button
   - **Quick Shuffle Color**: Added `localStorage` persistence for default shuffle folder color (supports 'all' option)

3. **Preview Navigation System**:
   - Implemented preview navigation for both playlists and videos
   - **Playlist Preview**: Navigate through playlists/folders without changing actual player
   - **Video Preview**: Navigate through videos in current playlist without changing playback
   - **Checkpoint System**: Saves current state before entering preview mode
   - **Commit/Revert**: Tick button commits preview changes, X button reverts to checkpoint
   - Preview state stored in both local component state and Zustand store
   - UI elements (playlist title, video title, playlist image) display preview data when active

4. **Playlist Menu Header Modes**:
   - Header cycles through three modes: `'info'` (playlist title), `'tabs'` (user tabs), `'presets'` (tab presets)
   - `handleToggleHeader` function manages mode cycling
   - Rendering logic displays appropriate content based on `activeHeaderMode`
   - `navigateTabs` function handles navigation for both tabs and presets
   - Uses `safeTabs` and `safePresets` arrays with safety checks to prevent empty displays

5. **Star Button Functionality**:
   - **Visual State**: Filled star in folder color if video belongs to folder, empty star with quick assign color outline if not
   - **Left-click**: Assigns/unassigns video to/from folder using quick assign color
   - **Right-click**: Opens color picker to set quick assign default color
   - **Color Picker**: Uses `FOLDER_COLORS`, highlights current quick assign color
   - **Backend Integration**: Uses `assignVideoToFolder` and `unassignVideoFromFolder` API calls
   - **State Management**: `currentVideoFolders` state tracks folder assignments for current video

6. **Colored Shuffle Feature**:
   - **Shuffle Button**: Color reflects `quickShuffleColor` (white for 'all', folder color otherwise)
   - **Left-click Shuffle Button**: Shuffles from quick shuffle folder or all videos
   - **Right-click Shuffle Button**: Opens color picker to set quick shuffle default
   - **Color Picker**: Includes "All" option (white circle), highlights current quick shuffle color
   - **Left-click Color**: Shuffles to random video from that folder
   - **Right-click Color**: Sets as default quick shuffle color
   - **Backend Integration**: Uses `getVideosInFolder` API for folder-specific shuffling

7. **Likes Playlist System**:
   - **Special Playlist**: Auto-creates "Likes" playlist if it doesn't exist
   - **Like Button**: Blank inside with blue outline, filled when video is liked
   - **Toggle Functionality**: Left-click toggles like status, adds/removes from Likes playlist
   - **Backend Integration**: 
     - Added `checkIfVideoInPlaylist` API call
     - Added `removeVideoFromPlaylist` API call
     - Rust commands: `check_if_video_in_playlist`, `remove_video_from_playlist`
   - **State Management**: `isVideoLiked` state tracks current video's like status

8. **Playlist Thumbnail Enhancement**:
   - Changed playlist menu thumbnail to display current video thumbnail instead of playlist thumbnail
   - Uses `currentVideo?.thumbnail_url` with fallback to `displayVideoItem?.thumbnail_url`

9. **Watch History Initialization**:
   - Modified `App.jsx` to load most recent video from watch history on app initialization
   - Finds playlist containing the most recent video and loads it automatically
   - Falls back to default hardcoded video if no history exists or video not found in any playlist
   - Uses `getWatchHistory`, `getAllPlaylists`, and `getPlaylistItems` API calls

10. **Playlist Preview Button**:
    - Added preview button (eye icon) to playlist thumbnails in `PlaylistsPage.jsx`
    - **Functionality**: 
      - Loads playlist items into preview state without changing video player
      - Navigates to VideosPage to display preview playlist's videos
      - Switches to half view mode if in full screen
    - **Integration**: 
      - Added preview state to `playlistStore.js` (`previewPlaylistItems`, `previewPlaylistId`, `previewFolderInfo`)
      - Updated `VideosPage.jsx` to use preview items when available (`activePlaylistItems`, `activePlaylistId`)
      - Updated `PlayerController.jsx` to display preview playlist name in title when active
      - Preview can be cleared via revert button or by navigating away

**Technical Details**:

- **State Management**: Preview state stored in both component local state and Zustand store for cross-component access
- **API Additions**: 
  - `checkIfVideoInPlaylist(playlistId, videoId)` → `Option<i64>`
  - `removeVideoFromPlaylist(playlistId, itemId)` → `boolean`
- **Database Changes**: No schema changes, uses existing `playlist_items` table
- **Local Storage Keys**: 
  - `custom_orb_image`: Base64 encoded image data
  - `is_spill_enabled`: Boolean string
  - `quick_assign_color`: Folder color ID string
  - `quick_shuffle_color`: Folder color ID or 'all' string

**Known Issues & Solutions**:

1. **`navigatePlaylist is not defined`**: Fixed by restoring `navigatePlaylist` function that was removed during refactoring
2. **`Cannot access 'currentVideo' before initialization`**: Fixed by moving `currentVideo` declaration before any `useEffect` hooks that depend on it
3. **Tabs not showing in playlist header**: Fixed by adding safety checks (`safeTabs`, `safePresets`) and conditional rendering for empty states

**Failed Attempts**:

1. **Tabs Integration in Playlist Menu Header**:
   - **Attempt**: Tried to integrate tabs directly into the top playlist menu controller header
   - **Issue**: Encountered rendering conflicts between the playlist title display and tabs navigation
   - **Problem**: The header toggle system (`activeHeaderMode`) was designed for three distinct modes (info/tabs/presets), but integrating tabs as a primary display mode caused state management conflicts
   - **Resolution**: Switched to cycling header mode approach where tabs/presets are alternative display modes accessed via toggle, rather than primary integrated display
   - **Learning**: When adding new display modes to existing UI components, ensure state management supports the new modes without conflicting with existing functionality

**Files Modified**:
- `src/components/PlayerController.jsx`: Complete replacement and extensive modifications
- `src/App.jsx`: Added watch history initialization logic
- `src/components/PlaylistsPage.jsx`: Added preview button to playlist thumbnails
- `src/components/VideosPage.jsx`: Updated to use preview items when available
- `src/store/playlistStore.js`: Added preview state management
- `src/api/playlistApi.js`: Added `checkIfVideoInPlaylist` and `removeVideoFromPlaylist`
- `src-tauri/src/commands.rs`: Added `check_if_video_in_playlist` and `remove_video_from_playlist` commands
- `src-tauri/src/database.rs`: Added `check_if_video_in_playlist` and `remove_video_from_playlist` methods
- `src-tauri/src/lib.rs`: Registered new commands

**Key Learnings**:

1. **Preview Navigation Pattern**: Implementing a preview system requires careful state management with checkpoints and clear commit/revert paths
2. **Store Integration**: Using Zustand store for preview state allows multiple components to access preview data without prop drilling
3. **State Initialization Order**: React hooks must be called in consistent order, and state dependencies must be declared before use
4. **Safety Checks**: Always add safety checks (e.g., `Array.isArray()`) when consuming store data that might be undefined
5. **Local Storage Persistence**: User preferences should be persisted across sessions for better UX
6. **Color System Integration**: The 16-color folder system can be extended to other features (shuffle, quick assign) for consistency

**Current Status**: ✅ All features implemented and working

---

### 2024-12-XX - Inspect Mode & Dual Player System Implementation

**Context**: Implementation of inspect element-style feature and comprehensive dual player system allowing independent playback of two videos simultaneously.

**Changes Made**:

1. **Inspect Mode Feature**:
   - Added `inspectMode` state to `layoutStore.js` with `toggleInspectMode` action
   - Created `useInspectLabels` utility hook in `src/utils/inspectLabels.js` for reusable inspect label logic
   - Added inspect mode toggle button alongside view mode buttons (Full, Half, Quarter)
   - Integrated inspect labels across all major components:
     - `PlayerController.jsx`: Added titles to all buttons (playlist/video navigation, shuffle, star, like, etc.)
     - `PlaylistsPage.jsx`: Added titles to playlist cards, preview buttons, menu options
     - `VideosPage.jsx`: Added titles to video cards, bulk tag buttons
     - `VideoCard.jsx`: Added titles to pin icons, quick actions
     - `FolderSelector.jsx`: Added titles to folder color dots
     - `TabBar.jsx`: Added titles to tab buttons, add/delete buttons
     - `HistoryPage.jsx`: Added titles to history video cards
     - `CardMenu.jsx`: Added titles to 3-dot menu buttons
   - **Exception**: Radial menu explicitly excluded from labeling per user request
   - Labels use user-friendly names (e.g., "Play video", "Pin video") instead of technical DOM names

2. **Second Player Boundary Definition**:
   - Added second player slot to `LayoutShell.jsx` positioned in bottom-left quarter of main player
   - Second player visible in `full` and `half` view modes, hidden in `quarter` view
   - Added CSS styling in `LayoutShell.css` for `.layout-shell__second-player`
   - Implemented debug bounds visualization (yellow/amber border) for second player area
   - Fixed positioning issues (initially appeared in top-right, corrected to bottom-left)
   - Added `data-debug-label="Second Player"` for debug mode identification

3. **Second Player Video Playback**:
   - Enhanced `YouTubePlayer.jsx` to support multiple instances via `playerId` prop
   - Creates unique player IDs: `youtube-player-${playerId}-${videoId}` to prevent conflicts
   - Main player uses `playerId="main"`, second player uses `playerId="second"`
   - Added `secondPlayerVideoUrl` state in `App.jsx` for second player video tracking
   - Second player component conditionally rendered in `LayoutShell` based on `secondPlayerVideoUrl`

4. **Dual Player Control System**:
   - Added `activePlayer` state (1 = main, 2 = second) in `App.jsx`
   - Modified mode switcher button in `PlayerController.jsx` to toggle between players
   - Mode switcher displays "1" or "2" to indicate active player
   - Added `activePlayer` and `onActivePlayerChange` props to `PlayerController`
   - All video controls (next/prev, shuffle, star, like) route to appropriate player based on `activePlayer`
   - Video selection handlers updated to accept `playerNum` parameter

5. **Second Player Video Selection**:
   - Added amber "2" button to video thumbnail hover overlay in `VideoCard.jsx`
   - Button appears alongside blue play button (main player)
   - Added `onSecondPlayerSelect` prop to `VideoCard`, `VideosPage`, and `HistoryPage`
   - Implemented `handleSecondPlayerSelect` in `App.jsx` that:
     - Sets `secondPlayerVideoUrl`
     - Searches all playlists to find which playlist contains the selected video
     - Loads that playlist's items and sets second player's playlist context
   - Second player button also added to `HistoryPage.jsx` video cards

6. **Second Player Playlist Management**:
   - Added `secondPlayerPlaylistId` and `secondPlayerPlaylistItems` state in `App.jsx`
   - Added `secondPlayerVideoIndex` state to track second player's position in its playlist
   - Updated `handleVideoSelect` to maintain second player's playlist context when navigating
   - When second player video is selected from different playlist, system:
     - Searches all playlists to find containing playlist
     - Loads that playlist's items
     - Sets second player's playlist ID, items, and video index
   - Navigation handlers (`handleNextVideo`, `handlePrevVideo`) use second player's playlist items when in mode 2
   - Shuffle handler uses second player's playlist when in mode 2

7. **Video Information Display**:
   - Updated `PlayerController.jsx` to show second player's video info when in mode 2
   - Added `hasSecondPlayerVideo` check: only shows second player info when video is actually loaded
   - `activeVideoItem` logic prioritizes second player's playlist items when available
   - Falls back to finding video by URL in current playlist if second player's playlist not loaded
   - Playlist title shows second player's playlist name when in mode 2 with video loaded
   - Video title, thumbnail, and metadata all reflect active player (main or second)

**Technical Details**:

- **State Management**: 
  - `secondPlayerVideoUrl`: Current video URL for second player
  - `secondPlayerVideoIndex`: Index of current video in second player's playlist
  - `secondPlayerPlaylistId`: ID of playlist containing second player's video
  - `secondPlayerPlaylistItems`: Array of videos in second player's playlist
  - `activePlayer`: 1 for main player, 2 for second player

- **Props Added**:
  - `PlayerController`: `activePlayer`, `onActivePlayerChange`, `secondPlayerVideoUrl`, `secondPlayerVideoIndex`, `onSecondPlayerVideoIndexChange`, `secondPlayerPlaylistId`, `secondPlayerPlaylistItems`
  - `VideoCard`: `onSecondPlayerSelect`
  - `VideosPage`: `onSecondPlayerSelect`
  - `HistoryPage`: `onSecondPlayerSelect`

- **Key Logic**:
  - `hasSecondPlayerVideo`: `!isModeLeft && secondPlayerVideoUrl` (checks mode 2 and video URL exists)
  - Second player playlist items prioritized over current playlist items when available
  - Navigation only works when second player has loaded playlist items (prevents wrong playlist navigation)
  - Video lookup: First tries second player's playlist, then current playlist, then searches all playlists

**Known Issues & Solutions**:

1. **Second player not visible initially**: Fixed by ensuring debug bounds render regardless of content
2. **Second player in wrong position (top-right)**: Fixed by correcting CSS from `top: 0, right: 0` to `bottom: 0, left: 0`
3. **Navigation affecting both players**: Fixed by using separate video index tracking and playlist items for second player
4. **Second player showing main player info**: Fixed by adding `hasSecondPlayerVideo` check and using second player's playlist items
5. **Inter-playlist navigation issues**: Fixed by maintaining separate playlist context for second player and searching all playlists when needed
6. **Video info not displaying in mode 2**: Fixed by relaxing `hasSecondPlayerVideo` condition and improving fallback logic

**Current Status**: 
- ✅ Inspect mode fully implemented and working
- ✅ Second player boundary defined and visible in debug mode
- ✅ Second player video playback working
- ✅ Dual player control system functional
- ✅ Second player video selection via thumbnail hover working
- ✅ Second player playlist management working
- ⚠️ **Known Issue**: Second player info display still showing main player info in some cases - requires further debugging of `hasSecondPlayerVideo` logic and playlist item loading timing

**Files Modified**:
- `src/store/layoutStore.js`: Added `inspectMode` state and `toggleInspectMode` action
- `src/utils/inspectLabels.js`: Created new utility hook
- `src/App.jsx`: Added second player state, handlers, and props
- `src/components/PlayerController.jsx`: Added dual player support, inspect labels, mode switcher
- `src/components/VideoCard.jsx`: Added second player button, inspect labels
- `src/components/VideosPage.jsx`: Added second player selection handler, inspect labels
- `src/components/HistoryPage.jsx`: Added second player button, inspect labels
- `src/components/PlaylistsPage.jsx`: Added inspect labels
- `src/components/FolderSelector.jsx`: Added inspect labels
- `src/components/TabBar.jsx`: Added inspect labels
- `src/components/CardMenu.jsx`: Added inspect labels
- `src/LayoutShell.jsx`: Added second player slot
- `src/LayoutShell.css`: Added second player styles
- `src/components/YouTubePlayer.jsx`: Added `playerId` prop for multiple instances

**Key Learnings**:

1. **Multiple YouTube Player Instances**: Each instance needs unique DOM ID to prevent conflicts
2. **Playlist Context Separation**: Second player needs its own playlist state to navigate independently
3. **Conditional Rendering Logic**: Must check both mode and video existence before showing player-specific info
4. **Playlist Search Strategy**: When video selected from unknown playlist, search all playlists to find containing playlist
5. **State Synchronization**: Second player's index and playlist items must be kept in sync with video URL
6. **Fallback Logic**: Always provide fallbacks when playlist items might not be loaded yet
7. **Mode-Based Routing**: All controls must check active player mode before executing actions

**Future Enhancements**:
- Fix remaining issue with second player info display
- Add visual indicator when second player has no video loaded
- Consider adding second player playlist selector UI
- Add ability to swap main and second player videos
- Add second player progress tracking separate from main player

---

