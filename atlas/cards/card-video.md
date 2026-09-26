# Video Cards

Video cards are the primary interface for individual content playback designed through the standard Card component system.

**Related Documentation:**
- **Navigation**: See `navigation-routing.md`.
- **Tweet Content**: See `twitter-integration.md` for specific Tweet Card variants.
- **Card Menus**: See `video-tweet-card-three-dot-menu.md`.
- **Bulk Tags**: See `page-videos.md` for folder assigning features.

---

## 1. Visual Structure & Layout

- **Thumbnail Area**:
  - `16:9` aspect ratio, **square corners** (no rounding), **no border** by default (classic YouTube framing).
  - Image: Video thumbnail from YouTube. Falls back to a light sky blue (`#e0f2fe`) background if the image doesn't fill the 16:9 ratio.
  - **Progress Bar**: Red horizontal line at the bottom of the thumbnail indicating watch progress percentage.

- **Badges**:
  - **Top-left (State & Metadata)**: 
    - **Watch Count Pill**: A translucent dark overlay pill (`bg-black/60`) displaying a green checkmark icon alongside the numeric watch count (e.g. `✓ 2`). Visible permanently whenever the video has been played/opened at least once (`watchCount > 0`), except when the video is currently playing.
    - **Video Length**: A translucent dark overlay pill (`bg-black/80`) showing the formatted duration of the video. Permanently visible (no longer hover-only). If the video is currently playing, only the duration pill is displayed.
    - **Now Playing**: Animated red bouncing dots (or status outline) when the video is active.
  - **Top-right (Actions)**: Dual-action Pin button and Quick-Assign Star.

- **Content Area**:
  - **Title**: Dark blue text (`#052F4A`). Truncates without displaying the YouTube URL/ID.
  - **Metadata Hover Overlay**: Hovering the card reveals a black info bar displaying horizontally aligned elements: Author, Year Published, and abbreviated View Count.
    - **Flush Stack Layout**: This bar is slotted into the very top margin of the Content Area (directly below the thumbnail). The red watch progress bar locks precisely to the bottom of the thumbnail, creating a perfectly flush, seamlessly stacked layout on hover (Progress Bar -> Info Bar -> Title Bar).

- **Status Halos (Borders)**:
  - **Selected**: Solid Blue border.
  - **Currently Playing**: Vibrant Red Glow (`ring-4 ring-red-500`) with a dual-layer inner shadow.
  - **Bulk Tag Mode**: Colored border matching the *first assigned* folder color.

## 2. Interactive Elements

### The Hover Star (Quick Assign)
- **Top-right badge on thumbnail**.
- **Quick Click**: Rapidly assigns/unassigns the video to the user's `quickAssignFolder` preference.
- **Hover (1.2s delay)**: Triggers an expansion displaying a 4x4 grid of 16-color stars centered at the top of the thumbnail.
  - **Left Click on Star Component**: Assigns/unassigns video to that specific folder color instantly.
  - **Right Click on Star Component**: Sets that color as the new `quickAssignFolder` default preference.
  - **Tooltip Metadata**: Displays custom folder names if active ("Assigned to: Watch Later").

### Pin Cycling
- **Top-right badge on thumbnail**.
- **Interaction Loop**:
  - Target an unpinned video -> Starts a **Normal** pin (Filled Blue icon).
  - Target a normal pin -> Escalates to **Follower Modifier** (Double-stacked icon). Automatically passes the pin to the consecutive playlist item on completion.
  - Target a follower pin -> Downgrades to **Normal** pin.
  - **Hold (>600ms)**: Anchors a **Priority Pin** (Amber filled icon).
  - **Double-click**: Natively triggers a complete purge of all tags on the video.

### 3-Dot Context Menu (New Implementation)
- **Bottom-right hover action / Right-Click anywhere**.
- Calls `VideoCardThreeDotMenu`, the vertical pop-up providing Pin configurations, sticky checks, and standard folder movement.

## 3. Bulk Tag Strip (State Driven)
- Activated via the Videos Page header.
- A 16-color grid (4x4 pattern) dynamically injects itself sequentially **below the thumbnail**, forming a fixed-height strip (`h-20`). This *pushes* the title down rather than creating graphical overlaps.
- **Properties**:
  - Full-fill squares (`w-full h-full`).
  - Active elements marked natively with 100% opacity and checkmark icons. Unassigned items sit at 70%.
  - Custom names manifest cleanly as typography overlays across their respective squares.

## 4. Source of Truth

**UI/Components:**
- `src/components/VideoCard.jsx`: Direct implementations of delays, timeouts, and handlers.
- `src/components/BulkTagColorGrid.jsx`: Strip insertion module.
- `src/components/StarColorPicker.jsx`: Expansion menu.

**Database Ties:**
- Interactions sync concurrently through the API via `assignVideoToFolder()`, referencing directly to `video_folder_assignments`. No batch save is required for grid pushes. 
