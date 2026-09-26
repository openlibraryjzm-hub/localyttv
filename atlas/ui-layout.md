###4.0: UI Layout & Styling

The UI system provides a consistent layout shell with a side menu that displays different pages based on navigation state. The system uses a reusable Card component architecture for displaying playlists, videos, and history items in a grid layout.

**Theme**: The application uses a light sky blue background (`#e0f2fe`) with dark blue text (`#052F4A` / RGB(5, 47, 74)) for side menu content. Navigation buttons (TopNavigation, TabBar) remain white for contrast. See `THEME_CHANGES.md` in project root for detailed theme documentation.

**Related Documentation:**
- **Navigation**: See `navigation-routing.md` for page routing flows and navigation state management
- **State Management**: See `state-management.md` for `navigationStore` (page routing), `layoutStore` (view modes), and `folderStore` (folder filtering)
- **App Banner**: See `app-banner.md` for the top-level application banner
- **Page Banner**: See `page-banner.md` for page-level banners on Videos/Playlists pages
- **Playlists**: See `playlist&tab.md` Section 2.1 for playlist grid details
- **Videos**: See `playlist&tab.md` Section 2.2 for video grid and folder filtering
- **History**: See `history.md` for history page details
- **Pages**: See `ui-pages.md` for all page components
- **Cards**: See `ui-cards.md` for card component details
- **Modals**: See `ui-modals.md` for modal components

---

#### ### 4.0 Layout & Styling

**1: Window Architecture (Borderless)**
The application uses a modern **Borderless Window** design (`decorations: false`):
- **No Title Bar**: The native OS title bar is removed for a seamless, premium look.
- **Custom Window Controls**: A custom `WindowControls` component (Minimize, Maximize, Close) is integrated into the top-right corner of the banner.
- **Draggable Banner**: The entire Top Banner is a draggable region (`data-tauri-drag-region`), allowing users to move the window.
- **Dimensions**: Defaults to 1920x1030 (fullscreen width, taskbar-aware height) positioned at (0,0).

**2: Visual Design System**
The application employs a high-contrast, structured design with distinct borders and patterns:

- **Unified Animated Top Border**:
  - The static borders have been replaced by a single, dynamic **Top Border Separator** styling the application structure.
  - This separator runs horizontally across the screen, acting as the visual "Top Border" for both the **Video Player** and the **Side Menu**.
  - **Dynamic Patterns**: It uses the user-selected animated pattern (Diagonal, Dots, Mesh, Solid) configured in Settings -> Player Borders.
  - **Super Transparent aesthetic**: The Video Player's side and bottom borders/padding have been completely removed. The container is now transparent, relying solely on the animated Top Border Bar for structure.
  - **Visualizer Integration**: The Audio Visualizer bars naturally overlap this border bar, creating a cohesive, layered effect.

- **Top Banner ("App Banner")**:
  - Displays a custom image (`/public/banner.PNG`) spanning the full width of the controller.
  - **Infinite Scroll**: The banner image animates continuously from left to right in a 60-second seamless loop.
  - **Customizable**: Supports custom image uploads (PNG/JPG/WEBP/GIF) via Settings.
    - **Static Images**: Scroll indefinitely.
    - **GIFs**: Play natively without scrolling (to avoid motion issues).
  - **Separator**: Features a "Solid" separator line (12px) with the Light Blue Pattern, separating the banner from the app content.
  - **Hover Popup**: Features a hover-activated popup in the rightmost 1/6th zone.
  - **Comprehensive Documentation**: See `app-banner.md` for complete details.

- **Page Banner ("Videos Banner")**:
  - Located on the Videos, Playlists, and Colored Folders views.
  - **Height**: Fixed height of 220px ensures consistent layout and prevents resizing jitter.
  - **Dynamic Title**: Displays contextual titles based on current view (playlist name, folder name, page name).
  - **Visual Elements**: ASCII avatar, metadata (video count, year, author), description, and optional continue watching thumbnail.
  - **Background Options**: Color gradients (matching folder colors), animated patterns, or custom uploaded images.
  - **Sticky Toolbar Integration**: Seamlessly connects with Sticky Toolbar below using Unified Banner System.
  - **Comprehensive Documentation**: See `page-banner.md` for complete details on content, customization, and Sticky Toolbar integration.

