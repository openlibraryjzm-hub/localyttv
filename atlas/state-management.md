# State Management

This document provides a comprehensive overview of all Zustand stores, their relationships, and state flow patterns in the application.

**Related Documentation:**
- **Feature Docs**: All feature documents (`advanced-player-controller.md`, `playlist&tab.md`, `ui.md`, etc.) use these stores
- **Database**: See `database-schema.md` for persistent data that syncs with stores
- **API Layer**: See `api-bridge.md` for commands that update store state
- **Navigation**: See `navigation-routing.md` for how stores coordinate navigation flows

## Overview

The application uses **Zustand** (v5.0.9) for state management. Zustand is a lightweight, unopinionated state management library that provides a simple API for creating reactive stores. There are **6 main Zustand stores** that manage different aspects of the application state.

## Store Architecture

### Store Categories

1. **UI State Stores** (client-side only, no persistence):
   - `layoutStore` - View modes, debug modes
   - `navigationStore` - Current page routing
   - `pinStore` - Session-only pin state

2. **Data State Stores** (sync with database):
   - `playlistStore` - Current playlist/video state, navigation items
   - `folderStore` - Folder assignments, bulk tagging state

3. **Organization State Stores** (persisted to localStorage/indexedDB):
   - `playlistGroupStore` - Group carousels (assign/rename/delete); see `group-carousel.md`
   - `stickyStore` - Sticky video state management

4. **Configuration State Stores** (persisted to localStorage):
   - `configStore` - Theme and Profile settings

## Store Details

### 1. layoutStore (`src/store/layoutStore.js`)

**Purpose**: Manages UI layout and debug modes

**State:**
- `viewMode`: 'full' | 'half' | 'quarter' - Current view mode
- `menuQuarterMode`: boolean - Menu quarter mode toggle
- `showDebugBounds`: boolean - Layout debug mode (colored boundaries)
- `inspectMode`: boolean - Inspect element mode (tooltip labels)
- `playlistsPageShowTitles`: boolean - Show video titles on playlist cards (synced from localStorage by PlaylistsPage)
- `showPlaylistUploader`: boolean - When true, PlaylistsPage opens uploader and clears (TopNavigation Add on Playlists)
- `showVideosUploader`: boolean - When true, VideosPage opens Add/Config uploader and clears (Videos page sticky toolbar Add button)
- `showSubscriptionManager`: boolean - Subscription manager modal visibility (Videos page sticky toolbar Refresh right-click)
- `requestSubscriptionRefresh`: boolean - One-shot; when true, VideosPage runs subscription refresh and clears (Videos page sticky toolbar Refresh left-click)
- `requestShowAutoTagModal`: boolean - One-shot; when true, VideosPage opens Auto-Tag modal and clears (Videos page sticky toolbar Bulk tag right-click)

**Actions:**
- `setViewMode(mode)` - Sets view mode, auto-disables menuQuarterMode when switching to 'full'
- `toggleMenuQuarterMode()` - Toggles menu quarter mode (only works when not in 'full')
- `toggleDebugBounds()` - Toggles layout debug bounds
- `toggleInspectMode()` - Toggles inspect element mode
- `setPlaylistsPageShowTitles(v)` / `setShowPlaylistUploader(v)` / `setShowVideosUploader(v)` / `setShowSubscriptionManager(v)` / `setRequestSubscriptionRefresh(v)` / `setRequestShowAutoTagModal(v)` - Videos/Playlists page UI triggers

**Persistence**: None for session-only flags; playlistsPageShowTitles is synced from localStorage by PlaylistsPage

**Dependencies:**
- When `viewMode` changes → `LayoutShell` re-renders → Layout structure changes
- When `showDebugBounds` changes → All layout regions show/hide debug boundaries
- When `inspectMode` changes → All components show/hide tooltip labels

---

### 2. navigationStore (`src/store/navigationStore.js`)

**Purpose**: Manages page routing (Playlists/Videos/History)

**State:**
- `currentPage`: 'playlists' | 'videos' | 'history' - Currently active page

**Actions:**
- `setCurrentPage(page)` - Sets active page

**Persistence**: None - resets to 'playlists' on app start

**Dependencies:**
- When `currentPage` changes → `App.jsx` re-renders → Different page component displayed
- When page changes in 'full' mode → Auto-switches to 'half' mode to show side menu

---

