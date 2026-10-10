# Heart Rating System (Legacy: Drumstick Rating System)

The **Heart Rating System** allows users to rate videos on a scale of 1 to 5 "hearts". Ratings are specific to each playlist item and are persisted in the SQLite database column (`drumstick_rating`).

---

## 1. User Interface

The rating interface appears in the 3-Dot Context Menu of video cards (`VideoCard` and `TweetCard`) and in the sticky toolbar filter.

- **Display**: 5 Heart icons in a horizontal row.
- **Interactions**:
    - **Hover**: Previews highlighting hearts $1 \dots N$ based on the hovered heart.
    - **Click**: Sets the rating to $N$ (filling hearts $1 \dots N$). Clicking the current rating $N$ again resets it to $0$ (unrated).
    - **Visual Feedback**: Rated hearts appear filled in vibrant rose color (`text-rose-500 fill-rose-500`), while unrated ones are semi-transparent outline icons.
- **Location**:
    - **VideoCard & TweetCard**: Accessible inside the 3-Dot context menu under the "Rating" section.

### 1.1 Sticky Bar Filter Integration

The rating system is integrated into the Videos page sticky toolbar via **VideoSortFilters** (`VideoSortFilters.jsx`). Inside the **Funnel** dropdown, a **Rating filter** section shows a horizontal row of five Heart icons (1–5). 

- **Sequential Selection**: Clicking heart $N$ highlights hearts $1 \dots N$ and filters the video grid to videos with an exact rating of $N$ (Option A).
- **Clear Filter**: Clicking the active rating $N$ (or clicking "Clear") resets the filter to show all videos regardless of rating.
- **Instant Live Update**: Rating changes and filter selections instantly update the list in memory without requiring a page or playlist reload.

---

## 2. Technical Architecture

### 2.1 Backend (Rust & SQLite)

The rating data is stored directly in the `playlist_items` table.

- **Database Schema (`database.rs`)**:
    - `drumstick_rating INTEGER NOT NULL DEFAULT 0` in the `playlist_items` table.
    - Valid range is `0` (unrated) to `5`.
- **Data Models (`models.rs`)**:
    - The `PlaylistItem` struct includes the `drumstick_rating: i32` field.
- **Tauri Commands (`commands.rs`)**:
    - `get_drumstick_rating(playlist_id, item_id)`: Retrieves the rating for a specific item.
    - `set_drumstick_rating(playlist_id, item_id, rating)`: Updates the rating in the database.

### 2.2 Frontend (React)

- **API Layer (`playlistApi.js`)**:
    - `getDrumstickRating`: Calls the backend to fetch the latest rating.
    - `setDrumstickRating`: Updates the rating via the backend.
- **UI Component (`DrumstickRating.jsx`)**:
    - Reusable component displaying 5 Heart icons with hover preview and click-to-rate actions.
    - Includes event isolation (`stopPropagation`) to prevent card playback triggers.
- **Card Integration**:
    - `VideoCard.jsx` and `TweetCard.jsx` manage local rating state and update `playlistStore` (`updateItemRating`) so rating updates apply live in real-time across all views and filters.
