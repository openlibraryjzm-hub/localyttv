# Group Carousel System (Playlists Page)

The group carousel system lets users organize playlists into **colored-folder carousels** on the Playlists page. Each carousel is bound to one of **16 folder colors** (`FOLDER_COLORS`); at most one group exists per color. Carousels are stored in local state (Zustand + localStorage); no database tables are used. The **PlaylistBar** (sticky toolbar in the page content) provides a **folder prism** to switch between All grid, Unsorted grid, or a single carousel by color. The Playlists **view switcher and actions** (tabs, Info/Folder/Add) live in **TopNavigation** when the Playlists page is active.

**Related:** The **group badge** on the Player Controller’s Top Playlist Menu and **restriction of playlist navigation** (up/down) to the current group are documented in **`group-badge-player-controller.md`**. The **PlaylistBar** (prism, Add, Back/Close) is documented in **`playlist-bar.md`**.

---

## 1. User-facing behavior

### 1.1 Playlists page views (TabBar)

The Playlists page has three view modes:

| View    | Description |
|---------|-------------|
| **ALL** | Shows all playlists in a 2-column grid. No carousels. |
| **UNSORTED** | Shows only playlists that are not in any group carousel. No carousels. |
| **GROUPS** | Shows only group carousels: one horizontal carousel per group, with a “New carousel” button at the bottom. No main grid. |

- **ALL** and **UNSORTED** use the same card size and grid layout (`grid-cols-1 md:grid-cols-2 gap-10`).
- **GROUPS** shows each group in a **bounded carousel box** (see below). Each carousel has its **own display mode** (Large / Small / Bar), set via mode buttons on that carousel's top bar; modes can be mixed. TopNavigation provides a one-shot **"apply to all"** (see 1.2). **Small and Large** carousels use a **white box** (`bg-white`), light gray border (`border-slate-200`), and **light top bar** (`bg-slate-50`, dark text); **Bar** mode keeps the dark box and bar.
  - **Large:** Cards use a larger fixed size (`min-w-[380px]`, `w-[min(520px,calc(50vw-2rem))]`), horizontal scroll via **bottom scrollbar only** (no side arrow buttons). Full PlaylistCard including 4 mini preview thumbnails. Cards inside the carousel have **no border** and **white background** (`PlaylistCard` receives `inCarousel: true`). Top bar: standard padding (`px-4 py-2.5`).
  - **Small:** Thumbnail-sized cards (~3 visible); PlaylistCard gets `size="small"` and `inCarousel: true` (injected by carousel) and uses a **minimal layout**: main-slot thumbnail on top, playlist title below (VideoCard-style). No title bar above the thumbnail; no 4 mini preview strip; no folder/count/set-as-cover overlays on the thumbnail (3-dot menu remains). Card wrapper `min-w-[140px]`, `w-[min(180px,calc(33vw-1rem))]`; gap `gap-4`; scroll via **bottom scrollbar only**; compact top bar (`px-3 py-1`); box `mb-1.5`, white background.
  - **Bar:** Thin bar only: Layers icon, title, inline scroll left/right, rename, delete. No thumbnails; hidden scroll strip keeps scroll position. Box `mb-3`, dark styling, compact bar.

### 1.2 Playlists bar (TopNavigation) and PlaylistBar (page content)

**TopNavigation** (mini header): When the current page is **Playlists**, it shows:

- **Apply to all (GROUPS only):** Three buttons left and above the title: Large, Small, Bar. **One-shot commands** – each click sets every carousel's mode via `playlistGroupStore.setAllGroupCarouselModes(mode)`.
- **Title:** “Playlists”.
- **Tabs:** `TabBar` (ALL | UNSORTED | GROUPS).
- **Actions:** Info (show/hide video titles on cards), Folder (show/hide colored folders), Add (open playlist uploader).
- **Navigation:** Back (when applicable), Close (full screen / close menu).

### 1.3 Carousel Folder View Mode (GROUPS view)

When viewing carousels in the GROUPS view, clicking the folder icon on any playlist card temporarily transforms that carousel. The carousel replaces its normal playlist cards with new "folder cards"—one for each of the selected playlist's populated colored folders. These pseudo-playlist cards behave like normal playlist cards (shuffling, displaying content), but only show videos assigned to their respective folder color. A "Back to [Playlist Name]" card is inserted at the beginning of the carousel to easily exit this mode.

**PlaylistBar** (sticky toolbar in the **page content**, not the header): Rendered at the top of the Playlists page body. It includes VideoSortFilters, Add/Refresh/Bulk tag buttons, the **folder prism**, and Back/Close. The prism has segments for **All**, **Unsorted** (if any playlists are in no group), and **each folder color that has a group carousel**. Clicking a color segment sets the selected folder; when a color is selected, PlaylistsPage shows only that group’s carousel (single large carousel). See **`playlist-bar.md`** for props (`groupColorIds`, `selectedFolder`, `onFolderSelect`) and populated-only vs all-segments prism modes.

