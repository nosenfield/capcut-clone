# Video Editor Application Architecture

**Version**: 1.0  
**Target Platform**: macOS  
**Last Updated**: 2025-10-27

## Executive Summary

This document defines the architecture for a desktop video editing application similar to CapCut. The application enables users to import video clips, arrange them on a timeline, perform basic editing operations (trim, split, arrange), and export the final video.

**Core Technology Stack**:
- Desktop Framework: Tauri (Rust + WebView)
- Frontend: React 18 + TypeScript + Vite
- UI Rendering: Konva.js (timeline canvas)
- Media Processing: FFmpeg (bundled binary)
- State Management: Zustand
- Styling: TailwindCSS

---

## Architecture Principles

### 1. Modular Design
Each feature area is isolated into modules with clear interfaces. Modules declare their dependencies explicitly.

### 2. Separation of Concerns
- **Tauri Backend (Rust)**: File system operations, FFmpeg execution, system integration
- **React Frontend**: UI, user interactions, state management
- **Media Processing Layer**: FFmpeg command construction and execution
- **Timeline Engine**: Canvas-based rendering and interaction handling

### 3. AI-First Development
- Clear module boundaries for incremental development
- Well-defined interfaces for AI code generation
- Explicit dependency declarations
- Single responsibility per module

### 4. Performance Targets
- Timeline responsive with 10+ clips
- Preview playback at 30fps minimum
- App launch under 5 seconds
- No memory leaks during 15+ minute sessions

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Media      │  │   Timeline   │  │   Preview    │      │
│  │   Library    │  │   Editor     │  │   Player     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Global State   │                        │
│                   │   (Zustand)     │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ Tauri IPC
┌────────────────────────────▼─────────────────────────────────┐
│                    Tauri Backend (Rust)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   File I/O   │  │   FFmpeg     │  │   System     │      │
│  │   Commands   │  │   Executor   │  │   Dialogs    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  FFmpeg Binary  │
                    │   (Bundled)     │
                    └─────────────────┘
```

---

## Module Specifications

Each module below is independent and can be implemented incrementally. Modules declare their dependencies explicitly.

---

## MODULE 1: Project Structure & Configuration

**Purpose**: Define the application's file structure, build configuration, and development environment.

**Dependencies**: None (foundational module)

**Technical Context**: Tauri + React + TypeScript + Vite

### Directory Structure

```
video-editor/
├── .cursor/                    # Cursor IDE configuration
│   └── mcp.json               # Model Context Protocol config
├── .git/                      # Git version control
├── .vscode/                   # VSCode settings (optional)
│   ├── settings.json
│   └── extensions.json
│
├── _docs/                     # Project documentation
│   ├── architecture.md        # System architecture (this file)
│   ├── task-list-mvp.md      # MVP implementation tasks
│   ├── task-list-final.md    # Post-MVP feature tasks
│   ├── development-guide.md  # Development setup & workflow
│   ├── api-reference.md      # API documentation
│   └── user-manual.md        # End-user documentation (Post-MVP)
│
├── _context-summaries/        # AI context summaries (Cursor workflow)
│   ├── .gitkeep
│   ├── session-*.md          # Session summaries (gitignored)
│   └── progress-*.md         # Progress snapshots (gitignored)
│
├── _temp/                     # Temporary files (gitignored)
│   ├── .gitkeep
│   ├── test-exports/         # Test export outputs
│   └── debug-logs/           # Debug information
│
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   ├── main.rs           # Tauri entry point
│   │   ├── ffmpeg.rs         # FFmpeg execution logic
│   │   └── commands.rs       # Tauri IPC commands
│   ├── binaries/             # Bundled executables
│   │   ├── ffmpeg            # FFmpeg binary (gitignored, download separately)
│   │   ├── ffprobe           # FFprobe binary (gitignored, download separately)
│   │   └── download-ffmpeg.sh # Download script
│   ├── icons/                # Application icons
│   │   └── icon.icns
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
│
├── src/                       # React frontend
│   ├── components/           # React components
│   │   ├── MediaLibrary/
│   │   ├── Timeline/
│   │   ├── Preview/
│   │   └── ExportDialog/
│   ├── store/                # Zustand state management
│   │   ├── mediaStore.ts
│   │   ├── timelineStore.ts
│   │   └── appStore.ts
│   ├── services/             # Business logic
│   │   ├── videoService.ts
│   │   └── projectService.ts
│   ├── types/                # TypeScript definitions
│   │   ├── media.ts
│   │   └── timeline.ts
│   ├── utils/                # Helper functions
│   ├── App.tsx
│   └── main.tsx
│
├── public/                    # Static assets
├── scripts/                   # Build and utility scripts
│   └── download-ffmpeg.sh
│
├── .gitignore
├── .cursorignore             # Cursor-specific ignore rules
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Documentation Organization

**AI-First Development Structure**:

This project follows an AI-assisted development methodology with dedicated documentation directories:

**`_docs/`** - Project Documentation
- Contains architecture, task lists, and design documents
- Prefixed with underscore to appear at top of directory listings
- Separate from code for clarity and easy access
- Not part of the build process, purely for development reference
- Files in this directory serve as persistent context for AI coding tools

**`_context-summaries/`** - AI Context and Session Summaries
- Used by Cursor IDE and other AI development tools
- Contains interval summaries during development sessions
- Helps maintain context across long development workflows
- Stores conversation checkpoints and decision logs
- Gitignored to avoid cluttering the repository

**`_temp/`** - Temporary Working Files
- Scratch space for experiments and temporary outputs
- Safe location for test files during development
- Completely gitignored
- Can be safely deleted without affecting project

**`src-tauri/binaries/`** - FFmpeg Binaries
- Contains bundled FFmpeg and FFprobe executables (~80MB total)
- Gitignored due to large file size
- Must be downloaded separately (see scripts/download-ffmpeg.sh)
- Required for all video processing operations