### 3. playlistStore (`src/store/playlistStore.js`)

**Purpose**: Manages current playlist, video playback, and hierarchical navigation

**State:**
- `showPlaylists`: boolean - Legacy sidebar toggle (unused in current UI)
- `currentPlaylistItems`: Array - Videos in current playlist
- `currentPlaylistId`: number | null - Current playlist ID
- `currentVideoIndex`: number - Index of currently playing video
- `allPlaylists`: Array - All playlists in database (synced globally for navigation)
- `currentPlaylistIndex`: number - Index in allPlaylists array
- `navigationItems`: Array - Flat list of playlists and folders for navigation
- `currentNavigationIndex`: number - Index in navigationItems array
- `currentFolder`: { playlist_id, folder_color } | null - Current folder context
- `previewPlaylistItems`: Array | null - Preview playlist items (null when not previewing)
- `previewPlaylistId`: number | null - Preview playlist ID
- `previewFolderInfo`: { playlist_id, folder_color } | null - Preview folder info

**Actions:**
- `setShowPlaylists(show)` - Sets sidebar visibility (legacy)
- `setPlaylistItems(items, playlistId, folderInfo)` - Sets current playlist items
- `setCurrentVideoIndex(index)` - Sets current video index
- `nextVideo()` - Navigates to next video in playlist
- `previousVideo()` - Navigates to previous video in playlist
- `nextPlaylist()` - Navigates to next playlist/folder in navigationItems
- `previousPlaylist()` - Navigates to previous playlist/folder
- `shufflePlaylist()` - Shuffles current playlist items
- `buildNavigationItems(playlists, folders)` - Builds hierarchical navigation list
- `setNavigationItems(items)` - Sets navigation items
- `setAllPlaylists(playlists)` - Sets all playlists array
- `setCurrentFolder(folderInfo)` - Sets current folder context
- `setPreviewPlaylist(items, playlistId, folderInfo)` - Sets preview playlist state
- `clearPreview()` - Clears preview state
- `getCurrentVideo()` - Gets current video object

**Persistence**: 
- Video index persisted to localStorage: `last_video_index_{playlistId}`
- Shuffled order persisted to localStorage: `shuffled_order_{playlistId}`
- Folder video index persisted: `last_video_index_{playlistId}_{folderColor}`

**Dependencies:**
- When `currentPlaylistItems` changes → VideosPage updates → Grid re-renders
- When `currentVideoIndex` changes → YouTubePlayer receives new video → Player updates
- When `previewPlaylistItems` set → VideosPage shows preview items → Preview mode active
- When `navigationItems` changes → PlayerController navigation updates → Next/prev buttons work

---

### 4. folderStore (`src/store/folderStore.js`)

**Purpose**: Manages folder assignments, filtering, and bulk tagging

**State:**
- `selectedFolder`: string | null - Currently selected folder color (null = all videos)
- `quickAssignFolder`: string - Default folder color for quick assign (persisted to localStorage)
- `videoFolderAssignments`: Object - Map of video ID to array of folder colors
- `showColoredFolders`: boolean - Toggle for showing folders in playlist grid (persisted to localStorage)
- `bulkTagMode`: boolean - Bulk tagging mode toggle
- `bulkTagSelections`: Object - Map of video ID to Set of folder colors (cleared on mode exit; in bulk mode cards receive current assignments from parent for grid display)

**Actions:**
- `setSelectedFolder(folder)` - Sets selected folder filter (null = all)
- `setQuickAssignFolder(folderId)` - Sets quick assign folder preference (persists to localStorage)
- `setVideoFolders(itemId, folders)` - Sets folder assignments for a video
- `loadVideoFolders(assignments)` - Loads folder assignments for multiple videos
- `clearAssignments()` - Clears all folder assignments
- `setShowColoredFolders(enabled)` - Toggles folder display (persists to localStorage)
- `setBulkTagMode(enabled)` - Toggles bulk tagging mode
- `clearBulkTagSelections()` - Clears bulk tag selections (called when exiting bulk tag mode)

**Persistence:**
- `quickAssignFolder` persisted to localStorage: `quickAssignFolder`
- `showColoredFolders` persisted to localStorage: `showColoredFolders`

