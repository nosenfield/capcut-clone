// Recording Module
//
// Manages screen and webcam recording state and provides Tauri commands.
// Uses FFmpeg's avfoundation device for macOS recording.

use std::sync::{Arc, Mutex};
use std::process::Child;
use std::time::{Duration, Instant};
use std::io::Write;
use crate::ffmpeg::FFmpegExecutor;

#[derive(Clone)]
pub struct RecordingState {
    pub is_recording: bool,
    pub start_time: Option<Instant>,
    pub output_path: Option<String>,
    pub recording_type: RecordingType,
}

#[derive(Clone, Debug)]
pub enum RecordingType {
    Screen,
    Webcam { camera_index: u32 },
}

impl Default for RecordingState {
    fn default() -> Self {
        Self {
            is_recording: false,
            start_time: None,
            output_path: None,
            recording_type: RecordingType::Screen,
        }
    }
}

// Global recording state
static RECORDING_STATE: Mutex<Option<Arc<Mutex<RecordingState>>>> = Mutex::new(None);
static RECORDING_PROCESS: Mutex<Option<Child>> = Mutex::new(None);

fn get_state() -> Arc<Mutex<RecordingState>> {
    let mut state_guard = RECORDING_STATE.lock().unwrap();
    if state_guard.is_none() {
        *state_guard = Some(Arc::new(Mutex::new(RecordingState::default())));
    }
    Arc::clone(state_guard.as_ref().unwrap())
}

/// Start screen recording
#[tauri::command]
pub async fn start_screen_recording(
    output_path: String,
    resolution: String,
    fps: u32,
    capture_cursor: bool,
    capture_clicks: bool,
    audio_device: Option<String>,
) -> Result<(), String> {
    let state = get_state();
    
    // Check if already recording
    {
        let state_guard = state.lock().unwrap();
        if state_guard.is_recording {
            return Err("Recording is already in progress".to_string());
        }
    }
    
    let executor = FFmpegExecutor::new()?;
    
    let audio = audio_device.as_deref();
    let child = executor.start_screen_recording(
        &output_path,
        &resolution,
        fps,
        capture_cursor,
        capture_clicks,
        audio,
    )?;
    
    // Store process handle
    {
        let mut process_guard = RECORDING_PROCESS.lock().unwrap();
        *process_guard = Some(child);
    }
    
    // Update state
    {
        let mut state_guard = state.lock().unwrap();
        state_guard.is_recording = true;
        state_guard.start_time = Some(Instant::now());
        state_guard.output_path = Some(output_path);
        state_guard.recording_type = RecordingType::Screen;
    }
    
    Ok(())
}

/// Start webcam recording
#[tauri::command]
pub async fn start_webcam_recording(
    output_path: String,
    camera_index: u32,
    resolution: String,
    fps: u32,
    audio_device: Option<String>,
) -> Result<(), String> {
    let state = get_state();
    
    // Check if already recording
    {
        let state_guard = state.lock().unwrap();
        if state_guard.is_recording {
            return Err("Recording is already in progress".to_string());
        }
    }
    
    let executor = FFmpegExecutor::new()?;
    
    let audio = audio_device.as_deref();
    let mut child = executor.start_webcam_recording(
        &output_path,
        camera_index,
        &resolution,
        fps,
        audio,
    )?;
    
    // Wait a moment to check if process starts successfully
    std::thread::sleep(Duration::from_millis(500));
    
    // Check if process immediately exited (indicates startup failure)
    match child.try_wait() {
        Ok(Some(status)) => {
            // Process exited immediately - capture stderr to see why
            use std::io::Read;
            let mut stderr_bytes = Vec::new();
            if let Some(mut stderr) = child.stderr.take() {
                let _ = stderr.read_to_end(&mut stderr_bytes);
            }
            let stderr_output = String::from_utf8_lossy(&stderr_bytes);
            let error_msg = if !stderr_output.is_empty() {
                format!("FFmpeg exited immediately: {}", stderr_output)
            } else {
                format!("FFmpeg exited immediately with status: {:?}", status)
            };
            eprintln!("{}", error_msg);
            return Err(error_msg);
        }
        Ok(None) => {
            // Process is running - good!
        }
        Err(e) => {
            eprintln!("Error checking process status: {}", e);
        }
    }
    
    // Store process handle
    {
        let mut process_guard = RECORDING_PROCESS.lock().unwrap();
        *process_guard = Some(child);
    }
    
    // Update state
    {
        let mut state_guard = state.lock().unwrap();
        state_guard.is_recording = true;
        state_guard.start_time = Some(Instant::now());
        state_guard.output_path = Some(output_path.clone());
        state_guard.recording_type = RecordingType::Webcam { camera_index };
    }
    
    Ok(())
}

