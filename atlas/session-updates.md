# Session Updates: Orb Playlist Assignment & Display
**Timestamp:** 11/02/2026 12:00pm

## Key Changes
1. **Orb Playlist Assignment**:
   - **Feature**: Added a dropdown menu to `OrbCard` components allowing users to assign Orbs to specific playlists.
   - **UI**: The dropdown appears on the Orb card header and shows a checklist of available playlists.
   - **State**: Assignments are persisted via `configStore` and reflected immediately.

2. **Orb Display in Videos**:
   - **Integration**: `VideosPage.jsx` now renders assigned Orbs as content cards at the beginning of the video grid list.
   - **Context Awareness**: Orbs only appear when the "All" folder is selected for the active playlist.
   - **Implementation**: Refactored the video rendering logic to merge assigned Orbs with playlist items in a unified `visibleItems` list, ensuring instant rendering without effect-induced flicker.
   - **Minimalist Mode**: Orbs on the Videos Page use a "minimal" display mode, removing the card background, borders, and text labels for a clean, integrated look. The playlist assignment button is hidden by default and appears on hover.
   - **Interactivity**: Clicking on an Orb card in the Videos Page now immediately applies that Orb's configuration (image, spill, masks) to the global player orb.

3. **Component Architecture**:
4. **Configuration Workflow Update**:
    - **One-at-a-time Workflow**: Removed the "Saved Orbs" grid from the config page to focus on single-orb creation.
    - **Inline Assignment**: Added a "Save Preset" section to the Orb Config panel. This allows naming the preset and selecting playlist assignments *before* saving.
    - **Legacy Wipe**: Implemented a one-time automatic wipe of existing Orb presets to ensure a conflict-free transition to the new system.

---

# Session Updates: Playlist Banner Tabs Refinement
**Timestamp:** 14/01/2026 5:55pm

## Key Changes
1. **Playlist Page Banner Tabs**:
   - **Refactor**: Integrated **Tab Presets Dropdown** directly into the `TabBar` layout on the left side, physically replacing the removed "All" tab position.
   - **Logic Change**: Removed the explicit "All" tab button. The "All" state is now represented by having no specific tab selected.
   - **Toggle Behavior**: Clicking the currently active tab now toggles it off, returning to the "All" (default) state.
   - **UI Polish**: Styled the `TabPresetsDropdown` trigger button to match the circular aesthetic (`h-9`, `rounded-full`) of the sibling tabs for visual consistency.

---

# Session Updates: Scroll Controls & Playlist Refinement
**Timestamp:** 14/01/2026 5:43pm

## Key Changes
1. **Side Menu Scroll Controls (Top Nav Integration)**:
   - **Refactor**: Moved the scroll controls from the left margin into the **Top Navigation Bar** itself (Left of the Back Arrow).
   - **Layout**: Horizontal row (`Up` - `Dot` - `Down`).
   - **UI Polish**:
     - Increased the hit area of the central "Dot" button (8px padding) for easier interaction.
     - Dot button now attempts to scroll to the "Active" item (Playing Video or Active Playlist) when clicked.

2. **Active Playlist Visual State**:
   - **Experiment**: Attempted to add a "Warm Red Glow" to the currently playing playlist card (matching the video card aesthetic).
   - **Outcome**: The visual implementation on the inner thumbnail clashed with the outer card structure. Reverted visual changes but kept the underlying DOM markers (`active-playlist-marker`, `data-active-playlist`) to facilitate future scroll-to-active functionality.
   - **Current Status**: 
     - "Scroll to Active" works perfectly on **Videos Page** (Red Ring detection).
     - "Scroll to Active" currently **does not work** on **Playlists Page** (Pending visual/class confirmation).
     - Red Aura on active playlist card is currently **disabled/not working**.

---

# Session Updates: Side Menu Scroll Controls
**Timestamp:** 14/01/2026 5:05pm

