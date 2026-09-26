# Group Badge and Playlist Navigation (Player Controller)

This document describes the **group carousel badge** on the Player Controller’s Top Playlist Menu, **left/right arrow cycling** through all group carousels, and how the selected group **restricts playlist navigation** (up/down) to that group’s playlists.

**Related Documentation:**
- **Group carousels:** `group-carousel.md` (Playlists page GROUPS view, carousel management)
- **Player Controller:** `advanced-player-controller.md` (Top Playlist Menu, badges, navigation)
- **State:** `state-management.md` (playlistGroupStore)

---

## 1. User-facing behavior

### 1.1 Group badge on the Top Playlist Menu

- **Location:** The left rectangle of the Player Controller (Top Playlist Menu). Below the playlist title, badges are shown in a single row.
- **Group badge:** A **single** violet-styled badge showing the name of the **current group carousel** (e.g. “Featured playlists”). It appears when `activeGroupId` is set to a group on the active explorer page. If `activeGroupId` is null, it displays **ALL**.
- **Cycling groups**: Left- and right-facing arrow buttons cycle through **populated group carousels on the active explorer page** (groups containing at least one playlist). Empty groups are excluded from this cycle. Cycling is **confined** to the colored carousels; the "ALL" state is excluded from the sequential cycle once a group is entered. Clicking an arrow while on "ALL" jumps to the first/last carousel in the set.
- **"ALL" Quick Jump**: When a group is active, a dedicated **"ALL"** button appears to the left of the navigation capsule. This provides a persistent one-click shortcut to return to the full library view without needing to cycle back or click the group name.
- **Event Propagation Isolation**: All badge buttons (ALL badge, group name badge, quick jump, and chevrons) stop mouse down, mouse up, touch start, touch end, and click events from bubbling up to the parent container, keeping them isolated from the container's click-to-grid (`useLongPress`) lifecycle.

### 1.2 Playlist navigation restricted to the group

- **Up/down controls**: The Top Playlist Menu has **previous/next playlist** controls. These move through the **navigation list** maintained by `playlistStore`.
- **When a group is active**: If the **group badge** is showing a group (i.e. `activeGroupId` is set), the navigation list is **restricted to** playlists that belong to that group.
- **"ALL" Toggle**: A persistent **"ALL"** badge appears when a group carousel is active (or when `activeGroupId` is null). Clicking this badge clears the `activeGroupId`, allowing the navigation list to span the entire library within the "Orb" theme context.
- **When no group is active**: If `activeGroupId` is null (after clicking "ALL"), the navigation list spans the **entire library on the current Hub page** (for Page 1, Page 1 groups + unsorted; for Page 2+, Page 2 groups only).
- **Result**: Sequential navigation stays within the context of the current page. The "ALL" shortcut provides instant escape from restricted group navigation.

---

## 2. How “entered from” is set and cleared

| Action | Effect on `activeGroupId` |
|--------|---------------------------|
| User clicks a **playlist card inside a group carousel** (Playlists page, GROUPS tab) | `setActiveGroupId(group.id)` — badge and nav range use this group. |
| User clicks a **playlist card in the main grid** (ALL or UNSORTED) | `setActiveGroupId(null)` — clears group restriction; nav uses full page list. |
| User clicks **left/right arrows** on the group badge | `setActiveGroupId(previous/next group.id)` — cycles through **populated** group carousels on the active page. |
| User **deletes the active group** (trash on carousel title) | `activeGroupId` is set to `null` in `removeGroup` / `deletePage`. |
| User **switches the active Explorer Page** | `activeGroupId` is set to `null` if the group it pointed to belongs to a different page. |

- **Persistence:** `activeGroupId` is stored in `playlistGroupStore` (Zustand persist, key `playlist-group-storage`), so the “entered from” group survives reloads.

---

## 3. Relation to the Top Playlist Menu

- **Badges row:** The Top Playlist Menu shows, in one row: **Group carousel** (violet) → **Active Preset** (indigo) → **Active Tab** (sky) → **Folder** (colored). Only one group badge is shown; it reflects the group that both labels the context and defines the navigation range.
- **Badge styling:** All badges (group, preset, tab, folder) use **no bubble or pill container**. Text is **white with a black outline** (same as playlist/video titles) for consistency; 11px font; horizontally aligned. Group badge includes left/right arrow buttons with white-outline chevron icons.
- **Navigation list build:** `PlayerController` builds `navigationItems` in a `useEffect` that:
  1. Starts from `allPlaylists` (optionally filtered by legacy tab).
  2. **Page Isolation Filter**: If `activeGroupId` is null, filters `allPlaylists` by `activePage` (ensuring navigation stays on the current Hub page: Page 1 groups + unsorted for Page 1; Page 2 groups for Page 2+).
  3. If `activeGroupId` is set, filters to playlists in that group and sorts them by `group.playlistIds` (carousel order).
  4. Builds folders (stuck + optional show-all) for the current playlist set.
  5. Calls `buildNavigationItems(playlists, foldersToInclude)` and `setNavigationItems(navItems)`.
- **Handlers:** `handleNextPlaylist` and `handlePreviousPlaylist` call `nextPlaylist()` and `previousPlaylist()` from `playlistStore`, which move within `navigationItems`. So when the list is restricted by group, up/down are restricted to that group’s range.

---

## 4. File manifest

| Area | Files |
|------|--------|
| **Components** | `PlayerController.jsx` (badge render, nav build, next/prev handlers), `PlayerControllerPlaylistMenu.jsx` (badge toggles, chevrons, event propagation isolation), `PlaylistCard.jsx` (groupIdFromCarousel, onEnterFromGroup on click), `PlaylistsPage.jsx` (passes group/clear into cards) |
| **State** | `playlistGroupStore.js` (`activeGroupId`, `setActiveGroupId`, `groups`, `getGroupIdsForPlaylist`, `setActivePage`), `playlistStore.js` (`navigationItems`, `nextPlaylist`, `previousPlaylist`, `buildNavigationItems`, `setNavigationItems`) |

---

## 5. Logic summary

1. **Single group for badge:**  
   `singleGroupForBadge = (activeGroupId && group exists ON CURRENT PAGE && group has playlists) ? that group : null`. The badge is shown whenever there is at least one populated group on the current page and `activeGroupId` matches it.

2. **Cycling:**  
   `groupsOnPage` is filtered to populated groups on the current page (`g.page === activePage && g.playlistIds.length > 0`). Arrows cycle through `groupsOnPage`. `canCycleGroups = groupsOnPage.length >= 1`. `cycleGroupBadge('prev'|'next')` computes current index in `groupsOnPage`, then `setActiveGroupId(items[nextIdx].id)`.

3. **Restricted navigation:**  
   In the nav-build effect, if `activeGroupId` is null, filter `playlists` by `activePage` (isolating navigation to the current workspace). If `activeGroupId` is set, filter `playlists` to that group’s `playlistIds` and sort by carousel order. Dependencies include `activePage`, `activeGroupId` and `groups`.

4. **Entered from carousel:**  
   PlaylistCard calls `onEnterFromGroup(groupIdFromCarousel)` or `onEnterFromGroup(null)` on main card click; PlaylistsPage passes `setActiveGroupId` and, in carousels, `groupIdFromCarousel={group.id}` and in the grid `onEnterFromGroup={() => setActiveGroupId(null)}`.

---

## 6. Cross-references

- **Group carousel system:** `group-carousel.md`
- **Top Playlist Menu and other badges:** `advanced-player-controller.md` § 1.4
- **playlistStore navigation:** `state-management.md`, `navigation-routing.md`
