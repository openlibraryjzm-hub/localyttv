# Top Navigation

The `TopNavigation` component (`src/components/TopNavigation.jsx`) acts as the contextual mini-header across the application, sitting just below the main `PlayerController` area. It dynamically updates its contents, layout, and styling based on the current page and active context. Note that for the main **Playlists** and **Videos** pages, this component now returns `null` and hides itself completely, allowing the sticky toolbars on those pages to sit entirely flush with the app banner above it.

## Visual Design & Aesthetics

The Top Navigation bar is designed to be visually engaging and context-aware:

*   **Color Themes:** When browsing a specific colored folder or a playlist, the bar applies an intense vertical linear gradient matching that specific context (defaulting to blue for playlists, gray for unsorted, and the specific 16-color hex for folders). 
*   **3D Animated Mesh Pattern:** To provide a premium and dynamic feel, a CSS-only animated geometric mesh pattern overlays the color gradient. 
    *   It uses `mixBlendMode: overlay` to ensure it looks good over any folder color.
    *   3D hardware acceleration transforms (`rotateX`, `rotateZ`, `perspective`) create a sense of depth.
    *   An infinite sliding keyframe animation gives it a continuous scrolling "fly-through" grid effect.
*   **Typography:** The context title features prominent white text with a crisp black outline (`WebkitTextStroke`) to guarantee readability against any background. (The "Unsorted" folder inverts this, using black text with a white stroke).

## Layout & Components

The Top Navigation acts primarily as a dynamic title bar. Previous legacy action buttons (such as carousel controls, view toggles, add buttons, and back/close navigation) have been migrated to components like the `PlaylistBar` to streamline the UI.

### Floating Context Title

Instead of a static layout, the active context (current playlist, active colored folder, or specifically hovered elements) is displayed as a prominent **floating title** using a React Portal (spanning over other UI elements like the App Banner).

*   **Dynamic Tracking:** This floating title tracks the user's focus dynamically. When hovering over colored folder options in the `PlaylistBar` prism, `GroupPlaylistCarousel` boxes, or the `PlaylistGroupColumn` (assign to folder), the title instantly updates its text and styling to match the hovered color context (falling back to user-defined custom carousels names if hovering over an existing group). 
*   **Aesthetics:** The font uses a heavy weight (`font-black`) with a high-contrast text stroke/shadow (white text with a thick black outline, or inverted black text with a white stroke for "Unsorted" views).
*   **Splatter Glow Backdrop:** The background relies on a massive, dual-layered dynamic glow rather than a hard rectangular box. A wide, soft diffuse glow (50px blur) provides atmosphere, while an intense core glow (30px blur, higher opacity) sits directly behind the text. Both glows use the active folder's hex color so the title radiates its context vibrantly.

## State Dependencies

This component relies on Zustand stores to derive its display state:
*   `useNavigationStore`: Tracks history and current page.
*   `useLayoutStore`: Determines inspect modes and other layout state.
*   `usePlaylistStore`: Determines the active playlist (or a playlist currently being "previewed").
*   `useFolderStore`: Determines which specific 16-color folder (or 'unsorted') is currently active within a playlist.
