# Likes Page

The Likes Page gives users access to specific videos that have been marked as "Liked". This page aggregates all videos residing inside the auto-generated "Likes" playlist.

**Related Documentation:**
- **Navigation Flows**: See `navigation-routing.md`.
- **Backdrop System**: See `blurred-banner-backdrop-system.md` for background styling.
- **Card UI**: See `card-video.md` for like button actions.

---

## 1. Visual Structure & Layout

- **Atmospheric Blurred App Banner Backdrop**:
  - Anchored on a solid `bg-slate-950` container with an absolute positioned blurred banner overlay (`filter: blur(36px)`, `transform: scale(1.25)`, `opacity: 0.85`), dynamically synced to the active App Banner / preset image in real-time.

- **Sticky Top Navbar (`BottomNavigation.jsx`)**:
  - A sticky top header card (`bg-slate-100 border-2 border-[#052F4A] rounded-2xl p-2.5 shadow-md sticky top-0 z-40`).
  - **Left Side**: Page title ("Liked Videos") in bold dark navy text (`text-[#052F4A] font-black`).
  - **Right Side**: Action pills for **Back** (`ChevronLeft` chevron arrow) and **Close** (`X` button, toggles `setViewMode('full')`).

- **Grid View & Pagination**:
  - Contains video cards aligned in a strict **3-column grid layout** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2`).
  - Limits 24 items per page to maximize layout performance.
  - Bottom controls display Page Numbers and Prev/Next buttons.

## 2. Interaction & Logic

- **Initialization Flow**:
  - Fetches items solely from the hidden "Likes" playlist structure.
  - Paginates internally tracking the explicit 24 item length (`currentPage`, `totalPages`, `currentItems`).

- **Auto-Generation & Sourcing**:
  - The "Likes" playlist is structurally handled identically to standard content paths but is auto-created if an attempt is made to like a video and it does not exist.
  - Data retrieval runs straight from `playlist_items` mapping.
