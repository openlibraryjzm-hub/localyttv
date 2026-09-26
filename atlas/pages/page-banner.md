
The Page Banner is a contextual banner component displayed at the top of content pages (Videos, Playlists, Likes, Pins, etc.). It provides rich metadata, visual identity, and seamless integration with the Sticky Toolbar system.

**Related Documentation:**
- **Pages**: See `ui-pages.md` for pages that use Page Banner (Videos, Playlists, Likes, Pins)
- **Layout**: See `ui-layout.md` for layout system details
- **App Banner**: See `app-banner.md` for the top-level application banner
- **Settings**: See `ui-pages.md` Section 4.1.8 for banner pattern and customization options

---

#### ### Page Banner Overview

**Current Implementation: Mini Header (Active)**

The dynamic `PageBanner` component is currently **disabled** in `VideosPage.jsx` and `PlaylistsPage.jsx`. Its functionality has been replaced by a streamlined **Mini Header** implemented centrally in **`src/components/TopNavigation.jsx`**.

**Mini Header Features:**
- **Component**: `TopNavigation.jsx` (serves as the global contextual header).
- **Height**: `min-h-[100px]`.
- **Layout**: Flex-end alignment (`items-end`) for title positioning. Content uses `pl-8` / `pr-8` for inset; when gradient is shown, the **gradient spans full width** of the side menu in splitscreen (no horizontal padding on the header container; see `LayoutShell.css` `.layout-shell__mini-header` with `padding: 8px 0` and App.jsx miniHeader wrapper without `px-4`).
- **Videos page**: When current page is Videos, the mini header shows only the playlist/folder title (and description). **Add**, **Subscriptions**, and **Bulk Tag** (and **Back**, **Close**) are no longer in TopNavigation; they live in the **Videos page sticky toolbar** (left of prism: Add, Refresh, Bulk tag; right: Back, Close). layoutStore flags drive modals/refresh; VideosPage opens them and clears one-shot flags.
- **Context Awareness**: Detects **Visiting** context (previewing a playlist) vs. **Playing** context; prioritizes "Visiting" so the header matches what the user is looking at.
- **Styling**: Background = linear gradient (transparent → 30% opacity of active folder/playlist/unsorted color). Typography = large bold title with drop shadow; title color matches active context hex.
- **Sticky Toolbar Relationship**: The Sticky Toolbar (in `VideosPage`/`PlaylistsPage`) sits directly below the mini header. On the Videos page, **Add**, **Refresh** (subscriptions), and **Bulk tag** are in the sticky toolbar (left of the folder prism); **Back** and **Close** are on the far right. TopNavigation does not show these when on Videos page.

---

**Legacy Feature: Full Page Banner (Currently Disabled)**

The following documentation describes the full `PageBanner` component which is currently commented out in the codebase but remains available for future reactivation.

**1: User-Perspective Description (Legacy)**

Users see a contextual banner (220px fixed height) at the top of scrollable content areas on various pages:

- **Location**: Appears on all pages: Videos Page, Playlists Page, Likes Page, Pins Page, History Page, PagePage, OrbPage, YouPage, AppPage, and Colored Folder views
- **Dynamic Content**: Displays contextual information based on current view:
  - **Videos Page**: Shows playlist name, folder name (e.g., "Red Folder"), custom folder name, or "Unsorted Videos"
  - **Playlists Page**: Shows active tab preset name (e.g. "Gaming") or tab name
  - **Likes Page**: Shows "Liked Videos" with playlist badges and pagination badge
  - **History Page**: Shows "History" with playlist badges
  - **Pins Page**: Shows "Pinned Videos"
  - **Visual Elements**:
    - **Header Above Thumbnail** (centered at top of thumbnail section):
      - **Position**: Absolutely positioned at top of thumbnail container, 1px above page banner top edge
      - **Width**: 320px (matches thumbnail width)
      - **Styling**: Dynamic styling based on current context:
        - **Default**: White background, Black text, Black border (`border-2 border-black`)
        - **Unsorted Videos**: Black background, white text (`text-white`)
        - **Colored Folder**: Folder's color background, White text (`text-white`), Black border
      - **Content**: Displays current playlist name or colored folder name
      - **Text**: Bold, colored text (black or white) matching theme, centered
    - **Sticky Toolbar Integration**:
      - **Elements**: Sort Dropdown, Bulk Tag Buttons, Add Button
      - **Styling**: Reverted to high-contrast White background, Black text, Black border (`border-2 border-black`) for consistency with app theme
    - **Title**: Compact, bold text (`text-lg md:text-xl`) with dark text shadow for readability, no bottom margin (`mb-0`) - sized to fit snugly above thumbnail
  - **Description**: Displayed when provided (not hidden by default)
    - **Position**: To the right of thumbnail area (`ml-[170px] mt-[7px]`)
    - **Lines**: Up to 6 lines (`line-clamp-6`) for long descriptions
  - **Playlist Badges**: Interactive badges showing playlists (History/Likes pages)
    - **Styling**: text-white/80, font-medium, text-sm md:text-base
    - **Left Click**: Filters page content to that playlist
    - **Right Click**: Navigates to Videos page for that playlist
    - **Limit**: 2 rows with expand button (>>>) to show all
  - **Pagination Badge**: Compact pagination controls (Likes page)
    - Format: `<< < 1/99 > >>` (First, Previous, Current/Total, Next, Last)
  - **Media Carousel** (centered in Layer 1 area): Shows continue watching, pinned videos, and/or ASCII signature
    - **Continue Video**: Thumbnail of most recently watched video (click to resume)
    - **Pinned Videos**: Thumbnail of pinned video(s) in current playlist
    - **ASCII Signature**: User's ASCII art (from Settings → Signature)
    - **Tab Presets List** (Playlists Page): Interactive list of tab presets replacing the carousel
    - **Thumbnail Size**: `h-[180px] w-[320px]` (180px × 320px) - matches video card width for visual consistency
    - **Pin Type Badge** (on pinned thumbnails): Top-left badge showing pin type:
      - **Styling**: `bg-black/60 backdrop-blur-sm border border-white/10` with "PINNED" text label
      - **Content**: Displays "PINNED" label + icons:
        - **Normal Pin**: White pin icon
        - **Follower Pin**: White pin icon + → arrow
        - **Priority Pin**: 👑 crown + golden pin icon
        - **Priority Follower Pin**: 👑 crown + golden pin icon + → arrow
    - **Continue Badge** (on continue thumbnail): Top-left badge showing status:
      - **Styling**: `bg-black/60 backdrop-blur-sm border border-white/10`
      - **Content**: "CONTINUE" (standard) or "CURRENTLY PLAYING" (if active video matches current player video)
    - **Hover Navigation**:
      - **Header Navigation Strips**: Hover over header to reveal left/right gradient strips for playlist preview navigation
      - **Thumbnail Navigation Strips**: Hover over thumbnail to reveal left/right gradient strips for pin navigation (when viewing pins with multiple pins)
      - **Bottom Labels**: Hover over thumbnail to reveal "Recent", "Pins", and "Presets" (Playlists page) labels
    - **Horizontal Pin Bar**: When multiple pins exist (max 10 segments), a horizontal segmented bar appears at the top of the thumbnail
      - **Position**: Absolutely positioned at top of thumbnail (`top: 0px`), overlapping the thumbnail edge
      - **Width**: `w-[320px]` (matches thumbnail width)
      - **Folder Colors**: Each segment colored by the pin's folder assignment
      - **Priority Crown**: Priority pin segment has crown-like clip-path and golden color (`#FFD700`)
      - **Selection Dot**: Horizontal white dot indicator below the bar (golden for priority pin)
      - **Height**: `h-3` (12px tall)
    - **Positioning**: Centered horizontally within banner area (332px width) at `bottom-[25px]` (25px up from bottom)
  - **Navigation Controls on Page Banner**: Streamlined navigation with hover-based interactions
    - **Bottom-Left Corner** (`bottom-2 left-2`): Single navigation group
      - **Page Navigator**: Pagination controls (only shown on Videos page when multiple pages exist)
         - Clickable page indicator (e.g., "1/99") that allows direct page navigation
         - Previous/Next buttons for page navigation
    - **Styling**: All button groups use glassmorphic backdrop (`bg-black/40 backdrop-blur-md`) with white text and borders
    - **Size**: `w-6 h-6` compact buttons with `px-3 py-2` container padding
