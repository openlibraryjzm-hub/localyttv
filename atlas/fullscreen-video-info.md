### Fullscreen Video Info

The Fullscreen Video Info panel is a dedicated component that appears in the right margin of the layout when the app is in **fullscreen mode**. It displays metadata for the currently playing video (thumbnail, author, view count, date, description, tags) and keeps layout logic out of `LayoutShell.jsx`. When the user opens a splitscreen page (e.g. from PlayerController or a tab), the panel can blank instantly before the transition.

**Related Documentation:**
- **Layout**: See `ui-layout.md` for fullscreen grid, fullscreen player width, and fullscreen↔splitscreen transition
- **Video Player**: See `videoplayer.md` for main player and progress
- **Player Controller**: See `advanced-player-controller.md` for top-menu video metadata (author, view count, year)
- **State**: See `state-management.md` for `playlistStore` (current playlist items, video index), `layoutStore` (`fullscreenInfoBlanked`)

---

#### Overview

**1: User-Perspective Description**

When the app is in fullscreen view (no side menu), users see a right-hand margin next to the video player. In that margin (order top to bottom):

- **Background:** A **heavily blurred** version of the current **fullscreen app banner** fills the panel behind the content. The same banner config as the top-of-app banner is used (fullscreen banner + preset override when banner nav is active); image, scale, and position match. Blur is applied via CSS `filter: blur(28px)` and a slight scale to avoid edge artifacts. The banner can be a static image or GIF (GIFs animate in the blur). See `app-banner.md` for banner configuration.

- **Thumbnail**: Current video thumbnail at the very top (16:9, rounded, shadow) without overlays.

- **Channel Info & Metadata Area**: Positioned directly underneath the video thumbnail with a clean vertical spacing:
  - **Row 1 (Channel Details)**: Circular channel profile avatar on the left, the channel author name directly to its right, and an external link button to the right of the channel name.
  - **Row 2 (Metadata Stats)**: View count and upload date displayed cleanly below Row 1.
    - View count shows fully comma-separated numbers (e.g. `6,500,000`).
    - Upload date is formatted as `Month Day, Year` (e.g. `May 6, 2025`).

- **Playlist Tab**: Shows the parent playlist's metadata and video previews. The playlist card is horizontally indented (`px-5` offset) to be slightly less wide than the video thumbnail, creating visual hierarchy. By default, the panel initializes with the playlist card visible.

- **Bottom Control Bar**:
  - **Headless Controls**: Zero left padding and balanced controls.
  - **Integrated Volume Slider**: A full-width slider representing the current in-app volume level alongside a volume mute/unmute button. The slider expands horizontally to fill the gap on the right and balance the button row layout.

**Not displayed** (data may still be in DB): Video length (duration), likes count, comment count. These are intentionally omitted from this panel.

**Instant blank on open splitscreen:** When the user clicks a control that opens the side menu (e.g. a tab or PlayerController button), `layoutStore.fullscreenInfoBlanked` is set to true so the panel content clears immediately; then on the next frame the view switches to half/quarter and the side menu appears. This reduces perceived clutter during the transition.

**2: File Manifest**

**UI/Components:**
- `src/components/FullscreenVideoInfo.jsx`: Self-contained component; reads `currentPlaylistItems` and `currentVideoIndex` from `playlistStore`, `fullscreenInfoBlanked` from `layoutStore`; renders only when there is a valid current video and not blanked.
- `src/LayoutShell.jsx`: Renders the right column with `<FullscreenVideoInfo />` when `viewMode === 'full'` and not in debug bounds mode. Does not contain video-info logic.
- `src/LayoutShell.css`: `.layout-shell__fullscreen-video-info` — grid placement (column 2), flex column, padding (e.g. 25px top), no top centering so content starts near the top.

**State Management:**
- `src/store/playlistStore.js`:
  - `currentPlaylistItems`: Array of playlist items for the current playlist (includes `thumbnail_url`/`thumbnailUrl`, `author`, `view_count`, `published_at`, `title`, `description`, `tags`).
  - `currentVideoIndex`: Index of the currently playing video.
- `src/store/layoutStore.js`:
  - `fullscreenInfoBlanked`: When true, FullscreenVideoInfo renders an empty panel (used when opening splitscreen from fullscreen).
  - `setFullscreenInfoBlanked(v)`: Set by entry points that open the side menu; cleared when returning to full mode.
- `src/store/configStore.js`: Fullscreen banner config (and preset override when `bannerNavBannerId` set) is read to render the blurred background; same resolution logic as LayoutShell.

**API/Bridge:**
- No Tauri commands — data comes from existing playlist state (populated by normal playback and import flows).

**Backend:**
- Data originates from `playlist_items` (and related) tables; no direct DB access in this component.

**3: Logic & Data**

- **Visibility**: Shown only in fullscreen (`viewMode === 'full'`) and when debug bounds are off. Hidden in half/quarter and debug. When `fullscreenInfoBlanked` is true, the panel wrapper is still rendered but content is empty.
- **Current video**: `video = currentPlaylistItems[currentVideoIndex]` when index is in range; otherwise component returns `null`.
- **Channel Link Lookup**: Uses a helper `getChannelUrl(video)` to dynamically construct the link for the external button:
  - If the item is already a channel URL, it resolves directly.
  - If the item is a Twitter video, it parses the handle and links to `https://x.com/username`.
  - For standard YouTube videos, it links to search results for the channel name.
  - For local video files, it returns `null` and the button is hidden.
- **View count**: Parsed from `video.view_count` (string or number), formatted with commas via `toLocaleString()`.
- **Upload date**: Formatted as `Month Day, Year` via `toLocaleDateString()`.
- **Thumbnail**: `video.thumbnail_url || video.thumbnailUrl`; thumbnail block not rendered if missing.
- **Description**: `video.description`; trimmed and only shown when non-empty; trimmed/condensed inside description tab, without redundant author/view headers.
- **Tags**: `video.tags` is a JSON array string; parsed with `JSON.parse` (safe fallback to empty array); up to 12 tags shown as pills, remainder as "+N".

**Source of Truth:**
- `playlistStore.currentPlaylistItems` and `playlistStore.currentVideoIndex` — same as main player and Player Controller top menu.

**4: Styling Summary**

- Panel: Flex column, align start, padding (10px top, 0.35rem sides, 0 bottom). Class: `layout-shell__fullscreen-video-info`. Root has `position: relative; overflow: hidden`; blurred banner layer is `position: absolute; inset: 0; z-index: 0`; content wrapper is `position: relative; z-index: 1`.
- Blurred background: Fullscreen app banner image/position/scale; `filter: blur(28px)`; `transform: scale(1.15)`; `pointer-events: none`.
- Thumbnail: `aspect-video`, `object-cover`, `rounded-xl`, `border-[2px]`, without any overlays.
- Channel Info & Metadata: flex container with items-center gap-3 for Row 1, and text-[10px] tracking-wider for Row 2.
- Bottom Controls: Balanced control bar (`gap-2`) featuring an expanding volume range slider (`flex-1 min-w-[70px] max-w-[150px]`) that fills the row.
- Playlist Card: Default initial view, slightly shrunk horizontally via `px-5 mt-2` on container for clean visual spacing, docked to thumbnail/info sections.
