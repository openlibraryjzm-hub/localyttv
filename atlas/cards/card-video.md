# Video Cards

Video cards are the primary interface for individual content playback designed through the standard Card component system.

**Related Documentation:**
- **Navigation**: See `navigation-routing.md`.
- **Tweet Content**: See `twitter-integration.md` for specific Tweet Card variants.
- **Card Menus**: See `video-tweet-card-three-dot-menu.md`.
- **Bulk Tags**: See `page-videos.md` for folder assigning features.

---

## 1. Visual Structure & Layout

Following the October 2026 dark mode refactor, video cards feature a **pure black (`#000000`) canvas** with zero static borders, merging seamlessly into page backgrounds while retaining interactive hover states:

- **Card Shell & Borders**:
  - Container: `bg-black rounded-2xl border border-transparent hover:border-white/30 shadow-none transition-all flex flex-col h-full`.
  - Static appearance: Borderless, allowing thumbnail and title to float cleanly over the page background.
  - Hover appearance: Subtle white outline (`hover:border-white/30`) highlights the hovered card.

- **Thumbnail Area**:
  - `16:9` aspect ratio, rounded top corners (`rounded-t-2xl`), **no bottom divider line** (static divider line removed).
  - Image: Video thumbnail from YouTube or local extracted thumbnail.
  - **Progress Bar**: Red horizontal line at the bottom of the thumbnail indicating watch progress percentage.

- **Badges**:
  - **Top-left (State & Metadata)**: 
    - **Watch Count Pill**: A translucent dark overlay pill (`bg-black/60`) displaying a green checkmark icon alongside the numeric watch count (e.g. `✓ 2`). Visible permanently whenever the video has been played/opened at least once (`watchCount > 0`), except when the video is currently playing.
    - **Video Length**: A translucent dark overlay pill (`bg-black/80`) showing the formatted duration of the video. Permanently visible. If the video is currently playing, only the duration pill is displayed.
    - **Now Playing**: Animated red bouncing dots (or status outline) when the video is active.
  - **Top-right (Actions)**: Dual-action Pin button and Quick-Assign Star.

- **Content Area**:
  - **Title**: Clean white text (`text-white font-bold`). Truncates without displaying the YouTube URL/ID.
  - **Container**: Solid `#000000` (`bg-black rounded-b-2xl`) eliminating the previous white/slate backdrops.
  - **Metadata Hover Overlay**: Hovering the card reveals a black info bar displaying horizontally aligned elements: Author, Year Published, and abbreviated View Count.
    - **Flush Stack Layout**: Slotted into the top margin of the Content Area (directly below the thumbnail) on hover.

- **Status Halos (Borders)**:
  - **Selected**: White ring (`ring-2 ring-white/50`).
  - **Currently Playing**: Vibrant Red Glow (`ring-4 ring-red-500`).
  - **Bulk Tag Mode**: Colored 2px border matching the *first assigned* folder color.

---

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

### 3-Dot Context Menu
- **Bottom-right hover action / Right-Click anywhere**.
- Calls `VideoCardThreeDotMenu`, the vertical pop-up providing Pin configurations, sticky checks, and standard folder movement.

---

## 3. Bulk Tag Strip (State Driven)
- Dynamic colored borders appear during multi-select tagging modes.
- Color dynamically derives from the folder being assigned.
