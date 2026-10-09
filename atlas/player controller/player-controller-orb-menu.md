# Central Orb Menu (Player Controller)

The Central Orb is a circular element (154px diameter by default) positioned at the center of the PlayerController. It serves as the primary visual anchor and gateway to core app configurations and the home hub.

**Related Documentation:**
- **App Banner**: See `app-banner.md` for the banner background it sits on.
- **Player Controller Hub**: See `player-controller-unified.md`.
- **Control Guide Modal**: See `control-tutorial-guide-modal.md`.

---

## 1. User-Perspective Description

- **Transparent Backdrop & Dark Navy Styling**: The Central Orb Menu container background is 100% transparent down to the underlying App Banner. All floating circular orb buttons, borders, and icons strictly enforce the signature **Dark Navy** (`#052F4A`) outline styling.
- **Audio Visualizer Border**: The static blue border has been replaced. The Audio Visualizer acts as the dynamic, reactive border for the orb, starting exactly where the image ends (Radius 77px).
- **Orb Image**: Displays the current video's thumbnail by default, or a custom uploaded image. Supports **Orb Group Overrides** (random image from an assigned group). Clipped to a circular shape with optional "spill" effects.
- **Orb Buttons Layout**:
  - **Orb Config Button**: (Top-Left) Opens the Orb Tab in Settings.
  - **App Banner Button**: (Top-Right) Simple rectangle icon. Opens the App Banner Customization & Configuration page.
  - **YouTube API Key Button**: (Bottom-Left) `Key` icon button. Left-clicking toggles the YouTube Data API v3 Key configuration popup modal.
  - **Navigation Mode Toggle**: (Bottom-Right) Switches between Orb mode (`Circle` icon) and Banner mode (simple rectangle icon).
  - **Home Hub Button**: (Bottom-Center) Returns to the Explorer page. The icon dynamically displays the **current Explorer page number** (e.g., "1", "2") for instant orientation within the Hub. On click, it locks the app and returns to the gamified dashboard.
  - **Orb Navigation Chevrons**: 4 icons hugging the direct left/right curve of the 154px orb to cycle Orbs/Playlists or Banners/Categories depending on toggle state.
- **Spill Toggle**: When enabled, the image extends beyond the circular boundary via configurable quadrants.

## 2. Configuration & Settings (Orb Tab)
Accessed via the Settings Page -> Orb tab.
- **Saved Orb Presets**: Manage orb configurations (image + settings) for instant switching.
- **Spill Control**: An interactive 4-quadrant toggle system (Top-Left, Top-Right, Bottom-Left, Bottom-Right). Side quadrants support extended horizontal spill (150% width); bottom quadrants support extended vertical spill (150% height). Expanded spill sits **above** the Player Border Separator.
- **Image Scaling**: Zoom slider (0.5x to 3.0x).
- **Image Position**: X/Y offset sliders (-100 to +100 px) for precise panning.

## 3. File Manifest

**UI/Components:**
- `src/components/PlayerController.jsx`: Main interface wrapper handling state distribution.
- `src/components/PlayerControllerOrbMenu.jsx`: Orb rendering, image display, upload button, orb buttons, spill/clipping logic.
- `src/components/SettingsPage.jsx`: Configuration UI.

**State Management:**
- `src/store/configStore.js`:
  - `customOrbImage`, `isSpillEnabled`, `orbSpill` (quadrant flags).
  - `orbImageScale`, `orbImageScaleW`, `orbImageScaleH`.
  - `orbImageXOffset`, `orbImageYOffset`.
  - `orbFavorites` (saved presets).

## 4. The Logic & State Chain

**Image Display & Source Priority:**
1. `Effective Orb` (Orb Group Override)
2. `customOrbImage` (Global Config)
3. `playlistImage` (Current video thumbnail)
4. Fallback Placeholder

**Spill & SVG Clipping:**
- Image is rendered using an SVG `clipPath` (`url(#orbClipPath)`).
- When spill enabled: Image scales by `orbSize * displayScale * orbImageScaleW/H` and translates by offsets. 
- The SVG `<rect>` elements dynamically appear/disappear based on the `orbSpill` quadrant toggle state to unmask the corners.
