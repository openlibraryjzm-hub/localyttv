PROJECT TREE:



###1: Advanced Player Controller

The Advanced Player Controller is a comprehensive UI component positioned at the top of the application layout. It provides centralized control for playlist navigation, video playback, folder management, and preview functionality through an orb-based design with surrounding menu rectangles.

---

#### ### 1.1 Central Orb

**1: User-Perspective Description**

The Central Orb is a circular element (154px diameter by default) positioned at the center of the PlayerController. Users see:
- **Orb Image**: Displays the current video's thumbnail by default, or a custom uploaded image if set. The image is clipped to a circular shape with optional "spill" effects that allow the image to extend beyond the circle boundaries in configurable quadrants (top-left, top-right, bottom-left, bottom-right).
- **Upload Button**: On hover, an upload icon appears at the top of the orb (12 o'clock position). Clicking opens a file picker to upload a custom image. The uploaded image is immediately displayed and persisted to localStorage.
- **Orb Buttons**: Eight buttons appear around the orb on hover, positioned in a radial pattern:
  - **Editor** (Scissors icon) - Currently no action
  - **Search** (Search icon) - Currently no action
  - **Menu** (Menu icon) - Currently no action
  - **Spill** (Maximize2 icon) - Toggles spill/clipping mode
  - **Channel** (Youtube icon) - Currently no action
  - **Config** (Settings icon) - Opens configuration panel for adjusting orb and menu positioning
  - **History** (Clock icon) - Navigates to History page
  - **Clipping** (Circle/Minimize2 icon) - Toggles spill/clipping mode (same as Spill)
- **Spill Toggle**: When enabled, the orb image can extend beyond the circular boundary. Users can configure which quadrants allow spill via the config panel. The spill state is persisted to localStorage (`isSpillEnabled`).
- **Config Panel**: When Config button is clicked, a settings panel appears (left or right side, toggleable) with sliders for:
  - Orb image scaling (master, width %, height %)
  - Orb image offsets (X, Y)
  - Spill quadrant toggles
  - All menu positioning values

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1408-1450): Orb rendering, image display, upload button, orb buttons, spill/clipping logic
- `src/components/PlayerController.jsx` (lines 1662-1734): Config panel with all adjustment sliders

**State Management:**
- `src/components/PlayerController.jsx` (local state):
  - `customOrbImage` (line 243): Base64 image data, persisted to localStorage
  - `isSpillEnabled` (line 1194): Boolean, persisted to localStorage
  - `spillMap` (line 1221): Object with `{ tl, tr, bl, br }` boolean flags for quadrant spill
  - `orbImageScale`, `orbImageScaleW`, `orbImageScaleH` (lines 1216-1218): Scaling values
  - `orbImageXOffset`, `orbImageYOffset` (lines 1219-1220): Position offsets
  - `isEditMode` (line 241): Controls config panel visibility
  - `isAdjustingImage` (line 245): Visual indicator when image is being adjusted

**API/Bridge:**
- No Tauri commands - all state is client-side

**Backend:**
- No database tables - uses localStorage only

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Image Upload Flow:**
   - User hovers over orb → Upload button appears (opacity transition)
   - User clicks upload button → `fileInputRef.current.click()` triggers file picker
   - User selects image → `handleImageUpload` (line 1117) reads file via FileReader
   - FileReader converts to base64 → `setCustomOrbImage(imageDataUrl)` updates state
   - `useEffect` (line 260) watches `customOrbImage` → Saves to `localStorage.setItem('customOrbImage', imageDataUrl)`
   - On component mount, `useEffect` (line 248) loads from localStorage → `setCustomOrbImage(savedOrbImage)`

2. **Spill Toggle Flow:**
   - User clicks Spill/Clipping button → `setIsSpillEnabled(!isSpillEnabled)` (line 1294)
   - `useEffect` (line 1209) watches `isSpillEnabled` → Saves to `localStorage.setItem('isSpillEnabled', isSpillEnabled.toString())`
   - On mount, `useEffect` (line 1197) loads from localStorage → `setIsSpillEnabled(savedSpillState === 'true')`
   - Spill state controls CSS `clipPath` application (line 1309-1312) - when enabled, allows image to extend beyond circle

