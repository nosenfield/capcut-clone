// Tauri IPC Commands
//
// Defines Tauri commands that expose FFmpeg operations to the frontend.
// These commands are invoked from the React app and handle media operations.

use tauri::Emitter;
use crate::ffmpeg::{FFmpegExecutor, ClipInfo, CameraInfo, AudioFormat};
use crate::transcription::{
    OpenAIClient, Transcript, TranscriptionConfig, whisper_to_transcript,
    export_as_txt, export_as_srt, export_as_vtt, export_as_json,
};

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

/// Transcribe a video clip using OpenAI Whisper
#[tauri::command]
pub async fn transcribe_clip(
    clip_id: String,
    file_path: String,
    trim_start: f64,
    duration: f64,
    api_key: String,
    config: TranscriptionConfig,
    window: tauri::Window,
) -> Result<Transcript, String> {

    // Emit progress: Audio extraction
    window.emit("transcription-progress", serde_json::json!({
        "clipId": clip_id,
        "stage": "extracting",
        "percent": 0.0,
        "message": "Extracting audio from video..."
    })).map_err(|e| format!("Failed to emit event: {}", e))?;

    // Extract audio
    let executor = FFmpegExecutor::new()?;
    let audio_path = executor
        .extract_audio(&file_path, trim_start, duration, AudioFormat::Mp3)?;

    // Emit progress: Transcribing
    window.emit("transcription-progress", serde_json::json!({
        "clipId": clip_id,
        "stage": "transcribing",
        "percent": 30.0,
        "message": "Sending to OpenAI for transcription..."
    })).map_err(|e| format!("Failed to emit event: {}", e))?;

    // Transcribe
    let client = OpenAIClient::new(api_key);
    let whisper_response = client.transcribe(&audio_path, &config).await?;

    // Clean up temporary audio file
    let _ = tokio::fs::remove_file(&audio_path).await;

    // Emit progress: Processing
    window.emit("transcription-progress", serde_json::json!({
        "clipId": clip_id,
        "stage": "processing",
        "percent": 90.0,
        "message": "Processing transcription..."
    })).map_err(|e| format!("Failed to emit event: {}", e))?;

    // Convert to our format
    let transcript = whisper_to_transcript(whisper_response, clip_id);

    // Emit completion
    window.emit("transcription-progress", serde_json::json!({
        "clipId": transcript.clip_id.clone(),
        "stage": "complete",
        "percent": 100.0,
        "message": "Transcription complete!"
    })).map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(transcript)
}

/// Export transcript to various formats
#[tauri::command]
pub async fn export_transcript(
    transcript: Transcript,
    output_path: String,
    format: String,
) -> Result<(), String> {
    match format.as_str() {
        "txt" => export_as_txt(&transcript, &output_path).await,
        "srt" => export_as_srt(&transcript, &output_path).await,
        "vtt" => export_as_vtt(&transcript, &output_path).await,
        "json" => export_as_json(&transcript, &output_path).await,
        _ => Err(format!("Unsupported format: {}", format)),
    }
}