- **Banner Structure**: The page banner is now a compact 332px-wide transparent component containing only the content (thumbnail/ASCII previews, buttons, title, etc.)
  - **Banner Width**: Fixed at 332px (previously the "Layer 1 overlap" area)
  - **No Background/Border**: Banner has no background color or border - completely transparent, showing only content
  - **Content Only**: Contains title, navigation buttons, thumbnail/ASCII carousel, and other controls
- **Background Options**:
  - **Color Gradients**: Vibrant gradients matching folder color (when viewing folders)
  - **Animated Patterns**: CSS-based patterns (Diagonal, Dots, Mesh, Solid) when no custom image
- **Layer 2 Image**: Positioned to the right of the banner, extending to fill remaining width
  - **Position**: Sits to the right of the 332px banner, no Layer 1 background behind it, positioned 25px up from natural position (`-mt-[25px]`)
  - **Width**: `calc(100% - 332px)` - fills remaining space to the right
  - **Height**: Matches banner height (220px or dynamic based on content)
  - **Border**: Fixed border around entire Layer 2 container (`4px solid rgba(0,0,0,0.8)`) with shadow effects
  - **Overflow**: `overflow-hidden` clips scaled images at top/bottom borders
  - **Independent Rendering**: Layer 2 is rendered separately without Layer 1 background
  - **Scale, X Position, Y Position**: Independent controls via Settings → Appearance → Page Banner
  - **Transparent Background**: Layer 2 renders on transparent background (no Layer 1 color behind it)
  - **Navigation Overlay**: All navigation buttons overlaid on top of Layer 2 image with glassmorphic styling
    - **Hover Controls**: Search button and Settings button (opens Edit Modal) appear on hover
- **Unified Banner System**: When custom image is set, the banner visually connects with the Sticky Toolbar below it using synchronized horizontal scroll animation (can be disabled via Settings)
  - Layer 2 images are managed via Settings → Appearance → Page Banner (no inline thumbnail strip)
- **Theme Folder System**: Folders can be set as app-wide page banner themes that apply to all pages
- **Folder Conditions**: Folders support "Random" condition for random image selection on each page entry
- **Image Destinations**: Images can be assigned to specific pages (Videos, Playlists, Likes, History, Pins) and colored folders for targeted display
- **Smooth Transitions**: Fade transitions between images when navigating between pages/folders

**2: File Manifest**

**UI/Components:**
- `src/components/PageBanner.jsx`: Main banner component with all content and styling logic
- `src/components/UnifiedBannerBackground.jsx`: GPU-accelerated background layer for custom images
- `src/components/VideosPage.jsx`: Uses PageBanner for playlist/folder context
- `src/components/PlaylistsPage.jsx`: Uses PageBanner for playlist overview
- `src/components/LikesPage.jsx`: Uses PageBanner with playlist badges and pagination badge
- `src/components/HistoryPage.jsx`: Uses PageBanner with playlist badges
- `src/components/PinsPage.jsx`: Uses PageBanner for pinned videos header
- `src/components/PagePage.jsx`: Uses PageBanner for Page Banner configuration page
- `src/components/OrbPage.jsx`: Uses PageBanner for Orb configuration page
- `src/components/YouPage.jsx`: Uses PageBanner for Signature & Profile configuration page
- `src/components/AppPage.jsx`: Uses PageBanner for App configuration page