### 1.3 Creating and managing carousels

- **Colored folder model:** There are **16 folder colors** (see `src/utils/folderColors.js`: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink). Each **group** has a `folderColorId`; at most **one group per color**. The prism in PlaylistBar shows only colors that have a group (in populated-only mode).
- **New carousel (GROUPS view):** “New carousel” button below the last carousel uses `getNextAvailableColorId()` to pick the first unused color, then creates a group with `addGroup(color.name, nextColorId)`. If all 16 colors are used, an alert is shown and no group is created. Empty carousels still appear as a bounded box with a placeholder (“No playlists in this carousel”).
- **Per-carousel mode:** Each carousel's **top bar** has three mode buttons (Large / Small / Bar). The active mode is highlighted; clicking sets that carousel's mode only (`playlistGroupStore.groupCarouselModes[groupId]`). New groups default to Large.
- **Rename:** In the carousel **top bar**, a pencil icon opens a rename prompt. Only available when the carousel is rendered with `groupId` and `onRename` (i.e. on GROUPS).
- **Delete:** A trash icon in the top bar opens a confirmation: “Delete carousel “[name]”? Playlists will be unassigned from this carousel but not removed from the app.” Confirming removes the group and unassigns all playlists from it; playlists themselves are not deleted.

### 1.4 Assigning playlists to carousels

- **Assign to colored folder (playlist card 3-dot menu):** Opens the **PlaylistGroupColumn** overlay (full-screen, scrollable). The column shows **16 slots in `FOLDER_COLORS` order**. For each color: if a group exists for that color, a **colored group card** is shown (name, thumbnail from first playlist, “In carousel” when the current playlist is in that group); clicking toggles the playlist in/out of that group. If **no group** exists for that color, a **colored placeholder** is shown (“Create [Color] carousel”); clicking creates a new group for that color and adds the current playlist to it. Header text: “Assign to colored folder.”
- **Remove from carousel (playlist card 3-dot menu):** Shown only when the playlist is in at least one carousel. Label is “Remove from carousel” (one) or “Remove from carousels” (multiple). Removes the playlist from every carousel it’s in; playlists are not deleted.

---

## 2. File manifest

| Area | Files |
|------|--------|
| **Components** | `PlaylistBar.jsx` (sticky toolbar + prism), `GroupPlaylistCarousel.jsx`, `PlaylistGroupColumn.jsx` (assign to colored folder), `PlaylistCard.jsx` (menu + remove), `PlaylistsPage.jsx` (views, carousels, column, prism state), `TabBar.jsx` (ALL / UNSORTED / GROUPS), `TopNavigation.jsx` (Playlists bar when `currentPage === 'playlists'`) |
| **State** | `playlistGroupStore.js` (Zustand, persisted: groups with `folderColorId`, groupCarouselModes, activeGroupId; getGroupByColorId, getNextAvailableColorId, addGroup(name, folderColorId)), `tabStore.js` (view mode), `layoutStore.js` (playlistsPageShowTitles, showPlaylistUploader) |
| **Utils** | `folderColors.js` (FOLDER_COLORS, getFolderColorById) |
| **Store (view mode)** | `tabStore.js` (activeTabId: `'all' \| 'unsorted' \| 'groups'`) |

---

## 3. Data model and state

### 3.1 playlistGroupStore

- **Storage:** Zustand with `persist` middleware; key `playlist-group-storage` in localStorage.
- **State:** `groups: Array<{ id: string, name: string, playlistIds: number[], folderColorId: string | null }>` (each group is bound to one of the 16 folder colors), `groupCarouselModes: { [groupId]: 'large' | 'small' | 'bar' }` (defaults to `'large'` when missing), `activeGroupId: string | null`.
- **Actions:**
  - `getGroupByColorId(colorId)` – returns the group that has `folderColorId === colorId`, or `null`.
  - `addGroup(name, folderColorId)` – creates a new group for the given folder color; returns the new group `id`. Name defaults to the color’s display name from `FOLDER_COLORS` if not provided.
  - `getNextAvailableColorId()` – returns the first `FOLDER_COLORS` id that does not yet have a group (for “New carousel”); returns `null` if all 16 are used.
  - `removeGroup(groupId)` – removes the group (playlists are unassigned, not deleted); clears `activeGroupId` if it was this group.
  - `setGroupCarouselMode(groupId, mode)` – sets this group’s carousel display mode (`'large' | 'small' | 'bar'`). Used by each carousel’s top-bar mode buttons.
  - `setAllGroupCarouselModes(mode)` – one-shot: sets every group’s carousel mode to `mode`. Used by TopNavigation “apply to all” buttons.
  - `addPlaylistToGroup(groupId, playlistId)` – adds a playlist to a group (idempotent).
  - `removePlaylistFromGroup(groupId, playlistId)` – removes a playlist from a group.
  - `isPlaylistInGroup(playlistId, groupId)` – returns whether the playlist is in that group.
  - `getGroupIdsForPlaylist(playlistId)` – returns array of group IDs that contain the playlist.
  - `renameGroup(groupId, name)` – renames the group.
  - `setActiveGroupId(id)` – sets or clears the "entered from" group (used by Player Controller badge and playlist navigation range). Set when user opens a playlist from a carousel card; cleared when opening from the main grid.
