# Long Playlist Card (Horizontal & Tablet Optimized)

The `LongPlaylistCard` is a high-density, horizontal variant of the playlist card, specifically designed for tablet and desktop views. It organizes metadata, management controls, and deep content previews into a dual-column layout with a pure black header bar and floating preview items.

---

## Layout Architecture

The card uses a responsive flex container (`md:flex-row`) that prioritizes a stable visual balance between the primary identity (Top/Header) and content discovery (Bottom/Grid).

### 1. Outer Container & Aesthetic Integration
- **Pure Black Canvas**: The outer container is styled with `bg-transparent border-0 shadow-none`, allowing elements to merge seamlessly into the solid `#000000` page background.
- **Header Bar**: A sleek `#000000` header bar (`bg-black border border-transparent hover:border-white/20 rounded-xl shadow-none transition-all`) anchors the top of the card, consolidating metrics, playlist title in pure white, and action controls without static border outlines.

---

### 2. Header Bar: Identity & Management Hub
The header bar acts as the control center for the playlist:

- **Metadata Bar (Metrics):** Sleek SVG icon indicators resting directly on the black header background without individual box backdrops for non-zero item categories:
  - **Videos:** `<Play>` (Sky Blue) indicator for standard video files/links.
  - **Orbs:** `<Sparkles>` (Amber) indicator for assigned visualizer Orb themes.
  - **Banners:** `<Image>` (Indigo) indicator for assigned banner presets.
  - **Tracked Playlists:** `<ListMusic>` (Emerald) indicator for linked playlist trackers.
  - **Tracked Channels:** `<User>` (Purple) indicator for linked channel trackers.
- **Centered Title:** Bold white typography displaying the playlist name with line truncation and hover color transitions (`text-white hover:text-white/80`).
- **Action Bar:** Dedicated row for management tasks:
  - **Grid Preview Button:** Toggles full grid preview mode (`Grid3x3`).
  - **Flash Add Button:** Quick-add button triggering a dark popover menu for opening the Playlist Uploader, quick-adding clipboard URLs, or assigning to 1 of 4 Quick Assign Slots.
  - **Three-Dot Menu:** Trigger icon opening a dark dropdown popover for secondary actions (Open in Uploader, Export, Group Assignment, Hide, Delete).

---

### 3. Bottom Section: Mini-Thumbnail Grid & Skeleton System

- **1x4 Mini-Thumbnail Preview Grid**:
  - Renders 4 mini thumbnails in a 1-row by 4-column grid layout (`grid-cols-4 gap-2.5`).
  - Video preview items use a compact **`aspect-[4/3]`** card container where the 16:9 thumbnail occupies ~75% of card height and a single-line 14px bold title (**`text-sm font-bold text-white truncate`**) over a solid black bottom strip (**`bg-black`**) without static dividers.
  - Mini preview cards use `border border-transparent hover:border-white/30 hover:ring-2 hover:ring-white/20`, rendering borderless statically and displaying a clean outline on hover.
  - Mini preview strips display standard YouTube video thumbnails ordered by **Most Recently WATCHED** (ordered by `COALESCE(vp.last_updated, '1970-01-01') DESC, pi.position DESC`).
  - Right-clicking any mini slot swaps that video into the primary cover position.
- **Skeleton Loading & Empty State System**:
  - **Pre-Data Fetching Skeletons**: While database/IPC preview requests are resolving, 4 pulsing skeleton slots (`aspect-[4/3] bg-black border border-transparent rounded-xl shadow-none`) maintain exact card height without harsh static borders.
  - **Empty State Placeholders**: Truly empty playlists (0 items) display 4 subtle dashed placeholder slots (`aspect-[4/3] border border-dashed border-zinc-800/60 bg-black text-zinc-600`) for visual card uniformity.

---

## Technical Details

- **Component Path**: `src/components/LongPlaylistCard.jsx`
- **Primary Integration**: `PlaylistsPage.jsx` (All Playlists, Unsorted, and Colored Folder Prism views).
- **Optimization**: Wrapped in `React.memo` to prevent redundant re-renders when parent state updates.
- **Preview Pool**: Standard YouTube video items, taking the 4 most recently watched items (ordered by `last_updated DESC`, falling back to `position DESC`), excluding local device items, channel cards, playlist trackers, orbs, and banner presets from the mini preview strip.
- **State Management**: Manages local preview states separately from main store to support real-time manual thumbnail swapping.
