# Subscription Manager

The Subscription Manager allows users to automatically fetch and sync videos from external sources (such as YouTube Channels and tracked Playlists) directly into their current playlist folder view.

## Core Features

1. **Context-Aware Discovery:**
   - The Subscription Manager does not use a standalone "Add Subscription" input box.
   - Instead, it dynamically scans the active playlist view for **Tracker Cards** (`ChannelCard` and `PlaylistLinkCard` items).
   - Any tracker found in the folder view automatically populates precisely the Subscription modal for targeted syncing.

2. **Granular Fetching & Syncing:**
   - Channels: Users have micro-managing power. Instead of mass-syncing, you can fetch the latest `[1]`, `[5]`, `[10]`, `[25]`, `[50]`, `[100]`, or `[ALL]` (capped) videos for each channel specifically.
   - **Avatar & Metadata Enrichment**: During the fetch/sync process (as well as quick-adds from header menus), the system retrieves high-resolution video thumbnails, full descriptions, view counts, published dates, duration seconds, and channel profile pictures (`profile_image_url`) for use across the application.
   - Playlists: A "Refresh Latest" button retrieves up to the 100 most recent videos added to that list with complete metadata enrichment.

3. **Intelligent Duplication Prevention & Auto-Refresh:**
   - The syncing process compares the `video_id` of returned items against the current playlist's database pool, discarding duplicates before importing.
   - Items imported manually will not cause duplication.
   - **Auto-Refresh Lifecycle**: When the Subscription Manager modal is closed, the parent page (`VideosPage`) instantly reloads all playlist items from the SQLite database to immediately display the newly imported videos without requiring manual page navigation or refreshing.

4. **Light Theme Makeover:**
   - The UI runs a clean, vibrant `slate-50` backdrop with shadow-lifted cards rather than standard dark-mode interfaces, making the syncing hub visually distinct from generalized settings panels.

## Tracker Cards (Source of Truth)

Because the system infers sources from actual cards embedded inside your playlist, subscriptions are stored in the SQLite database (`playlist_items`) and managed like standard items:
- **Visual Card Filtering**: Channel Cards (`isChannel`) and Playlist/Folder Link Trackers (`isPlaylist`, `isFolderTracker`) remain persisted in the backend DB and fully functional within management/subscription modals, but are visually suppressed from display card grids (`VideosPage`, `PlaylistCard`, `LongPlaylistCard`).
- **Deletion:** Removing a Channel Card, Playlist Tracker Card, or Folder Tracker Card successfully deletes your "subscription" to it from the database.
- **Categorization:** You can move a Tracker Card into a colored folder. When you open the Subscription Manager while looking inside that colored folder, only the Tracker Cards assigned to that folder will display for syncing.

### Local Folder Trackers
- **Folder Tracker Cards**: When a user selects a directory via the **Upload Folder** action in the uploader, the app creates a Folder Tracker Card (marked with `isFolderTracker: true` and `video_url` prefixed with `local:device_folder:`).
- **Subscriptions Listing**: The Subscription Manager detects these cards and lists them under **Tracked Folders**.
- **Syncing & Refreshing**:
  - Tapping **Refresh** or executing **Refresh All** triggers the folder sync workflow.
  - The app scans the tracked directory on disk for new media files, filtering out any files that have already been imported to prevent duplicates.
  - New files are processed (extracting base64 thumbnails and metadata) and dynamically added to the playlist database.
- **Exclusion of Standalone Files**: Standalone local images and video cards (where `is_local = 1` but `isFolderTracker` is not true) are filtered out of the Subscriptions Manager list view to maintain focus purely on tracked channels, playlists, and folders.

## Dual Integration (Modal & Inline)

The Subscription Manager supports two display modes controlled by the `isInline` prop:
1. **Standalone Portal Modal (`isInline={false}`):** Opened via the `VideosPage` and locks focus via a backdrop wrapper overlay.
2. **Inline Tab (`isInline={true}`):** Embedded directly within the `PlaylistUploader` tab interface. It renders directly inside the parent flex layout container and suppresses modal header and overlay wrappers for seamless visual parity.

## Location

- Component: `src/components/SubscriptionManagerModal.jsx`
- Host Component (Inline): `src/components/PlaylistUploader.jsx`
- API calls: `src/api/playlistApi.js` (`getPlaylistItems`, `addVideoToPlaylist`)
- Extraction Helpers: `src/utils/youtubeUtils.js` (`fetchChannelUploads`, `fetchPlaylistVideos`)
