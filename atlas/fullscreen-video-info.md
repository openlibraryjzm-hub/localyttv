# Fullscreen Video Info Panel

The Fullscreen Video Info panel is a dedicated component that appears in the right margin of the layout when the app is in **fullscreen mode** (`viewMode === 'full'`). It displays rich metadata for the currently playing video (thumbnail, author, view count, date, description, tags) and parent playlist card while keeping layout logic isolated from `LayoutShell.jsx`.

---

## Architectural & Visual Overview

```
+-------------------------------------------------------+
|  [Solid Opaque Container: bg-slate-950]               |
|  +-------------------------------------------------+  |
|  | [Blurred Banner Backdrop Layer: z-0]            |  |
|  | (filter: blur(28px), scale: 1.15)               |  |
|  +-------------------------------------------------+  |
|  +-------------------------------------------------+  |
|  | [Content Layer: z-10]                           |  |
|  |                                                 |  |
|  |  1. Video Thumbnail (16:9, rounded, shadow)     |  |
|  |  2. Channel Info & Metadata (Avatar, View Count) |  |
|  |  3. Playlist Card (Solid Header + 15 Mini Grid) |  |
|  |  4. Bottom Controls (Volume Slider & Playback)  |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

### 1. Blurred Banner Backdrop Integration
- Uses the **Atmospheric Blurred App Banner Backdrop System** (`atlas/design/blurred-banner-backdrop-system.md`).
- A heavily blurred App Banner background (`filter: blur(28px)`, `transform: scale(1.15)`) overlays a solid container backdrop (`bg-slate-950`).
- Resolves effective banner settings dynamically from `useConfigStore`.

---

### 2. Layout Sections (Top to Bottom)

- **Main Video Thumbnail**: 16:9 aspect ratio thumbnail at the top of the panel with rounded corners and border shadow.
- **Channel Info & Metadata Area**:
  - **Row 1 (Channel Details)**: Circular author avatar, centered channel name, and external link button.
  - **Row 2 (Metadata Stats)**: Centered view count and upload date formatted as `Month Day, Year` with 1px black stroke outlines and drop shadows for high readability over any background.
- **Playlist Tab & Card Container**:
  - Displays parent playlist metadata and mini previews via `PlaylistCard` in `large` size mode.
  - Container is horizontally indented (`px-5 mt-2`) for clean visual hierarchy.
  - Renders a **solid top header bar** (`bg-slate-100 border-2 border-[#052F4A]`) over a **floating 15-item mini thumbnail grid** ($3 \text{ columns} \times 5 \text{ rows}$, `grid-cols-3 gap-1`).
  - Fetches 15 preview items via `getPlaylistItemsPreview(currentPlaylistId, 15)`.
- **Bottom Control Bar**:
  - Balanced control bar featuring an expanding volume range slider (`flex-1 min-w-[70px] max-w-[150px]`) and playback control triggers.

---

### 3. Instant Blanking Transition
When opening side menus or switching views from fullscreen mode, `layoutStore.fullscreenInfoBlanked` is set to `true`, causing the panel content to clear immediately on that frame. This eliminates perceived visual clutter during layout transitions.

---

## File Manifest & State Integration

- **Component Path**: `src/components/FullscreenVideoInfo.jsx`
- **Layout Host**: `src/LayoutShell.jsx` (Column 2 in fullscreen mode).
- **State Connections**:
  - `playlistStore`: Reads `currentPlaylistItems`, `currentVideoIndex`, `currentPlaylistId`.
  - `layoutStore`: Reads/writes `fullscreenInfoBlanked`.
  - `configStore`: Reads fullscreen banner settings.
- **API Queries**:
  - `getPlaylistItemsPreview(currentPlaylistId, 15)`: Fetches 15 preview items for the embedded `PlaylistCard`.
  - `getFoldersForPlaylist(currentPlaylistId)`: Loads folder metadata.
