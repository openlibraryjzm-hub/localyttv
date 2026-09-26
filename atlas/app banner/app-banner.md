### App Banner

The App Banner is the top-level background system that spans the full width of the application and serves as the background for the Player Controller. It utilizes a **Dual-Half System** to provide independent, customizable background layers for the left and right halves of the application header.

**Related Documentation:**
- **Player Controller**: See `advanced-player-controller.md` for the controller that sits on this banner
- **Layout**: See `ui-layout.md` for layout system details
- **Page Banner**: See `page-banner.md` for the page-level banners used on Videos/Playlists pages
- **App Page (Editor)**: See `app-page.md` for the banner configuration interface

---

#### App Banner Overview

**1: User-Perspective Description**

Users see a full-width header (200px height) at the very top of the application, which is split into two distinct 50vw (viewport width) sections:

- **Dual-Half System**: The header is composed of a **Left Half** and a **Right Half**. Each can have its own image and configuration.
- **Visual Persistence**: Both halves are visible simultaneously across all view modes (Full, Half, Quarter).
- **Infinite Scroll Animation**: Each half supports a seamless horizontal scrolling animation (`repeat-x`).
- **Flip / Mirror Support**: Images can be horizontally flipped to create symmetrical or mirrored aesthetics.
- **Custom Upload Support**: Independent uploads for each half via the App Configuration page.
- **Window Controls**: Custom window controls (Minimize, Maximize, Close) float in the top-right corner of the Right Half.
- **Draggable Region**: The banner area is a dedicated drag region (`data-tauri-drag-region`) for moving the application window.

**2: File Manifest**

**UI/Components:**
- `src/LayoutShell.jsx`: The core rendering engine. It calculates `50vw` widths for each half and applies the store configurations.
- `src/components/AppPage.jsx`: The "Two-Bar" editor for configuring both halves side-by-side.
- `src/components/WindowControls.jsx`: Window controls positioned in the top-right corner.

**State Management:**
- `src/store/configStore.js`:
  - `fullscreenBanner` (Left Half): Configuration object for the left side.
  - `splitscreenBanner` (Right Half): Configuration object for the right side.
  - **Properties**:
    - `image`: Base64 string or URL of the image.
    - `scale`: Percentage for image sizing (influences background-size).
    - `verticalPosition`: Vertical alignment percentage.
    - `horizontalOffset`: Horizontal alignment percentage.
    - `scrollEnabled`: Boolean toggle for infinite scroll.
    - `flipped`: Boolean toggle for horizontal mirroring.
  - `stashedBanners`: Temporary state used to store "original" banners while live-editing in the AppPage.

**CSS/Styling:**
- `src/LayoutShell.css`:
  - `.layout-shell__banner-bg`: Shared style for both halves.
  - `animation: bannerScrollRight`: 60s horizontal translation loop.

**3: The Logic & State Chain**

**Dual-Half Rendering Logic:**
- `LayoutShell` renders two `div` elements with `width: 50vw`.
- The **Left Half** is anchored at `left: 0`.
- The **Right Half** is anchored at `left: 50vw`.
- **Scaling Math**: `background-size` is calculated as `(scale / 2)vw auto`. This ensures that at 100% scale, the image precisely fills its 50vw container.

**Live Preview & Restoration Flow:**
1. **Entry**: Opening the App Page triggers `stashBanners()`.
2. **Editing**: Changes to `fullscreenBanner` or `splitscreenBanner` are immediate. `LayoutShell` prioritizes these store values over any playlist-specific presets if a "stash" exists.
3. **Exit**: Closing the page triggers `restoreBanners()`, reverting the global state to the stashed values.

**4: Technical Implementation Details**

**Independent Symmetry:**
The system is designed to allow "Mirrored" designs. By uploading the same image to both halves, setting them to the same scale/offset, and enabling `flipped` on one side, users can create a perfectly mirrored panoramic header.

**Playlist Presets:**
While the store uses `fullscreenBanner` and `splitscreenBanner` as global defaults, the **Preset System** can override these per-playlist. When navigating to a playlist with a linked banner preset, the `LayoutShell` swaps the rendered configs to those stored in the preset.

---

#### Customization Capabilities

**Editor Features (`AppPage.jsx`):**
- **Side-by-Side Bars**: Simultaneous controls for both halves.
- **Copy to Other**: A "Sync" button that clones all settings (image, scale, etc.) from one half to the other.
- **Horizontal Flip**: A mirror toggle for each half.
- **Target Playlists**: A filtered dropdown to link configurations to specific playlists within the current **Explorer Hub**.

**File Format Support:**
- **Static Images**: PNG, JPG, WEBP.
- **GIFs**: Native playback (infinite scroll disabled automatically to prevent frame-stepping issues).
