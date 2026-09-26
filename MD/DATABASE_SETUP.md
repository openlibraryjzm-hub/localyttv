# Database Setup for Playlists

## Overview

The playlist system uses **SQLite** as the database, which is perfect for a desktop Tauri application. The database is stored locally and managed entirely through Rust backend commands.

## Database Schema

### `playlists` Table
- `id` (INTEGER PRIMARY KEY) - Auto-incrementing playlist ID
- `name` (TEXT) - Playlist name (required)
- `description` (TEXT) - Optional playlist description
- `created_at` (TEXT) - ISO 8601 timestamp
- `updated_at` (TEXT) - ISO 8601 timestamp

### `playlist_items` Table
- `id` (INTEGER PRIMARY KEY) - Auto-incrementing item ID
- `playlist_id` (INTEGER) - Foreign key to playlists table
- `video_url` (TEXT) - Full YouTube URL
- `video_id` (TEXT) - Extracted YouTube video ID
- `title` (TEXT) - Optional video title
- `thumbnail_url` (TEXT) - Optional thumbnail URL
- `position` (INTEGER) - Order position in playlist (0-indexed)
- `added_at` (TEXT) - ISO 8601 timestamp

## Available Tauri Commands

All commands are available from the frontend via `invoke()` or through the `playlistApi.js` helper.

### Playlist Commands

1. **`create_playlist(name: string, description?: string)`**
   - Creates a new playlist
   - Returns: `playlist_id` (number)

2. **`get_all_playlists()`**
   - Gets all playlists
   - Returns: `Array<Playlist>`

3. **`get_playlist(id: number)`**
   - Gets a single playlist by ID
   - Returns: `Playlist | null`

4. **`update_playlist(id: number, name?: string, description?: string)`**
   - Updates playlist name and/or description
   - Returns: `boolean` (success)

5. **`delete_playlist(id: number)`**
   - Deletes a playlist and all its items (CASCADE)
   - Returns: `boolean` (success)

### Playlist Item Commands

1. **`add_video_to_playlist(playlist_id, video_url, video_id, title?, thumbnail_url?)`**
   - Adds a video to a playlist
   - Automatically assigns the next position
   - Returns: `item_id` (number)

2. **`get_playlist_items(playlist_id)`**
   - Gets all items in a playlist, ordered by position
   - Returns: `Array<PlaylistItem>`

3. **`remove_video_from_playlist(playlist_id, item_id)`**
   - Removes a video from a playlist
   - Automatically reorders remaining items
   - Returns: `boolean` (success)

4. **`reorder_playlist_item(playlist_id, item_id, new_position)`**
   - Changes the position of an item in a playlist
   - Automatically shifts other items
   - Returns: `boolean` (success)

## Usage Example

```javascript
import { 
  createPlaylist, 
  addVideoToPlaylist, 
  getPlaylistItems 
} from './api/playlistApi';

// Create a playlist
const playlistId = await createPlaylist('My Favorites', 'Videos I love');

// Add a video
await addVideoToPlaylist(
  playlistId,
  'https://www.youtube.com/watch?v=QiemgC39tA0',
  'QiemgC39tA0',
  'Video Title',
  'https://thumbnail.url'
);

// Get all videos in the playlist
const items = await getPlaylistItems(playlistId);
```

## Database Location

Currently, the database is stored as `playlists.db` in the application's working directory. In production, you may want to use Tauri's app data directory for better cross-platform support.

## Next Steps

1. Create UI components for playlist management
2. Add playlist selection/display in the side menu
3. Implement drag-and-drop reordering
4. Add video metadata fetching (title, thumbnail) from YouTube API
5. Add playlist import/export functionality