**State Management:**
- `src/store/configStore.js`:
  - **Layer 1 (Background Color):**
    - `pageBannerBgColor`: Hex color string for background (default '#1e293b' slate-800)
  - **Layer 2 (Overlay Image):**
    - `customPageBannerImage2`: Base64 string of uploaded Layer 2 image (null = no overlay)
    - `pageBannerImage2Scale`: Scale percentage for Layer 2 (50-200%, default 100)
    - `pageBannerImage2XOffset`: X position percentage for Layer 2 (0-100%, default 50)
    - `pageBannerImage2YOffset`: Y position percentage for Layer 2 (0-100%, default 50)
  - **Layer 2 Image Folders System:**
    - `layer2Folders`: Array of folder objects `{ id, name, images[], playlistIds[], isThemeFolder, condition }` - default folder is "Default"
      - `playlistIds`: Array of playlist IDs this folder appears on (empty = all playlists)
      - `isThemeFolder`: Boolean flag indicating if this folder is set as the app-wide theme
      - `condition`: Folder-wide selection mode - `'random'` for random selection on each page entry, `null` for first image (default)
      - Each image in `images[]` stores: `{ id, image, scale, xOffset, yOffset, bgColor, destinations, createdAt }`
        - `destinations`: Object with `{ pages: [], folderColors: [] }` or `null` for all destinations
          - `pages`: Array of page types: `'videos'`, `'playlists'`, `'likes'`, `'history'`, `'pins'`
          - `folderColors`: Array of folder color IDs: `'red'`, `'blue'`, `'yellow'`, etc.
          - If `null` or empty arrays, image appears on all pages/folders
    - `selectedLayer2FolderId`: ID of currently selected folder (default: 'default')
    - `setSelectedLayer2FolderId(id)`: Sets the selected folder
    - `themeFolderId`: ID of the folder set as app-wide theme (null if no theme folder)
    - `setThemeFolder(folderId)`: Sets a folder as the app-wide theme (applies to all pages)
    - `clearThemeFolder()`: Removes the theme folder setting
    - `addLayer2Folder(name)`: Creates a new folder with optional name
    - `removeLayer2Folder(folderId)`: Deletes a folder (cannot delete 'default', clears theme if deleting theme folder)
    - `renameLayer2Folder(folderId, newName)`: Renames a folder
    - `setLayer2FolderPlaylists(folderId, playlistIds)`: Sets which playlists a folder appears on (empty = all)
    - `setLayer2FolderCondition(folderId, condition)`: Sets folder-wide selection mode (`'random'` or `null` for first)
    - `playlistLayer2Overrides`: Object mapping `playlistId` → `{ imageId, folderId, image, scale, xOffset, yOffset, bgColor }`
      - Stores reference (imageId, folderId) to look up current values from library
      - Also stores fallback values in case image is deleted from library
    - `setPlaylistLayer2Override(playlistId, imageConfig)`: Sets the Layer 2 image override for a specific playlist
    - `clearPlaylistLayer2Override(playlistId)`: Removes the override (falls back to theme folder or Default folder)
    - `addLayer2Image(folderId, image)`: Adds image with config to folder (includes bgColor from current pageBannerBgColor)
    - `removeLayer2Image(folderId, imageId)`: Removes image from folder
    - `updateLayer2Image(folderId, imageId, updates)`: Updates image config
    - `applyLayer2Image(image)`: Applies saved image as Layer 2 (sets customPageBannerImage2 + scale/offsets + loads bgColor)
  - **Unified Banner State:**
    - `bannerHeight`: Current banner height (reported by PageBanner for Sticky Toolbar alignment)
    - `setBannerHeight(height)`: Updates banner height in store
    - `setBannerBgSize(size)`: Updates background size calculation
- `src/store/folderStore.js`:
  - Folder color information for gradient generation
- Database (for custom folder banners):
  - `folder_metadata.custom_ascii`: Custom ASCII art for folders
  - Custom banner images stored per playlist/folder in `folder_metadata` (future)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getFolderMetadata(playlistId, folderColor)` - Gets custom folder names and ASCII art
  - `updateFolderMetadata(playlistId, folderColor, metadata)` - Updates folder metadata including custom banners

**Backend:**
- `src-tauri/src/database.rs`:
  - `folder_metadata` table: Stores custom folder names, descriptions, and ASCII art
  - Future: May store custom banner images per folder/playlist

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Banner Rendering Flow:**
   - Page component (VideosPage, PlaylistsPage, etc.) determines banner context
   - Calculates banner props:
     - **Title**: Playlist name, folder name, or page name
     - **Description**: Playlist/folder description or default text
     - **Folder Color**: Current folder color (if viewing folder)
     - **Video Count**: Number of videos in current view
     - **Avatar**: Custom ASCII art from folder metadata or user signature
   - Passes props to `<PageBanner />` component
   - `PageBanner.jsx` renders with appropriate styling

2. **Background Rendering Flow:**
   - Component uses `pageBannerBgColor` from `configStore` as solid background color (Layer 1)
   - **Layer 2 (Overlay)** - Priority order:
     1. **Settings Page Preview** (no currentPlaylistId): Uses global `customPageBannerImage2` with global scale/offset (highest priority for preview)
     2. **Theme Group Leader**: If a group leader is set as theme, selects image from that group (app-wide) - NEW
     3. **Theme Folder**: If a folder is set as theme, selects image from that folder (app-wide) - Legacy
     4. **Playlist Override**: Per-playlist override (assigned via PagePage/Colors Tab) takes precedence above all Global Theme settings.
       - **Persistent Context**: Applies across all playlist views including "All Videos", "Unsorted", and **Specific Colored Folders**.
       - **Override Behavior**:
         - **Name Resolution**: Uses robust playlist name lookup (ID-based) to ensure override sticks even when viewing sub-folders (where title changes).
         - **Content Priority**: If the Override Folder has a specific image assigned to the current color (e.g., Red), it uses that.
         - **Fallback Defaults**: If no specific color assignment exists, it defaults to **Random Selection** from the override folder (unless folder is strictly sequential).
         - **Global Skip**: If a valid override folder is found, the Global Theme logic is completely skipped to prevent "leaking" back to the default theme.
     5. **Default Folder**: Falls back to image from Default folder
     - **Theme Group Leader Selection Logic**: When theme group leader is set, selects from group leader + all group members
       - **Destination Filtering**: Images are first filtered by their destination assignments
         - Images with `destinations.pages` only appear on those page types
         - Images with `destinations.folderColors` only appear when viewing those colored folders
         - Images with no destinations appear everywhere
       - **Random Selection**: Randomly selects from filtered available images (leader + members) based on pageKey for consistency
       - **Fallback**: If no images match destinations, uses all images in group (ignores destination filtering for theme)
     - **Image Selection Logic** (Theme Folder/Legacy): Within each folder, images are selected based on folder condition and image destinations:
       - **Destination Filtering**: Images are first filtered by their destination assignments
         - Images with `destinations.pages` only appear on those page types
         - Images with `destinations.folderColors` only appear when viewing those colored folders
         - Images with no destinations appear everywhere
       - **Random Condition**: If folder has `condition='random'`, randomly selects from filtered available images on each page entry
       - **Default/First**: If folder condition is `null`, uses first available image from filtered set
       - **Page Entry Detection**: Random selection triggers on every page entry (colored folder click, playlist navigation, page change)
       - **True Random**: Each page entry gets a fresh random selection (not based on page key)
     - If `effectiveLayer2Image` exists, renders via `UnifiedBannerBackground` component
     - Layer 2 applies its scale (auto height%) and position (X%, Y%) settings from saved image config
   - Shadow color derived from `pageBannerBgColor`

3. **Per-Playlist Layer 2 Selection Flow:**
   - User views a playlist's Videos page
   - Clicks an image in the Layer 2 thumbnail strip
   - Image is saved to `playlistLayer2Overrides[playlistId]`
   - That playlist now shows the selected Layer 2 image on future visits

4. **Sticky Toolbar Integration:**
   - `PageBanner` measures its height via `ResizeObserver`
   - Reports height to `configStore` via `setBannerHeight(height)`
   - Sticky Toolbar uses this height for seamless visual connection
   - When custom image is set, both banner and toolbar use `UnifiedBannerBackground` with synchronized animation

5. **Media Carousel Flow (Continue/Pinned/ASCII):**
   - Component receives `continueVideo` and `pinnedVideos` props, gets `userAvatar` from configStore
   - **Continue Video**: Most recently watched video in current playlist (from `videoProgress`)
   - **Pinned Videos**: All pinned videos that exist in current playlist (from `pinStore`)
     - Enriched with `folder_color`, `isPriority`, `isFollower` flags from VideosPage
     - Sorted with priority pin always first
   - **ASCII Signature**: User's ASCII art from Settings → Signature (from `configStore.userAvatar`)
   - **State Management**:
     - `activeThumbnail`: Index into `availableOptions` array (0, 1, or 2)
     - `availableOptions`: Dynamic array of available options ('continue', 'pinned', 'ascii')
     - `activePinnedIndex`: Which pin is currently displayed (when multiple)
   - **Display Logic**:
     - If only one option exists → Shows that option, no navigation arrows
     - If multiple options exist → Shows left/right arrow buttons on hover
     - If multiple pins → Shows vertical segmented bar absolutely positioned to the right of thumbnail (max 10)
     - ASCII option always available if `userAvatar` is set
   - **Arrow Navigation** (option navigation):
     - Left/right arrow buttons overlaid on thumbnail/ASCII area
     - Only visible on hover (`opacity-0 group-hover/thumb:opacity-100`)
     - Left arrow: Previous mode (cycles backward)
     - Right arrow: Next mode (cycles forward)
     - Full height strips (`h-36 w-8`) positioned absolutely on left/right edges
     - Semi-transparent black background with backdrop blur
   - **Vertical Pin Bar** (multi-pin navigation):
     - Fixed width (`w-3`), matches thumbnail height (`h-36`)
     - **Max 10 segments** - capped to prevent overflow
     - **Position**: Absolutely positioned to the right of thumbnail (`left: calc(50% + 120px + 4px)`, `bottom: 31px`)
     - **Folder-colored segments**: Each segment colored by pin's assigned folder (from `videoFolderAssignments`)
     - **Priority Crown**: First segment (if priority pin) has crown clip-path and golden `#FFD700` color
     - **Selection Indicator**: White dot to the right of bar (golden for priority pin)
     - Clicking a segment changes `activePinnedIndex` to show that pin
     - Positioned outside flex container to maintain uniform thumbnail width
   - **Pin Type Badge** (on pinned thumbnails):
     - Position: Top-left of thumbnail (`top-1 left-1`)
     - Background: `bg-black/60 backdrop-blur-sm`
     - Displays icons based on pin type: pin icon, crown emoji (priority), arrow (follower)
   - User clicks thumbnail → Calls `onContinue` or `onPinnedClick(video)` → Starts playing
   - User clicks ASCII area → No action (display only)
   - User left-clicks info button → Toggles `showInfo` state
   - User right-clicks info button → Opens edit modal (if `onEdit` provided)
   - **Positioning**: Centered horizontally within Layer 1 area at `bottom-1` with `left: 166px, transform: translateX(-50%)`

