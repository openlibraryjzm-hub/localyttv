# Theme Customization Page

The Theme Customization Page provides an interface for switching between the application's curated 2-color duo-tone themes, enforcing strict minimalism without visual noise.

**Related Documentation:**
- **Navigation & Orb Menu**: See `player controller/player-controller-orb-menu.md` (accessed via top-right rectangle button).
- **Audio Visualizer**: See `audio-visualizer.md` for chromatic additive blending synchronization.
- **Fullscreen Video Info**: See `fullscreen-video-info.md` for panel recoloring behavior.
- **App Banner**: See `app banner/app-banner.md` for header background behavior.

---

## 1. Design Philosophy: 2-Color Duo-Tone System

Themes strictly enforce a **2-color duo-tone economy** consisting exclusively of:
1. **Canvas**: The background for the entire application (banner, pages, cards, and fullscreen info panel).
2. **Foreground**: Typography, icons, active indicators, and border outlines.

Subtle variations (secondary metadata, hover outlines) are derived exclusively from opacity steps of the foreground color, maintaining maximum clarity and performance.

### Curated Themes

| Theme | Canvas | Foreground | Character & Purpose |
| :--- | :--- | :--- | :--- |
| **OLED Black** | `#000000` | `#ffffff` | Pure black background with crisp white typography. Video letterbox bars merge seamlessly into the backdrop. |
| **Sky Blue Radial** | `radial-gradient(ellipse at 50% 30%, #e0f2fe 0%, #38bdf8 25%, #0369a1 55%, #030f1c 95%)` | `#031b2e` (Backlit HUD) | Harsh, high-contrast radial spotlight flaring from luminous cyan (`#e0f2fe` / `#38bdf8`) into pitch-dark midnight void navy (`#030f1c`). Paired with midnight sapphire typography and illuminated backlight halos for razor-sharp legibility across both bright and dark regions. |
| **Pure White Radial** | `radial-gradient(ellipse at 50% 30%, #ffffff 0%, #cbd5e1 30%, #475569 65%, #090d16 100%)` | `#000000` (Backlit Noir) | Harsh monochromatic radial gradient. Snow white core at the focal point plunging into deep obsidian graphite/charcoal (`#090d16`), paired with dual-layer white illuminated backlights and frosted card plates for high contrast. |

---

## 2. Interactive Features

- **Instant Switching**: Selecting a theme card immediately applies `data-theme` to the document root and persists `appTheme` via `configStore`.
- **Audio Visualizer Sync**: An integrated toggle capsule allows automatic synchronization of the Audio Visualizer color with the active theme (`#ffffff` for OLED Black, `#0284c7` for Sky Blue, `#475569` for Pure White).
- **Interactive Previews**: Each theme card features a live miniature layout mockup showing the canvas, foreground headers, floating card borders, and orbital nodes.
- **Navigation**: Uses `BottomNavigation.jsx` with Back and Close actions to return to previous browsing views.

---

## 3. File Manifest

- **UI/Component**: `src/components/ThemePage.jsx`
- **State Integration**: `src/store/configStore.js` (`appTheme`, `setAppTheme`, `visualizerColor`)
- **Theme Tokens & Rules**: `src/App.css` (`:root`, `[data-theme="sky"]`, `[data-theme="black"]`, `[data-theme="white"]`)
