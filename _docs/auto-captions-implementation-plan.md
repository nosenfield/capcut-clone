# Auto-Captions Implementation Plan
**AI-Powered Video Transcription & Caption Generation**

---

## Executive Summary

This document outlines the implementation plan for adding automatic caption generation to the CapCut Clone video editor. The feature will extract audio from video clips, transcribe it using OpenAI's Whisper API, and display timestamped captions on the timeline that sync with video playback.

**Implementation Time:** 2-3 weeks  
**Complexity:** Medium  
**Dependencies:** OpenAI Whisper API, FFmpeg (already integrated)

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Implementation Phases](#implementation-phases)
4. [Technical Specifications](#technical-specifications)
5. [UI/UX Design](#uiux-design)
6. [Data Models](#data-models)
7. [API Integration](#api-integration)
8. [Testing Strategy](#testing-strategy)
9. [Future Enhancements](#future-enhancements)

---

## Feature Overview

### What We're Building

A simple, effective auto-caption system that:
- Extracts audio from video clips using FFmpeg
- Sends audio to OpenAI Whisper API for transcription
- Displays timestamped captions in a sidebar panel
- Shows captions during video playback (overlaid on preview)
- Allows basic caption editing and export

### User Flow

1. User imports/selects a video clip
2. User clicks "Generate Captions" button on clip
3. System extracts audio → transcribes via Whisper API
4. Captions appear in sidebar panel with timestamps
5. During playback, captions display on video preview
6. User can edit caption text, export as SRT/VTT

### Why This is Simple

- Leverages existing FFmpeg integration for audio extraction
- Single API call to OpenAI Whisper (no complex ML setup)
- Minimal UI changes (add sidebar panel + overlay)
- No timeline integration required initially (captions are metadata)

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Caption Panel   │  │ Caption      │  │ Preview        │ │
│  │ (Sidebar)       │  │ Overlay      │  │ Player         │ │
│  └────────┬────────┘  └──────┬───────┘  └────────┬───────┘ │
│           │                   │                   │          │
│           └───────────────────┴───────────────────┘          │
│                              │                               │
│                    ┌─────────▼──────────┐                   │
│                    │ Caption Store       │                   │
│                    │ (Zustand)          │                   │
│                    └─────────┬──────────┘                   │
└──────────────────────────────┼──────────────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Caption Service      │
                    │ (TypeScript)         │
                    └──────────┬───────────┘
                               │ Tauri IPC
┌──────────────────────────────┼──────────────────────────────┐
│                      Backend (Rust/Tauri)                    │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Audio Extractor │  │ Whisper API  │  │ Caption        │ │
│  │ (FFmpeg)        │  │ Client       │  │ Storage        │ │
│  └─────────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

**Frontend:**
- `CaptionPanel.tsx` - Sidebar showing caption list with timestamps
- `CaptionOverlay.tsx` - Displays current caption on video preview
- `useCaptions.ts` - Hook for caption management
- `captionStore.ts` - Zustand store for caption state
- `captionService.ts` - Service layer for API calls

**Backend:**
- `caption.rs` - Rust module for caption operations
- `extract_audio()` - FFmpeg command to extract audio from video
- `transcribe_audio()` - OpenAI Whisper API client
- `save_captions()` - Save captions to disk (JSON/SRT)

---

## Implementation Phases

### Phase 1: Backend Audio Extraction (Week 1, Days 1-2)

**Goal:** Extract audio from video clips using FFmpeg

**Tasks:**
1. Create `src-tauri/src/caption.rs` module
2. Add `extract_audio` command to extract audio as WAV/MP3
3. Add Tauri command `extract_audio_from_clip`
4. Test audio extraction with sample videos

**Deliverables:**
- ✅ Audio extraction working via Tauri IPC
- ✅ Temporary audio files cleaned up properly

### Phase 2: OpenAI Whisper Integration (Week 1, Days 3-4)

**Goal:** Send audio to Whisper API and receive transcription

**Tasks:**
1. Add `reqwest` dependency for HTTP requests
2. Create Whisper API client in `caption.rs`
3. Add `transcribe_audio` command
4. Implement API key management (user provides key)
5. Handle transcription errors and rate limits

**Deliverables:**
- ✅ Working Whisper API integration
- ✅ Timestamped transcription segments returned
- ✅ Error handling for API failures

### Phase 3: Frontend Caption Store & UI (Week 1, Day 5 - Week 2, Day 2)

**Goal:** Display captions in UI and manage state

**Tasks:**
1. Create `src/store/captionStore.ts` Zustand store
2. Create `src/services/captionService.ts`
3. Create `src/components/Caption/CaptionPanel.tsx`
4. Add "Generate Captions" button to clip cards
5. Show loading state during transcription
6. Display caption segments with timestamps

**Deliverables:**
- ✅ Caption panel in sidebar
- ✅ Loading/progress indicators
- ✅ Caption list displays correctly

### Phase 4: Caption Overlay & Playback Sync (Week 2, Days 3-4)

**Goal:** Show captions on video preview during playback

**Tasks:**
1. Create `src/components/Caption/CaptionOverlay.tsx`
2. Add overlay to `PreviewPlayer.tsx`
3. Sync captions with playhead position
4. Style captions (position, font, background)
5. Handle caption timing edge cases

**Deliverables:**
- ✅ Captions display during playback
- ✅ Captions sync with video timeline
- ✅ Professional caption styling

### Phase 5: Caption Editing & Export (Week 2, Day 5 - Week 3)

**Goal:** Allow users to edit and export captions

**Tasks:**
1. Add inline editing in `CaptionPanel`
2. Add caption export to SRT format
3. Add caption export to VTT format (optional)
4. Add "Delete All Captions" option
5. Persist captions (save with project/clip metadata)

**Deliverables:**
- ✅ Users can edit caption text
- ✅ Export captions as SRT file
- ✅ Captions saved/loaded with clips

---

## Technical Specifications

### Backend Implementation (Rust)

#### 1. Audio Extraction

**File:** `src-tauri/src/caption.rs`

```rust
use std::process::Command;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CaptionSegment {
    pub id: u32,
    pub start: f64,      // seconds
    pub end: f64,        // seconds
    pub text: String,
}

impl FFmpegExecutor {
    /// Extract audio from video as WAV for Whisper API
    pub fn extract_audio(
        &self,
        video_path: &str,
        output_path: &str,
    ) -> Result<(), String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-i", video_path,
                "-vn",                    // No video
                "-acodec", "pcm_s16le",   // PCM audio
                "-ar", "16000",           // 16kHz sample rate (Whisper requirement)
                "-ac", "1",               // Mono
                "-y",                     // Overwrite output
                output_path
            ])
            .output()
            .map_err(|e| format!("FFmpeg execution failed: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Audio extraction failed: {}", stderr));
        }
        
        Ok(())
    }
}
```

#### 2. Whisper API Client

```rust
use reqwest;
use serde_json::Value;

pub struct WhisperClient {
    api_key: String,
    client: reqwest::Client,
}

impl WhisperClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }
    
    /// Transcribe audio file using OpenAI Whisper API
    pub async fn transcribe(
        &self,
        audio_path: &str,
        language: Option<&str>,
    ) -> Result<Vec<CaptionSegment>, String> {
        use std::fs;
        
        // Read audio file
        let audio_data = fs::read(audio_path)
            .map_err(|e| format!("Failed to read audio file: {}", e))?;
        
        // Create multipart form
        let form = reqwest::multipart::Form::new()
            .part(
                "file",
                reqwest::multipart::Part::bytes(audio_data)
                    .file_name("audio.wav")
                    .mime_str("audio/wav")
                    .unwrap()
            )
            .text("model", "whisper-1")
            .text("response_format", "verbose_json")
            .text("timestamp_granularities", "segment");
        
        // Add language if specified
        let form = if let Some(lang) = language {
            form.text("language", lang.to_string())
        } else {
            form
        };
        
        // Make API request
        let response = self.client
            .post("https://api.openai.com/v1/audio/transcriptions")
            .bearer_auth(&self.api_key)
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;
        
        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Whisper API error: {}", error_text));
        }
        
        let json: Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        
        // Parse segments
        let segments = json["segments"].as_array()
            .ok_or("No segments in response")?;
        
        let captions: Vec<CaptionSegment> = segments.iter()
            .enumerate()
            .filter_map(|(i, seg)| {
                Some(CaptionSegment {
                    id: i as u32,
                    start: seg["start"].as_f64()?,
                    end: seg["end"].as_f64()?,
                    text: seg["text"].as_str()?.trim().to_string(),
                })
            })
            .collect();
        
        Ok(captions)
    }
}
```

#### 3. Tauri Commands

```rust
use crate::caption::{CaptionSegment, WhisperClient};

#[tauri::command]
pub async fn generate_captions(
    video_path: String,
    api_key: String,
    language: Option<String>,
) -> Result<Vec<CaptionSegment>, String> {
    use std::env;
    use std::fs;
    
    // Create temporary audio file
    let temp_dir = env::temp_dir();
    let audio_path = temp_dir.join(format!("audio_{}.wav", uuid::Uuid::new_v4()));
    let audio_path_str = audio_path.to_str().ok_or("Invalid temp path")?;
    
    // Extract audio
    let executor = FFmpegExecutor::new()?;
    executor.extract_audio(&video_path, audio_path_str)?;
    
    // Transcribe with Whisper
    let client = WhisperClient::new(api_key);
    let captions = client.transcribe(
        audio_path_str,
        language.as_deref()
    ).await?;
    
    // Clean up temp file
    let _ = fs::remove_file(audio_path);
    
    Ok(captions)
}

#[tauri::command]
pub async fn export_captions_srt(
    captions: Vec<CaptionSegment>,
    output_path: String,
) -> Result<(), String> {
    use std::fs;
    use std::io::Write;
    
    let mut srt_content = String::new();
    
    for (i, caption) in captions.iter().enumerate() {
        // Subtitle index
        srt_content.push_str(&format!("{}\n", i + 1));
        
        // Timestamp (00:00:00,000 --> 00:00:05,000)
        let start = format_srt_timestamp(caption.start);
        let end = format_srt_timestamp(caption.end);
        srt_content.push_str(&format!("{} --> {}\n", start, end));
        
        // Text
        srt_content.push_str(&format!("{}\n\n", caption.text));
    }
    
    fs::write(&output_path, srt_content)
        .map_err(|e| format!("Failed to write SRT file: {}", e))?;
    
    Ok(())
}

fn format_srt_timestamp(seconds: f64) -> String {
    let hours = (seconds / 3600.0) as u32;
    let minutes = ((seconds % 3600.0) / 60.0) as u32;
    let secs = (seconds % 60.0) as u32;
    let millis = ((seconds % 1.0) * 1000.0) as u32;
    format!("{:02}:{:02}:{:02},{:03}", hours, minutes, secs, millis)
}
```

#### 4. Update `lib.rs`

```rust
mod caption;

use commands::{
    export_video, generate_thumbnail, get_media_metadata, list_cameras,
    generate_captions, export_captions_srt
};

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
            generate_captions,
            export_captions_srt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 5. Update `Cargo.toml`

Add dependencies:

```toml
[dependencies]
reqwest = { version = "0.11", features = ["multipart", "json"] }
tokio = { version = "1", features = ["full"] }
uuid = { version = "1.0", features = ["v4"] }
```

### Frontend Implementation (React/TypeScript)

#### 1. Caption Types

**File:** `src/types/caption.ts`

```typescript
export interface CaptionSegment {
  id: number;
  start: number;  // seconds
  end: number;    // seconds
  text: string;
}

export interface ClipCaptions {
  clipId: string;
  segments: CaptionSegment[];
  language?: string;
  generatedAt: Date;
}
```

#### 2. Caption Store

**File:** `src/store/captionStore.ts`

```typescript
import { create } from 'zustand';
import { CaptionSegment, ClipCaptions } from '../types/caption';

interface CaptionState {
  // Map of clipId -> captions
  captionsByClip: Map<string, ClipCaptions>;
  
  // Currently selected clip for editing
  selectedClipId: string | null;
  
  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  
  // API key (stored in memory only)
  apiKey: string | null;
  
  // Actions
  setCaptions: (clipId: string, captions: ClipCaptions) => void;
  updateSegment: (clipId: string, segmentId: number, text: string) => void;
  deleteSegment: (clipId: string, segmentId: number) => void;
  clearCaptions: (clipId: string) => void;
  setSelectedClip: (clipId: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setApiKey: (key: string | null) => void;
  getCaptions: (clipId: string) => ClipCaptions | undefined;
  getCurrentSegment: (clipId: string, time: number) => CaptionSegment | null;
}

export const useCaptionStore = create<CaptionState>((set, get) => ({
  captionsByClip: new Map(),
  selectedClipId: null,
  isGenerating: false,
  generationProgress: 0,
  apiKey: null,
  
  setCaptions: (clipId, captions) => set((state) => {
    const newMap = new Map(state.captionsByClip);
    newMap.set(clipId, captions);
    return { captionsByClip: newMap };
  }),
  
  updateSegment: (clipId, segmentId, text) => set((state) => {
    const captions = state.captionsByClip.get(clipId);
    if (!captions) return state;
    
    const updatedSegments = captions.segments.map(seg =>
      seg.id === segmentId ? { ...seg, text } : seg
    );
    
    const newMap = new Map(state.captionsByClip);
    newMap.set(clipId, { ...captions, segments: updatedSegments });
    return { captionsByClip: newMap };
  }),
  
  deleteSegment: (clipId, segmentId) => set((state) => {
    const captions = state.captionsByClip.get(clipId);
    if (!captions) return state;
    
    const updatedSegments = captions.segments.filter(seg => seg.id !== segmentId);
    
    const newMap = new Map(state.captionsByClip);
    newMap.set(clipId, { ...captions, segments: updatedSegments });
    return { captionsByClip: newMap };
  }),
  
  clearCaptions: (clipId) => set((state) => {
    const newMap = new Map(state.captionsByClip);
    newMap.delete(clipId);
    return { captionsByClip: newMap };
  }),
  
  setSelectedClip: (clipId) => set({ selectedClipId: clipId }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setApiKey: (key) => set({ apiKey: key }),
  
  getCaptions: (clipId) => get().captionsByClip.get(clipId),
  
  getCurrentSegment: (clipId, time) => {
    const captions = get().captionsByClip.get(clipId);
    if (!captions) return null;
    
    return captions.segments.find(
      seg => seg.start <= time && seg.end > time
    ) || null;
  },
}));
```

#### 3. Caption Service

**File:** `src/services/captionService.ts`

```typescript
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { CaptionSegment, ClipCaptions } from '../types/caption';
import { handleError, toAppError } from '../utils/errors';

export class CaptionService {
  /**
   * Generate captions for a video clip
   */
  async generateCaptions(
    videoPath: string,
    apiKey: string,
    language?: string
  ): Promise<CaptionSegment[]> {
    try {
      const segments = await invoke<CaptionSegment[]>('generate_captions', {
        videoPath,
        apiKey,
        language: language || null,
      });
      
      return segments;
    } catch (error) {
      handleError(error, 'CaptionService.generateCaptions');
      throw toAppError(error);
    }
  }
  
  /**
   * Export captions as SRT file
   */
  async exportAsSRT(captions: CaptionSegment[]): Promise<void> {
    try {
      const outputPath = await save({
        filters: [{
          name: 'SubRip Subtitle',
          extensions: ['srt']
        }],
        defaultPath: 'captions.srt'
      });
      
      if (!outputPath) return;
      
      await invoke('export_captions_srt', {
        captions,
        outputPath,
      });
    } catch (error) {
      handleError(error, 'CaptionService.exportAsSRT');
      throw toAppError(error);
    }
  }
}

export const captionService = new CaptionService();
```

#### 4. Caption Panel Component

**File:** `src/components/Caption/CaptionPanel.tsx`

```typescript
import React, { useState } from 'react';
import { useCaptionStore } from '../../store/captionStore';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { captionService } from '../../services/captionService';
import { useAppStore } from '../../store/appStore';

export const CaptionPanel: React.FC = () => {
  const { 
    selectedClipId, 
    getCaptions, 
    setSelectedClip,
    apiKey,
    setApiKey,
    isGenerating,
    setIsGenerating,
    clearCaptions,
    updateSegment
  } = useCaptionStore();
  
  const { tracks } = useTimelineStore();
  const { files } = useMediaStore();
  const { setError } = useAppStore();
  
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  
  // Get all clips
  const allClips = tracks.flatMap(track => track.clips);
  
  // Get currently selected clip captions
  const currentCaptions = selectedClipId ? getCaptions(selectedClipId) : null;
  
  const handleGenerateCaptions = async (clipId: string) => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }
    
    const clip = allClips.find(c => c.id === clipId);
    if (!clip) return;
    
    const mediaFile = files.find(f => f.id === clip.mediaFileId);
    if (!mediaFile) return;
    
    setIsGenerating(true);
    setSelectedClip(clipId);
    
    try {
      const segments = await captionService.generateCaptions(
        mediaFile.path,
        apiKey
      );
      
      useCaptionStore.getState().setCaptions(clipId, {
        clipId,
        segments,
        generatedAt: new Date(),
      });
    } catch (error) {
      setError(error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
    setShowApiKeyInput(false);
    setTempApiKey('');
  };
  
  const handleExportSRT = async () => {
    if (!currentCaptions) return;
    
    try {
      await captionService.exportAsSRT(currentCaptions.segments);
    } catch (error) {
      setError(error);
    }
  };
  
  const handleEditSegment = (segmentId: number, newText: string) => {
    if (!selectedClipId) return;
    updateSegment(selectedClipId, segmentId, newText);
  };
  
  return (
    <div className="caption-panel h-full flex flex-col bg-gray-900 text-white border-l border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-blue-500 mb-2">CAPTIONS</h2>
        
        {!apiKey && (
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm mb-2"
          >
            Set OpenAI API Key
          </button>
        )}
        
        {apiKey && (
          <div className="text-xs text-gray-400 mb-2">
            API Key: {apiKey.substring(0, 8)}...
            <button
              onClick={() => setApiKey(null)}
              className="ml-2 text-red-400 hover:text-red-500"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      {showApiKeyInput && (
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <label className="block text-sm mb-2">OpenAI API Key</label>
          <input
            type="password"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm mb-2"
            placeholder="sk-..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveApiKey}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowApiKeyInput(false);
                setTempApiKey('');
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        {isGenerating ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-gray-400">Generating captions...</p>
          </div>
        ) : currentCaptions ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">
                {currentCaptions.segments.length} segments
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportSRT}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                >
                  Export SRT
                </button>
                <button
                  onClick={() => clearCaptions(selectedClipId!)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                >
                  Delete All
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {currentCaptions.segments.map((segment) => (
                <CaptionSegmentItem
                  key={segment.id}
                  segment={segment}
                  onEdit={(text) => handleEditSegment(segment.id, text)}
                />
              ))}
            </div>
          </div>
        ) : allClips.length > 0 ? (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Select a clip and generate captions
            </p>
            <div className="space-y-2">
              {allClips.map((clip) => {
                const mediaFile = files.find(f => f.id === clip.mediaFileId);
                const hasCaptions = !!getCaptions(clip.id);
                
                return (
                  <div
                    key={clip.id}
                    className="bg-gray-800 rounded p-3"
                  >
                    <div className="text-sm font-medium mb-2">
                      {mediaFile?.name || 'Unknown'}
                    </div>
                    <button
                      onClick={() => handleGenerateCaptions(clip.id)}
                      disabled={!apiKey || isGenerating}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                    >
                      {hasCaptions ? 'Regenerate Captions' : 'Generate Captions'}
                    </button>
                    {hasCaptions && (
                      <button
                        onClick={() => setSelectedClip(clip.id)}
                        className="w-full mt-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                      >
                        View Captions
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm mt-8">
            No clips on timeline
          </p>
        )}
      </div>
    </div>
  );
};

interface CaptionSegmentItemProps {
  segment: import('../../types/caption').CaptionSegment;
  onEdit: (text: string) => void;
}

const CaptionSegmentItem: React.FC<CaptionSegmentItemProps> = ({ segment, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(segment.text);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };
  
  const handleSave = () => {
    onEdit(editText);
    setIsEditing(false);
  };
  
  return (
    <div className="bg-gray-800 rounded p-3">
      <div className="text-xs text-gray-400 mb-1">
        {formatTime(segment.start)} → {formatTime(segment.end)}
      </div>
      
      {isEditing ? (
        <div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm mb-2"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditText(segment.text);
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm mb-2">{segment.text}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-400 hover:text-blue-500"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};
```

#### 5. Caption Overlay Component

**File:** `src/components/Caption/CaptionOverlay.tsx`

```typescript
import React, { useMemo } from 'react';
import { useCaptionStore } from '../../store/captionStore';
import { useTimelineStore } from '../../store/timelineStore';
import { useCurrentClip } from '../../hooks/useCurrentClip';

export const CaptionOverlay: React.FC = () => {
  const { getCurrentSegment } = useCaptionStore();
  const { playheadPosition } = useTimelineStore();
  const currentClip = useCurrentClip();
  
  // Get current caption segment
  const currentCaption = useMemo(() => {
    if (!currentClip) return null;
    
    // Calculate time within the clip (accounting for clip position and trim)
    const timeInClip = playheadPosition - currentClip.startTime + currentClip.trimStart;
    
    return getCurrentSegment(currentClip.id, timeInClip);
  }, [currentClip, playheadPosition, getCurrentSegment]);
  
  if (!currentCaption) return null;
  
  return (
    <div className="caption-overlay absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none z-10">
      <div className="bg-black bg-opacity-75 px-4 py-2 rounded max-w-3xl">
        <p className="text-white text-center text-lg font-medium leading-tight">
          {currentCaption.text}
        </p>
      </div>
    </div>
  );
};
```

#### 6. Update Preview Player

**File:** `src/components/Preview/PreviewPlayer.tsx`

Add caption overlay:

```typescript
import { CaptionOverlay } from '../Caption/CaptionOverlay';

export const PreviewPlayer: React.FC = () => {
  // ... existing code ...
  
  return (
    <div className="preview-player h-full w-full flex flex-col bg-black overflow-hidden relative">
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 min-h-0 min-w-0"
      >
        {/* ... existing video element code ... */}
      </div>
      
      {/* Add caption overlay */}
      <CaptionOverlay />
    </div>
  );
};
```

#### 7. Update App Layout

**File:** `src/App.tsx`

Add caption panel to layout:

```typescript
import { CaptionPanel } from './components/Caption/CaptionPanel';

function App() {
  return (
    <ErrorBoundary>
      <div className="app-container h-screen flex flex-col bg-gray-800">
        {/* Top Row */}
        <div className="flex-1 flex flex-row overflow-hidden" style={{ minHeight: 0 }}>
          {/* Media Library */}
          <div className="w-80 flex-shrink-0 border-r border-gray-700">
            <MediaLibrary onRecordClick={() => setShowRecordingPanel(true)} />
          </div>
          
          {/* Preview Panel */}
          <div className="flex-1 flex flex-col relative">
            <PreviewPlayer />
          </div>
          
          {/* Caption Panel - NEW */}
          <div className="w-96 flex-shrink-0">
            <CaptionPanel />
          </div>
        </div>
        
        {/* Bottom Row - Timeline */}
        <div className="h-64 flex flex-row border-t border-gray-700">
          <div className="w-80 flex-shrink-0 border-r border-gray-700">
            <LayerPanel />
          </div>
          <div className="flex-1 bg-gray-800 flex flex-col overflow-hidden">
            <Timeline onExportClick={() => setShowExportDialog(true)} />
          </div>
        </div>
        
        {/* Dialogs */}
        <ExportDialog isOpen={showExportDialog} onClose={() => setShowExportDialog(false)} />
        {showRecordingPanel && <RecordingPanel onClose={() => setShowRecordingPanel(false)} />}
        <Toast />
      </div>
    </ErrorBoundary>
  );
}
```

---

## UI/UX Design

### Caption Panel Layout

```
┌──────────────────────────────┐
│ CAPTIONS                     │
├──────────────────────────────┤
│ [Set OpenAI API Key]         │ <- Button if no key
│ API Key: sk-abc...  [Clear]  │ <- Status if key set
├──────────────────────────────┤
│                              │
│ Clip: video.mp4              │
│ [Generate Captions]          │
│ [View Captions]              │
│                              │
│ ─ OR ─                       │
│                              │
│ 15 segments                  │
│ [Export SRT] [Delete All]    │
│                              │
│ ┌──────────────────────────┐ │
│ │ 0:00.0 → 0:03.5          │ │
│ │ Hello, welcome to...     │ │
│ │ [Edit]                   │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 0:03.5 → 0:07.2          │ │
│ │ This tutorial will...    │ │
│ │ [Edit]                   │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### Caption Overlay Styling

- Position: Bottom center, 48px from bottom
- Background: Black with 75% opacity
- Padding: 16px horizontal, 8px vertical
- Text: White, 18px, medium weight
- Max width: 75% of video width
- Border radius: 4px

---

## Data Models

### Database Schema (Future: Persistence)

For now, captions are stored in memory. Future enhancement: persist to local database.

```typescript
// Future: IndexedDB or SQLite schema
interface StoredCaptions {
  id: string;              // UUID
  clipId: string;          // Reference to timeline clip
  projectId?: string;      // Reference to project (future)
  segments: CaptionSegment[];
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## API Integration

### OpenAI Whisper API

**Endpoint:** `https://api.openai.com/v1/audio/transcriptions`

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Auth: `Bearer {API_KEY}`

**Body:**
- `file`: Audio file (max 25MB)
- `model`: `"whisper-1"`
- `response_format`: `"verbose_json"` (includes timestamps)
- `language`: Optional (e.g., `"en"`, `"es"`)
- `timestamp_granularities`: `["segment"]`

**Response:**
```json
{
  "task": "transcribe",
  "language": "english",
  "duration": 12.34,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.5,
      "text": " Hello, welcome to this tutorial."
    },
    {
      "id": 1,
      "start": 3.5,
      "end": 7.2,
      "text": " This tutorial will show you..."
    }
  ]
}
```

**Rate Limits:**
- 50 requests/minute (free tier)
- 25MB max file size

**Error Handling:**
- `401`: Invalid API key → Prompt user to re-enter
- `429`: Rate limit → Retry with exponential backoff
- `413`: File too large → Split audio into chunks
- `400`: Invalid format → Show error to user

---

## Testing Strategy

### Unit Tests

1. **Caption Store:**
   - Add/update/delete captions
   - Find current segment by time
   - Handle edge cases (no captions, overlapping segments)

2. **Caption Service:**
   - Mock Tauri IPC calls
   - Test error handling
   - Test SRT export formatting

### Integration Tests

1. **Audio Extraction:**
   - Test with various video formats (MP4, MOV)
   - Verify audio quality (16kHz mono)
   - Test cleanup of temp files

2. **Whisper API:**
   - Test with sample audio files
   - Verify timestamp accuracy
   - Test language detection

3. **UI Components:**
   - Test caption panel interactions
   - Test overlay positioning
   - Test caption editing

### Manual Testing Checklist

- [ ] Generate captions for 30s video
- [ ] Generate captions for 5min video
- [ ] Edit caption text
- [ ] Delete individual captions
- [ ] Export as SRT
- [ ] Captions sync with playback
- [ ] Captions display during scrubbing
- [ ] API key persistence
- [ ] Error handling (no API key, invalid video)
- [ ] Multiple clips with separate captions

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Caption Styling:**
   - Font size/color customization
   - Position adjustment (top/bottom/custom)
   - Background opacity control
   - Multiple caption styles (outline, shadow)

2. **Advanced Editing:**
   - Split/merge caption segments
   - Auto-sync timestamps
   - Bulk text find/replace
   - Spell check

3. **Translation:**
   - Auto-translate captions to other languages
   - Use OpenAI translation API
   - Multi-language export

4. **Timeline Integration:**
   - Caption track on timeline
   - Visual waveform with captions
   - Drag to adjust timing
   - Timeline markers at caption boundaries

5. **Export Formats:**
   - VTT (WebVTT)
   - ASS/SSA (Advanced SubStation)
   - Burned-in captions (render to video)

6. **Batch Processing:**
   - Generate captions for all clips at once
   - Queue system for multiple files
   - Background processing

7. **Local Transcription:**
   - Use local Whisper model (no API key needed)
   - Faster processing for offline use
   - Privacy-focused option

---

## Implementation Timeline

### Week 1: Backend & Core Infrastructure

**Monday-Tuesday:**
- ✅ Create `caption.rs` module
- ✅ Implement audio extraction with FFmpeg
- ✅ Add Tauri commands
- ✅ Test audio extraction

**Wednesday-Thursday:**
- ✅ Add `reqwest` dependency
- ✅ Implement Whisper API client
- ✅ Add error handling
- ✅ Test with sample videos

**Friday:**
- ✅ Create caption types
- ✅ Create caption store
- ✅ Create caption service
- ✅ Write unit tests

### Week 2: Frontend UI

**Monday-Tuesday:**
- ✅ Build CaptionPanel component
- ✅ Add API key management
- ✅ Implement caption list
- ✅ Add generation UI

**Wednesday-Thursday:**
- ✅ Build CaptionOverlay component
- ✅ Integrate with PreviewPlayer
- ✅ Implement playback sync
- ✅ Style captions

**Friday:**
- ✅ Add caption editing
- ✅ Implement SRT export
- ✅ Test full workflow

### Week 3: Polish & Testing

**Monday-Wednesday:**
- ✅ Bug fixes
- ✅ Performance optimization
- ✅ Error handling improvements
- ✅ Integration tests

**Thursday-Friday:**
- ✅ Documentation
- ✅ User testing
- ✅ Final polish
- ✅ Release

---

## Success Metrics

### Technical Metrics

- ✅ Audio extraction: <1s for 5min video
- ✅ Transcription accuracy: >90% word accuracy
- ✅ Caption sync: <100ms latency
- ✅ SRT export: Valid format, no errors

### User Experience Metrics

- ✅ Time to generate: <30s for 5min video
- ✅ Caption editing: Intuitive, <5s per edit
- ✅ Zero crashes during transcription
- ✅ Clear error messages for API failures

---

## Conclusion

This implementation plan provides a straightforward path to adding auto-captions to your video editor. By leveraging your existing FFmpeg integration and using OpenAI's battle-tested Whisper API, you can ship a production-ready feature in 2-3 weeks.

**Key Advantages:**
- ✅ Simple architecture (no complex ML setup)
- ✅ Proven API (Whisper is industry standard)
- ✅ Minimal dependencies
- ✅ Clear upgrade path for future features

**Next Steps:**
1. Review this plan with your team
2. Set up OpenAI API account
3. Start with Phase 1 (audio extraction)
4. Iterate based on user feedback

Good luck building! 🚀