**Source of Truth:**
- `tabPresetStore` - Tab presets and active state (Playlists Page)
- `configStore.pageBannerBgColor` - Layer 1 background color (hex string)
- `configStore.customPageBannerImage2` - Layer 2 overlay image (for Settings page preview)
- `configStore.pageBannerImage2Scale/XOffset/YOffset` - Layer 2 positioning (for Settings page preview)
- `configStore.playlistLayer2Overrides` - Per-playlist Layer 2 image selections
- Database `folder_metadata` table - Custom folder banners and ASCII art (per folder)
- Database `playlists` table - Playlist descriptions and metadata
- Props passed from parent page component - Title, description, video count, folder color, playlist badges, customDescription
- Page component state - Filtered playlist state, pagination state (for badges and pagination badge)

**State Dependencies:**
- When `pageBannerBgColor` changes → Background color updates
- When `customPageBannerImage2` changes (Settings) → Layer 2 preview updates
- When `pageBannerImage2Scale/XOffset/YOffset` changes (Settings) → Layer 2 position/size updates in real-time
- When `playlistLayer2Overrides[playlistId]` changes → That playlist's banner Layer 2 updates
- When `folderColor` changes → Gradient colors update → Banner re-renders with new colors
- When banner height changes → `setBannerHeight` called → Sticky Toolbar adjusts positioning
- When custom image uploaded → Saved to database → Banner fetches and displays on next load
- When `playlistBadges` changes → Badge list updates → Badges re-render
- When `filteredPlaylist` changes → Badge highlighting updates → Filtered badge appears brighter
- When `customDescription` provided → Description text replaced with custom content (e.g., pagination badge)
- When `activePresetId` changes → Tab Presets selection updates

**4: Technical Implementation Details**

**Two-Layer Banner System:**
- **Layer 1 (Banner Background Color)**:
  - Simple solid color background from `pageBannerBgColor`
  - Fills the 332px-wide banner area only
  - Configurable via color picker with preset options in Settings
- **Layer 2 (Standalone Image)**:
  - Uses `UnifiedBannerBackground` component for image rendering
  - Positioned to the right of the banner, extending to fill remaining width
  - **No Layer 1 background**: Renders on transparent background (no background color behind it)
  - Per-playlist image selection with fallback to Default folder
  - Configurable scale (50-200%) and position (X: 0-100%, Y: 0-100%)
  - Height matches banner height dynamically

**Gradient Generation:**
- Folder colors mapped via `FOLDER_COLORS` utility
- Gradient formula: `linear-gradient(135deg, ${color}DD 0%, ${color} 100%)`
- Unsorted videos use slate/gray gradient: `linear-gradient(135deg, #64748b 0%, #475569 100%)`
- Default (no folder): Sky to Blue gradient

