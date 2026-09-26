# RadialMenuStandalone2.jsx - Usage Guide

## ✅ What Was Fixed

The component now correctly displays bundle item numbers during wraparound animations. The fix ensures that:
- Item numbers are consistently calculated from the actual element positions
- Teleport duplicates copy itemIndex from current top/bottom elements (not recalculated)
- All visible elements have their itemIndex updated correctly after wraparound

## 🚀 Quick Start

### 1. Copy the File

Copy `RadialMenuStandalone2.jsx` to your project.

### 2. Install Dependencies

```bash
npm install gsap
```

Note: `perspective-transform` is disabled in this version (using fallback transform).

### 3. Use It

```jsx
import RadialMenuStandalone from './RadialMenuStandalone2'

function MyApp() {
  return (
    <RadialMenuStandalone
      dictionaryConfig={yourDictionaryJson}
      containerConfig={yourContainerJson}
      backgroundColor="transparent"
    />
  )
}
```

## 📝 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `dictionaryConfig` | Object or String | Yes | Dictionary JSON object OR URL to load from |
| `containerConfig` | Object | Yes | Container configuration (see format below) |
| `backgroundColor` | String | No | Background color (default: "transparent") |

## 📋 Container Config Format

Your `containerConfig` must include:

```json
{
  "containers": [
    {
      "id": "container-1",
      "bundleId": "bundle-1",
      "points": [
        { "x": 200, "y": 200 },
        { "x": 800, "y": 200 },
        { "x": 800, "y": 600 },
        { "x": 200, "y": 600 }
      ],
      "color": "#1a1a1a",
      "contentColor": "#1a1a1a",
      "fontColor": "#ffffff",
      "teleportType": null
    }
    // ... more containers including teleport containers
  ],
  "bundles": [
    { "id": "bundle-1", "name": "Bundle 1" }
  ],
  "viewportBox": {
    "x": 200,
    "y": 200,
    "width": 800,
    "height": 600
  },
  "bundleItems": {
    "bundle-1": {
      "items": [
        { "id": "item1", "text": "Item 1", "color": "#1a1a1a", "fontColor": "#ffffff" },
        { "id": "item2", "text": "Item 2", "color": "#1a1a1a", "fontColor": "#ffffff" }
        // ... more items
      ]
    }
  },
  "visibleStartIndex": {
    "bundle-1": 0
  }
}
```

### Key Config Fields:

1. **`bundleItems`** (required for text bundles):
   - Maps bundle ID to an object with `items` array
   - Each item has: `id`, `text`, `color`, `fontColor`, `imageUrl` (optional)

2. **`visibleStartIndex`** (required for text bundles):
   - Maps bundle ID to the starting index in the items array
   - This is the index of the item shown at position 0 (top)

3. **`viewportBox`** (optional but recommended):
   - Defines the visible area of the menu
   - Eliminates black space by cropping to this area

4. **Teleport Containers** (required for wraparound):
   - Containers with `teleportType: "top"` or `teleportType: "bottom"`
   - Used for smooth wraparound animations

## 🎯 How Wraparound Works

The component uses a "REVERSED" teleport system:

- **Top teleport container**: Holds a copy of the current **bottom** element
  - When scrolling DOWN, this element fades in at the top
- **Bottom teleport container**: Holds a copy of the current **top** element
  - When scrolling UP, this element fades in at the bottom

After wraparound:
1. The duplicate element moves to its target position
2. All visible elements' `itemIndex` is recalculated based on their position
3. New teleport duplicates are created by copying from current top/bottom elements

## 📦 Example: Complete Setup

```jsx
import { useState, useEffect } from 'react'
import RadialMenuStandalone from './RadialMenuStandalone2'

function App() {
  const [dictionary, setDictionary] = useState(null)
  const [containerConfig, setContainerConfig] = useState(null)

  useEffect(() => {
    // Load dictionary
    fetch('/dictionary.json')
      .then(r => r.json())
      .then(setDictionary)

    // Load or create container config
    const config = {
      containers: [
        // Normal containers (6 for bundle-1)
        { id: "c1", bundleId: "bundle-1", points: [...], teleportType: null },
        { id: "c2", bundleId: "bundle-1", points: [...], teleportType: null },
        // ... 4 more normal containers
        
        // Teleport containers
        { id: "top-teleport", bundleId: "bundle-1", points: [...], teleportType: "top" },
        { id: "bottom-teleport", bundleId: "bundle-1", points: [...], teleportType: "bottom" }
      ],
      bundles: [
        { id: "bundle-1", name: "Main Menu" }
      ],
      viewportBox: { x: 0, y: 0, width: 1000, height: 800 },
      bundleItems: {
        "bundle-1": {
          items: Array.from({ length: 99 }, (_, i) => ({
            id: `item${i + 1}`,
            text: `Item ${i + 1}`,
            color: "#1a1a1a",
            fontColor: "#ffffff"
          }))
        }
      },
      visibleStartIndex: {
        "bundle-1": 0
      }
    }
    setContainerConfig(config)
  }, [])

  if (!dictionary || !containerConfig) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <RadialMenuStandalone
        dictionaryConfig={dictionary}
        containerConfig={containerConfig}
        backgroundColor="transparent"
      />
    </div>
  )
}
```

## 🔧 Key Features

1. **Dual Bundle Scrolling**: Supports multiple bundles scrolling independently
2. **Wraparound Animation**: Smooth fade in/out with correct item numbers
3. **Viewport Cropping**: Eliminates black space using viewportBox
4. **Config-Driven**: All behavior controlled by JSON configs

## ⚠️ Important Notes

1. **Bundle ID**: Only `bundle-1` is treated as a text bundle by default. Modify line 180 if you need different bundle IDs.

2. **Item Index Calculation**: 
   - Visible element at position `i`: `items[(startIndex + i) % items.length]`
   - After scrolling DOWN: `newStartIndex = (startIndex + 1) % items.length`
   - After scrolling UP: `newStartIndex = (startIndex - 1 + items.length) % items.length`

3. **Teleport Duplicates**: 
   - Created by copying `itemIndex` from actual current elements
   - Not recalculated from `startIndex` (this was the bug fix)

## 🐛 Troubleshooting

### Issue: Numbers show randomly during wraparound

**Solution**: Ensure `bundleItems` and `visibleStartIndex` are in your config, and teleport containers exist.

### Issue: Menu doesn't scroll

**Solution**: Check that:
- Teleport containers exist with `teleportType: "top"` and `teleportType: "bottom"`
- Normal containers are in correct order
- `bundleItems` has items for the bundle

### Issue: Black space around menu

**Solution**: Add `viewportBox` to your config that matches your menu bounds.

## ✅ Checklist for Integration

- [ ] Copy `RadialMenuStandalone2.jsx` to your project
- [ ] Install `gsap`: `npm install gsap`
- [ ] Prepare dictionary JSON (or load from URL)
- [ ] Prepare container config with:
  - [ ] `containers` array (normal + teleport containers)
  - [ ] `bundles` array
  - [ ] `bundleItems` with items for each text bundle
  - [ ] `visibleStartIndex` for each text bundle
  - [ ] `viewportBox` (optional but recommended)
- [ ] Test scroll wheel navigation
- [ ] Verify numbers display correctly during wraparound

## 🎉 You're Ready!

The component is now fully functional with correct wraparound number display. Just provide your dictionary and container configs, and it will work!