3. **Image Display Logic:**
   - Source priority: `customOrbImage` (if set) → `playlistImage` (current video thumbnail) → fallback placeholder
   - Image rendered with `clipPath: 'url(#orbClipPath)'` (line 1415) which applies circular clipping + spill quadrants
   - When spill enabled: Image scales by `orbSize * orbImageScale * orbImageScaleW/H` and translates by offsets
   - When spill disabled: Image uses `objectFit: 'cover'` at 100% size

**Source of Truth:**
- `customOrbImage` state in PlayerController component (local state, persisted to localStorage)
- `isSpillEnabled` state in PlayerController component (local state, persisted to localStorage)
- `spillMap` state controls which quadrants allow spill (not persisted, resets on reload)

**State Dependencies:**
- When `customOrbImage` changes → Orb image source updates → Image re-renders
- When `isSpillEnabled` changes → ClipPath SVG updates → Image clipping behavior changes
- When `spillMap` changes → ClipPath SVG rect elements update → Specific quadrants allow/disallow spill
- When `orbImageScale*` or `orbImageXOffset/YOffset` change → Image transform style updates → Image position/size changes

---

#### ### 1.2 Top Video Menu

The Top Video Menu is the right rectangle in the PlayerController, displaying video information and controls for the currently playing video.

##### ### 1.2.1 Pins

**1: User-Perspective Description**

Users see a horizontal track of pinned video thumbnails at the top of the video menu rectangle:
- **Pin Track**: A horizontal scrollable area displaying rectangular thumbnails (40px × 30px) of pinned videos. The track spans from an anchor point to a plus button position (configurable via config panel).
- **Pin Thumbnails**: Each pinned video shows its YouTube thumbnail. On hover, a small X button appears in the top-right corner to unpin.
- **Eye Toggle Button**: A toggle button (eye icon when visible, eye-off when hidden) controls pin visibility. Located at the left edge of the track.
- **Active Pin Indicator**: The currently playing video's pin is highlighted with a ring and scale effect.
- **Hover Preview**: On hover over a pin, after 2 seconds a preview image appears (currently shows tab preview image, functionality may be incomplete).
- **Click Behavior**: Clicking a pin switches playback to that video. If the video is in the current playlist, it navigates within the playlist. If not, it searches all playlists to find and load the containing playlist.

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1459-1489): Pin track rendering, thumbnail display, eye toggle button

**State Management:**
- `src/store/pinStore.js`: Global pin state (session-only, no persistence)
  - `pinnedVideos`: Array of video objects
  - `togglePin(video)`: Adds/removes video from pins
  - `isPinned(videoId)`: Checks if video is pinned
- `src/components/PlayerController.jsx` (local state):
  - `showPins` (line 199): Boolean controlling pin visibility
  - `previewPinIndex` (line 200): Index of pin being previewed (for hover preview)
  - `activePin` (line 202): ID of currently active pin

**API/Bridge:**
- No Tauri commands - pins are session-only

**Backend:**
- No database tables - pins are not persisted

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Pin a Video:**
   - User clicks pin icon on video card → `togglePin(video)` called from `VideoCard.jsx`
   - `pinStore.togglePin` checks if video already pinned → If not, adds to `pinnedVideos` array
   - PlayerController reads `pinnedVideos` from `usePinStore()` (line 130) → Re-renders pin track
   - Pins converted to display format (line 1274-1279): `{ id, icon, video, index }`

2. **Click Pin to Play:**
   - User clicks pin thumbnail → `handlePinClick(pinnedVideo)` (line 754)
   - Function searches `currentPlaylistItems` for video → If found, sets index and calls `onVideoSelect`
   - If not in current playlist → Loops through `allPlaylists`, loads each playlist's items, searches for video
   - When found → `setPlaylistItems(items, playlist.id)`, `setCurrentVideoIndex(foundIndex)`, `onVideoSelect(video_url)`

3. **Toggle Pin Visibility:**
   - User clicks eye toggle button → `setShowPins(!showPins)` (line 1458)
   - When `showPins` is false → Pin track hidden, eye-off icon displayed
   - No persistence - resets to `true` on component mount

**Source of Truth:**
- `pinStore.pinnedVideos` - Array of pinned video objects (session-only)

**State Dependencies:**
- When `pinnedVideos` changes → Pin track re-renders with new thumbnails
- When `currentVideoIndex` changes → Active pin highlight updates (finds pin matching current video)
- When `showPins` changes → Pin track visibility toggles, eye icon changes

