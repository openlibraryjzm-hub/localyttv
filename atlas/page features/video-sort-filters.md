# VideoSortFilters & Videos Page Sticky Toolbar

This document describes the **Videos page sticky toolbar**: the icon-based sort/rating bar (**VideoSortFilters**) and the **colored folder prism** that share one row. Together they provide sorting (default, date, added to app, progress, last viewed), rating filtering (drumstick 1–5), and folder filtering (All, Unsorted, 16 colors) with an optional “populated-only” prism mode.

---

## 1. Overview

**Location**: The sticky toolbar sits at the top of the Videos page content area (`VideosPage.jsx`). When the user scrolls down, the bar sticks to the top of the viewport (sticky positioning) and gains a stronger backdrop/blur for visibility.

**Layout (left to right)**:

1. **Sort & rating filters** – `VideoSortFilters.jsx`: two toolbar buttons (Home, Funnel). Funnel dropdown contains sort options and rating filter.
2. **Action buttons** – Add (uploader), Refresh (subscriptions; right-click = manage modal), Bulk tag (right-click = Auto-Tag). Same row, right of the filter; driven by `layoutStore`; VideosPage opens modals/refresh and clears one-shot flags.
3. **Full Bar Glow Context** – The row features a dynamically colored background layer that provides a **full-bar glow** effect. This glow updates based on the selected folder (All = white, Unsorted = black, colors = respective hex).
4. **Folder prism** – Inline in `VideosPage.jsx`: a colored segment bar (All, Unsorted, 16 folder colors) that fills the remaining width. **Right-click** anywhere on the prism opens a context menu. This menu allows toggling between populated-only and all-segments mode, as well as an option to rename the specific colored folder (or the main playlist if clicking the All/Unsorted segments).
5. **Right side** – Back (when history or preview) and Close (fullscreen). These elements are lifted to `z-20` to remain on top of the background glow. **TopNavigation** no longer shows Add, Subscriptions, Bulk tag, Back, or Close when on Videos page.

**State ownership**: Sort mode, sort direction, selected ratings, and prism mode are local state in `VideosPage.jsx`. Folder selection is in `folderStore`; folder counts and segment data are derived in `VideosPage` from `videoFolderAssignments` and `activePlaylistItems`.

---

## 2. VideoSortFilters Component

**File**: `src/components/VideoSortFilters.jsx`

Icon-based sort and rating filter bar. **Home** and **Funnel** use Lucide icons; the rating filter in the dropdown uses the drumstick emoji (🍗). Styling switches between **light** (All selected: white/light bar) and **dark** (Unsorted or a folder selected: colored bar) via the `isLight` prop.

### 2.1 The two toolbar buttons + dropdown contents

| Control   | Icon        | Behavior |
|----------|-------------|----------|
| **Home** | `Home`      | **Default order.** Sets sort to `shuffle`. No direction. Restores the default video order (shuffle-state driven). |
| **Funnel** | `Filter`  | **Sort & rating dropdown.** Click opens a dropdown with: (1) **Sort by date** (Calendar), **Added to app** (ListPlus), **Sort by progress** (BarChart), **Sort by last viewed** (Clock), and **Watch Count** (Eye)—select an option or click again to cycle asc/desc; (2) **Rating filter**—a horizontal row of five drumstick icons (1–5) for multi-select. The funnel button appears active when any of the sorts is active or any rating is selected. Dropdown closes on outside click. |

**Direction cycling**: For Date, Progress, and Last viewed (inside the funnel dropdown), when that mode is already active, clicking it again only toggles `sortDirection` between `'asc'` and `'desc'`.

### 2.2 Props

