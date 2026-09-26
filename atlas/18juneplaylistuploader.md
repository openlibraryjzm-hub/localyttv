# Playlist Uploader Tab Refactoring (June 18, 2026)

This document details the restructuring of the **Playlist Uploader** (`PlaylistUploader.jsx`) tabs and associated interaction fixes made during the development session on June 18, 2026.

---

## 1. Simplified Tab Structure

The Playlist Uploader modal has been refactored to streamline operations, eliminating legacy/unused tabs and integrating core subscription management features directly.

### Removed Tabs
- **Modify Tab:** Removed. This was previously an empty "Coming soon" placeholder. Playlist metadata edits are handled in other specific edit layouts.
- **Twitter JSON Tab:** Removed. The social bookmarks JSON uploader was retired/simplified to keep ingest actions lightweight and focused.

### Current Tab Suite
1. **Add:** Ingestion of YouTube videos/playlists/channels, local files, and device folder streams (see `modal-addcontent.md`).
2. **Export:** Exporting playlist files to JSON, inclusive of folder configurations and link cards (see `importexport.md`).
3. **JSON:** Importing raw playlist JSON structures directly.
4. **Subscriptions:** The new host tab for the Subscription Manager.
5. **Source:** Toggles visibility of specific card categories (`orb`, `banner`, `video`, `image`, `tracker`, `channel`, `tweet`) within the active playlist grid, with dynamic badge counts indicating item counts.

---

## 2. Subscription Manager Integration

Rather than popping up as a standalone portal modal stacking over the uploader, the **Subscription Manager** (`SubscriptionManagerModal.jsx`) is now natively embedded as a tab.

- **Inline Presentation:** Handled by passing `isInline={true}` to `<SubscriptionManagerModal />`. In inline mode, the component strips away its portal mount, fullscreen backdrop overlay, custom header, and outer card container to blend directly into the uploader's flex container.
- **Playlist ID Resolution:** If the uploader is opened from the `VideosPage`, the active playlist context is inherited. If opened from the `PlaylistsPage` without an active context, it dynamically falls back to the uploader dropdown's selected playlist, and resolves to `Unsorted` (or the first available playlist) to ensure a stable data-syncing target.
- **Contextual Actions:** The uploader's primary "Import/Export/Save Changes" footer buttons are automatically hidden when the Subscriptions tab is active, since the subscription manager handles all fetching and syncing triggers inline.

---

## 3. Interaction & Event Fixes

### useLongPress Right-Click Fix
- **Problem:** Right-clicking on `VideoCard` elements to open context menus was simultaneously triggering the left-click action (initiating video playback).
- **Cause:** The `useLongPress` hook was capturing non-primary mouse button releases. Because `mousedown` (right-click) was ignored, `longPressTriggered` remained `false`. The subsequent `mouseup` event release would execute the `onClick` handler as it wasn't recognized as a long-press.
- **Fix:** Updated the `stop` callback inside `useLongPress.js` to abort early if `e.type === 'mouseup' && e.button !== 0`. Right-clicks now open context menus cleanly without triggering playing actions.

### Plus (+) Button Short-press Only
- **Problem:** Having a long-press subscription shortcut on the `VideoSortFilters` Plus button clashed with the new tabbed layout.
- **Fix:** Converted the `FilterButton` inside `VideoSortFilters.jsx` to a standard HTML `<button>` trigger. It now purely executes `onAddClick` to open the multi-tab uploader modal where subscriptions can be managed cleanly.
