# Native Video Player Integration - Postmortem

**Status**: Abandoned / Failed
**Date**: 2026-01-07
**Plugin**: `tauri-plugin-mpv` (v0.5.x)
**Target**: Windows 10/11

## Objective
Replace the previous video player implementation with `tauri-plugin-mpv` to enable native, hardware-accelerated playback of local files (MKV, MP4) directly within the Tauri window.

## Summary of Attempt
The integration succeeded in compilation and basic runtime commands but failed at the process spawning/communication layer. The backend plugin panicked repeatedly with `PoisonError`, indicating a crash in the thread managing the MPV child process.

## Key Obstacles & Solutions (Applied)

### 1. Interface Mismatch
*   **Issue**: The npm package `tauri-plugin-mpv-api` exports did not match the actual Rust plugin commands. Calls like `getMpvProperty` were missing or invalid.
*   **Fix**: Manually implemented `invoke` calls in `NativeVideoPlayer.jsx`.
    *   `plugin:mpv|init`
    *   `plugin:mpv|command`

### 2. Permissions System
*   **Issue**: Tauri v2 capability system blocked commands (`mpv.initialize_mpv not allowed`).
*   **Fix**: Debugged `acl-manifests.json` and updated `src-tauri/capabilities/default.json` with correct permissions:
    *   `mpv:allow-init`
    *   `mpv:allow-command`
    *   `mpv:allow-destroy`

### 3. Argument Structure
*   **Issue**: The Rust plugin expected specific data structures that differed from the JS library defaults.
*   **Fixes**:
    *   Changed `mpvArgs` (array) to `mpvConfig` (object) for `init`.
    *   Wrapped commands in a tuple `[command_array, id_integer]` (e.g., `[['loadfile', path], 0]`) to satisfy the `MpvCommand` struct requirement.

### 4. Binary Discovery (The "Program Not Found" Loop)
*   **Issue**: The plugin launches `mpv.exe` as a sidecar process. It could not find the executable on the host system.
*   **Attempted Fixes**:
    *   Manual installation of MPV.
    *   Placing `mpv.exe` in `src-tauri/target/debug/`.
    *   Modifying `src-tauri/src/main.rs` to forcefully prepend the executable directory to the `PATH` environment variable at runtime.

## Final Blocking Issue
**Backend Panic (`PoisonError`)**
Even after fixing the binary path, the application crashes with:
```text
thread 'tokio-runtime-worker' panicked at ... src\process.rs:25:57:
called Result::unwrap() on an Err value: PoisonError { .. }
```
**Diagnosis**:
This error occurs in the Rust plugin's `process.rs` file. It indicates that the thread responsible for managing the MPV subprocess or its IPC (Inter-Process Communication) socket panicked while holding a lock. This "poisons" the lock, causing subsequent access attempts to fail.
*   **Likely Cause**: The plugin is failing to establish the JSON IPC socket connection with the spawned `mpv.exe` process (possibly due to Windows pipe naming conventions or timing issues), causing an unhandled panic in the worker thread.

## Current Code State
*   `src/components/NativeVideoPlayer.jsx`: Heavily modified with manual `invoke` calls and debug logging.
*   `src-tauri/src/main.rs`: Contains debug code modifying the `PATH` variable.
*   `src-tauri/target/debug/`: Contains a manually placed `mpv.exe`.

## Recommendations for Future
If this feature is revisited:
1.  **Avoid `tauri-plugin-mpv` v0.5**: It appears unstable on Windows or incompatible with the specific MPV versions available.
2.  **Evaluate `tauri-plugin-libmpv`**: If available for Tauri v2, the shared library approach (DLL) is generally more stable for window embedding than the separate process IPC approach.
3.  **Custom Sidecar**: Implementing a raw `Command::new("mpv")` wrapper in `main.rs` (without the plugin) might offer better control, though embedding the window would remain difficult.
