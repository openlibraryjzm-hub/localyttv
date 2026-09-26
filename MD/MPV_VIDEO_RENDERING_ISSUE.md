# MPV Video Rendering Issue - Investigation & Findings

**Date**: 2026-01-08  
**Issue**: Native mpv player plays audio but video visuals do not appear  
**Status**: 🔴 **CRITICAL** - Video output not initializing for ALL formats (MP4, WebM, MKV)

---

## Executive Summary

The native mpv player successfully:
- ✅ Initializes mpv instance
- ✅ Loads video files
- ✅ Detects video tracks (all codecs: H.264, HEVC, VP8, etc.)
- ✅ Plays audio

However, it **fails** to:
- ❌ Initialize video output (`vo: null`, `width: null`, `height: null`)
- ❌ Render video visuals
- ❌ **Works for ALL formats** - MP4 (H.264), WebM (VP8), MKV (HEVC) all fail

**Root Cause**: **NOT a codec support issue**. The problem is that video output (vo) is not initializing at all, regardless of codec. This suggests a fundamental issue with:
1. Video output driver initialization
2. Window embedding/handle configuration
3. Video rendering surface creation

**Critical Finding**: MP4 (H.264) and WebM (VP8) also fail - these are universally supported codecs, so the issue is NOT missing decoder support.

---

## Technical Details

### Current Behavior

1. **File Loading**: ✅ Successful
   - Files load correctly: `loadfile` command succeeds
   - File path detected: `path: 'loaded'`
   - Duration detected: `duration: '1408.512000'`

2. **Track Detection**: ✅ Successful
   - Video tracks detected: `videoTracksCount: 1`
   - Track details:
     ```json
     {
       "id": 1,
       "type": "video",
       "codec": "hevc",
       "demuxW": 1920,
       "demuxH": 1080,
       "selected": false,
       "default": true
     }
     ```

3. **Video Output**: ❌ **FAILED**
   - `videoFormat: null`
   - `videoCodec: null`
   - `width: null`
   - `height: null`
   - `vo: null` (video output driver not initialized)

4. **Audio Playback**: ✅ Working
   - Audio tracks decode and play correctly
   - `audio-reconfig` events fire successfully

### Error Messages

```
⚠️ Video tracks detected but video output not initializing!
This may indicate a codec support issue. Video tracks: [{…}]
Try checking if HEVC/H.265 codec is supported by your mpv build.

❌ Video failed to load after 30 attempts
⚠️ Video tracks exist but video output failed to initialize!
This likely indicates a codec support issue. Check if your mpv build supports: hevc
```

---

## Code Changes Made

### 1. Removed `force-window` Option
**File**: `src/components/NativeVideoPlayer.jsx`

**Change**: Removed `'force-window': 'yes'` from mpv configuration options.

**Reason**: `force-window` creates a separate window instead of embedding video in the Tauri window. For embedded rendering, we should let the plugin handle window embedding automatically.

**Code**:
```javascript
// BEFORE
options: {
  'vo': 'direct3d',
  'hwdec': 'auto',
  'keep-open': 'yes',
  'force-window': 'yes',  // ❌ Creates separate window
}

// AFTER
options: {
  'vo': 'direct3d',
  'hwdec': 'no',  // Try software decoding first
  'keep-open': 'yes',
  // NO 'force-window' - let plugin handle embedding
}
```

### 2. Added Video Track Selection
**File**: `src/components/NativeVideoPlayer.jsx`

**Change**: Added explicit video track selection using `command('set', ['vid', '1'])`.

**Reason**: Video tracks were detected but not selected (`"selected": false`). mpv needs explicit track selection for some codecs.

**Code**:
```javascript
// After loadfile
await command('set', ['video', 'yes'], windowLabel);
await command('set', ['vid', '1'], windowLabel);
```

**Note**: `setProperty('vid', ...)` does NOT work - must use `command('set', ['vid', ...])`.