| Prop               | Type       | Description |
|--------------------|------------|-------------|
| `sortBy`           | `string`   | Current sort mode: `'shuffle'` \| `'chronological'` \| `'addedToApp'` \| `'progress'` \| `'lastViewed'` \| `'watchCount'`. |
| `setSortBy`        | `function` | Setter for sort mode. |
| `sortDirection`    | `string`   | `'asc'` \| `'desc'`. Used for chronological, progress, lastViewed. |
| `setSortDirection` | `function` | Setter for direction. |
| `selectedRatings`  | `number[]` | Array of selected rating values (1–5). Empty = no rating filter. |
| `onToggleRating`   | `function` | `(rating: number) => void`. Toggle that rating in/out of `selectedRatings`. |
| `isLight`          | `boolean`  | Optional, default `true`. When `true`, bar uses light theme (white/gray buttons, black borders). When `false`, uses dark theme (white-on-dark) for Unsorted/folder context. |
| `className`        | `string`   | Optional. Applied to the root flex container. |

### 2.3 Styling and UX Details

- **Full Bar Glow**: The toolbar features an absolute background layer (z-0) with dual blur passes (20px @ 70% opacity and 10px @ 85% opacity) that spans the entire width of the sticky bar. This background color reflects the current view context (All: bright white, Unsorted: black, Folders: folder hex color).
- **Buttons**: Rounded, border-2, padding; active = filled (black in light theme, white in dark); inactive = translucent with hover darkening. Actions are defined using the `ICON_WHITE_OUTLINE` style. They are permanently visible on the left side of the bar.
- **Funnel dropdown**: Opens below the funnel button; left-aligned. Contains (1) five sort rows (Date, Added to App, Progress, Last viewed, Watch Count), each with icon + label; active row shows direction arrow (↑ asc, ↓ desc); clicking a row selects that sort (desc) or cycles direction if already selected. (2) **Rating filter** section with a label and a horizontal row of five drumstick buttons (1–5); multi-select toggles; selected state = full opacity + scale. Dropdown uses same light/dark styling; closes on outside mousedown.
- ~~**Title Behavior**~~: The contextual text titles that used to hover over the glowing background have been completely removed per user request.
- ~~**Drumstick strip**~~: Rating filter is now inside the funnel dropdown as a horizontal row (see above).

---

## 3. Folder Prism (Colored Segment Bar)

The **folder prism** is implemented inside `VideosPage.jsx`, not in `VideoSortFilters.jsx`. It occupies the middle and right part of the sticky toolbar row (flex-1, min-w-0). It shows segments for **All**, **Unsorted**, and the **16 folder colors** from `FOLDER_COLORS` (`src/utils/folderColors.js`). Clicking a segment sets the selected folder and filters the video grid (and updates header/folder context).

### 3.1 Two Prism Modes & Context Menu (right-click)

**Right-click on the prism** opens a contextual menu with the following options:

1. **Prism Display Mode Toggle**: Switches between:
   - **Populated-only (default)**  
     - Only segments with **at least one item** are shown: All (always), Unsorted (if count ≥ 1), and each color that has count ≥ 1.  
     - Segments are **equal width** (flex-1), so 2 segments or 7 segments are equally spaced in the allotted space.  
     - Item counts are shown per segment.  
     - Default when entering the Videos page: `prismOnlyPopulated === true`.
   - **All segments**  
     - All 18 segments are shown: All, Unsorted, and all 16 colors.  
     - Each segment is flex-1 with min/max width constraints; colors with 0 items still appear (count hidden when 0).

2. **Rename Folder**: Opens the `EditPlaylistModal` specialized for the segment you right-clicked on.
   - Right-clicking a colored folder allows renaming that specific folder for the current playlist.
   - Right-clicking the "All" or "Unsorted" segments allows renaming the current main playlist itself.

### 3.2 Segment Types and Appearance

- **All** (`selectedFolder === null`): White background, black text; shows total count (videos + assigned orbs + assigned banners). **Triggers full-bar white glow.**
- **Unsorted** (`selectedFolder === 'unsorted'`): Black background, white text; shows count of videos with no folder assignment. **Triggers full-bar black glow.** The main display title remains the playlist name (without suffix).
- **Color segments**: Background from `FOLDER_COLORS[].hex`; text white with drop-shadow; shows count when visible (in “all segments” mode, count only shown when &gt; 0). **Triggers full-bar hex color glow.**

