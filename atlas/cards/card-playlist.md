# Playlist & Folder Cards

Playlist cards and Colored Folder cards share the exact same UI card schema and structure. Folder cards appear dynamically on the Playlists Page when the folder toggle is enabled, acting as sub-sections of playlists.

**Related Documentation:**
- **Navigation**: See `navigation-routing.md` for page changes.
- **Card Menus**: See `video-tweet-card-three-dot-menu.md`.
- **Pages**: See `page-playlists.md`.

---

## 1. Description & Structure

- **Thumbnail Area**:
  - `16:9` aspect ratio, rounded corners, with `border-2 border-[#052F4A]` outline.
  - Image: Custom cover or first video's thumbnail. Fallback: Gray placeholder icon.
  - **Hover Overlay**: Semi-transparent black overlay for visual focus.

- **Content Area**:
  - The entire card is wrapped in a square border (`border-2 border-slate-700/50`) with rounded corners and a white background.
  - **Playlist Title**: Positioned inside the container, above the thumbnail, enclosed in a separate inner rectangle with a dark blue border (`border-[#052F4A]`) and light background.

- **Hover Actions (Title Bar)**:
  - Play, Shuffle, and Preview buttons horizontally aligned within the Title Bar when hovered.
  - Separated by vertical dividers:
    - **Preview**: Grid3x3 icon (Opens in context on Videos Page).
    - **Navigation**: Refresh (conditional, post-shuffle reset) and Shuffle.
    - **Actions**: Flash Add Button (vibrant `+` dropdown triggering uploader modal or split button Quick Add/Play options ingesting links directly from clipboard), Info (toggles video title).

- **Quick Preview Strip (Playlist Specific)**:
  - Bottom row displaying 4 mini video thumbnails (medium quality) from the playlist.
  - Clicking any instantly launches that specific video.

- **Global Toggles**:
  - **List View**: Bottom-left List icon opens the Folder List View (Reel Overlay).
  - **Global Info**: Sticky Top Bar info icon persistently toggles titles across all cards.

## 2. Folder Pie Chart Menu (Expansion)

Clicking the Tag icon button expands a panel right below the card:
- **Pie Chart (140x140px)**: Proportional segments matching colored folders inside that playlist.
- **Interactions**:
  - Scroll wheel cycles segments (blocking page scroll while active).
  - Outer colored dots allow manual segment selection.
  - Clicking a segment dynamically fetches `getVideosInFolder()` and plays the videos.
- **Live Preview**: The right side dynamically updates the folder name, video count, percentage, and a mini 16:9 thumbnail from the first video in that specific folder section.
- **Auto-Cleanup**: Closing cleans up the nested refs so adjacent cards in grid alignments aren't disrupted.

## 3. Folder List View (Reel Overlay)

Clicking the List icon triggers a specialized column layout for focused browsing:
- **Visuals**: Full-screen black blur backdrop. Centered vertical reel containing standard 500px wide Folder cards.
- **Card Distinction**: Folder cards in the reel feature a colored vertical stripe on the left (`w-3`) indicating their tagged color.
- **Glow Effects**: Hovering triggers a colored radial gradient glow behind the card.
- **Folder Pinning**: The 3-dot menu here lets users securely pin folders to always show prominently in the overall "All" Playlists page.

## File Manifest
**UI/Components:**
- `src/components/Card.jsx`: Base Presentational Card.
- `src/components/PlaylistsPage.jsx`: Data integration, rendering bounds, pie chart logic.
- `src/components/PlaylistFolderColumn.jsx`: Reel interface.
