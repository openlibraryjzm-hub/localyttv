# Long Playlist Card (Horizontal & Tablet Optimized)

The `LongPlaylistCard` is a high-density, horizontal variant of the playlist card, specifically designed for tablet and desktop views. It organizes metadata, management controls, and deep content previews into a dual-column layout with a solid top header bar and floating preview items.

---

## Layout Architecture

The card uses a responsive flex container (`md:flex-row`) that prioritizes a stable visual balance between the primary identity (Left) and content discovery (Right).

### 1. Outer Container & Backdrop Integration
- **Transparent Body**: The outer container is styled with `bg-transparent border-0 shadow-none`, allowing preview elements to float directly over atmospheric page backgrounds (such as the **Blurred App Banner Backdrop System** on `PlaylistsPage`).
- **Solid Top Header**: A prominent solid header bar (`bg-slate-100 border-2 border-[#052F4A] rounded-xl shadow-md`) anchors the top of the card, consolidating metrics, playlist title, and action controls.

---

### 2. Left Column: Identity & Management Hub
This column acts as the control center for the playlist.

- **Primary Cover:** A large `aspect-video` thumbnail anchoring the card's visual identity.
- **Metadata Bar (Info Bar):** A glassmorphic bar consolidating:
  - **Folder Controls:** Quick-access button for folder distribution mode.
  - **Item Counts:** Persistent indicators for Video, Orb, and Banner counts assigned to the playlist.
- **Action Bar:** Dedicated row for management tasks:
  - **Shuffle Button:** Primary action for content discovery, restricted to drawing from the active shuffle page filter.
  - **Shuffle Page Selector:** Displays page number `[N]` restricting shuffle selections strictly to page segments (1-50, 51-100, etc.). Left-click advances (+1), right-click reverses (-1).
  - **Grid Preview Button:** Toggles full grid preview mode.
  - **Flash Add Button:** Vibrant `+` button for opening the Playlist Uploader, quick-adding clipboard URLs, or assigning to 1 of 4 Quick Assign Slots.
  - **Three-Dot Menu:** Houses secondary actions (Open in Uploader, Export, Hide, Delete, Group Assignment).
  - **Conditional Actions:** "Set as Cover" (Checkmark) and "Reset Shuffle" (Refresh) buttons appear when preview swaps are active.

---

### 3. Right Column: Content Explorer
This column provides direct visual depth into the playlist contents.

- **Header Bar Title & Controls**: Bold typography displaying the playlist name alongside header action triggers.
- **Interactive 2x4 Mini-Thumbnail Grid**:
  - Renders 8 mini thumbnails in a 2-row by 4-column grid layout (`grid-cols-4 gap-1.5`).
  - Mini items float directly over the atmospheric page background.
  - Right-clicking any mini slot swaps that video into the primary cover position.
- **Pie Chart Overlay**: Toggling the Pie Chart icon replaces the preview grid with an interactive radial visualization of folder distribution.

---

## Technical Details

- **Component Path**: `src/components/LongPlaylistCard.jsx`
- **Primary Integration**: `PlaylistsPage.jsx` (All Playlists and Unsorted views).
- **Slot Order**: Orbs take first priority, followed by Banner Presets, then standard Videos.
- **State Management**: Manages local preview states separately from main store to support real-time manual thumbnail swapping.
