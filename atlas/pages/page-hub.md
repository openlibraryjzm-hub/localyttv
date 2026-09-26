# Hub (Explorer Page)

**Covers**: The central Hub grid (`ExplorerPage.jsx`) for managing and navigating separate structural Playlist Pages.
**Key Topics**: Cool Blue Glassmorphism, Unified Square Layout, Persistent Page IDs, Add/Delete Pages, Dynamic Grid Restructuring. 

## 1. User-Perspective Description
The Hub acts as a master visual dashboard for organizing the user's library into multiple themed "pages". It uses a premium **Cool Blue glassmorphic** aesthetic, featuring a vibrant radial gradient background and high-transparency frosted glass segments.
- **Unified Square Layout**: The application represents its structural scale as a dynamically splitting "Unified Square" that fills the entire screen.
- **Dynamic Fracturing**: Adding new pages cleaves the space into smaller fractions (halves, thirds, quarters, etc.), ensuring no screen real estate is wasted.
- **Navigation Controls**: The top of the page features a sticky `BottomNavigation` bar for quick "Back" and "Close (Fullscreen)" actions.
- **Stable Identity**: Pages are numbered `1, 2, 3...` and maintain their identity even if previous pages are deleted.

## 2. File Manifest
- **UI/Components**: `src/components/ExplorerPage.jsx`, `src/components/BottomNavigation.jsx`
- **Design Docs**: `atlas/design/explorer-hub-aesthetics.md`
- **State Management**: `src/store/playlistGroupStore.js`, `src/store/navigationStore.js`
- **Integration Layer**: `src/components/PlaylistsPage.jsx`

## 3. Logic & State Chain
- **Creation Flow**: Triggers `setTotalPages(pages.length + 1)` in `usePlaylistGroupStore.js`. The store automatically assigns the next highest available integer ID to ensure stable referencing.
- **Navigation Flow**: Clicking a grid block fires `setActivePage(pageId)` and `setCurrentPage('playlists')`.
- **Deletion Architecture**: `deletePage(id)` (Store v5) executes a targeted cleanup:
    1. Removes the specific page ID from the `pages` array.
    2. Deletes all carousel groups specifically bound to that `pageId`.
    3. **No Shifting**: IDs remain stable. Deleting Page 2 does *not* rename Page 3 to Page 2, preventing user confusion with "shifting" carousel contents.
