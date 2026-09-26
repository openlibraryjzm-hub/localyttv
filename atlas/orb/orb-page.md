# Orb Configuration Page

The Orb Configuration Page (`OrbConfigPlaceholderPage.jsx`) provides a streamlined, focused interface for creating and managing Orb Presets. Unlike previous versions, this page focuses on a "one-at-a-time" creation workflow rather than managing a grid of existing presets.

**Related Documentation:**
- **Advanced Editing**: See `orb-advanced-crop.md` for the full-screen editor details.
- **State Management**: See `state-management.md` for `configStore` details.

---

## 1. User-Perspective Description

### Layout
The page is divided into two main columns:

1.  **Left Column: Visualizer & Import**
    *   **Visualizer**: A central preview area showing the current Orb image with all masks, spills, and scaling applied.
    *   **Interactive Toggles**: Clicking the quadrants (TL, TR, BL, BR) toggles the "Spill" effect for that section.
    *   **Advanced Editor Button**: A "Settings" icon overlays the visualizer to open the **Advanced Orb Crop** modal (fullscreen editor with zoom/scroll).
    *   **Upload/Remove**: Controls to upload a new source image or remove the current one.

2.  **Right Column: Configuration & Save**
    *   **Adjustments**: Sliders for **Scale**, **X Offset**, and **Y Offset**.
    *   **Save Preset**: A dedicated section to finalize the configuration.
        *   **Playlist Assignment**: A dropdown menu allows selecting multiple playlists to assign this Orb to *before* saving.
        *   **Save Button**: Clicking "Save Configuration" instantly creates a new preset (auto-named by date), saves it to the store, and clears the selection.

### Workflow
1.  **Upload**: User uploads an image.
2.  **Adjust**: User tweaks scale/position and toggles quadrant spills.
3.  **Refine (Optional)**: User enters Advanced Mode to draw custom crop masks.
4.  **Assign**: User selects target playlists from the dropdown.
5.  **Save**: User clicks Save. The Orb is now stored and active for those playlists.

### Interactivity via Video Page
While the Config Page no longer shows a grid of saved Orbs, the **Videos Page** now serves as the "Library" for Orbs.
*   **Minimalist Cards**: Orbs appear as minimalist cards at the start of the "All" view in playlists.
*   **One-Click Load**: Clicking an Orb card in the video grid immediately **applies** that Orb's full configuration to the global player.

---

## 2. File Manifest

**UI/Components:**
- `src/components/OrbConfigPlaceholderPage.jsx`: Main configuration interface.
- `src/components/OrbCropModal.jsx`: Fullscreen advanced editor.
- `src/components/OrbCard.jsx`: Reusable card component (used in VideosPage for display).

**State Management:**
- `src/store/configStore.js`:
  - `customOrbImage`, `orbSpill`, `orbImageScale`, etc.: Temporary state for the editor.
  - `orbFavorites`: Array of persisted presets.
  - `addOrbFavorite()`: Action to commit current state to a new preset.
  - `applyOrbFavorite()`: Action to load a preset into the global player state.
  - `clearOrbFavorites()`: Action used for the one-time "clean slate" wipe.

---

## 3. Logic & State Chain

**The "Clean Slate" Protocol:**
On the first visit to the new configuration page, a `useEffect` hook checks for a `localStorage` flag (`orb_presets_wiped_v1`). If not found, it runs `clearOrbFavorites()` to wipe legacy data, ensuring a fresh start for the new system.

**Preservation of State:**
The configuration inputs (sliders, toggles) are bound directly to the global `configStore`. This means user adjustments are preserved even if they navigate away and come back, until they explicitly save or upload a new image.

**Advanced Masking:**
The page integrates with `OrbCropModal` to handle "Advanced Masks" (`orbAdvancedMasks`, `orbMaskRects`). These allow users to break free of the standard quadrant boxes and define custom crop areas, which is essential for "Spillover" effects where the character reaches out of the circle.
