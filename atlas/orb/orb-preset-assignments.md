# Orb Preset Assignments (Banner & Visualizer Color Integration)

The Orb Preset Assignments system integrates **Orb Presets**, **Audio Visualizer Colors**, and **Application Banners** into a single cohesive preset. It allows users to snapshot their current visualizer and banner setup and bind it to a specific Orb preset card, so that activating the Orb automatically applies the complete visual profile.

---

## 1. User Interface & Controls

The **Orb Card** component (`OrbCard.jsx`) displays the Orb thumbnail image framed by an aesthetic (non-functional) audio visualizer ring. 

On hover, the card displays:
1. **Orb Name**: The title of the orb preset.
2. **Delete Option**: A single Trash icon button allowing instant deletion of the orb preset.

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
