# Android Refactor (MAUI)

## Overview
This document serves as the primary onboarding guide for the migration from the original Rust/Tauri + React desktop application to a native .NET MAUI Android shell with a headless WebView video engine.

## 🚨 Vibe Coder / Agent Onboarding Notes
**CRITICAL:** We are effectively rebuilding the entire frontend and backend from scratch in C#. However, the user experience, layout logic, and aesthetic *must* tightly align with the original Rust/React implementation. 

Before building new pages, ViewModels, or features, **you MUST study the existing `atlas` directory documentation**. 
The `atlas` docs (e.g., `ui-layout.md`, `page-playlists.md`, `page-videos.md`, `state-management.md`) contain the "blueprints" for how this app is supposed to look and feel. Do not guess the layout—read the atlas docs to accelerate development and ensure feature parity.

## Current Architecture
- **State Management:** MVVM using `CommunityToolkit.Mvvm` (`ObservableObject`, `RelayCommand`). Centralized in `MainViewModel`.
- **Database:** Local SQLite (`sqlite-net-pcl`) via `DatabaseService.cs`, completely replacing the Rust backend.
- **Layout Shell:** `MainPage.xaml` relies on a dual-column split-screen Grid layout to separate the Top UI (App Banner & Controllers) from the Bottom UI (Content Pages / Video Player).
- **Video Engine:** A headless WebView (`YoutubeEngineView`) running a minimal HTML/JS YouTube IFrame API bridge.

---

## Current Top Challenges & Priorities

### 1. The YouTube Embed Error 153
The embedded headless player currently triggers playback restrictions (Error 150/153) on many videos. This occurs because the native WebView lacks proper web context headers. We need to implement interceptors to spoof the `Referer` or `Origin` headers, or adjust the IFrame API initialization parameters to ensure stable, restriction-free playback natively.

### 2. Official YouTube API Migration
The application currently uses `YoutubeExplode` for "unofficial" scraping of playlist metadata. For long-term project sustainability and to avoid potential crackdowns or IP bans, we must refactor the `YoutubeSyncService` to utilize the official Google API.
- **API Key Provided:** `AIzaSyBYPwv0a-rRbTrvMA9nF4Wa1ryC0b6l7xw`
- **Goal:** Use this key for all data fetching, playlist parsing, and video metadata retrieval.

### 3. Videos Page & Controller Navigation
We need to finalize the `VideosPage` to cleanly display the individual videos of a selected playlist. Additionally, we need to wire up explicit navigation buttons on the Top Controller Menus (flanking the Central Orb) so the user can freely toggle between the `PlaylistsPage` and `VideosPage` at will, mirroring the original React UI flow.