**Note**: All underscore-prefixed directories (`_docs/`, `_context-summaries/`, `_temp/`) are organizational aids for development workflow. They are not required for the application to build or run. The application runtime only depends on `src/`, `src-tauri/`, and `public/` directories.

### Key Configuration Files

**tauri.conf.json** (critical settings):
```json
{
  "productName": "capcut-clone",
  "version": "0.1.0",
  "identifier": "com.nosenfield.capcut-clone",
  "app": {
    "windows": [{
      "title": "CapCut Clone - Video Editor",
      "width": 1280,
      "height": 800,
      "minWidth": 1024,
      "minHeight": 600
    }]
  },
  "bundle": {
    "active": true,
    "targets": "dmg",
    "resources": ["binaries/ffmpeg", "binaries/ffprobe"],
    "icon": ["icons/icon.icns"]
  }
}
```

**src-tauri/capabilities/default.json** (Tauri v2 permissions):
```json
{
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:scope-app-data",
    "fs:scope-app-data-recursive"
  ]
}
```

**Implementation Notes**:
- Tauri v2 uses capabilities-based permissions in `capabilities/default.json`
- Bundle FFmpeg binaries in `src-tauri/binaries/` directory
- Restrict file system access to app data directories
- Enable only necessary permissions (principle of least privilege)
- Window size optimized for video editing UI (1280x800 with minimum 1024x600)

---

## MODULE 2: Type Definitions

**Purpose**: Define TypeScript interfaces for all domain models used across the application.

**Dependencies**: None (foundational module)

**File**: `src/types/media.ts`, `src/types/timeline.ts`

### Media Types

```typescript
// src/types/media.ts

export interface MediaFile {
  id: string;                    // UUID
  name: string;                  // Original filename
  path: string;                  // Absolute file path
  type: 'video' | 'audio';      // Media type
  duration: number;              // Duration in seconds
  width: number;                 // Video width in pixels
  height: number;                // Video height in pixels
  fps: number;                   // Frames per second
  fileSize: number;              // Size in bytes
  thumbnailUrl: string;          // Data URL or blob URL for preview
  createdAt: Date;              // Import timestamp
}

export interface MediaMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}
```

### Timeline Types

```typescript
// src/types/timeline.ts

export interface TimelineClip {
  id: string;                    // UUID
  mediaFileId: string;           // Reference to MediaFile
  trackId: string;               // Which track this clip is on
  startTime: number;             // Position on timeline (seconds)
  duration: number;              // Clip duration (seconds)
  trimStart: number;             // Trim from source start (seconds)
  trimEnd: number;               // Trim from source end (seconds)
  layer: number;                 // Z-index for overlays (0 = base)
}

export interface TimelineTrack {
  id: string;                    // UUID
  name: string;                  // Display name
  type: 'video' | 'audio';      // Track type
  clips: TimelineClip[];        // Ordered clips on this track
  muted: boolean;               // Track mute state
  locked: boolean;              // Prevent editing
}

export interface TimelineState {
  tracks: TimelineTrack[];
  playheadPosition: number;     // Current time in seconds
  duration: number;             // Total timeline duration
  zoom: number;                 // Pixels per second (for UI scaling)
  isPlaying: boolean;
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | 'source';
  fps: number;
  codec: string;
  outputPath: string;
}
```

**Implementation Notes**:
- Use UUIDs for all IDs (library: `uuid`)
- Store times in seconds (not frames) for precision
- Thumbnail URLs should be blob URLs (revoke when media removed)
- All interfaces are immutable (readonly where appropriate)

---

## MODULE 3: State Management

**Purpose**: Global application state using Zustand stores.

**Dependencies**: 
- Module 2 (Type Definitions)

**Files**: `src/store/mediaStore.ts`, `src/store/timelineStore.ts`, `src/store/appStore.ts`

### Media Store

```typescript
// src/store/mediaStore.ts

import { create } from 'zustand';
import { MediaFile } from '../types/media';

interface MediaState {
  files: MediaFile[];
  selectedFileId: string | null;
  
  // Actions
  addMediaFile: (file: MediaFile) => void;
  removeMediaFile: (id: string) => void;
  selectMediaFile: (id: string | null) => void;
  getMediaFile: (id: string) => MediaFile | undefined;
  clearAllMedia: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  files: [],
  selectedFileId: null,
  
  addMediaFile: (file) => set((state) => ({
    files: [...state.files, file]
  })),
  
  removeMediaFile: (id) => set((state) => ({
    files: state.files.filter(f => f.id !== id),
    selectedFileId: state.selectedFileId === id ? null : state.selectedFileId
  })),
  
  selectMediaFile: (id) => set({ selectedFileId: id }),
  
  getMediaFile: (id) => get().files.find(f => f.id === id),
  
  clearAllMedia: () => set({ files: [], selectedFileId: null })
}));
```

### Timeline Store

