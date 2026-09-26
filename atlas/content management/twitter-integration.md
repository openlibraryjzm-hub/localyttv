# Twitter/X Content Integration

## Overview

The application supports importing and displaying Twitter/X media content (videos, images, GIFs) alongside YouTube videos. Twitter content is stored as "local" videos with special handling for thumbnails, profile pictures, and metadata.

## Importing Twitter Content

### Twitter JSON Tab

Located in the **Playlist Uploader** modal, the "Twitter JSON" tab allows importing Twitter bookmark or tweet exports.

**Supported JSON Formats:**
- Twitter Bookmarks exports
- Twitter User Tweets exports
- Any JSON array of tweet objects with media

**Required JSON Structure:**
```json
[
  {
    "id": "tweet_id",
    "full_text": "Tweet text content",
    "name": "Display Name",
    "screen_name": "username",
    "created_at": "timestamp",
    "views_count": 12345,
    "profile_image_url": "https://...",
    "media": [
      {
        "type": "video|photo|animated_gif",
        "url": "https://...",
        "thumbnail": "https://...",
        "original": "https://..."
      }
    ]
  }
]
```

### Import Process

1. **Select Target Playlist**: Choose an existing playlist or leave blank to use "Unsorted"
2. **Upload/Paste JSON**: Either upload a `.json` file or paste JSON directly
3. **Automatic Processing**:
   - Filters tweets to only include those with media
   - Extracts first media item from each tweet
   - Cleans tweet text (removes RT markers, @mentions at start)
   - Stores as "local" videos with `is_local: true` flag

### Title Cleaning

Tweet titles are automatically cleaned to remove clutter:
- ✂️ Removes `"Name (@handle): "` prefix
- ✂️ Removes `"RT @username: "` retweet markers
- ✂️ Removes `"@username "` reply handles at start
- ✂️ Trims whitespace

**Example:**
- **Before**: `"meowri (@JennaLynnMeowri): RT @someone: Check this out!"`
- **After**: `"Check this out!"`

## Displaying Twitter Content

### Video Cards

Twitter content appears in standard video cards with special handling:

