# Integration Guide: Radial Menu → YouTube Player App

This guide explains how to integrate your Radial Menu system into your YouTube custom player app as a popup menu, while respecting your `layoutshell.jsx` bounds.

## 📋 Overview

You'll be extracting the **runtime component** (animation + rendering) from `ElementEditor.tsx` and creating a standalone component that:
- ✅ Maintains wraparound animation logic
- ✅ Preserves special text rendering (perspective warping)
- ✅ Works within your layout shell bounds
- ✅ Activates on special conditions (your trigger logic)

---

## 🎯 Step 1: Export Your Container Configuration

In your current Radial Menu 3 project:

1. Open the Elements Editor (`/elements` route)
2. Configure your containers, relationships, and viewport
3. Click **"Export Configuration"** button
4. Save the `container-config.json` file

This file contains:
- All container positions and shapes
- Container relationships (above/below)
- Teleport container settings
- Viewport box configuration
- Colors and styling

---

## 🎯 Step 2: Copy Required Files to Your YouTube Player Project

### Files to Copy:

1. **`components/RadialMenuRuntime.tsx`** (new file - see below)
   - Standalone runtime component (no editor UI)
   - All animation logic
   - Text rendering with perspective warping

2. **`public/dictionary.json`**
   - Your letter template definitions
   - Required for text rendering

3. **`container-config.json`** (your exported config)
   - Your menu layout
   - Can be stored in `public/` or loaded from your database

### Dependencies to Install:

```bash
npm install gsap perspective-transform
# or
yarn add gsap perspective-transform
```

**Required versions:**
- `gsap`: `^3.14.2` or higher
- `perspective-transform`: `^1.1.3` or higher

---

## 🎯 Step 3: Create the Runtime Component

Create `components/RadialMenuRuntime.tsx` in your YouTube player project. This is a simplified version that:
- Accepts configuration as props
- Renders only (no editor UI)
- Respects canvas size constraints
- Supports scroll wheel navigation
- Maintains all animation logic

**Key Features:**
- ✅ Wraparound animations with fade effects
- ✅ Perspective text warping
- ✅ GSAP morphing animations
- ✅ Scroll wheel controls
- ✅ Viewport clipping
- ✅ Multiple bundles support

---

## 🎯 Step 4: Integrate with Your Layout Shell

### Example: Wrapper Component

Create a wrapper component that respects your `layoutshell.jsx` bounds:

```tsx
// components/RadialMenuWrapper.tsx
'use client'

import { useState, useEffect } from 'react'
import RadialMenuRuntime from './RadialMenuRuntime'
import containerConfig from '@/public/container-config.json' // or load from DB

interface LayoutBounds {
  x: number
  y: number
  width: number
  height: number
}

interface RadialMenuWrapperProps {
  isVisible: boolean
  layoutBounds: LayoutBounds // From your layoutshell
  onClose?: () => void
}

export default function RadialMenuWrapper({ 
  isVisible, 
  layoutBounds,
  onClose 
}: RadialMenuWrapperProps) {
  const [config, setConfig] = useState(null)

  // Load configuration (from file or database)
  useEffect(() => {
    // Option 1: Load from file
    fetch('/container-config.json')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Failed to load menu config:', err))

    // Option 2: Load from your database
    // loadMenuConfigFromDB(configId).then(setConfig)
  }, [])

  if (!isVisible || !config) return null

  // Calculate canvas size to fit within layout bounds
  const canvasWidth = Math.min(layoutBounds.width, 1200)
  const canvasHeight = Math.min(layoutBounds.height, 1000)

  // Scale container points to fit new canvas size
  const scaledConfig = {
    ...config,
    containers: config.containers.map(container => ({
      ...container,
      points: container.points.map(point => ({
        x: (point.x / 1200) * canvasWidth,
        y: (point.y / 1000) * canvasHeight
      }))
    })),
    viewportBox: config.viewportBox ? {
      x: (config.viewportBox.x / 1200) * canvasWidth,
      y: (config.viewportBox.y / 1000) * canvasHeight,
      width: (config.viewportBox.width / 1200) * canvasWidth,
      height: (config.viewportBox.height / 1000) * canvasHeight
    } : null
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${layoutBounds.x}px`,
        top: `${layoutBounds.y}px`,
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        zIndex: 1000, // Above video player
        pointerEvents: 'auto'
      }}
    >
      <RadialMenuRuntime
        config={scaledConfig}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onClose={onClose}
      />
    </div>
  )
}
```

---

## 🎯 Step 5: Use in Your YouTube Player

### Example Integration:

```tsx
// app/player/page.tsx or your main player component
'use client'

import { useState } from 'react'
import RadialMenuWrapper from '@/components/RadialMenuWrapper'
import { useLayoutBounds } from '@/hooks/useLayoutBounds' // Your layout shell hook