```typescript
// src/store/timelineStore.ts

import { create } from 'zustand';
import { TimelineState, TimelineClip, TimelineTrack } from '../types/timeline';

interface TimelineStoreState extends TimelineState {
  // Actions
  addClip: (clip: TimelineClip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  setPlayheadPosition: (position: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (trackId: string) => void;
  reorderClips: (trackId: string, clips: TimelineClip[]) => void;
  clearTimeline: () => void;
}

export const useTimelineStore = create<TimelineStoreState>((set, get) => ({
  tracks: [
    { id: 'track-1', name: 'Video Track 1', type: 'video', clips: [], muted: false, locked: false }
  ],
  playheadPosition: 0,
  duration: 0,
  zoom: 50, // 50 pixels per second default
  isPlaying: false,
  
  addClip: (clip) => set((state) => {
    const tracks = state.tracks.map(track => 
      track.id === clip.trackId
        ? { ...track, clips: [...track.clips, clip] }
        : track
    );
    
    // Recalculate total duration
    const maxEnd = Math.max(
      ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration))
    );
    
    return { tracks, duration: maxEnd };
  }),
  
  removeClip: (clipId) => set((state) => {
    const tracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.filter(c => c.id !== clipId)
    }));
    
    const maxEnd = Math.max(
      ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)),
      0
    );
    
    return { tracks, duration: maxEnd };
  }),
  
  updateClip: (clipId, updates) => set((state) => ({
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    }))
  })),
  
  setPlayheadPosition: (position) => set({ playheadPosition: position }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setZoom: (zoom) => set({ zoom }),
  
  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track]
  })),
  
  removeTrack: (trackId) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== trackId)
  })),
  
  reorderClips: (trackId, clips) => set((state) => ({
    tracks: state.tracks.map(track =>
      track.id === trackId ? { ...track, clips } : track
    )
  })),
  
  clearTimeline: () => set({
    tracks: [
      { id: 'track-1', name: 'Video Track 1', type: 'video', clips: [], muted: false, locked: false }
    ],
    playheadPosition: 0,
    duration: 0,
    isPlaying: false
  })
}));
```

### App Store

```typescript
// src/store/appStore.ts

import { create } from 'zustand';

interface AppState {
  isExporting: boolean;
  exportProgress: number;
  error: string | null;
  
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isExporting: false,
  exportProgress: 0,
  error: null,
  
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setError: (error) => set({ error })
}));
```

**Implementation Notes**:
- Zustand provides simple, hook-based state management
- No boilerplate compared to Redux
- State updates are immutable by convention
- Duration recalculation happens automatically when clips change
- Export progress is percentage (0-100)

---

## MODULE 4: Tauri Backend Commands

**Purpose**: Define Rust commands that the React frontend can invoke via Tauri IPC.

**Dependencies**: None (Rust-side only)

**Files**: `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`

### Command Definitions

```rust
// src-tauri/src/commands.rs

use tauri::command;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaMetadata {
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub codec: String,
    pub bitrate: u64,
}

#[command]
pub async fn get_media_metadata(file_path: String) -> Result<MediaMetadata, String> {
    // Use ffprobe to extract metadata
    // Implementation in MODULE 5
    todo!()
}

#[command]
pub async fn generate_thumbnail(
    file_path: String,
    timestamp: f64
) -> Result<String, String> {
    // Generate thumbnail at specific timestamp
    // Returns base64 encoded image
    // Implementation in MODULE 5
    todo!()
}

#[command]
pub async fn export_video(
    clips: Vec<ClipInfo>,
    output_path: String,
    resolution: String,
    fps: u32
) -> Result<(), String> {
    // Execute FFmpeg to export final video
    // Implementation in MODULE 5
    todo!()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClipInfo {
    pub file_path: String,
    pub start_time: f64,
    pub duration: f64,
    pub trim_start: f64,
    pub trim_end: f64,
}

#[command]
pub fn open_file_dialog() -> Result<Vec<String>, String> {
    // Not needed - Tauri dialog API handles this from frontend
    Ok(vec![])
}
```

### Main Entry Point

```rust
// src-tauri/src/main.rs

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod ffmpeg;

use commands::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_media_metadata,
            generate_thumbnail,
            export_video
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Implementation Notes**:
- All commands are async (non-blocking)
- Return `Result<T, String>` for error handling
- Frontend calls these via `invoke()` from `@tauri-apps/api`
- File paths are validated in Rust before processing
- Commands should be idempotent where possible

---

## MODULE 5: FFmpeg Integration Layer

**Purpose**: Execute FFmpeg commands for metadata extraction, thumbnail generation, and video export.

**Dependencies**:
- Module 4 (Tauri Commands)
- FFmpeg binary (bundled)

**File**: `src-tauri/src/ffmpeg.rs`

### FFmpeg Executor

```rust
// src-tauri/src/ffmpeg.rs

use std::process::Command;
use std::path::PathBuf;
use serde_json::Value;

pub struct FFmpegExecutor {
    ffmpeg_path: PathBuf,
    ffprobe_path: PathBuf,
}

impl FFmpegExecutor {
    pub fn new() -> Result<Self, String> {
        // Get bundled FFmpeg binary path
        let resource_dir = tauri::api::path::resource_dir(&tauri::PackageInfo::default())
            .map_err(|e| e.to_string())?;
        
        let ffmpeg_path = resource_dir.join("binaries/ffmpeg");
        let ffprobe_path = resource_dir.join("binaries/ffprobe");
        
        Ok(Self { ffmpeg_path, ffprobe_path })
    }
    
    pub fn get_metadata(&self, file_path: &str) -> Result<MediaMetadata, String> {
        let output = Command::new(&self.ffprobe_path)
            .args(&[
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                file_path
            ])
            .output()
            .map_err(|e| format!("FFprobe execution failed: {}", e))?;
        
        if !output.status.success() {
            return Err(format!("FFprobe failed: {}", 
                String::from_utf8_lossy(&output.stderr)));
        }
        
        let json: Value = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("Failed to parse FFprobe output: {}", e))?;
        
