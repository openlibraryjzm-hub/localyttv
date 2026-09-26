# C# Host Architecture - Critical Files Manifest

This document tracks the essential files required to run the "Sandwich Architecture" (Layer 1 React, Layer 2 Browser, Layer 3 Window) in the C# WPF Host.

## 1. C# Host Project
**Directory**: `src-csharp/Yttv2.Host/`

| File | Purpose |
|------|---------|
| **`Yttv2.Host.csproj`** | Project configuration. Defines dependencies: `Microsoft.Web.WebView2`, `NAudio`, `System.Data.SQLite`. |
| **`MainWindow.xaml`** | **The Stage**. Defines the Z-Index layering. <br>- `BrowserWebView` (Layer 2) is defined *first* (bottom). <br>- `MainWebView` (Layer 1) is defined *last* (top). |
| **`MainWindow.xaml.cs`** | **The Director**. Initializes WebViews, handles the `SetBrowserVisibility` UI callback, and injects the Bridge. |
| **`App.xaml` / `.cs`** | Standard WPF application entry point. |
| **`Bridge/AppBridge.cs`** | **The Translator**. Exposes C# methods to JavaScript. Handles `SetBrowserVisibility` and command routing. |
| **`Services/DatabaseService.cs`** | Ported SQLite logic for Playlists/History. |
| **`Services/AudioCaptureService.cs`** | System Audio Capture (NAudio) for the visualizer. |

## 2. React Frontend Integration
**Directory**: `src/` (and subfolders)

These files were modified specifically to support the C# Host architecture.

| File | Purpose |
|------|---------|
| **`src/App.jsx`** | **The Logic**. <br>- Detects `currentPage === 'browser'`. <br>- Calls `bridge.set_browser_visibility(true)`. <br>- Toggles `.app-container` class to transparent. <br>- Unmounts Player/SideMenu slots (`null`) to create "holes". |
| **`src/LayoutShell.jsx`** | **The Layout**. Updated to accept `null` props and render *nothing* (instead of placeholders) to create transparent areas. |
| **`src/LayoutShell.css`** | **The Interaction**. Sets `pointer-events: none` on container (allow click-through) and `pointer-events: auto` on children. |
| **`src/App.css`** | **The Canvas**. Removed hardcoded "Blue" background from `body`/`html` to allow true transparency. |
| **`src/utils/bridge.js`** | **The Interface**. Helper utility to detect C# environment and call `window.chrome.webview.hostObjects.bridge`. |
| **`src/components/TopNavigation.jsx`** | **The Trigger**. Contains the "Globe" button that switches `currentPage` to `'browser'`. |

## 3. Data & Config
| File | Purpose |
|------|---------|
| **`playlists.db`** | SQLite Database (referenced relative to executable). |
| **`.gitignore`** | Configured to ignore `src-csharp/` (files are untracked in git but present on disk). |

---

## Architecture Visual
```text
[ USER ]
    |
    v
[ Layer 1: React App (MainWebView) ]  <-- Transparent Background
    |   (Click-through holes)
    v
[ Layer 2: Mock Browser (BrowserWebView) ] <-- Margin-Top: 100px
    |
    v
[ Layer 3: WPF Window (Background #1e1e1e) ]
```
