# YTTV2: C# Refactor Strategy & Blueprint

This document details the architectural strategy, goals, and technical challenges for refactoring the **yttv2** desktop application from Rust-Tauri to a C# (WPF + WebView2) application.

---

## 1. Primary Goals

The refactor is driven by three main requirements: safety, performance, and deep OS-level integration.

### Goal A: Preservation & Sandbox Safety
* **Preserve React UI (1:1)**: Keep the Vite, React 19, Zustand stores, and HTML5 Canvas visualizer exactly as they are. No rewriting layout or animations in WPF XAML.
* **Fallback Protection**: The refactor must take place in a completely separate sandbox repository. The working Rust-Tauri app must remain untouched as a functional fallback.
* **Accept the Marathon**: Reject the "sprint" mindset. This refactor is treated as a multi-month hobby project, requiring highly isolated phases.

### Goal B: High-Performance Local File Management
* **Eliminate Memory Leaks**: Stop extracting thumbnails in webview canvases and storing Base64 strings in SQLite (which exhausted the JS heap).
* **Natively Cached Thumbnails**: Write video thumbnails directly to a disk cache as `.jpg` files using a C# background thread. SQLite will store only the file paths.
* **Virtual Folder Mapping**: Use WebView2's native directory mapping to load cached images directly from the hard drive, bypassing database IPC bandwidth.

### Goal C: Deep Windows OS Integration

* **Audio Session Management**: Interface with Windows Core Audio APIs to control the volume of external applications (like Spotify) programmatically.
* **Loopback Visualizer**: Implement a robust WASAPI loopback capture and FFT analyzer in C# to emit real-time frequency data.

---

## 2. Technical Challenges & Mitigations

### Challenge A: The Webview Threading Model (STA)
* **The Risk**: WebView2 operates strictly on the WPF main UI thread. High-frequency dispatches from background threads (like database queries or 60Hz visualizer updates) will crash the application if called directly.
* **Mitigation**: All background worker data must be marshalled to the UI thread using the WPF Dispatcher (`Application.Current.Dispatcher.BeginInvoke`). 

### Challenge B: Visualizer Frame Stutter
* **The Risk**: Marshalling 60 messages a second across threads can introduce lag or stutter if serialization is heavy.
* **Mitigation**: 
  1. Do not use JSON for the 113-frequency bins. Join them in C# as a comma-separated string (`"0,12,34..."`) and parse them in React with `.split(',')` to keep payload parsing trivial.
  2. Maintain the React visualizer’s temporal smoothing (`smoothing: 0.4`) and canvas drawing loop (`requestAnimationFrame`), which naturally masks timing jitter.

### Challenge C: Audio Device Disconnections
* **The Risk**: The visualizer will freeze or crash if the user changes audio outputs (e.g. unplugging headphones) because the active WASAPI capture session becomes invalid.
* **Mitigation**: Enumerate audio sessions and hook the default device change events. C# must dynamically dispose of the old capture session and spin up a new one when Windows reports device changes.

### Challenge D: Custom Schemes and CORS in WebView2
* **The Risk**: React will fail to load local thumbnail assets (`file:///...`) or communicate with local resources due to Chromium’s strict Cross-Origin Resource Sharing (CORS) security.
* **Mitigation**: Register a custom virtual domain (like `https://cache.local/`) in WebView2 during initialization, setting it to bypass CORS rules and mapping it directly to the AppData cache folder.

---

## 3. The Phased Strategy (Roadmap)

To keep this refactor manageable and stress-free, do not try to build a fully working application at once. Follow this strict sequence:

### Phase 1: React Decoupling (Mock Mode)
* **Action**: Wrap all Tauri `invoke()` and `listen()` calls in React inside a mock-ready platform bridge wrapper (`platformBridge.js`).
* **Milestone**: The React app runs successfully in a standard web browser (Chrome/Edge) using mock lists and a fake visualizer wave.

### Phase 2: WPF WebView2 Shell Setup
* **Action**: Create a blank WPF app, integrate `Microsoft.Web.WebView2`, and point it to the React development server.
* **Milestone**: Your React UI loads and functions inside the WPF app window in mock mode.

### Phase 3: The C# Database & API Gateway
* **Action**: Implement SQLite schemas in C# (`sqlite-net-pcl`). Setup the `WebMessageReceived` dispatcher to handle basic CRUD requests from React (playlists, pins, history).
* **Milestone**: Mock functions in React are replaced one by one with real C# backend commands.

### Phase 4: Local Media Streaming & Thumbnail Ingestion
* **Action**: Implement native C# thumbnail extraction and map the caching directory to `https://cache.local/`.
* **Milestone**: Importing local folders extracts thumbnails natively to disk and renders them in the React video grid with zero database bloating.

### Phase 5: C# Audio Engine & Visualizer Pipe
* **Action**: Implement NAudio capture and FftSharp processing on a background C# thread. Stream the CSV frequency bins at 60Hz.
* **Milestone**: The visualizer dances smoothly around the Orb in response to system-wide playback.

### Phase 6: Native OS Integrations (Volume)
* **Action**: Write the NAudio Audio Session controller.
* **Milestone**: External application controls function natively.