**Dependencies:**
- When `selectedFolder` changes → VideosPage filters videos → Grid shows only folder videos
- When `videoFolderAssignments` changes → VideoCard star icons update → Visual feedback
- When `videoFolderAssignments` changes (unsorted view) → VideosPage re-filters unsorted videos → Assigned videos removed, next unsorted videos backfilled
- When `bulkTagMode` changes → VideoCard shows/hides bulk grid strip; clicking a color instantly assigns/unassigns (no Save step)
- When folder assigned via bulk grid → `videoFolderAssignments` updated → Checkmarks and border reflect current state

---



### 7. pinStore (`src/store/pinStore.js`)

**Purpose**: Manages video pinning with persistent storage. Supports normal pins, priority pins, and follower pins (a modifier that enables auto-transfer to next video).

**State:**
- `pinnedVideos`: Array - Array of pinned video objects. Each object includes `pinnedAt` timestamp.
- `priorityPinIds`: Array - Array of video IDs that are priority pins.
- `followerPinIds`: Array - Array of video IDs that have the follower modifier (can be combined with normal or priority).

**Actions:**
- `togglePin(video)` - Cycles pin/follower status:
  - If unpinned → Add as normal pin
  - If pinned (not follower) → Add follower modifier
  - If follower → Remove follower modifier (keep pin)
- `togglePriorityPin(video)` - Sets video as priority pin (idempotent - does nothing if already priority).
- `isPinned(videoId)` - Checks if video is a normal pin (and NOT a priority pin).
- `isPriorityPin(videoId)` - Checks if video is a priority pin.
- `isFollowerPin(videoId)` - Checks if video has the follower modifier.
- `toggleFollowerPin(videoId)` - Toggles follower status for an already pinned video.
- `setFollowerPin(videoId)` - Sets a video as a follower pin.
- `removeFollowerStatus(videoId)` - Removes follower status from a video.
- `removePin(videoId)` - Removes pin by video ID (from all lists).
- `removePinByVideoId(videoId)` - Removes pin by YouTube video_id (used for auto-unpinning on completion).
- `handleFollowerPinCompletion(videoId, playlistItems)` - Handles follower pin transfer when video completes.
- `clearAllPins()` - Clears all pins, priority, and follower state.
- `getPinInfo(videoId)` - Returns object with `{ isPinned, isPriority, isFollower, pinnedAt }`.

**Persistence**: 
- Persisted to localStorage: `pin-storage`
- Persists `pinnedVideos`, `priorityPinIds`, and `followerPinIds`.

**Pin Types:**
- **Normal Pins**: 
  - Persist until manually removed (no expiration).
  - Displayed in the regular pins grid on the Pins Page.
  - Icon: Single blue pin (filled).
  - **Auto-unpin on completion**: Removed when video reaches ≥85% progress.
- **Priority Pins**: 
  - Persist until manually removed (no expiration).
  - Typically displayed prominently (e.g., top-right of playlist menu).
  - Icon: Single amber pin (filled).
  - **Auto-unpin on completion**: Removed when video reaches ≥85% progress.
- **Follower Pins** (modifier):
  - Can be applied to either normal or priority pins.
  - Icon: Two pins stacked diagonally (blue for normal, amber for priority).
  - **Auto-transfer on completion**: When video reaches ≥85%, pin transfers to next chronological video in playlist instead of being removed.
  - Ideal for watching series - pin episode 1, and it automatically moves to episode 2 when you finish.

**Follower Pin Transfer Logic:**
- When video progress reaches ≥85%, `handleFollowerPinCompletion()` is called.
- If video is a follower pin:
  1. Finds the next video in the playlist (by position/index).
  2. Transfers the pin to the next video, preserving priority and follower status.
  3. Removes pin from completed video.
  4. Logs transfer to console: `[FollowerPin] Transferred pin from "Video A" to "Video B"`.
- If video is NOT a follower pin or is the last video, just unpins normally.

**User Interactions:**
- **Click unpinned** → Normal pin
- **Click normal pin** → Normal + Follower
- **Click follower pin** → Normal (removes follower)
- **Hold (>600ms)** → Priority pin
- **Double-click any pinned** → Unpin completely

**Dependencies:**
- When video pinned → VideoCard pin icon updates (blue=normal, amber=priority, double-pin=follower)
- When `pinnedVideos` changes → PinsPage re-renders → Shows pins in grid
- When `priorityPinIds` changes → Priority pin styling updates
- When `followerPinIds` changes → Follower icon (double-pin) appears
- When follower video completes → Pin transfers to next video → Console logs transfer

