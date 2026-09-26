# Advanced Player Controller

The Advanced Player Controller is the comprehensive UI component positioned at the very top of the application layout, sitting seamlessly over the App Banner. It provides centralized control for playlist navigation, video playback, folder management, and preview functionality.

To prevent documentation bloat and improve code maintainability, the logic and presentation of the Player Controller has been fractured into smaller, manageable sub-documents and sub-components. `PlayerController.jsx` acts as the main context wrapper for `PlayerControllerPlaylistMenu.jsx`, `PlayerControllerOrbMenu.jsx`, and `PlayerControllerVideoMenu.jsx`.

## Documentation Index

### 1. The Central Orb Menu
**File:** `player-controller-orb-menu.md`
- Dynamic Audio Visualizer Borders.
- Orb image uploading, resizing, and precision 4-quadrant mask spills.
- Configuration settings via the Orb Tab.
- Home Hub & Twitter Pop-Out toggles.

### 2. The Top Menus (Video & Playlist)
**File:** `player-controller-top-menus.md`
- The Split-Screen Stacked architectural layout.
- **Top Video Menu:** Controls to navigate videos, assign folders (Star button), cycle colored play filters, and manage Pins (Normal, Priority, Follower modifiers).
- **Top Playlist Menu:** Badge displays (Group Carousel, Preset, Folder) and list navigation.
- **Bottom Placeholder Menus:** Shell components situated beneath the main video/playlist menus in standard mode, currently housing Compact Layout toggles and reserved for future dedicated menu systems.
- **Preview System:** "Alt-Nav" Up/Down previewer logic with Commit/Revert options.

### 3. Integrated Components
These broader topics heavily interface with the Player Controller:
- **App Banner Architecture:** `app-banner.md` (How the controller aligns with the background).
- **Navigation Flows:** `navigation-routing.md` (Deep dive into the routing mechanisms).
- **Video Player Initialization:** `videoplayer.md` (How the controller interfaces with YouTube and Native playback).
- **Tab & Group Badge Routing:** `group-badge-player-controller.md` (How the Playlist Menu is restricted to specific Group Carousels).
- **Hover Menus:** `video-tweet-card-three-dot-menu.md` (Additional hover toolbars and pop-outs originating from the controller elements).