**Pattern Overlay:**
- CSS-based animated patterns when no custom image
- Patterns: Diagonal, Dots, Mesh, Solid
- Applied via `pattern-${bannerPattern}` class
- Patterns are CSS-only (no images required)

**Height Management:**
- Fixed height: `h-[220px]` (220px) for consistent layout
- `ResizeObserver` monitors actual rendered height
- Reports to `configStore` for Sticky Toolbar alignment
- Prevents layout jitter during content changes

**Content Layout:**
- **Banner Width**: Fixed at 332px (contains all banner content)
- **Transparent Background**: No background color or border - banner is completely transparent
- **Top-Aligned**: Content uses `items-start` for top-left alignment
- **Title**: Compact (`text-lg md:text-xl`), no bottom margin (`mb-0`), with navigation buttons on either side (Videos Page)
- **Description**: Positioned to the right of thumbnail (`ml-[170px] mt-[7px]`), displayed when provided
- **Media Carousel**: Centered horizontally within banner (332px width), positioned at `bottom-1` with `left: 166px, transform: translateX(-50%)`
- **Thumbnail Dimensions**: Uniform `h-36 w-[240px]` (144px × 240px) across all carousel modes
- **Arrow Navigation**: Left/right arrows overlaid on thumbnail/ASCII, visible on hover only
- **Layer 2 Position**: Renders to the right of the banner, filling remaining width (`calc(100% - 332px)`) with border and overflow clipping

**Media Carousel Component State:**
- `activeThumbnail`: Index into `availableOptions` array (0, 1, or 2)
- `availableOptions`: Array of available option types ('continue', 'pinned', 'ascii')
- `currentOption`: The currently selected option type
- `activePinnedIndex`: Index of currently displayed pin (0 to min(pinnedVideos.length, 10) - 1)
- `hasContinue`: Boolean - continue video exists
- `hasPinned`: Boolean - at least one pinned video exists
- `hasMultiplePins`: Boolean - more than one pinned video exists
- `hasAscii`: Boolean - ASCII signature is available (from `userAvatar` or `avatar` prop)
- `hasMultipleOptions`: Boolean - more than one option exists (shows arrow navigation on hover)
- `hasAnyOption`: Boolean - at least one option exists (shows the carousel)

**Layer 2 Image Management:**
- Layer 2 images are managed exclusively via Settings → Appearance → Page Banner
- **Override Hierarchy**: The banner image is selected based on the following priority (highest to lowest):
  1. **Orb Group Playlist Override**: If the current playlist is assigned to a saved Orb Group (via `playlistIds`), that group's image (or a random member's image) is enforced. This overrides ALL other settings.
  2. **Playlist Assignment (Layer 2 Folder)**: If a Layer 2 Folder is assigned to the current playlist (via Colors Tab), that folder is used.
  3. **Theme Folder**: If a folder is set as the app-wide Theme, it is used.
  4. **Default Folder**: Falls back to the 'Default' folder.

- **Orb Group Playlist Overrides**:
  - **Purpose**: Enforces a specific cohesive visual theme (Wallpaper + Orb Image) for specific playlists (e.g., "Horror" playlist always gets "Horror Theme").
  - **Configuration**: Set in the **Orb Page > Presets** tab by assigning playlists to Orb Groups.
  - **Player Sync**: The central Orb Menu also respects this override.

- **Theme Folder System**: Folders can be set as app-wide themes
  - **Set as Theme**: Click "Set Theme" button on any folder with images to apply it app-wide
  - **App-Wide Application**: Theme folder's images apply to all pages (Videos, Playlists, Likes, Pins, etc.)
  - **Visual Indicator**: Theme folders show a golden "Theme" badge with star icon
  - **Priority**: Theme folder is checked first, but playlist-specific overrides take precedence for that playlist
  - **Clear Theme**: Click "Theme" button again to remove theme (falls back to Default folder)
- **Folder Conditions**: Each folder has a condition that determines how images are selected
  - **Random Condition**: Folders with `condition='random'` randomly select from available images on each page entry
    - **Page Entry Triggers**: Random selection happens on every page entry (colored folder click, playlist navigation, page change)
    - **True Random**: Each page entry gets a fresh random selection (not deterministic)
    - **Visual Indicator**: Random folders show an amber "Random" badge with shuffle icon next to folder name
    - **Filtered Selection**: Only images matching current page/folder destinations are eligible
  - **Default/First Condition**: Folders with `condition=null` always use the first available image in the folder
  - **Setting Conditions**: Click the "First"/"Random" button next to folder name to set folder condition
    - Options: "First (Default)" or "Random"
    - Dropdown shows current selection and allows toggling between modes
  - **Playlist Assignments**: Folders can be assigned to specific Playlists.
    - **Function**: When a user visits an assigned playlist, this folder becomes the active "Theme Override".
    - **Persistence**: The override applies to all tabs within that playlist (All, Unsorted, Colored Folders).
    - **Setting**: Managed via the "Playlist Assignment" dropdown in the **Colors Tab** of PagePage.
- **Image Destinations**: Each image can be assigned to specific pages and colored folders
  - **Destination Assignment**: Click the map pin button (top-left of image thumbnail) to assign destinations
  - **Pages**: Select which page types the image appears on:
    - Videos, Playlists, Likes, History, Pins
    - If none selected, image appears on all pages
  - **Colored Folders**: Select which folder colors the image appears on:
    - All 16 folder colors (Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink)
    - If none selected, image appears on all folders (or when no folder is selected)
  - **Visual Indicator**: Images with destinations show a blue map pin badge (top-right)
  - **Clear Destinations**: Click "Clear All Destinations" to make image appear everywhere
  - **Priority**: Destination filtering happens before folder condition (random/first) selection
- **Per-Playlist Layer 2 Selection**: Each playlist remembers its selected Layer 2 image reference
  - **Default**: First image from Default folder is shown for all playlists initially (if no theme)
  - **Override**: Image selection stored in `playlistLayer2Overrides` with reference IDs and fallback values
  - **Live Updates**: When viewing a playlist, the banner looks up current image values from the library (scale, position, bgColor)
  - **Paired Background Color**: Each library image stores its own background color (set via "Paired Background Color" in Settings)
  - **Persistence**: Selection stored in `playlistLayer2Overrides` with reference IDs and fallback values

