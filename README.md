# YouTube TV v2 (yttv2)

A modern desktop application for managing and playing YouTube playlists, built with Tauri (Rust + React).

## Features

- 🎵 **Playlist Management** - Import, organize, and manage YouTube playlists
- 🎬 **Dual Player System** - YouTube iframe player and native mpv player support
- 📁 **Folder Organization** - Color-coded folder system for organizing videos
- 📊 **Tab System** - Customizable tab presets for quick playlist access
- 📜 **Watch History** - Track your viewing history with smart deduplication
- ⭐ **Likes & Pins** - Mark favorite videos and pin important content
- 🎨 **Modern UI** - Grid-based interface with smooth animations
- 💾 **Local Storage** - SQLite database for persistent data storage
- 🎥 **Local Videos** - Support for playing local video files
- 🔮 **Orb Customization** - Advanced visual configuration and playlist assignment for Orb themes

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Zustand, GSAP
- **Backend**: Tauri 2, Rust, SQLite
- **Player**: YouTube IFrame API, mpv (via tauri-plugin-mpv)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/) (latest stable)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd yttv2
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run tauri dev
```

## Building

Build the application for production:

```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/`.

## Project Structure

```
yttv2/
├── src/              # React frontend application
├── src-tauri/        # Rust backend (Tauri)
├── atlas/            # Comprehensive documentation
└── public/           # Static assets
```

## Documentation

For detailed documentation, see the [`atlas/`](./atlas/README.md) directory which contains comprehensive guides on:

- Feature documentation (player controller, playlists, UI components)
- Technical documentation (database schema, API bridge, state management)
- Development guides and architecture details

## Development

- **Frontend Dev Server**: `npm run dev` (runs on http://localhost:1420)
- **Tauri Dev**: `npm run tauri dev`
- **Build**: `npm run tauri build`

## License

MIT License - see [LICENSE](./LICENSE) file for details.
