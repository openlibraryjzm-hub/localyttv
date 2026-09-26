# Drumstick Rating System

The **Drumstick Rating System** is a custom video rating feature that allows users to rate videos on a scale of 1 to 5 "drumsticks". Ratings are specific to each playlist item and are persisted in the SQLite database.

---

## 1. User Interface

The drumstick rating interface appears when hovering over any video card (Standard Video Card or Tweet Card). 

- **Display**: 5 drumstick icons in a horizontal row.
- **Interactions**:
    - **Hover**: Preview the rating based on the hovered drumstick.
    - **Click**: Set the rating (1-5). Clicking the current rating again resets it to 0 (unrated).
    - **Visual Feedback**: Rated drumsticks appear in a vibrant amber color, while unrated ones are semi-transparent gray.
- **Location**:
    - **VideoCard**: Top-right corner, next to the Pin and Folder/Star buttons.
    - **TweetCard**: Top-right corner of the media thumbnail, following the Twitter-style badge aesthetic with a blurred backdrop.

### 1.1 Sticky Bar Integration

The drumstick rating system is integrated into the Videos page sticky toolbar via **VideoSortFilters** (`VideoSortFilters.jsx`). Inside the **Funnel** dropdown, a **Rating filter** section shows a horizontal row of five drumstick icons (1–5). Users can **multi-select** any combination; the grid filters to videos with any of the selected ratings. Unselected drumsticks appear greyed out. Sort order (default, date, progress, last viewed) is in the same dropdown and is independent of the rating filter.

---

## 2. Technical Architecture

### 2.1 Backend (Rust & SQLite)

The rating data is stored directly in the `playlist_items` table.

- **Database Schema (`database.rs`)**:
    - Added `drumstick_rating INTEGER NOT NULL DEFAULT 0` to the `playlist_items` table.
    - Valid range is `0` (unrated) to `5`.
- **Data Models (`models.rs`)**:
    - The `PlaylistItem` struct includes the `drumstick_rating: i32` field, which is automatically serialized for the frontend.
- **Tauri Commands (`commands.rs`)**:
    - `get_drumstick_rating(playlist_id, item_id)`: Retrieves the rating for a specific item.
    - `set_drumstick_rating(playlist_id, item_id, rating)`: Updates the rating in the database.

### 2.2 Frontend (React)

- **API Layer (`playlistApi.js`)**:
    - `getDrumstickRating`: Calls the backend to fetch the latest rating.
    - `setDrumstickRating`: Updates the rating via the backend.
- **UI Component (`DrumstickRating.jsx`)**:
    - A specialized, reusable component that handles the visual display, hover logic, and click-to-rate actions.
    - Uses custom SVG drumstick icons.
    - Includes internal event protection (`stopPropagation`) to prevent rating clicks from triggering card-level actions like opening the video.
- **Card Integration**:
    - Both `VideoCard.jsx` and `TweetCard.jsx` implement local state management for the rating.
    - Ratings are loaded on mount using a `useEffect` hook and updated optimistically when the user clicks a drumstick.

---

## 3. Implementation Details

- **Event Propagation**: The rating system uses `onClick`, `onMouseDown`, and `onMouseUp` stop propagation to ensure it remains independent of the card's primary "Click to Play" area.
- **Styling**: Uses Tailwind CSS with a mix of absolute positioning and backdrop filters to maintain high visibility across different types of video thumbnails (YouTube snapshots vs. Twitter images).
- **Amber Color**: The drumsticks use `text-amber-500` to distinguish the rating system from the folder-based star/heart markers.