- **Video Player**:
  - Wrapped in a `.layout-shell__player` container.
  - **Transparent Structure**: Features a fully transparent background with `padding: 0`. The visual "border" is provided solely by the shared Top Border Separator.
  - Scales responsively with view modes (Full/Half/Quarter).
  - **Fullscreen width**: In fullscreen mode, the player width is configurable (default 75% of content area) so a margin remains on the right, reducing letterboxing. Setting: **App → Player Borders → Fullscreen player width** (configStore: `fullscreenPlayerWidthPercent`). LayoutShell applies `--fullscreen-player-width` when `viewMode === 'full'`.
  - **Fullscreen Video Info**: The right margin in fullscreen is filled by the **FullscreenVideoInfo** component (thumbnail, author, view count, year, description, tags). See `fullscreen-video-info.md`.
  - **Fullscreen ↔ Splitscreen transition**: A unified right column (`.layout-shell__right-column`) holds either FullscreenVideoInfo or the side menu. **AnimatePresence** with `mode="wait"` crossfades between them (fullscreen info fades out, side menu fades in) while the content grid animates (0.5s). Optionally, **fullscreen info blanks instantly** when opening splitscreen (`layoutStore.fullscreenInfoBlanked`) so the panel clears before the mode switch. Together these provide a marginal improvement to transition smoothness; the banner switch (fullscreen vs splitscreen banner) and layout resize remain the main visual change.

- **Floating Metadata Bubbles**:
  - **Removed**: Video metadata (Author/View Count) and Playlist titles are now integrated directly into the Top Playlist/Video Menus for a cleaner, encapsulated look (see `advanced-player-controller.md`).

**3: Loading & Skeletons (Optimistic UI)**
To ensure immediate perceived response, the application uses **Skeleton Screens** instead of generic spinners:
- **Video Grid**: Displays a grid of `VideoCardSkeleton` items (shimmering placeholders) immediately upon navigation, masking the backend data fetch time.
- **Playlist Grid**: Displays `PlaylistCardSkeleton` items and a Banner skeleton while metadata loads.
- **Animation**: Uses a custom `shimmer` CSS animation (`@keyframes shimmer`) for a premium "native app" feel.

**4: Custom Scrollbar Styling**
The application features custom-styled scrollbars for a cohesive visual experience:

- **Scrollbar Width**: 10px (both vertical and horizontal)
- **Track**: Light blue tinted background (`rgba(224, 242, 254, 0.1)`) with rounded corners
- **Thumb**: Navy blue gradient (`rgba(5, 47, 74, ...)`) with hover/active states that increase opacity
- **Firefox Support**: Uses `scrollbar-width: thin` with matching colors
- **CSS Location**: `src/App.css` (lines 78-129)

**5: Scrollbar Navigation Chevrons**
A compact navigation capsule positioned adjacent to the scrollbar for quick scroll-to-top/bottom functionality:

- **Component**: `src/components/ScrollbarChevrons.jsx`
- **Visual Design**: Tightly packed vertical capsule containing:
  - **Up Chevron** (top): Double-click to scroll to page top
  - **Tracking Dot** (middle): Blue dot that aligns with scrollbar thumb center
  - **Down Chevron** (bottom): Double-click to scroll to page bottom
- **Positioning**: Fixed position, -4px from scrollbar (nearly touching)
- **Thumb Tracking**: The capsule moves with the scrollbar thumb, keeping the dot aligned with the thumb's center
- **Sizing**:
  - Button size: 14x14px
  - Dot size: 6px
  - Gap between elements: 4px
  - Total capsule height: ~42px
- **Visibility**: Only appears when content is scrollable
- **Styling**: Navy blue buttons with light stroke chevrons, blue glowing dot
- **Hover Effects**: Buttons scale up and glow on hover (CSS in `src/App.css`)
- **Integration**: Rendered via React portal, mounted in `LayoutShell.jsx` within side menu content

---

#### ### 4.1 Side Menu

**1: User-Perspective Description**

Users see a side menu panel that appears on the right side of the screen when in "half" or "quarter" view modes:

- **Top Navigation Bar**: Horizontal bar at the top of the side menu containing:
  - **Back Button**: Chevron left button (visible when history exists), navigates to previous page.
  - **Tabs**: Organized into 4 groups separated by vertical dividers:
    - **Group 1**: "Playlists" (Folder), "Videos" (Play), "Browser" (Globe) - All icon-only.
    - **Group 2**: "History" (Clock), "Likes" (Heart), "Pins" (Pin) - Icon-only.
    - **Group 3**: "Orbs" (Disc), "You" (User), "Page" (FileText), "App" (LayoutGrid) - Icon-only.
    - **Group 4**: "Support" (Cat) - Icon-only.
   - **Side Menu Scroll Controls** (Header): 
     - **Location**: Integrated into the Top Navigation header, to the left of the Back button.
     - **Components**: Up Chevron, Central Dot Button (scroll-to-active), Down Chevron.
     - **Functionality**: Smoothly scrolls the active side menu page content. The central dot attempts to center the currently active item (playing video or playlist).
   - **Scrollbar Chevrons** (Floating Capsule):
     - **Location**: Positioned next to the scrollbar, tracking the thumb position.
     - **Components**: Compact vertical capsule with Up Chevron, Tracking Dot, Down Chevron.
     - **Functionality**: Double-click chevrons to scroll to top/bottom. Dot tracks scrollbar thumb center.
  - **Close Side Menu Button**: "Close Side Menu" button (X) aligned to the right. Clicking it returns to full-screen mode (hides side menu).

