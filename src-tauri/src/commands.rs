// Tauri IPC Commands
//
// Defines Tauri commands that expose FFmpeg operations to the frontend.
// These commands are invoked from the React app and handle media operations.

use crate::ffmpeg::{FFmpegExecutor, ClipInfo, CameraInfo};

/// Get media metadata from a video file
#[tauri::command]
pub async fn get_media_metadata(file_path: String) -> Result<serde_json::Value, String> {
    let executor = FFmpegExecutor::new()?;
    let metadata = executor.get_metadata(&file_path)?;
    
    // Convert to JSON with camelCase field names
    Ok(serde_json::json!({
        "duration": metadata.duration,
        "width": metadata.width,
        "height": metadata.height,
        "fps": metadata.fps,
        "codec": metadata.codec,
        "bitrate": metadata.bitrate,
        "fileSize": metadata.file_size,
    }))
}

/// Generate a thumbnail image from a video at a specific timestamp
/// Returns base64-encoded image data
#[tauri::command]
pub async fn generate_thumbnail(
    file_path: String,
    timestamp: f64
) -> Result<String, String> {
    use std::fs;
    use std::io::Read;
    
    // Create temporary output path
    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join(format!("thumbnail_{}.jpg", uuid::Uuid::new_v4()));
    let temp_path = temp_file.to_str().ok_or("Invalid temp path")?;
    
    let executor = FFmpegExecutor::new()?;
    executor.generate_thumbnail(&file_path, timestamp, temp_path)?;
    
    // Read the image file and convert to base64
    let mut file = fs::File::open(temp_path)
        .map_err(|e| format!("Failed to read thumbnail: {}", e))?;
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read file contents: {}", e))?;
    
    // Clean up temp file
    let _ = fs::remove_file(temp_path);
    
    // Encode to base64
    use base64::{Engine as _, engine::general_purpose};
    let base64 = general_purpose::STANDARD.encode(&buffer);
    
    Ok(base64)
}

/// Export video from timeline clips with specified settings
#[tauri::command]
pub async fn export_video(
    clips: Vec<ClipInfo>,
    output_path: String,
    resolution: String,
    fps: u32,
    composition_length: f64
) -> Result<(), String> {
    let executor = FFmpegExecutor::new()?;
    
    // Convert Vec to slice for method call
    executor.export_video(&clips, &output_path, &resolution, fps, composition_length)
}

/// List available cameras using FFmpeg
#[tauri::command]
pub async fn list_cameras() -> Result<Vec<CameraInfo>, String> {
    let executor = FFmpegExecutor::new()?;
    executor.list_cameras()
}

