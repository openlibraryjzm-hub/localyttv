### App Banner

The App Banner is the top-level header background system that spans the full width of the application and serves as the visual anchor for the Player Controller. Following the October 2026 dark mode refactor, the App Banner has been simplified to a **hardcoded pure black (`#000000`) background**, shedding performance-intensive disk image lookups, background scaling calculations, and continuous infinite scroll CSS animations.

**Related Documentation:**
- **Player Controller**: See `player-controller-unified.md` and `player-controller-top-menus.md` for the controller that sits on this banner
- **Layout**: See `ui-layout.md` for shell layout details
- **Fullscreen Video Info**: See `fullscreen-video-info.md` for right-panel styling

---

#### App Banner Overview

**1: User-Perspective Description**

Users see a clean, full-width header (200px height) at the very top of the application:

- **Solid Black Canvas**: Hardcoded `#000000` background eliminating GPU and memory overhead previously spent loading and scrolling high-resolution banner images.
- **Floating Controls**: The Player Controller (Top Playlist Menu, Central Orb, Top Video Menu) floats seamlessly over the black canvas without card backdrops.
- **Window Controls / Web Prompt**: Custom window controls (Minimize, Maximize, Close) float in the top-right corner on Desktop targets (`isTauri()` / `isWebView2()`). On Web target (`isWeb()`), a dismissable/collapsible `<WebDownloadPrompt />` card floats in the top-right corner, constrained within the 200px banner height.
- **Draggable Region**: The banner area serves as a dedicated drag region (`data-tauri-drag-region`) for moving the application window.
- **Seamless Merge**: The bottom separator line (`.layout-shell__separator`) has been hidden (`display: none;`), allowing the top controller area to merge seamlessly into the video player and content areas below it.

**2: File Manifest**

**UI/Components:**
- `src/LayoutShell.jsx`: Core rendering container. Renders the top controller slot (`#top-controller-anchor`), WindowControls / WebDownloadPrompt, and radial menu overlays.
- `src/components/WindowControls.jsx`: Desktop window controls positioned in the top-right corner.
- `src/components/WebDownloadPrompt.jsx`: Web-exclusive download prompt card and collapsible capsule pill.

**CSS/Styling:**
- `src/LayoutShell.css`:
  - `.layout-shell__top-controller`: Set to `background-color: #000000; border-bottom: none;`.
  - `.layout-shell__banner-bg`: Hidden (`display: none;`).
  - `.layout-shell__separator`: Hidden (`display: none;`).

---

#### Historical Note: Legacy Dual-Half Banner System

Prior to October 2026, the App Banner utilized a customizable "Dual-Half System" split into two `50vw` sections (`fullscreenBanner` for the left half, `splitscreenBanner` for the right half) with independent custom image uploads, scaling math, horizontal mirroring, and a continuous 60s horizontal infinite scroll loop (`animation: bannerScrollRight`). 

This system and its associated "Atmospheric Blurred Banner Backdrop" (which blurred `/banner.PNG` across main page backgrounds) were decommissioned to provide immediate load times, consistent dark-room contrast, and eliminate memory and rendering stalls.
