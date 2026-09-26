# Atlas Documentation Index

This directory contains comprehensive documentation for the YouTube TV v2 (yttv2) project, organized by feature and technical domain.

---

## Overview

**yttv2** is a cross-platform application (Windows & Android) built with Tauri (Rust + React) for managing and playing YouTube playlists and **local video files**. The app provides a modern, grid-based interface for browsing playlists and videos, with full SQLite database integration for persistent storage, a high-performance system-wide audio visualizer, and a local file pipeline (Axum streaming server + client-side thumbnail extraction) that gives local videos full parity with YouTube content.

## Tech Stack

### Frontend
- **React 19.1.0** - UI framework
- **Vite 7.0.4** - Build tool and dev server
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Zustand 5.0.9** - Lightweight state management
- **GSAP 3.14.2** - Animation library for radial menu morphing animations
- **@tauri-apps/api ^2** - Tauri frontend API bindings
- **tauri-plugin-libmpv-api ^0.3** - Native mpv player API bindings

### Backend
- **Tauri 2** - Desktop app framework (Rust + WebView)
- **Rust** - Backend language
- **SQLite (rusqlite 0.32)** - Embedded database with bundled feature
- **serde/serde_json** - Serialization for Rust-JS communication
- **chrono 0.4** - Date/time handling
- **Axum 0.7** - HTTP web framework for streaming server
- **tokio** - Async runtime for streaming server
- **tokio-util** - Async utilities for streaming
- **tower/tower-http** - HTTP middleware and CORS support
- **realfft** - High-performance SIMD FFT for audio processing
- **rustfft** - Backend for realfft
- **tauri-plugin-libmpv** - Native mpv player integration

### Development Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **@vitejs/plugin-react** - React plugin for Vite

---

## Project Structure

