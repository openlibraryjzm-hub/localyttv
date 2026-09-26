# YTTV .NET MAUI Android — Definitive Refactor Roadmap

> [!IMPORTANT]
> This roadmap was crafted from 39 answered questions across 3 rounds, exhaustive reading of every file in `src-maui/`, all `atlas/` documentation, the Zustand stores, React components, and the Rust API layer. Every architectural decision below maps directly to a confirmed user requirement.

---

## Foundational Decisions (Locked In)

| Decision | Answer |
|----------|--------|
| **Start from scratch** | Delete `src-maui/`, fresh `dotnet new maui` |
| **SDK** | .NET 8.0.420 (already installed) |
| **Target** | Android only (`net8.0-android`) |
| **Database** | Fresh SQLite via `sqlite-net-pcl`, new DB |
| **Tauri coexistence** | Tauri desktop app stays, MAUI is Android-only |
| **Shell** | No `AppShell` — direct `MainPage` |
| **YouTube player** | Interactive YouTube embed (native YT controls visible) |
| **Layout** | Landscape only, video LEFT, content RIGHT |
| **Fullscreen** | Video fills full width, banner stays above |
| **Splitscreen** | 50/50 left (video) / right (content page) |
| **Audio visualizer** | Deferred past M1 |
| **Local video** | Deferred past M1 (key future goal) |
| **Group carousels** | Persisted to SQLite (not Preferences) |
| **Folder prism** | 16 colors, filtering works in M1 |
| **Auto-advance** | Next video on end, loops to first at end of list |
| **Playlist nav** | Chevrons resume last-watched video per playlist |
| **Folder cycle** | Play button cycles colored folders, chevrons navigate within active folder |
| **Import** | Modal: create/select playlist, paste video/playlist URLs, assign to colored folders |
| **Playlist naming** | User manually names at point of upload |
| **Orb (M1)** | Visual anchor circle only, no interactivity |
| **App Banner (M1)** | Static image, properly positioned for controller overlay |

---

## Architecture Blueprint

### DI Container (Single Source of Truth)

```
MauiProgram.cs
  ├── Singleton: DatabaseService          ← ONE SQLite connection (mirrors Rust Mutex<Database>)
  ├── Singleton: YouTubeApiService        ← Official Data API v3 + metadata fetch
  ├── Singleton: MainViewModel            ← Central state hub (mirrors ALL Zustand stores)
  │     ├── .Config    (ConfigViewModel)
  │     ├── .Layout    (LayoutViewModel)       ← viewMode, splitscreen state
  │     ├── .Navigation (NavigationViewModel)  ← currentPage, history stack
  │     ├── .Playlist  (PlaylistViewModel)     ← items, index, nav items, folder context
  │     ├── .Folder    (FolderViewModel)       ← selectedFolder, quickAssignFolder
  │     └── .Group     (GroupViewModel)        ← carousels, activeGroupId
  └── Transient: MainPage                ← Receives MainViewModel via constructor injection
```

Every View inherits `BindingContext` from `MainPage`. Zero `new DatabaseService()` anywhere.

### Database Schema (10 Tables)

Tables 1–7 mirror Tauri's Rust backend exactly:

| # | Table | Purpose |
|---|-------|---------|
| 1 | `playlists` | Playlist metadata (name, description, timestamps, thumbnail, ascii art, hidden flag) |
| 2 | `playlist_items` | Videos within playlists (url, videoId, title, thumbnail, author, position, duration, ratings, flags) |
| 3 | `video_folder_assignments` | Junction: which videos are in which colored folders |
| 4 | `watch_history` | Timestamped video watch log |
| 5 | `video_progress` | Per-video playback position (currentTime, duration) |
| 6 | `stuck_folders` | Folders that persist across playlist switches |
| 7 | `folder_metadata` | Custom names/descriptions per folder per playlist |

New tables for group carousels (replacing Zustand+localStorage):

| # | Table | Purpose |
|---|-------|---------|
| 8 | `playlist_groups` | Group carousel definitions (id, name, folderColorId, displayMode, sortOrder) |
| 9 | `playlist_group_members` | Junction: which playlists belong to which group (groupId, playlistId, position) |
| 10 | `app_state` | Key-value store for UI state persistence (last video index, shuffle orders, view preferences) |