---

##### ### 1.2.2 Like, Shuffle, Colored Folders

**1: User-Perspective Description**

Users see a bottom toolbar in the video menu rectangle with five action buttons:

- **Previous/Next Video Buttons**: Chevron left/right buttons navigate to previous/next video in the current playlist. Position is configurable via config panel.
- **Mode Switcher Button**: A toggle button displaying "1" or "2" indicating which player is active (main or second). Clicking switches control between players. The button is a rounded rectangle with a sliding circle indicator.
- **Shuffle Button**: A circular button with shuffle icon. The button's border color reflects the "quick shuffle" setting:
  - White border = shuffle from all videos
  - Colored border = shuffle from that folder color
  - Right-click opens color picker to set quick shuffle default
  - Left-click shuffles to random video from selected folder (or all videos)
- **Grid Button**: Opens the Videos page grid view. Icon: Grid3X3.
- **Star Button**: A circular button with star icon for folder assignment:
  - **Filled star with colored border** = video belongs to that folder color
  - **Empty star with colored outline** = video not in folder, outline shows "quick assign" default color
  - Left-click assigns/unassigns video to quick assign folder
  - Right-click opens color picker to set quick assign default
- **Like Button**: A circular button with thumbs-up icon:
  - **Filled with blue** = video is liked (in "Likes" playlist)
  - **Empty/outline** = video not liked
  - Clicking toggles like status, adds/removes from special "Likes" playlist

**Color Picker Modal**: When star or shuffle button is right-clicked, a modal appears showing:
- 16 colored circles (one per folder color) + "All" option for shuffle
- Current selection highlighted with thicker black border
- Hover shows color name
- Left-click on color: For star = assigns video, for shuffle = shuffles from that folder
- Right-click on color: Sets as default quick assign/shuffle color
- Close button (X) in top-right

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1492-1639): Video menu toolbar, buttons, color picker modal
- `src/components/PlayerController.jsx` (lines 1008-1115): Star, shuffle, and like click handlers, color picker logic

**State Management:**
- `src/components/PlayerController.jsx` (local state):
  - `quickAssignColor` (line 234): Folder color ID for star button, persisted to localStorage
  - `quickShuffleColor` (line 237): Folder color ID or 'all' for shuffle button, persisted to localStorage
  - `currentVideoFolders` (line 235): Array of folder colors assigned to current video
  - `isVideoLiked` (line 240): Boolean indicating if current video is liked
  - `likesPlaylistId` (line 239): ID of special "Likes" playlist
  - `showColorPicker` (line 231): 'star' | 'shuffle' | null - controls color picker visibility
  - `hoveredColorName` (line 232): Color name shown on hover
- `src/store/folderStore.js`: Folder assignment state (not used directly here, but related)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `assignVideoToFolder(playlistId, itemId, folderColor)` - Assigns video to folder
  - `unassignVideoFromFolder(playlistId, itemId, folderColor)` - Removes folder assignment
  - `getVideoFolderAssignments(playlistId, itemId)` - Gets video's folder assignments
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos in a folder (for shuffle)
  - `checkIfVideoInPlaylist(playlistId, videoId)` - Checks if video is in playlist (for likes)
  - `addVideoToPlaylist(playlistId, videoUrl, videoId, title, thumbnailUrl)` - Adds video to playlist
  - `removeVideoFromPlaylist(playlistId, itemId)` - Removes video from playlist
  - `getPlaylistItems(playlistId)` - Gets all videos in playlist
  - `createPlaylist(name, description)` - Creates new playlist

**Backend:**
- `src-tauri/src/commands.rs`: Tauri command handlers
- `src-tauri/src/database.rs`: SQLite operations
- Database tables:
  - `video_folder_assignments`: Stores folder assignments (playlist_id, item_id, folder_color)
  - `playlist_items`: Stores videos in playlists
  - `playlists`: Stores playlist metadata

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Star Button (Folder Assignment) Flow:**
   - User left-clicks star → `handleStarClick()` (line 1009)
   - Gets `currentVideo` and `currentPlaylistId` → Calls `getVideoFolderAssignments` to check current folders
   - If video already assigned to `quickAssignColor` → Calls `unassignVideoFromFolder` → Updates `currentVideoFolders` state
   - If video not assigned → Calls `assignVideoToFolder` → Updates `currentVideoFolders` state
   - Star button appearance updates based on `currentVideoFolders` (line 1608-1628)
   - User right-clicks star → `setShowColorPicker('star')` → Color picker modal appears
   - User left-clicks color in picker → `handleColorSelect(hex, colorId, false)` → Calls `handleStarClick(colorId)` to assign
   - User right-clicks color in picker → `handleColorSelect(hex, colorId, true)` → `setQuickAssignColor(colorId)` → Saves to localStorage

