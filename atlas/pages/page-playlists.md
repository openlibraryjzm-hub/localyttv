# Playlists Page

The Playlists Page is the primary organizational hub for the application, displaying user-created playlists and colored folders set against an atmospheric blurred app banner backdrop.

---

## 1. Architectural & Layout Structure

### Atmospheric Blurred Backdrop System
- **Layering**: The page is wrapped in an isolated backdrop container:
  - **Opaque Base**: `bg-slate-950` base container preventing see-through bleed.
  - **Blurred Layer (`z-0`)**: Heavily blurred App Banner image (`filter: blur(36px)`, `transform: scale(1.25)`).
  - **Depth Gradient Overlay**: `bg-gradient-to-b from-black/20 via-transparent to-black/40` enhancing contrast.
  - **Content Layer (`z-10`)**: Page controls and playlist cards float above the blurred backdrop.

---

### Vertical Scrolling Card Grid Architecture
- **Vertical Layout**: Playlist cards are rendered in a clean, vertical scrolling grid (`grid grid-cols-1 gap-6`), providing a unified navigation experience across All Playlists, Unsorted Playlists, and Colored Folder Prism selections.
- **Top Playlist Bar (Prism Segment Bar)**: Top navigation bar displaying colored folder prism segments (White = All, Black = Unsorted, 16 colored folder groups). Selecting any colored segment filters the vertical scrolling list to playlists assigned to that group.
- **Sticky Toolbar & Header Controls**: Top toolbar below the page header containing:
  - **Left Side**: Toggle Mode button (Tabs View vs Presets View) and scrollable tab buttons.
  - **Right Side**: Folder inline toggle and Add Playlist modal trigger.
- **Floating Playlist Cards**:
  - `LongPlaylistCard` features a **solid anchor top header bar** (`bg-slate-100 border-2 border-[#052F4A]`) housing titles and management controls.
  - Non-header card bodies are transparent (`bg-transparent border-0 shadow-none`), letting mini preview grids float directly over the atmospheric blurred backdrop.

---

## 2. Performance & Data Flow Architecture

### Batched Preview Query (`getAllPlaylistItemsPreviews`)
- **Single-Query Fetch**: Initial playlist item previews are loaded via 1 batched IPC database command using SQLite window functions (`ROW_NUMBER() OVER (PARTITION BY pi.playlist_id ORDER BY COALESCE(vp.last_updated, '1970-01-01') DESC, pi.position DESC)` joining `video_progress vp`).
- **Filtered Video Previews**: Previews filter out local device folders, Orbs, Banner Presets, Playlist Link Cards, and Folder Trackers, presenting YouTube video thumbnails in the mini-preview strip in order of most recently watched.
- **Skeleton Loading System**:
  - **DB Fetch Skeletons**: Pre-data fetching renders 4 animated pulsing skeleton slots (`bg-slate-900/60 animate-pulse rounded-xl`) to maintain card heights without layout shift while backend queries resolve.
  - **Network Image Download Placeholders**: `MiniPreviewItem` tracks image load state using DOM element `ref` inspection (`el.complete`) and `onLoad` handlers, displaying a dark pulsing background until image bytes finish downloading.
  - **Empty Placeholders**: Empty playlists display 4 subtle dashed slot outlines (`border-dashed border-[#052F4A]/15`).

---

## 3. Colored Folders Integration

Users interact with colored folders via the **Prism Folder Filter (PlaylistBar)**: Selecting a folder color segment on the top `PlaylistBar` filters the vertical list to show playlists belonging to that folder color group on the active page. Selecting White displays all playlists, while Black displays unsorted playlists.

---

## File Manifest

- **`src/components/PlaylistsPage.jsx`**: Top-level page component managing vertical scrolling card grid, tab filters, prism folder selection, and batched IPC data loading.
- **`src/components/LongPlaylistCard.jsx`**: High-density horizontal card component with solid header, 4-item ($1 \times 4$) video preview grid, and skeleton loading state system.
- **`src/components/PlaylistBar.jsx`**: Top colored folder prism segment navigation bar.
- **`src/components/TabBar.jsx`**: Tab navigation bar component.
