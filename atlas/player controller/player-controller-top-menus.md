# Top Player Menus (Video & Playlist)

The Top Video Menu and Top Playlist Menu form the right and left control clusters of the `PlayerController`. They provide centralized control for playlist navigation, video playback, folder management, and preview functionality.

**Related Documentation:**
- **Central Orb**: See `player-controller-orb-menu.md`.
- **Unified Controller Architecture**: See `player-controller-unified.md`.
- **Control Guide Modal**: See `control-tutorial-guide-modal.md`.
- **Navigation Flows**: See `navigation-routing.md`.

---

## 1. Controller Layout & Backdrop Architecture

The **Top Playlist Menu** and **Top Video Menu** form the left and right control clusters of the `PlayerController`. They remain horizontally aligned at all times across all view modes (Fullscreen, Half, Quarter).

- **Horizontal Layout & Scale**: Both menus scale symmetrically (`scale-105`) in a 3-column layout alongside the central Orb without stacking or position shifts.
- **Backdrop-Free Minimalist Aesthetic**:
  - The legacy light card shells (`bg-slate-100 border-2 border-[#052F4A]`) were eliminated in October 2026.
  - Both menus are completely **backdrop-free** (`bg-transparent`), rendering clean white typography, badges, and controls floating directly over the hardcoded black `#000000` header.
  - Dropdown popovers ("Add to Playlist", "More Options", API Key panel, Color Picker) are styled in high-contrast dark mode (`bg-black/95 border border-white/20 text-white shadow-2xl`).
  - The outer container maintains `overflow: visible`, ensuring popover menus float freely without being clipped.
- **Central Orb Customizability Protected**:
  - The Central Orb (`PlayerControllerOrbMenu.jsx`) between the menus remains completely intact with its multi-style audio visualizer, custom image uploads, SVG partial spillover masking, orbital crops, and favorites presets.

### Compact Layout & Alignment
- **Centered Gap Alignment**: In splitscreen view, the gap between the Central Orb and the right-hand stacked menus is precisely centered over the video player's midpoint via dynamic transform: `translateX(calc(-25vw + (menuWidth - orbSize) / 2))`, ensuring a balanced visual hierarchy regardless of screen width.
- **"ALL" Mode**: The Playlist Menu features an "ALL" badge toggle. Activating this mode bypasses carousel-specific filters, allowing users to cycle through every playlist in the library using the navigation chevrons.
- **Quick Jump Shortcut**: When a specific group carousel is active, a dedicated "ALL" button appears to the left of the group navigation capsule for instant return to the full library view.
- **Smart Selection Priority**: When playing a video from a shared library, the system prioritizes the **navigated theme** (Orb/Banner playlist) over a global search. This prevents unexpected "jumps" to a different playlist when a video exists in multiple locations.

---

## 2. Top Playlist Menu (Left)

Displays the current playlist's title, centered with contextual badges below it:
- **Active Preset (Indigo) / Tab (Sky)**: Indicates currently overarching filter/preset.
- **Title Tracking & State Auto-Sync**: The top playlist title automatically synchronizes (`useEffect` in `PlayerController`) whenever `currentPlaylistId` updates (such as jumping directly into a video or playlist from external cards, orb, banner, or search). This ensures `orbNavPlaylistId` and `bannerNavPlaylistId` stay aligned with active playback while still allowing temporary arrow cycling previews.

### Interactions
- **Title Click**: Opens the playlists grid view.
- **Right-Click**: Triggers Mega Shuffle for the playlist.

### Action & Navigation Cluster
A horizontally evenly-spaced set of pure white tool buttons positioned across the bottom of the menu:

1. **Three Dot Menu (More Options)** (Left Half): Toggles advanced configurations (Preview Menus, Change Banner, Audio Visualizer toggle, and Visualizer Color Picker). Visually nudged outwards (24px left) toward the container edge to improve peripheral balance.
2. **History** (Left Half): Clock icon. Left-click center Clock icon to navigate directly to the Watch History page. Left-clicking the flanking left/right chevrons steps Older/Newer backward and forward in playback history. Visually nudged outwards (5px left) toward the container edge.
3. **Add (Plus)** (Absolute Center): Perfect dead-center anchor of the bar. Functions as a dark popover dropdown menu ("Add to quick videos", "Add to current playlist", and 4 customizable **Quick Assign Slots** mapped persistently to user-specified target playlists). Each option features a companion Play button extension on its right side that seamlessly switches playback immediately upon addition.
4. **Group Carousel Dot** (Right Half): Circle button filled with the active group carousel's folder color (or Sky Blue in ALL mode). Left-clicking the circle toggles between ALL mode and group carousel context.
5. **Grid / Library** (Right Half): 3 horizontal lines stacked icon. Left-clicking the flanking left/right arrows navigates Previous/Next between playlists. Left-clicking the center button returns to the Playlists grid view. Visually nudged outwards (14px right) toward the container edge.

---

## 3. Top Video Menu (Right)

Displays video information (Title in pure white) and core playback controls.

### Navigation Controls (Left-Aligned Cluster)
- **Previous/Next Video** (Chevron Left/Right in `#ffffff`).
- **Grid Button**: Left-click to navigate to the Videos grid page.
- **Play Button (Folder Cycle)**: Cycles through colored folders within the playlist. 
  - Left-Click cycles forward to the next colored folder, Right-Click cycles backward to the previous colored folder.
  - Auto-plays the first video of a new folder if current is hidden.

### Action Controls (Center-Right Spread)
- **Star Button**: Folder assignment and filter control. Left-click resets the Play button's folder filter back to "ALL" (default white play button). Right-click aligns the Play button's folder filter to match the Star's current assigned color.
- **Shuffle Button**: Random playback within the current folder filter.
- **Pin Button**: Pin current video for persistent quick access.
- **Like Button**: Toggle like status (heart icon).
- **Info Button**: Opens the YouTube Data API key configuration modal (`Key` icon) with live server validation.