---

### 8. playlistGroupStore (`src/store/playlistGroupStore.js`)

**Purpose**: Persisted state for the group carousel system on the Playlists page. Each group is bound to one of 16 folder colors (`folderColorId`); at most one group per color. Playlists are assigned to groups (not stored in DB). See **group-carousel.md** and **playlist-bar.md** for full behavior.

**State:**
- `groups`: Array of `{ id, name, playlistIds, folderColorId }`
- `groupCarouselModes`: `{ [groupId]: 'large' | 'small' | 'bar' }`
- `activeGroupId`: `string | null` (entered-from group for Player Controller badge/nav)

**Actions:**
- `getGroupByColorId(colorId)`, `addGroup(name, folderColorId)`, `getNextAvailableColorId()`, `removeGroup(groupId)`, `renameGroup(groupId, name)`
- `addPlaylistToGroup(groupId, playlistId)`, `removePlaylistFromGroup(groupId, playlistId)`
- `isPlaylistInGroup(playlistId, groupId)`, `getGroupIdsForPlaylist(playlistId)`
- `setGroupCarouselMode(groupId, mode)`, `setAllGroupCarouselModes(mode)`, `setActiveGroupId(id)`

**Persistence:** localStorage key `playlist-group-storage`.

---

### 9. stickyStore (`src/store/stickyStore.js`)

**Purpose**: Manages sticky video state with folder-scoped persistence

**State:**
- `stickiedVideos`: Set - Set of strings in format `${playlistId}::${videoId}::${folderKey}` (internal state, exposed via selectors)

**Actions:**
- `toggleSticky(playlistId, videoId, folderId)` - Toggles sticky state for a video in a specific folder context
- `isStickied(playlistId, videoId, folderId)` - Checks if a video is stickied in a specific folder context
- `getStickiedVideoIds(playlistId, folderId)` - Returns array of video IDs stickied in that context
- `clearAllSticky()` - Clears all sticky states

**Persistence**: 
- Persisted to localStorage: `sticky-storage`
- Uses custom serialization/deserialization for the Set of strings

**Key Behaviors:**
- **Scoped Keys**: Stickiness is stored using a composite key: `${activePlaylistId}::${folderKey}`. This ensures a video can be stickied in the "Red" folder but not in the "Blue" folder or Root view.
- **Copy Semantics**: Sticky videos are treated as copies; they appear in the carousel but are NOT removed from the main grid list.
- **UnsortedExclusion**: Stickiness is disabled/hidden for the 'unsorted' folder view.

**Dependencies:**
- When `stickiedVideos` changes → `VideosPage` re-renders → Carousel updates and VideoCard menu items update

---

### 10. configStore (`src/store/configStore.js`)

**Purpose**: Manages application-wide configuration including themes and user profile

**State:**
- `currentThemeId`: string - ID of the active theme (e.g., 'nebula', 'sunset')
- `userName`: string - User's display name for banners (default: 'Boss')
- `userAvatar`: string - User's ASCII art avatar (default: '( ͡° ͜ʖ ͡°)')
- `customOrbImage`: string | null - Base64 encoded custom orb image
- `customBannerImage`: string | null - Base64 encoded custom app banner image
- `customPageBannerImage`: string | null - Base64 encoded custom page banner image
- `isSpillEnabled`: boolean - Master toggle for orb spill effect
- `orbSpill`: Object - Quadrant spill flags ({ tl, tr, bl, br })
- `orbImageScale`: number - Orb image zoom level (0.5 - 3.0)
- `orbImageXOffset`/`YOffset`: number - Orb image pan offsets
- `orbFavorites`: Array - Saved orb preset configurations, each with:
  - `id`: Unique identifier
  - `name`: Preset name
  - `customOrbImage`, `isSpillEnabled`, `orbSpill`, `orbImageScale`, `orbImageXOffset`, `orbImageYOffset`: Saved configuration
  - `folderColors`: Array of folder color IDs assigned to this preset
- `layer2Folders`: Array - Layer 2 image library folders, each with:
  - `id`: Unique identifier
  - `name`: Folder name
  - `images`: Array of image objects with scale, position, bgColor, destinations
  - `playlistIds`: Array of playlist IDs (empty = all playlists)
  - `condition`: Selection mode ('random' or null for first)
  - `folderColors`: Array of folder color IDs assigned to this folder
