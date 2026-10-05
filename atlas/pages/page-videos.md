# Videos Page

The Videos Page displays the contents of a specific playlist, folder, or view within a two-row horizontal layout, and serves as the core content management area.

**Related Documentation:**
- **Navigation Flows**: See `navigation-routing.md` for page routing details.
- **Sorting & Folders**: See `video-sort-filters.md` for details on the sticky toolbar prism and sorting logic.
- **Banners**: See `page-banner.md` for upper screen custom artwork formatting.
- **Card UI**: See `card-video.md` and `card-tweet.md`.

---

## 1. Visual Structure & Layout

- **Horizontal Scrolling Layout**:
  - Contains two horizontal rows of video cards (`320px` width each).
  - Even indices load in the top row, odd indices in the bottom row.
  - Mouse wheel automatically converts vertical scrolling into horizontal scrolling within the container, while global page vertical scrolling is locked.
  - Pushed tight into the bottom of the sticky toolbar via negative margins.

- **Background Styling**:
  - Uses the **Atmospheric Blurred App Banner Backdrop System** (`atlas/design/blurred-banner-backdrop-system.md`).
  - Anchored on a solid `bg-slate-950` container with an absolute positioned blurred banner overlay (`filter: blur(36px)`, `transform: scale(1.25)`, `opacity: 0.85`), dynamically synced to the active App Banner / preset image in real-time.
  - The sticky toolbar and grid content float crisply above this backdrop layer (`z-10 relative`) with white text and black stroke/shadow outlines for 100% legibility.

- **Empty States**:
  - If a folder filter is applied but contains no videos, the grid remains an empty colored blur box.
  - Explicit UI messages for "No playlist selected" and "No videos in this playlist".

## 2. Component Hierarchies

### The Sticky Toolbar
Sits directly below the Page Banner and anchors strictly to the top of the viewport when scrolling down.
- **Compact Layout**: Single-row configuration matching the Playlists page.
- **Left Side**: `VideoSortFilters` containing Home (default shuffle) and Funnel (dropdown properties: Sort by date, progress, last viewed, and drumstick ratings).
- **Middle Group**: Add (open uploader), Refresh (subscriptions data sync), and Bulk tag toggles.
- **Folder Prism**: Right side of the toolbar populated with the 16 folder colors showing localized video counts. Unsorted (Black) and All (White) precede them. See `video-sort-filters.md` for detail.
- **Context Buttons**: Back (returns from history/preview entry), Close (swaps out of fullscreen).

### The Sticky Video Carousel
The "Stickied" video area pins critical or user-promoted videos identically to the frontend of the page regardless of subsequent grid sorts or filters.
- **Scoped**: Sticky states act concurrently on the underlying folder contexts. A sticky video in "Red" only appears if the "Red" folder or "All" view is active. Unsorted context entirely excludes the carousel.
- **Formatting**:
  - Displays as a standard grid if count ≤ 3.
  - Folds into horizontal scrollable track automatically via `StickyVideoCarousel` if count ≥ 4.
- **Overrides**: Stickied videos completely ignore watch progress filters (e.g. "Hide Watched"), prioritizing display presence first.

### Pagination
Integrated into both the top sticky bar (`VideoSortFilters`) and the bottom grid footer:
- **Chunk Size**: Loads videos in 50-item chunks (`itemsPerPage: 50`) driven by `usePaginationStore`.
- **Reactive Page Calculation**: Total pages (`totalPages`) are calculated reactively from `regularVideos` (`Math.max(1, Math.ceil(regularVideos.length / 50))`). Re-sorting, applying rating filters, or switching folder context automatically recalculates `totalPages` for the new result set.
- **Out-of-Bounds Clamping**: If `currentPage` exceeds `totalPages` after filtering (e.g. going from a 200-video view to a 10-video folder), `currentPage` is automatically clamped to `totalPages`.
- **Auto-Scroll**: Switching pages or changing filters automatically scrolls the main container back to the top (`scrollToTop()`).
- **Controls & Gestures**:
  - **Top Bar**: Chevron controls (`< [Page Number] >`) natively embedded in `VideoSortFilters.jsx`.
  - **Bottom Footer Bar**: Chevron buttons + numbered page buttons. Supports single-click (step 1 page), double-click (jump quarter), and long-press (~500ms charge animation to jump to first/last page).

## 3. Data Flow & Logic

### Folder & Filter Processing
- **Folder Filtering**: Driven by `FolderSelector` / `FolderPrism` clicks. `setSelectedFolder(folderColor)` triggers `filterVideos()`. Clearing `displayedVideos` at the start of fetching ensures stale video arrays do not linger during async SQLite calls.
- **Combined Filtering & Sorting**: Folder filtering, drumstick rating filters (1–5), progress filters, and sort options (chronological, added to app, progress, last viewed, watch count, shuffle) compose deterministically into `regularVideos`.
- **Pagination State Integration**: Filter or folder changes invoke `resetPagination()`, resetting `currentPage` to 1 while preserving computed `totalPages` so pagination remains functional across all filter combinations.

### Bulk Tag Mode
- Enabling updates variables forcing the `BulkTagColorGrid` overlay below every card on the screen.
- Functions explicitly without "Save batch" architecture. If a user presses the Red square below a video, `assignVideoToFolder()` executes instantly to SQLite.

### Progress Polling
- Component initiates 5-second interval cycles of `getAllVideoProgress()` to catch cross-process watch progression.
- `videoProgress` map dictates card status indicators ("Watched" green ticks) and influences "Sort by progress" calculations.