2. **Shuffle Button Flow:**
   - User left-clicks shuffle → `handleShuffle()` (line 668)
   - Checks `isModeLeft` to determine active player (main or second)
   - If `quickShuffleColor === 'all'` → Uses all videos from current playlist
   - If `quickShuffleColor` is a folder → Calls `getVideosInFolder(playlistId, quickShuffleColor)`
   - Picks random video from filtered list → Sets video index → Calls `onVideoSelect(video_url)`
   - User right-clicks shuffle → `setShowColorPicker('shuffle')` → Color picker appears with "All" option
   - User selects color → Similar flow to star, but sets `quickShuffleColor` and shuffles from that folder

3. **Like Button Flow:**
   - On component mount → `initLikesPlaylist()` (line 362) checks if "Likes" playlist exists
   - If not exists → `createPlaylist('Likes', 'Videos you have liked')` → Stores `likesPlaylistId`
   - On video change → `checkIfLiked()` (line 383) checks if current video is in Likes playlist
   - Calls `getPlaylistItems(likesPlaylistId)` → Searches for matching `video_id` → Sets `isVideoLiked`
   - User clicks like button → `handleLikeClick()` (line 1049)
   - If video is liked → Finds item in Likes playlist → `removeVideoFromPlaylist(likesPlaylistId, itemId)`
   - If video not liked → `addVideoToPlaylist(likesPlaylistId, videoUrl, videoId, title, thumbnailUrl)`
   - Updates `isVideoLiked` state → Button appearance updates (line 1636)

4. **Quick Assign/Shuffle Color Persistence:**
   - On mount → `useEffect` (lines 271, 292) loads from localStorage → `setQuickAssignColor(saved)`, `setQuickShuffleColor(saved)`
   - On change → `useEffect` (lines 283, 304) saves to localStorage → `localStorage.setItem('quickAssignColor', quickAssignColor)`

**Source of Truth:**
- `quickAssignColor` / `quickShuffleColor`: PlayerController local state (persisted to localStorage)
- `currentVideoFolders`: PlayerController local state (refreshed from API on video change)
- `isVideoLiked`: PlayerController local state (refreshed from API on video change)
- Database: `video_folder_assignments` table (folder assignments), `playlist_items` table (likes playlist)

**State Dependencies:**
- When `currentVideo` changes → `useEffect` (line 344) loads folder assignments → `setCurrentVideoFolders(folders)` → Star button appearance updates
- When `currentVideo` changes → `useEffect` (line 383) checks like status → `setIsVideoLiked(isLiked)` → Like button appearance updates
- When `quickAssignColor` changes → Star button outline color updates (line 1610)
- When `quickShuffleColor` changes → Shuffle button border color updates (line 1580-1582)
- When folder assignment changes → `currentVideoFolders` updates → Star button switches between filled/empty

---

#### ### 1.3 Top Playlist Menu

**1: User-Perspective Description**

Users see a left rectangle in the PlayerController displaying playlist information and navigation controls:

- **Playlist Header**: At the top of the rectangle, a toggle button cycles through three display modes:
  - **Info Mode** (default): Shows playlist name (or folder name if viewing a folder) in a styled text bar
  - **Tabs Mode**: Shows horizontal list of user-created tabs with navigation arrows. Active tab highlighted. Clicking a tab switches to that tab.
  - **Presets Mode**: Shows horizontal list of tab presets with navigation arrows. Active preset highlighted. Clicking a preset loads that preset.
- **Playlist Image**: The rectangle background shows the current video's thumbnail (not the playlist thumbnail). The image is blurred and used as a backdrop.
- **Playlist Capsule**: A bottom-right capsule control with three buttons:
  - **Previous Playlist** (left chevron): Navigates to previous playlist/folder in navigation hierarchy
  - **Grid Button** (center circle): Opens Playlists page grid view
  - **Next Playlist** (right chevron): Navigates to next playlist/folder in navigation hierarchy
