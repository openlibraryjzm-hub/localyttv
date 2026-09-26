# Browser Page Feasibility Analysis

## Executive Summary

**Feasibility: ✅ FEASIBLE** with Tauri 2's multi-webview capabilities, but requires Rust-level implementation.

### Core Architecture

**One Tauri App Window (1920x1080):**
- **Left Half (960x1080)**: Your current YouTube TV app (React + SQLite database)
- **Right Half (960x1080)**: Native browser webview (separate browser process, like Chrome)

**Key Requirement**: The browser must be a **native browser webview** (separate process), NOT an iframe. This means:
- ✅ Full browser capabilities (extensions support, dev tools, etc.)
- ✅ Complete process isolation from your React app
- ✅ Independent cookie/storage contexts
- ⚠️ Requires Rust-level implementation using Tauri's `WebviewBuilder`

### Technical Approach

Tauri 2 supports **multiple webviews in a single window**. Each webview runs as a separate browser process:
- **Main Webview**: Your React app (current project)
- **Secondary Webview**: Browser instance (new, embedded in right half)

**Implementation**: Use Tauri's `WebviewBuilder` API in Rust to create and position the second webview.

---

## 1. Technical Foundation

### 1.1 Current Architecture

Your app uses:
- **Tauri 2** - Desktop framework with webview backend
- **React 19** - Frontend framework
- **CSS Grid Layout System** - Already supports splitscreen (`full`, `half`, `quarter` modes)
- **YouTube IFrame API** - Embedded via iframes in webview
- **Navigation System** - Tab-based routing (`TopNavigation.jsx`)

### 1.2 Webview Capabilities

**Tauri 2 uses a system webview** (not a full browser engine like Electron):
- **Windows**: Uses Edge WebView2 (Chromium-based)
- **macOS**: Uses WKWebView (WebKit-based)
- **Linux**: Uses WebKitGTK

**Key Point**: The webview is a **full-featured browser engine** that can:
- ✅ Render any website
- ✅ Execute JavaScript
- ✅ Handle navigation (back/forward)
- ✅ Support iframes (including YouTube embeds)
- ✅ Support multiple iframes simultaneously

---

## 2. Implementation Approaches

### 2.1 Approach 1: Native Browser Webview (REQUIRED - What You Want)

**Feasibility: ✅ FEASIBLE** (Requires Rust Implementation)

Embed a **separate native browser webview** as a second process in the same window. This is a true browser, not an iframe.

**Implementation (Rust Backend):**

Create a second webview in your Tauri setup:

```rust
// src-tauri/src/lib.rs
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_mpv::init())
        // ... other plugins
        .setup(|app| {
            // Get main window
            let main_window = app.get_webview_window("main").unwrap();
            
            // Create browser webview (right half)
            let browser_webview = WebviewWindowBuilder::new(
                app,
                "browser", // window label
                WebviewUrl::App("browser.html".into()) // or external URL
            )
            .title("Browser")
            .inner_size(960.0, 1080.0) // Right half of 1920x1080
            .position(960.0, 0.0) // Position at right side
            .decorations(false)
            .transparent(true)
            .build()
            .unwrap();
            
            // Position browser webview as child of main window
            // (Platform-specific implementation needed)
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Frontend Browser Controller (React):**

```jsx
// src/components/BrowserController.jsx
import { invoke } from '@tauri-apps/api/core';

const BrowserController = () => {
  const [url, setUrl] = useState('https://www.google.com');
  
  const navigateBrowser = async (newUrl) => {
    await invoke('browser_navigate', { url: newUrl });
  };
  
  const goBack = async () => {
    await invoke('browser_go_back');
  };
  
  const goForward = async () => {
    await invoke('browser_go_forward');
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Browser Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border-b">
        <button onClick={goBack}>←</button>
        <button onClick={goForward}>→</button>
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && navigateBrowser(url)}
        />
        <button onClick={() => navigateBrowser(url)}>Go</button>
      </div>
      
      {/* Browser webview is rendered by Tauri, not React */}
      <div className="flex-1">
        {/* This is just a placeholder - actual webview is managed by Rust */}
        <p>Browser webview managed by Tauri</p>
      </div>
    </div>
  );
};
```

**Rust Commands for Browser Control:**

```rust
// src-tauri/src/commands.rs
use tauri::Manager;