- **Migration:** Legacy single-list format (`groupPlaylistIds`) is migrated to one group named "Featured playlists" with a default color. Version 2 adds `activeGroupId` (default `null`). Version 3 adds `groupCarouselModes` (default `{}`). Version 4 adds `folderColorId` to each group (existing groups get color by index in `FOLDER_COLORS`).

### 3.2 tabStore (view mode)

- **Valid view IDs:** `'all' | 'unsorted' | 'groups'`.
- **activeTabId** is persisted; only these three values are accepted (others normalize to `'all'`).

### 3.3 layoutStore (Playlists header actions)

- **playlistsPageShowTitles** (boolean): Toggles “show video titles on all playlist cards.” Synced from localStorage on PlaylistsPage mount; persisted to localStorage when changed. Toggled from TopNavigation when on Playlists page.
- **setPlaylistsPageShowTitles(v?)**: Sets or toggles the above.
- **showPlaylistUploader** (boolean): When set to `true`, PlaylistsPage opens the playlist uploader and then clears this flag. Used by the “Add” button in TopNavigation when on Playlists page.
- **setShowPlaylistUploader(v)**: Sets the flag (e.g. `true` to open uploader).

---

## 4. Logic and UI flow

### 4.1 TopNavigation (Playlists bar)

- When `currentPage === 'playlists'` and `activeTabId === 'groups'` (from `useTabStore()`), the left side shows three “apply to all” buttons (Large / Small / Bar) above the title; each calls `setAllGroupCarouselModes(mode)` so every carousel’s stored mode is updated in one shot. No persistent override.
- When `currentPage === 'playlists'`, the right side of the header shows: TabBar, Info button (toggles `playlistsPageShowTitles`), Folder button (toggles `showColoredFolders` from folderStore), Add button (calls `setShowPlaylistUploader(true)`), then Back (if history/preview) and Close. The left side shows the title “Playlists.”

### 4.2 PlaylistsPage

- **PlaylistBar:** Renders `PlaylistBar` at the top of the content with `groupColorIds={playlistGroups.map(g => g.folderColorId).filter(Boolean)}`, `allPlaylistCount`, `unsortedCount`, `selectedFolder={selectedPrismFolder}`, `onFolderSelect={setSelectedPrismFolder}`, `onAddClick` (opens uploader). When user selects a prism segment, `selectedPrismFolder` is set to `null` (All), `'unsorted'`, or a color id; this drives whether the page shows the full grid, unsorted grid, or a single carousel (see below).
- **GROUPS view:** Renders one `GroupPlaylistCarousel` per group (including empty ones). Each carousel receives `title={group.name}`, `groupId={group.id}`, `onRename={renameGroup}`, `onDelete={removeGroup}`. When **a single folder is selected via the prism** (`selectedPrismFolder` is a color id), the page shows only the carousel for that color: the group is resolved with `getGroupByColorId(selectedPrismFolder)` and a single carousel is rendered (large carousel layout). In this dedicated single-carousel view, the entire page is locked into horizontal scrolling (mouse wheel vertical scrolling translates directly to horizontal carousel scrolling), vertical scrolling of the page is disabled, the scroll-to-top button is hidden, the carousel is bumped up closely to the toolbar (`-mt-[14px]`), the background box and top bar of the carousel are removed for a cleaner immersive view, and the horizontal scrollbar is hidden completely using native CSS utilities. Otherwise (All or Unsorted selected), no carousels are shown in the main area—only the grid. If the local state `folderCarouselMode[groupId]` is set to a `playlistId`, the carousel temporarily renders pseudo-PlaylistCards for each of that playlist's colored folders instead of its regular contents, passing an `isFolderCard` flag to them.
- **ALL / UNSORTED view:** Renders the main grid. Filter:
  - ALL: all playlists.
  - UNSORTED: `getGroupIdsForPlaylist(playlist.id).length === 0`.
  Each `PlaylistCard` receives an `onFolderModeToggle` callback that triggers `openFolderListIds`, opening the `PlaylistFolderColumn` overlay.
