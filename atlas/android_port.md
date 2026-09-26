# YTTV Tauri Android Port
 
## 🎯 Status: Fully Functional Feature Parity
The application has been successfully ported to Android using the Tauri 2 Mobile architecture. We have achieved feature parity with the desktop version, including the system-wide audio visualizer.

### ✅ Completed Milestones
- **Tauri 2 Migration**: Updated `src-tauri` for mobile compatibility.
- **Android Permissions**: Implemented runtime requests for `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS`.
- **Native Audio Bridge**: 
  - Implemented JNI-based `Visualizer` in Kotlin (`MainActivity.kt`).
  - Created a thread-safe Rust handler in `lib.rs` to pipe audio data to the React frontend.
- **Audio Sensitivity Normalization**: 
  - Applied a 0.25x scaling factor in the backend to match Android's high-gain output to desktop levels.
  - Added `visualizerSensitivity` control in the frontend for user tuning.
- **Mobile-First UI Optimization**:
  - Implemented an **Edge-to-Edge** layout for the `FullscreenVideoInfo` panel to maximize thumbnail and content size.
  - Consolidated all navigation and playback controls into an ultra-condensed bottom bar.
  - Optimized `PlaylistCard` and `Description` components for high-density tablet viewing (near-zero margins/gaps).
- **Live Development**: Established ADB reverse port forwarding (`1420`) for real-time mobile development.

### 🛠️ Key Files
- `src-tauri/gen/android/.../MainActivity.kt`: Native Android entry point and audio capture service.
- `src-tauri/src/lib.rs`: JNI bridge and data normalization logic.
- `src-tauri/gen/android/app/src/main/AndroidManifest.xml`: Permissions and configuration.
- `src/components/AudioVisualizer.jsx`: Unified cross-platform visualizer rendering.

### 🚀 Usage for Development
To develop on an Android tablet via USB:
1. Connect device and enable USB debugging.
2. Run: `adb reverse tcp:1420 tcp:1420`
3. Run: `npm run tauri android dev`