- **Folder Selector** (Videos page only): Below the tabs, a row of 17 colored dots:
  - **"All"** button: Gray dot, shows all videos when clicked
  - **16 Folder Color Dots**: One for each folder color (Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink)
  - Active folder highlighted with blue ring
  - Clicking a folder filters videos to show only videos in that folder

- **Page Content**: The main content area below navigation, showing:
  - **Playlists Page**: 2-column grid of playlist cards (see `ui-pages.md`)
  - **Videos Page**: Horizontal scrolling **CSS Grid** layout (`grid-rows-2 grid-flow-col`) supporting mixed content heights. Single-row YouTube videos and double-row Twitter cards (`row-span-2`) interleave seamlessly. (see `ui-pages.md`)
  - **History Page**: 3-column grid of history cards (see `ui-pages.md`)

- **Layout Modes**: Side menu visibility controlled by view mode:
  - **Full Mode**: Side menu hidden, player only
  - **Half Mode**: Side menu visible on right, player on left
  - **Quarter Mode**: Side menu visible, smaller player

**2: File Manifest**

**UI/Components:**
- `src/LayoutShell.jsx`: Main layout component that manages side menu positioning
- `src/components/TopNavigation.jsx`: Tab navigation bar component
- `src/components/FolderSelector.jsx`: Folder color selector component (Videos page only)
- `src/components/ScrollbarChevrons.jsx`: Scrollbar navigation capsule (chevron-dot-chevron)
- `src/components/SideMenuScrollControls.jsx`: Header scroll controls (up/down/active buttons)
- `src/App.jsx`: Orchestrates page routing and side menu content

**State Management:**
- `src/store/navigationStore.js`:
  - `currentPage`: 'playlists' | 'videos' | 'history'
  - `history`: Array of previous pages
  - `setCurrentPage(page)`: Sets active page and pushes to history
  - `goBack()`: Navigates to previous page
- `src/store/layoutStore.js`:
  - `viewMode`: 'full' | 'half' | 'quarter'
  - `setViewMode(mode)`: Sets view mode
- `src/store/playlistStore.js`:
  - `showPlaylists`: Boolean (legacy, controls PlaylistList sidebar)
- `src/store/folderStore.js`:
  - `selectedFolder`: Currently selected folder color (null = all)

**API/Bridge:**
- No direct API calls - routing only

**Backend:**
- No database tables - UI state only

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Tab Navigation Flow:**
   - User clicks tab → `handleTabClick(tabId)` (TopNavigation.jsx line 19)
   - Calls `setCurrentPage(tabId)` → Updates `navigationStore.currentPage`
   - If in full mode → `setViewMode('half')` → Auto-switches to half mode to show side menu
   - `App.jsx` checks `currentPage` → Renders appropriate page component:
     - `currentPage === 'playlists'` → `<PlaylistsPage />`
     - `currentPage === 'videos'` → `<VideosPage />`
     - `currentPage === 'history'` → `<HistoryPage />`

2. **Folder Selection Flow:**
   - User clicks folder color dot → `setSelectedFolder(folderColor)` (FolderSelector.jsx)
   - Updates `folderStore.selectedFolder` → VideosPage filters videos
   - If `folderColor === null` → Shows all videos
   - If `folderColor` set → Calls `getVideosInFolder(playlistId, folderColor)` → Filters grid

3. **View Mode Toggle Flow:**
   - User clicks "View All Videos" or "View All Playlists" → `setViewMode('half')`
   - Side menu becomes visible → Shows appropriate page
   - User clicks close button (X) → `setViewMode('full')` → Side menu hidden

**Source of Truth:**
- `navigationStore.currentPage` - Currently active page (Source of Truth)
- `layoutStore.viewMode` - Current view mode (Source of Truth)
- `folderStore.selectedFolder` - Currently selected folder filter (Source of Truth)

**State Dependencies:**
- When `currentPage` changes → `App.jsx` re-renders → Different page component displayed
- When `viewMode` changes → `LayoutShell` re-renders → Side menu visibility toggles
- When `selectedFolder` changes → `VideosPage` filters videos → Grid updates
- When tab clicked in full mode → Auto-switches to half mode → Side menu appears
