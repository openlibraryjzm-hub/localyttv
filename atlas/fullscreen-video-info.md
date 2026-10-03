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
|  |  1. Channel Info & Metadata (Avatar, View Count) |  |
|  |  2. Playlist Card (Solid Header)                |  |
|  |  3. Video Thumbnail (16:9, rounded, shadow)     |  |
|  |  4. 15 Mini Thumbnail Grid                      |  |
|  |  5. Bottom Controls (Volume Slider & Playback)  |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

### 1. Blurred Banner Backdrop Integration
- Uses the **Atmospheric Blurred App Banner Backdrop System** (`atlas/design/blurred-banner-backdrop-system.md`).
- A heavily blurred App Banner background (`filter: blur(28px)`, `transform: scale(1.15)`) overlays a solid container backdrop (`bg-slate-950`).
- Resolves effective banner settings dynamically from `useConfigStore`.

---

### 2. Layout Sections (Top to Bottom)

- **Channel Info & Metadata Card**:
  - A single solid light card (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl p-3 shadow-md`).
  - **Left**: Circular author avatar (48px) with a dark navy border. Automatically resolves profile pictures via YouTube Channels API or fallback enrichment if missing.
  - **Middle Column**: Channel author name (large, bold `#052F4A`) stacked with view count, upload date, and enriched description.
  - **Right**: Compact YouTube action pill button with `ExternalLink` icon and `"YouTube"` text.
- **Playlist Tab & Card Container**:
  - Displays parent playlist metadata and mini previews via `PlaylistCard` in `large` size mode.
  - Container is horizontally indented (`px-5 mt-2`) for clean visual hierarchy.
  - Renders a **2-row solid Playlist Header Card** (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl p-1 shadow-md h-[68px]` matching Author Card height):
    - **Row 1**: Playlist Title.
    - **Row 2**: Content type indicators (`🎬 Videos`, `🔮 Orbs`, `🖼️ Banners`) on left + Colored folder distribution pill badges (`[🔴 4] [🔵 2]`) on right.
  - **Main Video Thumbnail**: 16:9 aspect ratio thumbnail positioned directly underneath the 2-row Playlist Header Card (and above the 15 mini thumbnail grid).
  - **Mini Thumbnail Grid**: 15 preview items ($3 \text{ columns} \times 5 \text{ rows}$, `grid-cols-3 gap-1`) floating directly underneath the Main Video Thumbnail, filtered strictly to display **video thumbnails** (Orbs and Banner presets excluded) ordered by most recently watched. Previews feature a clean hover transition (`opacity-80 group-hover/mini:opacity-100`) without play button overlays or browser title tooltips.
- **Bottom Control Dock Card**:
  - A unified solid light card (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl px-3 py-2 shadow-md mx-2.5 mb-2.5`).
  - **Left**: Volume control section with Mute button (`#052F4A`) and custom range slider.
  - **Center**: Interactive Info vs Playlist mode toggle pill button (`border-2 border-[#052F4A]`).
  - **Right**: Screen Protector Shield toggle capsule with a dark navy border.

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
  - `getPlaylistItemsPreview(currentPlaylistId, 30)`: Fetches up to 30 preview items for the embedded `PlaylistCard` ordered by most recently watched (`COALESCE(vp.last_updated, '1970-01-01') DESC, pi.position DESC`), filtered in frontend to strictly render standard video thumbnails.
  - `getFoldersForPlaylist(currentPlaylistId)`: Loads folder metadata.
