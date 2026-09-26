# Installation Commands for Audio Visualizer

## Prerequisites

No manual installations required! The `wasapi` crate will be automatically downloaded when you build the project.

However, you need to ensure you're on **Windows** (WASAPI is Windows-only).

## Commands to Run

**None required!** The Rust crate will be installed automatically when Cargo builds.

If you want to verify your Rust toolchain is ready:

```powershell
# Verify Rust is installed
rustc --version

# Verify Cargo is installed  
cargo --version

# If needed, update Rust
rustup update
```

## What Happens Automatically

When you build the project, Cargo will:
1. Download `wasapi` crate (and its dependencies)
2. Compile it for Windows
3. Link it with your Tauri app

## Build Command (After Implementation)

After I add the code, you'll need to rebuild:

```powershell
# From project root
cd src-tauri
cargo build

# Or from root, Tauri will handle it:
npm run tauri dev
```

---

**That's it! No manual installation needed. The `wasapi` crate is pure Rust and will compile automatically.**