### Page Architecture

```
MainPage (the ONLY page — no Shell routing)
  ├── Row 0: App Banner (static image, spans full width)
  │   └── Overlay: PlayerControllerUnified
  │         ├── Col 0: PlayerControllerVideoMenu (left wing)
  │         ├── Col 1: PlayerControllerOrb (center circle)
  │         └── Col 2: PlayerControllerPlaylistMenu (right wing)
  │
  └── Row 1: Content Area (visibility toggled by Layout.ViewMode)
        ├── Col 0: YouTubePlayerView (WebView, interactive embed)
        │     - Fullscreen: spans full width
        │     - Splitscreen: spans left 50%
        │
        └── Col 1: ContentHost (right 50%, hidden in fullscreen)
              ├── PlaylistsPage (when Navigation.CurrentPage == "playlists")
              │     ├── Tab bar: ALL | UNSORTED | GROUPS
              │     ├── ALL/UNSORTED: Grid of PlaylistCards
              │     └── GROUPS: GroupPlaylistCarousels
              │
              ├── VideosPage (when Navigation.CurrentPage == "videos")
              │     ├── Header: Back button, playlist title, video count
              │     ├── FolderPrism: 16 colored dots (tap to filter)
              │     └── Grid of VideoCards
              │
              └── ImportModal (overlay, triggered from controller)
```

### YouTube Player Architecture

**Interactive embed** — the user wants YouTube's native UI visible (pause on tap, scrub bar, channel links, "more videos" via long-press).

```
YouTubePlayerView.xaml
  └── WebView (Android WebView, NOT headless)
        └── Loads: youtube_player.html (from Raw assets)
              └── YouTube IFrame API with:
                    - controls: 1 (native YouTube controls ON)
                    - All interaction enabled (no pointer-events:none)
                    - Bridge: JS → C# via URL interception (maui-bridge://)
                    - Reports: STATE_CHANGE, CURRENT_TIME, DURATION, ERROR
                    - Commands: loadVideo(id), seekTo(s), setVolume(v)
```

**Key difference from failed attempt:** `controls: 1` and NO invisible overlay blocking touches. The YouTube player is fully interactive.

### Navigation State Machine

```
┌──────────────┐    chevron     ┌──────────────┐
│  Playlist A  │◄──────────────►│  Playlist B  │
│  (Red folder)│    next/prev   │  (All videos)│
└──────┬───────┘                └──────┬───────┘
       │ chevron next/prev video       │
       ▼                               ▼
┌──────────────┐                ┌──────────────┐
│  Video 3/12  │                │  Video 1/8   │
│  (filtered)  │                │  (all)       │
└──────────────┘                └──────────────┘

Play button cycles: All → Red → Orange → ... → Pink → All
Chevrons navigate WITHIN the active folder filter.
Video end → auto-advance (next in filtered list, loop at end).
Playlist switch → resume last-watched video index (from app_state table).
```

---

## Phased Build Plan

Each phase produces a **testable artifact** on the Android tablet.

### Phase 0: Project Bootstrap
**Goal:** Fresh MAUI project that launches on Android tablet.

1. User deletes `src-maui/` directory
2. `dotnet new maui -n Yttv -o src-maui` → clean project
3. Strip `.csproj` to Android-only target (`net8.0-android`)
4. Remove iOS/Mac/Tizen/Windows scaffolding
5. Install NuGet packages:
   - `CommunityToolkit.Mvvm` (8.4.x) — MVVM source generators
   - `sqlite-net-pcl` (1.9.x) — SQLite ORM
   - `SQLitePCLRaw.bundle_green` (2.1.x) — SQLite native bindings
6. Set `App.xaml.cs` to use `MainPage` directly (no Shell)
7. Set landscape-only in `AndroidManifest.xml`
8. Configure `MainActivity.cs` for immersive/fullscreen
9. Deploy to tablet → confirm blank app launches

**Test:** App opens on tablet showing a blank page. No crash.

### Phase 1: Data Layer
**Goal:** Complete DatabaseService + Models with full operation parity.