**Pinned Video Data (from VideosPage):**
- `folder_color`: First folder color assigned to this video (for pin bar segment coloring)
- `isPriority`: Boolean - whether this is the priority pin (crown treatment)
- `isFollower`: Boolean - whether this is a follower pin (arrow indicator)

**PageBanner Props for Thumbnail Carousel:**
- `continueVideo`: Video object for continue watching feature
- `onContinue`: Callback when continue thumbnail is clicked
- `pinnedVideos`: Array of pinned video objects in current playlist, enriched with:
  - `folder_color`: Folder color ID for pin bar segment coloring
  - `isPriority`: Boolean for priority pin (golden crown treatment)
  - `isFollower`: Boolean for follower pin (arrow indicator)
- `onPinnedClick(video)`: Callback when pinned thumbnail is clicked (receives selected video)
- `avatar`: Optional ASCII art prop (fallback, `userAvatar` from configStore takes priority)
- `showAscii`: Boolean (default: `true`) - Controls whether ASCII signature option appears in media carousel. Set to `false` to hide ASCII art option.

**PageBanner Props for Orb Controls (OrbPage):**
- `orbControls`: Object with compact orb configuration controls for banner display:
  - `customOrbImage`: Current orb image (Base64 string or null)
  - `isSpillEnabled`: Boolean indicating if spill is enabled
  - `onImageUpload`: Callback for image file upload (receives FileReader event)
  - `onToggleSpill`: Callback to toggle spill on/off (receives event)
  - `onRemoveImage`: Callback to remove current orb image
  - When provided, displays compact orb controls on left side of banner (image preview, spill toggle, remove button)

**PageBanner Props for Playlist Navigator (Videos Page):**
- `onNavigateNext`: Callback for up chevron (next playlist)
- `onNavigatePrev`: Callback for down chevron (previous playlist)
- `onReturn`: Callback for return button (returns to reset point playlist)
- `showReturnButton`: Boolean - when true, return button icon is black (active); when false, grey (inactive)

**5: Page-Specific Usage**

**Videos Page:**
- Displays playlist name or folder name as title (compact `text-lg md:text-xl`)
- **Playlist Preview Navigator**: Positioned above the title for playlist navigation
  - **Previous Button** (left): Navigates to previous playlist in preview mode
  - **Return Button** (middle, when previewing): Returns to reset point playlist (only shown when previewing)
  - **Next Button** (right): Navigates to next playlist in preview mode
  - **Styling**: All buttons have black icons (`w-6 h-6`)
  - **Preview Mode**: Navigation uses `setPreviewPlaylist` so player continues unaffected
  - **Reset Point Tracking**: Entering from PlaylistsPage or controller sets a "reset point"
  - **State**: Uses `resetPointId` state and `isChevronNavRef` ref to track navigation source
- Description shows to the right of thumbnail when provided
- **Thumbnail Carousel**: Shows continue watching, pinned videos, and/or ASCII signature
  - **Uniform Size**: All thumbnails maintain `h-36 w-[240px]` (144px × 240px) regardless of mode
  - **Centered**: Positioned horizontally centered within banner (332px width)
  - **Arrow Navigation**: Left/right arrows appear on hover to cycle through modes (continue/pinned/ASCII)
- **Pin Type Badge**: When viewing pinned video, top-left badge shows pin type (normal/follower/priority/priority-follower)
- **Multi-Pin Bar**: Vertical bar with folder-colored segments, priority crown, and selection dot
  - **Position**: Absolutely positioned to the right of thumbnail (outside flex container)
  - **Alignment**: `bottom: 31px` to align with thumbnail area

**Playlists Page:**
- **Title**: Active preset name (e.g., "Gaming") or tab name
- **Tab Presets List**: Replaces Media Carousel with scrollable list of tab presets (click to activate)
- Shows total playlist count and total video count
- No edit button (playlist-level editing handled elsewhere)

**Likes Page:**
- Title: "Liked Videos"
- Playlist badges: Displays all unique playlists containing liked videos (excluding "Likes" itself)
- Pagination badge: Compact navigation controls (`<< < 1/99 > >>`) in place of description when multiple pages exist
- Badge interactions: Left-click to filter, right-click to navigate
- Filtering: When filtered, description updates to "Liked videos from '[Playlist Name]'"
- Badge limit: 2 rows with expand button (>>>) to show all playlists
- Custom description: Uses `customDescription` prop for pagination badge

**History Page:**
- Title: "History"
- Playlist badges: Displays all unique playlists containing videos from watch history
- Badge interactions: Left-click to filter, right-click to navigate
- Filtering: When filtered, description updates to "Videos from '[Playlist Name]'"
- Badge limit: 2 rows with expand button (>>>) to show all playlists

**Pins Page:**
- Title: "Pinned Videos"
- Standard metadata display
- No folder color (uses default gradient)

**6: Customization Options**

**Via EditPlaylistModal:**
**Via EditPlaylistModal:**
- **Location**: Available through right-clicking colored folders in the folder prism or playlist level context menus
- **Features**:
  - Rename playlist/folder
  - **Available**: For "Unsorted Videos" view (supports editing name)

**Via Settings:**
- **Location**: Settings → Appearance → Page Banner (first section at top of Appearance tab)
- **Two-Layer Controls**:
  - **Layer 1 (Default Fallback)**: Color picker with hex input and preset color buttons
    - Used when no paired color is saved with an image
    - Presets: Slate, Dark, Zinc, Indigo, Blue, Green, Red, Amber
  - **Layer 2 (Overlay)**: Upload, remove, and adjust scale/position (use transparent PNGs)
    - **Scale Slider**: 50% to 200% (controls image height, maintains aspect ratio)
    - **X Position Slider**: 0% (left) to 100% (right)
    - **Y Position Slider**: 0% (top) to 100% (bottom)
    - **Paired Background Color**: Color picker to set the background color that will be saved WITH this image config
    - **Thumbnail Preview**: Shows uploaded image
