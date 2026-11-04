# Fullscreen Video Info Panel

The Fullscreen Video Info panel is a dedicated component that appears in the right margin of the layout when the app is in **fullscreen mode** (`viewMode === 'full'`). It displays rich metadata for the currently playing video (thumbnail, author, view count, date, description, tags) and parent playlist card while keeping layout logic isolated from `LayoutShell.jsx`.

---

## Architectural & Visual Overview

```
+-------------------------------------------------------+
|  [Solid Opaque Black Canvas: bg-black / #000000]      |
|  +-------------------------------------------------+  |
|  | [Main Video Thumbnail (16:9, borderless)]       |  |
|  |  [Top Hover Overlay: Avatar, Author, Views, Yt] |  |
|  |  [Bottom Hover Overlay: Vol, Tab, Shield]      |  |
|  +-------------------------------------------------+  |
|  +-------------------------------------------------+  |
|  | [10 Mini Thumbnail Grid (2-Column x 5-Row)]     |  |
|  |  OR [Integrated Description Box]                |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

### 1. Minimalist Duo-Tone Canvas & Top Player Alignment
- **Top Edge Alignment**: The static metadata card was removed from the top of the panel. The main thumbnail now anchors directly at the very top of the panel, aligning flush with the top edge of the main video player in Column 1.
- **2-Column x 5-Row Mini Grid**: The mini preview thumbnails use a **2-column layout** (`miniGridCols={2}`, `miniGridLimit={10}`) with 10 thumbnails. Each thumbnail expands from ~140px to ~214px wide (50% larger), allowing 5 rows of 2 to naturally fill the entire vertical height of the panel down to the bottom margin with zero dead space.
- **Theme Canvas Integration**: Dynamic `var(--theme-bg)` container matching the active 2-color duo-tone theme with zero background blur or overhead.

---

### 2. Layout Sections & Hover Overlay Architecture

- **Main Video Thumbnail (Dual Hover Overlays & Context Menu)**:
  - 16:9 aspect ratio thumbnail positioned directly at the top of the panel with borderless framing (`border-0 shadow-none rounded-xl`).
  - **Top Hover Overlay Bar**: Hovering over the main video thumbnail reveals a gradient backdrop bar (`bg-gradient-to-b from-black/95 via-black/70 to-transparent`) at the top of the thumbnail containing:
    - **Channel Avatar & Name**: Circular avatar (36px, `border border-white/20`) alongside the channel/author name (`font-black text-sm text-white truncate`).
    - **Metadata Line**: Crisp view count and upload date (`text-[11px] font-bold text-white/80`, e.g. `1,234,567 views  •  October 10, 2026`).
    - **External Link Button**: YouTube icon button (`ExternalLink` icon, clickable) linking directly to the video URL on YouTube.
  - **Bottom Hover Overlay Bar**: Hovering also reveals the bottom gradient bar containing:
    - Integrated Volume Slider controller (mute button + volume range track)
    - Info vs. Playlist mode tab toggle button (`ListMusic` / `Info`)
    - Screen Protector Shield toggle capsule (`Shield` / `ShieldOff`)
  - **Right-Click Context Menu**: Right-clicking the thumbnail opens `VideoCardThreeDotMenu` for instant access to pin toggles, drumstick 1–5 rating, colored folder assignments, and deletion.
- **Integrated Description Box / Mini Thumbnail Grid**:
  - **Playlist Tab**: Displays 10 large preview items ($2 \text{ columns} \times 5 \text{ rows}$, `grid-cols-2 gap-2`) via `PlaylistCard` directly underneath the top-aligned main thumbnail, filling the panel vertically to the bottom edge.
  - **Info Tab**: Displays the expandable video description inside a seamless borderless container with `[ Expand Description ]`.

---

### 3. Instant Blanking Transition
When opening side menus or switching views from fullscreen mode, `layoutStore.fullscreenInfoBlanked` is set to `true`, causing the panel content to clear immediately on that frame. This eliminates perceived visual clutter during layout transitions.

---

## File Manifest & State Integration

- **Component Path**: `src/components/FullscreenVideoInfo.jsx`
- **Layout Host**: `src/LayoutShell.jsx` (Column 2 in fullscreen mode).
- **State Connections**:
  - `playlistStore`: Reads `currentPlaylistItems`, `currentVideoIndex`, `currentPlaylistId`.
  - `layoutStore`: Reads/writes `fullscreenInfoBlanked`, `screenProtectorActive`.
- **API Queries**:
  - `getPlaylistItemsPreview(currentPlaylistId, 30)`: Fetches up to 30 preview items for the embedded `PlaylistCard` ordered by most recently watched, filtered in frontend to strictly render standard video thumbnails.
  - `getFoldersForPlaylist(currentPlaylistId)`: Loads folder metadata.