#[tauri::command]
pub async fn browser_navigate(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    browser_window.eval(&format!("window.location.href = '{}';", url))
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn browser_go_back(app: tauri::AppHandle) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    browser_window.eval("window.history.back();")
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn browser_go_forward(app: tauri::AppHandle) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    browser_window.eval("window.history.forward();")
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
```

**Pros:**
- ✅ **True native browser** (separate process, like Chrome)
- ✅ Full browser capabilities (dev tools, extensions support)
- ✅ Complete process isolation from React app
- ✅ Independent cookie/storage contexts
- ✅ No iframe limitations (X-Frame-Options doesn't apply)
- ✅ Better performance (separate process)

**Cons:**
- ⚠️ **Requires Rust implementation** (not just React)
- ⚠️ More complex architecture
- ⚠️ Window positioning/embedding may be platform-specific
- ⚠️ Communication between webviews via IPC
- ⚠️ May have issues (see GitHub issue #10011)

**Platform Considerations:**
- **Windows**: WebView2 supports child windows, but embedding in same window may require custom implementation
- **macOS**: WKWebView can be embedded, but positioning may need native code
- **Linux**: WebKitGTK embedding possible but complex

### 2.2 Approach 2: Iframe-Based Browser (NOT What You Want)

**Feasibility: ✅ EASY** but doesn't meet your requirements.

This would use an `<iframe>` in your React app, but you specifically said you want a "native browser just like chrome", not an iframe.

**Why This Doesn't Work:**
- ❌ Not a separate browser process
- ❌ Limited by iframe sandboxing
- ❌ Subject to X-Frame-Options restrictions
- ❌ Shares same process as React app

**Verdict**: Skip this - you need Approach 1 (native webview).

---

## 3. Splitscreen Compatibility

### 3.1 YouTube App + Native Browser in Splitscreen

**Feasibility: ✅ COMPATIBLE** (with proper webview positioning)

**Why It Works:**
1. **Separate processes**: Your React app (left) and browser webview (right) are separate processes
2. **Independent contexts**: Each webview has its own JavaScript context, cookies, storage
3. **No conflicts**: Complete isolation - they don't interfere with each other
4. **Window positioning**: Browser webview positioned at (960, 0) with size (960, 1080) - right half

**Layout Architecture:**
```
┌─────────────────────────────────────────┐
│  Tauri Window (1920x1080)              │
├──────────────────┬─────────────────────┤
│                  │                     │
│  React App       │  Browser Webview    │
│  (Main Webview)  │  (Secondary Webview)│
│  960x1080        │  960x1080           │
│  Position: 0,0   │  Position: 960,0    │
│                  │                     │
│  - YouTube TV    │  - Native Browser   │
│  - Database      │  - Full Chrome-like │
│  - Your App      │  - Separate Process │
│                  │                     │
└──────────────────┴─────────────────────┘
```

**Key Difference from Iframe Approach:**
- **Not in React DOM**: Browser webview is NOT rendered by React
- **Managed by Rust**: Created and positioned by Tauri in `lib.rs`
- **Separate Process**: Runs in its own browser process (like opening Chrome)
- **IPC Communication**: React app communicates with browser via Tauri commands

### 3.2 View Mode Switching (Fullscreen Toggle)

**Feasibility: ✅ SUPPORTED** (Requires Rust Implementation)

Since the browser is a separate webview (not in React DOM), you need to resize/reposition it via Rust:

**Half Mode (Splitscreen - Default):**
```
┌──────────────────┬──────────────────┐
│                  │                  │
│  React App       │  Browser Webview │
│  (960x1080)      │  (960x1080)      │
│  Position: 0,0   │  Position: 960,0 │
│                  │                  │
└──────────────────┴──────────────────┘
```

**Full Mode (Browser Fullscreen):**
```
┌─────────────────────────────────────┐
│                                     │
│        Browser Webview              │
│        (1920x1080)                  │
│        Position: 0,0                │
│                                     │
└─────────────────────────────────────┘
```

**Implementation (Rust Commands):**

```rust
// src-tauri/src/commands.rs
use tauri::Manager;

#[tauri::command]
pub async fn browser_set_fullscreen(
    app: tauri::AppHandle, 
    fullscreen: bool
) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    if fullscreen {
        // Resize browser to full window (1920x1080)
        browser_window.set_size(tauri::LogicalSize::new(1920.0, 1080.0))
            .map_err(|e| e.to_string())?;
        browser_window.set_position(tauri::LogicalPosition::new(0.0, 0.0))
            .map_err(|e| e.to_string())?;
        
        // Hide main window content (or minimize React app area)
        // This might require hiding the main webview or adjusting its size
    } else {
        // Return to splitscreen (960x1080, position 960,0)
        browser_window.set_size(tauri::LogicalSize::new(960.0, 1080.0))
            .map_err(|e| e.to_string())?;
        browser_window.set_position(tauri::LogicalPosition::new(960.0, 0.0))
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}
```

**Frontend Toggle:**

```jsx
// In BrowserController.jsx
import { invoke } from '@tauri-apps/api/core';
import { useLayoutStore } from '../store/layoutStore';

const BrowserController = () => {
  const { viewMode, setViewMode } = useLayoutStore();
  
  const handleFullscreen = async () => {
    await invoke('browser_set_fullscreen', { fullscreen: true });
    setViewMode('full'); // Update React state
  };
  
  const handleReturnToSplitscreen = async () => {
    await invoke('browser_set_fullscreen', { fullscreen: false });
    setViewMode('half'); // Update React state
  };
  
  return (
    <div className="w-full h-full">
      <button onClick={viewMode === 'full' ? handleReturnToSplitscreen : handleFullscreen}>
        {viewMode === 'full' ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
};
```

**Note**: The browser webview is managed by Rust, not React. React only controls the toolbar/UI and sends commands to resize/position the webview.

---

## 4. Key Considerations

### 4.1 Security (CSP & Iframe Sandboxing)

**Current State:**
- Your `tauri.conf.json` has `"csp": null` (no restrictions)
- This is **permissive** but may need refinement for production

**Recommendations:**

1. **Configure CSP for Browser Page:**
```json
{
  "app": {
    "security": {
      "csp": "default-src 'self' https: http: data: blob:; frame-src 'self' https: http:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; style-src 'self' 'unsafe-inline' https: http:;"
    }
  }
}
```

2. **Use Iframe Sandbox Attributes:**
```jsx
<iframe
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
  allow="autoplay; fullscreen; picture-in-picture; microphone; camera"
/>
```

3. **URL Validation:**
- Validate URLs before loading
- Block dangerous protocols (`file:`, `javascript:`, etc.)
- Consider URL allowlist/blocklist

### 4.2 Performance

**Concerns:**
- Multiple iframes (YouTube + Browser) may impact performance
- Memory usage increases with multiple web contexts

**Mitigation:**
- ✅ Lazy load browser iframe (only when page is active)
- ✅ Unload browser iframe when switching away
- ✅ Use `loading="lazy"` attribute
- ✅ Monitor memory usage

**Implementation:**
```jsx
const BrowserPage = () => {
  const [isActive, setIsActive] = useState(false);
  const { currentPage } = useNavigationStore();
  
  useEffect(() => {
    setIsActive(currentPage === 'browser');
  }, [currentPage]);
  
  return (
    <div className="w-full h-full">
      {isActive && (
        <iframe src={url} />
      )}
    </div>
  );
};
```

### 4.3 Navigation Integration

**Feasibility: ✅ EASY INTEGRATION**

Your existing navigation system can easily accommodate a browser tab:

**Add to TopNavigation:**
```jsx
const tabs = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'videos', label: 'Videos' },
  { id: 'history', label: 'History' },
  { id: 'browser', label: 'Browser', icon: <Globe size={16} /> }, // NEW
  { id: 'settings', label: 'Settings' },
  // ...
];
```

**Add to App.jsx:**
```jsx
{currentPage === 'browser' && (
  <BrowserPage />
)}
```

### 4.4 State Management

**Feasibility: ✅ FITS EXISTING PATTERNS**

Create a browser store (similar to your existing stores):

```jsx
// src/store/browserStore.js
export const useBrowserStore = create((set) => ({
  currentUrl: 'https://www.google.com',
  history: [],
  currentIndex: -1,
  bookmarks: [],
  
  navigate: (url) => set((state) => {
    const newHistory = state.history.slice(0, state.currentIndex + 1);
    newHistory.push(url);
    return {
      currentUrl: url,
      history: newHistory,
      currentIndex: newHistory.length - 1
    };
  }),
  
  goBack: () => set((state) => {
    if (state.currentIndex > 0) {
      return {
        currentIndex: state.currentIndex - 1,
        currentUrl: state.history[state.currentIndex - 1]
      };
    }
    return state;
  }),
  
  // ... similar for goForward, addBookmark, etc.
}));
```

---

## 5. Implementation Roadmap

### Phase 1: Basic Browser Page (MVP)
1. Create `BrowserPage.jsx` component
2. Add iframe with URL input
3. Add basic navigation (back/forward/refresh)
4. Add to `TopNavigation` tabs
5. Integrate with `App.jsx` routing

### Phase 2: Splitscreen Integration
1. Test browser in `half` mode alongside YouTube player
2. Implement fullscreen toggle
3. Add view mode persistence (remember user preference)

### Phase 3: Enhanced Features
1. Browser history management
2. Bookmarks
3. Search bar with autocomplete
4. Tab management (multiple browser tabs)
5. Download handling

### Phase 4: Security Hardening
1. Configure CSP properly
2. URL validation and filtering
3. Safe browsing checks
4. Privacy controls (clear history, cookies)

---

## 6. Critical Implementation Details

### 6.1 Window Positioning & Embedding

**Challenge**: Tauri 2's `WebviewBuilder` creates a separate window, not an embedded view. You need to position it precisely to appear as "half" of your main window.

**Solution Options:**

**Option A: Child Window (Recommended)**
```rust
// Create browser as child window of main window
let browser_webview = WebviewWindowBuilder::new(
    app,
    "browser",
    WebviewUrl::App("browser.html".into())
)
.title("Browser")
.inner_size(960.0, 1080.0)
.position(960.0, 0.0)
.decorations(false)
.transparent(true)
.parent(&main_window) // Make it a child window
.build()?;
```

**Option B: Overlay Window**
- Create browser window without decorations
- Position it exactly at (960, 0) with size (960, 1080)
- Ensure it stays on top of main window
- May require platform-specific code

**Option C: Single Window with Two Webviews (If Supported)**
- Research if Tauri 2 supports multiple webviews in one window
- This would be ideal but may not be fully supported

### 6.2 Known Issues

**GitHub Issue #10011**: Multiple webviews in single window may have display issues.

**Workarounds:**
- Test thoroughly on target platform (Windows)
- Consider using separate windows positioned side-by-side
- Monitor Tauri 2 updates for multi-webview support improvements

### 6.3 Communication Between Webviews

**Challenge**: React app (main webview) needs to control browser webview (secondary webview).

**Solution**: Use Tauri IPC commands:
```rust
// React → Rust → Browser Webview
// React calls: invoke('browser_navigate', { url })
// Rust command executes: browser_window.eval("window.location.href = ...")
```

**For Browser → React communication** (optional):
- Use Tauri events: `browser_window.emit("url-changed", url)`
- React listens: `app.listen("url-changed", handler)`

---

## 7. Potential Challenges & Solutions

### Challenge 1: Sites Blocking Iframe Embedding

**Problem:** Some sites set `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`

**Solution:**
- Detect blocked sites and show message: "This site cannot be embedded. Open in external browser?"
- Provide "Open Externally" button using `tauri-plugin-opener`
- Consider using `tauri-plugin-shell` to open URLs in default browser

### Challenge 2: YouTube Embeds in Browser

**Problem:** User might try to play YouTube videos in the browser page while YouTube player is active

**Solution:**
- Option A: Allow it (two YouTube players simultaneously - may cause rate limiting)
- Option B: Detect YouTube URLs and offer to "Play in Main Player" button
- Option C: Block YouTube URLs in browser (redirect to main player)

**Recommendation:** Option B - Best UX, prevents conflicts

### Challenge 3: Memory Usage

**Problem:** Multiple iframes consume significant memory

**Solution:**
- Lazy load browser iframe
- Unload when switching pages
- Monitor memory and warn users if needed
- Consider implementing iframe recycling

### Challenge 4: Cookie/Storage Isolation

**Problem:** Browser iframe shares cookies with main app (same origin)

**Solution:**
- This is actually **desirable** for most use cases (shared login state)
- If isolation is needed, use `sandbox` attribute without `allow-same-origin`
- Note: Without `allow-same-origin`, some sites may break

---

## 8. Testing Strategy

### 7.1 Compatibility Testing
- Test various websites (Google, GitHub, Reddit, etc.)
- Test YouTube embeds in browser vs. main player
- Test view mode switching (full ↔ half ↔ quarter)
- Test navigation (back/forward)

### 7.2 Performance Testing
- Memory usage with browser + YouTube player
- CPU usage during video playback
- Network bandwidth with multiple active iframes

### 7.3 Security Testing
- CSP enforcement
- XSS prevention
- URL validation
- Malicious site blocking

---

## 9. Conclusion

### ✅ Feasibility Verdict: **HIGHLY FEASIBLE**

**Summary:**
- ✅ Tauri 2 supports multiple webviews (separate processes)
- ✅ True native browser experience (not iframe)
- ✅ Complete process isolation
- ⚠️ **Requires Rust implementation** (not just React)
- ⚠️ Window positioning/embedding complexity
- ⚠️ Known issues with multiple webviews (GitHub #10011)
- ⚠️ Platform-specific considerations (Windows/macOS/Linux)

### Recommended Approach

**Use Approach 1 (Native Browser Webview):**
1. ✅ True native browser (separate process)
2. ✅ Complete isolation from React app
3. ✅ Full browser capabilities
4. ⚠️ Requires Rust implementation
5. ⚠️ Window positioning/embedding complexity

### Next Steps

1. **Research & Prototype** (1 week):
   - Study Tauri 2 `WebviewBuilder` API
   - Test creating second webview in same window
   - Verify window positioning works on target platform (Windows)
   - Check GitHub issue #10011 for known problems

2. **Rust Implementation** (1-2 weeks):
   - Create browser webview in `lib.rs` setup
   - Implement window positioning/resizing commands
   - Add IPC commands for navigation (back/forward/refresh)
   - Test splitscreen and fullscreen modes

3. **React Integration** (3-5 days):
   - Create `BrowserController.jsx` component (toolbar only)
   - Add browser tab to navigation
   - Wire up fullscreen toggle
   - Test communication between React and browser webview

4. **Polish** (1-2 weeks):
   - Add browser history management
   - URL validation and security
   - Error handling for webview issues
   - Performance optimization

### Final Notes

**Important Architecture Change:**

This is **NOT** a simple React component addition. The browser is a **separate webview process** managed by Rust, not rendered by React.

**What You Need:**
1. **Rust Implementation** (Primary Work):
   - Create second webview in `lib.rs` using `WebviewBuilder`
   - Implement window positioning/resizing commands
   - Handle fullscreen toggle via Rust commands
   - Platform-specific positioning logic (Windows/macOS/Linux)

2. **React Integration** (Secondary):
   - Create `BrowserController.jsx` (toolbar UI only - browser is separate)
   - Add browser tab to navigation
   - Wire up IPC commands to control browser webview
   - Handle fullscreen state in React (for UI updates)

3. **Communication Layer**:
   - Tauri commands for browser control (navigate, back, forward, refresh)
   - Events from browser webview to React (optional - for URL updates, etc.)

**Key Challenges:**
- ⚠️ Window embedding/positioning may be platform-specific
- ⚠️ Known issues with multiple webviews (GitHub #10011)
- ⚠️ Communication between webviews via IPC
- ⚠️ Managing two separate browser processes in one window

**This is a more complex implementation** than an iframe approach, but gives you the true native browser experience you want.

---

## Appendix: Code Snippets

### Rust: Create Browser Webview

```rust
// src-tauri/src/lib.rs
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_mpv::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Get main window
            let main_window = app.get_webview_window("main").unwrap();
            
            // Create browser webview (right half: 960x1080 at position 960,0)
            let browser_webview = WebviewWindowBuilder::new(
                app,
                "browser",
                WebviewUrl::App("browser.html".into()) // Or external URL
            )
            .title("Browser")
            .inner_size(960.0, 1080.0)
            .position(960.0, 0.0)
            .decorations(false)
            .transparent(true)
            .parent(&main_window) // Make it child of main window
            .build()
            .expect("Failed to create browser webview");
            
            // Initialize database, streaming server, etc.
            // ... existing setup code ...
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_playlist,
            commands::get_all_playlists,
            // ... existing commands ...
            commands::browser_navigate,
            commands::browser_go_back,
            commands::browser_go_forward,
            commands::browser_refresh,
            commands::browser_set_fullscreen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Rust: Browser Control Commands

```rust
// src-tauri/src/commands.rs
use tauri::Manager;

#[tauri::command]
pub async fn browser_navigate(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    browser_window.eval(&format!("window.location.href = '{}';", url))
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn browser_go_back(app: tauri::AppHandle) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    browser_window.eval("window.history.back();")
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn browser_go_forward(app: tauri::AppHandle) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    browser_window.eval("window.history.forward();")
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn browser_refresh(app: tauri::AppHandle) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    browser_window.eval("window.location.reload();")
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn browser_set_fullscreen(
    app: tauri::AppHandle,
    fullscreen: bool
) -> Result<(), String> {
    let browser_window = app.get_webview_window("browser")
        .ok_or("Browser window not found")?;
    
    if fullscreen {
        // Resize to full window (1920x1080)
        browser_window.set_size(tauri::LogicalSize::new(1920.0, 1080.0))
            .map_err(|e| e.to_string())?;
        browser_window.set_position(tauri::LogicalPosition::new(0.0, 0.0))
            .map_err(|e| e.to_string())?;
    } else {
        // Return to splitscreen (960x1080 at 960,0)
        browser_window.set_size(tauri::LogicalSize::new(960.0, 1080.0))
            .map_err(|e| e.to_string())?;
        browser_window.set_position(tauri::LogicalPosition::new(960.0, 0.0))
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}
```

### React: Browser Controller Component

```jsx
// src/components/BrowserController.jsx
import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLayoutStore } from '../store/layoutStore';
import { Globe, ArrowLeft, ArrowRight, RotateCw, X, Maximize2, Minimize2 } from 'lucide-react';

const BrowserController = () => {
  const [url, setUrl] = useState('https://www.google.com');
  const [inputValue, setInputValue] = useState(url);
  const { viewMode, setViewMode } = useLayoutStore();

  const navigate = async (newUrl) => {
    try {
      const urlObj = new URL(newUrl.startsWith('http') ? newUrl : `https://${newUrl}`);
      setUrl(urlObj.href);
      await invoke('browser_navigate', { url: urlObj.href });
    } catch (e) {
      console.error('Invalid URL or navigation failed:', e);
    }
  };

  const goBack = async () => {
    try {
      await invoke('browser_go_back');
    } catch (e) {
      console.error('Go back failed:', e);
    }
  };

  const goForward = async () => {
    try {
      await invoke('browser_go_forward');
    } catch (e) {
      console.error('Go forward failed:', e);
    }
  };

  const refresh = async () => {
    try {
      await invoke('browser_refresh');
    } catch (e) {
      console.error('Refresh failed:', e);
    }
  };

  const handleFullscreen = async () => {
    try {
      await invoke('browser_set_fullscreen', { fullscreen: true });
      setViewMode('full');
    } catch (e) {
      console.error('Fullscreen failed:', e);
    }
  };

  const handleReturnToSplitscreen = async () => {
    try {
      await invoke('browser_set_fullscreen', { fullscreen: false });
      setViewMode('half');
    } catch (e) {
      console.error('Return to splitscreen failed:', e);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Browser Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
        <button
          onClick={goBack}
          className="p-1 rounded hover:bg-gray-200"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          onClick={goForward}
          className="p-1 rounded hover:bg-gray-200"
          title="Forward"
        >
          <ArrowRight size={16} />
        </button>
        <button
          onClick={refresh}
          className="p-1 rounded hover:bg-gray-200"
          title="Refresh"
        >
          <RotateCw size={16} />
        </button>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && navigate(inputValue)}
          className="flex-1 px-3 py-1 border rounded"
          placeholder="Enter URL or search..."
        />
        
        {/* Fullscreen Toggle */}
        {viewMode === 'full' ? (
          <button
            onClick={handleReturnToSplitscreen}
            className="p-1 rounded hover:bg-gray-200"
            title="Return to splitscreen"
          >
            <Minimize2 size={16} />
          </button>
        ) : (
          <button
            onClick={handleFullscreen}
            className="p-1 rounded hover:bg-gray-200"
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        )}
      </div>

      {/* Note: Browser webview is rendered by Tauri, not React */}
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Browser webview managed by Tauri</p>
      </div>
    </div>
  );
};

export default BrowserController;
```

### Browser HTML (Optional - if using local HTML file)

```html
<!-- public/browser.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Browser</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <!-- Browser content will be loaded here -->
    <!-- Or use window.location to navigate directly -->
    <script>
        // Navigate to default URL
        window.location.href = 'https://www.google.com';
    </script>
</body>
</html>
```

---

**Document Version:** 1.0  
**Date:** 2026-01-14  
**Author:** Feasibility Analysis
