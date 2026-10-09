# Control Guide & Tutorial Modal Documentation (`ControlTutorialModal.jsx`)

**Purpose**: This document provides the complete architecture, implementation details, side-effect safeguards, and instructions for extending the **Control Guide & Tutorial Modal** (`ControlTutorialModal.jsx`).

---

## 1. Overview & Aesthetics

The Control Guide Modal is a video-game inspired, hyper-minimalist, borderless, transparent tutorial system triggered by:
* Clicking the **`?`** button on the Central Orb Menu.
* Calling `openControlTutorial(0)` from `useLayoutStore`.

### Aesthetic Constraints
* **Transparent & Floating**: No heavy modal card frames, outer bounding boxes, slate headers, or footers.
* **Dark Blurred Backdrop**: Renders directly on a `bg-slate-900/60 backdrop-blur-md` overlay.
* **Pure UI Sprites**: UIs float on screen with subtle scale animations (`hover:scale-105`) and drop shadows (`drop-shadow-2xl`).
* **Minimalist Floating Controls**:
  * Top-Left: **`← Back to Menus`** pill button (in 1:1 Inspection View).
  * Top-Right: **`Close ✕`** pill button (also supports clicking backdrop or pressing Esc to close).

---

## 2. Architecture & Dual-View State

State is managed by `selectedMenuId` in `ControlTutorialModal.jsx`:

### 2.1 View 1: Spritesheet Menu Select Grid (`selectedMenuId === null`)
* Displays floating 1:1 UI sprites of all registered app menus.
* Clicking any menu sprite transitions into that menu's 1:1 detail inspection view (`setSelectedMenuId(id)`).
* Wrapper `div` uses `pointer-events-none` on inner subcomponents to ensure the entire sprite acts as a single clean button.

### 2.2 View 2: Detailed 1:1 Inspection View (`selectedMenuId !== null`)
* **Left Half (`md:col-span-6`)**: Renders the 1:1 live subcomponent (`PlayerControllerPlaylistMenu`, `PlayerControllerOrbMenu`, or `PlayerControllerVideoMenu`).
* **Hover Detection**: `handleContainerMouseMove` tracks `e.target.closest('[title]')` and matches the HTML `title` attribute against `getExplanationForTitle(titleAttr, selectedMenuId)`.
* **Right Half (`md:col-span-6`)**: Displays a floating minimalist glass explanation card (`bg-white/95 border-2 border-[#052F4A] rounded-2xl p-6 shadow-2xl backdrop-blur-md`).
  * Features an uppercase bold title, icon, and single-block explanation paragraph containing `<LClickBadge />` and `<RClickBadge />` mouse action symbols.

---

## 3. Currently Registered Menus

| Menu ID | Subcomponent | Description |
| :--- | :--- | :--- |
| `'playlist'` | `PlayerControllerPlaylistMenu` | Top Playlist Menu (title, presets, group carousel, history chevrons) |
| `'orb'` | `PlayerControllerOrbMenu` | Central Orb Menu (8 surrounding buttons: Orb Config, Banners, API Key, Nav Toggle, Explorer Hub, Chevrons) |
| `'video'` | `PlayerControllerVideoMenu` | Top Video Menu (chevrons, folder filters, pin, like, shuffle, `?` Control Guide button) |

---

## 4. Key Implementation Details & Technical Safeguards

### 4.1 Orb Image Crop & Mask Synchronization
* `PlayerControllerOrbMenu` relies on an SVG `<clipPath id="orbClipPath-default">` element generated from `useConfigStore` (`customOrbImage`, `orbImageScale`, `orbImageScaleW`, `orbImageScaleH`, `orbImageXOffset`, `orbImageYOffset`, `orbSpill`, `orbAdvancedMasks`, `orbMaskRects`, `orbMaskPaths`).
* `ControlTutorialModal.jsx` renders this SVG `<clipPath>` generator element inside its root return statement, guaranteeing that the orb image in the tutorial modal adheres 100% to your active crop/mask configuration.

### 4.2 Audio Visualizer Isolation (`isVisualizerActive: false`)
* Active `<AudioVisualizer />` components capture desktop WASAPI audio via Tauri Rust backend (`start_audio_capture`/`stop_audio_capture`).
* To prevent duplicate visualizers from conflicting or stopping audio capture:
  1. `PlayerControllerOrbMenu.jsx` accepts `isVisualizerActive = true` and forwards it to `<AudioVisualizer isActive={isVisualizerActive} />`.
  2. `mockOrbProps` in `ControlTutorialModal.jsx` passes:
     * `isVisualizerEnabled: true` *(Renders the aesthetic visualizer ring)*
     * `isVisualizerActive: false` *(Disables audio capture, event listeners, and media streams for zero conflicts)*

---

## 5. Guide for Adding New Menus in Future Sessions

To add a new menu (e.g. `Videos Page Toolbar`, `Playlist Bar`, `Explorer Page Header`):

1. **Define Explanations Dictionary**:
   ```javascript
   const newMenuExplanations = {
     buttonOne: {
       title: "Button Title",
       icon: LucideIcon,
       renderDescription: () => (
         <span>
           Description text. <LClickBadge /> to action, <RClickBadge /> to secondary.
         </span>
       )
     }
   };
   ```

2. **Define Mock Props Object**:
   ```javascript
   const mockNewMenuProps = {
     getInspectTitle: (label) => label,
     // ... required subcomponent props ...
   };
   ```

3. **Update `getExplanationForTitle(titleAttr, menuId)`**:
   ```javascript
   } else if (menuId === 'newMenu') {
     if (lower.includes('button title')) return newMenuExplanations.buttonOne;
   }
   ```

4. **Add Sprite to Spritesheet View (`selectedMenuId === null`)**:
   ```jsx
   <div 
     onClick={() => setSelectedMenuId('newMenu')}
     className="cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 drop-shadow-2xl"
     title="New Menu - Click to inspect"
   >
     <div className="pointer-events-none">
       <NewMenuSubcomponent {...mockNewMenuProps} />
     </div>
   </div>
   ```

5. **Add Subcomponent to Detailed 1:1 Inspection View (`selectedMenuId !== null`)**:
   ```jsx
   {selectedMenuId === 'newMenu' && (
     <div className="transform hover:scale-[1.02] transition-transform drop-shadow-2xl">
       <NewMenuSubcomponent {...mockNewMenuProps} />
     </div>
   )}
   ```

---

## 6. File Manifest

* `src/components/ControlTutorialModal.jsx`: Main tutorial modal component.
* `src/components/PlayerControllerOrbMenu.jsx`: Central Orb menu subcomponent.
* `src/components/PlayerControllerPlaylistMenu.jsx`: Top Playlist menu subcomponent.
* `src/components/PlayerControllerVideoMenu.jsx`: Top Video menu subcomponent.
* `src/store/layoutStore.js`: Zustand store managing `isControlTutorialOpen` and `openControlTutorial`.
