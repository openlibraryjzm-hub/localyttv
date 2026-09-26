# Playlists Page

The Playlists Page is the primary organizational hub for the application, displaying user-created playlists and colored folders in a horizontal, single-row scrolling layout.

**Related Documentation:**
- **Navigation Flows**: See `navigation-routing.md` for page changes.
- **Card UI**: See `card-playlist.md` for the specific components used in the grid.
- **Folder Expansion**: See `card-playlist.md` for details on the vertical Folder Reel View.

---

## 1. Description & Structure

- **Horizontal Scrolling Layout**:
  - The page displays a single horizontal row of fixed-width (500px) cards.
  - Mouse wheel scrolling is automatically captured and converted into horizontal translation.
  - Vertical page scrolling is completely disabled (`overflow-y-hidden`).
  
- **Top Sticky Toolbar**:
  - A dynamic toolbar below the Page Banner. Sticks to the top of the viewport when scrolling.
  - Matches the single-row architecture of the Videos Page.
  - **Left Side (Tab Bar)**: 
    - Toggle Mode Button (List/Layers icon) to switch between **Tabs View** and **Presets View**.
    - Horizontal scroll container for Tabs/Presets.
  - **Right Side (Controls)**:
    - Folder Toggle (Icon): Toggles inline folder display.
    - Add Playlist (Icon): Opens the creation/import modal.

- **Scroll to Top Arrow**:
  - A centered button at the bottom of the screen smoothly auto-scrolls the horizontal container back to the far left (the beginning).

## 2. Colored Folders Integration

Users interact with colored folders via three distinct methods on this page:

1. **Sticky Folders (Horizontal)**: 
   - Folders manually pinned appear in the main horizontal scroll immediately after their parent playlist.
   
2. **Inline Expansion (Horizontal)**:
   - Activated via the "Expand Folders" option in a playlist's 3-dot menu.
   - Temporarily injects all folders belonging to that playlist directly into the horizontal scroll.
   
3. **Folder Reel View (Vertical Overlay)**:
   - Activated via the "List" icon on a playlist card.
   - Puts focus strictly on the selected playlist's folder structure in a dedicated vertical column overlay without leaving the page.

## File Manifest
**UI/Components:**
- `src/components/PlaylistsPage.jsx`: Top-level component processing the layouts and capturing the scroll manipulations.
- `src/components/TabBar.jsx`: Tab navigation bar driving the filters.

**State Management:**
- `src/store/playlistStore.js`:
  - `playlists`, `playlistThumbnails`, `playlistItemCounts`.
- `src/components/PlaylistsPage.jsx` (Local):
  - `folders`, `folderMetadata`, `stuckFolders`.