- **Assign column:** When `assignToGroupPlaylistId` is set, renders `PlaylistGroupColumn` with that playlist, `playlists`, `playlistThumbnails`, and `onClose`. Column uses the store (`getGroupByColorId`, `addGroup(color.name, color.id)`, `addPlaylistToGroup`, `removePlaylistFromGroup`, `isPlaylistInGroup`) and shows 16 slots in `FOLDER_COLORS` order: existing groups as colored cards, or placeholders that create a new group for that color on click.
- **Uploader:** When `showPlaylistUploader` from layoutStore is true, a `useEffect` opens the uploader (sets local `showUploader(true)`) and then calls `setShowPlaylistUploader(false)`.

### 4.3 GroupPlaylistCarousel

- **Structure:** Each carousel is a single **bounded box**. For **Small and Large** mode: white background (`bg-white`), light border (`border-slate-200`), rounded corners (`rounded-2xl`), shadow. For **Bar** mode: dark box (`bg-slate-800/40`, `border-white/10`, `rounded-xl`). No inner component is used (structure is inlined) so re-renders do not remount the scroll container and scroll position is preserved.
- **Mode:** Effective mode is read from `playlistGroupStore.groupCarouselModes[groupId]` (default `'large'`). No global override; TopNavigation “apply to all” updates every group’s stored mode.
- **Top bar:** A fixed top bar inside the box. For **Small/Large**: light bar (`bg-slate-50`, `border-b border-slate-200`), dark text (`text-slate-800`), sky icon; mode/rename/delete buttons use slate/sky hover. For **Bar**: dark bar (`bg-slate-800/60`, `border-white/10`) with inline scroll left/right. When `groupId` is set, **three mode buttons** (Large / Small / Bar) call `setGroupCarouselMode(groupId, mode)`; when `onRename`/`onDelete` are provided, rename (pencil) and delete (trash). In small/bar mode the bar is compact (`px-3 py-1` or `py-1.5`, smaller icons).
- **Empty group:** Same box and top bar; body shows a placeholder: “No playlists in this carousel” (omitted in bar mode). Empty state area uses `bg-slate-50` for Small/Large.
- **Bar mode (1+ items):** Only the top bar is visible; a hidden scroll strip keeps scroll position so the inline left/right buttons advance by one “slot” per click.
- **Large / Small mode (1+ items):** Horizontal scroll row:
  - Scrollable flex row with mode-dependent gap (`gap-10` large, `gap-4` small) and padding (`pt-3 pb-2` large, `pt-1 pb-1` small). Mouse wheel scrolling is converted to horizontal scrolling on the carousel via an attached event listener, which can optionally act as a global scroll lock on the entire window (for instance, when in single colored-folder mode). Left/right arrow buttons on the sides are hidden.
  - Card wrapper: large `w-[min(520px,calc(50vw-2rem))] min-w-[380px]`; small `w-[min(180px,calc(33vw-1rem))] min-w-[140px]`. Children receive injected `size` and **`inCarousel: true`** via `React.cloneElement`. PlaylistCard with `inCarousel` has no card or thumbnail border and uses `bg-white` to match the carousel box.
  - No custom drag-to-scroll or scroll-snap; native horizontal scroll only. Stable keys on mapped children for list reconciliation.

### 4.4 PlaylistCard 3-dot menu

- **Assign to group** – calls `onAssignToGroupClick()`, which opens `PlaylistGroupColumn`.
- **Remove from carousel(s)** – only if `getGroupIdsForPlaylist(playlist.id).length > 0`; calls `removePlaylistFromGroup(gid, playlist.id)` for each such group.

---

## 5. Scrollbar styling

App-wide scrollbar styling is defined in `App.css` (universal `*::-webkit-scrollbar*` rules): 14px height/width, rectangular (no rounded ends), slate track/thumb with diagonal stripe pattern. **WebView (e.g. Tauri/WebView2) may not honor custom scrollbar appearance** (rounded or native look can still appear). Carousel horizontal scroll uses the same scrollbar; scrolling is only via the bottom scrollbar (no side arrow buttons).

## 6. Cross-references

- **PlaylistBar (sticky toolbar + prism):** `playlist-bar.md` (props, prism segments by `groupColorIds`, relation to PlaylistsPage).
- **Group badge and playlist navigation (Player Controller):** `group-badge-player-controller.md` (single badge, “entered from” group, nav restricted to group).
- **Playlist cards:** `playlist-cards.md` (card UI and folder integration).
- **Playlists page layout:** `ui-pages.md`, `ui.md`.
- **TopNavigation / Mini Header:** `page-banner.md` (Mini Header section), `ui-layout.md`.
- **Folder colors:** `src/utils/folderColors.js`, `playlist&tab.md`.
- **State:** `state-management.md` (playlistGroupStore, tabStore, layoutStore).
- **Legacy tabs:** The previous tab/preset system has been retired in favor of ALL / UNSORTED / GROUPS and group carousels; see `playlist&tab.md` for historical context only.