### 3. Added Software Decoding Fallback
**File**: `src/components/NativeVideoPlayer.jsx`

**Change**: Added configuration with `hwdec: 'no'` to force software decoding.

**Reason**: Hardware decoding may fail for HEVC. Software decoding is more reliable but slower.

**Code**:
```javascript
{
  name: 'direct3d with software decode (embedded)',
  options: {
    'vo': 'direct3d',
    'hwdec': 'no',  // Force software decoding
    'keep-open': 'yes',
  }
}
```

### 4. Enhanced Diagnostics
**File**: `src/components/NativeVideoPlayer.jsx`

**Changes**:
- Added track list parsing to detect video tracks
- Added codec detection (HEVC/H.265)
- Added detailed error messages
- Added mpv event listener for debugging
- Added verbose logging (`msg-level: 'all=v'`)

**Code**:
```javascript
// Track detection
const trackListStr = await getProperty('track-list', 'string', windowLabel);
const trackList = JSON.parse(trackListStr);
const videoTracks = trackList.filter(t => t.type === 'video');

// Codec detection
if (videoTracks[0].codec === 'hevc' || videoTracks[0].codec === 'h265') {
  console.warn('⚠️ HEVC/H.265 codec detected. Trying software-only decoding...');
  await setProperty('hwdec', 'no', windowLabel);
}
```

### 5. Window Label Consistency
**File**: `src/components/NativeVideoPlayer.jsx`

**Change**: Pass `windowLabel` explicitly to all mpv API calls.

**Reason**: Ensures all operations target the correct mpv instance.

**Code**:
```javascript
const windowLabel = playerId || 'main';
await command('loadfile', [filePath], windowLabel);
await setProperty('pause', false, windowLabel);
await getProperty('width', 'number', windowLabel);
```

### 6. Container Element Setup
**File**: `src/components/NativeVideoPlayer.jsx`

**Change**: Added container mount check and proper sizing.

**Reason**: Ensures container exists before initializing mpv.

**Code**:
```javascript
if (!containerRef.current) {
  throw new Error('Container element not available for mpv rendering');
}

<div 
  ref={containerRef}
  id={`mpv-player-${playerId}`}
  className="w-full h-full bg-black"
  style={{
    width: '100%',
    height: '100%',
    minWidth: '100%',
    minHeight: '100%',
  }}
>
```

---

## Key Learnings

### 1. mpv Video Output Initialization
- Video output (`vo`) only initializes **after** a video stream is successfully decoded
- If decoding fails, `vo` remains `null` even though audio plays
- This is why we see `vo: null` but audio works

### 2. Track Selection
- Video tracks can be detected but not selected (`"selected": false`)
- Must explicitly select tracks using `command('set', ['vid', trackId])`
- `setProperty('vid', ...)` does NOT work - returns "error accessing property"

### 3. Window Embedding
- `force-window: yes` creates a separate window (not embedded)
- For embedded rendering, omit `force-window` and let the plugin handle it
- Window handle (`wid`) is automatically managed by the plugin

### 4. Codec Support (REVISED)
- **CRITICAL FINDING**: MP4 (H.264) and WebM (VP8) also fail
- H.264 and VP8 are **universally supported** in all mpv builds
- This confirms it's **NOT a codec support issue**
- The problem is video output initialization, not decoder availability

### 5. Hardware vs Software Decoding
- Hardware decoding (`hwdec: auto`) may fail for some codecs
- Software decoding (`hwdec: no`) is more reliable but slower
- For HEVC, software decoding is often more compatible

---

## Prime Suspicion: Video Output Not Initializing

**Hypothesis**: Video output (vo) is not initializing due to window embedding or rendering surface issues, NOT codec support.

**Evidence**:
1. ✅ Video tracks are detected for ALL formats (H.264, HEVC, VP8)
2. ✅ Track codecs are identified correctly
3. ✅ Track dimensions are known
4. ❌ Video output never initializes (`vo: null`) - **for ALL formats**
5. ❌ Video format never appears (`videoFormat: null`) - **for ALL formats**
6. ✅ Audio plays (audio codec is supported)
7. ✅ Window handle exists (`wid: "16386700"`)