```
yttv2/
├── src/                          # Frontend React application
│   ├── api/                      # API layer for Tauri commands
│   │   └── playlistApi.js       # All playlist/video database operations
│   ├── components/               # React components
│   │   ├── PlayerController.jsx  # Main context wrapper and state logic for Top controller
│   │   ├── PlayerControllerPlaylistMenu.jsx # Left-side Playlist Menu sub-component (badges, preview nav)
│   │   ├── PlayerControllerVideoMenu.jsx    # Right-side Video Menu sub-component (pins, folders, shuffle)
│   │   ├── PlayerControllerOrbMenu.jsx      # Central Orb sub-component (visualizer, image upload)
│   │   ├── AudioVisualizer.jsx   # Canvas-based multi-style ambient visualizer
│   │   ├── YouTubePlayer.jsx     # YouTube iframe player component
│   │   ├── NativeVideoPlayer.jsx # Native mpv player for local videos
│   │   ├── LocalVideoPlayer.jsx  # HTML5 fallback player (browser-compatible formats)
│   │   ├── TopNavigation.jsx     # Contextual Mini Header; Dynamic floating title that tracks context
│   │   ├── PlaylistsPage.jsx     # Main playlists grid view
│   │   ├── VideoSortFilters.jsx  # Icon sort bar + drumstick rating filter + watch count sort
│   │   ├── HistoryPage.jsx       # Watch history display
│   │   ├── LikesPage.jsx         # Liked videos grid view
│   │   ├── PinsPage.jsx          # Pinned videos grid view
│   │   ├── TasksPage.jsx         # Dedicated tasks/checklist page
│   │   ├── Card.jsx              # Base card component
│   │   ├── VideoCard.jsx         # Video card (uses VideoCardThreeDotMenu)
│   │   ├── TweetCard.jsx         # Tweet card (uses VideoCardThreeDotMenu)
│   │   ├── PageBanner.jsx        # Contextual banners with metadata/carousel
│   │   └── MainSettingsPage.jsx  # New Settings Hub
│   ├── store/                    # Zustand state management
│   │   ├── configStore.js        # Theme and Profile configuration
│   │   ├── layoutStore.js        # View mode, UI toggles, one-shot flags
│   │   ├── navigationStore.js    # Page routing and navigation state
│   │   ├── playlistStore.js      # Current playlist items, video index, preview state
│   │   ├── folderStore.js        # Folder state and bulk tagging
│   │   └── playlistGroupStore.js # Group carousels and group persistence
│   ├── App.jsx                   # Root component, app orchestration (Cleaned of Mission/Hub logic)
│   └── main.jsx                  # React entry point
│
├── src-tauri/                    # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # Tauri app setup & JNI Bridge
│   │   ├── audio_processor.rs    # FFT & Frequency mapping engine
│   │   ├── audio_capture.rs      # Desktop loopback capture
│   │   ├── commands.rs           # Tauri command handlers
│   │   └── database.rs           # SQLite database operations
│
├── atlas/                        # Comprehensive documentation
│   ├── README.md                 # This file - documentation index
│   ├── 16julyplaylistnav.md      # Playlist navigation & explorer isolation updates (June 16, 2026)
│   ├── 18juneplaylistuploader.md # Playlist uploader tab structure & event click fixes (June 18, 2026)
│   ├── 18julynotes.md            # Playlist uploader source tab, folder tracker, and rendering optimizations (June 18, 2026)
│   │
│   ├── app banner/               # App-level visual configuration
│   │   ├── app-banner.md         # Background banner for Player Controller
│   │   └── app-page.md           # App Banner customization & configuration page
│   │
│   ├── cards/                    # Grid item components
│   │   ├── card-playlist.md      # Playlist & Folder card components
│   │   ├── card-video.md         # Video card components
│   │   ├── card-subscription.md  # Tracker/Subscription Card components
│   │   ├── card-tweet.md         # Tweet-specific card variations
│   │   ├── playlist-cards.md     # Playlist card variations and states
│   │   ├── long-playlist-card.md # Tablet-optimized horizontal playlist card
│   │   ├── card-local-image.md   # Local image card visual aesthetics & grid fixes
│   │   └── video-tweet-card-three-dot-menu.md # Unified 3-dot action menu
│   │
│   ├── content management/       # Data ingestion and updates
│   │   ├── importexport.md       # YouTube/JSON Import & Export workflows
│   │   ├── subscription-manager.md # Subscriptions refresh and management
│   │   └── twitter-integration.md # Social content/Tweet card handling
│   │
│   ├── hierachy and navigation/ # Structural logic & User flow
│   │   ├── navigation-routing.md # Overall app navigation laws
│   │   ├── playlist&tab.md       # Playlists > Tabs > Folders hierarchy
│   │   ├── group-carousel.md     # Playlist group carousel system
│   │   ├── group-badge-player-controller.md # Group-restricted navigation
│   │   ├── explorer-hub-isolation.md     # Structural isolation laws
│   │   └── playlist-pagination.md # List/Prism pagination logic
│   │
│   ├── orb/                      # Central Controller branding
│   │   ├── orb-page.md           # Orb customization & integrated advanced editor
│   │   ├── orb-navigation.md     # Independent Orb navigation & Live Preview sync
│   │   ├── orb-advanced-crop.md  # SVG mask/path crop logic & Android rendering reliability
│   │   └── orb-preset-assignments.md # Snapshot visualizer color and banners to orbs
│   │
│   ├── page features/            # Contextual page tools
│   │   ├── playlist-bar.md       # Sticky toolbar and folder prism
│   │   └── drumstick-rating-system.md # 5-drumstick rating logic
│   │
│   ├── pages/                    # Dedicated view documentation
│   │   ├── page-videos.md        # Videos Page layout
│   │   ├── page-playlists.md     # Playlists Page layout
│   │   ├── page-hub.md           # Explorer/Hub page (Playlist Groups)
│   │   ├── page-history.md       # Watch History page
│   │   ├── page-likes.md         # Likes page
│   │   ├── page-pins.md          # Pins page
│   │   ├── tasks-page.md         # Checklist/Tasks page
│   │   ├── asset-manager-page.md # Unified Asset Manager
│   │   ├── page-banner.md        # Shared Page Banner system
│   │   └── you-page.md           # Signature & Profile page
│   │
│   ├── player controller/        # Top Overlay Brain
│   │   ├── player-controller-unified.md # Main controller architecture
│   │   ├── player-controller-top-menus.md # Video & Playlist side-menus
│   │   └── player-controller-orb-menu.md # Central Orb configuration
│   │
│   └── (Core & Infrastructure)
│       ├── api-bridge.md         # Tauri Command/API layer
│       ├── database-schema.md    # SQLite tables and relations
│       ├── state-management.md   # Zustand store mapping
│       ├── videoplayer.md        # Player engine (YT/MPV) logic
│       ├── history.md            # Progress tracking background logic
│       ├── audio-visualizer.md   # Real-time FFT processing & Multi-style ambient rendering
│       ├── ui.md                 # UI design system & globals
│       ├── ui-layout.md          # Grid system & LayoutShell
│       ├── ui-modals.md          # Modal system overview
│       ├── modal-addcontent.md   # Content uploader modal (YouTube + Local)
│       ├── localfiles2026.md     # Local video pipeline: streaming, thumbnails, folder import
│       ├── local-images.md       # Local image pipeline: ingestion, canvas thumbnails, cache-busting
│       ├── fullscreen-video-info.md # Metadata panel logic
│       ├── top-navigation.md     # Contextual mini-header
│       ├── bottom-navigation.md  # Secondary navigation bar
│       ├── session-updates.md    # Development session logs
│       ├── steam-deck-build-guide.md # Steam Deck compilation & deployment guide
│       ├── deployment.md         # Deployment & Packaging guide (WPF + Inno Setup)
│       └── debug.md              # Inspect mode & bounds debugging
```

