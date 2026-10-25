# Fullscreen Video Info Panel

The Fullscreen Video Info panel is a dedicated component that appears in the right margin of the layout when the app is in **fullscreen mode** (`viewMode === 'full'`). It displays rich metadata for the currently playing video (thumbnail, author, view count, date, description, tags) and parent playlist card while keeping layout logic isolated from `LayoutShell.jsx`.

---

## Architectural & Visual Overview

```
+-------------------------------------------------------+
|  [Solid Opaque Black Canvas: bg-black / #000000]      |
|  +-------------------------------------------------+  |
|  | [Hero Video Metadata Card: border-0 bg-black]   |  |
|  |  Row 1: Centered Avatar & Uploader (White Text) |  |
|  |  Row 2: View Count & Upload Date (White Text)   |  |
|  +-------------------------------------------------+  |
|  +-------------------------------------------------+  |
|  | [Main Video Thumbnail (16:9, borderless)]       |  |
|  |  [Hover Overlay Controls: Vol, Tab, Shield]     |  |
|  +-------------------------------------------------+  |
|  +-------------------------------------------------+  |
|  | [Integrated Description Box (border-0 bg-trans)]|  |
|  | OR 18 Mini Thumbnail Grid (Playlist Tab)        |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

### 1. Solid Pure Black Canvas
- **Pure Black Canvas**: Hardcoded `#000000` (`bg-black`) container with zero background blur, glassmorphism, or glow effects.
- **Eliminated Atmospheric Banner Overhead**: Shed legacy blurred banner backdrop calculations and layers for maximum performance.

---

### 2. Layout Sections (Top to Bottom)

- **Hero Video Metadata Card**:
  - Borderless and shadowless container (`border-0 shadow-none bg-black text-white p-3 rounded-2xl`).
  - Outer margin aligns pixel-perfectly with the main thumbnail via consistent 10px (`px-2.5`) outer container padding.
  - **Row 1 (Centered Hero Uploader & Subtle YouTube Link)**:
    - **Center**: Centered circular author avatar (48px, borderless) alongside channel uploader name in prominent hero font (**`text-lg font-black text-white`**).
    - **Right Edge**: Subtle, low-profile YouTube icon button (`ExternalLink` icon button, `border-transparent hover:border-white/20 bg-zinc-900/60 hover:bg-zinc-800`).
  - **Row 2 (Dedicated Prominent Full-Width Metadata Bar)**:
    - **Center**: Full-width dedicated row displaying View Count & Upload Date in crisp white typography (**`text-[15px] font-black text-white`**, e.g. `1,234,567 views  •  October 10, 2026`).
    - The legacy horizontal divider line between Row 1 and Row 2 was removed, letting the metadata breathe naturally over black.
- **Main Video Thumbnail (Hover Controls & Context Menu)**: 
  - 16:9 aspect ratio thumbnail positioned directly underneath the Hero Video Metadata Card with clean borderless framing (`border-0 shadow-none rounded-xl`).
  - **Right-Click Context Menu**: Right-clicking the main thumbnail opens `VideoCardThreeDotMenu` for the currently playing video at the cursor's exact coordinates (`cursor-context-menu`), giving instant access to pin toggles, drumstick 1–5 rating, colored folder assignments, and deletion.
  - **Hover Overlay Controls Bar**: Hovering over the main video thumbnail reveals a gradient backdrop bar at the bottom of the thumbnail containing:
    - Integrated Volume Slider controller (mute button + volume range track)
    - Info vs. Playlist mode tab toggle button (`ListMusic` / `Info`)
    - Screen Protector Shield toggle capsule (`Shield` / `ShieldOff`)
- **Integrated Description Box / Mini Thumbnail Grid**:
  - **Info Tab**: Displays the video description inside a seamless borderless container (`border-0 bg-transparent text-sm font-semibold`) with an expandable `[ Expand Description ]` toggle.
  - **Playlist Tab**: Displays up to 18 preview items ($3 \text{ columns} \times 6 \text{ rows}$, `grid-cols-3 gap-1.5`) via `PlaylistCard` embedded in borderless pure black mode.

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