## Key Changes
1. **Side Menu Scroll Controls**:
   - **Feature**: Added a "Side Menu Scroll Menu" component in the left margin of the side panel.
   - **Visuals**: Simple two-chevron design (Up/Down) with a central dot separator, fixed vertically in the center.
   - **Functionality**:
     - **Up Chevron**: Smoothly scrolls the active side menu page (Playlists, Videos, History, etc.) to the top.
     - **Down Chevron**: Smoothly scrolls to the bottom.
   - **Implementation**:
     - Created `SideMenuScrollControls.jsx` which dynamically locates the active scrollable container (`.overflow-y-auto`) within the side menu content.
     - Integrated into `LayoutShell.jsx` to ensure it appears on all side menu pages.
     - Positioned absolutely (`left: 6px`) to float within the page margins without overlapping content.

---

# Session Updates: Card Menu Positioning & Fixes
**Timestamp:** 14/01/2026 4:47pm

## Key Changes
1. **Card Menu Refactor**:
   - **Problem**: The 3-dot context menu on playlist cards was being cut off by parent overflow containers, failing to stick to the card during scrolling, and had broken click event propagation (buttons completely unresponsive).
   - **Solution**: 
     - Replaced the existing `CardMenu` with a **new, robust implementation** (`NewCardMenu.jsx`) using `ReactDOM.createPortal`.
     - **Fixed Positioning**: The menu now uses `position: fixed` relative to the viewport but listens to global `scroll` and `resize` events to "stick" visually to its trigger button.
     - **Event Handling**: Implemented rigorous `e.stopPropagation()` and `e.preventDefault()` on all menu items to ensure clicks are processed by the menu system and not captured by the underlying card navigation logic.
     - **Z-Index**: Tuned z-index to `30` to correctly layer above card content but below the Sticky Toolbar / Top Navigation.

2. **"Remove from Tab" Feature**:
   - **Feature**: Added a context-aware "Remove from Tab" option to the playlist card menu.
   - **Logic**: This option only appears when viewing a specific tab (not "All"). Clicking it instantly removes the playlist from the current tab via `useTabStore`.
   - **Type Safety**: Updated `tabStore.js` to strictly convert IDs to strings during comparisons, resolving "silent failure" bugs caused by number/string ID mismatches.

## Learnings
- **Portals & Scrolling**: When using Portals (`ReactDOM.createPortal`) for dropdowns inside scrollable containers, strictly calculating position on *every* scroll frame is necessary to keep the menu attached.
- **Event Propagation**: In complex nested cards (where the card itself is a clickable link), it is critical that interactive children (like menus) aggressively stop event propagation to prevent triggering parent navigation.
- **ID Mismatches**: Always normalize IDs (e.g., `String(id)`) in store logic when dealing with mixed-type sources (database integers vs. DOM/URL strings) to prevent logic failures.

---

# Session Updates: Video Card Interaction Refinement
**Timestamp:** 14/01/2026 12:48am

## Key Changes
1. **Video Card Cleanup**:
   - **Removed Hover Buttons**: Removed the Play button, Priority Pin button, and Pin/Bookmark button from the video thumbnail hover overlay to reduce visual clutter.
   - **Cleaned Up State**: Removed unused state logic and event handlers associated with these buttons (`isPriority`, `handlePinClick`, etc.).
   - **Updated Documentation**: Reflected these changes in `atlas/ui.md`.

---

# Session Updates: Sticky Toolbar & Video Aesthetics Refinement
**Timestamp:** 14/01/2026 12:26am

## Key Changes
1. **Banner & Sticky Toolbar**:
   - Refined `PageBanner.jsx` layout for cleaner vertical rhythm.
   - **Sticky Toolbar Redesign**:
     - Adjusted layout to be more compact.
     - **Color Bar Prism**: Transformed the folder selection dots into a continuous, flexible "prism bar" of colored rectangles.
     - **Video Counts**: Added video count numbers inside the colored rectangles (visible when count > 0).
     - **Interaction**: Selecting a folder replaces the count with a subtle white ring indicator.
   - Reordered toolbar elements for better UX (Sort -> Filter -> Colors).