Selected segment is emphasized with a ring (inset ring-2); All uses `after:ring-black/10`, Unsorted `after:ring-white/30`, colors `after:ring-white/50`. Segments sit on top of the bar's full-width background glow.

### 3.3 Data and State (VideosPage)

- **Folder selection**: `selectedFolder`, `setSelectedFolder` from `folderStore` (null = All, `'unsorted'`, or a color id).
- **Counts**:  
  - `folderCounts`: per-color counts from `videoFolderAssignments`.  
  - `allCount`: total items (playlist items + orbs + banners for current playlist).  
  - `unsortedCount`: videos in current playlist with no folder assignment.
- **Populated-only segments**: `prismPopulatedSegments` is a `useMemo`: All + Unsorted (if unsortedCount ≥ 1) + each color with count ≥ 1, in order. Used when `prismOnlyPopulated` is true.
- **Prism mode**: `prismOnlyPopulated` (useState, default true); toggled via the **right-click context menu** on the prism.

Pagination and scroll position are reset when folder, sort, or rating filters change (including when switching prism mode if it changes which folder is conceptually “focused”; folder change itself triggers reset).

---

## 4. Sort and Filter Logic (VideosPage)

Sort and rating filtering are applied in `VideosPage` after folder filtering:

- **Rating filter**: If `selectedRatings.length > 0`, the visible list is filtered to items whose `drumstick_rating` is in `selectedRatings`. Orbs and banner presets are kept regardless.
- **Sort**:  
  - `shuffle`: Order by shuffle state (stable order from `shuffleStates[activePlaylistId]`).  
  - `chronological`: Sort by `published_at` or `added_at` (fallback); direction from `sortDirection`.  
  - `addedToApp`: Sort by `added_at` (when it was added to the playlist); direction from `sortDirection`.
  - `progress`: Sort by progress percentage (from `videoProgress`); optional filters “hide unwatched” and “show only completed” apply here; direction from `sortDirection`.  
  - `lastViewed`: Sort by `last_updated` from progress data; direction from `sortDirection`.
  - `watchCount`: Sort by the number of times a video was opened/played (`watch_count` from `videoProgress`); direction from `sortDirection`.

Progress, last-viewed, and watch count data come from `getAllVideoProgress` / `getWatchedVideoIds` (and are refreshed on an interval and when the current video index changes).

---

## 5. File Manifest

| File | Role |
|------|------|
| `src/components/VideoSortFilters.jsx` | Sort and rating UI (Home, Funnel dropdown with Date/Progress/Last viewed + horizontal rating filter 1–5). |
| `src/components/VideosPage.jsx`       | Renders sticky toolbar; hosts VideoSortFilters, Add/Refresh/Bulk tag buttons, folder prism, Back/Close, and all sort/filter state and logic. |
| `src/store/folderStore.js`            | `selectedFolder`, `setSelectedFolder`, `videoFolderAssignments`, `loadVideoFolders`. |
| `src/store/shuffleStore.js`           | Shuffle state per playlist for default (shuffle) order. |
| `src/store/paginationStore.js`        | Pagination; reset when folder/sort/rating change. |
| `src/utils/folderColors.js`           | `FOLDER_COLORS` (16 colors with id, name, hex). |
| `src/api/playlistApi.js`              | `getAllFolderAssignments`, `getVideosInFolder`, `getAllVideoProgress`, `getWatchedVideoIds`, etc. |

---

## 6. Cross-References

- **Videos page and sticky bar**: `ui-pages.md` §4.1.2 (Videos Page, Sticky Toolbar).
- **Drumstick rating system**: `drumstick-rating-system.md` (schema, API, card integration; toolbar filter described there briefly).
- **Folder system and playlists**: `playlist&tab.md` (folders, assignments, tabs).
- **State**: `state-management.md` (`folderStore`, `layoutStore`, `paginationStore`, `shuffleStore`).
- **Database / API**: `database-schema.md`, `api-bridge.md` (folder assignments, progress, ratings).

---

## 7. Summary

