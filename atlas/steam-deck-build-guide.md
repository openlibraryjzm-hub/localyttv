# Steam Deck (SteamOS/Linux) End-User Deployment Guide

If you want to keep your Steam Deck clean of developer tools (no Rust, Node.js, or compiler chains installed on the Deck), you can compile the Linux package on your Windows 11 laptop and transfer the final, compiled `.AppImage` to the Deck.

Since cross-compiling from Windows directly to Linux is difficult, you can build the Linux binary on your laptop using **WSL (Windows Subsystem for Linux)** or via **GitHub Actions (Cloud Build)**.

---

## 1. Preparing the Steam Deck (End-User System Requirements)

To run the app as an end-user, your Steam Deck only needs the runtime libraries for rendering the webview and playing local video files via `mpv`:

1. Switch your Steam Deck to **Desktop Mode** (Power > Switch to Desktop).
2. Set a sudo password in the terminal (**Konsole**) if you haven't already:
   ```bash
   passwd
   ```
3. Disable read-only mode to install system-wide runtime libraries:
   ```bash
   sudo steamos-readonly disable
   ```
4. Initialize the pacman keyring:
   ```bash
   sudo pacman-key --init
   sudo pacman-key --populate archlinux
   sudo pacman-key --populate holo
   ```
5. Install the runtime libraries (`mpv` provides `libmpv.so` which the app needs to play local videos):
   ```bash
   sudo pacman -Sy --needed webkit2gtk-4.1 mpv
   ```

---

## 2. Option A: Build Locally on Windows using WSL (Recommended)

You can run a lightweight Linux container (WSL) on your Windows 11 laptop to compile the app.

### Step 2.1: Open WSL
If you don't have WSL installed, open PowerShell as Administrator on Windows and run:
```powershell
wsl --install
```
Once installed (defaulting to Ubuntu), open your WSL terminal.

### Step 2.2: Install Build Tools in WSL
Inside your WSL (Ubuntu) terminal, install the dependencies needed for Tauri:
```bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev libmpv-dev
```

### Step 2.3: Install Rust & Node.js in WSL
1. **Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```
2. **Node.js**:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | sh
   # Restart terminal or source profile, then:
   nvm install --lts
   ```

### Step 2.4: Build the Linux AppImage
In your WSL terminal, navigate to your project directory (WSL automatically mounts your Windows drive under `/mnt/`):
```bash
cd /mnt/c/Users/jodyn/Desktop/yttv\ april\ port/
npm install
npm run tauri build
```
The finished output will be written back to your Windows drive:
`src-tauri/target/release/bundle/appimage/tauri-app_0.1.0_amd64.AppImage`

---

## 3. Option B: Build in the Cloud via GitHub Actions (Zero-Configuration)

If you keep your project on a private or public GitHub repository, you can configure GitHub to compile the Linux app for you.

1. Create a folder in your project root: `.github/workflows/`
2. Create a file called `build.yml` with the following workflow:

```yaml
name: Release
on:
  push:
    branches:
      - main

jobs:
  release:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install Linux dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev libmpv-dev

      - name: Install dependencies and build
        run: |
          npm install
          npm run build

      - name: Build Tauri App
        uses: tauri-apps/tauri-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

3. Commit and push. When you push to `main`, GitHub Actions will run, build the Linux `.AppImage`, and attach it to your workflow run artifacts or a draft release where you can download it directly from your browser.

---

## 4. Deploying to the Steam Deck

Once you have the `tauri-app_0.1.0_amd64.AppImage` file:

1. **Transfer the AppImage**: Copy it from your Windows laptop to the Steam Deck using a USB flash drive or network transfer (like Warpinator or KDE Connect). Place it in a folder like `/home/deck/Applications/`.
2. **Make it Executable**: In Dolphin (the file explorer), right-click the `.AppImage` file, go to **Properties** > **Permissions**, and check **Is Executable** (or run `chmod +x <filename>.AppImage` in the terminal).
3. **Add to Steam**: 
   * Open the Steam desktop client.
   * Click **Add a Game** (bottom-left) > **Add a Non-Steam Game...**
   * Browse to your AppImage and add it.
4. **Return to Gaming Mode**: Switch back to Gaming Mode, configure a controller template (such as Web Browser or Keyboard & Mouse controls), and play!
