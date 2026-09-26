# Bottom Navigation

The `BottomNavigation` component (`src/components/BottomNavigation.jsx`) acts as a secondary contextual navigation bar, designed to sit directly underneath the `TopNavigation` component natively. It seamlessly sticks to the top of the scroll port as the user scrolls, maintaining a rigid visual connection to the top of the page (similar to the `VideoSortFilters` bar on the Videos page).

## Purpose & Functionality

Despite its name implying a footer position, the `BottomNavigation` is functionally connected to the top of the screen. It provides a consistent, globally accessible location for critical navigation actions across secondary pages. 

The bar currently houses two primary button actions positioned on the right side:
1. **Back Button (ChevronLeft):** 
   - Uses `useNavigationStore` and `usePlaylistStore` to manage history.
   - Conditionally visible: Only appears when there is navigation history (`history.length > 0`) or an active `previewPlaylistId`.
   - Clicking it executes a `clearPreview()` if a preview is active, then navigates back via `goBack()`, or routes to the `'playlists'` page if no standard history exists.
2. **Close Button (X icon):**
   - Uses `useLayoutStore` to globally set the view mode to `'full'`.
   - Dismisses the current side menu / split-screen view entirely, returning the user to the full-screen video player context.

## Visual Design & Integration

The component borrows visual cues and styling from the overarching `THEMES` system (defaulting to the 'blue' theme to match `TopNavigation`).
*   **Sticky Behavior:** Uses `sticky top-0 z-40` to ensure it adheres to the top of the scrolling viewport.
*   **Aesthetics:** Incorporates a backdrop blur (`backdrop-blur-md`), dynamic theme backgrounds (`theme.menuBg`), subtle shadows, and borders that connect it smoothly to the parent headers above it.
*   **Integration:** The component is placed at the absolute top of the scrolling flex container (`flex-1 overflow-y-auto`) within its parent pages. This structural positioning ensures it sits precisely underneath the `TopNavigation` header without any gaps.

## Pages utilizing BottomNavigation

The bar provides a unified exit/return point across the following secondary application views:
*   `HistoryPage.jsx`
*   `PinsPage.jsx`
*   `LikesPage.jsx`
*   `OrbConfigPlaceholderPage.jsx`
*   `AppPage.jsx`