export default function YouTubePlayer() {
  const [showMenu, setShowMenu] = useState(false)
  const layoutBounds = useLayoutBounds('menu-area') // Get bounds from layoutshell

  // Trigger menu on special condition
  useEffect(() => {
    const handleSpecialCondition = () => {
      // Your trigger logic here
      if (/* your condition */) {
        setShowMenu(true)
      }
    }

    // Example: Show menu on keyboard shortcut
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' && e.ctrlKey) {
        setShowMenu(prev => !prev)
      }
    })

    return () => {
      window.removeEventListener('keydown', handleSpecialCondition)
    }
  }, [])

  return (
    <div>
      {/* Your YouTube player UI */}
      
      {/* Radial Menu Popup */}
      <RadialMenuWrapper
        isVisible={showMenu}
        layoutBounds={layoutBounds}
        onClose={() => setShowMenu(false)}
      />
    </div>
  )
}
```

---

## 🎯 Step 6: Adapt to Your Layout Shell

### Scaling Container Points

The original editor uses a 1200x1000 canvas. Your layout bounds may be different. Scale points proportionally:

```typescript
function scaleConfigToBounds(
  config: ContainerConfig,
  originalWidth: number,
  originalHeight: number,
  newWidth: number,
  newHeight: number
) {
  const scaleX = newWidth / originalWidth
  const scaleY = newHeight / originalHeight

  return {
    ...config,
    containers: config.containers.map(container => ({
      ...container,
      points: container.points.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY
      }))
    })),
    viewportBox: config.viewportBox ? {
      x: config.viewportBox.x * scaleX,
      y: config.viewportBox.y * scaleY,
      width: config.viewportBox.width * scaleX,
      height: config.viewportBox.height * scaleY
    } : null
  }
}
```

### CSS Integration

If your `layoutshell.jsx` uses CSS classes, apply them:

```tsx
<div
  className="menu-container" // Your layoutshell class
  style={{
    position: 'absolute',
    ...layoutBounds,
    zIndex: 1000
  }}
>
  <RadialMenuRuntime config={config} />
</div>
```

---

## 🔧 Key Functions Preserved

### 1. Wraparound Animation
- ✅ Dual fade animations (fade out + fade in)
- ✅ Teleport container system
- ✅ Reversed duplicate logic
- ✅ Smooth transitions

### 2. Text Rendering
- ✅ Perspective warping using `drawTransformedPath`
- ✅ Multi-letter text support
- ✅ Dictionary-based letter templates
- ✅ Custom colors and fonts

### 3. Scroll Navigation
- ✅ Scroll wheel controls
- ✅ Speed-based animation duration
- ✅ Throttling to prevent spam

### 4. Viewport Clipping
- ✅ Canvas clipping to viewport box
- ✅ Partial element visibility
- ✅ Clean boundaries

---

## 📝 Configuration Format

Your `container-config.json` should have this structure:

```json
{
  "containers": [
    {
      "id": "container-1",
      "bundleId": "bundle-1",
      "name": "Container 1",
      "points": [
        { "x": 200, "y": 200 },
        { "x": 800, "y": 200 },
        { "x": 800, "y": 600 },
        { "x": 200, "y": 600 }
      ],
      "color": "#1a1a1a",
      "contentColor": "#1a1a1a",
      "fontColor": "#ffffff",
      "imageUrl": null,
      "aboveContainerId": null,
      "belowContainerId": "container-2",
      "aboveTeleportContainerId": null,
      "belowTeleportContainerId": null,
      "teleportType": null
    }
  ],
  "bundles": [
    {
      "id": "bundle-1",
      "name": "Bundle 1"
    }
  ],
  "viewportBox": {
    "x": 200,
    "y": 200,
    "width": 800,
    "height": 600
  },
  "defaultColor": "#1a1a1a"
}
```

---

## 🐛 Troubleshooting

### Issue: Menu doesn't appear
- ✅ Check `isVisible` prop is `true`
- ✅ Verify `layoutBounds` are correct
- ✅ Check z-index is above video player

### Issue: Animations not working
- ✅ Verify GSAP is installed: `npm install gsap`
- ✅ Check browser console for errors
- ✅ Ensure configuration is loaded

### Issue: Text not rendering
- ✅ Verify `dictionary.json` is in `public/` folder
- ✅ Check dictionary format is correct
- ✅ Ensure container has text set

### Issue: Menu doesn't fit layout bounds
- ✅ Scale container points proportionally
- ✅ Adjust canvas size to match bounds
- ✅ Check viewport box is within bounds

---

## 🎉 Next Steps

1. ✅ Copy `RadialMenuRuntime.tsx` to your project
2. ✅ Install dependencies (`gsap`, `perspective-transform`)
3. ✅ Export your container configuration
4. ✅ Create wrapper component with layout bounds
5. ✅ Integrate into your YouTube player
6. ✅ Test scroll wheel navigation
7. ✅ Test wraparound animations
8. ✅ Verify text rendering

---

## 📚 Additional Resources

- **GSAP Documentation**: https://greensock.com/docs/
- **perspective-transform**: https://www.npmjs.com/package/perspective-transform
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

**Ready to integrate!** The runtime component maintains all the animation logic and text rendering from your editor, but without the editing UI. It's perfect for embedding in your YouTube player app.