1. Create all 10 Model classes with SQLite attributes
2. Create `DatabaseService.cs` as singleton:
   - `InitializeAsync()` — creates all tables with FK support
   - Full CRUD for every table (matching all 30+ Rust commands)
   - Key operations: `GetAllPlaylistMetadataAsync()` (count + thumbnail per playlist), `AssignVideoToFolderAsync()`, `GetVideosInFolderAsync()`, `GetAllFolderAssignmentsAsync()` (batch), group carousel CRUD
3. Create `FolderColors.cs` utility (16 colors, hex, name, id)
4. Create `YouTubeApiService.cs`:
   - `ImportPlaylistAsync(playlistUrl)` → fetches all items via Data API v3 pagination
   - `FetchVideoMetadataAsync(videoId)` → title, thumbnail, duration, author, description
   - Uses hardcoded API key (user will replace for distribution)
5. Register both as singletons in DI

**Test:** Unit-test DatabaseService operations (create playlist, add items, assign folders, query). No UI yet.

### Phase 2: State Management (ViewModels)
**Goal:** All Zustand stores ported to C# ViewModels with proper reactivity.

1. **ConfigViewModel** — OrbSize, MenuWidth, MenuHeight, OrbMenuGap, API key
2. **LayoutViewModel** — `ViewMode` (full/half), splitscreen ratio
3. **NavigationViewModel** — `CurrentPage`, history stack, `SetCurrentPage()`, `GoBack()`
4. **PlaylistViewModel** (mirrors `playlistStore.js` exactly):
   - `AllPlaylists`, `CurrentPlaylistItems`, `CurrentPlaylistId`, `CurrentVideoIndex`
   - `NavigationItems` (flat list of playlists + folders)
   - `CurrentNavigationIndex`, `CurrentFolder`
   - `NextVideo()`, `PreviousVideo()` — wrapping, index persistence via `app_state`
   - `NextPlaylist()`, `PreviousPlaylist()` — hierarchical nav with folder interleaving
   - `ShufflePlaylist()` — Fisher-Yates, persist order
   - `SetPlaylistItems()` — with shuffle restore + last-index resume
   - `BuildNavigationItems()` — from playlists + folders
   - `ActiveFolderFilter` — current folder color for play-button cycling
   - `CycleFolderFilter()` — cycles through 16 colors + "all"
5. **FolderViewModel** — `SelectedFolder`, `QuickAssignFolder`, video folder assignments cache
6. **GroupViewModel** — groups CRUD, `ActiveGroupId`, carousel modes, playlist membership
7. **MainViewModel** — composes all above, receives `DatabaseService` via DI constructor

**Test:** ViewModel unit tests — create playlist, add items, navigate next/prev, verify index wrapping, folder cycling.

### Phase 3: Layout Shell
**Goal:** The app renders the correct spatial layout on the tablet.

1. **MainPage.xaml** — 2-row Grid:
   - Row 0 (`200px`): Banner region + controller overlay
   - Row 1 (`*`): Content area (video + pages)
2. **App Banner** — `Image` control spanning full width, static image from assets
3. **PlayerControllerUnified** — 3-column Grid overlaying the banner:
   - Col 0: Video Menu shell (glassmorphism border, placeholder buttons)
   - Col 1: Orb (simple `Ellipse` with border, static)
   - Col 2: Playlist Menu shell (glassmorphism border, placeholder buttons)
4. **Content area** — 2-column Grid:
   - Col 0: YouTube player placeholder (black `BoxView`)
   - Col 1: Content host (empty `ContentView`)
5. **GlassStyles.xaml** — Port the existing cool-blue glassmorphism design tokens
6. **ViewMode binding** — `DataTrigger` on `Layout.ViewMode`:
   - `"full"` → Col 1 width = 0 (content hidden)
   - `"half"` → Col 0 = `*`, Col 1 = `*` (50/50)

**Test:** Deploy to tablet. See banner image, three glass rectangles (menus + orb circle), black video area left, empty content area right. Tap "Expand Full" → video fills width.

### Phase 4: Playlists Page + Import
**Goal:** Browse playlists and import from YouTube.

1. **PlaylistsPage** (ContentView):
   - Tab bar: ALL | UNSORTED | GROUPS
   - `CollectionView` with `GridItemsLayout` (2-column grid)
   - Binds to `Playlist.AllPlaylists` (filtered by tab)
