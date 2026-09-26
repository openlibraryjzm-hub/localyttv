# Tweet Cards

Tweet Cards are designed to mimic the mobile app experience of Twitter/X, while natively integrating with the core application's custom folder, pin, and playback systems.

**Related Documentation:**
- **Twitter Integration**: See `twitter-integration.md` for the full pipeline of importing JSONs and parsing properties.
- **Card Menus**: See `video-tweet-card-three-dot-menu.md`.

---

## 1. Description & Structure

- **Display Hierarchy**:
  - Found specifically on the Videos Page or History Page.
  - Occupies a **single cell** in the standard 2-column video grid (interleaves normally among standard YouTube cards).
  - Designed completely distinct from classic video styling. Uses a Light Sky Blue (`#e0f2fe`) background.

- **Header Section (User)**:
  - **Avatar**: Circular profile picture (`40x40px`). Falls back to a colored letter icon if missing.
  - **Author Info**: Bold display name followed by a gray `@handle` (using primary font color `#052F4A`).
  - **Toolbar**: 3-dot action menu appearing on hover.

- **Content Area**:
  - Clean text configuration (`#052F4A`).
  - Uses `line-clamp-3` for longer, multi-paragraph text objects.
  
- **Media Section**:
  - Automatically fetches `medium` resolution thumbnails for grid, scaling cleanly.
  - Nested in a marginally darker frame (`bg-[#d0eafb]/50`) using CSS `contain` logic to ensure media is never artificially stretched around 16:9 boundaries.

## 2. Interactive Elements

### Hover Overlays (Badges)
- Contains identically embedded functionality to Video Cards:
  - **Pin Button**: Dual-action pin/priority control floating off the primary media.
  - **Star Button**: Folder assignment control with hover color picker configurations. 

### Hover Expansions (4chanX Style)
- Using the `ImageHoverPreview` wrapper:
  - Hovering a tweet's media area triggers a high-fidelity image enlargement instantly.
  - The expansion parses original URLs natively (`name=orig` for photos and raw video paths for native `.mp4` playbacks).
  - Features smart bounds-avoidance to remain on screen perfectly relative to cursor alignment (clamped to 900x1200 max limits).

### Full Screen Details
- **Click Actions**: Re-routes natively to the `TweetPage.jsx` component, carrying the `navigationStore.selectedTweet` state vector inside it to load the Tweet cleanly as a full-page scrollable component rather than an iframe.

## File Manifest
**UI/Components:**
- `src/components/TweetCard.jsx`: Dedicated structure mapping to the standard Card system.
- `src/components/ImageHoverPreview.jsx`: Media interactions rendering high-res instances smoothly.
