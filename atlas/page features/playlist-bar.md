# PlaylistBar – Playlists Page Sticky Toolbar

This document describes the **Playlists page sticky toolbar** (`PlaylistBar.jsx`): the bar that sits at the top of the Playlists page content and combines **PlaylistSortFilters**, **Add/Refresh/Bulk tag** buttons, the **folder prism** for colored-folder (group carousel) selection, and **Back/Close** on the right. The prism drives which view is shown: All playlists grid, Unsorted grid, or a single group carousel by folder color.

---

## 1. Overview

**Location**: Rendered inside `PlaylistsPage.jsx` at the top of the page content. The bar is **sticky** (`sticky top-0`); when the user scrolls down, it sticks cleanly to the top of the viewport.

**Layout (left to right)**:

1. **Solid Black Toolbar Backdrop** – The toolbar background is permanently solid black (`#000000`), unifying with the pure black dark mode aesthetic without any bar-spanning glow.
2. **Action Buttons Container** – The left side of the bar permanently displays the action buttons directly on the black bar.
3. **PlaylistSortFilters** – The first button in the action buttons group. The Home command (default / shuffle order) was moved inside the Funnel dropdown as the first sort. The sort and filter states (`playlistSortBy`, `showHiddenPlaylists`, `playlistContentFilter`) are managed in `PlaylistsPage.jsx` and passed down. Playlists can be sorted by item count, date created, or alphabetically.
4. **Action buttons (Plus & Tag)** – Located next to the Funnel. A Plus button opens the playlist uploader; a Tag button serves as a UI placeholder for future bulk tagging capability on playlists.
5. **Pagination Controls** – Located next to the Action buttons if multiple pages exist. Left/Right chevrons to navigate, with current page number between them.
6. **Folder prism** – Fills the remaining width. Segments: **All** (white), **Unsorted** (black, if any playlists are unassigned), and **one segment per folder color that has a group carousel**. Clicking a segment sets the selected folder; PlaylistsPage shows either the full grid (All/Unsorted) or the single carousel for that color. Includes context menu (right-click) to toggle populated-only mode.
7. **Right side** – Back (when navigation history or playlist preview exists), Close (fullscreen / close menu via `layoutStore.setViewMode('full')`).

**Data flow**: PlaylistsPage passes `groupColorIds` (array of folder color ids that have a group), `allPlaylistCount`, `unsortedCount`, `selectedFolder`, and `onFolderSelect`. The prism shows only colors that have a group in populated-only mode; right-click toggles to all 16 segments.

---

## 2. Props

| Prop | Type | Description |
|------|------|-------------|
| `onAddClick` | `function` | Called when Add is clicked (e.g. open playlist uploader). |
| `groupColorIds` | `string[]` | Array of `FOLDER_COLORS` ids that have a group carousel. Drives which prism segments appear in populated-only mode. |
| `allPlaylistCount` | `number` | Total playlist count; shown on All segment. |
| `unsortedCount` | `number` | Count of playlists not in any group; Unsorted segment only shown if ≥ 1. |
| `selectedFolder` | `string \| null` | Current selection: `null` = All, `'unsorted'` = Unsorted, or a color id (e.g. `'red'`, `'sky'`). |
| `onFolderSelect` | `function` | `(id: string \| null) => void`. Called when a prism segment is clicked. |
| Sort & Filter Props | various | `sortBy`, `sortDirection`, `showHidden`, `contentFilter` and their setters are passed to `PlaylistSortFilters` and managed by `PlaylistsPage`. |

---

## 3. Folder Prism Behavior

### 3.1 Segment source

- **All** – Always first; `id: null`, white background, shows `allPlaylistCount`.
- **Unsorted** – Only if `unsortedCount >= 1`; black segment, shows count of playlists in no group.
- **Colors** – From `FOLDER_COLORS` (`src/utils/folderColors.js`). Each color segment shows the actual number of playlists assigned to that group carousel on the current page (`group.playlistIds.length`).
  - In **populated-only** mode (default), only colors with `count >= 1` get a segment.
  - In **all-segments** mode, all 16 colors are shown, displaying `count` if `count > 0` (and empty/hidden count badge when `count === 0`).

### 3.2 Right-click Context Menu & Populated-Only Toggle

- **Right-click / Long-press on the prism**: Opens the `FolderPrismContextMenu` portal at the pointer coordinates.
- **Toggle Populated-Only Filter**: The context menu provides a toggle to change the `prismOnlyPopulated` state:
  - **Populated-only (default)**: Filters the prism to only show All + Unsorted (if any) + segments for colors that have at least one playlist.
  - **All segments**: Shows All + Unsorted + all 16 colors in standard `FOLDER_COLORS` order.
