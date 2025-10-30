// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod commands;
mod ffmpeg;
mod recording;

use commands::{export_video, generate_thumbnail, get_media_metadata, list_cameras};
use recording::{start_screen_recording, start_webcam_recording, stop_recording, get_recording_status};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_media_metadata,
            generate_thumbnail,
            export_video,
            list_cameras,
            start_screen_recording,
            start_webcam_recording,
            stop_recording,
            get_recording_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
