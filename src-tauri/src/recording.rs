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
    let child = executor.start_webcam_recording(
        &output_path,
        camera_index,
        &resolution,
        fps,
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
    
    // Gracefully stop FFmpeg process
    let mut process_guard = RECORDING_PROCESS.lock().unwrap();
    if let Some(mut child) = process_guard.take() {
        // Step 1: Send 'q' to stdin for graceful quit
        if let Some(stdin) = child.stdin.as_mut() {
            let _ = stdin.write_all(b"q");
            let _ = stdin.flush();
        }
        
        // Step 2: Give FFmpeg time to finalize (500ms)
        std::thread::sleep(Duration::from_millis(500));
        
        // Step 3: If still running, kill it
        if let Ok(None) = child.try_wait() {
            let _ = child.kill();
        }
        
        // Step 4: Wait for completion
        let _ = child.wait();
    }
    
    // Update state
    {
        let mut state_guard = state.lock().unwrap();
        state_guard.is_recording = false;
        state_guard.start_time = None;
    }
    
    output_path.ok_or("No output path found".to_string())
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