- **Live Preview**: Changes apply immediately to the actual Page Banner above the settings (no separate preview panel)
- **Layer 2 Image Library**: Multi-folder system for organizing Layer 2 images
  - **New Folder Button**: Creates additional folders for organization
  - **Folder Cards**: Each folder shows name (click to rename), image count, delete button (hover)
  - **Set as Theme Button**: Appears on folders with images - sets folder as app-wide page banner theme
    - **Golden Badge**: Theme folders display a golden "Theme" badge with star icon
    - **App-Wide**: Theme applies to all pages (Videos, Playlists, Likes, Pins, etc.)
    - **First Image**: Uses the first image from the theme folder
    - **Clear Theme**: Click "Theme" button again to remove theme setting
  - **Folder Condition Selector**: Button next to folder name to set folder-wide selection mode
    - **First (Default)**: Gray button - always uses first image in folder
    - **Random**: Amber button with shuffle icon - randomly selects from all images on each page entry
    - **Visual Indicator**: Random folders show amber "Random" badge with shuffle icon
    - **Condition Dropdown**: Click button to toggle between "First (Default)" and "Random"
  - **Image Grid**: Thumbnails of saved images in each folder
    - **Click**: Loads image into editor (also loads its paired background color)
    - **Hover**: Shows delete button
    - **Color Indicator**: Small colored dot (bottom-right) shows paired background color
    - **Destination Button**: Map pin button (top-left) to assign pages and folder colors
      - **Blue Badge**: Shows when image has destination assignments
      - **Dropdown**: Select pages (Videos, Playlists, Likes, History, Pins) and folder colors
      - **Clear All**: Remove all destination assignments (image appears everywhere)
  - **Add Image**: Upload new images directly to a folder
  - **Save to This Folder**: Save current Layer 2 image with its scale/position/bgColor settings to folder
  - **Workflow**: Set desired background color → adjust image settings → click "Save to This Folder" to create new entry
  - **Active Badge**: Shows which folder is currently selected in PageBanner strip

**Visual Customization:**
- **ASCII Signature**: Set via Settings → Signature, displayed in right-side carousel as "SIGNATURE" option
- **Author Name**: Set via Settings → Signature → Pseudonym
- **Folder Colors**: Automatically generate matching gradients

**Playlist Badges:**
- **Purpose**: Display interactive badges for playlists on History and Likes pages
- **Styling**: text-white/80, font-medium, text-sm md:text-base
- **Limit**: 2 rows maximum with expand button (>>>) to show all playlists
- **Interactions**:
  - **Left Click**: Filters page content to show only items from that playlist
  - **Right Click**: Navigates to Videos page for that playlist in preview mode
- **Filtered State**: Badge highlights with brighter background/border when active
- **Props**: `playlistBadges` (array), `onPlaylistBadgeLeftClick`, `onPlaylistBadgeRightClick`, `filteredPlaylist`

**Pagination Badge:**
- **Purpose**: Compact pagination controls for Likes page (replaces description text)
- **Format**: `<< < 1/99 > >>` (First, Previous, Current/Total, Next, Last)
- **Styling**: text-white/80, font-medium styling
- **Visibility**: Only shown when `totalPages > 1`
- **Props**: `customDescription` prop accepts React node to replace description text

---

#### ### Sticky Toolbar Integration

**1: Overview**

The Sticky Toolbar is a dynamic toolbar component that sits directly below the Page Banner and sticks to the top of the viewport when scrolling. It provides contextual controls and navigation while maintaining visual continuity with the Page Banner above it.

**2: Visual States & Transparency**

**Resting State (Not Stuck):**
- **Position**: Sits directly below Page Banner with `-mt-16` negative margin for seamless connection
- **Transparency**: Fully transparent background (`bg-transparent`, `backgroundColor: 'transparent'`)
- **Backdrop Blur**: Subtle blur (`backdrop-blur-[2px]`) for slight depth
- **Borders**: Thin borders on all sides (`border-b border-x border-t border-white/10`) with 10% white opacity
- **Rounded Corners**: Rounded bottom corners (`rounded-b-2xl`) matching Page Banner
- **Margins**: Horizontal margins (`mx-[22px]`) for wider visual width
- **Padding**: Minimal vertical padding (`pt-1 pb-0`)
- **Shadow**: Subtle shadow (`shadow-xl`)

**Stuck State (When Scrolled):**
- **Position**: Sticks to top of viewport (`sticky top-0`)
- **Transparency**: Semi-transparent dark background (`bg-slate-900/70` - 70% opacity dark slate)
- **Backdrop Blur**: Strong blur (`backdrop-blur-xl`) for glassmorphic effect
- **Borders**: Top and bottom borders only (`border-y`) with no side borders
- **Rounded Corners**: Square corners (`rounded-none`) for full-width appearance
- **Margins**: Full width (`mx-0`) when stuck
- **Padding**: Increased vertical padding (`pt-2 pb-2`)
- **Height**: Fixed height (`h-[52px]`) when stuck
- **Shadow**: Strong shadow (`shadow-2xl`) for depth

**Transition:**
- Smooth 500ms transition (`transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)`)
- All visual properties animate smoothly between states
- Z-index: `z-40` ensures toolbar stays above content

**3: Videos Page Sticky Toolbar Layout**

**Left Side - Sort, Folders & Navigation:**
- **Sort Dropdown** (Far Left): Compact sort selector with four options:
  - "Default" (shuffle order)
  - "Date" (chronological)
  - "Progress" (by watch progress)
  - "Last Viewed" (by last viewed timestamp - most recently viewed first)
  - Styled with dark background (`bg-slate-800/80`), small text (`text-[10px]`), uppercase, bold
- **All/Unsorted Prism**: A unified, prism-style container for the "All" and "Unsorted" toggles:
  - **Structure**: `border-2 border-black rounded-lg overflow-hidden`
  - **"All" Button**: White background (`bg-white`), Black text (`text-black`), Bold "ALL" label.
  - **"Unsorted" Button**: Black background (`bg-black`), White text (`text-white`), displays a simple "?" label.
- **Compact Folder Navigator**: Situated between the All/Unsorted prism and the Main Folder Prism.
  - **Function**: Cycles through colored folders (Prev/Next).
  - **Dynamic Styling**: Background color dynamically matches the currently selected folder (or All/Unsorted state).
  - **Icons**: Left/Right chevrons (`ChevronLeft`, `ChevronRight`).
