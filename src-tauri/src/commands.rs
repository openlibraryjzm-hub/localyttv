#[cfg(not(mobile))]
use crate::audio_capture::AudioCapture;
use crate::database::Database;
use crate::models::*;
use std::sync::Mutex;
use tauri::{Manager, State};

// Playlist commands
#[tauri::command]
pub fn create_playlist(
    db: State<Mutex<Database>>,
    name: String,
    description: Option<String>,
) -> Result<i64, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.create_playlist(&name, description.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_playlists(db: State<Mutex<Database>>) -> Result<Vec<Playlist>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_playlists().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_playlist_metadata(
    db: State<Mutex<Database>>,
) -> Result<Vec<PlaylistMetadata>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_playlist_metadata().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_playlist(db: State<Mutex<Database>>, id: i64) -> Result<Option<Playlist>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_playlist(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_playlist(
    db: State<Mutex<Database>>,
    id: i64,
    name: Option<String>,
    description: Option<String>,
    custom_ascii: Option<String>,
    custom_thumbnail_url: Option<String>,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_playlist(
        id,
        name.as_deref(),
        description.as_deref(),
        custom_ascii.as_deref(),
        custom_thumbnail_url.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_playlist(db: State<Mutex<Database>>, id: i64) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_playlist(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_playlist_by_name(db: State<Mutex<Database>>, name: String) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_playlist_by_name(&name).map_err(|e| e.to_string())
}

// Playlist Source commands

#[tauri::command]
pub fn add_playlist_source(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    source_type: String,
    source_value: String,
    video_limit: i32,
) -> Result<i64, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.add_playlist_source(playlist_id, &source_type, &source_value, video_limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_playlist_sources(
    db: State<Mutex<Database>>,
    playlist_id: i64,
) -> Result<Vec<PlaylistSource>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_playlist_sources(playlist_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_playlist_source_limit(
    db: State<Mutex<Database>>,
    id: i64,
    video_limit: i32,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_playlist_source_limit(id, video_limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_playlist_source_name(
    db: State<Mutex<Database>>,
    id: i64,
    custom_name: Option<String>,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_playlist_source_name(id, custom_name.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_playlist_source_sync(db: State<Mutex<Database>>, id: i64) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_playlist_source_sync(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_playlist_source(db: State<Mutex<Database>>, id: i64) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.remove_playlist_source(id).map_err(|e| e.to_string())
}

// Playlist item commands
#[tauri::command]
pub fn add_video_to_playlist(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    video_url: String,
    video_id: String,
    title: Option<String>,
    thumbnail_url: Option<String>,
    is_local: Option<bool>,
    author: Option<String>,
    view_count: Option<String>,
    published_at: Option<String>,
    profile_image_url: Option<String>,
    duration_seconds: Option<i64>,
    description: Option<String>,
    tags: Option<String>,
    like_count: Option<String>,
    comment_count: Option<String>,
) -> Result<i64, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.add_video_to_playlist(
        playlist_id,
        &video_url,
        &video_id,
        title.as_deref(),
        thumbnail_url.as_deref(),
        is_local.unwrap_or(false),
        author.as_deref(),
        view_count.as_deref(),
        published_at.as_deref(),
        profile_image_url.as_deref(),
        duration_seconds,
        description.as_deref(),
        tags.as_deref(),
        like_count.as_deref(),
        comment_count.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_playlist_items(
    db: State<Mutex<Database>>,
    playlist_id: i64,
) -> Result<Vec<PlaylistItem>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_playlist_items(playlist_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_playlist_items_preview(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    limit: i64,
) -> Result<Vec<PlaylistItem>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_playlist_items_preview(playlist_id, limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_playlists_for_video_ids(
    db: State<Mutex<Database>>,
    video_ids: Vec<String>,
) -> Result<std::collections::HashMap<String, Vec<String>>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_playlists_for_video_ids(&video_ids)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_video_from_playlist(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    item_id: i64,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.remove_video_from_playlist(playlist_id, item_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_playlist_item(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    item_id: i64,
    new_position: i32,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.reorder_playlist_item(playlist_id, item_id, new_position)
        .map_err(|e| e.to_string())
}

// Folder assignment commands
#[tauri::command]
pub fn assign_video_to_folder(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    item_id: i64,
    folder_color: String,
) -> Result<i64, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.assign_video_to_folder(playlist_id, item_id, &folder_color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unassign_video_from_folder(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    item_id: i64,
    folder_color: String,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.unassign_video_from_folder(playlist_id, item_id, &folder_color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_videos_in_folder(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    folder_color: String,
) -> Result<Vec<PlaylistItem>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_videos_in_folder(playlist_id, &folder_color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_folder_assignments(
    db: State<Mutex<Database>>,
    playlist_id: i64,
) -> Result<std::collections::HashMap<String, Vec<String>>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_folder_assignments_for_playlist(playlist_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_video_folder_assignments(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    item_id: i64,
) -> Result<Vec<String>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_video_folder_assignments(playlist_id, item_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_folders_with_videos(
    db: State<Mutex<Database>>,
) -> Result<Vec<FolderWithVideos>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_folders_with_videos().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_folders_for_playlist(
    db: State<Mutex<Database>>,
    playlist_id: i64,
) -> Result<Vec<FolderWithVideos>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_folders_for_playlist(playlist_id)
        .map_err(|e| e.to_string())
}

// Stuck folders commands
#[tauri::command]
pub fn toggle_stuck_folder(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    folder_color: String,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.toggle_stuck_folder(playlist_id, &folder_color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_folder_stuck(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    folder_color: String,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.is_folder_stuck(playlist_id, &folder_color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_stuck_folders(db: State<Mutex<Database>>) -> Result<Vec<(i64, String)>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_stuck_folders().map_err(|e| e.to_string())
}

// Folder Metadata commands
#[tauri::command]
pub fn get_folder_metadata(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    folder_color: String,
) -> Result<Option<(String, String, Option<String>)>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_folder_metadata(playlist_id, &folder_color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_folder_metadata(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    folder_color: String,
    name: Option<String>,
    description: Option<String>,
    custom_ascii: Option<String>,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.set_folder_metadata(
        playlist_id,
        &folder_color,
        name.as_deref(),
        description.as_deref(),
        custom_ascii.as_deref(),
    )
    .map_err(|e| e.to_string())
}

// Watch history commands
#[tauri::command]
pub fn add_to_watch_history(
    db: State<Mutex<Database>>,
    video_url: String,
    video_id: String,
    title: Option<String>,
    thumbnail_url: Option<String>,
) -> Result<i64, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.add_to_watch_history(
        &video_url,
        &video_id,
        title.as_deref(),
        thumbnail_url.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_watch_history(
    db: State<Mutex<Database>>,
    limit: i32,
) -> Result<Vec<crate::models::WatchHistory>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_watch_history(limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clear_watch_history(db: State<Mutex<Database>>) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.clear_watch_history().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_watched_video_ids(db: State<Mutex<Database>>) -> Result<Vec<String>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_watched_video_ids().map_err(|e| e.to_string())
}

// Video progress commands
#[tauri::command]
pub fn update_video_progress(
    db: State<Mutex<Database>>,
    video_id: String,
    video_url: String,
    duration: Option<f64>,
    current_time: f64,
) -> Result<i64, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_video_progress(&video_id, &video_url, duration, current_time)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_video_progress(
    db: State<Mutex<Database>>,
    video_id: String,
) -> Result<Option<crate::models::VideoProgress>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_video_progress(&video_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_video_progress(
    db: State<Mutex<Database>>,
) -> Result<Vec<crate::models::VideoProgress>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_video_progress().map_err(|e| e.to_string())
}

// Local video file commands
#[tauri::command]
pub async fn select_video_files(app: tauri::AppHandle) -> Result<Option<Vec<String>>, String> {
    use tauri::async_runtime;
    use tauri_plugin_dialog::DialogExt;

    let (tx, mut rx) = async_runtime::channel(1);

    app.dialog()
        .file()
        .add_filter(
            "Media Files",
            &[
                "mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v", "mpg", "mpeg",
                "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg",
            ],
        )
        .add_filter(
            "Video Files",
            &[
                "mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v", "mpg", "mpeg",
            ],
        )
        .add_filter(
            "Image Files",
            &[
                "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg",
            ],
        )
        .pick_files(move |file_paths| {
            let _ = tx.try_send(file_paths);
        });

    let file_paths = rx
        .recv()
        .await
        .ok_or_else(|| "Failed to receive file paths".to_string())?;

    match file_paths {
        Some(paths) => {
            let path_strings: Vec<String> = paths.into_iter().map(|p| p.to_string()).collect();
            Ok(Some(path_strings))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn read_video_file(file_path: String) -> Result<Vec<u8>, String> {
    use std::fs;

    // Read the file as binary data
    fs::read(&file_path).map_err(|e| format!("Failed to read video file: {}", e))
}

#[tauri::command]
pub fn get_video_stream_url(file_path: String, app: tauri::AppHandle) -> Result<String, String> {
    use crate::streaming_server::StreamingServer;
    use std::sync::Arc;

    // All videos use streaming server for consistent range request support
    let server = app
        .try_state::<Arc<StreamingServer>>()
        .ok_or("Streaming server not initialized")?;

    // Get streaming URL for the file
    let stream_url = server.get_stream_url(&file_path);
    Ok(stream_url)
}

// Audio capture commands
#[cfg(not(mobile))]
static AUDIO_CAPTURE: Mutex<Option<AudioCapture>> = Mutex::new(None);

#[cfg(not(mobile))]
#[tauri::command]
pub fn test_audio_command() -> String {
    eprintln!("[TEST] test_audio_command called from frontend!");
    println!("[TEST] test_audio_command called from frontend (stdout)!");
    "Test command works!".to_string()
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn start_audio_capture(app: tauri::AppHandle) -> Result<(), String> {
    eprintln!("[Commands] start_audio_capture called!");
    let mut capture = AUDIO_CAPTURE
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if capture.is_none() {
        eprintln!("[Commands] Creating new AudioCapture instance");
        *capture = Some(AudioCapture::new());
    } else {
        eprintln!("[Commands] AudioCapture instance already exists");
    }

    eprintln!("[Commands] Starting audio capture...");
    let result = capture
        .as_mut()
        .ok_or("Failed to create audio capture")?
        .start(app)
        .map_err(|e| format!("Failed to start audio capture: {}", e));

    match &result {
        Ok(_) => eprintln!("[Commands] start_audio_capture succeeded"),
        Err(e) => eprintln!("[Commands] start_audio_capture failed: {}", e),
    }

    result
}

#[cfg(not(mobile))]
#[tauri::command]
pub fn stop_audio_capture() -> Result<(), String> {
    eprintln!("[Commands] stop_audio_capture called!");
    let mut capture = AUDIO_CAPTURE
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if let Some(ref mut cap) = capture.as_mut() {
        eprintln!("[Commands] Stopping audio capture...");
        let result = cap
            .stop()
            .map_err(|e| format!("Failed to stop audio capture: {}", e));
        match &result {
            Ok(_) => eprintln!("[Commands] stop_audio_capture succeeded"),
            Err(e) => eprintln!("[Commands] stop_audio_capture failed: {}", e),
        }
        result
    } else {
        eprintln!("[Commands] stop_audio_capture: Audio capture not running");
        Err("Audio capture not running".to_string())
    }
}

#[cfg(mobile)]
#[tauri::command]
pub fn test_audio_command() -> String {
    "Android Audio Visualizer Active".to_string()
}

#[cfg(mobile)]
#[tauri::command]
pub fn start_audio_capture() -> Result<(), String> {
    // The Kotlin side handles capture automatically upon permission grant.
    // We return Ok here to satisfy the frontend's command call.
    Ok(())
}

#[cfg(mobile)]
#[tauri::command]
pub fn stop_audio_capture() -> Result<(), String> {
    // On mobile, the capture is tied to the app lifecycle for now.
    Ok(())
}

// Drumstick rating commands
#[tauri::command]
pub fn get_drumstick_rating(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    item_id: i64,
) -> Result<i32, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_drumstick_rating(playlist_id, item_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_drumstick_rating(
    db: State<Mutex<Database>>,
    playlist_id: i64,
    item_id: i64,
    rating: i32,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.set_drumstick_rating(playlist_id, item_id, rating)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn select_video_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri::async_runtime;
    use tauri_plugin_dialog::DialogExt;

    let (tx, mut rx) = async_runtime::channel(1);

    app.dialog()
        .file()
        .pick_folder(move |folder_path| {
            let _ = tx.try_send(folder_path);
        });

    let folder_path = rx
        .recv()
        .await
        .ok_or_else(|| "Failed to receive folder path".to_string())?;

    match folder_path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn get_videos_in_directory(dir_path: String) -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::Path;

    let path = Path::new(&dir_path);
    if !path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut video_files = Vec::new();
    let video_extensions = [
        "mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v", "mpg", "mpeg",
        "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg",
    ];

    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    for entry in entries {
        if let Ok(entry) = entry {
            let file_path = entry.path();
            if file_path.is_file() {
                if let Some(ext) = file_path.extension().and_then(|e| e.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if video_extensions.contains(&ext_lower.as_str()) {
                        if let Some(path_str) = file_path.to_str() {
                            video_files.push(path_str.to_string());
                        }
                    }
                }
            }
        }
    }

    // Sort to keep standard order
    video_files.sort();

    Ok(video_files)
}

fn sanitize_file_path(path_str: &str) -> String {
    let mut clean = path_str.trim().to_string();
    if clean.starts_with("file://") {
        clean = clean.trim_start_matches("file://").to_string();
        if clean.starts_with('/') && clean.chars().nth(2) == Some(':') {
            clean = clean[1..].to_string();
        }
    }
    clean = clean
        .replace("%20", " ")
        .replace("%23", "#")
        .replace("%24", "$")
        .replace("%25", "%")
        .replace("%26", "&")
        .replace("%2B", "+");
    clean
}

fn probe_embedded_subtitles(clean_path: &str, tracks: &mut Vec<SubtitleTrackInfo>) {
    use std::process::Command;

    let output = match Command::new("ffprobe")
        .args([
            "-v", "error",
            "-select_streams", "s",
            "-show_entries", "stream=index,codec_name:stream_tags",
            "-of", "json",
            clean_path,
        ])
        .output() {
            Ok(o) => o,
            Err(_) => return,
        };

    if !output.status.success() {
        return;
    }

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = match serde_json::from_str(&stdout_str) {
        Ok(v) => v,
        Err(_) => return,
    };

    if let Some(streams) = json.get("streams").and_then(|s| s.as_array()) {
        for (i, stream) in streams.iter().enumerate() {
            let codec = stream.get("codec_name").and_then(|v| v.as_str()).unwrap_or("sub");
            let tags = stream.get("tags");
            let lang = tags.and_then(|t| t.get("language")).and_then(|v| v.as_str()).unwrap_or("");
            let title = tags.and_then(|t| t.get("title")).and_then(|v| v.as_str()).unwrap_or("");

            let mut label = String::new();
            if !title.is_empty() {
                label.push_str(title);
            } else if !lang.is_empty() {
                label.push_str(&format!("Track #{} ({})", i + 1, lang.to_uppercase()));
            } else {
                label.push_str(&format!("Track #{} ({})", i + 1, codec.to_uppercase()));
            }
            if !lang.is_empty() && !title.is_empty() {
                label.push_str(&format!(" [{}]", lang.to_uppercase()));
            }
            label.push_str(&format!(" (Embedded {})", codec.to_uppercase()));

            tracks.push(SubtitleTrackInfo {
                id: format!("embedded-{}", i),
                label,
                track_type: "embedded".to_string(),
                path: format!("embedded:{}:{}", i, clean_path),
                is_vtt: false,
            });
        }
    }
}

#[tauri::command]
pub fn get_video_subtitles(file_path: String) -> Result<Vec<SubtitleTrackInfo>, String> {
    use std::fs;
    use std::path::Path;

    let clean_path = sanitize_file_path(&file_path);
    let video_path = Path::new(&clean_path);
    let parent = match video_path.parent() {
        Some(p) => p,
        None => return Ok(Vec::new()),
    };

    let stem = match video_path.file_stem().and_then(|s| s.to_str()) {
        Some(s) => s.to_lowercase(),
        None => return Ok(Vec::new()),
    };

    let sub_exts = ["srt", "vtt", "ass", "ssa", "sub"];
    let mut tracks = Vec::new();

    if let Ok(entries) = fs::read_dir(parent) {
        let mut idx = 1;
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if sub_exts.contains(&ext_lower.as_str()) {
                        let filename = p.file_name().and_then(|n| n.to_str()).unwrap_or("Subtitle");
                        let fn_lower = filename.to_lowercase();
                        let sub_stem = fn_lower.replace(&format!(".{}", ext_lower), "");
                        if fn_lower.starts_with(&stem) || fn_lower.contains(&stem) || stem.contains(&sub_stem) {
                            tracks.push(SubtitleTrackInfo {
                                id: format!("sidecar-{}", idx),
                                label: filename.to_string(),
                                track_type: "sidecar".to_string(),
                                path: p.to_string_lossy().to_string(),
                                is_vtt: ext_lower == "vtt",
                            });
                            idx += 1;
                        }
                    }
                }
            }
        }
    }

    // Probe embedded streams inside MKV / MP4 containers
    probe_embedded_subtitles(&clean_path, &mut tracks);

    Ok(tracks)
}

#[tauri::command]
pub fn read_subtitle_vtt(sub_path: String) -> Result<String, String> {
    use std::fs;
    use std::path::Path;
    use std::process::Command;

    // Check if it's an embedded track token: "embedded:SUB_INDEX:FILE_PATH"
    if sub_path.starts_with("embedded:") {
        let parts: Vec<&str> = sub_path.splitn(3, ':').collect();
        if parts.len() == 3 {
            let sub_idx = parts[1];
            let clean_file_path = sanitize_file_path(parts[2]);

            let output = Command::new("ffmpeg")
                .args([
                    "-y",
                    "-fix_sub_duration",
                    "-i", &clean_file_path,
                    "-map", &format!("0:s:{}", sub_idx),
                    "-f", "webvtt",
                    "-"
                ])
                .output()
                .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

            if output.status.success() {
                let vtt = String::from_utf8_lossy(&output.stdout).to_string();
                return Ok(vtt);
            } else {
                let err_str = String::from_utf8_lossy(&output.stderr).to_string();
                return Err(format!("ffmpeg extraction failed: {}", err_str));
            }
        }
    }

    let clean_path = sanitize_file_path(&sub_path);
    let mut content = fs::read_to_string(&clean_path).map_err(|e| format!("Failed to read subtitle file '{}': {}", clean_path, e))?;
    if content.starts_with('\u{feff}') {
        content = content.trim_start_matches('\u{feff}').to_string();
    }
    let ext = Path::new(&clean_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if ext == "vtt" || content.trim_start().starts_with("WEBVTT") {
        Ok(content)
    } else {
        let mut vtt = String::from("WEBVTT\n\n");
        let formatted = content.trim_start_matches('\u{feff}').replace(',', ".");
        vtt.push_str(&formatted);
        Ok(vtt)
    }
}

#[tauri::command]
pub async fn select_subtitle_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri::async_runtime;
    use tauri_plugin_dialog::DialogExt;

    let (tx, mut rx) = async_runtime::channel(1);

    app.dialog()
        .file()
        .add_filter("Subtitle Files", &["srt", "vtt", "ass", "ssa"])
        .pick_file(move |file_path| {
            let _ = tx.try_send(file_path);
        });

    let file_path = rx
        .recv()
        .await
        .ok_or_else(|| "Failed to receive file path".to_string())?;

    match file_path {
        Some(p) => Ok(Some(p.to_string())),
        None => Ok(None),
    }
}

// Key-Value Settings commands
#[tauri::command]
pub fn get_setting(db: State<Mutex<Database>>, key: String) -> Result<String, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_setting(&key)
        .map_err(|e| e.to_string())
        .map(|v| v.unwrap_or_default())
}

#[tauri::command]
pub fn set_setting(
    db: State<Mutex<Database>>,
    key: String,
    value: String,
) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.set_setting(&key, &value).map_err(|e| e.to_string())
}