2. **Video Card Aesthetics**:
   - **"Now Playing" Indicator**:
     - Replaced text badge with **3 animated bouncing dots** (Warm Red).
     - Added a **vibrant warm red glow** (`ring-red-500` + dual-layer shadow) around the active video thumbnail.
     - Added "bleed" effect where the red glow extends both outwards and inwards into the thumbnail.
   - **Watched Badge**: Simplified to a standalone green tick icon.
   - **Cleanups**: Removed the "#index" badge from bottom-left for a cleaner thumbnail view.

---

# Session Updates: Banner Layout Refinement
**Timestamp:** 13/01/26 - 11:15pm

## Key Changes
1. **Banner Layout Refinement**:
   - Refactored `PageBanner.jsx` to bottom-align content (`items-end`) instead of centered.
   - Adjusted padding (`pt-12 pb-20`) to create a shorter top visual profile while maintaining clearance for the Sticky Toolbar's negative margin overlap.

---

# Session Updates: Performance Optimization (Batch Fetching & Skeleton UI)
**Timestamp:** 13/01/26 - 10:54pm

## Key Accomplishments

1.  **Solved N+1 Bottleneck on Videos Page**
    *   **Problem**: Loading `VideosPage` caused 50+ individual IPC calls to fetch folder assignments for each video, causing UI stutter.
    *   **Solution**: Implemented `get_all_folder_assignments` batch command in Rust. Refactored `VideosPage.jsx` to fetch all assignments in a single async call.
    *   **Impact**: Drastically reduced IPC overhead. Page transition is now limited only by rendering speed.

2.  **Optimized Playlists Page Loading**
    *   **Problem**: Loading `PlaylistsPage` triggered multiple N+1 query loops for item counts, thumbnails, and folder checking.
    *   **Solution**: Implemented `get_all_playlist_metadata` (Rust) and used `getAllFoldersWithVideos` (frontend) to load all data in parallel batches.
    *   **Impact**: Playlist grid metadata loads instantly.

3.  **Implement Skeleton Loading (Optimistic UI)**
    *   **Problem**: Transitions between pages showed blank screens or generic "Loading..." text, making the app feel slow even if data was fast.
    *   **Solution**: Created `VideoCardSkeleton` and `PlaylistCardSkeleton` components with a CSS-based `shimmer` animation.
    *   **Implementation**: Integrated these skeletons into `VideosPage.jsx` and `PlaylistsPage.jsx` to display a placeholder grid immediately while fetching data.
    *   **Impact**: Perceived performance is significantly improved; the app feels "native" and responsive.

## Learnings
*   **Batch vs. Sequential**: Moving iteration from Frontend (Sequential RPC) to Backend (Internal Loop) is the single biggest performance win for this architecture.
*   **Perceived Speed**: Even with fast backends, skeleton screens are crucial for bridging the gap between "click" and "render", maintaining user immersion.

# Session Updates: TopNavigation Refinement & Top Menu Alignment
**Timestamp:** 14/01/2026 2:47pm

