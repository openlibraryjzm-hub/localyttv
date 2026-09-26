# Session Update: July 19, 2026 — YTTV Packaging Prep

This document serves as the handoff guide for the next agent to complete the **Packaging Phase** for the YTTV Windows Application.

---

## 1. Current Project Status

We have completed the core features required to pivot the application to a clean, empty-database deployment model:
1. **Dynamic YouTube API Key Configuration**:
   * Removed all baked-in API keys.
   * Exchanged the outdated top-menu controls help tooltip for an **API Configuration Panel** on the Info button in [PlayerControllerVideoMenu.jsx](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src/components/PlayerControllerVideoMenu.jsx).
   * Key validation is performed in real-time against Google's servers and saved directly to the SQLite database.
2. **Offline Vector SVG Fallbacks**:
   * Removed Picsum placeholder URLs and missing MAUI assets.
   * Implemented custom inline SVG diamond grid patterns: a solid black diagonal grid for the app banner background, and a solid white diagonal grid for the central Orb.
   * Decoupled default Orb styling from video thumbnails and disabled spillover effects when the pattern is active.
3. **Installer Prep (AppData & UDF Paths)**:
   * Rewrote the database path resolution in [DatabaseService.cs](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/DatabaseService.cs) to initialize and write to `%APPDATA%\Local\YTTV`.
   * Modified the WebView2 initialization in [MainWindow.xaml.cs](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/MainWindow.xaml.cs) to write its User Data Folder (UDF) cache to `%APPDATA%\YTTV\WebView2` instead of the local folder. This prevents startup crashes when installed in system-locked locations like `C:\Program Files`.

---

## 2. Next Session Task: Packaging the App

The goal of the next session is to package the WPF C# app along with the React frontend assets into a single desktop installer.

### Step 2.1: Frontend Static Build
1. Build the React frontend into static assets by running:
   ```bash
   npm run build
   ```
2. This creates a compiled `dist/` directory at the root of the workspace containing `index.html`, assets, and SVGs.

### Step 2.2: Map WebView2 to local `dist/` in C# Release Mode
Currently, the WPF app always loads from the Vite dev server at `http://localhost:1420`.
In [MainWindow.xaml.cs](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/MainWindow.xaml.cs), configure a conditional compilation block inside `InitializeAsync()`:

```csharp
#if DEBUG
    webView.Source = new Uri("http://localhost:1420");
#else
    // Resolve the static 'dist' directory next to the executable
    string uiFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "dist");
    
    // Map https://app.local/ to serve the local dist/ files
    webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
        "app.local",
        uiFolder,
        CoreWebView2HostResourceAccessKind.Allow
    );
    webView.Source = new Uri("https://app.local/index.html");
#endif
```

### Step 2.3: Set Up WPF Build Configuration
1. Configure the C# build properties to copy the built `dist/` folder to the output build directory (or package it as an embedded resource/content).
2. Clean and compile the Release build:
   ```bash
   dotnet build -c Release
   ```
3. Test that launching `YTTV.exe` in `bin/Release/net8.0-windows/` boots up the app offline using the local compiled assets without the Vite dev server running.

### Step 2.4: Packaging into an Installer
1. Create an installer script (e.g. using Inno Setup, Wix, or the Visual Studio Installer Projects extension).
2. Point the installer to bundle:
   * `YTTV.exe` (and associated DLLs) from the `bin/Release/net8.0-windows/` output.
   * The `dist/` folder located in the same directory.
3. Verify that installing and running the app creates the database in the user's `%APPDATA%` path, loads the static files, and initializes without errors.