- **VideoSortFilters**: A unified toolbar cluster containing:
  - **Home** (default order)
  - **Funnel** (dropdown): sort options (Date, Added to App, Progress, Last viewed, Watch Count; select or cycle asc/desc) and horizontal **Rating filter** row (1–5 drumsticks).
  - **Plus / Actions** (dropdown): Consolidated Add (uploader), Refresh (subscriptions), and Bulk tag functionalities.
  - **Pagination**: Left and Right chevron buttons flanking the current page number.
- **Full Bar Glow**: The toolbar background features an absolute dual-blur layer that provides a full-width background glow based on the active folder context (White for All, Black for Unsorted, Hex for folders).
- **Styling**: The buttons employ a floating `ICON_WHITE_OUTLINE` style (white fill with solid black drop-shadow) without boxy backgrounds. The sticky toolbar uses a base color of `#cde5fa` but is dynamically overlaid by the folder glow layer.
- **Folder prism**: Colored segment bar (All, Unsorted, 16 colors) in the same row. **Right-click on the prism** opens a context menu that contains options to rename the right-clicked segment (or playlist) and to toggle between populated-only (only segments with ≥1 item, equal width) and all segments display modes.
- State for sort, direction, ratings, pagination, and prism mode lives in `VideosPage`; folder selection in `folderStore`. Sorting and rating filtering are applied in `VideosPage` after folder filtering; pagination and scroll position (reset to top) are reset when any of these change.

---

## 8. Change log

- **VideoSortFilters consolidation**: Calendar (sort by date), ListPlus (added to app), Bar chart (sort by progress), Clock (sort by last viewed), and Eye (watch count) were consolidated into a single **Funnel** icon button; click opens a dropdown with those five sort options (each select or cycle asc/desc). **Drumstick** rating filter was moved into the same funnel dropdown as a horizontal row (1–5). 
- **Action Button Consolidation**: Add Videos, Subscriptions, and Bulk Tag tools were wrapped into a single **Plus** button dropdown within `VideoSortFilters` mirroring the Funnel structure.
- **Pagination Addition**: Simple `ChevronLeft` and `ChevronRight` page navigation buttons and a page number indicator were appended immediately following the Plus dropdown natively inside `VideoSortFilters`, accepting `currentPage` and `totalPages` props.
- **Aesthetic Refinements**: `VideoSortFilters` buttons alongside the Go Back and Close buttons stripped out backdrop boundaries, strictly employing white icons cleanly outlined with a thick black drop-shadow (`ICON_WHITE_OUTLINE`).
- **Full Bar Glow**: Replaced localized title-circle glows with a background layer spanning the entire toolbar width, using dual-blur passes for a premium atmospheric effect (White/Black/Color).
- **Title Text Removal**: The contextual text titles (Playlist names, Folder names) that previously hovered over the glowing background on the sticky toolbars have been completely removed. This cleans up the UI and makes the filter/sort action icons permanently visible on the left side of the bar without requiring mouse hover.
- **Unsorted Display**: Refined display logic so that the "Unsorted" folder state on the Videos page no longer appends a suffix to the playlist name, keeping the title clean over a black background glow.
- **Sticky toolbar backdrop**: The shifting transparency and `backdrop-blur` UI effect on scrolling was flattened into a solid backdrop color matching the native app theme, now overlaid by the dynamic glow layer.
- **Folder prism**: The separate arrow button to the right of the prism was removed. **Right-click** anywhere on the prism opens a context menu. We added the options to rename folders/playlists and toggle between populated-only (only segments with ≥1 item, equal width) and all segments. Tooltip on the prism reflects that a context menu is available.
- **Sticky toolbar setup**: Container uses `overflow-visible` so the funnel and actions dropdowns are not clipped; dropdowns and prisms use `z-20` or higher to sit on top of the glow.
- **Watch Count Sorting** (2026-06-15): Introduced the `watchCount` sort option as a new metric. It sorts videos by their lifetime play count (recorded whenever a video starts playing in the app). Available through the Funnel dropdown with ascending and descending toggle support.
