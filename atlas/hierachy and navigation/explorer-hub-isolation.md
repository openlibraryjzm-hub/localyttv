# Explorer Hub Isolation

This document outlines the technical implementation and behavioral laws of **Explorer Page Isolation**, ensuring that each Hub page functions as a distinct, independent workspace without data leakage or navigation jumps.

---

## 1. Architectural Philosophy
The Explorer Hub allows users to organize their library into multiple themed "pages" (Page 1, Page 2, etc.). To prevent a cluttered experience, the application enforces strict isolation between these pages across the UI, navigation, and data entry layers.

## 2. Navigation Isolation

### Player Controller Scoping
The Top Playlist Menu (Player Controller) dynamically adapts its navigation range based on the active Hub page:
- **Sequential Navigation**: The chevrons ($<$ and $>$) in the playlist menu are restricted to the playlists visible on the current Hub page. This prevents the player from "jumping" back to Page 1 playlists while you are exploring Page 2.
- **Strict Page 1 Isolation**: Playlist navigation on Explorer Page 1 is strictly restricted to playlists assigned to Page 1 carousels plus globally unsorted playlists (playlists assigned to 0 groups globally), preventing leaks from other pages.
- **Group Badge Cycling**: The prism badge in the top bar (cycling through carousel names) only shows carousels belonging to the active page.
- **Populated Carousel Cycling Only**: The group badge cycling only includes groups that are populated with at least one playlist on the active explorer page. This prevents empty navigation loops.
- **Prism Consistency**: Selecting "ALL" in the player navigation while on Page 2 will only cycle through playlists assigned to Page 2 carousels.

## 3. Data Entry & Upload Isolation

### Scoped Selectors
Dropdowns used for adding content (e.g., "Add Video to Existing Playlist") are page-aware:
- They only display playlists that belong to the current Hub page.
- This prevents accidentally adding content to hidden playlists on other pages.

### The "Inbox" System
To prevent new content from "leaking" back to Page 1, secondary pages (Page 2+) use a dedicated **Inbox** system:
- **Auto-Routing**: Playlists uploaded while on Page 2 are automatically assigned to a color-neutral group named `Page 2 Inbox`.
- **Black Segment Mapping**: On secondary pages, the "Unsorted" (black) segment of the Prism Bar is mapped to this page-specific Inbox rather than the global library.
- **Manual Theming**: This allows new content to land safely in the current workspace without forcing an immediate colored carousel assignment.

## 4. Default Feature Scoping

### Quick Videos & Default Upload Destination
The "Quick Videos" feature (adding clipboard links or uploading content with the default target selected) is unique to each page:
- Page 1 uses the standard `Quick Videos` playlist.
- Page 2 uses `Quick Videos 2`, Page 3 uses `Quick Videos 3`, and so on.
- Uploading with the default target selected in `PlaylistUploader` targets the active page's Quick Videos playlist. On secondary pages (Page 2+), the playlist is automatically assigned to `Page X Inbox` to prevent content from leaking back to Page 1.
- This ensures that temporary additions and default uploads do not clutter your main library or cross page boundaries.

### Unsorted State
- **Page 1 Unsorted**: Contains all playlists that belong to **zero** groups globally.
- **Page 2+ Unsorted**: Contains playlists in the page-specific **Inbox** group.
- This creates a "Truly Blank" starting experience for new Hub pages.

## 5. Summary of Isolated Systems
| Feature | Page 1 Behavior | Page 2+ Behavior |
|---------|-----------------|------------------|
| **Navigation** | Global library + P1 Groups | P2 Groups only |
| **Prism "All"** | P1 Carousels + Unsorted | P2 Carousels + Inbox |
| **Prism "Black"**| Global Unsorted (No Groups) | Page-Specific Inbox |
| **Uploader** | Landing in Global Unsorted | Landing in Page Inbox |
| **Quick Videos**| `Quick Videos` | `Quick Videos X` |
| **Player Badge**| Cycles P1 Carousels | Cycles P2 Carousels |
