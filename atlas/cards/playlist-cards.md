# Playlist Cards

Playlist cards are the primary interface for managing and interacting with playlists on the Playlists Page. They provide a dense, feature-rich overview of a playlist's contents and state while offering quick access to management tools. There are two primary variants: the standard **PlaylistCard** (square) and the tablet-optimized **LongPlaylistCard** (horizontal).

## Standard Playlist Card

## Visual Overview

Each playlist card consists of the following key visual elements:

1. **Main Cover Thumbnail:** The primary visual identifier for the playlist. This defaults to the first item in the playlist's combined list (which may be an **orb**, **banner preset**, or video). It can also show a randomly shuffled item if the user chooses.
2. **Mini Preview Strip:** A row of 4 small thumbnails displayed directly below the main cover. Each slot can show a **video**, **tweet**, **orb**, or **banner preset**—matching the playlist's assigned orbs/banners (from configStore) and preview videos. Order is: orbs first, then banners, then videos.
3. **Information Overlay:**
    *   **Folder Count Badge:** A folder icon overlaid with the number of folders containing content within this playlist. (Always visible)
    *   **Item Count Badge:** A badge showing playlist content counts. When the playlist has only videos, it displays "X videos". When it has orbs and/or banners assigned, it shows the breakdown: e.g. "1 video, 2 orbs, 1 banner". (Always visible, located next to the folder count)
4. **Interactive Controls:** Various buttons that appear on hover to manage the playlist's appearance and settings.

### Orb and Banner Support

Orbs (from Orb Favorites) and Banner Presets (from App Banner presets) can be **assigned to playlists** via their cards on the Videos page. Once assigned (via each orb/banner's playlist selector), they appear on that playlist's card:

*   **Main cover:** If the first item in the combined list is an orb or banner (and the playlist has no custom cover), the main thumbnail shows that orb/banner image.
*   **Mini strip:** The first N slots can be orbs and banners, followed by preview videos. Orb/banner images are shown as plain thumbnails (no SVG cropping on the card). If an image is missing, a labeled placeholder ("Orb" or "Banner") is shown.
*   **Assignment:** Only orbs and banners whose `playlistIds` include this playlist's ID are shown (same rule as on the Videos page). Counts reflect only assigned orbs/banners for this playlist.

## Core Functionalities

### 1. Dynamic Previews (Shuffle, Reset & Swap)
Hovering over the playlist card reveals a **Shuffle** button (indicated by crossed arrows).
*   **Shuffle:** Clicking this button randomly selects one item from the **full pool** (all assigned orbs + all assigned banners + **all playlist videos**) to display as the main cover. It also randomly shuffles that full pool and takes the first 4 items for the mini preview strip. So the main and the 4 slots can be any mix of orbs, banners, and videos, giving high diversity. When a **folder filter** is active, shuffle uses only videos from that folder (same as before).
*   **Reset:** Once a playlist has been shuffled, a **Reset** button (counter-clockwise arrow) appears next to the shuffle button. Clicking this reverts both the main cover and the 4 mini preview slots back to their default state (first 4 of the combined list: orbs + banners + preview videos).
*   **Swap:** Right-clicking on any of the 4 mini preview slots (video, orb, or banner) swaps it with the main cover. The item you right-clicked becomes the new main cover; the previous main moves into that slot. Works for orbs and banners as well as videos. This action is treated as a manual shuffle, making the "Reset" and "Set as Cover" buttons available.

### 2. Setting a Custom Cover
When hovering over the card, a **Set as Cover** checkmark button appears in the bottom-right corner of the main thumbnail. 
*   **Persistent Customization:** Clicking this button locks the *currently displayed* main thumbnail (video, orb, or banner image) as the permanent cover image for the playlist.
*   **Locking the Mini Previews:** If the playlist layout was generated using the Shuffle feature, clicking "Set as Cover" will also persist the order of the first 4 slots where possible: only **video** items in those slots are reordered in the database (to the top of the playlist). Orb and banner slots are not reordered in the DB (they are assigned per playlist in configStore and have no playlist position). The cover image URL is always saved regardless of type.

### 3. Folder Management Integration
*   **Folder Pie Menu:** Clicking the color palette icon opens a pie menu overlay, allowing you to assign colors/folders to the playlist.
*   **Folder List View / Carousel Folder Mode:** Clicking the folder count icon behaves differently depending on context:
    *   **In Main Grids (ALL / UNSORTED):** Opens the `PlaylistFolderColumn` overlay—a detailed vertical scrolling column view showing all active folders and their respective contents for that playlist.
        *   **Folder Preview Override & Filter:** Clicking on any of the folder cards within this column will not navigate you away immediately. Instead, it temporarily replaces the parent playlist card's main thumbnail and mini previews with the first videos from that selected folder.
        *   **Folder Shuffle Mode:** Doing this also locks the playlist into a "folder filter" mode. While active, the folder icon badge will change to the color of the selected folder. Clicking the **Shuffle** button on the playlist card will now strictly shuffle videos from *within that chosen folder* rather than the whole playlist.
        *   **Clear Folder Filter:** A red 'X' button will appear in the top right corner of the colored folder badge. Clicking this will clear the filter, returning the shuffle functionality back to the entire playlist pool.
    *   **In Group Carousels (GROUPS):** Temporarily switches the parent group carousel into a "folder view mode". The carousel replaces its normal playlist cards with pseudo-cards representing each populated colored folder inside the selected playlist. A "Back to [Playlist Name]" card allows exiting this mode. These folder cards have `isFolderCard=true` and `folderColorFilter` set, functioning almost autonomously.

### 4. Details and Metadata
*   **Title Overlay:** Toggling the **Info** button (or using the global info toggle) displays the title of the item currently shown as the main thumbnail (video title, orb name, or banner preset name).
*   **Three-Dot Menu:** Provides access to: expand/collapse all folders, export playlist data, **Assign to group** (opens the group carousel column to assign this playlist to carousels), **Remove from carousel(s)** (when the playlist is in at least one group carousel—removes it from all), and delete playlist. See **group-carousel.md** for the group carousel system.

## Long Playlist Card (Tablet)

The **LongPlaylistCard** is a specialized, high-density variant designed for horizontal tablet layouts. It features a dual-column design with an expanded 2x2 preview grid, dedicated metadata bars, and a standalone Action Bar for management controls.

For detailed documentation on this complex variant, see:
*   **[Long Playlist Card Documentation](long-playlist-card.md)**

## File Manifest

*   **PlaylistsPage.jsx:** Builds combined preview items per playlist (orbs + banners + preview videos) from configStore and playlistPreviewVideos; passes `initialPreviewVideos`, `activeThumbnailUrl`, and counts (`videoCount`, `orbCount`, `bannerCount`) to each PlaylistCard.
*   **PlaylistCard.jsx:** Renders the standard square card.
*   **LongPlaylistCard.jsx:** Renders the horizontal tablet-optimized card with the 2x2 mini-card preview grid.