**Critical Evidence**:
- **MP4 (H.264) fails** - This codec is universally supported
- **WebM (VP8) fails** - This codec is universally supported
- **MKV (HEVC) fails** - Could be codec, but since others fail too...

**Conclusion**: This is **NOT a codec support issue**. The problem is that mpv cannot create a video output surface, likely due to:
1. Window handle not properly configured for embedded rendering
2. Video output driver not able to initialize in embedded mode
3. Tauri window not providing proper rendering context for mpv

---

## Decoder Architecture: One vs Many

### Question
> Do we need to get decoder right once for all or decoders for every type of file/format?

### Answer

**One decoder library handles all formats** - but it must be compiled with support for the codecs you need.

**UPDATE**: Since MP4 (H.264) and WebM (VP8) also fail, this is **NOT a decoder issue**. The decoders are working (audio plays), but video output is not initializing.

#### How It Works

1. **FFmpeg as the Decoder Backend**
   - mpv uses **FFmpeg** as its decoder backend
   - FFmpeg is a comprehensive multimedia framework
   - It supports **hundreds of codecs** (H.264, HEVC, VP8, VP9, AV1, etc.)

2. **Single Library, Multiple Codecs**
   - `libmpv-2.dll` contains:
     - mpv player logic
     - FFmpeg decoders (compiled into the DLL)
     - All supported codecs in one library
   - You don't need separate DLLs for each codec

3. **Compile-Time Codec Selection**
   - When building mpv/FFmpeg, you can:
     - ✅ Include all codecs (larger file, full support)
     - ✅ Include only specific codecs (smaller file, limited support)
     - ❌ Exclude certain codecs (saves space, but breaks compatibility)

4. **Current Situation (REVISED)**
   - **CRITICAL**: MP4 (H.264) and WebM (VP8) also fail
   - These codecs are **universally supported** in all mpv builds
   - This confirms it's **NOT a decoder/codec support issue**
   - The decoders ARE working (audio plays), but video output (vo) is not initializing
   - **Root cause**: Video output initialization failure, not missing codecs

#### What You Need

**One replacement**: Get a `libmpv-2.dll` that includes HEVC decoder support.

This single DLL will handle:
- ✅ H.264/AVC (MP4)
- ✅ HEVC/H.265 (MKV, MP4) - **currently missing**
- ✅ VP8, VP9 (WebM)
- ✅ AV1 (if included)
- ✅ All other supported codecs

**You do NOT need**:
- ❌ Separate DLLs for each codec
- ❌ Multiple decoder libraries
- ❌ Codec-specific installations

---

## Revised Root Cause Analysis

### Critical Finding
**MP4 (H.264) and WebM (VP8) also fail** - These are universally supported codecs that should work in any mpv build.

This means:
- ❌ **NOT a codec support issue** (H.264 and VP8 are always supported)
- ✅ **Video output (vo) initialization issue** - mpv cannot create a rendering surface
- ✅ **Window embedding issue** - mpv cannot render into the Tauri window

### Likely Causes

1. **Window Handle Not Passed to mpv**
   - mpv needs the Tauri window handle (HWND) to render
   - The plugin should handle this automatically, but may not be working
   - `wid` property exists but video output still doesn't initialize

2. **Video Output Driver Not Compatible with Embedded Mode**
   - `direct3d`, `gpu`, etc. may not work in embedded Tauri windows
   - May need a different vo driver for embedded rendering
   - Or may need special window configuration

3. **Tauri Window Not Providing Rendering Context**
   - Tauri window may need to be configured for native rendering
   - May need transparency or special window flags
   - May need to use a different window type

4. **Plugin Not Properly Embedding mpv**
   - `tauri-plugin-libmpv` may not be correctly setting up window embedding
   - May need to pass window handle explicitly
   - May need plugin configuration or initialization changes

