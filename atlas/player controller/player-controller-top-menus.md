# Top Player Menus (Video & Playlist)

The Top Video Menu and Top Playlist Menu form the right and left control clusters of the `PlayerController`. They provide centralized control for playlist navigation, video playback, folder management, and preview functionality.

**Related Documentation:**
- **Central Orb**: See `player-controller-orb-menu.md`.
- **Navigation Flows**: See `navigation-routing.md`.
- **Video Player**: See `videoplayer.md`.

---

## 1. Controller Layout & Backdrop Architecture

The **Top Playlist Menu** and **Top Video Menu** form the left and right control cards of the `PlayerController`. They remain horizontally aligned at all times across all view modes (Fullscreen, Half, Quarter).

- **Horizontal Layout & Scale**: Both menus scale symmetrically (`scale-105`) in a 3-column layout alongside the central Orb without stacking or position shifts.
- **Card Backdrop Styling**: Utilizes the **Atmospheric Blurred App Banner Backdrop System** (`atlas/design/blurred-banner-backdrop-system.md`).
  - Container base uses solid `bg-slate-950` with an 85% opacity blurred App Banner backdrop (`filter: blur(28px)`, `transform: scale(1.15)`).
  - The outer card maintains `overflow: visible`, ensuring dropdowns (Add Menu, More Options), tooltips, and color pickers float freely without being clipped.

### Compact Layout & Alignment
- **Centered Gap Alignment**: In splitscreen view, the gap between the Central Orb and the right-hand stacked menus is precisely centered over the video player's midpoint. This is achieved via a dynamic transform: `translateX(calc(-25vw + (menuWidth - orbSize) / 2))`, ensuring a balanced visual hierarchy regardless of screen width.
- **"ALL" Mode**: The Playlist Menu features an "ALL" badge toggle. Activating this mode bypasses carousel-specific filters, allowing users to cycle through every playlist in the library using the navigation chevrons.
- **Quick Jump Shortcut**: When a specific group carousel is active, a dedicated "ALL" button appears to the left of the group navigation capsule for instant return to the full library view.
- **Smart Selection Priority**: When playing a video from a shared library, the system now prioritizes the **navigated theme** (Orb/Banner playlist) over a global search. This prevents unexpected "jumps" to a different playlist when a video exists in multiple locations.
- Beneath the top Playlist and Video menus sit two **Bottom Placeholder Menus**. These glassmorphism shells are currently hidden in fullscreen mode but are reserved for future dedicated functional expansions.

## 2. Top Playlist Menu (Left)

Displays the current playlist's title, centered with contextual badges below it:
- **Group Carousel (Violet)**: Shows the current group carousel name, restricting navigation bounds.
- **Active Preset (Indigo) / Tab (Sky)**: Indicates currently overarching filter/preset.
- **Folder (Colored)**: Displays active folder name.

### Interactions
- **Title Click**: Opens the playlists grid view.

### Action & Navigation Cluster
A horizontally evenly-spaced set of tool buttons positioned across the bottom of the menu. The layout adjusts perfectly to incorporate the Priority Pin at the center when active.

1. **Three Dot Menu (More Options)** (Left Half): Toggles advanced configurations (Preview Menus, Change Banner, Audio Visualizer toggle, and dedicated Multi-Style Switcher for selecting rendering modes). Visually nudged outwards (24px left) toward the container edge to improve peripheral balance.
2. **History** (Left Half): Clock icon. Left-click to view History page (Placeholder). Left-clicking the flanking left/right arrows navigates Older/Newer in playback history. Visually nudged outwards (5px left) toward the container edge to improve peripheral balance.
3. **Add (Plus)** (Absolute Center): Perfect dead-center anchor of the bar. Functions as a dropdown menu ("Add to quick videos", "Add to current playlist", and 4 customizable **Quick Assign Slots** mapped persistently to user-specified target playlists). Each option features a companion Play button extension on its right side that seamlessly switches playback immediately upon addition.
4. **Priority Pin** (Right Half): When active, the prominent Priority Pin thumbnail sits on the right half of the menu evenly distributed with the Grid icon.
5. **Grid / Library** (Right Half): 3 horizontal lines stacked icon. Left-clicking the flanking left/right arrows navigates Previous/Next between playlists. Left-clicking the center button returns to the Playlists grid view. Visually nudged outwards (14px right) toward the container edge to improve peripheral balance.

## 3. Top Video Menu (Right)

Displays video information (Title) and core playback controls.

### Navigation Controls (Left-Aligned Cluster)
- **Previous/Next Video** (Chevron Left/Right).
- **Grid Button**: Left-click for Videos grid; Right-click for History page.
- **Play Button (Folder Cycle)**: Cycles through colored folders within the playlist. 
  - Left-Click cycles forward, Right-Click backward. Double Right-Click resets to "All Videos".
  - Auto-plays the first video of a new folder if current is hidden.

### Action Controls (Center-Right Spread)
- **Star Button**: Folder assignment control. Left-click assigns/unassigns to quick folder. Right-click aligns the Play button's filter to the Star's current assigned color.
- **Shuffle Button**: Left-click to shuffle from current folder/all videos. Right-click opens the 16-color picker modal to set the default shuffle pool.
- **Like Button**: Left-click to toggle like. Right-click to navigate to Likes Page.
- **Info Button**: Toggles popup Help Menu for controls.
- **Priority Pin Button**: 
  - Short Click toggles Normal Pin (Blue).
  - Long Click (>600ms) toggles Priority Pin (Amber).
  - Right-Click navigates to Pins Page.

### Pin Systems & Modifiers
- **Normal Pin**: General persistence.
- **Priority Pin**: Displays prominently.
- **Follower Pin** (Modifier - Double-pin icon): Applied by clicking an existing pin. Automatically transfers the pin to the next chronological video in the playlist when the current video completes (≥85% progress). Ideal for serializing episodes.

## 4. Preview Navigation System

Users can safely preview playlists and videos without interrupting playback via the Alt-Nav UI:
- **Alt Navigation Buttons**: Up/Down arrows appear to the left of the rectangle for preview browsing.
- **Commit Button** (Green Checkmark): Applies the preview, permanently switching playback to the previewed state.
- **Revert Button** (Red X): Cancels the preview, snapping the titles back to the actively playing state.
- **Title Syncing**: Previews temporarily overlay the actual playing title in the UI, ensuring smooth browsing.

## Related Files

- `src/components/PlayerController.jsx`: Main UI controller that manages state and passes props to sub-components.
- `src/components/PlayerControllerPlaylistMenu.jsx`: Renders the left-side Top Playlist Menu, including badges, group carousel arrows, and preview/queue/history nav.
- `src/components/PlayerControllerVideoMenu.jsx`: Renders the right-side Top Video Menu, including video details, shuffle, like, and folder assignments.
- `src/components/PlayerControllerOrbMenu.jsx`: Renders the central Orb, image masking, and audio visualizer.
- `src/components/BottomNavigation.jsx`: Secondary navigation component displayed on non-player views.
- `src/store/*.js`: Zustand stores handling application state.
- `src/store/playlistStore.js`: Playlist items, navigation indexes, and preview state (`previewPlaylistItems`).
- `src/store/pinStore.js`: `pinnedVideos`, `priorityPinIds`, `followerPinIds`.
- `src/store/folderStore.js`: Folder state (`quickAssignFolder`).

**Backend (API/Bridge):**
- `assignVideoToFolder()`, `removeVideoFromPlaylist()`, `addVideoToPlaylist()` APIs.
- Handled through `src-tauri/src/commands.rs`.
