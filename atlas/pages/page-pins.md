# Pins Page

The Pins Page provides a dedicated interface for reviewing temporally saved videos, grouped aggressively by categorization and date.

**Related Documentation:**
- **Navigation Flows**: See `navigation-routing.md`.
- **Tasks Integration**: See `tasks-page.md` for task checklists.
- **Card UI**: See `card-video.md` for pin icon cyclic behaviors.

---

## 1. Visual Structure & Layout

- **Page Banner**: Uses the standard Pinned Videos banner context overlay. Features a direct navigation button (List icon + label + chevron) to jump instantly to the `Tasks Page`.

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
- Session-based interactions from any `VideoCard` components explicitly map updates back into the central `pinStore`. Memory-based purges naturally strip standard pins upon application shutdown (not explicitly documented otherwise, but ephemeral vs persistent is managed by store handlers).
