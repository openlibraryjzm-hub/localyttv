# Long Playlist Card (Horizontal & Tablet Optimized)

The `LongPlaylistCard` is a high-density, horizontal variant of the playlist card, specifically designed for tablet and desktop views. It organizes metadata, management controls, and deep content previews into a dual-column layout with a solid top header bar and floating preview items.

---

## Layout Architecture

The card uses a responsive flex container (`md:flex-row`) that prioritizes a stable visual balance between the primary identity (Top/Header) and content discovery (Bottom/Grid).

### 1. Outer Container & Backdrop Integration
- **Transparent Body**: The outer container is styled with `bg-transparent border-0 shadow-none`, allowing preview elements to float directly over atmospheric page backgrounds (such as the **Blurred App Banner Backdrop System** on `PlaylistsPage`).
- **Solid Top Header**: A prominent solid header bar (`bg-slate-100 border-2 border-[#052F4A] rounded-xl shadow-md`) anchors the top of the card, consolidating metrics, playlist title, and action controls.

---

### 2. Header Bar: Identity & Management Hub
The solid top header bar acts as the control center for the playlist:

- **Metadata Bar (Metrics):** A glassmorphic indicator consolidating:
  - **Item Counts:** Persistent indicators for Video, Orb, and Banner counts assigned to the playlist.
- **Centered Title:** Bold typography displaying the playlist name with line truncation and hover color transitions.
- **Action Bar:** Dedicated row for management tasks:
  - **Grid Preview Button:** Toggles full grid preview mode (`Grid3x3`).
  - **Folder Distribution Mode:** Toggles folder mode view (`Folder`).
  - **Flash Add Button:** Vibrant `+` button for opening the Playlist Uploader, quick-adding clipboard URLs, or assigning to 1 of 4 Quick Assign Slots.
  - **Shuffle Button:** Primary action for content discovery, drawing from the active shuffle page filter (`Shuffle`).
  - **Shuffle Page Selector:** Displays page number `[N]` restricting shuffle selections strictly to page segments (1-4, 5-8, etc.). Left-click advances (+1), right-click reverses (-1).
  - **Three-Dot Menu:** Houses secondary actions (Open in Uploader, Expand/Collapse Folders, Export, Group Assignment, Hide, Delete).
  - **Conditional Actions:** "Set as Cover" (Checkmark) and "Reset Shuffle" (Refresh) buttons appear when preview swaps are active.

---

### 3. Bottom Section: Mini-Thumbnail Grid & Skeleton System

- **1x4 Mini-Thumbnail Preview Grid**:
  - Renders 4 mini thumbnails in a 1-row by 4-column grid layout (`grid-cols-4 gap-2.5`).
  - Mini preview strips strictly display standard YouTube video thumbnails (Orbs, Banners, and local device folders are filtered out).
  - Right-clicking any mini slot swaps that video into the primary cover position.
- **Skeleton Loading & Empty State System**:
  - **Pre-Data Fetching Skeletons**: While database/IPC preview requests are resolving, 4 animated pulsing skeleton slots (`bg-slate-900/60 animate-pulse border border-[#052F4A]/20`) maintain exact card height and prevent layout jump.
  - **Network Image Download Placeholders**: Each `MiniPreviewItem` tracks image loading state using DOM element `ref` inspection (`el.complete`) and `onLoad` listeners. A dark pulsing background (`bg-slate-800 animate-pulse`) displays until thumbnail image bytes finish downloading over the network.
  - **Empty State Placeholders**: Truly empty playlists (0 items) display 4 subtle dashed placeholder slots (`border border-dashed border-[#052F4A]/15 bg-slate-100/40`) for visual card uniformity.
- **Pie Chart Overlay**: Toggling the Pie Chart view replaces the mini-thumbnail grid with an interactive radial SVG visualization of folder distribution.

---

## Technical Details

- **Component Path**: `src/components/LongPlaylistCard.jsx`
- **Primary Integration**: `PlaylistsPage.jsx` (All Playlists, Unsorted, and Colored Folder Prism views).
- **Optimization**: Wrapped in `React.memo` to prevent redundant re-renders when parent state updates.
- **Preview Pool**: Standard YouTube video items, excluding local device items, orbs, and banner presets from the mini preview strip.
- **State Management**: Manages local preview states separately from main store to support real-time manual thumbnail swapping.
