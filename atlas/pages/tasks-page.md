# Tasks Page

This document covers the **Tasks Page**—a dedicated page for bullet-point checklists (tasks) that can be ticked off, grouped by date, and managed via a 3-dot menu. The feature is reachable from the Pins page and shares no backend with pins; state is persisted in localStorage.

**Related Documentation:**
- **Pins Page**: See `ui-pages.md` (Section 4.1.4) for the Pins page and the "Tasks" link that navigates here
- **State**: See `state-management.md` for store patterns (pinsPageChecklistStore is persisted via Zustand persist)

---

## 1: User-Perspective Description

Users see a dedicated **Tasks** page that focuses only on task management:

- **Navigation**:
  - **Entry**: From the Pins page, a "Tasks" button (list icon + label + chevron) navigates to this page (`setCurrentPage('tasks')`).
  - **Return**: A "Back to Pins" link (chevron + label) at the top navigates back to the Pins page (`setCurrentPage('pins')`). The app’s global Back (TopNavigation) can also return to the previous page.

- **Task Creation Bar** (top of content):
  - Single-line text input and an "Add" button.
  - Pressing Enter adds a task (same as clicking Add).
  - New tasks are assigned the current date and appear under the corresponding date group.

- **Task List** (grouped by date):
  - **Date grouping**: Tasks are grouped by creation date (e.g. "26th February, 2025"). Groups are ordered newest first.
  - **Row layout**: Each task row shows:
    - **Left**: Task text (crossed out when completed).
    - **Right**: Tick button (circle when incomplete, check-in-circle when done), then 3-dot menu.
  - **Tick button**: Click toggles the task’s done state; completed tasks show a checkmark and crossed-out text.
  - **3-dot menu** (per task):
    - **Edit**: Inline edit mode (input replaces label). Save with Enter or blur; Escape cancels.
    - **Copy**: Copies the task’s text to the clipboard and closes the menu.
    - **Delete**: Removes the task.

- **Empty state**: If there are no tasks, a short message prompts the user to add one.

- **Persistence**: All tasks are stored in `pinsPageChecklistStore` and persisted to localStorage under the key `pins-page-checklist-storage`, so they survive reloads and app restarts.

---

## 2: File Manifest

**UI/Components:**
- `src/components/TasksPage.jsx`: Main Tasks page (creation bar, date-grouped list, tick buttons, 3-dot menus, Back to Pins link)
- `src/components/PinsPage.jsx`: Provides the "Tasks" link that navigates to the Tasks page

**State Management:**
- `src/store/pinsPageChecklistStore.js`:
  - `items`: Array of `{ id, text, checked, createdAt }`
  - `addItem(text, createdAt?)`: Appends a new task (default `createdAt = Date.now()`)
  - `toggleChecked(id)`: Toggles `checked` for a task
  - `removeItem(id)`: Removes a task
  - `setItemText(id, text)`: Updates task text (used by Edit)
- `src/store/navigationStore.js`:
  - `setCurrentPage`: Used to navigate to `'tasks'` or `'pins'`

**API/Bridge:** None (client-only; no Tauri commands or database).

**Backend:** None (localStorage only).

---

## 3: Logic & State Chain

**Rendering flow**
- TasksPage reads `items` from `pinsPageChecklistStore`.
- A `useMemo` groups items by formatted date (`formatDate(item.createdAt)`) and sorts groups newest-first.
- Each group renders a date header (with count) and a list of rows: text (or inline edit input), tick button, 3-dot menu.

**Add task**
- User submits text (Enter or Add) → `addItem(newChecklistText)` → new item pushed to `items` with `createdAt: Date.now()` → store persists to localStorage.

**Toggle done**
- User clicks tick button → `toggleChecked(item.id)` → that item’s `checked` toggled in store → persist.

**Edit**
- User opens 3-dot menu → Edit → `startEdit(item)` sets `editingId` and `editDraft` → inline input shown and focused.
- User edits and presses Enter or blurs → `saveEdit(item.id)` calls `setItemText(id, editDraft.trim())` then clears `editingId`/`editDraft`. Escape cancels without saving.

**Copy**
- User opens 3-dot menu → Copy → `copyToClipboard(item.text)` (`navigator.clipboard.writeText`), then `setMenuOpenId(null)` to close the menu.

**Delete**
- User opens 3-dot menu → Delete → `removeItem(item.id)` and menu closes.

**Navigation**
- Pins page: "Tasks" button → `setCurrentPage('tasks')`.
- Tasks page: "Back to Pins" → `setCurrentPage('pins')`.

**Source of truth**
- `pinsPageChecklistStore.items` (persisted to localStorage as `pins-page-checklist-storage`).

**State dependencies**
- When `items` changes, grouped list and counts update.
- When `menuOpenId` or `editingId` changes, UI (menu visibility, inline edit) updates accordingly.

---

## 4: Cross-References

- **Pins page**: `ui-pages.md` §4.1.4 — describes the Pins page and the Tasks link.
- **Routing**: `App.jsx` renders `TasksPage` when `currentPage === 'tasks'`.
- **State**: `state-management.md` for Zustand persist pattern; checklist store is client-only.
