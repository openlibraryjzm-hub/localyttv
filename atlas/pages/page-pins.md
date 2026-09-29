# Pins Page

The Pins Page provides a dedicated interface for reviewing temporally saved videos, grouped aggressively by categorization and date.

**Related Documentation:**
- **Navigation Flows**: See `navigation-routing.md`.
- **Backdrop System**: See `blurred-banner-backdrop-system.md` for background styling.
- **Tasks Integration**: See `tasks-page.md` for task checklists.
- **Card UI**: See `card-video.md` for pin icon cyclic behaviors.

---

## 1. Visual Structure & Layout

- **Atmospheric Blurred App Banner Backdrop**:
  - Anchored on a solid `bg-slate-950` container with an absolute positioned blurred banner overlay (`filter: blur(36px)`, `transform: scale(1.25)`, `opacity: 0.85`), dynamically synced to the active App Banner / preset image in real-time.

- **Sticky Top Navbar (`BottomNavigation.jsx`)**:
  - A sticky top header card (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl p-2.5 shadow-md sticky top-0 z-40`).
  - **Left Side**: Page title ("Pinned Videos") in bold dark navy text (`text-[#052F4A] font-black`).
  - **Right Side**: Action pills for **Back** (`ChevronLeft` chevron arrow) and **Close** (`X` button, toggles `setViewMode('full')`).

- **Tasks Link Button**:
  - Direct navigation button (List icon + "Tasks" label + chevron) positioned at the top of content to jump instantly to the `Tasks Page`.

- **Priority Pins Carousel (Top)**:
  - Consistently ranks videos pinned directly through the long-press (Priority Pin) mechanic.
  - Housed inside a **collapsible wrapper** labeled "Priority Pins - History" that initializes expanded by default.
  - Formatted explicitly via the `StickyVideoCarousel` implementation. Automatically scrolling horizontally.
  - Persistently sorted strictly by most recently pinned logic on the leftmost edge.

- **Regular Pins Grid (Main)**:
  - Standard pinned videos output directly below the priority section.
  - Contains all dynamically modified pins, including Followers (`FollowerPinIds`).
  - **Date Groupings**: Videos are segregated dynamically based on their `pinnedAt` timestamps (e.g., "30th January, 2026").
  - Each grouping provides a date header showing the exact day and internal video count below it.
  - Video Cards within each block render identical to the main grid output parameters.

## 2. Interaction & Logic

### Data Processing 
- Reads `pinnedVideos` and `priorityPinIds` concurrently straight from `pinStore.js` (`localStorage` context). 
- Filters standard maps into `priorityVideos` and `regularVideos` prior to mapping.
- Ensures the Priority items render chronologically synced against their internal `priorityPinIds` index.
- Ensures `regularVideos` render exclusively descending based on raw timestamps.

### Source Control
- Session-based interactions from any `VideoCard` components explicitly map updates back into the central `pinStore`.
