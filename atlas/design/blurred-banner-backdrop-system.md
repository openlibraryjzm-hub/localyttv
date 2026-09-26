# Atmospheric Blurred App Banner Backdrop System

The **Blurred App Banner Backdrop System** is an architectural pattern used across major UI containers (`FullscreenVideoInfo`, `PlayerControllerPlaylistMenu`, `PlayerControllerVideoMenu`, and `VideosPage`). It renders a rich, atmospheric overlay derived from the active App Banner image over a solid opaque container, eliminating see-through content bleed while establishing visual continuity across the application.

---

## 1. Architectural Principles

1. **Solid Opaque Base Container**:
   - Containers use `position: relative; overflow: hidden; bg-slate-950` (or `bg-black`).
   - Content behind the container never bleeds through, ensuring strict layout boundaries and predictable contrast.

2. **Isolated Background Layer (`z-0`)**:
   - An absolute positioned `div` (`aria-hidden="true" pointer-events-none z-0 overflow-hidden`) renders the App Banner background.
   - Applies CSS `filter: blur(28px - 36px)` and `transform: scale(1.15 - 1.25)` to prevent edge blur vignetting.
   - An optional depth gradient overlay (`bg-gradient-to-b from-black/20 via-transparent to-black/40`) enhances contrast.

3. **Unclipped Popups & Modals**:
   - For components with dropdowns or popups (such as the Top Controller Menus), the outer card container maintains `position: relative; overflow: visible`.
   - The blurred background is constrained inside a child layer (`inset-0 rounded-2xl overflow-hidden pointer-events-none z-0`) so popups, tooltips, and color picker modals float freely beyond the card boundaries without clipping.

4. **Dynamic Config Store Sync**:
   - All components consuming the banner backdrop query `useConfigStore` to resolve `effectiveBanner`:
     ```javascript
     let effectiveBanner = fullscreenBanner;
     if (bannerNavBannerId && !bannerPreviewMode && bannerPresets?.length) {
       const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
       if (preset?.fullscreenBanner) effectiveBanner = preset.fullscreenBanner;
     }
     const bannerImage = effectiveBanner?.image || '/banner.PNG';
     const bannerScale = effectiveBanner?.scale ?? 100;
     const bannerVertical = effectiveBanner?.verticalPosition ?? 0;
     const bannerHorizontal = effectiveBanner?.horizontalOffset ?? 0;
     ```
   - Real-time edits in Settings or preset switching instantly update all blurred backdrops simultaneously.

5. **Text & Icon Contrast**:
   - Content layers float above at `position: relative; z-index: 10`.
   - White text and icons enforce black drop shadows and stroke outlines (`textShadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000` or `-webkit-text-stroke: 1px #000`) so UI elements remain 100% readable regardless of banner brightness or color distribution.

---

## 2. Consuming Components Manifest

| Component | File Path | Blur Radius | Scale | Base Background | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fullscreen Video Info** | `src/components/FullscreenVideoInfo.jsx` | `28px` | `1.15` | `bg-slate-950` | Right margin metadata panel in fullscreen mode |
| **Top Playlist Menu** | `src/components/PlayerControllerPlaylistMenu.jsx` | `28px` | `1.15` | `bg-slate-950` | Left controller menu; outer container `overflow: visible` |
| **Top Video Menu** | `src/components/PlayerControllerVideoMenu.jsx` | `28px` | `1.15` | `bg-slate-950` | Right controller menu; outer container `overflow: visible` |
| **Videos Page** | `src/components/VideosPage.jsx` | `36px` | `1.25` | `bg-slate-950` | Core video grid page background |

---

## 3. Implementation Blueprint

```jsx
import React from 'react';
import { useConfigStore } from '../store/configStore';

export default function BannerContainer({ children }) {
  const {
    fullscreenBanner,
    bannerNavBannerId,
    bannerPresets,
    bannerPreviewMode,
  } = useConfigStore();

  let effectiveBanner = fullscreenBanner;
  if (bannerNavBannerId && !bannerPreviewMode && bannerPresets?.length) {
    const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
    if (preset?.fullscreenBanner) effectiveBanner = preset.fullscreenBanner;
  }

  const bannerImage = effectiveBanner?.image || '/banner.PNG';
  const bannerScale = effectiveBanner?.scale ?? 100;
  const bannerVertical = effectiveBanner?.verticalPosition ?? 0;
  const bannerHorizontal = effectiveBanner?.horizontalOffset ?? 0;

  return (
    <div className="relative overflow-hidden bg-slate-950 w-full h-full">
      {/* Blurred Backdrop Layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bannerImage})`,
            backgroundPosition: `${bannerHorizontal}% ${bannerVertical}%`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: `${bannerScale}vw auto`,
            filter: 'blur(36px)',
            transform: 'scale(1.25)',
            opacity: 0.85,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
```