- `visualizerGradient`: boolean - Toggle for distance-based visualizer transparency (default: true)
- `visualizerSensitivity`: number - Global scaling factor for visualizer bars (default: 1.0)
- Legacy layout settings (deprecated/removed from UI but present in store structure)

**Actions:**
- `setCurrentThemeId(id)` - Sets the active application theme
- `setUserName(name)` - Sets the user's display name
- `setUserAvatar(avatar)` - Sets the user's ASCII avatar (supports multi-line)
- `setBannerPattern(pattern)` - Sets the video page banner pattern ('diagonal' | 'dots' | 'waves' | 'solid')
- `setPlayerBorderPattern(pattern)` - Sets the top player border/separator pattern ('diagonal' | 'dots' | 'waves' | 'solid')
- `setCustomBannerImage(dataUrl)` - Sets the app-wide top banner custom image
- `setCustomPageBannerImage(dataUrl)` - Sets the page banner custom image (Videos Page/Folders)
- `setVisualizerGradient(enabled)` - Toggles visualizer distance-based transparency fade
- `addOrbFavorite(favorite)` - Adds new orb preset to array
- `removeOrbFavorite(id)` - Removes orb preset by ID
- `applyOrbFavorite(favorite)` - Applies preset configuration to current orb settings
- `renameOrbFavorite(id, newName)` - Updates preset name
- `updateOrbFavoriteFolders(id, folderColors)` - Updates folder color assignments for an orb preset
- `addLayer2Folder(name)` - Creates new Layer 2 folder
- `removeLayer2Folder(folderId)` - Deletes Layer 2 folder
- `renameLayer2Folder(folderId, newName)` - Renames Layer 2 folder
- `updateLayer2FolderFolders(folderId, folderColors)` - Updates folder color assignments for a Layer 2 folder

**Persistence:**
- Persisted to localStorage: `config-storage`

**Dependencies:**
- When `currentThemeId` changes → App theme colors update globally
- When `userName` or `userAvatar` changes → `PageBanner` re-renders with new identity
- **Profile Customization**:
  - `SettingsPage` provides UI to update name and avatar.
  - Supports multi-line ASCII art (rendered in `<pre>` tag with 4px font).
  - Single-line ASCII art (like Lenny faces) is scaled larger.

---

## State Flow Patterns

### Pattern 1: Playlist Selection → Video Loading

1. User clicks playlist → `setPlaylistItems(items, playlistId)` called
2. `playlistStore` updates:
   - `currentPlaylistItems` = items
   - `currentPlaylistId` = playlistId
   - `currentVideoIndex` = restored from localStorage or 0
3. `VideosPage` detects change → Loads folder assignments
4. `YouTubePlayer` receives new video URL → Starts playing
5. Watch history recorded → `addToWatchHistory()` called

### Pattern 2: Folder Filtering

1. User clicks folder color → `setSelectedFolder(folderColor)` called
2. `folderStore.selectedFolder` updates
3. `VideosPage` detects change → Calls `getVideosInFolder(playlistId, folderColor)`
4. `displayedVideos` updates → Grid shows only folder videos
5. Folder assignments loaded → `loadVideoFolders(assignments)` updates store

### Pattern 3: Preview Navigation

1. User enters preview mode → `setPreviewPlaylist(items, playlistId, folderInfo)` called
2. `playlistStore` updates:
   - `previewPlaylistItems` = items
   - `previewPlaylistId` = playlistId
   - `previewFolderInfo` = folderInfo
3. `VideosPage` detects preview → Shows preview items instead of current items
4. User commits → `setPlaylistItems()` called with preview data → Preview cleared
5. User reverts → `clearPreview()` called → Returns to original state

### Pattern 4: Group Carousel Filtering

1. User clicks navigation options in TopNavigation → View switches between ALL / UNSORTED / GROUPS
2. `playlistGroupStore` state combined with currently loaded playlists determines rendering
3. `PlaylistsPage` detects change → Renders standard grid OR individual `GroupPlaylistCarousel` modules
4. Active view dynamically limits the scope of navigation possible within `PlayerController`

### Pattern 5: Bulk Tagging