## Key Changes
1. **TopNavigation UI Refresh**:
   - **Theme Integration**: Updated `TopNavigation.jsx` to use the centralized theme system (`utils/themes.js`) for background and border styles, replacing hardcoded Tailwind classes.
   - **Tab Styling**:
     - Converted tabs to circular (`w-9 h-9`) and pill-shaped buttons to match the aesthetic of the `PlayerController` action buttons.
     - **Inactive State**: `bg-white` with `border-slate-700` (#334155) and slate icon.
     - **Active State**: `bg-white` with `border-sky-500` and sky-colored icon/text.
     - **Typography**: Matched the active tab text color (`text-sky-950`) to the video title style in the Player Controller menus.
   - **Layout**:
     - Retained "Playlists" and "Videos" as text+icon labels.
     - Converted secondary tabs (History, Likes, Pins, Settings, Support) to **icon-only** buttons for a cleaner, toolbar-like appearance.

2. **PlayerController Documentation**:
   - Updated `atlas/advanced-player-controller.md` to reflect the removal of the 3x3 Grid button from the video menu (integrated into navigation cluster) and the updated layout of action buttons.

## Learnings
- **Visual Consistency**: Aligning the global navigation bar (`TopNavigation`) with the specific control aesthetics of the `PlayerController` creates a more unified application feel.

---

# Session Updates: Banner Layout & Content Alignment
**Timestamp:** 14/01/2026 8:35pm

## Key Changes
1. **Banner Height & Layout**:
   - **Height**: Reduced `PageBanner` container height to a fixed `220px` to minimize empty vertical space and bring the content closer to the sticky toolbar.
   - **Vertical Alignment**: Moved banner content higher by reducing top padding from `pt-12` to `pt-4`.
   - **Centering**: Added `mt-8` to the ASCII avatar container and adjusted `continueVideo` position to `top-12`. This effectively centers the visual elements (Avatar, Text Block, Thumbnail) within the new 220px vertical space.

2. **Content Presentation**:
   - **Author Identity**: Removed the duplicate author pseudonym that was previously floating above the ASCII avatar. The author name remains in the metadata text row.
   - **Continue Video**: Moved the "Continue Visual" thumbnail to the top-right (`top-12`, `right-6`) to align horizontally with the main title block and ASCII art.
   - **Overlap Prevention**: Added dynamic right padding (`pr-64`) to the text container only when a continue video is present, ensuring long titles/descriptions don't underlap the thumbnail.

3. **Playlists Page Banner**:
   - **Data Integration**: Updated the banner on the Playlists Page to display meaningful metadata:
     - **Count**: Shows the number of visible playlists (e.g., "5 Playlists").
     - **Dynamic Label**: Implemented logical pluralization ("Playlist" vs "Playlists") in `PageBanner.jsx`.
     - **Secondary Data**: Repaired the "Author" slot to display the **Total Video Count** (sum of videos in visible playlists) as "X Videos".
   - **Title Logic**:
     - Renamed default view from "Playlists" to **"All"**.
     - Custom presets now show just the preset name (e.g., "Gaming").
     - **Tab Awareness**: Appends the active tab name if selected (e.g., "**All - Favorites**") to clearly indicate the current view context.

## Learnings
- **Visual Balance**: When reducing container height, strictly centering elements (like the ASCII art and floating thumbnails) relative to the container *height* is crucial for a balanced look, even if the text block is top-aligned.
- **Contextual Metadata**: Re-purposing generic banner slots (like 'author') to show relevant context-specific data (like 'Total Videos' on a playlist overview) significantly improves the utility of the UI without requiring new component props.

---

# Session Updates (Jan 12, 2026) -> Fix Playlist Navigation & Title Sync

## Key Fixes Implemented:

1.  **Playlist Title Synchronization**:
    -   **Problem**: Title in Top Playlist Menu would "freeze" on a previewed playlist title when navigating away from the Videos page, or break when playing from a new context.
    -   **Fix**: Modified `PlayerController.jsx` to **strictly prioritize the active player's playlist title**. It now ignores `previewPlaylistId` for the top menu title display. The menu only updates when `currentPlaylistId` or `secondPlayerPlaylistId` changes.
    -   **Commit Logic**: Added "Commit Preview" logic to `VideosPage.jsx`. When clicking a video in a previewed playlist, it now explicitly calls `setPlaylistItems` with the *title included*, promoting the preview to the active state.

2.  **Navigation Loop Fix ("First 5 Playlists")**:
    -   **Problem**: Using the Next/Prev chevrons in the top menu would loop within the first few playlists.
    -   **Root Cause**: `currentNavigationIndex` in `playlistStore.js` was resetting to `-1` due to context lookup failures (likely type mismatch or missing folder references).
    -   **Fix**: Stabilized `setNavigationItems` logic in `playlistStore` and improved context matching. The index now correctly persists, preventing the reset-to-zero behavior.

3.  **Robust Metadata Fallback**:
    -   Added `currentPlaylistTitle` to `playlistStore` state. This acts as a "sticky" fallback, ensuring valid title text is displayed even during async loading states where the full playlist object might be momentarily unavailable.

## Learnings:
-   **Preview vs. Active Context**: It is critical to strictly separate "Browsing/Preview" state from "Active Playback" state in the UI. The Top Player Menu is a global control for the *active* audio/video context and should not reflect transient browsing actions until they are committed to playback.
-   **Store Reactivity**: Explicitly passing metadata (like titles) during state transitions (`setPlaylistItems`) prevents UI flickers and "Unknown" states better than relying solely on derived state from async fetches.

---

# Session Updates (Jan 12, 2026 - Part 2) -> Refine Player Controls & UI

## Key Features Summary:

1.  **Play Button Enhancements**:
    *   **Functionality**: Added right-click to reverse cycle colored folders and double right-click to reset filter to "All Videos".
    *   **Placement**: Swapped positions with the Grid button. Play button is now right of the chevrons, Grid button is centered between them.
    *   **visuals**: Aligned "All Videos" state with the neutral specific style (slate border/icon).

2.  **Pin Button Dual-Action**:
    *   **Logic**: Implemented short-click for "Normal Pin" and long-click (>600ms) for "Priority Pin".
    *   **Visuals**:
        *   Default/Inactive: Slate border/icon (matches Shuffle).
        *   Normal Pin: Black border, blue filled icon.
        *   Priority Pin: Amber border, amber filled icon.

3.  **New "Tooltip" Control**:
    *   Added an interactive **Info (i)** button to the action bar.
    *   Toggles a popup menu providing quick reference for mouse interaction shortcuts (Left/Right/Double/Long clicks).

4.  **Visual Unification**:
    *   **Like & Star Buttons**: Updated default (inactive) states to use uniform Slate colors (`#334155` border, `#475569` icon), replacing ad-hoc colors. All bottom-row action buttons now share a consistent design language.

## Learnings:
*   **Visual Hierarchy**: Using a consistent "neutral" style for inactive states allows active states (Colored Play, Pinned, Liked) to pop more effectively.
*   **Interaction Density**: Dual-action buttons (click vs. long-press) and right-click contexts allow for high functionality density without cluttering the UI with extra buttons.

---

# Session Updates (Jan 12, 2026 - Part 2) -> Refine Player Controls & UI

## Key Features Summary:
1.  **Play Button Enhancements**:
    *   **Functionality**: Added right-click to reverse cycle colored folders and double right-click to reset filter to 'All Videos'.
    *   **Placement**: Swapped positions with the Grid button.
    *   **Visuals**: Aligned 'All Videos' state with standard slate style.
2. **Pin and Tooltip**: Added dual-action pin and new Info button.

---

# Session Updates (Jan 12, 2026 - Part 3) -> Polishing Player Controller UI

## Key Features Summary:
1.  **Refined Video Menu Spacing**:
    *   **Spacing Parity**: Adjusted the Video Menu's navigation controls (Chevron Left, Grid, Chevron Right) to match the exact spacing of the Playlist Menu (28px gaps).
    *   **Mirrored Layout**: Re-implemented the video navigation capsule to structurally mirror the playlist navigation capsule for consistency.
2.  **Custom Icons**:
    *   **Curvy Film Strip**: Replaced the standard 3x3 Grid icon with a custom SVG "curvy film strip" icon to represent the Grid View in a more dynamic/chaotic way.
3.  **Action Button Layout**:
    *   **Equal Spacing**: Evenly distributed the Star, Shuffle, Pin, and Like buttons between the Play Button (Left Anchor) and Info Button (Right Anchor).
    *   **Far Right Menu**: Moved the 3-dot "More Menu" button to the far right edge (280px offset) to separate it from the primary action cluster.

---

# Session Updates (Jan 13, 2026) -> Playlist Card Hover Actions

## Key Features Implemented:

1.  **Refined Playlist Card UI**:
    -   **Action Repositioning**: Moved the **Play** and **Preview** hover buttons from the thumbnail overlay to the right side of the **Playlist Title Bar**.
    -   **Visual Cleanup**: Removed the large, center-overlaid buttons to provide a clearer view of the thumbnail art.
    -   **Title Bar Integration**: Converted the title bar into a flex container to house the new icon-only controls (Play, Shuffle, Preview) which appear on hover.

2.  **New Interaction Capabilities**:
    -   **Shuffle Button**: Added a dedicated **Shuffle** icon button to the immediate right of the Play button. It instantly shuffles the playlist/folder items and starts playback.
    -   **Right-Click to Play Cover**:
        -   **Behavior**: Right-clicking the Play button now scans the playlist to find the video matching the current card thumbnail (the "Cover Video").
        -   **Use Case**: Allows users to instantly jump to the "Featured" video represented by the cover art, rather than starting from the top of the list.
        -   **Fallback**: Standard left-click behavior (play from start) remains unchanged.

3.  **Cross-Component Consistency**:

---

# Session Updates (Jan 13, 2026 - Part 2) -> Performance Optimization & Skeletons

## Key Features Implemented:
1.  **Batch Data Fetching (Backend)**:
    -   Implemented `get_all_folder_assignments` and `get_all_playlist_metadata` Tauri commands.
    -   Reduced N+1 database queries to single batch operations for Videos and Playlists pages.

2.  **Optimistic UI (Frontend)**:
    -   **Skeleton Loading**: Created `VideoCardSkeleton` and `PlaylistCardSkeleton` components with `shimmer` animation.
    -   Integrated skeletons into `VideosPage` and `PlaylistsPage` to eliminate "pop-in" and provide instant perceived loading.

3.  **Result**:
    -   Eliminated UI stutter during page transitions.
    -   Grid layouts load progressively and smoothly.

---

# Session Updates (Jan 14, 2026) -> Video Card Interaction Refinement

## Key Changes:
1.  **Video Card Cleanup**:
    -   **Removed Hover Buttons**: Removed the Play button, Priority Pin button, and Pin/Bookmark button from the video thumbnail hover overlay to reduce visual clutter.
    -   **Cleaned Up State**: Removed unused state logic and event handlers associated with these buttons (`isPriority`, `handlePinClick`, etc.).
    -   **Updated Documentation**: Reflected these changes in `atlas/ui.md`.

---

# Session Updates (Jan 14, 2026 - Part 2) -> Video Thumbnail Size & History Page Borders

## Key Changes:
1.  **VideosPage Thumbnail Size Increase**:
    -   **Grid Spacing**: Reduced gap from `gap-6` (24px) to `gap-2` (8px) for larger thumbnails while maintaining 3-column layout.
    -   **Container Padding**: Reduced horizontal padding from `px-8` to `px-4` (16px) to maximize available space for cards.
    -   **Result**: Video thumbnails are noticeably larger while maintaining the 3-column grid structure.

2.  **HistoryPage Visual Enhancements**:
    -   **Card Borders**: Added `border-2 border-slate-700/50` to all history cards with hover state `border-slate-600/70`.
    -   **Thumbnail Borders**: Added `border-2 border-black` outline around thumbnails matching VideosPage style.
    -   **Currently Playing Indicator**: History cards now detect and highlight the currently playing video with:
        - Red border (`border-red-500`)
        - Red ring effect (`ring-4 ring-red-500`)
        - Red glow shadow matching VideosPage style
    -   **Detection Logic**: Uses `playlistStore` to compare `currentPlaylistItems[currentVideoIndex]` with history items by video ID and URL.

---

# Session Updates (Jan 15, 2026) -> History Page Playlist/Folder Badges

## Key Features Implemented:

1.  **Playlist/Folder Badge System**:
    -   **Badge Display**: Each history item now shows badges representing the playlists and folders the video belongs to.
    -   **Badge Format**: Displays as "Playlist Name - Folder Name" (or just "Playlist Name" if no folder assignment).
    -   **Color Coding**: Badges use the folder color for styling (or default sky color if no folder).
    -   **Multiple Badges**: If a video belongs to multiple playlists, multiple badges are displayed.

2.  **Interactive Badge Navigation**:
    -   **Split Clickable Areas**: Each badge is divided into two clickable sections:
        -   **Playlist Name** (left): Clicking navigates to the full playlist in preview mode.
        -   **Folder Name** (right): Clicking navigates to that specific folder in the playlist in preview mode.
    -   **Preview Mode**: Navigation does not change the currently playing video, allowing users to browse while keeping playback active.
    -   **Hover Effects**: 
        -   Playlist name: White highlight box appears on hover.
        -   Folder name: Colored highlight box (using folder color) appears on hover.

3.  **Data Loading**:
    -   **Batch Loading**: Efficiently loads playlist associations and folder assignments for all history items.
    -   **Folder Metadata**: Fetches custom folder names (or falls back to color names).
    -   **Performance**: All data loaded in a single pass during component mount.

4.  **Implementation Details**:
    -   **State Management**: Added `playlistMap`, `folderMap`, `folderNameMap`, and `allPlaylists` state.
    - **API Integration**: Uses `getPlaylistsForVideoIds`, `getVideoFolderAssignments`, `getFolderMetadata`, and `getVideosInFolder`.
    - **Navigation**: Integrates with `navigationStore` and `playlistStore` for seamless page navigation.

---

# Session Updates (Feb 01, 2026) -> High-Resolution Video Thumbnails
**Timestamp:** 01/02/2026 4:15am

## Key Changes
1. **High-Res Video Previews**:
   - **Feature**: Hovering over Twitter videos and GIFs now triggers an enlarged high-resolution thumbnail preview instead of just a raw MP4 or static placeholder.
   - **Technical Implementation**:
     - Updated `VideoCard.jsx` to detect Twitter video files (`.mp4`, `.gif`, etc.).
     - Implemented dynamic string manipulation to "upgrade" thumbnail URLs from `name=thumb` to `name=large`.
     - Integrated `useMemo` for performance optimization, ensuring the URL calculation only runs when the video object changes.
   - **UI Continuity**: Maintained the existing `name=orig` behavior for photos, ensuring all Twitter media types now provide a premium expansion experience.

2. **Documentation Alignment**:
   - Updated `atlas/twitter-integration.md` and `atlas/README.md` to reflect the new hover logic for video content.
   - Verified that all documentation accurately represents the current "Twitter style" vs "YouTube style" card behaviors and themes.

---

# Session Updates (Feb 01, 2026) -> Top Menu Badges
**Timestamp:** 01/02/2026 12:15pm

## Key Changes
1. **Top Playlist Menu**:
   - **Feature**: Added badges to the Top Playlist Menu in the Player Controller to indicate the currently active **Tab** and **Preset**.
   - **Visuals**:
        - **Active Tab**: Sky-blue badge appearing to the left of any folder badges.
        - **Active Preset**: Indigo badge appearing to the left of the Tab badge.
   - **Context**: Helps users understand the current filter context (Tab > Preset > Folder) directly from the player header.
   - **Refinement**: Swapped position so the **Preset Badge** is the leftmost element, reflecting the highest level of hierarchy.

---

# Session Updates (Feb 02, 2026) -> Twitter Import & Optimizations
**Timestamp:** 02/02/2026 7:55am

## Key Changes
1. **Twitter Integration Complete**:
   - **Import System**: Implemented `TwitterImportModal` and `TwitterBookmarkImporter` to support importing Twitter bookmarks/tweets from a JSON file.
   - **Video Rendering**: Refined `TweetCard.jsx` to correctly display "local" videos from Twitter (MP4/GIF), ensuring they play inline and have proper thumbnails.
   - **Hover Preview**: Extended `ImageHoverPreview` to work for Twitter media, dynamically upgrading thumbnail URLs to high-res versions for a premium feel.
   - **Visuals**: Standardized on a light sky blue theme (`#e0f2fe`) for Twitter cards and previews.

2. **Performance Optimization (Playlist Preview)**:
   - **Problem**: The Playlists Page was fetching *all* items for every playlist just to show 4 preview thumbnails, causing massive lag on large playlists (especially those with 10k+ tweets).
   - **Solution**: Implemented a new backend command `get_playlist_items_preview(playlist_id, limit)` that fetches only the requested number of items (4) directly from the database.
   - **Result**: Playlist page now loads instantly regardless of playlist size.

3. **Folder Management**:
   - **Renaming**: Added a "Pencil" edit button to the sticky folder color grid (`BulkTagColorGrid`), allowing users to rename colored folders directly. The logic persists to the database via `setFolderMetadata`.

4. **Bug Fixes**:
   - **Pins**: Fixed a bug where pins were being duplicated in the store. Added robust checks to remove existing pins before adding new ones.
