# MPV DLL Setup for Windows

## Required DLLs

The native mpv player requires two DLL files:
- `libmpv-wrapper.dll`
- `libmpv-2.dll`

## Where to Get the DLLs

1. **From tauri-plugin-libmpv releases**: Check the plugin's GitHub releases or documentation
2. **From mpv builds**: Download from https://mpv.io/installation/ (Windows builds)
3. **From the plugin's example**: Check if the plugin repository has example DLLs

## Installation Steps

1. Place both DLL files in `src-tauri/lib/` directory:
   ```
   src-tauri/
   └── lib/
       ├── libmpv-wrapper.dll
       └── libmpv-2.dll
   ```

2. Rebuild the application:
   ```bash
   npm run tauri dev
   ```

3. The build script (`build.rs`) will automatically copy the DLLs to `target/debug/` or `target/release/` during build.

## Verification

After building, check that the DLLs are in the target directory:
- Development: `src-tauri/target/debug/libmpv-wrapper.dll`
- Production: `src-tauri/target/release/libmpv-wrapper.dll`

## Troubleshooting

If you still get error 126 after placing the DLLs:

1. **Check DLL architecture**: Ensure DLLs match your system (x64 for 64-bit Windows)
2. **Check dependencies**: Use Dependency Walker to verify all DLL dependencies are available
3. **Verify DLL location**: The DLLs must be in the same directory as the executable at runtime
4. **Check build output**: Look for "Copied libmpv-wrapper.dll" messages in the build output

## Current Status

The build script will:
- Automatically find DLLs in multiple locations
- Copy them to the target directory during build
- Provide warnings if DLLs are not found

