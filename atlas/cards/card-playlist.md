# Playlist & Folder Cards

Playlist cards and Colored Folder cards share the exact same UI card schema and structure. Folder cards appear dynamically on the Playlists Page when the folder toggle is enabled, acting as sub-sections of playlists.

**Related Documentation:**
- **Navigation**: See `navigation-routing.md` for page changes.
- **Card Menus**: See `video-tweet-card-three-dot-menu.md`.
- **Pages**: See `page-playlists.md`.

---

## 1. Description & Structure

Following the October 2026 dark mode refactor, Playlist Cards feature a **pure black (`#000000`) canvas** with zero static borders, merging seamlessly into page backgrounds while retaining interactive hover states:

- **Thumbnail Area**:
  - `16:9` aspect ratio, rounded corners, borderless framing (`border-0 shadow-none`).
  - Image: Custom cover or first video's thumbnail. Fallback: Dark placeholder icon.
  - **Hover Overlay**: Semi-transparent black overlay for visual focus.

- **Content Area**:
  - **Title Bar**: Enclosed in a sleek `#000000` bar (`border-0 rounded-2xl bg-black shadow-none p-1`).
  - **Playlist Title & Actions**: Positioned inside the top row with a pure white title (**`text-white hover:text-white/80`**) and hover action triggers (Grid3x3, Flash Add `+`, Card Menu).

- **Hover Actions (Title Bar)**:
  - Preview, Flash Add, and Card Menu buttons horizontally aligned within Row 1 when hovered.
  - **Preview**: Grid3x3 icon (Opens in context on Videos Page).
  - **Actions**: Flash Add Button (vibrant `+` dropdown triggering uploader modal or split button Quick Add/Play options ingesting links directly from clipboard), Card Menu.

- **Mini Preview Grid (15 to 18-Item Explorer)**:
  - Floating mini thumbnail grid ($3 \text{ columns} \times 5 \text{ rows}$ by default, or $3 \text{ columns} \times 6 \text{ rows}$ when `miniGridLimit={18}` in Fullscreen Video Info).
  - Vertically centered to ensure equalized vertical margins between top header and container edges.
  - Mini items styled with `border border-transparent hover:border-white/50 bg-black`, rendering borderless statically and displaying clean white outlines on hover.
  - Displays up to 15 (or 18) items ordered by **Most Recently WATCHED** (`COALESCE(vp.last_updated, '1970-01-01') DESC, pi.position DESC`).
  - Previews feature a subtle dim-to-bright hover transition (`opacity-80 group-hover/mini:opacity-100`).
  - Clicking any item instantly launches that specific video, orb, or banner.

- **Global Toggles**:
  - **List View**: Bottom-left List icon opens the Folder List View (Reel Overlay).
  - **Global Info**: Sticky Top Bar info icon persistently toggles titles across all cards.

---

## 2. Folder Pie Chart Menu (Expansion)

Clicking the Tag icon button expands a panel right below the card:
- **Pie Chart (140x140px)**: Proportional segments matching colored folders inside that playlist.
- **Interactions**:
  - Scroll wheel cycles segments (blocking page scroll while active).
  - Outer colored dots allow manual segment selection.
  - Clicking a segment dynamically fetches `getVideosInFolder()` and plays the videos.
- **Live Preview**: The right side dynamically updates the folder name, video count, percentage, and a mini 16:9 thumbnail from the first video in that specific folder section.
- **Auto-Cleanup**: Closing cleans up the nested refs so adjacent cards in grid alignments aren't disrupted.

---

## 3. Folder List View (Reel Overlay)

Clicking the List icon triggers a specialized column layout for focused browsing:
- **Visuals**: Full-screen black blur backdrop. Centered vertical reel containing standard 500px wide Folder cards.
- **Card Distinction**: Folder cards in the reel feature a colored vertical stripe on the left (`w-3`) indicating their tagged color.
- **Glow Effects**: Hovering triggers a colored radial gradient glow behind the card.
- **Folder Pinning**: The 3-dot menu here lets users securely pin folders to always show prominently in the overall "All" Playlists page.

---

## File Manifest
**UI/Components:**
- `src/components/PlaylistCard.jsx`
