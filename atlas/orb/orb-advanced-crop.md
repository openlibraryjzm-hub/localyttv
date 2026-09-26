# Advanced Orb Editing & Cropping

This document details the "Advanced Orb Crop" feature, a specialized editor integrated into the **OrbPage** designed to provide precise control over "Spillover Orb" images.

## 1. Feature Overview

The Advanced Orb Editor allows users to define custom, non-standard crop areas for each of the four orb quadrants (Top-Left, Top-Right, Bottom-Left, Bottom-Right). Instead of the default "infinite spill" (where the image simply overflows the quadrant boundaries), users can define precise rectangular masks.

**Entry Point:**
- Located in the **Orb Configuration** tab of the settings page.
- Accessed via a small "Expand/Arrows" button overlaid on the "Spill Areas" visualizer.

## 2. Component Architecture

### `OrbCropModal.jsx`
- **Type**: Integrated Page-Level Component (Absolute Positioning).
- **Mobile-First Design**: Optimized for Android tablets with 50% UI scaling for toolbars and buttons, ensuring maximum visibility of the orb during editing.
- **Container**: Uses an `80vmin` square reference frame to maximize screen real estate while maintaining the orb's aspect ratio.
- **Visuals**:
  - Renders the full high-resolution orb image `object-contain`.
  - Overlays a complex SVG mask that dims "inactive" areas and reveals "active" spill areas.
  - Draws "Ghost UI" guides (wireframes of the Playlist and Video menu rectangles) to show context.

### State Management
The feature determines its state from the global `configStore` to ensure persistence across sessions and presets.

**New Config Keys:**
- `orbAdvancedMasks` (`{ tl, tr, bl, br }`): Booleans toggling whether a quadrant uses the default infinite spill or a custom user-defined mask.
- `orbMaskRects` (`{ tl: {x,y,w,h}, ... }`): detailed coordinate objects (0-100%) defining the custom crop rectangle for each quadrant.
- `isOrbPreviewMode`: Global boolean in `configStore` that forces the Player Controller to show the current editor state, bypassing playlist-level overrides.

## 3. UI Interactions

### Center Control Cluster
- A centralized "D-Pad" of buttons allows users to toggle "Advanced Mode" for specific quadrants.
- Buttons are mapped spatially to mirror the quadrants they control (e.g., TL button is in the cluster's TL position).

### Interactive Drawing Tools
- **Drag & Drop**: When a quadrant is in "Advanced Mode" (Rect), a blue selection box appears.
- **Resizing**: Corner handles allow resizing the crop area.
- **Path Mode**: (Experimental) Allows clicking to place custom points for freeform shapes.
- **Relaxed Bounds**: Logic permits dragging/resizing well outside the standard 0-100% box. This allows users to capture "true spillover" content that exists far outside the central orb area.
- **Persistence**: Clicking "Finish" triggers an automatic update to the active Orb Favorite preset, ensuring changes are saved to the persistent database.

## 4. Implementation Status

**Completed Features:**
- Global Store integration for persistence (`configStore`).
- Integrated page-level UI for real-time visual context.
- **Orb Preview Mode**: Automatic store-level toggle that ensures the Player Controller displays live edits immediately.
- **High-Density UI**: Condensed toolbar (50% size) for Android tablet accessibility.
- **Relaxed Bounds System**: Support for coordinates outside the 0-100% range for extreme spillover.
- **Persistence Logic**: Auto-save on "Finish" targeting the active favorite preset.

## 6. Rendering Reliability (Android WebView)

To ensure consistent rendering on mobile devices, the following technical safeguards are implemented:

1.  **Dynamic Clip-Path IDs**: The system generates unique IDs (e.g., `#orbClipPath-preview` or `#orbClipPath-favId`) for every state change. This bypasses aggressive SVG caching in Android WebViews that often prevents masks from updating.
2.  **Path over Polygon**: Freeform shapes use the standard `<path d="M...L...Z">` syntax with high-precision (`.toFixed(4)`) coordinates for maximum browser compatibility.
3.  **Visual Separation**: Decorative elements (shadows, blurs) are rendered in a dedicated "Underlay" div to prevent CSS clipping bugs that occur when combining `clip-path` with `backdrop-filter`.

## 7. Path Mode (Freeform Cropping)

The Advanced Orb Editor supports a "Path Mode" for creating complex, non-rectangular crop shapes:

- **Freeform Selection**: Users can click anywhere on the canvas to add points, creating a custom polygonal mask.
- **Visual Feedback**: The current path is visualized with lines connecting the points, and a live preview of the mask is updated in real-time.
- **Precision**: Coordinates are stored as 0-100% values but rendered with high decimal precision to ensure alignment across different screen densities.
- **Editing**: Points can be added to refine the shape, offering greater flexibility than standard rectangular crops.
- **Known Issue**: On certain Android WebViews, path-based crops may occasionally require a "refresh" (switching orbs) to appear if GPU acceleration is inconsistent. Rectangle crops remain the most stable fallback.
