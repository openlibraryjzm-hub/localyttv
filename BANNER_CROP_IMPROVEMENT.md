# Banner Crop Mode Improvement - Implementation Summary

## Overview
Replaced the modal-based banner cropping experience with an **inline editing mode** that allows users to draw SVG paths directly on the actual banner without any context switching.

## Problem Statement
The original `BannerCropModal` component had poor UX due to:
- **Context Disconnect**: Users had to switch between a modal preview and the actual banner
- **Small Preview**: The modal showed a small preview that didn't match the actual banner experience
- **Cognitive Load**: Hard to visualize how the crop would look on the real banner

## Solution: Inline Crop Mode

### New Component: `InlineBannerCropMode.jsx`
Created a new component that overlays the actual banner (fixed at top of screen) and allows direct interaction:

**Key Features:**
1. **Direct Drawing**: Click anywhere on the banner OR spill area to add mask points
2. **Spill Area Support - Composite Masking**: 
   - **Banner area (0-200px): ALWAYS VISIBLE** - Automatically included in the mask
   - **Spill area (200px+): SELECTIVE** - Only your drawn path is visible
   - Visual boundary indicator (dashed rose line) shows where banner ends and spill begins
   - Creates a composite SVG mask: full rectangle for banner + custom polygon for spill
   - Critical for creating unified compositions between banner and spill areas
   - Example: Character's head in banner (always visible) + selectively include their body from spill
3. **Real-Time Preview**: See changes applied instantly as you draw
4. **Visual Feedback**:
   - Green dot for starting point
   - Blue dots for subsequent points
   - Dashed lines connecting points
   - Semi-transparent fill preview (3+ points)
   - Cursor preview dot
   - "Close path" indicator when hovering near start point

5. **Contextual Controls** (floating panel in bottom-right):
   - Point counter
   - Instructions & keyboard shortcuts
   - Undo button (Ctrl+Z)
   - Clear button (Delete/Backspace)
   - Done button (Esc)

6. **Bottom Info Bar**: Dynamic instructions based on current state

### Architecture Changes

#### State Management
- Added `bannerCropModeActive` and `setBannerCropModeActive` to `configStore.js`
- This allows the crop mode to be activated from `AppPage.jsx` but rendered at the app root level

#### Component Hierarchy
```
App.jsx (root)
├── InlineBannerCropMode (overlays banner when active)
└── LayoutShell
    └── Banner (the actual banner being edited)
```

#### Files Modified
1. **`src/components/InlineBannerCropMode.jsx`** (NEW)
   - Inline crop mode overlay component
   - Handles SVG path drawing, keyboard shortcuts, visual feedback

2. **`src/store/configStore.js`**
   - Added `bannerCropModeActive` state
   - Added `setBannerCropModeActive` action

3. **`src/components/AppPage.jsx`**
   - Removed `BannerCropModal` import
   - Updated to use `bannerCropModeActive` from store
   - Removed local crop mode rendering (now at app level)

4. **`src/App.jsx`**
   - Added `InlineBannerCropMode` import
   - Added `useConfigStore` import
   - Renders `InlineBannerCropMode` at app root level

5. **`atlas/app-banner.md`**
   - Updated documentation to describe inline crop mode
   - Detailed feature list and UX improvements

### User Experience Flow

**Before (Modal-based):**
1. User hovers over banner preview in settings
2. Clicks "Crop Shape" button
3. Modal opens on the side
4. User draws on small preview
5. User switches focus to actual banner to check result
6. Repeat steps 4-5 until satisfied
7. Click "Done" to close modal

**After (Inline mode):**
1. User hovers over banner preview in settings
2. Clicks "Crop Shape" button
3. **Inline mode activates** - banner at top becomes interactive
4. User draws directly on the actual banner
5. **Real-time preview** shows exactly what they're getting
6. Press Esc or click "Done" when satisfied

### Technical Implementation Details

**Z-Index Layering:**
- Inline crop mode: `z-[200]` (top-most)
- Controls panel: `z-[100]` (within crop mode)
- Banner: `z-100` (normal)

**Event Handling:**
- Click detection on overlay
- Keyboard shortcuts (Esc, Ctrl+Z, Delete, Backspace)
- Mouse tracking for cursor preview
- Hover detection for "close path" indicator

**SVG Rendering:**
- Uses `viewBox="0 0 100 100"` with `preserveAspectRatio="none"` for responsive scaling
- Points stored as percentages (0-100) for resolution independence
- Polygon fill preview with 15% opacity
- Dashed stroke lines for visual clarity

**Composite Mask Generation (LayoutShell.jsx):**
- Calculates banner height percentage: `(200 / totalHeight) * 100`
- Creates SVG with two layers:
  1. **Rectangle layer**: `<rect>` covering 0 to bannerHeightPercent (always visible)
  2. **Polygon layer**: User's custom path (selective spill inclusion)
- Both layers use `fill='black'` (opaque in CSS mask-image)
- Mask applied with `mask-size: 100% 100%` and `mask-repeat: no-repeat`
- Result: Banner area always shows, spill area follows user's custom shape

### Benefits

1. **No Context Switching**: Edit directly on the actual banner
2. **WYSIWYG**: What you see is exactly what you get
3. **Better Spatial Awareness**: Full-size banner makes it easier to judge proportions
4. **Faster Workflow**: No need to open/close modals
5. **More Intuitive**: Direct manipulation feels natural
6. **Keyboard Shortcuts**: Power users can work faster

### Future Enhancements (Potential)

- Point editing (drag to reposition existing points)
- Bezier curves for smoother shapes
- Snap-to-grid option
- Preset shapes (circle, rectangle, etc.)
- Multi-path support (multiple separate shapes)
- Undo/redo history stack

## Testing Checklist

- [ ] Crop mode activates when clicking "Crop Shape" in AppPage
- [ ] Can draw points on the banner
- [ ] Points connect with lines
- [ ] Fill preview appears after 3+ points
- [ ] Green dot marks start point
- [ ] Cursor preview dot follows mouse
- [ ] Undo button removes last point
- [ ] Clear button removes all points
- [ ] Esc key exits crop mode
- [ ] Ctrl+Z undoes last point
- [ ] Delete/Backspace clears all points
- [ ] Mask applies to actual banner after exiting
- [ ] State persists across page navigation