1. User enters bulk tag mode → `setBulkTagMode(true)` called
2. `folderStore.bulkTagMode` updates
3. VideoCard/TweetCard show BulkTagColorGrid strip below thumbnail/title; grid displays current assignments (from `videoFolderAssignments`)
4. User clicks a color → Same assign/unassign as 3-dot menu; `assignVideoToFolder()` / `unassignVideoFromFolder()` and `setVideoFolders()` called immediately (instant assign)
5. Folder view refreshes if viewing that folder; checkmarks and border reflect current state
6. User toggles Bulk Tag off → `setBulkTagMode(false)`, `clearBulkTagSelections()`

---

## Store Relationships

### Dependency Graph

```
layoutStore (viewMode)
    ↓
navigationStore (currentPage)
    ↓
App.jsx (renders pages)
    ↓
playlistStore (currentPlaylistItems)
    ↓
VideosPage / YouTubePlayer
    ↓
folderStore (selectedFolder, videoFolderAssignments)
    ↓
VideoCard (folder indicators)
```

### Cross-Store Dependencies

1. **playlistStore ↔ folderStore**:
   - When playlist changes → Folder assignments loaded → `folderStore.videoFolderAssignments` updated
   - When folder selected → `folderStore.selectedFolder` → VideosPage filters `playlistStore.currentPlaylistItems`

2. **playlistGroupStore ↔ playlistStore**:
   - When playlist active → Group bounds checked → Up/down navigation restricted to group bounds if applicable

3. **layoutStore ↔ navigationStore**:
   - When page changes in full mode → `layoutStore.setViewMode('half')` auto-called

---

## Persistence Strategy

### Database Persistence
- Playlist data (playlists, playlist_items, video_folder_assignments)
- Watch history (watch_history)
- Video progress (video_progress)
- Sticky folders (stuck_folders)

### localStorage Persistence
- `quickAssignFolder` - Quick assign folder preference
- `showColoredFolders` - Folder display toggle
- `pin-storage` - Pin state (pinnedVideos, priorityPinIds, followerPinIds)
- `last_video_index_{playlistId}` - Last video index per playlist
- `shuffled_order_{playlistId}` - Shuffled order per playlist
- `last_video_index_{playlistId}_{folderColor}` - Last video index per folder
- `playback_time_{videoId}` - Quick access playback time (non-authoritative)

### Session-Only State
- `layoutStore` - All state resets on app restart
- `navigationStore` - Resets to 'playlists' on app start
- `folderStore.bulkTagMode` - Resets on mode exit
- `folderStore.bulkTagSelections` - Cleared on mode exit

Note: `pinStore` (pinnedVideos, priorityPinIds, followerPinIds) is now persisted to localStorage (`pin-storage`) and survives app restarts.

---

## Common Patterns

### Pattern: Reading from Store
```javascript
const { currentPlaylistItems, currentVideoIndex } = usePlaylistStore();
```

### Pattern: Updating Store
```javascript
const { setCurrentVideoIndex } = usePlaylistStore();
setCurrentVideoIndex(newIndex);
```

### Pattern: Conditional Updates
```javascript
const { setPlaylistItems } = usePlaylistStore();
if (items.length > 0) {
  setPlaylistItems(items, playlistId);
}
```

### Pattern: Store-Dependent State
```javascript
const currentPlaylistItems = usePlaylistStore(state => state.currentPlaylistItems);
const [displayedVideos, setDisplayedVideos] = useState([]);

useEffect(() => {
  // React to store changes
  setDisplayedVideos(currentPlaylistItems);
}, [currentPlaylistItems]);
```

---

## Best Practices

1. **Use stores for global state** - Don't prop-drill deeply nested state
2. **Keep stores focused** - Each store manages one domain (playlists, folders, tabs, etc.)
3. **Persist user preferences** - Use localStorage for UI preferences (views, quick assign, etc.)
4. **Sync with database** - Data stores should sync with database, not duplicate it
5. **Clear session state** - Session-only state (pins, bulk selections) should clear appropriately
6. **Handle loading states** - Components should handle store state being empty/loading

---

## Troubleshooting

### State Not Updating
- Check if component is subscribed to store: `usePlaylistStore()` not just `usePlaylistStore.getState()`
- Check if store action is actually called
- Check console for errors in store actions

### Persistence Not Working
- Check localStorage quota (may be full)
- Check if key name matches between save/load
- Check if JSON parsing/serialization is working

### State Out of Sync
- Check if multiple stores need updating for one action
- Check if database operations completed before updating store
- Check if preview state needs clearing

