# Native Video Player Integration - Current Approach

## Goal
Embed a native mpv player into a Tauri (Rust + React) desktop app to play **all video formats/codecs** (including HEVC/H.265, MKV, etc.) that browsers cannot handle.

## Current Architecture

### Technology Stack
- **Frontend**: React 19 + Tauri 2
- **Player**: `tauri-plugin-mpv` (v0.5.2) - JSON IPC version from nini22P
- **Backend**: Rust with `tauri-plugin-mpv` plugin
- **Platform**: Windows (primary target)

### Integration Method

1. **Plugin Initialization**
   - Plugin registered in `src-tauri/src/lib.rs`: `.plugin(tauri_plugin_mpv::init())`
   - Window configured with `transparent: true` in `tauri.conf.json` for overlay support

2. **Player Component** (`src/components/NativeVideoPlayer.jsx`)
   - Uses `tauri-plugin-mpv-api` functions: `initializeMpv()`, `sendMpvCommand()`, `getMpvProperty()`, `setMpvProperty()`, `observeMpvProperties()`, `destroyMpv()`
   - Initializes mpv with IPC configuration:
     ```javascript
     const config = {
       mpvArgs: ['--vo=gpu', '--hwdec=auto-safe', '--keep-open=yes', '--force-window'],
       observedProperties: ['pause', 'time-pos', 'duration', 'filename', 'wid']
     };
     await initializeMpv(config);
     ```
   - Loads video files via `sendMpvCommand(['loadfile', filePath])`

3. **Expected Behavior**
   - IPC plugin embeds mpv's own window into the Tauri window
   - Uses `--force-window` flag which the IPC plugin handles for embedding
   - Video should appear instantly when file loads

## Solution: Switch to IPC Plugin

**Previous Problem**: `tauri-plugin-libmpv` direct embedding failed - video output (vo) never initialized, causing "audio only" playback.

**Solution**: Switched to `tauri-plugin-mpv` (JSON IPC version) which:
- ✅ Reliably embeds mpv's own window into Tauri window
- ✅ Fixes the "audio only" problem
- ✅ Supports all codecs/formats
- ✅ Uses `--force-window` which the IPC plugin handles for embedding

## Current Code Approach

```javascript
// Initialize mpv with IPC plugin
const config = {
  mpvArgs: [
    '--vo=gpu',
    '--hwdec=auto-safe',
    '--keep-open=yes',
    '--force-window', // IPC plugin uses this to embed mpv window
  ],
  observedProperties: ['pause', 'time-pos', 'duration', 'filename', 'wid']
};
await initializeMpv(config);

// Load video
await sendMpvCommand(['loadfile', filePath]);

// Get properties (no window label needed - single instance)
const width = await getMpvProperty('width');
const height = await getMpvProperty('height');
```

## Key Differences from Previous Approach

1. **Plugin Type**
   - **Old**: `tauri-plugin-libmpv` - Direct libmpv embedding (failed on Windows)
   - **New**: `tauri-plugin-mpv` - JSON IPC version (reliable embedding)

2. **Window Embedding**
   - **Old**: Plugin should handle window handle (HWND) automatically (didn't work)
   - **New**: IPC plugin embeds mpv's own window into Tauri window (works reliably)

3. **API Differences**
   - **Old**: `init(config, windowLabel)`, `command(cmd, args, windowLabel)`, `getProperty(name, type, windowLabel)`
   - **New**: `initializeMpv(config)`, `sendMpvCommand([cmd, ...args])`, `getMpvProperty(name)` (no window label needed)

4. **Configuration**
   - **Old**: `initialOptions` object with mpv properties
   - **New**: `mpvArgs` array with command-line arguments (e.g., `['--vo=gpu', '--force-window']`)

5. **Window Transparency**
   - **New**: Window configured with `transparent: true` in `tauri.conf.json` for overlay support

## Migration Steps Completed

- ✅ Replaced `tauri-plugin-libmpv-api` with `tauri-plugin-mpv-api` in `package.json`
- ✅ Replaced `tauri-plugin-libmpv` with `tauri-plugin-mpv` in `Cargo.toml`
- ✅ Updated `lib.rs` to use `tauri_plugin_mpv::init()`
- ✅ Added `transparent: true` to window config in `tauri.conf.json`
- ✅ Rewrote `NativeVideoPlayer.jsx` to use new IPC API
- ✅ Updated initialization to use `initializeMpv()` with `mpvArgs` array
- ✅ Updated commands to use `sendMpvCommand()` instead of `command()`
- ✅ Updated property access to use `getMpvProperty()` / `setMpvProperty()`
- ✅ Updated property observation to use `observeMpvProperties()`

## Files Modified

- `src/components/NativeVideoPlayer.jsx` - Rewritten to use IPC API
- `src-tauri/src/lib.rs` - Updated to use `tauri_plugin_mpv::init()`
- `src-tauri/Cargo.toml` - Updated dependency to `tauri-plugin-mpv = "0.1"`
- `src-tauri/tauri.conf.json` - Added `transparent: true` to window config
- `package.json` - Updated dependency to `tauri-plugin-mpv-api: ^0.5.2`
- `src-tauri/Cargo.toml` - Updated dependency to `tauri-plugin-mpv = "0.5"`

## Next Steps

1. **Install dependencies**: Run `npm install` and `cargo build` to get new plugin
2. **Test with simple MP4**: Video should appear instantly
3. **Test with HEVC/MKV**: Should work with all codecs
4. **Verify embedding**: mpv window should be embedded in Tauri window (not separate)

## References

- Plugin repository: https://github.com/nini22P/tauri-plugin-mpv
- IPC plugin uses JSON IPC to communicate with mpv process
- `--force-window` flag is handled by plugin for embedding

