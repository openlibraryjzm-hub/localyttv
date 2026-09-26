# Extraction Guide: Copying Functions from ElementEditor.tsx

This guide shows you exactly which functions to copy from `ElementEditor.tsx` into `RadialMenuRuntime.tsx` to maintain all animation and rendering functionality.

---

## 📋 Functions to Copy

### 1. `drawTransformedPath` (Lines 2530-2745)

**Purpose**: Renders SVG text paths with perspective warping

**What to copy**: Entire function including:
- `transformPoint` helper
- `arcToCanvas` helper  
- SVG path command parsing (M, L, Z, A, C, H, V)
- Evenodd fill rule support

**Location in template**: Replace the TODO comment in `drawTransformedPath` function

---

### 2. `animateContentMorph` (Lines 1266-1347)

**Purpose**: GSAP-based morphing animation that animates each point individually

**What to copy**: Entire function including:
- Point-by-point animation logic
- GSAP tween creation
- Animation refs management
- Promise-based completion

**Location in template**: Replace the TODO comment in `animateContentMorph` function

---

### 3. `animateDirection` (Lines 1699-2330)

**Purpose**: Handles scroll up/down animations with wrap-around support

**What to copy**: Entire function including:
- Scroll speed to duration calculation
- Wrap-around detection logic
- Dual fade animation (fade out + fade in)
- Teleport container handling
- Duplicate element updates

**Location in template**: Replace the TODO comment in `animateDirection` function

**Key sections**:
- Lines 1699-1700: Function signature and duration calculation
- Lines 1701-2088: Scrolling list mode (if you use items)
- Lines 2090-2330: Normal animation mode with wrap-around

---

### 4. `enterAnimateMode` (Lines 854-1053)

**Purpose**: Initializes content elements from containers and creates teleport duplicates

**What to copy**: Entire function including:
- Content element creation from containers
- Teleport duplicate creation (reversed logic)
- Bundle processing
- Scrolling list mode support (if needed)

**Location in template**: Replace the TODO comment in the `useEffect` that initializes elements

**Key sections**:
- Lines 854-1053: Full initialization logic
- Lines 1011-1053: Teleport duplicate creation (REVERSED system)

---

### 5. `teleportContentElement` (Lines 1349-1365)

**Purpose**: Instantly moves element to target container (no animation)

**What to copy**: Entire function

**Location in template**: Add as a new function, use in `animateDirection`

---

## 🔧 Optional Functions (Advanced Features)

### 6. `drawWarpedImage` (Lines 2395-2529)

**Purpose**: Perspective warping for images (if you use image content)

**What to copy**: Entire function if you need image warping

---

### 7. Button Animation Functions (Lines 1367-1687)

**Purpose**: Cascading initialization and closing animations

**What to copy**: If you use button containers:
- `triggerButtonAnimation` (lines 1370-1498)
- `triggerClosingAnimation` (lines 1500-1687)

---

## 📝 Step-by-Step Copy Process

### Step 1: Copy `drawTransformedPath`

1. Open `ElementEditor.tsx`
2. Find line 2530 (`const drawTransformedPath`)
3. Copy lines 2530-2745 (entire function)
4. Paste into `RadialMenuRuntime.tsx` where the TODO comment is
5. Remove the TODO comment

### Step 2: Copy `animateContentMorph`

1. Find line 1266 (`const animateContentMorph`)
2. Copy lines 1266-1347
3. Paste into template where TODO comment is
4. Update dependencies in `useCallback` if needed

### Step 3: Copy `animateDirection`

1. Find line 1699 (`const animateDirection`)
2. Copy lines 1699-2330 (entire function)
3. Paste into template
4. This is the most complex function - contains wrap-around logic

### Step 4: Copy `enterAnimateMode` Logic

1. Find line 854 (`const enterAnimateMode`)
2. Copy lines 854-1053
3. Adapt to work in `useEffect` hook in template
4. Update state setters to match template

### Step 5: Copy `teleportContentElement`

1. Find line 1349 (`const teleportContentElement`)
2. Copy lines 1349-1365
3. Add as separate function in template

---

## ⚠️ Important Notes

### State Management Differences

The template uses simplified state. You may need to adapt:

**ElementEditor uses**:
```typescript
setContentElements(prev => ...)
```

**Template uses**:
```typescript
setContentElements(prev => ...) // Same, but check variable names
```

### Dependencies

Make sure all `useCallback` dependencies match:
- `contentElements` → `contentElements` (template)
- `containers` → `containers` (template)
- `bundles` → `bundles` (template)

### Refs

The template already sets up:
- `contentElementsRef` - syncs with state
- `animationRefs` - tracks GSAP tweens
- `scrollThrottleRef` - throttles scroll events

---

## ✅ Verification Checklist

After copying functions:

- [ ] `drawTransformedPath` renders text correctly
- [ ] `animateContentMorph` animates smoothly
- [ ] `animateDirection` handles wrap-around
- [ ] Scroll wheel triggers animations
- [ ] Text warping works with perspective
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Animations complete properly

---

## 🐛 Common Issues

### Issue: "Cannot read property 'points' of undefined"

**Solution**: Check that `contentElementsRef.current` is synced. The template includes this in a `useEffect`.

### Issue: Animations don't complete

**Solution**: Verify `animationRefs` is properly tracking tweens and calling `resolve()` in promises.

### Issue: Wrap-around doesn't work

**Solution**: Ensure teleport duplicates are created correctly (reversed: top in bottom, bottom in top).

### Issue: Text doesn't render

**Solution**: 
1. Check dictionary is loaded
2. Verify `drawTransformedPath` is called correctly
3. Check letter data exists in dictionary

---

## 🎉 Final Steps

1. Copy all functions listed above
2. Test scroll wheel navigation
3. Test wrap-around animations
4. Verify text rendering
5. Integrate into your YouTube player app

---

**You're done!** The runtime component now has all the animation and rendering logic from the editor, without the editing UI.