## Quick Reference: Where to Find What

### By Feature Area

| Feature | Primary Document | Related Documents |
|---------|-----------------|-------------------|
| **Player Controller** | `player controller/player-controller-unified.md` | `hierachy and navigation/navigation-routing.md`, `player controller/player-controller-top-menus.md` |
| **Playlists & Tabs** | `hierachy and navigation/playlist&tab.md` | `database-schema.md`, `api-bridge.md` |
| **Import/Export** | `content management/importexport.md` | `api-bridge.md`, `database-schema.md` |
| **UI Components** | `ui.md` | `cards/card-video.md`, `ui-layout.md` |
| **Tablet Playlist Card** | `cards/long-playlist-card.md` | `cards/playlist-cards.md`, `pages/page-playlists.md` |
| **Videos Page Filters** | `page features/video-sort-filters.md` | `pages/page-videos.md`, `page features/drumstick-rating-system.md` |
| **Playlist Carousels** | `hierachy and navigation/group-carousel.md` | `page features/playlist-bar.md`, `hierachy and navigation/group-badge-player-controller.md` |
| **Video Player** | `videoplayer.md` | `history.md`, `database-schema.md` |
| **Local Video Files** | `localfiles2026.md` | `videoplayer.md`, `modal-addcontent.md`, `database-schema.md` |
| **Local Image Files** | `local-images.md` | `cards/card-local-image.md`, `database-schema.md`, `localfiles2026.md` |
| **App Banner** | `app banner/app-banner.md` | `app banner/app-page.md`, `player controller/player-controller-unified.md` |
| **Audio Visualizer** | `audio-visualizer.md` | `player controller/player-controller-unified.md` |

### By Technical Domain

| Domain | Document | Related Documents |
|--------|----------|-------------------|
| **State Management** | `state-management.md` | All feature docs |
| **Database** | `database-schema.md` | `api-bridge.md`, `history.md` |
| **API Layer** | `api-bridge.md` | `database-schema.md`, `content management/importexport.md` |
| **Navigation** | `hierachy and navigation/navigation-routing.md` | `orb/orb-navigation.md`, `player controller/player-controller-unified.md` |
| **Deployment & Packaging** | `deployment.md` | `steam-deck-build-guide.md` |

## Document Descriptions

### Feature Documentation

#### `pages/page-hub.md`
**Covers**: The central Hub (ExplorerPage) grid for scaling and navigating Playlist Pages.
**Key Topics**: Cool Blue Glassmorphism, stable page ID logic, unified engulfing square grid.

#### `design/explorer-hub-aesthetics.md`
**Covers**: The visual architecture and glassmorphism system of the Explorer Hub.
**Key Topics**: Radial background environments, decorative light orbs, dynamic font-scaling, integrated UI controls.

#### `orb/orb-navigation.md`
**Covers**: Independent Orb navigation system within the Player Controller.
**Key Topics**: **Orb Context**, **Live Preview**, **Playlist Filtering**, **Direct Selection**.

#### `orb/orb-preset-assignments.md`
**Covers**: Presets integration (visualizer color and app banner snapshotting) assigned directly to Orbs.
**Key Topics**: Palette button menu, snapshot active colors & banners, restore and priority orchestration logic.

#### `player controller/player-controller-unified.md`
**Covers**: Central orb, menu rectangles, playlist/video navigation, preview system, folder management, dual player system.
**Key Topics**: Orb customization, **orb presets**, preview navigation, colored shuffle, quick assign, pin system.

#### `hierachy and navigation/playlist&tab.md`
**Covers**: Playlist management, tab system, tab presets, colored folders, sticky folders.
**Key Topics**: Playlist CRUD, tab organization, folder assignments, bulk tagging.

#### `content management/importexport.md`
**Covers**: YouTube import, JSON import/export, bulk import.
**Key Topics**: YouTube Data API v3, JSON format, local references, folder assignments in exports.