        // Parse JSON and extract metadata
        self.parse_metadata(json)
    }
    
    fn parse_metadata(&self, json: Value) -> Result<MediaMetadata, String> {
        // Extract video stream info
        let streams = json["streams"].as_array()
            .ok_or("No streams found")?;
        
        let video_stream = streams.iter()
            .find(|s| s["codec_type"] == "video")
            .ok_or("No video stream found")?;
        
        let duration = json["format"]["duration"]
            .as_str()
            .and_then(|s| s.parse::<f64>().ok())
            .ok_or("Failed to parse duration")?;
        
        let width = video_stream["width"]
            .as_u64()
            .ok_or("Failed to parse width")? as u32;
        
        let height = video_stream["height"]
            .as_u64()
            .ok_or("Failed to parse height")? as u32;
        
        let fps_str = video_stream["r_frame_rate"].as_str()
            .ok_or("Failed to get frame rate")?;
        let fps = self.parse_fps(fps_str)?;
        
        let codec = video_stream["codec_name"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
        
        let bitrate = json["format"]["bit_rate"]
            .as_str()
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);
        
        Ok(MediaMetadata {
            duration,
            width,
            height,
            fps,
            codec,
            bitrate,
        })
    }
    
    fn parse_fps(&self, fps_str: &str) -> Result<f64, String> {
        let parts: Vec<&str> = fps_str.split('/').collect();
        if parts.len() == 2 {
            let num = parts[0].parse::<f64>()
                .map_err(|_| "Invalid FPS numerator")?;
            let den = parts[1].parse::<f64>()
                .map_err(|_| "Invalid FPS denominator")?;
            Ok(num / den)
        } else {
            fps_str.parse::<f64>()
                .map_err(|_| "Invalid FPS format".to_string())
        }
    }
    
    pub fn generate_thumbnail(
        &self,
        file_path: &str,
        timestamp: f64,
        output_path: &str
    ) -> Result<(), String> {
        let output = Command::new(&self.ffmpeg_path)
            .args(&[
                "-ss", &timestamp.to_string(),
                "-i", file_path,
                "-vframes", "1",
                "-q:v", "2",
                "-f", "image2",
                output_path
            ])
            .output()
            .map_err(|e| format!("FFmpeg execution failed: {}", e))?;
        
        if !output.status.success() {
            return Err(format!("Thumbnail generation failed: {}", 
                String::from_utf8_lossy(&output.stderr)));
        }
        
        Ok(())
    }
    
    pub fn export_video(
        &self,
        clips: &[ClipInfo],
        output_path: &str,
        resolution: &str,
        fps: u32
    ) -> Result<(), String> {
        // Create FFmpeg filter complex for concatenation and trimming
        let filter_complex = self.build_filter_complex(clips, resolution)?;
        
        let mut args = vec![
            "-y".to_string(), // Overwrite output
        ];
        
        // Add input files
        for clip in clips {
            args.push("-i".to_string());
            args.push(clip.file_path.clone());
        }
        
        // Add filter complex
        args.push("-filter_complex".to_string());
        args.push(filter_complex);
        
        // Output settings
        args.extend_from_slice(&[
            "-map".to_string(),
            "[outv]".to_string(),
            "-r".to_string(),
            fps.to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "medium".to_string(),
            "-crf".to_string(),
            "23".to_string(),
            output_path.to_string(),
        ]);
        
        let output = Command::new(&self.ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("FFmpeg execution failed: {}", e))?;
        
        if !output.status.success() {
            return Err(format!("Video export failed: {}", 
                String::from_utf8_lossy(&output.stderr)));
        }
        
        Ok(())
    }
    
    fn build_filter_complex(
        &self,
        clips: &[ClipInfo],
        resolution: &str
    ) -> Result<String, String> {
        let scale = match resolution {
            "720p" => "1280:720",
            "1080p" => "1920:1080",
            "source" => "-1:-1",
            _ => return Err(format!("Invalid resolution: {}", resolution)),
        };
        
        let mut filters = Vec::new();
        
        // Trim and scale each input
        for (i, clip) in clips.iter().enumerate() {
            let trim_filter = format!(
                "[{}:v]trim=start={}:duration={},setpts=PTS-STARTPTS,scale={}[v{}]",
                i,
                clip.trim_start,
                clip.duration,
                scale,
                i
            );
            filters.push(trim_filter);
        }
        
        // Concatenate all clips
        let concat_inputs: String = (0..clips.len())
            .map(|i| format!("[v{}]", i))
            .collect::<Vec<_>>()
            .join("");
        
        filters.push(format!(
            "{}concat=n={}:v=1:a=0[outv]",
            concat_inputs,
            clips.len()
        ));
        
        Ok(filters.join(";"))
    }
}

use crate::commands::{MediaMetadata, ClipInfo};
```

**Implementation Notes**:
- FFmpeg/FFprobe paths resolved from Tauri resource directory
- All FFmpeg operations are synchronous (Rust async wrapper for IPC)
- Error messages include stderr output for debugging
- Thumbnail quality set to high (`-q:v 2`)
- Export uses H.264 with reasonable defaults (CRF 23, medium preset)
- Filter complex handles trimming, scaling, and concatenation
- Consider adding progress parsing for long exports (parse FFmpeg output)

---

## MODULE 6: Frontend Video Service

**Purpose**: Frontend service layer that calls Tauri commands and manages media files.

**Dependencies**:
- Module 2 (Types)
- Module 3 (State Management)
- Module 4 (Tauri Commands)

**File**: `src/services/videoService.ts`

```typescript
// src/services/videoService.ts

import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { MediaFile, MediaMetadata } from '../types/media';
import { v4 as uuidv4 } from 'uuid';

