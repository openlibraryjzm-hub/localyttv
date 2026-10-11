# Web Version Architecture & Specification (`localyt.tv`)

This document provides a comprehensive overview of the **localyt.tv** web implementation for the YouTube TV v2 (`yttv2`) codebase. It outlines the dual-target architecture, database strategy, platform adapters, audio visualizer web options, deployment specifications, and automated directory sync workflows.

---

## Overview & Dual-Target Strategy

The application uses a **Single Repository Architecture** supporting two distinct runtime targets:

1. **Desktop App (Tauri / Rust / SQLite)**: Full-featured desktop experience with native `mpv` video playback, device file streaming via Axum, system-wide WASAPI loopback audio capture, and local SQLite storage.
2. **Web Version (`localyt.tv`)**: Zero-setup, instant-load web demo hosted on Vercel/Netlify. Visitors browse curated YouTube playlists, Orbs, and page banners without requiring an install or a personal YouTube API key.

```
                              ┌────────────────────────┐
                              │  Shared React UI Code  │
                              │ (100% Same Components) │
                              └───────────┬────────────┘
                                          │
                            ┌─────────────┴─────────────┐
                            ▼                           ▼
                 ┌─────────────────────┐     ┌─────────────────────┐
                 │    Desktop Build    │     │      Web Build      │
                 ├─────────────────────┤     ├─────────────────────┤
                 │ • Tauri + Rust      │     │ • Vite Web Bundle   │
                 │ • Local SQLite DB   │     │ • Supabase DB       │
                 │ • WASAPI Loopback   │     │ • Web Audio API     │
                 │ • Native MPV Player │     │ • YouTube iFrame    │
                 └─────────────────────┘     └─────────────────────┘
```

---

## Platform Detection & Bridge Layer

Platform environment detection is centralized in [`src/utils/platform.js`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/src/utils/platform.js):

* `isTauri()`: Returns `true` inside Tauri desktop window (`window.__TAURI_INTERNALS__`).
* `isWebView2()`: Returns `true` inside C# WPF host window.
* `isWeb()`: Returns `true` when running in standard web browsers (`localyt.tv`).

### API Dispatch Pattern ([`src/api/platformBridge.js`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/src/api/platformBridge.js))
* **Tauri Desktop**: Invokes Rust IPC commands (`get_all_playlists`, `get_playlist_items`, `get_all_playlist_items_previews`, etc.).
* **Web Environment**: Queries **Supabase Cloud Database** via [`src/api/supabaseApi.js`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/src/api/supabaseApi.js) and aggregates batch preview queries (`get_all_playlist_items_previews`). If network or Supabase is unavailable, falls back gracefully to `LocalStorage` mock stores.

---

## Supabase Database & Storage Integration

### Configuration
* **Client Initializer**: [`src/api/supabaseClient.js`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/src/api/supabaseClient.js)
* **Environment Variables**:
  * `VITE_SUPABASE_URL`: Supabase project REST API endpoint (e.g. `https://giguvusbbgonlvsqtrei.supabase.co`).
  * `VITE_SUPABASE_ANON_KEY`: Safe, public anon/publishable key (`sb_publishable_...`).

> [!CAUTION]
> Never expose Supabase `secret` keys in frontend code or environment variables bundled by Vite. Only use the public publishable `anon` key.

### Database Schema ([`supabase_schema.sql`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/supabase_schema.sql))
* `playlists`: Shared demo playlists (id, name, description, custom_ascii, custom_thumbnail_url).
* `playlist_items`: Shared YouTube video records (playlist_id, video_url, video_id, title, thumbnail_url, author, view_count, position).
* `orb_presets`: Preset color schemes, visualizer modes, and app banner assignments.
* `app_banners`: Shared header background assets.

### Row Level Security (RLS) & Permissions
To allow seamless background seed scripts alongside web visitor access:
* **Table Grants**: `GRANT ALL ON TABLE playlists, playlist_items TO anon, authenticated, postgres, service_role;`
* **Policies**: Permissive `FOR ALL` policy (`CREATE POLICY "Full access for playlists" ON playlists FOR ALL USING (true) WITH CHECK (true);`).

