mod audio_processor;
#[cfg(not(mobile))]
mod audio_capture;
mod commands;
mod database;
mod models;
mod streaming_server;

use audio_processor::AudioProcessor;
use database::Database;
use std::sync::{Arc, Mutex, OnceLock};
use tauri::Manager;
use tauri::Emitter;

static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();
static AUDIO_PROCESSOR: OnceLock<Mutex<AudioProcessor>> = OnceLock::new();

pub fn get_audio_processor() -> &'static Mutex<AudioProcessor> {
    AUDIO_PROCESSOR.get_or_init(|| {
        Mutex::new(AudioProcessor::new(1024, 113, 48000.0, 85.0, 11000.0))
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(not(mobile))]
    let builder = builder.plugin(tauri_plugin_mpv::init());

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Store app handle for JNI/background usage
            APP_HANDLE.set(app.handle().clone()).ok();

            // Initialize database - use app data directory to avoid triggering rebuilds
            // In dev mode, store outside src-tauri/ to prevent file watcher from restarting app
            let db_path = if cfg!(debug_assertions) {
                // Development (Desktop): store in project root
                Some("../playlists.db".to_string())
            } else {
                // Production (Desktop and Mobile): use app data directory
                let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
                if !app_data_dir.exists() {
                    std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");
                }
                Some(app_data_dir.join("playlists.db").to_string_lossy().into_owned())
            };

            let db = Database::new(db_path.as_deref()).expect("Failed to initialize database");

            app.manage(Mutex::new(db));

            // Start streaming server for local video files
            let streaming_server = Arc::new(streaming_server::StreamingServer::new(1422));
            app.manage(Arc::clone(&streaming_server));

            // Spawn server in background using Tauri's async runtime
            let server_for_task = Arc::clone(&streaming_server);
            tauri::async_runtime::spawn(async move {
                if let Err(e) = server_for_task.start().await {
                    eprintln!("Failed to start streaming server: {}", e);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_playlist,
            commands::get_all_playlists,
            commands::get_all_playlist_metadata,
            commands::get_playlist,
            commands::update_playlist,
            commands::delete_playlist,
            commands::delete_playlist_by_name,
            commands::add_playlist_source,
            commands::get_playlist_sources,
            commands::update_playlist_source_limit,
            commands::update_playlist_source_name,
            commands::update_playlist_source_sync,
            commands::remove_playlist_source,
            commands::add_video_to_playlist,
            commands::get_playlist_items,
            commands::get_playlist_items_preview,
            commands::get_playlists_for_video_ids,
            commands::remove_video_from_playlist,
            commands::reorder_playlist_item,
            commands::assign_video_to_folder,
            commands::unassign_video_from_folder,
            commands::get_videos_in_folder,
            commands::get_all_folder_assignments,
            commands::get_video_folder_assignments,
            commands::get_all_folders_with_videos,
            commands::get_folders_for_playlist,
            commands::toggle_stuck_folder,
            commands::is_folder_stuck,
            commands::get_all_stuck_folders,
            commands::get_folder_metadata,
            commands::set_folder_metadata,
            commands::add_to_watch_history,
            commands::get_watch_history,
            commands::clear_watch_history,
            commands::get_watched_video_ids,
            commands::update_video_progress,
            commands::get_video_progress,
            commands::get_all_video_progress,
            commands::select_video_files,
            commands::read_video_file,
            commands::get_video_stream_url,
            commands::start_audio_capture,
            commands::stop_audio_capture,
            commands::test_audio_command,
            commands::get_drumstick_rating,
            commands::set_drumstick_rating,
            commands::select_video_folder,
            commands::get_videos_in_directory,
            commands::get_video_subtitles,
            commands::read_subtitle_vtt,
            commands::select_subtitle_file,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                #[cfg(mobile)]
                {
                    api.prevent_close();
                    let _ = window.emit("android-back-pressed", ());
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "android")]
#[allow(non_snake_case)]
pub mod android {
    use super::*;
    use jni::JNIEnv;
    use jni::objects::{JClass, JFloatArray};

    #[no_mangle]
    pub extern "C" fn Java_com_ggpc_tauri_1app_MainActivity_onLinkHarvested(
        mut env: JNIEnv,
        _class: JClass,
        url: jni::objects::JString,
    ) {
        if let Some(app) = APP_HANDLE.get() {
            if let Ok(url_str) = env.get_string(&url) {
                let _ = app.emit("link-harvested", url_str.to_string_lossy().into_owned());
            }
        }
    }

    #[no_mangle]
    pub extern "C" fn Java_com_ggpc_tauri_1app_MainActivity_onAudioData(
        env: JNIEnv,
        _class: JClass,
        samples: JFloatArray,
    ) {
        if let Some(app) = APP_HANDLE.get() {
            if let Ok(len) = env.get_array_length(&samples) {
                let mut samples_vec = vec![0.0f32; len as usize];
                if env.get_float_array_region(&samples, 0, &mut samples_vec).is_ok() {
                    // Normalize Android's output (0.2x to prevent clipping)
                    for s in samples_vec.iter_mut() {
                        *s *= 0.2;
                    }
                    
                    // Process through FFT engine instead of emitting raw data
                    let mut processor = get_audio_processor().lock().unwrap();
                    processor.process_samples(&samples_vec, app);
                }
            }
        }
    }
}
