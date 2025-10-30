# AI Transcription Implementation Plan
## OpenAI Integration for Video Timeline Transcription

---

## Executive Summary

This document outlines the implementation plan for integrating OpenAI's Whisper API to provide AI-powered transcription capabilities for video clips in the CapCut Clone application. The feature will extract audio from video files, transcribe it using OpenAI's API, and display timestamped transcriptions alongside the timeline.

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
│                  └──────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

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
   - Secure API key storage
   - Input validation
   - Rate limiting

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
1. Add OpenAI Rust SDK dependency
2. Implement audio extraction via FFmpeg
3. Create transcription service module
4. Implement API key management
5. Add Tauri command for transcription

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
5. Add progress callbacks

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
5. Implement persistence (optional)

### Phase 4: UI Components (Week 4)

**Deliverables:**
- Transcription panel UI
- Transcript viewer component
- Timeline integration

**Tasks:**
1. Design and implement transcription panel
2. Create transcript display component
3. Add timeline markers
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
5. Add error messaging

---

## Technical Specifications

### Backend Implementation (Rust)

#### 1. Dependencies (Cargo.toml additions)

```toml
[dependencies]
# Existing dependencies...
reqwest = { version = "0.11", features = ["json", "multipart"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"
```

#### 2. New Modules Structure

```
src-tauri/src/
├── transcription/
│   ├── mod.rs                 # Module exports
│   ├── openai_client.rs       # OpenAI API client
│   ├── audio_extractor.rs     # FFmpeg audio extraction
│   ├── transcript_parser.rs   # Parse API responses
│   └── types.rs               # Data structures
├── commands.rs                # Add transcription commands
├── ffmpeg.rs                  # Extend for audio extraction
└── lib.rs                     # Register new commands
```

#### 3. Data Structures

```rust
// src-tauri/src/transcription/types.rs

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
    pub clip_id: String,
    pub language: String,
    pub segments: Vec<TranscriptSegment>,
    pub words: Vec<TranscriptWord>,
    pub full_text: String,
    pub duration: f64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionProgress {
    pub stage: String,
    pub percent: f64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionConfig {
    pub language: Option<String>,
    pub model: String, // "whisper-1"
    pub response_format: String, // "verbose_json"
    pub temperature: f64,
}
```

#### 4. Audio Extraction

```rust
// src-tauri/src/transcription/audio_extractor.rs

use crate::ffmpeg::FFmpegExecutor;
use std::path::PathBuf;

pub struct AudioExtractor {
    ffmpeg: FFmpegExecutor,
}

impl AudioExtractor {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            ffmpeg: FFmpegExecutor::new()?,
        })
    }

    /// Extract audio from video clip to temporary file
    pub async fn extract_audio(
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

        // Execute FFmpeg
        let output = std::process::Command::new(self.ffmpeg.ffmpeg_path())
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

#### 5. OpenAI API Client

```rust
// src-tauri/src/transcription/openai_client.rs

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

#### 6. Tauri Commands

```rust
// src-tauri/src/commands.rs (additions)

use crate::transcription::{
    audio_extractor::{AudioExtractor, AudioFormat},
    openai_client::OpenAIClient,
    types::{Transcript, TranscriptionConfig, TranscriptSegment, TranscriptWord},
};

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
    })).ok();

    // Extract audio
    let extractor = AudioExtractor::new()?;
    let audio_path = extractor
        .extract_audio(&file_path, trim_start, duration, AudioFormat::Mp3)
        .await?;

    // Emit progress: Transcribing
    window.emit("transcription-progress", serde_json::json!({
        "clipId": clip_id,
        "stage": "transcribing",
        "percent": 30.0,
        "message": "Sending to OpenAI for transcription..."
    })).ok();

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
    })).ok();

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
    window.emit("transcription-progress", serde_json::json!({
        "clipId": transcript.clip_id,
        "stage": "complete",
        "percent": 100.0,
        "message": "Transcription complete!"
    })).ok();

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

async fn export_as_txt(transcript: &Transcript, path: &str) -> Result<(), String> {
    tokio::fs::write(path, &transcript.full_text)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

async fn export_as_srt(transcript: &Transcript, path: &str) -> Result<(), String> {
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

async fn export_as_vtt(transcript: &Transcript, path: &str) -> Result<(), String> {
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

async fn export_as_json(transcript: &Transcript, path: &str) -> Result<(), String> {
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
    let millis = ((seconds % 1.0) * 1000.0).floor() as i32;
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

### Frontend Implementation (React/TypeScript)

#### 1. New Store: transcriptionStore.ts

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
  transcripts: Map<string, Transcript>; // clipId -> Transcript
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
      transcripts: new Map(),
      activeTranscriptId: null,
      isTranscribing: false,
      progress: null,
      apiKey: null,
      
      setApiKey: (key) => set({ apiKey: key }),
      
      addTranscript: (transcript) => set((state) => {
        const newMap = new Map(state.transcripts);
        newMap.set(transcript.clipId, transcript);
        return { transcripts: newMap };
      }),
      
      removeTranscript: (clipId) => set((state) => {
        const newMap = new Map(state.transcripts);
        newMap.delete(clipId);
        return { transcripts: newMap };
      }),
      
      getTranscript: (clipId) => get().transcripts.get(clipId),
      
      setActiveTranscript: (clipId) => set({ activeTranscriptId: clipId }),
      
      setIsTranscribing: (status) => set({ isTranscribing: status }),
      
      setProgress: (progress) => set({ progress }),
      
      clearAll: () => set({ 
        transcripts: new Map(), 
        activeTranscriptId: null,
        progress: null 
      }),
    }),
    {
      name: 'transcription-storage',
      // Serialize Map to JSON-compatible format
      partialize: (state) => ({
        apiKey: state.apiKey,
        transcripts: Array.from(state.transcripts.entries()),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        transcripts: new Map(persistedState.transcripts || []),
      }),
    }
  )
);
```

