# YTTV2: WPF C# + WebView2 Refactor Guide

This guide outlines the technical architecture, data bridging strategies, and native Windows integrations for refactoring **yttv2** from Rust-Tauri (v2) to a C# (WPF + WebView2) application. 

The goal of this refactor is to solve the memory leak issues associated with webview-based local media handling, enable native Windows operations (such as managing system-wide volume sessions), and maintain the existing React frontend layout 1:1.

---

## 1. Core Architectural Layout

To keep the refactor speed high and preserve the exact look, feel, and custom animations of the React UI, we will host the compiled React frontend inside a single WPF `WebView2` control.

### The Swapping Mechanism
Instead of using native window layering hacks to swap between the YouTube player (an HTML iframe inside the webview) and local files, we will use a **hybrid window overlay**:
* **The Main Window**: Consists of a WPF `Window` containing a single `WebView2` control set to fill the entire container (`Margin="0"`).
* **Local Player overlay**: A native WPF control hosting `Mpv.NET` is added as a child of the WPF main window, but initialized with `Visibility = Visibility.Collapsed`.
* **When playing YouTube**: React plays the video inside its iframe. C# keeps the native MPV control hidden.
* **When playing local files**: React renders a black placeholder container and sends its screen coordinates to C# via the IPC bridge. C# moves the native MPV window directly over the placeholder coordinates and toggles its visibility to `Visible`.

This leverages WPF's native Win32 window rendering (the Airspace behavior) to overlay the video player perfectly on top of the webview with zero browser CPU overhead.

---

## 2. The C# <=> React IPC Bridge

WPF WebView2 utilizes a simple bidirectional message pipeline. We will wrap all Tauri `invoke` and `listen` calls in React with a single bridge file (`src/api/platformBridge.js`).

### React-to-C# Command (Outgoing)
```javascript
// React Frontend
window.chrome.webview.postMessage({ 
    command: 'get_all_playlists' 
});
```

### C#-to-React Dispatcher (Incoming)
In WPF, you handle the `WebMessageReceived` event:
```csharp
private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
{
    var message = JsonSerializer.Deserialize<Dictionary<string, string>>(e.WebMessageAsString);
    string command = message["command"];

    if (command == "get_all_playlists")
    {
        var playlists = _databaseService.GetAllPlaylists();
        
        // Return results to the webview
        webView.CoreWebView2.PostWebMessageAsJson(new { 
            type = "PLAYLISTS_RESPONSE", 
            payload = playlists 
        });
    }
}
```

---

## 3. High-Performance Audio Visualizer Pipeline

The loopback audio visualizer must capture all system audio, perform FFT analysis, map frequencies to 113 logarithmic bins, and send the data to the webview at 60Hz.

### C# Audio Engine
* **Capture**: Use `NAudio.Wave.WasapiLoopbackCapture` to capture the default Windows playback device.
* **DSP Processing**: Use the `FftSharp` NuGet package. Collect samples on a background thread, apply a Hanning window, and perform a forward FFT.
* **Logarithmic Mapping**: Map the raw frequency bands into 113 bins using the logarithmic scaling formula from `audio_processor.rs`.
* **High-Frequency Transmission**: Join the 113 values into a comma-separated string (e.g. `"0,12,54,34..."`) rather than JSON. This avoids heap allocation and string parsing latency:
  ```csharp
  string csv = string.Join(",", frequencyBins);
  
  // Always marshal to the UI thread for WebView2 calls
  Application.Current.Dispatcher.BeginInvoke(new Action(() => {
      webView.CoreWebView2.PostWebMessageAsString(csv);
  }));
  ```

### React Processing
In `AudioVisualizer.jsx`, listen for the message, parse the CSV string using `.split(',')`, and write the values directly to a React mutable Ref (`barValuesRef.current`). The canvas `requestAnimationFrame` loop draws from this Ref, ensuring smooth interpolation and zero React re-renders.

---

## 4. Local File and Image Optimization

Tauri struggled with memory overload because it extracted thumbnails in the browser canvas and saved them as massive Base64 strings in the SQLite database.

### The C# Optimization
1. **Direct Disk Caching**: Extract video thumbnails natively in C# (using a library like `FFMediaToolkit` or an `ffmpeg.exe` command-line process) and save them as standard `.jpg` files in the local AppData folder.
2. **Compact Database**: Only store the image file path (e.g., `C:\Users\...\cache\thumb_123.jpg`) in SQLite. 
3. **Virtual Folder Mapping**: Map the AppData cache folder to a virtual origin in WebView2:
   ```csharp
   webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
       "cache.local", 
       @"C:\Users\...\AppData\Local\YTTV2\cache\", 
       CoreWebView2HostResourceAccessKind.Allow
   );
   ```
4. **Rendering**: In React, thumbnails are loaded natively using standard URLs: `<img src="https://cache.local/thumb_123.jpg" />`. WebView2 manages caching and memory release automatically.

---

## 5. Native OS Integrations


### External App Volume Control
* Use `NAudio`'s CoreAudio wrapper to access the Windows Audio Session APIs.
* Enumerate active playback sessions, identify target executables (e.g. `"Spotify.exe"`), and control their master volume level programmatically.

---

## 6. Phased Refactoring Strategy

To maintain sanity and steady progress, execute the refactor in the following sequence in a fresh sandbox repository:

1. **Phase 1: React Decoupling (Mock Mode)**: Add a mock environment to your React frontend so it can run and render in a standard Chrome browser tab with fake database/visualizer data.
2. **Phase 2: WPF WebView2 Shell Setup**: Create the WPF app, integrate `Microsoft.Web.WebView2`, and point it to the React development server.
3. **Phase 3: C# Database & Bridge**: Re-implement SQLite in C# and wire up the basic data commands (adding playlists, rendering cards).
4. **Phase 4: C# Audio Engine**: Build the WASAPI capture and FFT calculations in isolation, verification through C# debug logs before connecting to the webview.
5. **Phase 5: Native Features**: Implement MPV rendering and volume session controls.
