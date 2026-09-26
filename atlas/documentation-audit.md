# System Documentation & Persistence Audit

Here is a comprehensive categorization of all the Markdown files in the `atlas` directory, strictly adhering to the 13 categories you outlined.

### 1. Playlists Page
*The page with our playlists, playlist cards, group carousel system, unique pagination systems, filters for playlists.*
- `page-playlists.md` *(Main Playlists Page architecture)*
- `group-carousel.md`
- `playlist-bar.md`
- `playlist-cards.md`
- `playlist-pagination.md`

### 2. Videos Page
*The page that shows not only videos but all types of content: orb presets, banner presets and twitter content. It features a colored folder system too, filters for content.*
- `page-videos.md` *(Main Videos Page architecture)*
- `video-sort-filters.md`
- `twitter-integration.md`
- `drumstick-rating-system.md`

### 3. Player Controller
*Menu at the top that links us to pages, navigates videos/playlists that influence video player, also allows us to like, pin current video.*
- `player-controller-unified.md` *(Index for the advanced controller)*
- `player-controller-top-menus.md` *(Top Video & Playlist Menus)*
- `group-badge-player-controller.md`
- `videoplayer.md`

### 4. Orb Menu (Player Controller Element)
*Customizable image that can be uploaded and configured. Allowances for cropping to create "spill" effect for pseudo 3d effect. Orb menu is wrapped by a circular audio visualizer that animates with any audio from PC.*
- `player-controller-orb-menu.md` *(Central Orb configs and spills)*
- `orb-navigation.md`
- `orb-page.md`
- `orb-advanced-crop.md`
- `audio-visualizer.md`
- `popout-browser.md` *(The Twitter popup webview launched specifically via the Orb menu)*

### 5. Specialized Pages
*Pages with unique functionality: history, pins, likes, configurators, etc.*
- `page-history.md`
- `page-pins.md`
- `page-likes.md`
- `tasks-page.md`
- `you-page.md`
- `page-page.md`
- `asset-manager-page.md`
- `subscription-manager.md`

### 6. Big Picture Hierarchy of Category Types
*Playlists hierarchy: colored folder page, group carousel, playlists, videos/content. General: Playlist, colored folder, video/content.*
- `playlist&tab.md` *(The central document holding the overarching hierarchical relationships together)*

### 7. App Banner System
*Describing the app banner area layout in app (dedicated area at top), app page dedicated to app banner config, how the configs are done, how custom images work, custom cropping, etc.*
- `app-banner.md`
- `app-page.md`

### 8. Homehub / Pokemon / Missions
*Separate layer to app that kind of exists outside of normal video player mode dedicated to heavily WIP pokemon collectable via lootbox, mission earning points for time in app and lootbox system.*
- `mission-hub.md`
- `pokedex-system.md`
- `gen1-pokemon-reference.md`

### 9. Foundational / Fundamental Tech for Project
*Installs, dependencies, tech stack, and core backend bridges.*
- `README.md`
- `api-bridge.md` *(The Tauri-React command interfaces connecting the tech stack)*

### 10. Data
*All data we keep, what is put in indexdb, what is kept as local storage, what data is called for in API pulls from youtube, JSON data we import / export for twitter.*
- `database-schema.md`
- `state-management.md` *(Includes IndexedDB & LocalStorage Zustand stores)*
- `importexport.md`
- `session-updates.md`

### 11. Layout
*Big picture overview of app layout: where video player is, how pages display in context of fullscreen vs splitscreen modes, layout within pages: e.g. always present top/bottom navigation bars.*
- `ui-layout.md`
- `navigation-routing.md`
- `top-navigation.md`
- `bottom-navigation.md`
- `fullscreen-video-info.md` *(How the right-side margin is filled in fullscreen layout)*

### 12. UI
*Intense focus on cards, individual page layouts, modals and three dot menu / context menu style menus.*
- `ui.md`
- `card-playlist.md` *(Folder and Playlist card elements)*
- `card-video.md` *(Standard video interactions)*
- `card-tweet.md` *(Twitter UI overrides)*
- `ui-modals.md`
- `page-banner.md` *(Visual UI component appearing at the top of Videos/Playlists pages)*
- `video-tweet-card-three-dot-menu.md`

### 13. Defunct / Discontinued Features
*Dev tool bar / tools such as "ruler", "layout view", attempt at animated radial menu.*
- `debug.md` *(Contains the deprecated "ruler", layout boundaries, and old dev toolbar interactions)*