/// Stop recording gracefully
#[tauri::command]
pub async fn stop_recording() -> Result<String, String> {
    let state = get_state();
    
    // Get output path before stopping
    let output_path = {
        let state_guard = state.lock().unwrap();
        if !state_guard.is_recording {
            return Err("No recording in progress".to_string());
        }
        state_guard.output_path.clone()
    };
    
    // Gracefully stop FFmpeg process and capture any errors
    let mut process_guard = RECORDING_PROCESS.lock().unwrap();
    let mut error_message = None;
    
    if let Some(mut child) = process_guard.take() {
        // Check if process is still running
        match child.try_wait() {
            Ok(Some(status)) => {
                // Process already exited - capture stderr for diagnostics
                if !status.success() {
                    use std::io::Read;
                    if let Some(mut stderr) = child.stderr.take() {
                        let mut stderr_output = String::new();
                        let _ = stderr.read_to_string(&mut stderr_output);
                        if !stderr_output.is_empty() {
                            error_message = Some(format!("FFmpeg process exited with error: {}", stderr_output));
                            eprintln!("FFmpeg stderr on exit:\n{}", stderr_output);
                        }
                    }
                }
            }
            Ok(None) => {
                // Process still running - gracefully stop it
                // Step 1: Send 'q' to stdin for graceful quit
                if let Some(mut stdin) = child.stdin.take() {
                    let _ = stdin.write_all(b"q");
                    let _ = stdin.flush();
                }
                
                // Step 2: Give FFmpeg time to finalize (1 second for webcam)
                std::thread::sleep(Duration::from_millis(1000));
                
                // Step 3: If still running, kill it
                if let Ok(None) = child.try_wait() {
                    let _ = child.kill();
                }
                
                // Step 4: Wait for completion and capture stderr
                use std::io::Read;
                if let Some(mut stderr) = child.stderr.take() {
                    let mut stderr_output = String::new();
                    let _ = stderr.read_to_string(&mut stderr_output);
                    if !stderr_output.is_empty() {
                        eprintln!("FFmpeg stderr:\n{}", stderr_output);
                        // Check for common errors
                        if stderr_output.contains("Permission denied") || stderr_output.contains("No permission") {
                            error_message = Some("Camera permission denied. Please grant camera access in System Settings.".to_string());
                        } else if stderr_output.contains("Device not found") || stderr_output.contains("No such device") {
                            error_message = Some("Camera not found or not accessible.".to_string());
                        }
                    }
                }
                
                let _ = child.wait();
            }
            Err(e) => {
                eprintln!("Error checking process status: {}", e);
            }
        }
    } else {
        error_message = Some("Recording process not found".to_string());
    }
    
    // Update state
    {
        let mut state_guard = state.lock().unwrap();
        state_guard.is_recording = false;
        state_guard.start_time = None;
    }
    
    let output = output_path.ok_or("No output path found".to_string())?;
    
    // Check if output file exists and has content
    if let Ok(metadata) = std::fs::metadata(&output) {
        if metadata.len() == 0 {
            let msg = error_message.unwrap_or_else(|| "Recording produced an empty file. Camera may not have been accessed.".to_string());
            return Err(msg);
        }
    } else {
        let msg = error_message.unwrap_or_else(|| format!("Recording file not found at: {}", output));
        return Err(msg);
    }
    
    // Return error message if we have one, but file exists and has content
    if let Some(error) = error_message {
        eprintln!("Warning: {}", error);
    }
    
    Ok(output)
}

/// Get current recording status
#[tauri::command]
pub async fn get_recording_status() -> Result<serde_json::Value, String> {
    let state = get_state();
    let state_guard = state.lock().unwrap();
    
    let elapsed = state_guard.start_time
        .map(|start| start.elapsed().as_secs_f64())
        .unwrap_or(0.0);
    
    let recording_type_json = match &state_guard.recording_type {
        RecordingType::Screen => serde_json::json!("screen"),
        RecordingType::Webcam { camera_index } => {
            serde_json::json!({"type": "webcam", "cameraIndex": camera_index})
        }
    };

    Ok(serde_json::json!({
        "isRecording": state_guard.is_recording,
        "elapsed": elapsed,
        "outputPath": state_guard.output_path,
        "recordingType": recording_type_json
    }))
}

