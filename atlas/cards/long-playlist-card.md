# Long Playlist Card (Tablet Optimized)

The `LongPlaylistCard` is a high-density, horizontal variant of the standard playlist card, specifically designed for a premium Android tablet experience. It maximizes screen real estate by organizing metadata, management controls, and deep content previews into a sophisticated dual-column layout.

## Layout Architecture

The card uses a responsive flex container (`md:flex-row`) that prioritizes a stable visual balance between the primary identity (Left) and content discovery (Right).

### 1. Left Column: Identity & Management Hub
This column acts as the control center for the playlist.

*   **Primary Cover:** A large `aspect-video` thumbnail that anchors the card's visual identity.
*   **Metadata Bar (Info Bar):** A glassmorphic bar that consolidates:
    *   **Folder Controls:** Quick-access button for folder distribution mode.
    *   **Item Counts:** Persistent indicators for the number of Videos, Orbs, and Banners assigned to the playlist.
*   **Action Bar:** A dedicated row for high-priority management tasks:
    *   **Shuffle Button:** Primary action for content discovery, restricted to drawing from the currently active shuffle page filter.
    *   **Shuffle Page Selector:** A button displaying the page number `[N]` that restricts shuffle selections strictly to the items of that page (1-50, 51-100, etc.). Uses a cycle system where a left-click advances page (+1) and a right-click reverses page (-1).
    *   **Grid Preview Button:** Toggles the "full grid" preview mode.
    *   **Flash Add Button:** A vibrant `+` button triggering a dropdown for opening the Playlist Uploader modal, quick adding content directly from the clipboard (automatically extracting YouTube IDs and metadata), or persistently assigning the playlist to 1 of 4 customizable **Quick Assign Slots**.
    *   **Three-Dot Menu:** Houses secondary actions (Open in Uploader, Export, Hide, Delete, Group Assignment).
    *   **Conditional Actions:** Contextual buttons for "Set as Cover" (Tick) and "Reset Shuffle" (Refresh) appear only when a preview is active.

### 2. Right Column: Content Explorer
This column provides a direct window into the playlist's depth.

*   **Premium Title:** A large, bold typography header for the playlist name.
*   **Interactive Previews:**
    *   **2x2 Mini-Card Grid:** The default view. Unlike the standard "strip," this is a robust grid where each video is rendered as a "Mini Card" with its own thumbnail and title area.
    *   **Pie Chart Overlay:** When the Pie Chart icon is toggled, the content grid is replaced by a sophisticated, interactive radial visualization of the playlist's folder distribution.
*   **High-Density Grid:** Each slot in the 2x2 grid is a perfectly uniform `aspect-square`. Videos are cropped to fit (`object-cover`) while Orbs are rendered as distinct, glossy circles.

## High-Density Design Logic

The `LongPlaylistCard` implements several specific design patterns to ensure a professional "Native App" feel on high-resolution tablet screens:

*   **Card-in-a-Card Pattern**: Each video in the preview grid is treated as a miniature version of a full Video Card, providing instant context (titles) without additional interaction.
*   **Visual Symmetry**: By using `aspect-square` for all preview slots, the grid maintains a rock-solid vertical alignment regardless of whether the user is viewing standard videos, Orbs, or Banners.
*   **Interaction Hub Isolation**: Management controls are removed from the thumbnail overlay and placed in dedicated bars. This ensures that touch targets are large, accessible, and never obscure the content artwork.
*   **Glassmorphism & Depth**: Subtle gradients, backdrop blurs, and hover glows are used to create a 3D layered effect, characteristic of high-end Android system applications.

## Technical Details

*   **Component**: `src/components/LongPlaylistCard.jsx`
*   **Integration**: Primarily used in `PlaylistsPage.jsx` when in the "All Playlists" or "Unsorted" views on tablet-class devices.
*   **Slot Order**: Orbs take priority in the preview slots, followed by Banners, then standard Videos.
*   **State Management**: Tracks local preview state separately from the main playlist to allow for smooth "manual swap" interactions where any mini-card can be right-clicked to become the main cover.
