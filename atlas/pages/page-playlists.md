# Playlists Page

The Playlists Page is the primary organizational hub for the application, displaying user-created playlists and colored folders in a single-row horizontal scrolling grid set against an atmospheric blurred app banner backdrop.

---

## 1. Architectural & Layout Structure

### Atmospheric Blurred Backdrop System
- **Layering**: The page is wrapped in an isolated backdrop container:
  - **Opaque Base**: `bg-slate-950` base container preventing see-through bleed.
  - **Blurred Layer (`z-0`)**: Heavily blurred App Banner image (`filter: blur(36px)`, `transform: scale(1.25)`).
  - **Depth Gradient Overlay**: `bg-gradient-to-b from-black/20 via-transparent to-black/40` enhancing contrast.
  - **Content Layer (`z-10`)**: Page controls and playlist cards float above the blurred backdrop.

---

### Horizontal Scrolling Grid Architecture
- **Single-Row Layout**: Displays a single horizontal row of fixed-width cards (500px).
- **Wheel Translation**: Vertical mouse wheel scrolling is captured and converted into horizontal translation. Vertical page overflow is disabled (`overflow-y-hidden`).
- **Sticky Toolbar**: Top toolbar below the page header containing:
  - **Left Side**: Toggle Mode button (Tabs View vs Presets View) and scrollable tab buttons.
  - **Right Side**: Folder inline toggle and Add Playlist modal trigger.
- **Floating Playlist Cards**:
  - Both `PlaylistCard` and `LongPlaylistCard` feature **solid anchor top header bars** (`bg-slate-100 border-2 border-[#052F4A]`) housing titles and management controls.
  - Non-header card bodies are transparent (`bg-transparent border-0 shadow-none`), letting mini preview grids float directly over the atmospheric blurred backdrop.

---

## 2. Colored Folders Integration

Users interact with colored folders via three distinct modes:

1. **Sticky Folders (Horizontal)**: Pinned folders appear in the main horizontal scroll immediately after their parent playlist card.
2. **Inline Expansion (Horizontal)**: Triggered via "Expand Folders" in the card's 3-dot menu; injects all member folders into the horizontal row.
3. **Folder Reel View (Vertical Overlay)**: Activated via the preview toggle; presents a focused vertical reel overlay of folder contents without leaving the page.

---

## File Manifest

- **`src/components/PlaylistsPage.jsx`**: Top-level page component managing horizontal scroll, tab filters, and banner backdrop integration.
- **`src/components/PlaylistCard.jsx`**: Standard card component with solid header and floating 15-item ($3 \times 5$) grid.
- **`src/components/LongPlaylistCard.jsx`**: Horizontal tablet card component with solid header and floating 8-item ($2 \times 4$) grid.
- **`src/components/TabBar.jsx`**: Tab navigation bar component.