- **Preview Navigation Controls**: When in preview mode, commit/revert buttons appear to the left of the rectangle:
  - **Commit Button** (green checkmark): Applies preview changes, actually switches to previewed playlist/video
  - **Revert Button** (red X): Cancels preview, returns to original playlist/video
- **Alt Navigation Buttons**: Vertical buttons to the left of the rectangle:
  - **Up Arrow**: Previous playlist in preview mode (doesn't change actual player)
  - **Down Arrow**: Next playlist in preview mode (doesn't change actual player)

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1322-1404): Playlist menu rectangle, header modes, capsule controls
- `src/components/PlayerController.jsx` (lines 562-665): Playlist navigation handlers (`handleNextPlaylist`, `handlePreviousPlaylist`)
- `src/components/PlayerController.jsx` (lines 787-834): Tab/preset navigation (`navigateTabs`, `navigatePlaylist`)
- `src/components/PlayerController.jsx` (lines 1000-1006): Header mode toggle (`handleToggleHeader`)

**State Management:**
- `src/store/playlistStore.js`:
  - `navigationItems`: Flat array of playlists and folders for navigation
  - `currentNavigationIndex`: Current position in navigationItems
  - `currentPlaylistId`: ID of currently loaded playlist
  - `currentFolder`: `{ playlist_id, folder_color }` or null if viewing playlist
  - `allPlaylists`: Array of all playlists
  - `nextPlaylist()`, `previousPlaylist()`: Navigation functions
- `src/store/tabStore.js`:
  - `tabs`: Array of tab objects
  - `activeTabId`: Currently active tab ID
  - `setActiveTab(tabId)`: Switches active tab
- `src/store/tabPresetStore.js`:
  - `presets`: Array of preset objects
  - `activePresetId`: Currently active preset ID
  - `setActivePreset(presetId)`: Switches active preset
- `src/components/PlayerController.jsx` (local state):
  - `activeHeaderMode` (line 204): 'info' | 'tabs' | 'presets'
  - `activeLeftPin` (line 203): Currently selected tab/preset ID in header
  - `previewTabImage` (line 201): Preview image for tabs (currently unused)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getAllPlaylists()` - Gets all playlists
  - `getPlaylistItems(playlistId)` - Gets videos in playlist
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos in folder
  - `getAllFoldersWithVideos()` - Gets all folders with video counts
  - `getAllStuckFolders()` - Gets stuck folders

**Backend:**
- `src-tauri/src/commands.rs`: Tauri command handlers
- `src-tauri/src/database.rs`: SQLite operations
- Database tables:
  - `playlists`: Playlist metadata
  - `playlist_items`: Videos in playlists
  - `stuck_folders`: Stuck folder assignments

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Playlist Navigation Flow:**
   - User clicks next/prev playlist buttons → `handleNextPlaylist()` or `handlePreviousPlaylist()` (lines 563, 615)
   - Calls `nextPlaylist()` or `previousPlaylist()` from `playlistStore` → Returns `{ type: 'playlist'|'folder', data: ... }`
   - If type is 'playlist' → `getPlaylistItems(playlist.id)` → `setPlaylistItems(items, playlist.id, null)`
   - If type is 'folder' → `getVideosInFolder(folder.playlist_id, folder.folder_color)` → `setPlaylistItems(items, playlist.id, folderInfo)`
   - Restores last video index from localStorage → `localStorage.getItem('last_video_index_${playlistId}')`
   - Calls `onPlaylistSelect(items, playlistId)` → Updates parent component
   - Calls `onVideoSelect(video_url)` with first/last viewed video

2. **Header Mode Toggle Flow:**
   - User clicks header toggle button → `handleToggleHeader()` (line 1000)
   - Cycles through: 'info' → 'tabs' → 'presets' → 'info'
   - When switching to 'tabs' → `useEffect` (line 313) ensures `activeLeftPin` is set to `activeTabId`
   - When switching to 'presets' → `useEffect` ensures `activeLeftPin` is set to `activePresetId`
   - Header rendering switches based on `activeHeaderMode` (lines 1343-1393)

3. **Tab/Preset Navigation Flow:**
   - User clicks left/right arrows in tabs/presets mode → `navigateTabs(dir)` (line 787)
   - Finds current tab/preset index in array → Calculates next/prev index with wrap-around
   - Sets `activeLeftPin` to new tab/preset ID
   - If in tabs mode → `setActiveTab(tabId)` → Updates `tabStore.activeTabId` → Saves to localStorage
   - If in presets mode → `setActivePreset(presetId)` → Updates `tabPresetStore.activePresetId` → Saves to localStorage

4. **Navigation Items Loading:**
   - On mount and when `showColoredFolders` changes → `useEffect` (line 144) loads navigation items
   - Gets all playlists → `getAllPlaylists()`
   - Gets stuck folders → `getAllStuckFolders()`
   - If `showColoredFolders` is true → Gets all folders → `getAllFoldersWithVideos()`
   - Calls `buildNavigationItems(playlists, folders)` → Creates flat array: [Playlist1, Playlist1-FolderA, Playlist1-FolderB, Playlist2, ...]
   - Sets `navigationItems` in store → Used for next/prev navigation

**Source of Truth:**
- `playlistStore.navigationItems` - Flat array of playlists and folders (Source of Truth for navigation)
- `playlistStore.currentNavigationIndex` - Current position in navigation array
- `tabStore.activeTabId` - Currently active tab (persisted to localStorage)
- `tabPresetStore.activePresetId` - Currently active preset (persisted to localStorage)

**State Dependencies:**
- When `showColoredFolders` changes → Navigation items reload → Folders added/removed from navigation array
- When `activeTabId` changes → PlaylistsPage filters playlists by tab → Only playlists in active tab shown
- When `activePresetId` changes → Tab preset system loads preset → Applies tab configuration
- When playlist navigation occurs → `currentNavigationIndex` updates → Header title updates to show current playlist/folder name
- When `navigationItems` changes → Next/prev navigation uses new array → Navigation wraps around correctly

---

#### ### 1.4 Previewer Menus

**1: User-Perspective Description**

Users can preview playlists and videos without interrupting current playback through dedicated preview controls:

- **Playlist Preview Controls** (left side of PlayerController):
  - **Up/Down Arrow Buttons**: Navigate through playlists/folders in preview mode. The previewed playlist name appears in the header, but the actual player doesn't change.
  - **Commit Button** (green checkmark): Appears when preview is active. Clicking commits the preview, actually switching to the previewed playlist and starting playback.
  - **Revert Button** (red X): Appears when preview is active. Clicking cancels the preview, returning to the original playlist.
- **Video Preview Controls** (right side of PlayerController):
  - **Up/Down Arrow Buttons**: Navigate through videos in the current playlist in preview mode. The previewed video title appears, but playback doesn't change.
  - **Commit Button** (green checkmark): Appears when preview is active. Clicking commits the preview, switching to the previewed video.
  - **Revert Button** (red X): Appears when preview is active. Clicking cancels the preview, returning to the original video.
- **Visual Feedback**: When in preview mode, the playlist title and video title in the menus show preview information instead of current playback information. The preview state is indicated by the presence of commit/revert buttons.

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1324-1336): Playlist preview controls (alt nav buttons, commit/revert)
- `src/components/PlayerController.jsx` (lines 1644-1657): Video preview controls (alt nav buttons, commit/revert)
- `src/components/PlayerController.jsx` (lines 836-998): Preview navigation handlers (`handleAltNav`, `handleCommit`, `handleRevert`)

**State Management:**
- `src/store/playlistStore.js`:
  - `previewPlaylistItems`: Array of videos in previewed playlist (null when not previewing)
  - `previewPlaylistId`: ID of previewed playlist (null when not previewing)
  - `previewFolderInfo`: `{ playlist_id, folder_color }` or null (for folder previews)
  - `setPreviewPlaylist(items, playlistId, folderInfo)`: Sets preview state
  - `clearPreview()`: Clears preview state
- `src/components/PlayerController.jsx` (local state):
  - `playlistCheckpoint` (line 223): Original navigation index before preview started
  - `videoCheckpoint` (line 224): Original video index before preview started
  - `previewNavigationIndex` (line 226): Previewed navigation index
  - `previewVideoIndex` (line 227): Previewed video index
  - `previewPlaylistId` (line 228): Local preview playlist ID (merged with store preview)
  - `previewFolderInfo` (line 229): Local preview folder info (merged with store preview)
  - `previewPlaylistItems` (line 230): Local preview playlist items (merged with store preview)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getPlaylistItems(playlistId)` - Gets videos for previewed playlist
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos for previewed folder

**Backend:**
- No direct database writes during preview - preview is read-only until commit

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Playlist Preview Flow:**
   - User clicks playlist alt nav up/down → `handleAltNav('up'|'down', 'playlist')` (line 837)
   - If `playlistCheckpoint === null` → Initializes checkpoint: `setPlaylistCheckpoint(currentNavigationIndex)`, `setPreviewNavigationIndex(currentNavigationIndex)`
   - Calculates next/prev index in `navigationItems` array → `setPreviewNavigationIndex(nextIndex)`
   - Gets preview item from `navigationItems[nextIndex]`
   - If item is playlist → `getPlaylistItems(item.data.id)` → `setPreviewPlaylistItems(items)`, `setPreviewPlaylistId(item.data.id)`
   - If item is folder → `getVideosInFolder(item.data.playlist_id, item.data.folder_color)` → Sets preview items and folder info
   - Playlist title in header shows preview playlist name (line 490-498)
   - User clicks commit → `handleCommit('playlist')` (line 910)
   - Loads preview playlist items → `setPlaylistItems(previewPlaylistItems, previewPlaylistId, null)`
   - Updates `currentNavigationIndex` in store to match preview
   - Calls `onPlaylistSelect` and `onVideoSelect` → Actually switches playback
   - Clears all preview state → `setPreviewNavigationIndex(null)`, etc.
   - User clicks revert → `handleRevert('playlist')` (line 893) → Clears all preview state, returns to checkpoint

2. **Video Preview Flow:**
   - User clicks video alt nav up/down → `handleAltNav('up'|'down', 'video')` (line 876)
   - If `videoCheckpoint === null` → Initializes checkpoint: `setVideoCheckpoint(currentIndex)`, `setPreviewVideoIndex(currentIndex)`
   - Calculates next/prev index in `currentPlaylistItems` → `setPreviewVideoIndex(nextIdx)`
   - Video title shows preview video (line 1254-1271 uses `displayVideoItem` which prioritizes preview)
   - User clicks commit → `handleCommit('video')` (line 984)
   - Sets `currentVideoIndex` to `previewVideoIndex` → `setCurrentVideoIndex(previewVideoIndex)`
   - Calls `onVideoSelect(video.video_url)` → Actually switches playback
   - Clears preview state
   - User clicks revert → `handleRevert('video')` (line 903) → Clears preview state

3. **Preview State Merging:**
   - Component uses both local preview state and store preview state (line 403-405)
   - `activePreviewItems = storePreviewItems || previewPlaylistItems` - Store preview takes priority
   - This allows previews to be set from other components (e.g., PlaylistsPage preview button)
   - When store preview is active, local preview is ignored

**Source of Truth:**
- `playlistStore.previewPlaylistItems`, `previewPlaylistId`, `previewFolderInfo` - Store preview state (can be set from external components)
- Local `previewNavigationIndex`, `previewVideoIndex`, etc. - Component preview state (for internal preview navigation)
- `playlistCheckpoint`, `videoCheckpoint` - Original state before preview started

**State Dependencies:**
- When `previewNavigationIndex` changes → Playlist title updates to show preview playlist name
- When `previewVideoIndex` changes → Video title updates to show preview video name
- When preview is active → Commit/revert buttons appear → User can commit or cancel
- When preview is committed → `currentPlaylistItems`, `currentVideoIndex` update → Playback actually changes
- When preview is reverted → Preview state cleared → Display returns to original playlist/video

---

#### ### 1.5 2-Player Support on Menus (Faulty)

**1: User-Perspective Description**

[NEEDS IMPLEMENTATION] The PlayerController has infrastructure for dual player support, but the implementation is marked as faulty. Users should see:

- **Mode Switcher Button**: A toggle in the video menu toolbar showing "1" or "2" to indicate active player. Currently implemented but behavior may be inconsistent.
- **Player-Specific Info**: When in mode 2, the video menu should show second player's video info instead of main player's info. Currently attempts to do this but may show incorrect information.
- **Player-Specific Controls**: All video controls (next/prev, shuffle, star, like) should route to the appropriate player based on active mode. Currently implemented but may have routing issues.

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 98, 407-477): Dual player mode detection and video info selection
- `src/components/PlayerController.jsx` (lines 512-560): Video navigation handlers with player routing
- `src/components/PlayerController.jsx` (lines 667-726): Shuffle handler with player routing
- `src/components/PlayerController.jsx` (lines 1568): Mode switcher button rendering