#### `localfiles2026.md`
**Covers**: Complete local video ingestion pipeline built May 2026.
**Key Topics**: Axum streaming server, `get_video_stream_url`, `extractVideoMetadata` (canvas-based thumbnail capture), `LocalVideoPlayer`, aspect ratio letterboxing, `is_local` DB column, `select_video_folder`, `get_videos_in_directory`, Device Folder bubble type, folder-aware import UI.

#### `local-images.md`
**Covers**: Client-side ingestion, processing, cache-busting, and SQLite database storage for local image files.
**Key Topics**: Case-insensitive extension matching, `extractImageMetadata` (canvas resizing to 640px base64 JPEG), stream URL cache-busting with timestamp parameters, duplicate deletion on upload, and Zustand reactivity sync.

#### `cards/card-local-image.md`
**Covers**: Styling, visual aesthetics, layout styles (YouTube vs Twitter), aspect-ratio container settings, and grid alignment fixes.
**Key Topics**: Frameless and transparent default style, expanded full-card thumbnail (no bottom title bar), hover metadata overlay header, portrait contain aspect ratio scaling, grid-wrapper `h-auto` collapse fixes.

#### `ui.md`
**Covers**: Side menu, page layouts, grid systems, **Support Hub**, **Custom Player Borders**, **Custom ASCII Banners**.

#### `pages/page-history.md`
**Covers**: Watch history tracking, history page display.
**Key Topics**: Last 100 videos, deduplication, **list layout**, history cards.

#### `page features/drumstick-rating-system.md`
**Covers**: 5-drumstick rating system, persistence, UI integration.

#### `page features/video-sort-filters.md`
**Covers**: Videos page sticky toolbar—VideoSortFilters component, watch count sorting/filtering, and colored folder prism.

#### `videoplayer.md`
**Covers**: Main and secondary YouTube players, MPV native playback, progress tracking, Zen Mode.

#### `app banner/app-banner.md`
**Covers**: Top-level application header background with a dual-half independent configuration system (Left/Right).
**Key Topics**: Dual-half rendering, horizontal mirroring (flip), sync copying, infinite scroll, and hub-isolated preset management.

#### `pages/page-banner.md`
**Covers**: Contextual page banners on all pages with metadata and customization.

#### `pages/asset-manager-page.md`
**Covers**: Unified Asset Manager hub (`AssetManagerPage.jsx`).

#### `hierachy and navigation/group-carousel.md`
**Covers**: Group carousel system on the Playlists page with colored-folder model.

#### `hierachy and navigation/group-badge-player-controller.md`
**Covers**: Group carousel badge on the Player Controller, arrow cycling, restricted navigation, and the "ALL" library escape.

## Usage Tips

1. **Start with feature docs** for user-facing functionality.
2. **Reference technical docs** when you need implementation details.
3. **Use the subfolder structure** to locate specific UI components vs background logic.
4. **Fresh Agent Warning**: Defunct gamification and link capture systems (Mission Hub, Pokedex, Harvester) have been purged. Refer only to the current manifest.

## Known Issues / Non-Functional Features

The following features exist in the codebase but are currently non-functional:
- **Ruler Overlay**: Measurement tool for main player area (see `debug.md`)
  - Toggle button works and state management is functional
  - Component renders but ruler visualization does not appear
- **Advanced Player Controller Layout**:
  - **Status: RESOLVED**. The top menu layout has been restored with fixed dimensions and absolute positioning.
  - Minor visual tuning may still be desired, but the critical regression is fixed.
- **Mega Shuffle (Right-Click on Playlist Title)**: 
  - **Status: NON-FUNCTIONAL**. The `handleShufflePlaylist()` function exists and works correctly when called programmatically, but right-click events on the playlist title are not being captured.
  - Multiple implementation attempts were made:
    - React `onContextMenu` and `onMouseDown` handlers
    - Direct `addEventListener` with capture phase
    - Event handlers on both container and h1 elements
  - None of these approaches successfully capture right-click events - no console logs appear when right-clicking
  - Possible causes: Overlay element blocking events, CSS `pointer-events` issues, or Tauri-specific event handling
  - The function itself is functional and can be triggered via other means (e.g., programmatic call or alternative UI trigger)

## Theme Documentation

For detailed information about the application's theme system and recent color changes, see:
- **`THEME_CHANGES.md`** (project root): Comprehensive documentation of theme changes, color palette, and implementation details

## Usage Tips

1. **Start with feature docs** for user-facing functionality
2. **Reference technical docs** when you need implementation details
3. **Use cross-references** to navigate between related topics