- **Color Bar Prism**: A unified, stretchable horizontal bar displaying all 16 folder colors:
  - **Layout**: Flex container with `flex-1` to fill available space
  - **Structure**: Each folder color is a flex-1 button, creating equal-width segments
  - **Styling**: 
    - Black border (`border-2 border-black`) with rounded corners (`rounded-lg`)
    - Each segment uses the folder's hex color as background
    - Selected folder: Full opacity (`opacity-100`) with white ring indicator (`ring-2 ring-inset ring-white/50`)
    - Unselected folders: Reduced opacity (`opacity-60`) that increases on hover (`hover:opacity-100`)
  - **Video Count Display**:
    - **Condition**: Numbers only display when `count > 0` (folders with no videos show no number)
    - **Styling**: 
      - Text size: `text-sm` (small text)
      - Weight: `font-bold` (bold)
      - Color: `text-white/90` (90% opacity white for readability on colored backgrounds)
      - Shadow: `drop-shadow-md` (medium drop shadow for contrast)
    - **Positioning**: Centered both horizontally and vertically within each color segment using `flex items-center justify-center`
    - **Content**: Displays raw number (e.g., "5", "12", "0" - but 0 is hidden)
    - **Calculation**: Counts videos assigned to each folder from `videoFolderAssignments` data
    - **Update**: Recalculates via `useMemo` when `videoFolderAssignments` changes
  - **Tooltip**: Shows custom folder name (if renamed) or default color name, plus count on hover (e.g., "Gaming (5)" or "Red (5)") - uses `allFolderMetadata[color.id]?.name` with fallback to `color.name`
  - **First/Last**: First segment has `rounded-l-md`, last segment has `rounded-r-md`
  - **Click Action**: Clicking a color segment filters videos to that folder
- **Horizontal Scroll**: Left side uses `overflow-x-auto` with `mask-gradient-right` for fade-out effect on scroll

**Right Side - Action Controls:**
- **Bulk Tag Mode Toggle**: 
  - Icon: Tag/label SVG icon
  - Active state: Blue background (`bg-blue-600`), white text, shadow
  - Inactive state: Dark background (`bg-slate-800/80`), gray text, border
  - Toggles bulk tagging mode for selecting multiple videos
- **Add Button**: 
  - Icon: Plus SVG icon
  - Styled: Sky blue (`bg-sky-500`), white text, shadow with hover effects
  - Action: Opens Playlist Uploader modal (`setShowUploader(true)`)

**4: Playlists Page Sticky Toolbar Layout**

**Left Side - Tab Bar:**
- **TabBar Component**: Full-width tab navigation
- **Horizontal Scroll**: Uses `overflow-x-auto` with `mask-gradient-right` for fade-out
- **Tab Presets**: Integrated dropdown for managing tab presets

**Right Side - Control Cluster:**
- **Border Separator**: Vertical border (`border-l border-white/10`) separates controls from tabs
- **Global Info Toggle Button**:
  - Icon: Info SVG icon (Lucide `Info`)
  - Active state: Sky blue (`bg-sky-600`), white text, shadow
  - Inactive state: Dark background (`bg-slate-800/80`), gray text, border
  - Toggles video title overlays on ALL playlist/folder card thumbnails
  - State persisted to `localStorage` (`playlistsPage_globalInfoToggle`)
  - Tooltip: "Hide all video titles" / "Show all video titles"
- **Folder Toggle Button**:
  - Icon: Folder SVG icon
  - Active state: Sky blue (`bg-sky-600`), white text, shadow
  - Inactive state: Dark background (`bg-slate-800/80`), gray text, border
  - Toggles display of colored folders in the playlist grid
  - Tooltip: "Hide Folders" / "Show Folders"
- **Add Playlist Button**:
  - Icon: Plus SVG icon
  - Styled: Sky blue (`bg-sky-500`), white text, shadow with hover effects
  - Action: Opens Playlist Import modal (`setShowImportModal(true)`)

**5: Settings Page Sticky Toolbar Layout**

**Left Side - Navigation Buttons + Colored Prism:**
- **4 Navigation Buttons**: Horizontally aligned compact buttons:
  - **Orb**: Opens dedicated OrbPage (highlighted when active)
  - **You**: Placeholder for future functionality
  - **Page**: Placeholder for future functionality
  - **App**: Placeholder for future functionality
  - Styled: `bg-slate-800/80` with hover effects, active state uses `bg-sky-500`
- **Colored Prism Bar**: Unified horizontal bar displaying all 16 folder colors
  - **Layout**: Flex container with `flex-1` to fill available space
  - **Structure**: Each folder color is a flex-1 button, creating equal-width segments
  - **Styling**: 
    - Black border (`border-2 border-black`) with rounded corners (`rounded-lg`)
    - Each segment uses the folder's hex color as background
    - Unselected folders: Reduced opacity (`opacity-60`) that increases on hover (`hover:opacity-100`)
  - **Tooltip**: Shows folder color name on hover
  - **Functionality**: To be wired up (currently display-only)

**5: Background Sharing (Unified Banner System)**

**Current Implementation:**
- The Sticky Toolbar uses backdrop blur and transparency effects rather than directly sharing the Page Banner's background image
- When custom page banner image is set, the toolbar's transparent/glassmorphic styling allows the banner's visual style to show through
- The toolbar's background adapts based on stuck state (transparent when resting, semi-transparent dark when stuck)

**Visual Continuity:**
- `seamlessBottom` prop on PageBanner removes bottom border/rounded corners
- Toolbar uses negative margin (`-mt-16`) to visually connect with banner
- Both components use similar glassmorphic styling for visual harmony
- When stuck, toolbar's dark background (`bg-slate-900/70`) provides contrast while maintaining transparency

**Future Enhancement:**
- Planned: Direct background sharing using `UnifiedBannerBackground` component
- Would enable synchronized horizontal scroll animation between banner and toolbar
- Would create true seamless visual connection with GPU-accelerated animation

**6: Technical Details**

**Sticky Detection:**
- Uses `IntersectionObserver` with a sentinel element (`stickySentinelRef`)
- Sentinel positioned at top of scrollable area
- When sentinel leaves viewport, `isStuck` state becomes `true`
- Triggers visual state transition in toolbar

**Z-Index Layering:**
- Toolbar: `z-40` (above content, below modals)
- Content: Default z-index
- Page Banner: Lower z-index (scrolls with content)

**Responsive Behavior:**
- Toolbar adapts height based on stuck state
- Content area adjusts padding to accommodate toolbar
- Horizontal scrolling for folder selector on smaller screens
- Mask gradient prevents hard scroll edge

**7: OrbPage Sticky Toolbar**

OrbPage includes its own sticky toolbar that persists when navigating from Settings Page:
- **Same Layout**: Matches Settings Page sticky toolbar (4 navigation buttons + colored prism bar)
- **Orb Button Active**: Highlighted to show current page
- **Navigation**: Clicking Orb button returns to Settings Page
- **Visual Continuity**: Maintains same styling and behavior as Settings Page toolbar
