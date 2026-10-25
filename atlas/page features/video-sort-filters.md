# VideoSortFilters & Videos Page Sticky Toolbar

This document describes the **Videos page sticky toolbar**: the icon-based sort/rating bar (**VideoSortFilters**) and the **colored folder prism** that share one row. Together they provide sorting (default, date, added to app, progress, last viewed), rating filtering (drumstick 1–5), and folder filtering (All, Unsorted, 16 colors) with an optional “populated-only” prism mode.

---

## 1. Overview

**Location**: The sticky toolbar sits at the top of the Videos page content area (`VideosPage.jsx`). The bar is permanently solid black (`#000000`) and sticks cleanly to the top of the viewport when scrolling down.

**Layout (left to right)**:

1. **Sort & rating filters** – `VideoSortFilters.jsx`: toolbar buttons (Home, Funnel). Funnel dropdown contains sort options and heart rating filter.
2. **Action buttons** – Add (uploader), Refresh (subscriptions; right-click = manage modal), Bulk tag (right-click = Auto-Tag). Same row, right of the filter; driven by `layoutStore`; VideosPage opens modals/refresh and clears one-shot flags.
3. **Pagination Controls** – Located next to the action buttons when multiple pages exist (chevrons and current page indicator).
4. **Folder prism** – Inline in `VideosPage.jsx`: a colored segment bar (All, Unsorted, 16 folder colors) that fills the remaining width. **Right-click** anywhere on the prism opens a context menu to toggle between populated-only and all-segments mode, as well as an option to rename the specific colored folder (or the main playlist if clicking All/Unsorted).
5. **Right side** – Back (when history or preview) and Close (fullscreen). **TopNavigation** is hidden on the Videos page, allowing the toolbar to sit cleanly at the top.

**State ownership**: Sort mode, sort direction, selected ratings, and prism mode are local state in `VideosPage.jsx`. Folder selection is in `folderStore`; folder counts and segment data are derived in `VideosPage` from `videoFolderAssignments` and `activePlaylistItems`.

---

## 2. VideoSortFilters Component

**File**: `src/components/VideoSortFilters.jsx`

Icon-based sort and rating filter bar. **Home** and **Funnel** use Lucide icons; the rating filter in the dropdown uses Heart icons. Styling switches between **light** (All selected: white/light bar) and **dark** (Unsorted or a folder selected: colored bar) via the `isLight` prop.

### 2.1 The two toolbar buttons + dropdown contents

| Control   | Icon        | Behavior |
|----------|-------------|----------|
| **Home** | `Home`      | **Default order.** Sets sort to `shuffle`. No direction. Restores the default video order (shuffle-state driven). |
| **Funnel** | `Filter`  | **Sort & rating dropdown.** Click opens a dropdown with: (1) **Sort by date** (Calendar), **Added to app** (ListPlus), **Sort by progress** (BarChart), **Sort by last viewed** (Clock), and **Watch Count** (Eye)—select an option or click again to cycle asc/desc; (2) **Rating filter**—a horizontal row of five Heart icons (1–5). Clicking Heart N filters the grid for videos with exact rating N and highlights hearts 1–N; clicking N again or "Clear" resets the filter. The funnel button appears active when any of the sorts is active or a rating is selected. Dropdown closes on outside click. |

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
| `isLight`          | `boolean`  | Optional, default `false`. Inherited theme flag. |
| `className`        | `string`   | Optional. Applied to the root flex container. |

### 2.3 Styling and UX Details

- **Solid Black Backdrop**: The toolbar sits on a permanent solid black (`#000000`) background without any atmospheric or bar-spanning glow, unifying with the dark mode aesthetic.
- **Buttons**: Actions use the `ICON_WHITE_OUTLINE` style (pure white icon with multi-directional black shadow outline) for crisp visibility directly on top of the black surface.
- **Funnel Dropdown**: Opens below the funnel button in a dark floating popover (`bg-black/95 border border-white/20 text-white shadow-2xl rounded-lg`). Contains:
  1. Five sort options (Date, Added to App, Progress, Last viewed, Watch Count), each with icon + label; active row shows direction arrow (↑ asc, ↓ desc); clicking a row selects that sort (desc) or cycles direction if already selected.
  2. **Rating filter** section with a label and horizontal row of 0 (unrated) + 1–5 heart buttons; selected state highlights hearts with interactive preview. Dropdown closes on outside mousedown.

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

