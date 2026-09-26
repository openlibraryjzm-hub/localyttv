# Likes Page

The Likes Page gives users access to specific videos that have been marked as "Liked". This page aggregates all videos residing inside the auto-generated "Likes" playlist.

**Related Documentation:**
- **Navigation Flows**: See `navigation-routing.md`.
- **Card UI**: See `card-video.md` for like button actions.

---

## 1. Visual Structure & Layout

- **Page Banner**:
  - Automatically generates interactive badges for all unique playlists containing the currently liked videos, identically mimicking the `History Page` banner styling.
  - **Badge Interactions**:
    - **Left Click**: Filters the total liked videos specifically to that playlist (highlight shows "Liked videos from '[Playlist Name]'").
    - **Right Click**: Re-routes directly to that full playlist via the Videos Page in **Preview Mode**.
  - **Limitations**: Top two rows only, with a `>>>` expand button.
  
- **Pagination Badge**:
  - A compact pagination tracking badge (`<< < 1/99 > >>`) overrides the standard description string exclusively when the subset crosses multiple pages.

- **Grid View & Pagination**:
  - Contains video cards aligned in a strict **3-column grid layout** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2`).
  - Limits 24 items per page to maximize layout performance.
  - Bottom controls display Page Numbers and Prev/Next buttons.

## 2. Interaction & Logic

- **Initialization Flow**:
  - Fetches items solely from the hidden "Likes" playlist structure.
  - Computes `uniquePlaylists` by executing `getPlaylistsForVideoIds(videoIds)` iteratively for all matching objects, skipping the explicit "Likes" playlist itself in the badge display.
  - Paginates internally tracking the explicit 24 item length (`currentPage`, `totalPages`, `currentItems`).

- **Auto-Generation & Sourcing**:
  - The "Likes" playlist is structurally handled identically to standard content paths but is auto-created if an attempt is made to like a video and it does not exist.
  - Data retrieval runs straight from `playlist_items` mapping, utilizing a heavily optimized backend query via `get_playlists_for_video_ids`.
