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
|  |  1. Hero Video Metadata Card                    |  |
|  |     Row 1: Centered Avatar & Uploader           |  |
|  |     Row 2: View Count & Upload Date             |  |
|  |  2. Main Video Thumbnail (16:9, rounded, shadow)  |  |
|  |     [Hover Overlay Controls: Vol, Tab, Shield]  |  |
|  |  3. 18 Mini Thumbnail Grid (3 x 6)              |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

### 1. Blurred Banner Backdrop Integration
- Uses the **Atmospheric Blurred App Banner Backdrop System** (`atlas/design/blurred-banner-backdrop-system.md`).
- A heavily blurred App Banner background (`filter: blur(28px)`, `transform: scale(1.15)`) overlays a solid container backdrop (`bg-slate-950`).
- Resolves effective banner settings dynamically from `useConfigStore`.

---

### 2. Layout Sections (Top to Bottom)

- **Hero Video Metadata Card**:
  - A single consolidated light card (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl p-3 shadow-md flex flex-col gap-2.5`).
  - **Outer Alignment**: Outer border aligns pixel-perfectly with the main thumbnail and mini preview grid edges via consistent 10px (`px-2.5`) outer container padding.
  - **Row 1 (Centered Hero Uploader & Subtle YouTube Link)**:
    - **Center**: Centered circular author avatar (48px) with dark navy border alongside channel uploader name in prominent hero font (**`text-lg font-black text-[#052F4A]`**).
    - **Right Edge**: Subtle, low-profile YouTube icon button (`ExternalLink` icon button, absolute-positioned on the right).
  - **Row 2 (Dedicated Prominent Full-Width Metadata Bar)**:
    - **Center**: Full-width dedicated row displaying View Count & Upload Date in large, bold, high-visibility typography (**`text-[15px] font-black text-[#052F4A]`**, e.g. `1,234,567 views  •  October 10, 2026`).
- **Main Video Thumbnail (Hover Controls & Context Menu)**: 
  - 16:9 aspect ratio thumbnail positioned directly underneath the Hero Video Metadata Card.
  - **Right-Click Context Menu**: Right-clicking the main thumbnail opens `VideoCardThreeDotMenu` for the currently playing video at the cursor's exact coordinates (`cursor-context-menu`), giving instant access to pin toggles, drumstick 1–5 rating, colored folder assignments, and deletion.
  - **Hover Overlay Controls Bar**: Hovering over the main video thumbnail reveals a gradient backdrop bar at the bottom of the thumbnail containing:
    - Integrated Volume Slider controller (mute button + volume range track)
    - Info vs. Playlist mode tab toggle button (`ListMusic` / `Info`)
    - Screen Protector Shield toggle capsule (`Shield` / `ShieldOff`)
- **Mini Thumbnail Grid (18 Items)**: 18 preview items ($3 \text{ columns} \times 6 \text{ rows}$, `grid-cols-3 gap-1.5`) floating directly underneath the Main Video Thumbnail, filling the sidebar panel vertically. Filtered strictly to display **video thumbnails** (Orbs and Banner presets excluded) ordered by most recently watched (`COALESCE(vp.last_updated, '1970-01-01') DESC, pi.position DESC`). Previews feature a clean hover transition (`opacity-80 group-hover/mini:opacity-100`) without play button overlays or browser title tooltips. Clicking any mini thumbnail immediately launches playback for that video via `onVideoSelect`.

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
