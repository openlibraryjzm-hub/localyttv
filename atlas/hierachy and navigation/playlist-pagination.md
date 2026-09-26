# Playlist Pagination System

This document outlines the dual pagination systems implemented on the **Playlists Page**, providing a scalable way to navigate large libraries of playlists and group carousels without overwhelming the user interface.

There are two separate pagination mechanisms on the Playlists Page:
1. **List Pagination** (for "All" and "Unsorted" views)
2. **Folder Prism Pagination** (for colored folder carousel pages)

## 1. List Pagination (All / Unsorted)

When viewing the "All" (White folder) or "Unsorted" (Black folder) context in the `PlaylistBar`, the page displays a massive grid of individual `PlaylistCard` components.

> [!IMPORTANT]
> **Page Isolation**: As of the Explorer Hub update, these views are strictly filtered by the active Hub Page. Content belonging to Page 2 will not appear in the Page 1 grid. See `explorer-hub-isolation.md` for details.

To keep performance high and avoid infinite vertical scrolling fatigue, these views are paginated:
- **Items Per Page**: Hardcoded to 50 playlists per page.
- **Controls Location**: The pagination controls appear at the very bottom of the grid list.
- **UI Elements**: 
  - Left `<` (Previous) button
  - Numbered page buttons (showing a sliding window of up to 5 accessible pages at a time)
  - Right `>` (Next) button
- **Behavior**: Clicking any pagination control automatically smoothly scrolls the container back to the top of the grid (`scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })`). 
- **State**: The current page is managed using `useNavigationStore().currentPage`. (Note: this is aliased to `setCurrentNavPage` in `PlaylistsPage.jsx` when bringing it into scope).

## 2. Folder Prism Pagination (Colored Folders)

When viewing a standard colored folder, the user interacts with 16 distinct colored folder slots. To allow users to create more than one group/carousel for a specific color (or just have sets of 16 different colored folders), we implemented **Folder Prism Pagination**.

Instead of creating a vertical list of carousels, each "page" acts as a completely isolated layer of 16 colors. 

### Structure
- **Scope**: Only applies when a colored folder is selected (excluding "All" and "Unsorted").
- **Pages Definition**: A "Page" corresponds directly to the `.page` property on a group in the `playlistGroupStore`. By default, older groups without a page property fall back to `page: 1`.
- **View Limitation**: When viewing Page N, the user only sees carousels belonging to groups assigned to Page N.

### UI & Controls (`PlaylistBar.jsx`)
- **Location**: The pagination controls are displayed directly within the `PlaylistBar`, replacing the traditional 16-color prism UI when navigating folder pages.
- **Appearance**: Styled identically to the `VideoSortFilters` pagination (White icons/text with dark outlines, `< [Page Number] >`).
- **Features**:
  - **Previous/Next Arrows**: Navigate between existing pages `1` through `totalPages`.
  - **Create New Page (Double Click)**: Double-clicking the active page number in the center triggers the `onAddPage` event, incrementing the page beyond the current `totalPages` boundary, instantly unlocking a fresh set of 16 empty colored folders for assignment.
  - **Always Display**: Unlike some app filters that enforce a "populated only" rule, folder pages *always* display their full range when assigning or viewing, even if all 16 slots on that page are empty.
  
### Store Implementation (`playlistGroupStore.js`)
The `playlistGroupStore` was upgraded to support this multi-layered approach:
- `getGroupByColorId(colorId, page = 1)`: Now requires a page index to retrieve the correct group associated with that specific layer.
- `addGroup(name, folderColorId, page = 1)`: Associates the newly created group with the currently active page.
- `getNextAvailableColorId(page = 1)`: Searches for the first unassigned color id *specifically on the active page*.

## 3. Empty State Handling
When a user navigates to a new, empty Prism Page (e.g., Page 2), no carousels are rendered.
- **New Carousel Button**: The "New carousel" button dynamically checks availability for the *current page*. If the user clicks it, a new carousel is assigned to the current `prismPage`.
- **Full Page Alert**: If the user tries to create a new carousel on a page where all 16 colored slots are taken, a JS alert prompts them to: `"All 16 colored folders on this page already hold an assigned carousel. Double click the page number in the playlist bar to create a new page."`

## 4. File Manifest
- `src/components/PlaylistsPage.jsx`: Owns the local state `prismPage`, calculates `totalPrismPages`, handles the 50-item list slicing for All/Unsorted grids, and provides the "Page Controls" UI at the bottom of standard grids.
- `src/components/PlaylistBar.jsx`: Owns the "Folder Prism Pagination" `< 1 >` UI. Swaps out its content dynamically based on whether the view is 'all', 'unsorted', or a distinct colored folder.
- `src/components/PlaylistGroupColumn.jsx`: (The full-screen assignment overlay) Receives `prismPage` as a prop to correctly establish newly assigned placeholders and represent the specific active page's group states.
- `src/store/playlistGroupStore.js`: Modified to ingest, query, and mutate based on the `page` property.