**State Management:**
- `src/components/PlayerController.jsx` (props):
  - `activePlayer`: 1 (main) or 2 (second) - passed from parent
  - `onActivePlayerChange`: Callback to update active player in parent
  - `secondPlayerVideoUrl`: Current video URL for second player
  - `secondPlayerVideoIndex`: Index of current video in second player's playlist
  - `secondPlayerPlaylistId`: ID of playlist containing second player's video
  - `secondPlayerPlaylistItems`: Array of videos in second player's playlist
- `src/components/PlayerController.jsx` (local state):
  - `isModeLeft` (line 205): Boolean - true for player 1, false for player 2
  - Synced with `activePlayer` prop (line 208-212)

**API/Bridge:**
- No additional API calls - uses existing playlist/video APIs

**Backend:**
- No additional database tables

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Mode Toggle Flow:**
   - User clicks mode switcher → `handleModeToggle()` (line 215)
   - Toggles `isModeLeft` → Calls `onActivePlayerChange(newMode ? 1 : 2)`
   - Parent component (`App.jsx`) updates `activePlayer` state
   - Component re-renders with new mode → Video info switches to appropriate player

2. **Video Info Selection (Faulty):**
   - Logic attempts to determine active video based on `hasSecondPlayerVideo` (line 410)
   - `hasSecondPlayerVideo = !isModeLeft && secondPlayerVideoUrl` - Checks mode 2 and video exists
   - Attempts to find video in `secondPlayerPlaylistItems` or falls back to `currentPlaylistItems`
   - **Issue**: May not correctly identify second player's video if playlist items aren't loaded
   - **Issue**: Fallback logic may show main player info when it should show second player info