2. **PlaylistCard** component:
   - Title bar with playlist name
   - Thumbnail image (first video's thumbnail from metadata query)
   - Video count overlay
   - Tap → loads playlist items, navigates to Videos page
3. **ImportModal** (overlay ContentView):
   - Playlist selector: dropdown of existing playlists OR "Create New" with name input
   - URL input area: paste YouTube video URL or playlist URL
   - Folder assignment: 16 colored dots, tap to select target folder(s)
   - "Import" button → calls `YouTubeApiService`, inserts to DB, refreshes UI
4. Wire playlist menu button to open import modal
5. Wire playlists page button in controller

**Test:** Open app → empty playlists page. Tap import → paste YouTube playlist URL → name it → import completes → card appears in grid. Tap card → nothing yet (Videos page is Phase 5).

### Phase 5: YouTube Playback
**Goal:** Tap a video, it plays in the YouTube embed.

1. **youtube_player.html** (Raw asset):
   - YouTube IFrame API with `controls: 1` (interactive)
   - JS→C# bridge via `maui-bridge://` URL interception
   - Reports: `READY`, `STATE_CHANGE` (playing/paused/ended/buffering), `TIME_UPDATE` (periodic current time + duration), `ERROR`
   - Commands: `loadVideo(id)`, `seekTo(s)`, `playVideo()`, `pauseVideo()`
2. **YouTubePlayerView** component:
   - `WebView` loading the HTML
   - `Navigating` handler intercepts `maui-bridge://` messages
   - Deserializes JSON payloads → updates `PlaylistViewModel` state
   - On `STATE_CHANGE = ended` → calls `Playlist.NextVideo()` → loads next video
   - On `TIME_UPDATE` → updates `video_progress` in DB
3. **Wire to PlaylistViewModel**:
   - `CurrentVideo` property change → calls `LoadVideoAsync(videoId)`
   - `NextVideo()`/`PreviousVideo()` → triggers `CurrentVideo` change → player loads

**Test:** Import a playlist, tap a card to go to Videos page (placeholder), manually trigger a video load → video plays in the left panel with YouTube's native controls. Video ends → next video auto-plays.

### Phase 6: Videos Page + Folder System
**Goal:** Full Videos page with folder prism and filtering.

1. **VideosPage** (ContentView):
   - Header: Back button, playlist title, video count
   - **FolderPrism**: Horizontal row of 16 colored `Ellipse` dots
     - Tap a color → `Folder.SelectedFolder = colorId` → filters videos
     - Active color gets a border/scale indicator
     - "All" dot (white/clear) to reset filter
   - `CollectionView` with `GridItemsLayout` (2-column grid)
   - Binds to filtered `Playlist.CurrentPlaylistItems`
2. **VideoCard** component:
   - Thumbnail, title, author, duration
   - Colored folder dot indicators (from `video_folder_assignments`)
   - Tap → sets `CurrentVideoIndex` → player loads video
3. **Folder filtering logic** in PlaylistViewModel:
   - When `Folder.SelectedFolder` changes → query `GetVideosInFolderAsync()` or show all
   - `DisplayedVideos` computed property = filtered or full list
4. Wire back button → `Navigation.GoBack()`

**Test:** Tap playlist card → Videos page shows all videos. Tap a folder color → filters to that color only. Tap a video card → plays in player. Tap back → returns to Playlists page.

### Phase 7: Controller Navigation
**Goal:** All controller buttons are functional.

1. **PlayerControllerVideoMenu** (wired):
   - `<` chevron → `Playlist.PreviousVideo()` (navigates within active folder filter)
   - `▶` play button → `Playlist.CycleFolderFilter()` (All → Red → Orange → ... → All)
   - `>` chevron → `Playlist.NextVideo()`
   - Visual indicator of current folder color on the play button
2. **PlayerControllerPlaylistMenu** (wired):
   - `<` chevron → `Playlist.PreviousPlaylist()` (loads playlist, resumes last video)
   - `🗂️` → `Navigation.SetCurrentPage("playlists")` + `Layout.SetViewMode("half")`
   - `🎬` → `Navigation.SetCurrentPage("videos")` + `Layout.SetViewMode("half")`
   - `>` chevron → `Playlist.NextPlaylist()`
   - Expand Full / Show Pages toggle → `Layout.ToggleViewMode()`
3. **Playlist navigation logic**:
   - `NextPlaylist()` → loads items from DB → restores last video index from `app_state` → auto-plays that video
   - Respects `Group.ActiveGroupId` restriction (if set, nav is confined to group)
4. **Auto-advance on video end**:
   - YouTube bridge `STATE_CHANGE = ended` → `NextVideo()` → if was last in list, loop to index 0

**Test:** Full integration test: Import 2 playlists with multiple videos each. Use chevrons to navigate between videos. Use playlist chevrons to switch playlists (resumes last watched). Play button cycles folder colors. Expand/collapse splitscreen works.

### Phase 8: Group Carousels
**Goal:** Playlists page GROUPS tab shows carousels.

1. **GroupViewModel** operations:
   - `CreateGroup(name, folderColorId)` → inserts to `playlist_groups`
   - `DeleteGroup(groupId)` → removes group + unassigns playlists
   - `AddPlaylistToGroup(groupId, playlistId)` → junction insert
   - `RemovePlaylistFromGroup(groupId, playlistId)` → junction delete
   - `RenameGroup(groupId, name)`
   - `GetGroupsAsync()` → all groups with their playlist members
   - `SetActiveGroupId(id)` → restricts playlist nav to group
2. **GroupPlaylistCarousel** component:
   - Horizontal `CollectionView` per group
   - Top bar: color indicator, name, mode buttons (Large/Small/Bar), rename, delete
   - Cards inside are `PlaylistCard` with `inCarousel` styling
   - Tap card → `SetActiveGroupId(group.id)` + load playlist
3. **PlaylistCard 3-dot menu** (or long-press on tablet):
   - "Assign to carousel" → opens color selector overlay (16 slots)
   - "Remove from carousel" → unassigns from all groups
4. **GROUPS tab** on PlaylistsPage:
   - Renders all carousels vertically
   - "New carousel" button at bottom (auto-picks next available color)
5. **Tab filtering**:
   - ALL: all playlists in grid
   - UNSORTED: playlists not in any group
   - GROUPS: carousels only

**Test:** Create 2 carousels, assign playlists to them. Switch to GROUPS tab → see carousels. Tap playlist in carousel → navigate. Chevrons restricted to that carousel's playlists.

### Phase 9: Polish & Hardening
**Goal:** Production-quality feel on the tablet.

1. Loading indicators for DB operations and API calls
2. Error handling with user-facing messages (network failures, API quota, invalid URLs)
3. Touch optimization: proper hit targets (48dp minimum), tap feedback animations
4. Smooth page transitions (fade/slide between Playlists↔Videos)
5. Watch history recording (on video play, insert to `watch_history`)
6. Video progress persistence (periodic save during playback)
7. Proper `async`/`await` patterns — no UI thread blocking
8. Memory management — dispose WebView properly, image caching
9. App icon and splash screen
10. Performance profiling on tablet hardware

---

## File Structure (Clean Project)

```
src-maui/
├── App.xaml / App.xaml.cs                    ← No Shell, direct MainPage
├── MauiProgram.cs                            ← DI registrations
├── MainPage.xaml / MainPage.xaml.cs           ← The one page (layout shell)
├── Models/
│   ├── Playlist.cs
│   ├── PlaylistItem.cs
│   ├── VideoFolderAssignment.cs
│   ├── WatchHistoryEntry.cs
│   ├── VideoProgress.cs
│   ├── StuckFolder.cs
│   ├── FolderMetadata.cs
│   ├── PlaylistGroup.cs
│   ├── PlaylistGroupMember.cs
│   └── AppState.cs                            ← Key-value persistence
├── Services/
│   ├── DatabaseService.cs                     ← Singleton, all DB ops
│   └── YouTubeApiService.cs                   ← Data API v3 + metadata
├── ViewModels/
│   ├── MainViewModel.cs                       ← Composes all sub-VMs
│   ├── ConfigViewModel.cs
│   ├── LayoutViewModel.cs
│   ├── NavigationViewModel.cs
│   ├── PlaylistViewModel.cs                   ← The big one (mirrors playlistStore.js)
│   ├── FolderViewModel.cs
│   └── GroupViewModel.cs
├── Views/
│   ├── PlaylistsPage.xaml / .cs               ← ContentView (not Page)
│   ├── VideosPage.xaml / .cs                  ← ContentView
│   └── ImportModal.xaml / .cs                 ← Overlay ContentView
├── Components/
│   ├── PlayerControllerUnified.xaml / .cs
│   ├── PlayerControllerVideoMenu.xaml / .cs
│   ├── PlayerControllerPlaylistMenu.xaml / .cs
│   ├── PlayerControllerOrb.xaml / .cs
│   ├── YouTubePlayerView.xaml / .cs
│   ├── PlaylistCard.xaml / .cs
│   ├── VideoCard.xaml / .cs
│   ├── FolderPrism.xaml / .cs
│   └── GroupPlaylistCarousel.xaml / .cs
├── Utils/
│   └── FolderColors.cs                        ← 16 colors static data
├── Resources/
│   ├── Raw/
│   │   └── youtube_player.html                ← YouTube IFrame embed
│   ├── Styles/
│   │   ├── Colors.xaml
│   │   ├── Styles.xaml
│   │   └── GlassStyles.xaml                   ← Cool-blue glassmorphism tokens
│   └── Images/
│       └── banner_default.png                 ← Static app banner
└── Platforms/
    └── Android/
        ├── AndroidManifest.xml                ← Landscape, internet, immersive
        └── MainActivity.cs                    ← Fullscreen config
```

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| **YouTube Error 153** in Android WebView | Set proper `Origin` header via Android `WebViewClient.ShouldInterceptRequest()`. If persistent, test with `WebSettings.setMediaPlaybackRequiresUserGesture(false)` and user-agent spoofing. Fallback: load `youtube.com/watch?v=` directly instead of IFrame API. |
| **WebView audio session isolation** (future visualizer) | When visualizer becomes M2, use `Visualizer` with audio session 0 (system-wide capture). Requires `RECORD_AUDIO` permission. |
| **SQLite thread safety** | `sqlite-net-pcl` with `SQLiteAsyncConnection` handles this. Single connection via DI singleton. All DB ops are `async`. |
| **CollectionView performance** with 500+ items | Use `DataTemplate` recycling (default in MAUI). Defer image loading. Consider virtualization if needed. |
| **YouTube API quota** | 10,000 units/day. `playlistItems.list` = 1 unit/call (50 items). A 500-video playlist = 10 calls. Well within limits for personal use. |
| **.NET 8 MAUI Android bugs** | Known WebView stability issues in early 8.0. The 8.0.420 SDK includes fixes. If issues persist, test with `HybridWebView` or platform-specific `Android.Webkit.WebView`. |

---

## Definition of Done (Milestone 1)

When ALL of these are true on the physical Android tablet:

- [ ] App launches in landscape, no crash
- [ ] Static app banner visible at top, player controllers overlaid
- [ ] Orb circle visible between the two menus
- [ ] Empty playlists page shown in right panel
- [ ] Import modal: create new playlist with name, paste YouTube playlist URL, import succeeds
- [ ] Playlist card appears in grid with thumbnail and video count
- [ ] Tap playlist card → Videos page shows all videos with thumbnails
- [ ] 16-color folder prism visible on Videos page, tap filters work
- [ ] Tap video card → YouTube embed plays video (with native YT controls)
- [ ] Video ends → next video auto-plays, loops at end of list
- [ ] Video menu chevrons navigate prev/next video within active folder filter
- [ ] Play button cycles folder color filter (All → Red → ... → Pink → All)
- [ ] Playlist menu chevrons switch playlists, resume last-watched video
- [ ] 🗂️ button → shows Playlists page, 🎬 button → shows Videos page
- [ ] Expand Full / Show Pages toggles between fullscreen and splitscreen
- [ ] GROUPS tab on playlists page shows carousels
- [ ] Can create carousel, assign playlists, navigate within carousel range
- [ ] All state survives app restart (playlists, folder assignments, groups, last video index)
