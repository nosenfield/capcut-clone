# MVP Development - Chunk 2: Backend & FFmpeg

**Phase**: Phase 2 - Backend & FFmpeg Integration  
**Estimated Time**: 4-6 hours  
**Dependencies**: MVP-Chunk-1-Foundation

## Architecture Reference

This chunk implements:
- **Module 4**: Tauri Backend Commands
- **Module 5**: FFmpeg Integration Layer

See `_docs/architecture.md` sections for Module 4 and Module 5 for complete specifications.

---

## Prerequisites

Before starting this chunk, ensure:
- ✅ MVP-Chunk-1-Foundation is complete
- ✅ Project structure is in place
- ✅ TypeScript types are defined
- ✅ State stores are working

---

## Overview

This chunk creates the Rust backend that handles video processing. You'll download FFmpeg binaries, implement Rust code to execute FFmpeg commands, and create Tauri IPC commands that the frontend can call.

**Success Criteria**:
- ✅ FFmpeg binary is bundled and accessible
- ✅ Rust FFmpeg executor compiles without errors
- ✅ Tauri commands registered and callable from frontend
- ✅ Metadata extraction works on test video
- ✅ Thumbnail generation produces valid images

---

## Tasks

### Task 2.1: Download and Bundle FFmpeg
**Module**: Module 5 (FFmpeg Integration)  
**Dependencies**: Task 1.2 (Tauri config)  
**Priority**: Critical

**Description**:
Download FFmpeg and FFprobe binaries for macOS and add to project resources.

**Steps**:
1. Download FFmpeg static build for macOS:
   - Option A: Homebrew: `brew install ffmpeg` then copy from `/opt/homebrew/bin/`
   - Option B: Download from https://evermeet.cx/ffmpeg/
2. Extract `ffmpeg` and `ffprobe` binaries
3. Copy binaries to `src-tauri/binaries/`
4. Make executable: `chmod +x src-tauri/binaries/ffmpeg src-tauri/binaries/ffprobe`
5. Update `tauri.conf.json` resources array:
   ```json
   "resources": ["binaries/ffmpeg", "binaries/ffprobe"]
   ```
6. Verify binaries are included in dev build (check path resolution)

**Acceptance Criteria**:
- [ ] FFmpeg binary (~50-80MB) in `src-tauri/binaries/`
- [ ] FFprobe binary in same directory
- [ ] Binaries are executable (check permissions)
- [ ] `tauri.conf.json` resources includes binary paths
- [ ] Binaries accessible in dev mode

**Files Added**:
- `src-tauri/binaries/ffmpeg`
- `src-tauri/binaries/ffprobe`

**Files Modified**:
- `src-tauri/tauri.conf.json`

---

### Task 2.2: Implement Rust FFmpeg Executor
**Module**: Module 5 (FFmpeg Integration)  
**Dependencies**: Task 2.1  
**Priority**: Critical

**Description**:
Create Rust module that executes FFmpeg/FFprobe commands and parses output.

**Steps**:
1. Create `src-tauri/src/ffmpeg.rs`
2. Add necessary dependencies to `Cargo.toml`:
   ```toml
   [dependencies]
   serde = { version = "1.0", features = ["derive"] }
   serde_json = "1.0"
   tauri = { version = "1.5", features = ["shell-all"] }
   ```
3. Implement `FFmpegExecutor` struct with methods:
   - Constructor that resolves bundled binary paths
   - `get_metadata()` - uses FFprobe
   - `parse_metadata()` - parses JSON output
   - `parse_fps()` - handles fractional rates (e.g., "30000/1001")
   - `generate_thumbnail()` - creates thumbnail at timestamp
   - `export_video()` - concatenates clips
   - `build_filter_complex()` - builds FFmpeg filter chain
4. Handle errors gracefully with `Result<T, String>`
5. Test binary path resolution in dev mode

**Implementation Reference**:
See Module 5 in `architecture.md` for complete `FFmpegExecutor` implementation including:
- Path resolution using Tauri resource directory
- FFprobe JSON parsing
- Thumbnail generation with quality settings
- Export with H.264 encoding
- Filter complex for trimming and concatenation

**Acceptance Criteria**:
- [ ] `FFmpegExecutor` compiles without errors
- [ ] Binary paths resolve correctly in dev mode
- [ ] FFprobe JSON parsing works
- [ ] FPS parsing handles fractional rates
- [ ] Error messages include stderr output
- [ ] All methods return `Result` for error handling

**Files Created**:
- `src-tauri/src/ffmpeg.rs`

**Files Modified**:
- `src-tauri/Cargo.toml`

---

### Task 2.3: Create Tauri Commands
**Module**: Module 4 (Tauri Backend Commands)  
**Dependencies**: Task 2.2  
**Priority**: Critical

**Description**:
Define Tauri IPC commands that frontend can invoke.

**Steps**:
1. Create `src-tauri/src/commands.rs`
2. Define structs:
   ```rust
   #[derive(Debug, Serialize, Deserialize)]
   pub struct MediaMetadata {
       pub duration: f64,
       pub width: u32,
       pub height: u32,
       pub fps: f64,
       pub codec: String,
       pub bitrate: u64,
   }
   
   #[derive(Debug, Serialize, Deserialize)]
   pub struct ClipInfo {
       pub file_path: String,
       pub start_time: f64,
       pub duration: f64,
       pub trim_start: f64,
       pub trim_end: f64,
   }
   ```
3. Implement commands:
   - `get_media_metadata(file_path: String) -> Result<MediaMetadata, String>`
   - `generate_thumbnail(file_path: String, timestamp: f64) -> Result<String, String>`
   - `export_video(clips: Vec<ClipInfo>, output_path: String, resolution: String, fps: u32) -> Result<(), String>`
4. Update `src-tauri/src/main.rs`:
   ```rust
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
5. Test commands using Tauri's invoke from browser dev tools

**Acceptance Criteria**:
- [ ] All commands compile and are registered
- [ ] Commands can be invoked from frontend (test with dev tools)
- [ ] Metadata extraction works on test video file
- [ ] Thumbnail generation produces valid image
- [ ] Export command structure is correct
- [ ] Errors propagate to frontend properly

**Files Created**:
- `src-tauri/src/commands.rs`

**Files Modified**:
- `src-tauri/src/main.rs`

---

## Testing This Chunk

**Verification Steps**:
1. Build Rust backend: `cargo build` in `src-tauri/`
2. Launch app: `npm run tauri dev`
3. Open browser console
4. Test command invocation:
   ```javascript
   import { invoke } from '@tauri-apps/api/tauri';
   
   // Test metadata extraction
   const testPath = '/path/to/test/video.mp4';
   invoke('get_media_metadata', { filePath: testPath })
     .then(metadata => console.log('Metadata:', metadata))
     .catch(err => console.error('Error:', err));
   
   // Test thumbnail generation
   invoke('generate_thumbnail', { 
     filePath: testPath,
     timestamp: 0
   })
     .then(base64 => console.log('Thumbnail generated'))
     .catch(err => console.error('Error:', err));
   ```

**Common Issues**:
- FFmpeg not found: Check binary paths and permissions
- Cargo build errors: Check Rust version (1.70+)
- JSON parsing fails: Test FFprobe output manually
- Commands not registered: Check main.rs invoke_handler

**Required Test Asset**:
Place a test video file (MP4 or MOV) in a known location for testing metadata extraction and thumbnail generation.

---

## Next Chunk

**MVP-Chunk-3-MediaImport**: Media Import & Library (Phase 3)
- Creates frontend video service
- Builds media library UI component
- Requires completion of this chunk (backend commands must work)
