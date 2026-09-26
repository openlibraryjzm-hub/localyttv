# Orb Preset Assignments (Banner & Visualizer Color Integration)

The Orb Preset Assignments system integrates **Orb Presets**, **Audio Visualizer Colors**, and **Application Banners** into a single cohesive preset. It allows users to snapshot their current visualizer and banner setup and bind it to a specific Orb preset card, so that activating the Orb automatically applies the complete visual profile.

---

## 1. User Interface & Controls

The configuration tools are integrated directly into the **Orb Card** component (`OrbCard.jsx`) displayed in the videos grid.

### Configuration Popover Menu
Clicking the **Palette button** (or right-clicking the card) triggers a contextual configuration popover menu containing the following actions:
1. **Assign Current Color**: Snapshots the currently selected Audio Visualizer color and saves it to the Orb preset.
2. **Assign Current Banner**: Snapshots the active App Banner configuration (both Fullscreen and Splitscreen images, scaling, and vertical offsets) and saves it to the Orb preset.
3. **Clear Assigned Color**: Removes the custom visualizer color assignment from the Orb preset.
4. **Clear Assigned Banner**: Removes the custom App Banner assignment from the Orb preset.

### Visual Indicators
* **Palette Button Highlight**: If an Orb preset has a custom banner or visualizer color assigned, the palette button on its card lights up in green (`text-emerald-400` / `border-emerald-500/30`), indicating an active custom assignment profile.

---

## 2. Technical Implementation & Data Flow

### State Schema & Persistence (`configStore.js`)
Assignments are stored directly inside the `orbFavorites` array elements in the global config store.

```javascript
// Schema of an assigned Orb Favorite
{
  id: 12345,
  name: "My Preset",
  customOrbImage: "...",
  // Visualizer Assignment
  visualizerColor: "#00ffcc", // Custom color hex string
  // Banner Assignments
  fullscreenBanner: {
    image: "...",
    verticalPosition: 0,
    scale: 100,
    spillHeight: 0,
    maskPath: []
  },
  splitscreenBanner: { ... }
}
```

### Applying State & Navigation Priority
When an Orb is loaded (either via direct click or arrow navigation), `applyOrbFavorite` is called:
1. **Apply Configs**: The stored `visualizerColor`, `fullscreenBanner`, and `splitscreenBanner` configs are mapped directly into the global config states.
2. **Orchestrate Navigation Priority**: The sync logic in `PlayerController.jsx` automatically clears any active banner navigation override (`bannerNavBannerId = null`) and sets `activeNavigationMode = 'orb'`. This guarantees that the Orb-assigned banner immediately takes rendering precedence over previously navigated banners.

---

## 3. Related Files
* `src/components/OrbCard.jsx`: Handles the Palette action popover menu and visual button highlights.
* `src/store/configStore.js`: Handles schema persistence (`addOrbFavorite`) and preset restoration (`applyOrbFavorite`).
* `src/components/PlayerController.jsx`: Monitors effective Orb changes and synchronizes the active banner/visualizer states with prioritization.
