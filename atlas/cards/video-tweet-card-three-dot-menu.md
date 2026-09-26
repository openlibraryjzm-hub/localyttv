# Video & Tweet Card 3-Dot Menu

The **Video Card / Tweet Card 3-Dot Menu** is a single, vertical “all-in-one” popover used by both **VideoCard** and **TweetCard** on the Videos page. It consolidates pins, drumstick rating, standard actions (delete, move, copy, set cover) and a colored folder assignment pop-out into one decluttered menu opened from a 3-dot trigger.

---

## 1. User Experience

### 1.1 Trigger and Placement

- **Primary Trigger (Right-Click)**: Right-clicking anywhere on a `VideoCard` opens the menu as a context menu precisely at the cursor's position. The card shows a `cursor-context-menu` on hover to indicate this.
- **Secondary Trigger (3-Dot)**: A 3-dot (⋮) button that appears on hover at the **bottom-right** of the card (thumbnail area).
- **VideoCard**: Both triggers are available when not in bulk tag mode.
- **Opening (3-Dot)**: Click the 3-dot to open the menu. It is positioned below or above the trigger button.
- **Opening (Right-Click)**: Right-click the card to open the menu at the cursor's exact coordinates.

### 1.2 Menu Layout (Vertical)

The menu is a **vertical standard popup** with these sections from top to bottom:

1. **Pins**: Pin / Unpin, Priority, Follower (Follower only when already pinned).  
2. **Rating**: Drumstick 1–5 (same as drumstick-rating-system).  
3. **Sticky Video**: Toggle sticky for the current playlist/folder context.
4. **Actions**: 
   - Delete  
   - Move to Playlist  
   - Copy to Playlist  
   - Set as Playlist Cover  
5. **Colored Folders**: A list item at the very bottom that, when clicked, expands a side pop-out (intelligently placed on the left or right) revealing a 16-color **BulkTagColorGrid**. Click a color in the grid to assign/unassign the video.

### 1.3 Behavior

- **Trigger (3-Dot)**: Click the 3-dot to open the menu. Positions traditionally, directly under the trigger button. If constrained by bottom screen bounds, it pushes upward.
- **Trigger (Right-Click Context Menu)**: Right-click the card and the menu will follow the exact mouse coordinates, functioning just like a native OS context menu.
- **Folder Grid Pop-out**: Clicking "Colored Folders..." opens the color grid adjacent to the menu without closing the main menu.
- **Close**: Click outside or scroll; menu closes.
- **Bulk tag mode**: When the Videos page is in bulk tag mode, the 3-dot menu is **hidden** on cards; folder assignment is done via the bulk-tag strip on the card instead.

---

## 2. File Manifest

| Area | File | Role |
|------|------|------|
| **Component** | `src/components/VideoCardThreeDotMenu.jsx` | Menu UI: vertical popup layout, pin/rating/actions, and side popout for colored folders. |
| **Component** | `src/components/BulkTagColorGrid.jsx` | 16-color folder grid used inside the menu (and on cards in bulk tag mode). |
| **Component** | `src/components/DrumstickRating.jsx` | 1–5 rating used in the “Pins, Rating, Sticky” section. |
| **Card** | `src/components/VideoCard.jsx` | Renders the 3-dot trigger and passes props (pin, folder, rating, menu options, etc.). |
| **Card** | `src/components/TweetCard.jsx` | Same: single 3-dot trigger, same menu. |
| **Page** | `src/components/VideosPage.jsx` | Provides handlers: `handleMenuOptionClick`, `handleStarColorLeftClick`, `handleRenameFolder`, etc. |
| **State** | `src/store/pinStore.js` | Pin / priority / follower state. |
| **State** | `src/store/folderStore.js` | Folder assignments, bulk tag state. |
| **API** | `src/api/playlistApi.js` | Drumstick rating and folder assignment persistence. |

---

## 3. Props (VideoCardThreeDotMenu)

The menu receives:

- **video**, **playlistId** – Context for the item.
- **Pin**: `isPinned`, `isPriority`, `isFollower`, `onTogglePin`, `onTogglePriorityPin`, `onRemovePin`.
- **Folder**: `videoFolders`, `folderMetadata`, `onStarColorLeftClick`, `onRenameFolder` (no longer `quickAssignFolder` or `onStarColorRightClick`; folder grid is assign/unassign + rename only).
- **Rating**: `drumstickRating`, `onDrumstickRate`.
- **Actions**: `menuOptions` (array of `{ label, action, icon, danger? }`), `onMenuOptionClick`.
- **Trigger**: `triggerClassName` for the 3-dot button.

`menuOptions` are built by the card and include: Sticky Video (toggleSticky), Delete, Move to Playlist, Set as Playlist Cover, Copy to Playlist. The menu splits out the `toggleSticky` option into the “Pins, Rating, Sticky” column and passes the rest as “other” actions.

---

## 4. Bulk Tag Mode on Cards

When the user enables **bulk tag mode** on the Videos page:

- **VideoCard** and **TweetCard** show a **BulkTagColorGrid** strip **below the thumbnail** (between thumbnail and title), in a fixed-height band (`h-20`), always visible when bulk tag mode is on. The strip does not overlay the thumbnail.
- **Instant folder assignment**: Clicking a color in the grid **immediately** assigns or unassigns that video to that folder (same behavior as the 3-dot menu Folder section or star left-click). No Save or Cancel step; each click persists to the database and updates the card.
- The **3-dot menu is not shown** in bulk tag mode so that the same grid is not duplicated and the UX stays focused on the strip.

This matches the “TweetCard-style” bulk experience: one consistent strip on both video and tweet cards.

---

## 5. Related Documentation

- **Drumstick rating**: `drumstick-rating-system.md`  
- **Folder colors / bulk tag**: `playlist&tab.md`, `database-schema.md`, `api-bridge.md`  
- **Cards overview**: `ui-cards.md`  
- **Videos page**: `ui-pages.md`, `ui.md`