3. **Control Routing (Faulty):**
   - All handlers check `isModeLeft` to route to appropriate player
   - `handleNextVideo()` (line 512): Routes to `nextVideo()` for player 1, or `onSecondPlayerVideoIndexChange` for player 2
   - `handleShuffle()` (line 668): Uses `secondPlayerPlaylistItems` when in mode 2
   - **Issue**: Routing may not correctly maintain second player's playlist context
   - **Issue**: Second player navigation may affect main player state

**Source of Truth:**
- `activePlayer` prop from parent (`App.jsx`) - Controls which player is active
- `secondPlayerVideoUrl`, `secondPlayerPlaylistId`, `secondPlayerPlaylistItems` props - Second player state from parent
- Local `isModeLeft` state - Synced with `activePlayer` prop

**State Dependencies:**
- When `activePlayer` changes → `isModeLeft` updates → Video info display switches
- When `secondPlayerVideoUrl` changes → `hasSecondPlayerVideo` recalculates → Video info may update
- When `secondPlayerPlaylistItems` changes → Video lookup uses new array → Video info may update
- **Known Issues**: State dependencies may not trigger correctly, causing incorrect video info display

###2: Playlist & Tab Manangement
	> ### 2.1 Playlists 
	> ### 2.2 Colored Folders
	> ### 2.3 Tabs
	> ### 2.4 Tab Presets

###3: Importing/Exporting
	> ### 3.1 Import Playlist
	> ### 3.2 Bulk Import
	> ### 3.3 Local Upload/Streaming (Upcoming)

###4: UI
	> ### 4.1 Side Menu
		> ### 4.1.1 Playlists Page
			> ### 4.1.1.1 Playlist Cards
		> ### 4.1.2 Videos Page
			> ### 4.1.2.1 Videos Card
		> ### 4.1.3 History Page

###5: History
	> ### 5.1 Watch-time Tracking


###6: Video Player
	> ### 6.1 Main Player
	> ### 6.2 Secondary Player
	> ### 6.3 Main/Secondary Player Swapping (Upcoming)

###7: Debugging/Testing Features
	> ### 7.1 Layout Debug Mode
	> ### 7.2 Inspect Element Mode



