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
  - The scrollable grid uses a **heavily blurred** version of the global `fullscreen app banner` image.
  - Note: The sticky toolbar and top navigation components sit above this blur.

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
Located beneath the grid output (though effectively right-bound due to horizontal scroll mapping):
- Loads pages in 50-video chunks for maximum browser efficiency.
- **Auto-Scroll**: Switching pages automatically scrolls the main content window back to the top, ensuring the new page starts at the first video.
- Prev/Next arrows increment by 1 page (single click), jump by quarter (double click), or charge up to jump to first/last pages directly (long-press ~500ms).

## 3. Data Flow & Logic

### Folder Filtering 
- Driven by `FolderSelector` clicking. 
- Calling `setSelectedFolder(folderColor)` immediately trips `filterVideos()`.
- **Auto-Scroll**: Applying a new folder filter or resetting to "All" automatically scrolls the view back to the top.
- Unsorted dynamically screens `videoFolderAssignments` returning items absent from any other folder bucket. 
- View updates are instant — if assignments are bulk-changed, the new view recalculates reactively without manual refreshes.

### Bulk Tag Mode
- Enabling updates variables forcing the `BulkTagColorGrid` overlay below every card on the screen.
- Functions explicitly without "Save batch" architecture. If a user presses the Red square below a video, `assignVideoToFolder()` executes instantly to SQLite.

### Progress Polling
- Component initiates 5-second interval cycles of `getAllVideoProgress()` to catch cross-process watch progression.
- `videoProgress` map dictates card status indicators ("Watched" green ticks) and influences "Sort by progress" calculations.