### Data Isolation Strategy
* **Public Shared Cloud**: Playlists, video metadata, Orb configurations, and banner images live in Supabase PostgreSQL with public access.
* **Visitor Local Sandbox**: Individual watch history, likes, pins, folder assignments, progress percentage, and user-imported playlists (via JSON or links) are stored in the visitor's browser `LocalStorage` / `IndexedDB` to ensure privacy and prevent global state pollution.
* **Metadata Schema Alignment**: Local storage playlists conform to the standard `PlaylistMetadata` schema (`{ playlist_id, count, first_video, recent_video }`), ensuring local JSON imports seamlessly render item counts, thumbnails, and metadata across all pages.

---

## Automated Curated Directory Sync (`npm run seed:supabase`)

To eliminate complex playlist diffing, the project uses a **Full Directory Sync Model**:

* **Script Location**: [`scripts/seedSupabase.js`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/scripts/seedSupabase.js)
* **Single Source of Truth**: [`curated_json/`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/curated_json) directory.
* **Command**: `npm run seed:supabase`
* **Sync Workflow**:
  1. Clears existing global records in Supabase `playlist_items` and `playlists` tables.
  2. Reads all export `.json` files inside `curated_json/`.
  3. Bulk-inserts playlists and video records into Supabase in batches.
  4. Changes are immediately live on `localyt.tv` upon page refresh without requiring a Vercel re-deployment.

---

## Audio Visualizer Adaptation for Web

While desktop uses WASAPI system loopback capture via Rust SIMD `realfft`, the web version leverages two complementary browser strategies:

1. **Tab / Screen Audio Capture (`getDisplayMedia`)**:
   * Prompts the user to share tab audio.
   * Feeds audio into Web Audio API `AudioContext` $\rightarrow$ `AnalyserNode`.
   * **Frequency Equalization Curve**: Uses `mapFrequencyToBars` in [`src/utils/audioProcessor.js`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/src/utils/audioProcessor.js) with `eqFactor = 0.65 + 1.85 * (i / barCount)^1.5` to balance low bass frequencies (North-East quadrant, bars 0–28) and treble.
   * **Decibel Calibration**: Sets `minDecibels = -85` and `maxDecibels = -25` on the `AnalyserNode` with a `1.5x` web gain multiplier in [`AudioVisualizer.jsx`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/src/components/AudioVisualizer.jsx) for clean, un-capped dynamic responsiveness.
2. **Procedural Organic Sine Fallback**:
   * If audio permissions are declined, the Orb renders an ambient pulse animation so the widget remains visually active.

---

## Web-Exclusive Download Prompt ([`src/components/WebDownloadPrompt.jsx`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/src/components/WebDownloadPrompt.jsx))

On the Web target (`isWeb()`), window controls are hidden and replaced with a dismissable, top-right header banner card (`WebDownloadPrompt.jsx`):

* **Placement & Boundary Control**: Constrained strictly inside a `168px` height container (`top-3 right-4`) within the 200px top app header banner, preventing overlap with the video player or side menus below.
* **Aesthetic Alignment**: Styled in signature Dark Navy (`#052F4A`) and Light Slate (`bg-slate-100`) with rounded borders (`rounded-2xl shadow-2xl`), matching the adjacent `PlayerController` cards.
* **Key Commentary Points**:
  * **Visualizer Magic**: Highlights zero-latency WASAPI audio capture and 240Hz smoothness on desktop.
  * **Full-Screen Immersion**: Highlights dedicated, distraction-free app window execution free from browser tab clutter.
  * **Unlimited Storage**: Highlights local SQLite database capabilities free from browser local storage quotas or auto-clearing risks.
* **Collapsible Narrow Capsule**: Clicking `✕` dismisses the expanded card and persists state to `sessionStorage`, collapsing the UI into a sleek top-right pill badge (`[ ⚡ Get Free Desktop App (30x Speed) ▾ ]`) that can be re-opened anytime.

---

## Build & Deployment Specification

* **Build Tool**: Vite 7
* **Build Command**: `npm run build`
* **Output Directory**: `dist/`
* **Live Target Domain**: `https://localyt.tv`
* **Hosting Platform**: Vercel (Production)
* **Single-Page Application (SPA) Routing**:
  * Vercel Rewrite Rules: [`vercel.json`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/vercel.json)
  * Netlify/Cloudflare Fallback: [`public/_redirects`](file:///c:/Users/GGPC/Desktop/yttv%20on%20desktop/public/_redirects)

### Production Environment Setup (Vercel)
```ini
VITE_SUPABASE_URL=https://giguvusbbgonlvsqtrei.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_-eLh4iHUShl5pYEyXOLEvg_YBvfrLST
```