export class VideoService {
  /**
   * Open file dialog and import selected video files
   */
  async importVideos(): Promise<MediaFile[]> {
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Video',
        extensions: ['mp4', 'mov', 'webm', 'avi']
      }]
    });
    
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      return [];
    }
    
    const paths = Array.isArray(selected) ? selected : [selected];
    const mediaFiles: MediaFile[] = [];
    
    for (const path of paths) {
      try {
        const mediaFile = await this.createMediaFile(path);
        mediaFiles.push(mediaFile);
      } catch (error) {
        console.error(`Failed to import ${path}:`, error);
      }
    }
    
    return mediaFiles;
  }
  
  /**
   * Create MediaFile object from file path
   */
  private async createMediaFile(path: string): Promise<MediaFile> {
    // Get metadata from backend
    const metadata = await invoke<MediaMetadata>('get_media_metadata', {
      filePath: path
    });
    
    // Generate thumbnail
    const thumbnailUrl = await this.generateThumbnail(path, 0);
    
    const fileName = path.split('/').pop() || 'Unknown';
    
    return {
      id: uuidv4(),
      name: fileName,
      path,
      type: 'video',
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      fileSize: 0, // TODO: Get file size
      thumbnailUrl,
      createdAt: new Date()
    };
  }
  
  /**
   * Generate thumbnail for video at specific timestamp
   */
  async generateThumbnail(filePath: string, timestamp: number): Promise<string> {
    const base64Image = await invoke<string>('generate_thumbnail', {
      filePath,
      timestamp
    });
    
    return `data:image/jpeg;base64,${base64Image}`;
  }
  
  /**
   * Export timeline to video file
   */
  async exportVideo(
    clips: Array<{
      filePath: string;
      startTime: number;
      duration: number;
      trimStart: number;
      trimEnd: number;
    }>,
    outputPath: string,
    resolution: '720p' | '1080p' | 'source',
    fps: number
  ): Promise<void> {
    await invoke('export_video', {
      clips,
      outputPath,
      resolution,
      fps
    });
  }
  
  /**
   * Get video duration without full metadata
   */
  async getVideoDuration(filePath: string): Promise<number> {
    const metadata = await invoke<MediaMetadata>('get_media_metadata', {
      filePath
    });
    return metadata.duration;
  }
}

export const videoService = new VideoService();
```

**Implementation Notes**:
- Singleton instance exported for easy import
- Handles file dialog via Tauri API
- Creates blob URLs for thumbnails (remember to revoke!)
- Error handling per file (don't fail entire import batch)
- All Tauri invokes return Promises
- File size calculation TODO (use Tauri fs API)

---

## MODULE 7: Media Library Component

**Purpose**: Display imported video files with thumbnails and metadata. Allow selection and removal.

**Dependencies**:
- Module 2 (Types)
- Module 3 (State - mediaStore)
- Module 6 (VideoService)

**File**: `src/components/MediaLibrary/MediaLibrary.tsx`

```typescript
// src/components/MediaLibrary/MediaLibrary.tsx

import React from 'react';
import { useMediaStore } from '../../store/mediaStore';
import { videoService } from '../../services/videoService';
import { MediaFile } from '../../types/media';