### Next Investigation Steps

1. **Check tauri-plugin-libmpv documentation/examples** for embedded rendering setup
2. **Try window transparency** - Some embedded rendering requires transparent windows
3. **Check if plugin needs window handle passed explicitly** - May need to get HWND from Tauri and pass to mpv
4. **Try different window configuration** - May need `transparent: true` or other flags
5. **Check plugin version** - May need to update `tauri-plugin-libmpv` to a version that supports embedded rendering
6. **Test with standalone mpv** - Verify mpv can play files directly (to rule out mpv issues)

---

## Testing Checklist

After obtaining HEVC-enabled DLLs:

- [ ] Replace `libmpv-2.dll` in `src-tauri/lib/`
- [ ] Rebuild application: `npm run tauri dev`
- [ ] Test with HEVC file (MKV with HEVC)
- [ ] Verify console shows:
  - ✅ `videoFormat: "hevc"` or similar
  - ✅ `width: 1920` (or actual width)
  - ✅ `height: 1080` (or actual height)
  - ✅ `vo: "direct3d"` or other video output driver
- [ ] Verify video visuals appear in player
- [ ] Test with other formats (MP4 H.264, WebM VP8) to ensure they still work

---

## Files Modified

1. **`src/components/NativeVideoPlayer.jsx`**
   - Removed `force-window` option
   - Added video track selection
   - Added software decoding fallback
   - Enhanced diagnostics and error messages
   - Added mpv event listener
   - Improved window label consistency

2. **`src-tauri/tauri.conf.json`**
   - Added `"label": "main"` to window configuration

3. **`src-tauri/build.rs`**
   - Already handles DLL copying (no changes needed)

---

## Next Steps (REVISED)

Since MP4 and WebM also fail, this is **NOT a codec/decoder issue**. Focus on:

1. **Investigate window embedding** - How does tauri-plugin-libmpv embed video?
2. **Check plugin documentation** - Are there Windows-specific requirements?
3. **Try window transparency** - May be required for embedded rendering
4. **Check window handle passing** - Does plugin pass HWND to mpv correctly?
5. **Test standalone mpv** - Verify mpv works outside Tauri (to isolate issue)
6. **Review plugin source** - Check how `tauri-plugin-libmpv` handles embedding
7. **Try different vo drivers** - May need Windows-specific driver for embedded mode
8. **Check initialization timing** - May need to wait for window to be fully rendered

---

## Additional Notes

### Why Audio Works But Video Doesn't
- Audio codec (AAC) is supported in the current build
- Video codec (HEVC) is NOT supported in the current build
- mpv can demux both streams, but only decode audio

### Window Handle (wid)
- `wid: "16386700"` indicates mpv has a window handle
- However, video output still doesn't initialize
- This suggests the window handle may not be properly configured for embedded rendering
- Or the video output driver cannot use the handle in embedded mode

### Video Output Drivers
- Tried: `direct3d`, `gpu`, `dxva2`, `gpu-next`, `opengl`
- All fail because video output (vo) never initializes
- This is NOT a decoding issue (audio works, tracks detected)
- This is a video output surface creation issue
- May need Windows-specific embedded rendering setup

---

## References

- mpv documentation: https://mpv.io/manual/stable/
- FFmpeg codec support: https://ffmpeg.org/ffmpeg-codecs.html
- tauri-plugin-libmpv: Check plugin repository for HEVC-enabled builds
- HEVC support in mpv: https://github.com/mpv-player/mpv/issues (search for HEVC)

---

**Status**: 🔴 **INVESTIGATING** - Video output initialization issue affecting all formats

**Next Steps**:
1. Investigate window embedding in tauri-plugin-libmpv
2. Check if window handle needs to be passed explicitly
3. Try window transparency configuration
4. Review plugin documentation for embedded rendering requirements
5. Test with different window configurations

