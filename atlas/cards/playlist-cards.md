# Playlist Cards

Playlist cards are the primary interface for managing and interacting with playlists across the application (on the Playlists Page, Fullscreen Video Info panel, and Group Carousels). They provide a dense, feature-rich overview of playlist contents and state while offering quick access to management tools. There are two primary variants: the standard **PlaylistCard** and the horizontal **LongPlaylistCard**.

---

## Standard Playlist Card Architecture

### 1. Layout & Backdrop System
- **Solid Anchor Header Bar**: The top title bar (`h-[32px]`) is rendered as a solid, crisp anchor (`bg-slate-100 border-2 border-[#052F4A] rounded-md shadow-sm`). It centers the playlist title typography and anchors header action buttons.
- **Transparent Card Body**: In `large` mode (`size !== 'small'`), the non-header card container is transparent (`bg-transparent border-0 shadow-none`), allowing the mini thumbnail preview grid to float directly over atmospheric page backdrops (such as the **Blurred App Banner Backdrop System** on `PlaylistsPage` and `FullscreenVideoInfo`).
- **Small Carousel Mode (`size === 'small'`)**: When embedded in compact group carousels, the card shifts to a minimal thumbnail-only mode with a 16:9 thumbnail image atop a small title label below.

---

### 2. Mini Preview Grid ($3 \times 5$ Grid)
In `large` mode, the top 16:9 cover thumbnail container is omitted in favor of an expanded **15-Item Mini Thumbnail Grid** ($3 \text{ columns} \times 5 \text{ rows}$):
- **Grid Layout**: `grid-cols-3 gap-1 px-1 pb-0`.
- **Item Capacity**: Renders up to 15 preview items (`slice(0, 15)`), combining Orbs, Banner Presets, and standard playlist Videos.
- **Cover Ring Indicator**: Mini items matching the active cover thumbnail render a sky-blue highlight ring (`ring-2 ring-sky-400 border-sky-400`).
- **Dynamic Row Padding**: Automatically pads incomplete rows of 3 items up to 15 max with subtle placeholder slots (`aspect-video rounded-md bg-slate-800/20 border border-slate-700/30`).
- **Item Order Priority**: Orbs take first priority, followed by Banner Presets, then standard Videos.

---

### 3. Header Action Controls

The top solid header bar houses real-time interaction controls:

- **Preview Grid Toggle (`Grid3x3`)**: Toggles playlist preview modes.
- **Reset Shuffle (`RotateCcw`)**: Appears when a shuffle state is active; resets cover and preview slots back to default order.
- **Shuffle (`Shuffle`)**: Randomly shuffles the playlist pool (or active folder filter) and updates the top 15 preview items.
- **Quick Add (`Plus` Dropdown)**: 
  - **Open in Uploader**: Launches the Playlist Uploader modal.
  - **Quick Add / Add & Play**: Adds clipboard content to the playlist directly in the background or immediately initiates playback.
  - **Assign to Quick Slot**: Assigns the playlist to 1 of 4 quick slots.
- **Three-Dot Menu (`CardMenu`)**: Provides secondary actions: Open in Uploader, Collapse/Expand Folders, Export Playlist, Assign to Group, Remove from Carousel(s), Hide/Unhide, and Delete Playlist.

---

### 4. Interactive Previews (Shuffle, Reset & Swap)

- **Shuffle**: Draws from the full pool (orbs + banners + videos or active folder filter) and updates the top 15 preview slots.
- **Reset**: Reverts the preview thumbnail and top 15 slots back to the initial combined list order.
- **Swap / Manual Cover**: Right-clicking any mini thumbnail item in the 15-item grid swaps it into the active cover state.
- **Set as Cover**: Saves the currently active thumbnail URL as the permanent database cover image for the playlist.

---

## Long Playlist Card (Horizontal Tablet Variant)

The **LongPlaylistCard** is a horizontal variant designed for tablet layouts. It features a solid top header bar (`bg-slate-100 border-2 border-[#052F4A] rounded-xl shadow-md`), a dual-column layout, and an 8-item ($2 \times 4$) mini thumbnail preview grid floating over the page backdrop.

For detailed architecture on this variant, see:
- **[Long Playlist Card Documentation](long-playlist-card.md)**

---

## File Manifest

- **`src/components/PlaylistCard.jsx`**: Renders the standard card with solid header bar and floating 15-item ($3 \times 5$) mini grid.
- **`src/components/LongPlaylistCard.jsx`**: Renders the horizontal tablet card with 8-item ($2 \times 4$) preview grid.
- **`src/components/PlaylistsPage.jsx`**: Main page rendering cards over the atmospheric blurred banner backdrop.
- **`src/components/FullscreenVideoInfo.jsx`**: Fullscreen right-margin panel rendering `PlaylistCard` in `large` size mode.
