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
  - **Solid Header Card**: Enclosed in a solid light card container (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl p-1 shadow-md`).
  - **Row 1 (Playlist Title & Actions)**: Positioned inside the top row with a dark navy title (`#052F4A`) and hover action triggers (Grid3x3, Flash Add `+`, Card Menu).

- **Hover Actions (Title Bar)**:
  - Preview, Flash Add, and Card Menu buttons horizontally aligned within Row 1 when hovered.
  - Separated by vertical dividers:
    - **Preview**: Grid3x3 icon (Opens in context on Videos Page).
    - **Actions**: Flash Add Button (vibrant `+` dropdown triggering uploader modal or split button Quick Add/Play options ingesting links directly from clipboard), Card Menu.

- **Mini Preview Grid (15-Item Explorer)**:
  - Floating mini thumbnail grid ($3 \text{ columns} \times 5 \text{ rows}$, `grid-cols-3 gap-1.5`).
  - Vertically centered (`flex-1 my-auto flex flex-col justify-center`) to ensure 100% equalized vertical margins between the top header card and bottom containers.
  - Displays up to 15 items ordered by **Most Recently WATCHED** (`COALESCE(vp.last_updated, '1970-01-01') DESC, pi.position DESC`).
  - **Hover Interaction & Styling**: Mini preview cards feature a subtle dim-to-bright hover transition (`opacity-80 group-hover/mini:opacity-100`) and hover ring outline (`hover:ring-2 hover:ring-sky-500`), presenting clean thumbnail graphics without play button overlays or native title tooltips.
  - Clicking any item instantly launches that specific video, orb, or banner.

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