#### 2. Service Layer: transcriptionService.ts

```typescript
// src/services/transcriptionService.ts

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save } from '@tauri-apps/plugin-dialog';
import { Transcript, TranscriptionProgress } from '../store/transcriptionStore';
import { handleError, toAppError } from '../utils/errors';

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
            onProgress(event.payload);
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
      throw toAppError(error);
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
      throw toAppError(error);
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

#### 3. UI Components

##### TranscriptionPanel.tsx

```typescript
// src/components/Transcription/TranscriptionPanel.tsx

import React, { useState, useEffect } from 'react';
import { useTranscriptionStore } from '../../store/transcriptionStore';
import { useMediaStore } from '../../store/mediaStore';
import { useTimelineStore } from '../../store/timelineStore';
import { transcriptionService } from '../../services/transcriptionService';
import { toAppError } from '../../utils/errors';

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

    const clip = allClips.find((c) => c.id === selectedClipId);
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
      const appError = toAppError(err);
      setError(appError.userMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">AI Transcription</h2>
          {!isTranscribing && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded text-red-200">
            {error}
          </div>
        )}

        {!isTranscribing ? (
          <div className="space-y-6">
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKey || ''}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>

            {/* Clip Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Clip
              </label>
              <select
                value={selectedClipId || ''}
                onChange={(e) => setSelectedClipId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Select a clip --</option>
                {allClips.map((clip) => {
                  const media = files.find((f) => f.id === clip.mediaFileId);
                  const hasTranscript = transcripts.has(clip.id);
                  return (
                    <option key={clip.id} value={clip.id}>
                      {media?.name || 'Unknown'} ({clip.duration.toFixed(1)}s)
                      {hasTranscript && ' ✓'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Language (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Language (Optional)
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="en, es, fr, etc. (leave blank for auto-detect)"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleTranscribe}
                disabled={!selectedClipId || !apiKey}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Transcribe
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Progress View
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="inline-block w-16 h-16 rounded-full bg-blue-600 animate-pulse mb-4" />
              <p className="text-lg font-semibold text-white mb-2">
                {progress?.message || 'Processing...'}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">
                {Math.round(progress?.percent || 0)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

##### TranscriptViewer.tsx

```typescript
// src/components/Transcription/TranscriptViewer.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useTranscriptionStore, Transcript } from '../../store/transcriptionStore';
import { useTimelineStore } from '../../store/timelineStore';
import { transcriptionService } from '../../services/transcriptionService';

interface TranscriptViewerProps {
  clipId: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ clipId }) => {
  const transcript = useTranscriptionStore((state) => state.getTranscript(clipId));
  const { playheadPosition, setPlayheadPosition } = useTimelineStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update active segment based on playhead
  useEffect(() => {
    if (!transcript) return;

    const segment = transcriptionService.getSegmentAtTime(transcript, playheadPosition);
    setActiveSegmentId(segment?.id || null);

    // Auto-scroll to active segment
    if (segment && containerRef.current) {
      const segmentEl = containerRef.current.querySelector(`[data-segment-id="${segment.id}"]`);
      if (segmentEl) {
        segmentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [transcript, playheadPosition]);

  if (!transcript) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No transcript available for this clip</p>
        <p className="text-sm mt-2">Use the Transcription panel to generate one</p>
      </div>
    );
  }

  const filteredSegments = searchQuery
    ? transcriptionService.searchTranscript(transcript, searchQuery)
    : transcript.segments;

  const handleSegmentClick = (start: number) => {
    setPlayheadPosition(start);
  };

  const handleExport = async (format: 'txt' | 'srt' | 'vtt' | 'json') => {
    try {
      await transcriptionService.exportTranscript(transcript, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Transcript</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('txt')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              TXT
            </button>
            <button
              onClick={() => handleExport('srt')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              SRT
            </button>
            <button
              onClick={() => handleExport('vtt')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              VTT
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transcript..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
        />

        {/* Info */}
        <div className="mt-2 text-xs text-gray-400">
          Language: {transcript.language} • Duration: {transcript.duration.toFixed(1)}s
        </div>
      </div>

      {/* Segments */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredSegments.map((segment) => {
          const isActive = segment.id === activeSegmentId;
          return (
            <div
              key={segment.id}
              data-segment-id={segment.id}
              onClick={() => handleSegmentClick(segment.start)}
              className={`p-3 rounded cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-600/30 border border-blue-500'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(segment.start)} → {formatTime(segment.end)}
                </span>
                {isActive && (
                  <span className="text-xs text-blue-400 font-semibold">▶ Playing</span>
                )}
              </div>
              <p className="text-sm leading-relaxed">{segment.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}
```

---

## UI/UX Design

### Layout Integration

```
┌─────────────────────────────────────────────────────────┐
│  Media Library  │  Preview Player     │  [🎤 Transcribe] │
│                 │                     │                  │
│                 │                     │                  │
│                 │                     │                  │
│                 ├─────────────────────┴──────────────────┤
│                 │  Transcript Viewer (New Panel)         │
│                 │  - Timestamped segments                │
│                 │  - Click to seek                       │
│                 │  - Search & export                     │
├─────────────────┼────────────────────────────────────────┤
│  Layer Panel    │  Timeline                              │
│                 │  [=====] [===] [======]                │
│                 │  └─▲─┘ transcript markers              │
└─────────────────┴────────────────────────────────────────┘
```

### Button Placement

Add transcription button to:
1. **Media Library**: "Transcribe" button next to each clip card
2. **Context Menu**: Right-click clip on timeline → "Transcribe"
3. **Top Bar**: Global "Transcription" menu item

---

## API Integration

### OpenAI Whisper API Details

**Endpoint**: `POST https://api.openai.com/v1/audio/transcriptions`

**Supported Formats**: 
- mp3, mp4, mpeg, mpga, m4a, wav, webm
- Max file size: 25 MB

**Request Format**:
```
multipart/form-data:
- file: audio file
- model: "whisper-1"
- language: (optional) ISO-639-1 code
- response_format: "json" | "verbose_json" | "text" | "srt" | "vtt"
- temperature: 0-1 (default 0)
```

**Response Format** (verbose_json):
```json
{
  "task": "transcribe",
  "language": "en",
  "duration": 12.5,
  "text": "Full transcript text...",
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.5,
      "text": "Hello world",
      "temperature": 0.0,
      ...
    }
  ],
  "words": [
    {
      "word": "Hello",
      "start": 0.0,
      "end": 0.5
    }
  ]
}
```

### Rate Limits & Pricing

- **Rate Limit**: 50 requests/minute
- **Pricing**: $0.006 / minute of audio
- **Context Length**: No explicit limit per file (25 MB max)

### Error Handling

Common errors:
- `401`: Invalid API key
- `413`: File too large (>25 MB)
- `429`: Rate limit exceeded
- `500`: Server error

Implement exponential backoff retry for 429 and 500 errors.

---

## Security Considerations

### API Key Management

1. **Storage**: 
   - Store in Zustand persist (local storage)
   - Never commit to git
   - Consider using OS keychain (future enhancement)

2. **Transmission**:
   - API key only sent from Rust backend
   - Never exposed in frontend network logs

3. **User Education**:
   - Clear documentation on API key security
   - Warning to never share API key
   - Link to OpenAI API key management

### Data Privacy

1. **Audio Files**:
   - Temporary audio files deleted after transcription
   - No audio sent to any server except OpenAI

2. **Transcripts**:
   - Stored locally only
   - User controls export

3. **Network**:
   - All requests over HTTPS
   - No telemetry/analytics on transcript content

---

## Testing Strategy

### Unit Tests

**Rust Backend**:
- Audio extraction with various formats
- OpenAI API client (mocked responses)
- Export format conversions
- Error handling paths

**Frontend**:
- Store state mutations
- Search functionality
- Time formatting utilities

### Integration Tests

- End-to-end transcription flow
- Progress event handling
- Transcript-timeline synchronization
- Export functionality

### Manual Testing Checklist

- [ ] Import video and transcribe
- [ ] Verify progress updates
- [ ] Click segment to seek
- [ ] Search transcript
- [ ] Export to all formats
- [ ] Handle API errors gracefully
- [ ] Test with long videos (>10 min)
- [ ] Test with multiple languages
- [ ] Verify trimmed clips transcribe correctly
- [ ] Test without API key (error handling)

---

## Future Enhancements

### Phase 2 Features

1. **Speaker Diarization**
   - Identify different speakers
   - Color-code transcript by speaker

2. **Subtitle Overlay**
   - Render subtitles directly on video preview
   - Auto-generate subtitle track for export

3. **AI-Powered Editing**
   - "Remove filler words" (um, uh, etc.)
   - Auto-trim silence based on transcript

4. **Multi-Clip Batch Transcription**
   - Queue multiple clips
   - Process in background

5. **Translation**
   - Use OpenAI translation API
   - Generate transcripts in multiple languages

6. **Caption Styling**
   - Customize font, size, color
   - Position control

### Technical Debt to Address

1. **Chunking for Long Audio**
   - Current implementation assumes <25 MB files
   - Add automatic chunking for longer videos

2. **Offline Mode**
   - Use local Whisper model (via whisper.cpp)
   - Fallback when no internet

3. **Caching**
   - Cache transcripts in database (SQLite?)
   - Avoid re-processing same clips

4. **Progress Precision**
   - Real progress from OpenAI (currently estimated)

---

## File Structure Summary

```
src-tauri/
├── src/
│   ├── transcription/
│   │   ├── mod.rs
│   │   ├── openai_client.rs
│   │   ├── audio_extractor.rs
│   │   ├── transcript_parser.rs
│   │   └── types.rs
│   ├── commands.rs (updated)
│   ├── ffmpeg.rs (extend for audio)
│   └── lib.rs (register commands)
│
src/
├── components/
│   └── Transcription/
│       ├── TranscriptionPanel.tsx
│       ├── TranscriptViewer.tsx
│       └── TranscriptSegmentMarker.tsx
├── services/
│   └── transcriptionService.ts
├── store/
│   └── transcriptionStore.ts
└── types/
    └── transcription.ts
```

---

## Dependencies to Add

### Cargo.toml
```toml
reqwest = { version = "0.11", features = ["json", "multipart"] }
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"
chrono = "0.4"
uuid = { version = "1.0", features = ["v4"] }
```

### package.json
```json
{
  "dependencies": {
    "zustand": "^4.4.0" // already included
  }
}
```

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

## Success Metrics

- [ ] Users can transcribe clips with <5 clicks
- [ ] Transcription accuracy >90% for clear audio
- [ ] Progress feedback updates every second
- [ ] Export supports 4 formats (TXT, SRT, VTT, JSON)
- [ ] Search returns results in <100ms
- [ ] Seek-to-timestamp works with <100ms delay
- [ ] Error messages are clear and actionable
- [ ] Zero crashes or data loss during transcription

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API downtime | High | Cache transcripts, provide helpful error messages |
| Large file processing | Medium | Implement chunking, progress tracking |
| FFmpeg audio extraction fails | High | Validate formats upfront, clear error messages |
| API rate limiting | Medium | Implement exponential backoff, queue requests |

### User Experience Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slow transcription for long clips | Medium | Set expectations (time estimate), allow background processing |
| Confusing error messages | High | User-friendly error handling with recovery steps |
| API key management complexity | Low | Simple UI, clear instructions |

---

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating AI transcription into the video editing application using OpenAI's Whisper API. The architecture is designed to be:

- **Modular**: Easy to extend with new features
- **Performant**: Async processing, progress tracking
- **User-Friendly**: Clear UI, helpful error messages
- **Secure**: Local storage, HTTPS-only communication
- **Maintainable**: Clean separation of concerns, well-documented

By following this plan, the development team can deliver a production-ready transcription feature in approximately 5 weeks.

---

## Appendix: Example Usage Flow

1. User imports video clip to timeline
2. User clicks "Transcribe" button on clip card
3. Transcription panel opens
4. User enters OpenAI API key (first time only)
5. User selects clip and language (optional)
6. User clicks "Transcribe"
7. Backend extracts audio from video
8. Backend sends audio to OpenAI API
9. Progress bar updates in real-time
10. Transcript appears in viewer panel
11. User clicks transcript segment → playhead seeks
12. User searches for specific words
13. User exports transcript as SRT for YouTube

---

**Document Version**: 1.0  
**Last Updated**: October 29, 2025  
**Authors**: Technical Implementation Team  
**Status**: Ready for Development