- **All** (`selectedFolder === null`): White background, black text; shows total count (videos + assigned orbs + assigned banners). Selected state uses `after:ring-2 after:ring-inset after:ring-black/20`.
- **Unsorted** (`selectedFolder === 'unsorted'`): Black background, white text; shows count of videos with no folder assignment. **Permanently outlined with an inset white ring** (`after:ring-1 after:ring-inset after:ring-white/80` when unselected, `after:ring-2 after:ring-inset after:ring-white` when selected) so it never merges into the black background.
- **Color segments**: Background from `FOLDER_COLORS[].hex`; text white with drop-shadow; shows count when visible (in “all segments” mode, count only shown when &gt; 0). Sit at `opacity-90` (hovering to `opacity-100`) to preserve rich color saturation on black.
- **Selected segment**: Emphasized with a bold 2px solid white inset ring (`after:ring-2 after:ring-inset after:ring-white`) for colored and unsorted segments. All uses `after:ring-black/20`. No bar-spanning glow is rendered.

### 3.3 Data and State (VideosPage)

- **Folder selection**: `selectedFolder`, `setSelectedFolder` from `folderStore` (null = All, `'unsorted'`, or a color id).
- **Counts**:  
  - `folderCounts`: per-color counts from `videoFolderAssignments`.  
  - `allCount`: total items (playlist items + orbs + banners for current playlist).  
  - `unsortedCount`: videos in current playlist with no folder assignment.
- **Populated-only segments**: `prismPopulatedSegments` is a `useMemo`: All + Unsorted (if unsortedCount ≥ 1) + each color with count ≥ 1, in order. Used when `prismOnlyPopulated` is true.
- **Prism mode**: `prismOnlyPopulated` (useState, default true); toggled via the **right-click context menu** on the prism.

- **Pagination Integration**: `usePaginationStore` tracks `currentPage`, `totalPages`, and `itemsPerPage` (50). Whenever folder, sort, or drumstick rating filters change, `resetPagination()` resets `currentPage` to 1 while `setTotalPages` reactively recalculates `totalPages` for the new `regularVideos` array. Out-of-bounds `currentPage` values are automatically clamped to `totalPages`.

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
  - **Funnel** (dropdown): sort options (Date, Added to App, Progress, Last viewed, Watch Count; select or cycle asc/desc) and horizontal **Rating filter** row (0 unrated + 1–5 hearts).
  - **Actions**: Add (uploader), Refresh (subscriptions), and Bulk tag functionalities.
  - **Pagination**: Left and Right chevron buttons flanking the current page number.
- **Styling**: Permanently solid black (`#000000`) background across both stuck and unstuck states with no atmospheric glow. The buttons employ floating `ICON_WHITE_OUTLINE` style (white fill with solid black drop-shadow) without boxy backgrounds. Dropdowns use dark popover styling (`bg-black/95 border border-white/20 text-white`).
- **Folder prism**: Colored segment bar (All, Unsorted, 16 colors) in the same row. Unsorted has a permanent inset white outline to prevent merging into the black backdrop. Colored segments maintain high color vibrancy (`opacity-90` unselected, `opacity-100` with 2px white outline when selected). **Right-click on the prism** opens a context menu to rename the segment and toggle between populated-only and all-segments display modes.
- **State**: Sort, direction, ratings, pagination, and prism mode live in `VideosPage`; folder selection in `folderStore`. Sorting and rating filtering are applied in `VideosPage` after folder filtering; pagination and scroll position (reset to top) reset when any of these change.
