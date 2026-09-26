# Explorer Hub Aesthetics

This document details the visual architecture and "Cool Blue" glassmorphic design system of the **Explorer Hub** (`ExplorerPage.jsx`).

---

## 1. Visual Philosophy: The "Glass Dashboard"
The Hub is designed as a premium, light-themed immersive dashboard. It avoids the "heavy black" or flat UI patterns found in traditional media managers, opting instead for a **vibrant, airy, and layered** aesthetic.

### Key Visual Pillars:
*   **Vibrancy**: Uses a radial gradient of high-key sky blues to create a bright, inviting foundation.
*   **Layering**: Implements multiple levels of transparency and blur to create a "frosted glass" depth.
*   **Minimalism**: Information is stripped down to core identifiers (Page Numbers) with no icons or sub-text, relying on scale for impact.

---

## 2. The Background System
The background is not a static color but a dynamic environment:
*   **Foundation**: `radial-gradient(circle at top left)` using Tailwind's `sky-400`, `sky-300`, and `sky-100`.
*   **Atmospheric Orbs**: Two large, heavily blurred (`100px+`) decorative orbs (one white, one sky-blue) are placed in opposite corners to simulate light sources and break up the gradient's uniformity.
*   **Z-Indexing**: These elements sit at `z-0`, behind the interactive grid.

---

## 3. The "Engulfing" Grid Logic
The grid container and its segments form the heart of the Hub's spatial logic.

### Structural Parameters:
*   **Fill Layout**: The grid container uses `w-full h-full` (within a `flex-1` flexbox) to maximize screen real estate below the navigation bar.
*   **Gap Colors**: The container background is set to `bg-sky-900/10`. In combination with a `gap-[2px]`, this creates distinctive, dark sky-blue "division lines" between the glass squares.
*   **Glass Segments**:
    *   **Base State**: `bg-white/30` with `backdrop-blur-md` and a thin `white/10` border.
    *   **Hover State**: Smoothly transitions to `bg-white/50`, increasing the "frosting" density and brightening the segment.

---

## 4. Scaling Typography Logic
The Roman numerals (or standard numbers) inside the squares use a smart scaling system to maintain visual balance across different grid densities.

### The `getFontSize` Heuristic:
The component calculates font size based on two factors: **Layout Type** and **Character Length**.

| Layout Mode | String Length | Tailwind Class | Usage Context |
|-------------|---------------|----------------|---------------|
| **Giant** (1-3) | 1-2 chars | `text-[14rem]` | Single digits / Simple I, II |
| **Giant** (1-3) | 3+ chars | `text-[9rem]` | Large numbers / VIII, XII |
| **Grid** (4+) | 1-2 chars | `text-8xl` | Standard page count |
| **Grid** (4+) | 3+ chars | `text-5xl` | Very high page counts (10+) |

*   **Style**: Uses `font-thin` with `tracking-tighter` to evoke a high-end, modern architectural feel.
*   **Interactions**: On hover, the label gains a `drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]` white glow and scales by `1.05x`.

---

## 5. UI Elements
*   **Integrated New Page Button**: Relocated from a floating global position to the **bottom-right corner of the final square** (`maxPageId`). This creates a logical "Add Next" flow and keeps the rest of the screen pristine.
*   **Navigation Header**: Uses the `BottomNavigation` component with a `sticky top-0` position. This provides a consistent "Back" and "Close (Fullscreen)" utility across all depth-heavy pages.
*   **Delete Controls**: A subtle trash icon appears in the top-right of secondary squares. It is tinted `sky-900/10` but glows red on hover for clear destructive feedback.