- **Edit / Rename**:
  - Right-clicking a colored folder segment displays an **Edit / Rename** option in the context menu. Clicking this opens `EditPlaylistModal` to rename the group.
  - If a group doesn't exist yet for that color on the current page, editing it will create/register a new group with the user's custom name.
  - **All** and **Unsorted** segments do not support editing/renaming; the rename option is hidden for them.

### 3.3 Selection and styling

- **Unselected segment vibrancy**: Colored segments sit at `opacity-90` (hovering to `opacity-100`) on the solid black toolbar to maintain rich color saturation without appearing washed out or dim.
- **Black colored folder (Unsorted)**: Never merges into the black background; permanently outlined with a crisp inset white ring (`after:ring-1 after:ring-inset after:ring-white/80` when unselected, `after:ring-2 after:ring-inset after:ring-white` when selected).
- **Selected segment**: Highlighted with an inset ring (`after:ring-2 after:ring-inset`). Standard colors and Unsorted use a bold pure white outline (`after:ring-white`); All uses `after:ring-black/20`.
- **Segment background**: The background matches the folder color definition (All = white, Unsorted = black, colors = respective hex values from `FOLDER_COLORS`). Text/counts on colored segments feature a subtle drop shadow (`drop-shadow-md`) and white contrast for high legibility.

---

## 4. Sticky Behavior and Styling

- A **sentinel** div (1px, invisible) above the bar is observed with `IntersectionObserver`. When it leaves the viewport upward (`intersectionRatio < 1` and `boundingClientRect.top < 0`), the bar is considered **stuck**.
- **Backdrop**: Permanently solid black (`#000000`) in both stuck and unstuck states to seamlessly blend with the dark mode aesthetic.
- **Not stuck**: Compact vertical padding.
- **Stuck**: Slightly taller row (`h-[52px]`) with smooth transition.
- **No Bar Glow**: The toolbar does not emit any background glow; active segment selection is indicated cleanly by the segment's inset white outline ring.

---

## 5. Dependencies

- **PlaylistSortFilters** – Playlists-page specific component containing:
  - **Sort By**: Default/Shuffle (first option), Item count, Date created, Alphabetical, Scramble playlists.
  - **Visibility Filters**: Toggle hidden playlists (stored in `configStore` via `hiddenPlaylists` array; hiding/unhiding a playlist specifically is done from the `PlaylistCard` 3-dot menu).
  - **Content Filters**: All Playlists, Populated Only (item count > 0), Empty Only (item count === 0).
- **FOLDER_COLORS** – `src/utils/folderColors.js` (16 colors: red, orange, amber, … pink). Same as Videos page prism and PlaylistGroupColumn.
- **Stores**: `useNavigationStore` (history, goBack, setCurrentPage), `useLayoutStore` (setViewMode), `usePlaylistStore` (previewPlaylistId, clearPreview) for Back/Close behavior.

---

## 6. Relation to PlaylistsPage and Group Carousels

- **PlaylistsPage** computes `groupColorIds = playlistGroups.map(g => g.folderColorId).filter(Boolean)` from `playlistGroupStore` and passes it to PlaylistBar.
- Selecting a **color segment** sets `selectedPrismFolder` to that color id. PlaylistsPage then filters and displays all playlists assigned to that group in the standard vertical-scrolling grid using `LongPlaylistCard`s.
- **All** and **Unsorted** show all playlists, or only playlists in no group, in the same vertical grid layout.
- Creating a new carousel (e.g. “New carousel” button or assigning a playlist to a colored placeholder in **PlaylistGroupColumn**) adds a group with a `folderColorId`; that color then appears in the prism (in populated-only mode) and can be selected to view that carousel.

---

## 7. File Reference

| Item | Location |
|------|----------|
| Component | `src/components/PlaylistBar.jsx` |
| Prism colors | `src/utils/folderColors.js` |
| Group store | `src/store/playlistGroupStore.js` |
| Parent | `src/components/PlaylistsPage.jsx` |

---

## 8. Cross-references

- **Group carousel system**: `group-carousel.md` (colored folders, store, PlaylistGroupColumn, carousel by color).
- **Videos page toolbar**: `video-sort-filters.md` (VideoSortFilters and folder prism pattern).
- **Playlist Sorting & Filtering**: The filters applied from `PlaylistSortFilters` dynamically modify the active view (All/Unsorted) locally in `PlaylistsPage` before rendering `PlaylistCard`s. Hidden logic ignores carousels completely to avoid disruption.
- **Folder colors**: `playlist&tab.md`, `folderColors.js`.
- **State**: `state-management.md` (playlistGroupStore, navigationStore, layoutStore, playlistStore).