export const MediaLibrary: React.FC = () => {
  const { files, selectedFileId, addMediaFile, removeMediaFile, selectMediaFile } = useMediaStore();
  const [isImporting, setIsImporting] = React.useState(false);
  
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const importedFiles = await videoService.importVideos();
      importedFiles.forEach(file => addMediaFile(file));
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import videos');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove this media file?')) {
      removeMediaFile(id);
    }
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };
  
  return (
    <div className="media-library h-full flex flex-col bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {isImporting ? 'Importing...' : 'Import Videos'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No media files imported</p>
            <p className="text-sm mt-2">Click "Import Videos" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {files.map(file => (
              <MediaCard
                key={file.id}
                file={file}
                isSelected={file.id === selectedFileId}
                onSelect={() => selectMediaFile(file.id)}
                onRemove={(e) => handleRemove(file.id, e)}
                formatDuration={formatDuration}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MediaCardProps {
  file: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
  formatDuration: (seconds: number) => string;
  formatFileSize: (bytes: number) => string;
}

const MediaCard: React.FC<MediaCardProps> = ({
  file,
  isSelected,
  onSelect,
  onRemove,
  formatDuration,
  formatFileSize
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        media-card cursor-pointer rounded-lg overflow-hidden
        border-2 transition-all
        ${isSelected ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-850 hover:border-gray-600'}
      `}
    >
      <div className="aspect-video bg-gray-950 relative">
        <img
          src={file.thumbnailUrl}
          alt={file.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
        >
          Remove
        </button>
      </div>
      
      <div className="p-3">
        <p className="font-medium text-sm truncate">{file.name}</p>
        <div className="flex gap-3 mt-2 text-xs text-gray-400">
          <span>{formatDuration(file.duration)}</span>
          <span>{file.width}x{file.height}</span>
          <span>{file.fps.toFixed(0)} fps</span>
        </div>
      </div>
    </div>
  );
};
```

**Implementation Notes**:
- Grid layout for media cards
- Click to select, button to remove
- Show import loading state
- Display thumbnail, duration, resolution, fps
- Selected state shown with border highlight
- Consider drag-and-drop support in future

---

## MODULE 8: Timeline Canvas Component

**Purpose**: Render timeline tracks and clips using Konva.js. Handle drag, trim, and selection interactions.

**Dependencies**:
- Module 2 (Types)
- Module 3 (State - timelineStore, mediaStore)
- Konva.js and react-konva

**File**: `src/components/Timeline/Timeline.tsx`

```typescript
// src/components/Timeline/Timeline.tsx

import React, { useRef } from 'react';
import { Stage, Layer, Rect, Text, Line } from 'react-konva';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { TimelineClip } from '../../types/timeline';

const TRACK_HEIGHT = 80;
const TRACK_PADDING = 10;
const TIMELINE_HEIGHT = 200;

export const Timeline: React.FC = () => {
  const stageRef = useRef<any>(null);
  const { tracks, playheadPosition, zoom, duration } = useTimelineStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = React.useState(800);
  
  // Update stage width on resize
  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // Convert time to x position
  const timeToX = (time: number): number => {
    return time * zoom;
  };
  
  // Convert x position to time
  const xToTime = (x: number): number => {
    return x / zoom;
  };
  
  return (
    <div ref={containerRef} className="timeline-container bg-gray-900 border-t border-gray-700">
      <TimelineControls />
      
      <div className="timeline-canvas">
        <Stage width={stageWidth} height={TIMELINE_HEIGHT} ref={stageRef}>
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={Math.max(stageWidth, timeToX(duration))}
              height={TIMELINE_HEIGHT}
              fill="#1a1a1a"
            />
            
            {/* Time ruler */}
            <TimeRuler zoom={zoom} duration={duration} stageWidth={stageWidth} />
            
            {/* Tracks */}
            {tracks.map((track, index) => (
              <TrackLayer
                key={track.id}
                track={track}
                y={40 + index * (TRACK_HEIGHT + TRACK_PADDING)}
                zoom={zoom}
                timeToX={timeToX}
              />
            ))}
            
            {/* Playhead */}
            <Playhead position={playheadPosition} zoom={zoom} height={TIMELINE_HEIGHT} />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

interface TimeRulerProps {
  zoom: number;
  duration: number;
  stageWidth: number;
}

const TimeRuler: React.FC<TimeRulerProps> = ({ zoom, duration, stageWidth }) => {
  const ticks: JSX.Element[] = [];
  const interval = zoom < 20 ? 5 : zoom < 50 ? 2 : 1; // Seconds between ticks
  
  for (let t = 0; t <= duration; t += interval) {
    const x = t * zoom;
    if (x > stageWidth) break;
    
    ticks.push(
      <React.Fragment key={t}>
        <Line
          points={[x, 20, x, 30]}
          stroke="#666"
          strokeWidth={1}
        />
        <Text
          x={x - 15}
          y={5}
          text={`${t}s`}
          fontSize={12}
          fill="#999"
        />
      </React.Fragment>
    );
  }
  
  return <>{ticks}</>;
};

interface TrackLayerProps {
  track: any;
  y: number;
  zoom: number;
  timeToX: (time: number) => number;
}

const TrackLayer: React.FC<TrackLayerProps> = ({ track, y, zoom, timeToX }) => {
  const { getMediaFile } = useMediaStore();
  
  return (
    <>
      {/* Track background */}
      <Rect
        x={0}
        y={y}
        width={10000} // Large width
        height={TRACK_HEIGHT}
        fill="#2a2a2a"
        stroke="#444"
        strokeWidth={1}
      />
      
      {/* Track label */}
      <Text
        x={10}
        y={y + 10}
        text={track.name}
        fontSize={14}
        fill="#fff"
      />
      
      {/* Clips */}
      {track.clips.map((clip: TimelineClip) => {
        const mediaFile = getMediaFile(clip.mediaFileId);
        return (
          <ClipRect
            key={clip.id}
            clip={clip}
            mediaFile={mediaFile}
            y={y + 5}
            zoom={zoom}
            timeToX={timeToX}
          />
        );
      })}
    </>
  );
};

interface ClipRectProps {
  clip: TimelineClip;
  mediaFile: any;
  y: number;
  zoom: number;
  timeToX: (time: number) => number;
}

const ClipRect: React.FC<ClipRectProps> = ({ clip, mediaFile, y, zoom, timeToX }) => {
  const { updateClip } = useTimelineStore();
  const [isDragging, setIsDragging] = React.useState(false);
  
  const x = timeToX(clip.startTime);
  const width = clip.duration * zoom;
  
  const handleDragEnd = (e: any) => {
    const newX = e.target.x();
    const newStartTime = newX / zoom;
    
    updateClip(clip.id, { startTime: Math.max(0, newStartTime) });
    setIsDragging(false);
    
    // Reset position (store update will re-render)
    e.target.x(x);
  };
  
  return (
    <>
      <Rect
        x={x}
        y={y}
        width={width}
        height={TRACK_HEIGHT - 10}
        fill={isDragging ? '#5588ff' : '#4477ee'}
        stroke="#66aaff"
        strokeWidth={2}
        cornerRadius={4}
        draggable
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.3}
      />
      
      <Text
        x={x + 10}
        y={y + 10}
        text={mediaFile?.name || 'Unknown'}
        fontSize={12}
        fill="#fff"
        listening={false}
      />
    </>
  );
};

interface PlayheadProps {
  position: number;
  zoom: number;
  height: number;
}

const Playhead: React.FC<PlayheadProps> = ({ position, zoom, height }) => {
  const x = position * zoom;
  
  return (
    <>
      <Line
        points={[x, 0, x, height]}
        stroke="#ff4444"
        strokeWidth={2}
      />
      <Rect
        x={x - 8}
        y={0}
        width={16}
        height={16}
        fill="#ff4444"
      />
    </>
  );
};

const TimelineControls: React.FC = () => {
  const { zoom, setZoom, playheadPosition, isPlaying, setIsPlaying } = useTimelineStore();
  
  return (
    <div className="timeline-controls flex items-center gap-4 p-3 bg-gray-800 border-b border-gray-700">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      
      <span className="text-white text-sm">
        {playheadPosition.toFixed(2)}s
      </span>
      
      <div className="flex items-center gap-2">
        <span className="text-white text-sm">Zoom:</span>
        <input
          type="range"
          min="10"
          max="200"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-white text-sm">{zoom}px/s</span>
      </div>
    </div>
  );
};
```

**Implementation Notes**:
- Konva Stage for canvas rendering
- Clips are draggable rectangles
- Playhead is a red vertical line
- Time ruler shows second markers
- Zoom controls pixels-per-second scale
- Handle drag end by updating store (not direct position)
- Track height is fixed (80px + padding)
- Future: Add trim handles, split functionality, snap-to-grid

---

## MODULE 9: Video Preview Player

**Purpose**: Display current frame at playhead position. Support play/pause and scrubbing.

**Dependencies**:
- Module 2 (Types)
- Module 3 (State - timelineStore, mediaStore)

**File**: `src/components/Preview/PreviewPlayer.tsx`

```typescript
// src/components/Preview/PreviewPlayer.tsx

import React, { useRef, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';

export const PreviewPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { tracks, playheadPosition, isPlaying, setPlayheadPosition, setIsPlaying } = useTimelineStore();
  const { files } = useMediaStore();
  
  // Find current clip at playhead position
  const currentClip = React.useMemo(() => {
    for (const track of tracks) {
      const clip = track.clips.find(c => 
        c.startTime <= playheadPosition && 
        (c.startTime + c.duration) > playheadPosition
      );
      if (clip) return clip;
    }
    return null;
  }, [tracks, playheadPosition]);
  
  const currentMedia = React.useMemo(() => {
    if (!currentClip) return null;
    return files.find(f => f.id === currentClip.mediaFileId);
  }, [currentClip, files]);
  
  // Calculate video time from playhead position
  const videoTime = React.useMemo(() => {
    if (!currentClip) return 0;
    const offsetInClip = playheadPosition - currentClip.startTime;
    return currentClip.trimStart + offsetInClip;
  }, [currentClip, playheadPosition]);
  
  // Update video element when clip or time changes
  useEffect(() => {
    if (videoRef.current && currentMedia) {
      videoRef.current.currentTime = videoTime;
    }
  }, [currentMedia, videoTime]);
  
  // Handle play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying && currentMedia) {
      videoRef.current.play().catch(console.error);
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, currentMedia]);
  
  // Update playhead position during playback
  useEffect(() => {
    if (!isPlaying || !videoRef.current || !currentClip) return;
    
    let animationFrameId: number;
    
    const updatePlayhead = () => {
      if (videoRef.current && currentClip) {
        const videoTime = videoRef.current.currentTime;
        const clipOffset = videoTime - currentClip.trimStart;
        const newPlayheadPosition = currentClip.startTime + clipOffset;
        
        // Check if we've reached the end of the clip
        if (clipOffset >= currentClip.duration) {
          setIsPlaying(false);
          return;
        }
        
        setPlayheadPosition(newPlayheadPosition);
        animationFrameId = requestAnimationFrame(updatePlayhead);
      }
    };
    
    animationFrameId = requestAnimationFrame(updatePlayhead);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, currentClip, setPlayheadPosition, setIsPlaying]);
  
  return (
    <div className="preview-player h-full flex flex-col bg-black">
      <div className="flex-1 flex items-center justify-center">
        {currentMedia ? (
          <video
            ref={videoRef}
            src={`file://${currentMedia.path}`}
            className="max-w-full max-h-full"
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="text-gray-500 text-center">
            <p>No clip at current position</p>
            <p className="text-sm mt-2">Add clips to the timeline to preview</p>
          </div>
        )}
      </div>
      
      <PreviewControls />
    </div>
  );
};

const PreviewControls: React.FC = () => {
  const { isPlaying, setIsPlaying, playheadPosition, setPlayheadPosition, duration } = useTimelineStore();
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = Number(e.target.value);
    setPlayheadPosition(newPosition);
  };
  
  return (
    <div className="preview-controls p-4 bg-gray-900 border-t border-gray-700">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.01"
          value={playheadPosition}
          onChange={handleSeek}
          className="flex-1"
        />
        
        <span className="text-white text-sm min-w-[80px]">
          {playheadPosition.toFixed(2)}s / {duration.toFixed(2)}s
        </span>
      </div>
    </div>
  );
};
```

**Implementation Notes**:
- HTML5 video element for playback
- Use `file://` protocol to load local videos
- Calculate video time based on clip's trim settings
- Request animation frame for smooth playhead updates
- Pause when reaching end of clip
- Scrubber updates playhead position
- Future: Handle multiple clips seamlessly (requires concatenation or switching)

---

## MODULE 10: Export Dialog Component

**Purpose**: UI for exporting timeline to video file. Show progress during export.

**Dependencies**:
- Module 2 (Types)
- Module 3 (State - timelineStore, mediaStore, appStore)
- Module 6 (VideoService)

**File**: `src/components/ExportDialog/ExportDialog.tsx`

```typescript
// src/components/ExportDialog/ExportDialog.tsx

import React, { useState } from 'react';
import { save } from '@tauri-apps/api/dialog';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { useAppStore } from '../../store/appStore';
import { videoService } from '../../services/videoService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const { tracks } = useTimelineStore();
  const { files } = useMediaStore();
  const { isExporting, exportProgress, setIsExporting, setExportProgress } = useAppStore();
  
  const [resolution, setResolution] = useState<'720p' | '1080p' | 'source'>('1080p');
  const [fps, setFps] = useState(30);
  
  const handleExport = async () => {
    // Open save dialog
    const outputPath = await save({
      filters: [{
        name: 'Video',
        extensions: ['mp4']
      }],
      defaultPath: 'exported-video.mp4'
    });
    
    if (!outputPath) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Collect all clips from timeline
      const allClips = tracks.flatMap(track => 
        track.clips.map(clip => {
          const mediaFile = files.find(f => f.id === clip.mediaFileId);
          if (!mediaFile) throw new Error(`Media file not found: ${clip.mediaFileId}`);
          
          return {
            filePath: mediaFile.path,
            startTime: clip.startTime,
            duration: clip.duration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd
          };
        })
      );
      
      // Sort clips by start time
      allClips.sort((a, b) => a.startTime - b.startTime);
      
      if (allClips.length === 0) {
        alert('No clips on timeline to export');
        return;
      }
      
      // TODO: Implement progress tracking
      // For now, just show indeterminate progress
      setExportProgress(50);
      
      await videoService.exportVideo(allClips, outputPath, resolution, fps);
      
      setExportProgress(100);
      alert('Export completed successfully!');
      onClose();
      
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 text-white">
        <h2 className="text-xl font-bold mb-4">Export Video</h2>
        
        {isExporting ? (
          <div className="space-y-4">
            <p>Exporting video...</p>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{exportProgress}%</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="720p">720p (1280x720)</option>
                  <option value="1080p">1080p (1920x1080)</option>
                  <option value="source">Source Resolution</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Frame Rate</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value={24}>24 fps</option>
                  <option value={30}>30 fps</option>
                  <option value={60}>60 fps</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Export
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

**Implementation Notes**:
- Modal dialog overlay
- Resolution and FPS selection
- Save file dialog for output path
- Progress bar during export (currently indeterminate)
- Disable interactions during export
- Future: Parse FFmpeg output for real progress percentage

---

## MODULE 11: Main Application Layout

**Purpose**: Compose all components into the main application layout.

**Dependencies**:
- Module 7 (MediaLibrary)
- Module 8 (Timeline)
- Module 9 (PreviewPlayer)
- Module 10 (ExportDialog)

**File**: `src/App.tsx`

```typescript
// src/App.tsx

import React, { useState } from 'react';
import { MediaLibrary } from './components/MediaLibrary/MediaLibrary';
import { Timeline } from './components/Timeline/Timeline';
import { PreviewPlayer } from './components/Preview/PreviewPlayer';
import { ExportDialog } from './components/ExportDialog/ExportDialog';

function App() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  return (
    <div className="app h-screen flex flex-col bg-gray-950 text-white">
      {/* Top bar */}
      <header className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
        <h1 className="text-lg font-semibold">Video Editor</h1>
        <button
          onClick={() => setShowExportDialog(true)}
          className="bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded text-sm"
        >
          Export Video
        </button>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Media Library */}
        <aside className="w-80 border-r border-gray-700">
          <MediaLibrary />
        </aside>
        
        {/* Center/Right - Preview and Timeline */}
        <main className="flex-1 flex flex-col">
          {/* Preview player */}
          <div className="flex-1">
            <PreviewPlayer />
          </div>
          
          {/* Timeline */}
          <div className="h-64">
            <Timeline />
          </div>
        </main>
      </div>
      
      {/* Export dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}

export default App;
```

**Implementation Notes**:
- Three-pane layout: Media Library, Preview, Timeline
- Fixed header with Export button
- Timeline is fixed height at bottom
- Preview takes remaining vertical space
- Export dialog overlays when open
- Responsive flex layout

---

## Performance Considerations

### Memory Management
- **Video Elements**: Only one active video element at a time
- **Blob URLs**: Revoke thumbnail blob URLs when media removed
- **Canvas**: Konva Stage should recycle nodes (built-in)
- **Large Files**: Consider loading video chunks instead of full file

### Rendering Optimization
- **Timeline**: Use Konva's caching for static elements
- **Preview**: Limit requestAnimationFrame updates to 30fps
- **State Updates**: Batch Zustand updates where possible
- **Thumbnail Generation**: Cache thumbnails on disk (future)

### FFmpeg Optimization
- **Export**: Use hardware acceleration if available (`-hwaccel` flag)
- **Preview**: Generate low-res proxy videos for large files (future)
- **Thumbnails**: Generate thumbnail strips during import (future)

---

## Error Handling Strategy

### Frontend
- Try/catch around all Tauri invokes
- User-friendly error messages (avoid technical jargon)
- Log errors to console for debugging
- Graceful degradation (e.g., missing thumbnail shows placeholder)

### Backend (Rust)
- Return `Result<T, String>` from all commands
- Include FFmpeg stderr in error messages
- Validate file paths before processing
- Handle missing FFmpeg binary gracefully

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Import single video file
- [ ] Import multiple video files
- [ ] Add clip to timeline
- [ ] Drag clip on timeline
- [ ] Preview plays correctly
- [ ] Export single clip
- [ ] Export multiple clips
- [ ] Timeline with 10+ clips remains responsive
- [ ] Memory stable after 15 minutes of editing

### Automated Testing (Future)
- Unit tests for utility functions
- Integration tests for FFmpeg commands
- E2E tests with Playwright or similar

---

## Development Workflow

### Initial Setup
```bash
# Install Tauri CLI
cargo install tauri-cli

# Create Tauri project
npm create tauri-app

# Install dependencies
npm install
npm install zustand konva react-konva uuid

# Install Rust dependencies (in src-tauri)
cd src-tauri
cargo build
```

### Development
```bash
# Run dev server (hot reload)
npm run tauri dev

# Build for production
npm run tauri build
```

### FFmpeg Setup
1. Download FFmpeg binary for macOS
2. Place in `src-tauri/binaries/ffmpeg`
3. Make executable: `chmod +x src-tauri/binaries/ffmpeg`
4. Configure in `tauri.conf.json` resources

---

## Future Enhancements

### MVP + 1
- Screen recording (Tauri APIs)
- Webcam recording
- Multiple tracks (overlay/PiP)
- Split clip at playhead
- Trim handles on clips
- Snap-to-grid

### Full Product
- Audio waveform visualization
- Volume controls
- Transitions between clips
- Text overlays
- Color correction
- Undo/redo
- Auto-save/Project files
- Keyboard shortcuts
- Export presets

---

## Conclusion

This architecture provides a solid foundation for a video editing application. The modular design allows for incremental development, with each module being independently testable and replaceable. The use of Tauri ensures a small bundle size and native performance, while React + TypeScript provides a familiar development experience.

**Next Steps**:
1. Set up project structure
2. Implement Tauri backend commands
3. Build media import and library
4. Create timeline UI
5. Implement preview player
6. Add export functionality
7. Polish and optimize

Each module can be developed in isolation following the AI-first methodology, with clear interfaces and dependencies documented for efficient AI-assisted development.
