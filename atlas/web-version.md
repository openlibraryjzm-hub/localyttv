# Web Version Architecture & Specification (`localyt.tv`)

This document provides a comprehensive overview of the **localyt.tv** web implementation for the YouTube TV v2 (`yttv2`) codebase. It outlines the dual-target architecture, database strategy, platform adapters, audio visualizer web options, and deployment specifications.

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

Platform environment detection is centralized in [`src/utils/platform.js`](file:///c:/Users/jodyn/Desktop/yttv%20in%20october%202026/src/utils/platform.js):

* `isTauri()`: Returns `true` inside Tauri desktop window (`window.__TAURI_INTERNALS__`).
* `isWebView2()`: Returns `true` inside C# WPF host window.
* `isWeb()`: Returns `true` when running in standard web browsers (`localyt.tv`).

### API Dispatch Pattern ([`src/api/platformBridge.js`](file:///c:/Users/jodyn/Desktop/yttv%20in%20october%202026/src/api/platformBridge.js))
* **Tauri Desktop**: Invokes Rust IPC commands (`get_all_playlists`, `get_playlist_items`, etc.).
* **Web Environment**: Queries **Supabase Cloud Database** via [`src/api/supabaseApi.js`](file:///c:/Users/jodyn/Desktop/yttv%20in%20october%202026/src/api/supabaseApi.js). If network or Supabase is unavailable, falls back gracefully to `LocalStorage` mock stores.

---

## Supabase Database & Storage Integration

### Configuration
* **Client Initializer**: [`src/api/supabaseClient.js`](file:///c:/Users/jodyn/Desktop/yttv%20in%20october%202026/src/api/supabaseClient.js)
* **Environment Variables**:
  * `VITE_SUPABASE_URL`: Supabase project REST API endpoint.
  * `VITE_SUPABASE_ANON_KEY`: Safe, public anon/publishable key.

> [!CAUTION]
> Never expose Supabase `secret` keys in frontend code or environment variables bundled by Vite. Only use the public publishable `anon` key.

### Database Schema ([`supabase_schema.sql`](file:///c:/Users/jodyn/Desktop/yttv%20in%20october%202026/supabase_schema.sql))
* `playlists`: Shared demo playlists (id, name, description, custom_ascii, custom_thumbnail_url).
* `playlist_items`: Shared YouTube video records (playlist_id, video_url, video_id, title, thumbnail_url, author, view_count, position).
* `orb_presets`: Preset color schemes, visualizer modes, and app banner assignments.
* `app_banners`: Shared header background assets.

### Data Isolation Strategy
* **Public Shared Cloud**: Playlists, video metadata, Orb configurations, and banner images live in Supabase PostgreSQL & Storage Buckets with Row-Level Security (RLS) public read access.
* **Visitor Local Sandbox**: Individual watch history, likes, pins, folder assignments, and progress percentage are stored in the visitor's browser `LocalStorage` / `IndexedDB` to ensure privacy and prevent global state pollution.

---

## Audio Visualizer Adaptation for Web

While desktop uses WASAPI system loopback capture via Rust SIMD `realfft`, the web version leverages two complementary browser strategies:

1. **Tab / Screen Audio Capture (`getDisplayMedia`)**:
   * Prompts the user once to share tab audio.
   * Feeds audio into Web Audio API `AudioContext` $\rightarrow$ `AnalyserNode`.
   * Computes 113 FFT frequency bins in JS at 60 FPS to drive [`AudioVisualizer.jsx`](file:///c:/Users/jodyn/Desktop/yttv%20in%20october%202026/src/components/AudioVisualizer.jsx).
2. **Procedural Organic Sine Fallback**:
   * If audio permissions are declined, the Orb renders an ambient pulse animation so the widget remains visually active.

---

## Build & Deployment Specification

* **Build Tool**: Vite 7
* **Build Command**: `npm run build`
* **Output Directory**: `dist/`
* **Target Domain**: `localyt.tv`
* **Hosting Support**: Vercel, Netlify, Cloudflare Pages

### Vercel / Netlify Environment Setup
Add the following variables to the hosting project settings:
```ini
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_<key>
```
