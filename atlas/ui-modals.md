###4.1.5: UI Modal Components

This document covers modal dialog components used in the UI system.

**Related Documentation:**
- **Pages**: See ui-pages.md for pages that use modals
- **Layout**: See ui-layout.md for layout system

---

#### ### 4.1.5 Playlist Selection Modal

**1: User-Perspective Description**

Users see a modal dialog when selecting "Move to Playlist" or "Copy to Playlist" from a video card's menu:

- **Modal Structure**:
  - **Header**: Title ("Move to Playlist" or "Copy to Playlist") and close button (X)
  - **Content**: Scrollable list of all available playlists
  - **Loading State**: Spinner while playlists fetch
  - **Empty/Error States**: Specific messages if no playlists found or fetch fails
  - **Footer**: Cancel button

- **Playlist List**:
  - Each item shows playlist icon, name, and description
  - Click to select destination playlist
  - Hover effects highlight selection

**2: File Manifest**

**UI/Components:**
- `src/components/PlaylistSelectionModal.jsx`: Modal component
- `src/components/VideosPage.jsx`: Parent handling modal state

**State Management:**
- `src/components/VideosPage.jsx` (local state):
  - `showPlaylistSelector`: Boolean visibility toggle
  - `selectedVideoForAction`: Video object being moved/copied
  - `actionType`: 'move' | 'copy'

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getAllPlaylists()` - Fetches playlists for list
  - `addVideoToPlaylist()` - Used for Copy/Move (add step)
  - `removeVideoFromPlaylist()` - Used for Move (remove step)

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Open Modal:**
   - User selects Move/Copy in video menu → `handleMenuOptionClick`
   - Sets `selectedVideoForAction` and `actionType`
   - Sets `showPlaylistSelector(true)` → Modal appears

2. **Select Playlist:**
   - User clicks playlist → `handlePlaylistSelect(playlistId)`
   - **Copy**: Calls `addVideoToPlaylist`
   - **Move**: Calls `addVideoToPlaylist` then `removeVideoFromPlaylist` (from source)
     - Updates UI (removes video from grid if moved)
   - Closes modal and clears state

