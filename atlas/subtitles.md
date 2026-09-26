# Subtitle Engine & Local Video Track Architecture (2026)

This document provides architectural context, implementation specifications, and operational details for the local video subtitle engine in YTTV.

---

## 1. High-Level Overview

The subtitle engine provides cross-platform subtitle track detection, extraction, and rendering for local video playback across:
* **Linux / Steam Deck Target**: Rust Tauri 2.0 backend (`src-tauri/src/commands.rs`).
* **Windows Target**: C# WPF backend (`src-csharp/YTTV/MainWindow.xaml.cs`).
* **Frontend**: React + HTML5 `<video>` (`src/components/LocalVideoPlayer.jsx`).

### Core Design Philosophy: Zero Airspace & HWND Occlusion
To maintain fluid UI overlay behavior (popups, splitscreen cards, YouTube iframe switching) without subwindow z-index occlusion ("Airspace bugs"), subtitle rendering relies on **HTML5 `<track>` elements** and dynamically created WebVTT Blob URLs in standard DOM space.

---

## 2. Track Discovery & Probing

When a local video file (`videoUrl`) is loaded in `LocalVideoPlayer.jsx`, the player calls `get_video_subtitles(filePath)` over IPC.

### A. Embedded Container Streams (`ffprobe`)
* **Probing Command**:
  ```bash
  ffprobe -v error -select_streams s -show_entries stream=index,codec_name:stream_tags -of json "<clean_file_path>"
  ```
* **Track Parsing**:
  * Scans all embedded subtitle streams (`.ass`, `.srt`, `.vtt`, `.sub`).
  * Generates descriptive labels including track title, language code (e.g. `[ENG]`, `[JPN]`), and codec type (`(Embedded SUBRIP)`, `(Embedded ASS)`).
  * Assigns track token IDs formatted as `embedded:<sub_index>:<file_path>`.

### B. Sidecar File Scanner
* Scans the video file's parent directory for matching sidecar subtitle files (`.srt`, `.vtt`, `.ass`, `.ssa`, `.sub`).
* Matches filenames starting with or containing the video stem.

### C. Manual File Loader
* OS Native File Dialog (`select_subtitle_file`) allows picking external subtitle files dynamically at runtime.

---

## 3. On-Demand Extraction & Synchronization

When the user selects a subtitle track, `read_subtitle_vtt(subPath)` is invoked over IPC.

### A. FFmpeg Extraction Pipeline (`0:s:N`)
For embedded tracks (`embedded:<sub_index>:<file_path>`):
```bash
ffmpeg -y -fix_sub_duration -i "<file_path>" -map 0:s:<sub_index> -f webvtt -
```
* **`-fix_sub_duration`**: Fixes overlapping cue durations and aligns container PTS timestamps to the video timeline, eliminating timing drift or offset mismatches.
* **`-map 0:s:<N>`**: Explicitly targets the Nth subtitle stream in the container.

### B. Text Sanitation & Formatting
* **UTF-8 BOM Stripping**: Removes `\u{feff}` Byte Order Marks so WebVTT headers parse cleanly.
* **SRT to WebVTT Conversion**: Replaces comma millisecond separators (`,` -> `.`) and prepends `WEBVTT\n\n` headers.

---

## 4. Subtitle Lifecycle & Memory Management

### A. Zustand State Store (`src/store/subtitleStore.js`)
* `availableSubtitles`: Array of probed tracks.
* `activeSubtitleId`: ID of active track or `null`.
* `activeVttUrl`: Dynamic Blob URL (`blob:http://...`) created from WebVTT text.
* `fontSize`: Active cue font size (`'sm'` | `'md'` | `'lg'` | `'xl'`).

### B. Track Stacking & Memory Leaks Prevention
* **Immediate Reset on Video Change**: `clearSubtitles()` is called immediately when `videoUrl` changes, revoking old Blob URLs via `URL.revokeObjectURL()`.
* **DOM TextTrack Purge**: Iterates `videoRef.current.textTracks` and sets `track.mode = 'disabled'` to prevent browser `TextTrack` accumulation across video switches.
* **Keyed Track Node**: Uses `key={activeVttUrl}` on `<track>` to force complete DOM element replacement on track changes.

---

## 5. UI Control Panel (`FullscreenVideoInfo.jsx`)

Subtitle controls are integrated into the metadata panel under `activeTab === 'subtitles'`:
* **Track Selector List**: Toggle between `Off`, embedded tracks, sidecar tracks, or manual file loader.
* **Font Size Controls**: Buttons for `sm` (14px), `md` (18px), `lg` (24px), `xl` (32px) styled dynamically via CSS `video::cue` rules.

---

## 6. IPC Bridge API Reference

| Command | Arguments | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `get_video_subtitles` | `{ filePath: string }` | `SubtitleTrackInfo[]` | Probes sidecar files & embedded streams. |
| `read_subtitle_vtt` | `{ subPath: string }` | `string` | Extracts/converts selected track to WebVTT string. |
| `select_subtitle_file` | None | `string \| null` | Opens native file picker for external subtitles. |