**Thumbnails:**
- Uses `thumbnail_url` field (Twitter media thumbnail)
- Falls back to `video_url` (original media) if no thumbnail
- Uses `object-fit: contain` for proper aspect ratio
- **Background**: Light sky blue (`#e0f2fe`) matching app theme (visible when image doesn't fill 16:9 ratio)

**Metadata:**
- **Author**: Stored as `"Name (@handle)"` format
- **View Count**: Twitter view count (converted to string)
- **Published Date**: Tweet creation timestamp
- **Profile Picture**: Stored in `profile_image_url` field

### Playlist Cards

When a Twitter video is set as the cover or previewed in a playlist card's thumbnail slot (`PlaylistsPage.jsx`):
- **High-Resolution Previews**: The `thumbnail_url` is automatically upgraded to `name=large` for the main cover slot or `name=medium` for the 4-mini preview thumbnails to prevent blurriness.
- **Smart Framing**: The thumbnail rendering logic detects `twimg.com` URLs and applies the `object-fit: contain` property with the light sky blue (`#e0f2fe`) background. This ensures the native aspect ratio is preserved without being awkwardly cropped inside the strict 16:9 dimensions of playlist cards.
- **Hover Expansion**: The main thumbnails are wrapped in `ImageHoverPreview`, seamlessly offering a high-res pop-out preview bounded strictly up to 95% of the screen dimension to prevent overflow while keeping clarity pristine.

### Card Styles

**TweetCard (Premium Twitter/X Style):**
- **Layout**: Occupies a **single cell** in the 2-column grid.
- **Background**: Light sky blue (`#e0f2fe`) to match the application theme.
- **Border**: Minimal `sky-200` border for separation, with `rounded-2xl` corners.
- **Header**:
  - **Avatar**: Circular profile picture (40x40px) with high-res fallback.
  - **Labels**: Bold Display Name and gray @handle (Font: `#052F4A`).
  - **Inline Actions**: 3-dot menu and pin controls appear on hover.
- **Content**: Cleaned tweet text with professional typography (Font: `#052F4A`).
- **Media**:
  - **Source**: Upgraded to `medium` quality thumbnails for grid display and `large` for hovers.
  - **Containment**: Uses `object-contain` within a sky-blue frame (`bg-[#d0eafb]/50`) to ensure media is never blurry or stretched.
- **Interaction**: Integrated "Pin" and "Folder Star" buttons overlaid on the media section.
- **Mixed Content Logic**: `VideosPage.jsx` automatically interleaves these cards with standard YouTube cards, maintaining a perfectly balanced layout.

## Image Hover Preview

### 4chanX-Style Expansion

Hovering over any video thumbnail triggers an enlarged preview instantly.

**Features:**
- **High-Resolution**: Uses original media URLs for Twitter content
- **Smart Positioning**: Intelligently centers large images, follows cursor for small images
- **Vertical Extension**: Can extend above viewport for tall images
- **Adaptive Behavior**: Different positioning strategies based on image size
- **Max Dimensions**: 900x1200px with aspect ratio preservation

**Preview Sources:**
- **Twitter/Local**: Uses `video_url` (original media URL) to natively stream and auto-play `.mp4` video files directly in the pop-out, and automatically falls back to zoomed-in thumbnails (`name=large`) for images/GIFs.
- **YouTube**: Uses `maxresdefault` thumbnail (highest quality)

**Positioning Logic:**
- **Large Images** (>70% of viewport): Centered in viewport for optimal visibility
  - Horizontally and vertically centered
  - Clamped to edges if larger than viewport
  - Allows extending above viewport for very tall images (keeps 100px visible minimum)
- **Small Images** (<70% of viewport): Cursor-following with smart overflow prevention
  1. Try right of cursor → if overflow, try left
  2. Try below cursor → if overflow, try above
  3. Clamp to right edge if still overflowing
  4. Clamp to bottom edge if still overflowing
  5. Allow extension above viewport top (unlimited vertical space)

### Technical Implementation

**Component**: `ImageHoverPreview.jsx`
- Wraps `CardThumbnail` components
- Accepts `src` (thumbnail) and `previewSrc` (high-res) props
- **Instant hover**: Previews appear immediately on mouse enter
- Fixed position overlay at z-index 9999
- **Styling**: Light sky blue border and background (`#e0f2fe`) matching app theme
- **Smooth Fade-In**: Opacity transition (0 → 1) after positioning to prevent visual jump

## Database Schema

### playlist_items Table

Twitter content is stored with these additional fields:

```sql
profile_image_url TEXT  -- Twitter profile picture URL
is_local BOOLEAN        -- Set to true for Twitter content
thumbnail_url TEXT      -- Twitter media thumbnail
video_url TEXT          -- Original Twitter media URL
```

### Migration

The `profile_image_url` column is automatically added via migration on app startup.

## API Endpoints

### addVideoToPlaylist

**Parameters:**
- `playlistId`: Target playlist ID
- `videoUrl`: Twitter media URL (original)
- `videoId`: Tweet ID
- `title`: Cleaned tweet text
- `thumbnailUrl`: Twitter thumbnail URL
- `author`: `"Name (@handle)"` format
- `viewCount`: String (converted from integer)
- `publishedAt`: Tweet timestamp
- `isLocal`: `true` for Twitter content
- `profileImageUrl`: Twitter profile picture URL

## Best Practices

### Importing
- Use Twitter's native export tools for best compatibility
- Bookmarks and User Tweets exports both work
- Large imports (100+ tweets) may take a few seconds

### Display
- Toggle between YouTube/Twitter card styles in layout settings
- Use hover preview to inspect images without clicking
- Clean titles improve readability in grid view

### Performance
- Thumbnails are cached by browser
- High-res previews load on-demand (hover)
- Database stores URLs, not media files

## Troubleshooting

**No tweets imported:**
- Check console for errors
- Verify JSON structure matches expected format
- Ensure tweets have `media` array with items

**Broken thumbnails:**
- Twitter media URLs may expire over time
- Re-import from fresh export if needed

**Missing profile pictures:**
- Profile pictures are optional
- Letter avatars used as fallback
- Check `profile_image_url` field in JSON

## Future Enhancements

Potential improvements:
- Support for multiple media items per tweet
- Thread/conversation import
- Automatic re-fetching of expired media URLs
- Twitter API integration for live imports
