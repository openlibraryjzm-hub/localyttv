###4: UI

The UI system provides a consistent layout shell with a side menu that displays different pages based on navigation state. The system uses a reusable Card component architecture for displaying playlists, videos, and history items in a grid layout.

**Theme**: The application uses a light sky blue background (`#e0f2fe`) with dark blue text (`#052F4A` / RGB(5, 47, 74)) for side menu content. Navigation buttons (TopNavigation, TabBar) remain white for contrast. See `THEME_CHANGES.md` in project root for detailed theme documentation.

**Related Documentation:**
- **Navigation**: See `navigation-routing.md` for page routing flows and navigation state management
- **State Management**: See `state-management.md` for `navigationStore` (page routing), `layoutStore` (view modes), and `folderStore` (folder filtering)
- **Playlists**: See `playlist&tab.md` Section 2.1 for playlist grid details
- **Videos**: See `playlist&tab.md` Section 2.2 for video grid and folder filtering
- **History**: See `history.md` for history page details

---

## Documentation Structure

The UI documentation has been split into focused files for better maintainability and easier navigation:

### Core Files

1. **[`ui-layout.md`](ui-layout.md)** - Layout & Styling + Side Menu
   - Window architecture (borderless design)
   - Visual design system (banners, borders, patterns)
   - Loading & skeletons
   - Side menu structure and navigation

2. **[`ui-pages.md`](ui-pages.md)** - All Page Components
   - Playlists Page
   - Videos Page
   - History Page
   - Pins Page
   - Likes Page
   - Settings Page (Orb Presets, X/Y Offset Controls)
   - Support Page

3. **[`ui-cards.md`](ui-cards.md)** - Card Components
   - Playlist Cards
   - Video Cards
   - Card component architecture and interactions

4. **[`ui-modals.md`](ui-modals.md)** - Modal Components
   - Playlist Selection Modal
   - Other modal dialogs

---

## Quick Reference

### When Working On...

**Layout & Styling:**
- Primary: `ui-layout.md`
- Related: All other UI docs (layout affects everything)

**Page Components:**
- Primary: `ui-pages.md`
- Cards: `ui-cards.md` (cards are used in pages)
- Modals: `ui-modals.md` (modals are used in pages)

**Card Components:**
- Primary: `ui-cards.md`
- Pages: `ui-pages.md` (cards are used in pages)

**Modal Components:**
- Primary: `ui-modals.md`
- Pages: `ui-pages.md` (modals are used in pages)

---

## File Size Rationale

The original `ui.md` was over 1200 lines, making it difficult for AI agents and developers to process in a single read. The documentation has been split into logical sections:

- **ui-layout.md**: ~160 lines (foundation)
- **ui-pages.md**: ~600 lines (page components)
- **ui-cards.md**: ~400 lines (card components)
- **ui-modals.md**: ~50 lines (modal components)

Each file is now manageable in size while maintaining all information and cross-references.
