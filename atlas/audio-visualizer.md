# Audio Visualizer Documentation

**Purpose**: This document details the implementation, architecture, and usage of the high-performance, cross-platform audio visualizer.

---

## 1. Overview

The Audio Visualizer creates a circular, audio-reactive visualization around the central Orb menu. It mimics the aesthetic of the Rainmeter "VisBubble" widget with a focus on extreme performance on mobile hardware.

### Key Features
*   **System-Wide Audio Capture**: Captures *all* audio playing on the device via WASAPI (Windows) or the Visualizer API (Android).
*   **Rust-Powered FFT**: Heavy frequency analysis is offloaded to the Rust backend using the `realfft` crate for SIMD-accelerated performance.
*   **Latest-Only Buffering**: A zero-latency buffering strategy ensures the visualizer always processes the absolute most recent audio samples, eliminating backlog "rubber-banding."
*   **Throttled Emission**: Data is emitted to the frontend at a stable 60Hz (Desktop) or 60Hz (Android) to prevent event queue flooding.
*   **GPU-Accelerated Rendering**: Uses a single radial gradient and batched draw calls on a dedicated compositor layer (`translateZ(0)`).

---

## 2. Architecture

The system uses a "push" architecture where the Rust backend performs the mathematical heavy lifting and pushes lightweight frequency bins to the frontend.

### 2.1 Backend (Rust)
*   **FFT Engine**: `src-tauri/src/audio_processor.rs`. Uses `realfft` to convert time-domain samples into frequency-domain bins.
*   **Processing Pipeline**:
    1.  **Capture**: `audio_capture.rs` (Desktop) or `MainActivity.kt` (Android JNI) sends raw samples to the processor.
    2.  **Windowing**: Applies a Hanning window to the latest 1024 samples to reduce spectral leakage.
    3.  **FFT**: Computes the real-to-complex transform.
    4.  **Logarithmic Mapping**: Maps the raw FFT output to 113 frequency bins using a logarithmic scale to match human hearing.
    5.  **Throttling**: Ensures events are emitted no faster than once every 16ms.
*   **Data Flow**: Emits `audio-bins` (a 113-byte array) to the frontend.

### 2.2 Frontend (React)
*   **Component**: `src/components/AudioVisualizer.jsx`
*   **Role**: Acts as a "dumb" renderer that translates frequency arrays into customizable graphic aesthetics.
*   **Optimizations**:
    1.  **Event Handling**: Listens for `audio-bins`.
    2.  **Smoothing**: Applies temporal smoothing (default 0.4 on Android) in-place using `Uint8Array` to avoid garbage collection.
    3.  **Rendering**: HTML5 Canvas rendering engine supporting multiple styling modes driven by `useConfigStore`.
    4.  **Batching**: Geometry rendering is batched into highly efficient unified paths (`beginPath()` / `stroke()` or minimal arc calls).

### 2.3 Android Implementation (Latency Mitigation via Aesthetics)
*   **API**: `android.media.audiofx.Visualizer` (Session 0).
*   **JNI Bridge**: `MainActivity.kt` triggers `onAudioData` in Rust via JNI.
*   **Latency Reality**: Android's hardware audio abstraction layer (HAL) introduces inherent buffer latency. 
*   **Perceptual Masking**: Instead of relying exclusively on rigid visual timing, the visualizer leverages fluid (**Bubble**) and persistent (**Light**) drawing modes to convert OS delays into organic physical inertia and ambient afterglows.
*   **Normalization**: A **0.2x scaling factor** is applied in `lib.rs` to prevent clipping on high-gain Android audio stacks.
*   **Hardware Acceleration**: The canvas is forced onto a separate GPU layer using `translateZ(0)` and `will-change: transform`.

---

## 3. Usage & Configuration

### 3.1 Customization Controls
*   **Rendering Mode**: Standardized on **Light 2** (Static Starburst & Pulsing Tips) as the primary audio visualizer mode.
*   **Color Picker**: Located in the More Options menu (`PlayerControllerPlaylistMenu.jsx`). Offers a preset palette of curated colors (White, Sky Blue, Rose Pink, Emerald Green, Purple, Amber), a custom color input, and a continuous rainbow sliding gradient for fine hue adjustments. Custom selections update the visualizer in real-time.
*   **Sensitivity**: Multiplier for responsiveness (`visualizerSensitivity` in `configStore`).
*   **Smoothing**: Controls temporal decay/jitter resistance.

### 3.2 Rendering Modes
1.  **Light 2 (Static Starburst & Pulsing Tips)** (*Active Default*): Renders a constant, unmoving geometric cage/spoke framework with highly reactive, localized circular nodes pulsing directly over each spoke tip.
2.  **Bar (Standard Live Spokes)**: Traditional spiky outward spokes extending linearly from the perimeter.
3.  **Light 1 (Floating Fireflies)**: Replaces straight spokes with hovering, atmospheric nodes.
4.  **Bubble (Liquid Ribbon)**: Horizontally connects the end-coordinates of all frequency bins into a single continuous path.

---

## 4. File Manifest

### Backend
*   `src-tauri/src/audio_processor.rs`: Core FFT and mapping logic.
*   `src-tauri/src/audio_capture.rs`: Desktop WASAPI capture.
*   `src-tauri/src/lib.rs`: JNI Bridge and global processor management.
*   `src-tauri/gen/android/.../MainActivity.kt`: Native Android capture.

### Frontend
*   `src/components/AudioVisualizer.jsx`: Canvas renderer and event listener.
*   `src/utils/audioProcessor.js`: Utility functions for smoothing.
.
