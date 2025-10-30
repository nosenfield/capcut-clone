# AI Transcription Implementation Plan (Adjusted)
## OpenAI Integration for Video Timeline Transcription

---

## Executive Summary

This document outlines the **adjusted** implementation plan for integrating OpenAI's Whisper API to provide AI-powered transcription capabilities for video clips in the CapCut Clone application. This version has been corrected to align with existing codebase patterns, dependencies, and architecture conventions.

**Key Adjustments from Original Plan:**
- Aligned with existing FFmpeg executor pattern (methods on existing struct)
- Fixed missing dependencies (tokio, reqwest, chrono)
- Corrected command signatures to match existing Tauri patterns
- Fixed data model naming conventions (serde rename)
- Updated Zustand store to use Record instead of Map
- Aligned error handling with existing error utilities
- Matched module structure to existing codebase

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Feature Requirements](#feature-requirements)
3. [Implementation Phases](#implementation-phases)
4. [Technical Specifications](#technical-specifications)
5. [UI/UX Design](#uiux-design)
6. [API Integration](#api-integration)
7. [Data Models](#data-models)
8. [Security Considerations](#security-considerations)
9. [Testing Strategy](#testing-strategy)
10. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Transcription   │  │ Transcript   │  │ Timeline       │ │
│  │ Panel UI        │  │ Display      │  │ Integration    │ │
│  └────────┬────────┘  └──────┬───────┘  └────────┬───────┘ │
│           │                   │                   │          │
│           └───────────────────┴───────────────────┘          │
│                              │                               │
│                    ┌─────────▼──────────┐                   │
│                    │ Transcription Store │                   │
│                    └─────────┬──────────┘                   │
└──────────────────────────────┼──────────────────────────────┘
                               │ Tauri IPC
┌──────────────────────────────▼──────────────────────────────┐
│                     Backend (Rust)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Transcription│  │ Audio        │  │ OpenAI API       │  │
│  │ Command      │  │ Extraction   │  │ Client           │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                    │            │
│         └──────────────────┴────────────────────┘            │
│                           │                                  │
│                  ┌────────▼─────────┐                       │
│                  │ FFmpeg Executor  │                       │
│                  │ (Extended)       │                       │
│.classList.add──────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

**Key Architecture Decision**: Audio extraction is added as methods to the existing `FFmpegExecutor` struct, maintaining consistency with current codebase patterns.

---

## Feature Requirements

### Functional Requirements

1. **Audio Extraction**
   - Extract audio from video clips using FFmpeg
   - Support multiple audio formats (MP3, WAV, M4A)
   - Handle clips with trimming (respect trim start/end)

2. **Transcription Processing**
   - Send audio to OpenAI Whisper API
   - Support multiple languages (auto-detect or user-specified)
   - Handle long audio files (chunking if needed)
   - Provide word-level timestamps

3. **UI Components**
   - Transcription panel/dialog
   - Progress indicator during processing
   - Transcript display with timestamps
   - Search within transcripts
   - Export transcripts (TXT, SRT, VTT formats)

4. **Timeline Integration**
   - Display transcript markers on timeline
   - Click transcript to seek to timestamp
   - Highlight active transcript segment during playback
   - Associate transcripts with clips

### Non-Functional Requirements

1. **Performance**
   - Async processing (non-blocking UI)
   - Progress tracking for long files
   - Cache transcripts to avoid re-processing

2. **Security**
   - Secure API key storage (local storage via Zustand persist)
   - Input validation
   - Rate limiting awareness

3. **Reliability**
   - Error handling and retry logic
   - Handle network failures gracefully
   - Validate API responses

4. **Usability**
   - Clear feedback during processing
   - Intuitive UI for transcript viewing
   - Easy export options

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)

**Deliverables:**
- Audio extraction from video files
- OpenAI API client setup
- Basic transcription command

**Tasks:**
1. ✅ Add required Rust dependencies (tokio, reqwest, chrono)
2. ✅ Extend FFmpegExecutor with audio extraction methods
3. ✅ Create transcription module (transcription.rs)
4. ✅ Implement API key management structure
5. ✅ Add Tauri command for transcription

**Critical Dependencies to Add:**

```toml
# src-tauri/Cargo.toml additions
[dependencies]
# Existing dependencies...
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json", "multipart", "rustls-tls"] }
chrono = { version = "0.4", features = ["serde"] }
```

### Phase 2: API Integration (Week 2)

**Deliverables:**
- Working OpenAI Whisper integration
- Error handling and retry logic
- Progress tracking

**Tasks:**
1. Implement OpenAI API client
2. Add file upload to OpenAI
3. Parse transcription response
4. Handle chunking for long files
5. Add progress callbacks via Tauri events

### Phase 3: Frontend Store & State (Week 3)

**Deliverables:**
- Transcription store with Zustand
- Data models for transcripts
- Integration with media store

**Tasks:**
1. Create transcription store
2. Define TypeScript types
3. Add transcript caching logic
4. Link transcripts to clips
5. Implement persistence (Zustand persist)

### Phase 4: UI Components (Week 4)

**Deliverables:**
- Transcription panel UI
- Transcript viewer component
- Timeline integration practices

**Tasks:**
1. Design and implement transcription panel
2. Create transcript display component
3. Add timeline markers (future enhancement)
4. Implement seek-to-timestamp
5. Add search functionality

### Phase 5: Export & Polish (Week 5)

**Deliverables:**
- Export functionality (TXT, SRT, VTT)
- Error handling UI
- Documentation

**Tasks:**
1. Implement transcript export
2. Add format conversion
3. Polish UI/UX
4. Write user documentation
5. Add error messaging using existing error utilities

---

## Technical Specifications

### Backend Implementation (Rust)

#### 1. Dependencies (Cargo.toml additions)

```toml
# Add to existing dependencies in src-tauri/Cargo.toml
[dependencies]
# ... existing dependencies ...
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json", "multipart", "rustls-tls"] }
chrono = { version = "0.4", features = ["serde"] }
```

**Note**: `rustls-tls` is used instead of default OpenSSL for better cross-platform compatibility and smaller binary size.

#### 2. Module Structure (Aligned with Existing Pattern)

**CORRECTED STRUCTURE** - Following existing flat module pattern:

```
src-tauri/src/
├── transcription.rs          # New transcription module
├── commands.rs               # Add transcription commands here
├── ffmpeg.rs                 # Extend with audio extraction methods
├── lib.rs                    # Register new commands
└── ... existing files ...
```

**Note**: We use a flat module structure (transcription.rs) instead of a subdirectory to match existing codebase patterns (commands.rs, ffmpeg.rs, recording.rs).

#### 3. Data Structures

```rust
// src-tauri/src/transcription.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptSegment {
    pub id: String,
    pub text: String,
    pub start: f64,
    pub end: f64,
    pub confidence: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptWord {
    pub word: String,
    pub start: f64,
    pub end: f64,
    pub confidence: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transcript {
    pub id: String,
    #[serde(rename = "clipId")]
    pub clip_id: String,
    pub language: String,
    pub segments: Vec<TranscriptSegment>,
    pub words: Vec<TranscriptWord>,
    #[serde(rename = "fullText")]
    pub full_text: String,
    pub duration: f64,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionProgress {
    #[serde(rename = "clipId")]
    pub clip_id: String,
    pub stage: String,
    pub percent: f64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionConfig {
    pub language: Option<String>,
    pub model: String, // "whisper-1"
    #[serde(rename = "responseFormat")]
    pub response_format: String, // "verbose_json"
    pub temperature: f64,
}

// Audio format enum for FFmpeg extraction
#[derive(Debug, Clone, Copy)]
pub enum AudioFormat {
    Mp3,
    Wav,
    M4a,
}

impl AudioFormat {
    pub fn extension(&self) -> &str {
        match self {
            AudioFormat::Mp3 => "mp3",
            AudioFormat::Wav => "wav",
            AudioFormat::M4a => "m4a",
        }
    }
}
```

**Key Changes**: Added `#[serde(rename = "...")]` attributes to match existing codebase convention (see ClipInfo pattern).

#### 4. Audio Extraction (Extended FFmpegExecutor)

**CORRECTED APPROACH** - Add methods to existing `FFmpegExecutor`:

```rust
// src-tauri/src/ffmpeg.rs additions

use super::transcription::AudioFormat;

impl FFmpegExecutor {
    // ... existing methods ...
    
    /// Extract audio from video clip to temporary file
    /// Returns path to extracted audio file
    pub fn extract_audio(
        &self,
        video_path: &str,
        trim_start: f64,
        duration: f64,
        output_format: AudioFormat,
    ) -> Result<PathBuf, String> {
        let temp_dir = std::env::temp_dir();
        let output_file = temp_dir.join(format!(
            "audio_{}_{}.{}",
            uuid::Uuid::new_v4(),
            chrono::Utc::now().timestamp(),
            output_format.extension()
        ));

        let output_path = output_file.to_str().ok_or("Invalid output path")?;

        // Build FFmpeg command for audio extraction
        let mut args = vec![
            "-ss".to_string(),
            trim_start.to_string(),
            "-i".to_string(),
            video_path.to_string(),
            "-t".to_string(),
            duration.to_string(),
            "-vn".to_string(), // No video
            "-acodec".to_string(),
        ];

        match output_format {
            AudioFormat::Mp3 => {
                args.push("libmp3lame".to_string());
                args.push("-q:a".to_string());
                args.push("2".to_string()); // High quality
            }
            AudioFormat::Wav => {
                args.push("pcm_s16le".to_string());
            }
            AudioFormat::M4a => {
                args.push("aac".to_string());
                args.push("-b:a".to_string());
                args.push("192k".to_string());
            }
        }

        args.push("-y".to_string()); // Overwrite
        args.push(output_path.to_string());

        // Execute FFmpeg using self.ffmpeg_path
        let output = std::process::Command::new(&self.ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("FFmpeg execution failed: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Audio extraction failed: {}", stderr));
        }

        Ok(output_file)
    }
}
```

**Key Changes**: Method is added to existing `FFmpegExecutor` struct, using `self.ffmpeg_path` instead of creating a new executor instance.

#### 5. OpenAI API Client

```rust
// src-tauri/src/transcription.rs

use reqwest::multipart;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
struct WhisperResponse {
    task: String,
    language: String,
    duration: f64,
    text: String,
    segments: Vec<WhisperSegment>,
    words: Option<Vec<WhisperWord>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct WhisperSegment {
    id: i32,
    seek: i32,
    start: f64,
    end: f64,
    text: String,
    temperature: f64,
    avg_logprob: f64,
    compression_ratio: f64,
    no_speech_prob: f64,
}

#[derive(Debug, Serialize, Deserialize)]
struct WhisperWord {
    word: String,
    start: f64,
    end: f64,
}

pub struct OpenAIClient {
    api_key: String,
    client: reqwest::Client,
    base_url: String,
}

impl OpenAIClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
            base_url: "https://api.openai.com/v1".to_string(),
        }
    }

    pub async fn transcribe(
        &self,
        audio_path: &Path,
        config: &TranscriptionConfig,
    ) -> Result<WhisperResponse, String> {
        // Read audio file
        let file_bytes = tokio::fs::read(audio_path)
            .await
            .map_err(|e| format!("Failed to read audio file: {}", e))?;

        let file_name = audio_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("audio.mp3");

        // Build multipart form
        let file_part = multipart::Part::bytes(file_bytes)
            .file_name(file_name.to_string())
            .mime_str("audio/mpeg")
            .map_err(|e| format!("Failed to create file part: {}", e))?;

        let mut form = multipart::Form::new()
            .part("file", file_part)
            .text("model", config.model.clone())
            .text("response_format", config.response_format.clone())
            .text("temperature", config.temperature.to_string());

        if let Some(lang) = &config.language {
            form = form.text("language", lang.clone());
        }

        // Make API request
        let response = self
            .client
            .post(format!("{}/audio/transcriptions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API error {}: {}", status, body));
        }

        let whisper_response: WhisperResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(whisper_response)
    }
}
```

#### 6. Export Helper Functions

```rust
// src-tauri/src/transcription.rs

/// Export transcript to TXT format
pub async fn export_as_txt(transcript: &Transcript, path: &str) -> Result<(), String> {
    tokio::fs::write(path, &transcript.full_text)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Export transcript to SRT format
pub async fn export_as_srt(transcript: &Transcript, path: &str) -> Result<(), String> {
    let mut srt = String::new();
    for (i, segment) in transcript.segments.iter().enumerate() {
        srt.push_str(&format!("{}\n", i + 1));
        srt.push_str(&format!(
            "{} --> {}\n",
            format_srt_time(segment.start),
            format_srt_time(segment.end)
        ));
        srt.push_str(&format!("{}\n\n", segment.text));
    }
    tokio::fs::write(path, srt)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Export transcript to VTT format
pub async fn export_as_vtt(transcript: &Transcript, path: &str) -> Result<(), String> {
    let mut vtt = String::from("WEBVTT\n\n");
    for segment in &transcript.segments {
        vtt.push_str(&format!(
            "{} --> {}\n",
            format_vtt_time(segment.start),
            format_vtt_time(segment.end)
        ));
        vtt.push_str(&format!("{}\n\n", segment.text));
    }
    tokio::fs::write(path, vtt)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Export transcript to JSON format
pub async fn export_as_json(transcript: &Transcript, path: &str) -> Result<(), String> {
    let json = serde_json::to_string_pretty(transcript)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    tokio::fs::write(path, json)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

fn format_srt_time(seconds: f64) -> String {
    let hours = (seconds / 3600.0).floor() as i32;
    let minutes = ((seconds % 3600.0) / 60.0).floor() as i32;
    let secs = (seconds % 60.0).floor() as i32;
    let millis = ((seconds % 1.0) * 1000等行业0).floor() as i32;
    format!("{:02}:{:02}:{:02},{:03}", hours, minutes, secs, millis)
}

fn format_vtt_time(seconds: f64) -> String {
    let hours = (seconds / 3600.0).floor() as i32;
    let minutes = ((seconds % 3600.0) / 60.0).floor() as i32;
    let secs = (seconds % 60.0).floor() as i32;
    let millis = ((seconds % 1.0) * 1000.0).floor() as i32;
    format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, secs, millis)
}
```

#### 7. Tauri Commands (CORRECTED SIGNATURES)

```rust
// src-tauri/src/commands.rs additions

use crate::transcription::{
    OpenAIClient, Transcript, TranscriptionConfig, TranscriptSegment, TranscriptWord,
    TranscriptionProgress, AudioFormat, export_as_txt, export_as_srt, export_as_vtt, export_as_json,
};
use crate::ffmpeg::FFmpegExecutor;

/// Transcribe a video clip using OpenAI Whisper
#[tauri::command]
pub async fn transcribe_clip(
    #[serde(rename = "clipId")]
    clip_id: String,
    #[serde(rename = "filePath")]
    file_path: String,
    #[serde(rename = "trimStart")]
    trim_start: f64,
    duration: f64,
    #[serde(rename = "apiKey")]
    api_key: String,
    config: TranscriptionConfig,
    app_handle: tauri::AppHandle,
) -> Result<Transcript, String> {
    // Get main window for event emission
    let window = app_handle.get_webview_window("main")
        .ok_or("Main window not found")?;

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
    let segments: Vec<TranscriptSegment> = whisper_response
        .segments
        .iter()
        .map(|s| TranscriptSegment {
            id: uuid::Uuid::new_v4().to_string(),
            text: s.text.trim().to_string(),
            start: s.start,
            end: s.end,
            confidence: None, // Whisper doesn't provide per-segment confidence
        })
        .collect();

    let words: Vec<TranscriptWord> = whisper_response
        .words
        .unwrap_or_default()
        .iter()
        .map(|w| TranscriptWord {
            word: w.word.clone(),
            start: w.start,
            end: w.end,
            confidence: None,
        })
        .collect();

    let transcript = Transcript {
        id: uuid::Uuid::new_v4().to_string(),
        clip_id,
        language: whisper_response.language,
        segments,
        words,
        full_text: whisper_response.text,
        duration: whisper_response.duration,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    // Emit completion
    window.emit("transcription-progress", serde_jsonそんな::json!({
        "clipId": transcript.clip_id,
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
    #[serde(rename = "outputPath")]
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
```

**Key Changes**: 
- Uses `tauri::AppHandle` instead of `tauri::Window` parameter
- Gets window via `app_handle.get_webview_window("main")`
- Added serde rename attributes to match frontend camelCase
- Event emission error handling added

#### 8. Module Registration

```rust
// src-tauri/src/lib.rs additions

mod transcription; // Add this line

use commands::{export_video, generate_thumbnail, get_media_metadata, list_cameras, transcribe_clip, export_transcript};

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
            get_recording_status,
            transcribe_clip,        // Add this
            export_transcript,      // Add this
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Frontend Implementation (React/TypeScript)

#### 1. New Store: transcriptionStore.ts (CORRECTED)

**CHANGE**: Use `Record<string, Transcript>` instead of `Map` for Zustand persist compatibility:

```typescript
// src/store/transcriptionStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TranscriptSegment {
  id: string;
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface Transcript {
  id: string;
  clipId: string;
  language: string;
  segments: TranscriptSegment[];
  words: TranscriptWord[];
  fullText: string;
  duration: number;
  createdAt: string;
}

export interface TranscriptionProgress {
  clipId: string;
  stage: 'extracting' | 'transcribing' | 'processing' | 'complete' | 'error';
  percent: number;
  message: string;
}

interface TranscriptionState {
  transcripts: Record<string, Transcript>; // Changed from Map to Record
  activeTranscriptId: string | null;
  isTranscribing: boolean;
  progress: TranscriptionProgress | null;
  apiKey: string | null;
  
  // Actions
  setApiKey: (key: string) => void;
  addTranscript: (transcript: Transcript) => void;
  removeTranscript: (clipId: string) => void;
  getTranscript: (clipId: string) => Transcript | undefined;
  setActiveTranscript: (clipId: string | null) => void;
  setIsTranscribing: (status: boolean) => void;
  setProgress: (progress: TranscriptionProgress | null) => void;
  clearAll: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>()(
  persist(
    (set, get) => ({
      transcripts: {}, // Changed from Map to empty object
      activeTranscriptId: null,
      isTranscribing: false,
      progress: null,
      apiKey: null,
      
      setApiKey: (key) => set({ apiKey: key }),
      
      addTranscript: (transcript) => set((state) => ({
        transcripts: {
          ...state.transcripts,
          [transcript.clipId]: transcript,
        },
      })),
      
      removeTranscript: (clipId) => set((state) => {
        const { [clipId]: removed, ...rest } = state.transcripts;
        return { transcripts: rest };
      }),
      
      getTranscript: (clipId) => get().transcripts[clipId],
      
      setActiveTranscript: (clipId) => set({ activeTranscriptId: clipId }),
      
      setIsTranscribing: (status) => set({ isTranscribing: status }),
      
      setProgress: (progress) => set({ progress }),
      
      clearAll: () => set({ 
        transcripts: {}, 
        activeTranscriptId: null,
        progress: null 
      }),
    }),
    {
      name: 'transcription-storage',
      // No custom serialization needed for Record - Zustand handles objects natively
    }
  )
);
```

**Key Changes**: 
- Switched from `Map<string, Transcript>` to `Record<string, Transcript>` for Zustand persist
- Removed custom serialization/merge functions
- Simplified state management with object spread syntax

#### 2. Service Layer: transcriptionService.ts (CORRECTED)

```typescript
// src/services/transcriptionService.ts

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save } from '@tauri-apps/plugin-dialog';
import { Transcript, TranscriptionProgress } from '../store/transcriptionStore';
import { handleError, toAppError, ErrorCode, AppError } from '../utils/errors';

export interface TranscriptionConfig {
  language?: string;
  model: string;
  responseFormat: string;
  temperature: number;
}

export class TranscriptionService {
  private progressListener: (() => void) | null = null;

  /**
   * Transcribe a video clip
   */
  async transcribeClip(
    clipId: string,
    filePath: string,
    trimStart: number,
    duration: number,
    apiKey: string,
    config: TranscriptionConfig,
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<Transcript> {
    try {
      // Set up progress listener
      if (onProgress) {
        this.progressListener = await listen<TranscriptionProgress>(
          'transcription-progress',
          (event) => {
            if (event.payload.clipId === clipId) {
              onProgress(event.payload);
            }
          }
        );
      }

      const transcript = await invoke<Transcript>('transcribe_clip', {
        clipId,
        filePath,
        trimStart,
        duration,
        apiKey,
        config,
      });

      // Clean up listener
      if (this.progressListener) {
        this.progressListener();
        this.progressListener = null;
      }

      return transcript;
    } catch (error) {
      // Clean up listener on error
      if (this.progressListener) {
        this.progressListener();
        this.progressListener = null;
      }

      handleError(error, 'TranscriptionService.transcribeClip');
      
      // Enhance error with transcription-specific context
      const appError = toAppError(error, 'TranscriptionService.transcribeClip');
      
      // Check for specific API errors
      if (appError.message.includes('API error 401')) {
        throw new AppError(
          appError.message,
          'Invalid OpenAI API key. Please check your API key and try again.',
          ErrorCode.PERMISSION_DENIED,
          true,
          appError.context
        );
      }
      
      if (appError.message.includes('API error 429')) {
        throw new AppError(
          appError.message,
          'API rate limit exceeded. Please wait a moment and try again.',
          'RATE_LIMIT_ERROR',
          true,
          appError.context
        );
      }
      
      throw appError;
    }
  }

  /**
   * Export transcript to file
   */
  async exportTranscript(
    transcript: Transcript,
    format: 'txt' | 'srt' | 'vtt' | 'json' = 'txt'
  ): Promise<void> {
    try {
      // Open save dialog
      const outputPath = await save({
        filters: [{
          name: 'Transcript',
          extensions: [format]
        }],
        defaultPath: `transcript-${transcript.clipId}.${format}`
      });

      if (!outputPath) {
        return; // User cancelled
      }

      await invoke('export_transcript', {
        transcript,
        outputPath,
        format,
      });
    } catch (error) {
      handleError(error, 'TranscriptionService.exportTranscript');
      throw toAppError(error, 'TranscriptionService.exportTranscript');
    }
  }

  /**
   * Search within transcript
   */
  searchTranscript(transcript: Transcript, query: string): TranscriptSegment[] {
    const lowerQuery = query.toLowerCase();
    return transcript.segments.filter((segment) =>
      segment.text.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get segment at specific time
   */
  getSegmentAtTime(transcript: Transcript, time: number): TranscriptSegment | null {
    return transcript.segments.find(
      (segment) => time >= segment.start && time < segment.end
    ) || null;
  }
}

// Export singleton
export const transcriptionService = new TranscriptionService();
```

**Key Changes**:
- Uses existing `handleError` and `toAppError` utilities
- Enhanced error handling with transcription-specific error codes
- Progress listener filters by clipId to avoid cross-clip interference

#### 3. UI Components

The UI components remain largely the same, but with corrected imports and error handling:

##### TranscriptionPanel.tsx

```typescript
// src/components/Transcription/TranscriptionPanel.tsx

import React, { useState } from 'react';
import { useTranscriptionStore } from '../../store/transcriptionStore';
import { useMediaStore } from '../../store/mediaStore';
import { useTimelineStore } from '../../store/timelineStore';
import { transcriptionService } from '../../services/transcriptionService';
import { toAppError, AppError } from '../../utils/errors';

interface TranscriptionPanelProps {
  onClose: () => void;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ onClose }) => {
  const { tracks } = useTimelineStore();
  const { files } = useMediaStore();
  const {
    apiKey,
    setApiKey,
    isTranscribing,
    progress,
    setIsTranscribing,
    setProgress,
    addTranscript,
    transcripts,
  } = useTranscriptionStore();

  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Get all clips
  const allClips = tracks.flatMap((track) => track.clips);

  const handleTranscribe = async () => {
    if (!selectedClipId) {
      setError('Please select a clip to transcribe');
      return;
    }

    if (!apiKey) {
      setError('Please enter your OpenAI API key');
      return;
    }

    const clip = allClips.find((c) => c.id художник === selectedClipId);
    if (!clip) {
      setError('Clip not found');
      return;
    }

    const mediaFile = files.find((f) => f.id === clip.mediaFileId);
    if (!mediaFile) {
      setError('Media file not found');
      return;
    }

    setError(null);
    setIsTranscribing(true);

    try {
      const transcript = await transcriptionService.transcribeClip(
        clip.id,
        mediaFile.path,
        clip.trimStart,
        clip.duration,
        apiKey,
        {
          language: language || undefined,
          model: 'whisper-1',
          responseFormat: 'verbose_json',
          temperature: 0.0,
        },
        (progress) => {
          setProgress(progress);
        }
      );

      addTranscript(transcript);
      setProgress(null);
    } catch (err) {
      const appError = toAppError(err, 'TranscriptionPanel.handleTranscribe');
      setError(appError.userMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  // ... rest of component remains the same ...
};

// Rest of component UI code unchanged - see original plan for full implementation
```

**Key Changes**: Uses existing error handling patterns with `toAppError`.

---

## Dependencies Summary

### Cargo.toml Additions

```toml
[dependencies]
# ... existing dependencies ...
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json", "multipart", "rustls-tls"] }
chrono = { version = "0.4", features = ["serde"] }
```

**No package.json changes needed** - all frontend dependencies already available.

---

## Key Corrections Summary

1. ✅ **Dependencies**: Added tokio, reqwest, chrono
2. ✅ **FFmpeg Pattern**: Extended existing FFmpegExecutor instead of creating new struct
3. ✅ **Module Structure**: Flat structure (transcription.rs) matching existing patterns
4. ✅ **Command Signatures**: Use AppHandle instead of Window parameter
5. ✅ **Data Models**: Added serde rename attributes for camelCase compatibility
6. ✅ **Zustand Store**: Changed Map to Record for persist compatibility
7. ✅ **Error Handling**: Integrated with existing error utilities
8. ✅ **Event Emission**: Proper error handling for window events

---

## Testing Checklist

Before marking implementation complete:

- [ ] All Rust dependencies compile correctly
- [ ] FFmpeg audio extraction works with trimmed clips
- [ ] OpenAI API integration handles all error cases
- [ ] Progress events emit and receive correctly
- [ ] Transcripts persist across app restarts
- [ ] Export functions generate correct file formats
- [ ] Error messages use existing AppError patterns
- [ ] UI components handle loading and error states
- [ ] Search and seek-to-timestamp work correctly

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Backend Foundation | 5 days | Audio extraction, API setup |
| Phase 2: API Integration | 5 days | Working transcription |
| Phase 3: Store & State | 3 days | Frontend state management |
| Phase 4: UI Components | 7 days | Complete UI |
| Phase 5: Export & Polish | 5 days | Export, docs, testing |
| **Total** | **25 days** | **Production-ready feature** |

---

**Document Version**: 2.0 (Adjusted)  
**Last Updated**: 2025-01-29  
**Status**: Ready for Implementation (Corrected)

---

## Next Steps

1. Review this adjusted plan
2. Add dependencies to Cargo.toml
3. Begin Phase 1: Backend Foundation
4. Follow implementation phases sequentially
5. Test each phase before moving to next

