# Refactor Victory 2026: Backend Decoupling & WPF Migration

This document records the architectural milestone achieved in July 2026: migrating the **yttv2** client's desktop shell from Rust-Tauri to C# (WPF + WebView2) while preserving the React 19 frontend 1:1. It details the backend-agnostic abstraction and outlines resolutions for local resource stragglers.

---

## 1. How We Made the Frontend Backend-Agnostic

To prevent code duplication and preserve the development history of the React frontend, we implemented a **Platform Bridge Abstraction** pattern:

### 1.1 The Bridge Layer (`platformBridge.js`)
We introduced [platformBridge.js](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/api/platformBridge.js), which wraps all Tauri and C# WebView2 host APIs into identical signatures. It performs environment detection on boot:
* **Tauri Mode**: If `window.__TAURI__` is present, it dynamically imports and calls `@tauri-apps/api/core` (`invoke`) and `@tauri-apps/api/event` (`listen`).
* **WPF WebView2 Mode**: If `window.chrome.webview` is present, it registers a callback in a local JavaScript registry, generates a unique Request ID, and dispatches the request to C# via `postMessage`.
* **Browser Mock Mode**: If running in a standard Chrome/Edge browser, it falls back to a local JS mock engine, seeding mock playlists and running a 60Hz sine-wave loop to drive visualizer canvas rendering.

### 1.2 Unhandled Command Fallback Protocol
To prevent the UI from freezing during incremental backend refactoring, we designed an **Unhandled IPC Fallback**:
1. When React sends an IPC command, it is dispatched to C#.
2. If C# does not support the command yet (e.g. during migration), it logs it and responds with `unhandled = true`.
3. The React bridge receives the flag and falls back to resolving the promise with local JS mock data.
This enabled the UI to remain fully active during Phase 2 and Phase 3 before the SQLite connections were fully written.

---

## 2. Lingering Straggler Issues (Local File Paths)

During the migration from Rust-Tauri, some local file-dependent properties did not transition completely due to differing host resolution policies. These are minor, addressable gaps:

### 2.1 App Banners & Orb Images
* **The Issue**: In Tauri, custom orb images, profile avatars, and app banners are loaded from local file paths using custom Tauri protocols (e.g. `tauri://localhost/...` or custom asset protocols). In WPF, these protocols do not exist, causing custom orb/banner assets to resolve to broken image links.
* **The Cure**: Use WebView2's native Host-to-Folder mapping (`SetVirtualHostNameToFolderMapping`). We can designate a virtual domain like `https://cache.local/` and bind it to the local AppData folder. All custom banners and orbs will be copied there by C# and loaded in React as `<img src="https://cache.local/banner.jpg" />`.

### 2.2 Local Videos (Browser Streaming Fallback)
* **The Issue**: Tauri used an Axum-based Rust streaming server to stream local files to HTML5 `<video>` tags.
* **The Cure**: Rather than using `Mpv.NET` overlays (which introduce WPF Airspace conflicts that prevent dropdown menus and overlays from drawing on top of the video player), we will keep the streaming player approach. In C#, we will start a lightweight `HttpListener` on local port `1422` that handles HTTP range requests, allowing HTML5 `<video>` elements to play and scrub local files with zero overlays.

---

## 3. High-Performance Hybrid Ingestion & Streaming (Memory Safety)

The original Tauri version suffered from JavaScript heap exhaustion because folder imports loaded all local videos concurrently in hidden webview `<video>` tags to extract canvas frames.

We will use the **C# Hybrid Processing model** to resolve this:
1. **Background C# Processing**: When a directory is selected, C# processes the folders on a background thread. It runs a silent, fast `ffmpeg` extraction to output a compressed `.jpg` thumbnail directly into the AppData folder.
2. **Compact SQLite Mapping**: SQLite stores only the path to this thumbnail (or its virtual `cache.local` URL), avoiding massive base64 storage.
3. **Smooth Local Video Player**: React plays the video using the standard HTML5 `<video>` element connected to the C# localhost stream server.
This preserves full layout controls (HTML5 layering) while completely offloading media decoding and thumbnail creation from the Chromium JS engine to C# memory.

