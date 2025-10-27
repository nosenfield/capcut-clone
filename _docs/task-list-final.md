# Final Product Task List - Video Editor

**Version**: 1.0  
**Target**: Full Featured Product  
**Last Updated**: 2025-10-27

## Overview

This task list defines all work required to evolve the MVP into a full-featured video editing application. These tasks assume MVP is complete and working.

**Full Product Goals**:
- Professional editing capabilities (multi-track, split, transitions)
- Native recording (screen + webcam + audio)
- Project persistence (save/load)
- Advanced playback (audio waveforms, volume controls)
- Polish features (undo/redo, keyboard shortcuts)
- Cloud export options

---

## Task Organization

Tasks are grouped by feature area and can be implemented in parallel or sequentially based on priorities. Each task builds on MVP foundation.

**Implementation Strategy**: Features are independent modules that can be developed incrementally. Prioritize based on user value and technical dependencies.

---

## PHASE 1: Multi-Track Support

### Task F1.1: Extend Timeline Data Model for Multiple Tracks
**Module**: Module 2 (Types), Module 3 (State Management)  
**Dependencies**: MVP Complete  
**Priority**: High

**Description**:
Update data structures to properly support multiple video/audio tracks with layering.

**Steps**:
1. Update `TimelineTrack` interface:
   - Add `layer` property for z-index ordering
   - Add `height` property for custom track heights
   - Add `color` property for visual distinction
2. Update timeline store:
   - `addTrack()` with track type parameter
   - `removeTrack()` validation (prevent removing last track)
   - `reorderTracks()` for changing layer order
   - Track validation (ensure clips don't overlap on same track)
3. Add track type constraints:
   - Video tracks can contain video clips
   - Audio tracks can contain audio clips
4. Update clip rendering to respect track layers

**Acceptance Criteria**:
- [ ] Timeline can have multiple tracks (2+ video, 2+ audio)
- [ ] Tracks have distinct visual appearance
- [ ] Clips on higher layers render above lower layers
- [ ] Store maintains track order correctly
- [ ] Type safety enforced (video clips on video tracks only)

**Files Modified**:
- `src/types/timeline.ts`
- `src/store/timelineStore.ts`

---

### Task F1.2: Multi-Track Timeline UI
**Module**: Module 8 (Timeline Canvas Component)  
**Dependencies**: Task F1.1  
**Priority**: High

**Description**:
Update timeline UI to display and manage multiple tracks.

**Steps**:
1. Update Timeline component layout:
   - Stack tracks vertically
   - Scrollable track area if many tracks
   - Track headers with name/type/mute/lock controls
2. Add track management UI:
   - "Add Track" button (video/audio selector)
   - Track delete button
   - Track reorder drag handles
3. Update clip rendering:
   - Clips respect track boundaries
   - Cannot drag clips between tracks (for MVP+)
4. Visual track differentiation:
   - Different background colors per track
   - Track labels clearly visible
5. Add track height adjustment (optional)

**Acceptance Criteria**:
- [ ] Multiple tracks visible on timeline
- [ ] Each track clearly labeled with type
- [ ] Add/remove track buttons work
- [ ] Tracks can be reordered (drag handles)
- [ ] Clips render on correct tracks
- [ ] Track mute/lock controls visible
- [ ] Scrolling works with many tracks

**Files Modified**:
- `src/components/Timeline/Timeline.tsx`

**Test Plan**:
1. Add second video track
2. Add clips to both tracks
3. Verify clips on upper track appear on top in preview
4. Remove track and verify clips handled correctly
5. Reorder tracks and verify visual update

---

### Task F1.3: Multi-Track Export Support
**Module**: Module 5 (FFmpeg Integration)  
**Dependencies**: Task F1.1  
**Priority**: High

**Description**:
Update FFmpeg export logic to handle multiple tracks with overlay compositing.

**Steps**:
1. Update `build_filter_complex()` in Rust:
   - Build overlay filter chain for multiple video tracks
   - Handle track layering (z-index to overlay order)
   - Apply positioning for picture-in-picture
2. Update audio mixing:
   - Mix multiple audio tracks
   - Respect track mute settings
   - Apply volume levels if available
3. Test export with 2-3 tracks
4. Handle edge cases (tracks with different dimensions)

**Acceptance Criteria**:
- [ ] Export combines all video tracks correctly
- [ ] Higher tracks overlay lower tracks
- [ ] Audio from all tracks mixed properly
- [ ] Muted tracks excluded from export
- [ ] Export handles different video dimensions
- [ ] Positioning respects track properties

**Files Modified**:
- `src-tauri/src/ffmpeg.rs`
- `src-tauri/src/commands.rs`

**Test Plan**:
1. Create timeline with 2 video tracks
2. Add clips to both tracks
3. Export and verify overlay compositing
4. Add audio track and verify mixing
5. Mute track and verify excluded from export

---

## PHASE 2: Advanced Editing Features

### Task F2.1: Split Clip Functionality
**Module**: Module 8 (Timeline Canvas Component)  
**Dependencies**: MVP Complete  
**Priority**: High

**Description**:
Allow users to split a clip at the playhead position into two separate clips.

**Steps**:
1. Add "Split Clip" action to timeline store:
   - `splitClip(clipId, splitTime)` function
   - Creates two new clips from one
   - First clip: original start to split point
   - Second clip: split point to original end
   - Adjust trim settings accordingly
2. Add UI trigger:
   - Keyboard shortcut (Cmd+B or S)
   - Context menu on clip
   - Button in toolbar
3. Visual feedback:
   - Show split line at playhead when over clip
4. Update preview to handle split clips

**Acceptance Criteria**:
- [ ] Split creates two clips at playhead position
- [ ] Both clips maintain correct trim settings
- [ ] Timeline updates immediately
- [ ] Preview plays through split seamlessly
- [ ] Keyboard shortcut works
- [ ] Cannot split if playhead not over clip

**Files Modified**:
- `src/store/timelineStore.ts`
- `src/components/Timeline/Timeline.tsx`

**Test Plan**:
1. Position playhead over clip
2. Press split keyboard shortcut
3. Verify two clips created
4. Play preview across split point
5. Verify both clips play correctly

---

### Task F2.2: Undo/Redo System
**Module**: Module 3 (State Management)  
**Dependencies**: MVP Complete  
**Priority**: High

**Description**:
Implement comprehensive undo/redo for all timeline operations.

**Steps**:
1. Create history store:
   - Stack of timeline states (snapshots)
   - Current position in history
   - `undo()` action
   - `redo()` action
   - `pushState()` to add new state
2. Integrate with timeline store:
   - Save state before mutating operations
   - Limit history size (e.g., 50 actions)
3. Add keyboard shortcuts:
   - Cmd+Z for undo
   - Cmd+Shift+Z for redo
4. Add UI indicators:
   - Undo/redo buttons in toolbar
   - Disable when at history bounds
5. Operations to track:
   - Add/remove clips
   - Move clips
   - Trim clips
   - Split clips
   - Add/remove tracks

**Acceptance Criteria**:
- [ ] Undo reverses last action
- [ ] Redo restores undone action
- [ ] Keyboard shortcuts work
- [ ] History limited to reasonable size
- [ ] All timeline operations tracked
- [ ] UI buttons show enabled/disabled state
- [ ] Multiple undo/redo operations work correctly

**Files Created**:
- `src/store/historyStore.ts`

**Files Modified**:
- `src/store/timelineStore.ts`
- `src/App.tsx` (keyboard shortcuts)

**Test Plan**:
1. Add clip to timeline
2. Press Cmd+Z (clip should disappear)
3. Press Cmd+Shift+Z (clip should reappear)
4. Perform several operations then undo multiple times
5. Verify state correctly restored

---

### Task F2.3: Snap to Edges
**Module**: Module 8 (Timeline Canvas Component)  
**Dependencies**: MVP Complete  
**Priority**: Medium

**Description**:
Implement magnetic snapping when dragging clips near other clips or playhead.

**Steps**:
1. Add snap configuration to timeline store:
   - `snapEnabled` boolean
   - `snapThreshold` in pixels (e.g., 10)
2. Update clip drag logic:
   - Detect nearby snap points (clip edges, playhead)
   - Adjust position if within threshold
   - Visual indicator when snapped (line/highlight)
3. Snap points:
   - Other clip start/end positions
   - Playhead position
   - Track boundaries
   - Time markers (seconds)
4. Add toggle in UI (snap on/off button)

**Acceptance Criteria**:
- [ ] Clips snap to other clip edges when close
- [ ] Clips snap to playhead
- [ ] Visual indicator shows snap point
- [ ] Snap can be toggled on/off
- [ ] Snap threshold configurable
- [ ] Smooth dragging with snapping

**Files Modified**:
- `src/store/timelineStore.ts`
- `src/components/Timeline/Timeline.tsx`

**Test Plan**:
1. Drag clip near another clip's edge
2. Verify it snaps into alignment
3. Drag clip near playhead
4. Verify snap behavior
5. Toggle snap off and verify free dragging

---

### Task F2.4: Keyboard Shortcuts System
**Module**: New utility module  
**Dependencies**: Task F2.2  
**Priority**: Medium

**Description**:
Implement comprehensive keyboard shortcuts for efficient editing.

**Steps**:
1. Create keyboard shortcut manager:
   - Map keys to actions
   - Handle key combinations (Cmd, Shift, etc.)
   - Prevent conflicts with browser shortcuts
2. Implement shortcuts:
   - `Space`: Play/Pause
   - `Cmd+Z`: Undo
   - `Cmd+Shift+Z`: Redo
   - `Delete`/`Backspace`: Delete selected clip
   - `Cmd+B` or `S`: Split clip
   - `I`: Set in point (trim start)
   - `O`: Set out point (trim end)
   - `Cmd+E`: Export
   - `Cmd+I`: Import media
   - `Left/Right Arrow`: Nudge playhead (1 frame)
   - `Shift+Left/Right`: Nudge playhead (1 second)
3. Add keyboard shortcut reference UI:
   - Help dialog showing all shortcuts
   - Keyboard icon in toolbar
4. Make shortcuts configurable (optional for MVP+)

**Acceptance Criteria**:
- [ ] All essential shortcuts work
- [ ] No conflicts with browser shortcuts
- [ ] Shortcuts work when focused on timeline
- [ ] Help dialog lists all shortcuts
- [ ] Shortcuts feel responsive (no lag)

**Files Created**:
- `src/utils/keyboardShortcuts.ts`
- `src/components/KeyboardShortcutsHelp.tsx`

**Files Modified**:
- `src/App.tsx`

**Test Plan**:
1. Test each shortcut individually
2. Verify combinations work (Cmd+Shift+Z)
3. Verify shortcuts don't conflict
4. Open help dialog and verify accuracy

---

## PHASE 3: Recording Features

### Task F3.1: Screen Recording Setup
**Module**: New recording module  
**Dependencies**: MVP Complete  
**Priority**: High

**Description**:
Implement native screen recording using system APIs via Tauri.

**Steps**:
1. Research Tauri screen capture APIs:
   - macOS: Use ScreenCaptureKit or AVFoundation
   - May need custom Tauri plugin
2. Create Rust screen recorder module:
   - `start_screen_recording()` command
   - `stop_screen_recording()` command
   - Save output to temp file
   - Return file path to frontend
3. Add screen selection UI:
   - Full screen option
   - Specific window selection
   - Region selection (advanced)
4. Create RecordingService frontend:
   - Wrapper for Tauri recording commands
   - Handle recording state
   - Import recorded file to timeline

**Acceptance Criteria**:
- [ ] Can initiate screen recording
- [ ] Recording captures screen correctly
- [ ] Stop recording produces valid video file
- [ ] Recorded file automatically imported to library
- [ ] Full screen recording works
- [ ] Window selection works
- [ ] Recording quality acceptable (30fps minimum)

**Files Created**:
- `src-tauri/src/recording.rs`
- `src/services/recordingService.ts`

**Files Modified**:
- `src-tauri/src/main.rs`
- `src-tauri/src/commands.rs`
- `src-tauri/Cargo.toml` (new dependencies)

**Test Plan**:
1. Start screen recording (full screen)
2. Perform some actions
3. Stop recording
4. Verify video file created
5. Verify video plays correctly
6. Verify imported to media library

---

### Task F3.2: Webcam Recording
**Module**: Recording module  
**Dependencies**: Task F3.1  
**Priority**: High

**Description**:
Add webcam recording capability using system camera.

**Steps**:
1. Add webcam access in Rust:
   - Enumerate available cameras
   - Access camera feed via AVFoundation (macOS)
   - Record to video file
2. Create Tauri commands:
   - `list_cameras()` - returns available cameras
   - `start_webcam_recording(camera_id)` 
   - `stop_webcam_recording()`
3. Add camera selection UI:
   - Dropdown to select camera
   - Preview window showing camera feed
   - Resolution selection
4. Request camera permissions (macOS prompt)
5. Handle no camera scenario gracefully

**Acceptance Criteria**:
- [ ] Can list available cameras
- [ ] Camera permission requested properly
- [ ] Webcam feed preview works
- [ ] Recording produces valid video
- [ ] Recorded file imported to library
- [ ] Works with external USB cameras
- [ ] Multiple cameras selectable

**Files Modified**:
- `src-tauri/src/recording.rs`
- `src/services/recordingService.ts`

**Files Created**:
- `src/components/RecordingControls.tsx`

**Test Plan**:
1. Open recording panel
2. Select webcam from dropdown
3. Verify preview appears
4. Start recording
5. Stop recording
6. Verify video file created and playable

---

### Task F3.3: Simultaneous Screen + Webcam Recording
**Module**: Recording module  
**Dependencies**: Task F3.1, Task F3.2  
**Priority**: Medium

**Description**:
Record screen and webcam simultaneously, creating two separate clips or picture-in-picture.

**Steps**:
1. Update recording module to handle dual recording:
   - Start both screen and webcam capture
   - Synchronize recordings
   - Save as separate files or composite
2. Add UI option for recording mode:
   - Screen only
   - Webcam only
   - Both (separate clips)
   - Both (picture-in-picture)
3. For picture-in-picture:
   - Composite webcam onto screen in real-time (Rust)
   - Position webcam overlay (corner selection)
   - Adjustable webcam size
4. Ensure audio sync across both recordings

**Acceptance Criteria**:
- [ ] Can record screen + webcam simultaneously
- [ ] Both recordings start/stop together
- [ ] Separate clips mode produces two synced files
- [ ] PiP mode produces single composited file
- [ ] Webcam overlay position configurable
- [ ] Audio synced correctly
- [ ] No performance issues during recording

**Files Modified**:
- `src-tauri/src/recording.rs`
- `src/components/RecordingControls.tsx`

**Test Plan**:
1. Start simultaneous recording (separate mode)
2. Record 10 seconds
3. Stop and verify two files created
4. Add both to timeline and verify sync
5. Repeat with PiP mode
6. Verify single composited file

---

### Task F3.4: Audio Input Recording
**Module**: Recording module  
**Dependencies**: Task F3.1  
**Priority**: High

**Description**:
Capture audio from microphone during recording.

**Steps**:
1. Add audio capture in Rust:
   - Enumerate audio input devices
   - Capture microphone audio
   - Embed audio in video recordings
2. Create Tauri commands:
   - `list_audio_inputs()`
   - Audio input selection in recording commands
3. Add audio level meter:
   - Real-time visualization during recording
   - Prevent clipping warnings
4. Handle system audio permissions
5. Audio format: AAC or MP3

**Acceptance Criteria**:
- [ ] Microphone audio captured during recording
- [ ] Audio embedded in video file correctly
- [ ] Can select different audio input devices
- [ ] Audio level meter shows during recording
- [ ] Audio quality acceptable (clear, no distortion)
- [ ] Permission prompt works correctly

**Files Modified**:
- `src-tauri/src/recording.rs`
- `src/components/RecordingControls.tsx`

**Test Plan**:
1. Select microphone
2. Start recording and speak
3. Stop recording
4. Play back video and verify audio present
5. Check audio quality
6. Test with different microphones

---

### Task F3.5: Recording UI Panel
**Module**: New UI component  
**Dependencies**: Task F3.1, F3.2, F3.4  
**Priority**: High

**Description**:
Create comprehensive recording control panel in UI.

**Steps**:
1. Design recording panel layout:
   - Source selection (screen, webcam, both)
   - Camera dropdown
   - Microphone dropdown
   - Recording mode (separate/PiP)
   - Webcam preview
   - Audio level meter
   - Record/Stop buttons
   - Settings (resolution, fps, format)
2. Add to main app layout:
   - New tab or panel
   - Accessible from toolbar
3. Show recording status:
   - Timer showing recording duration
   - Recording indicator (red dot)
4. Handle errors gracefully:
   - No camera/microphone detected
   - Permission denied
   - Disk space low

**Acceptance Criteria**:
- [ ] Recording panel accessible from main UI
- [ ] All recording options configurable
- [ ] Preview shows camera feed
- [ ] Audio meter shows microphone level
- [ ] Recording timer displays during capture
- [ ] Start/stop buttons work reliably
- [ ] Error messages clear and helpful

**Files Created**:
- `src/components/Recording/RecordingPanel.tsx`
- `src/components/Recording/AudioLevelMeter.tsx`

**Files Modified**:
- `src/App.tsx`

**Test Plan**:
1. Open recording panel
2. Configure all settings
3. Verify preview and meters work
4. Start recording
5. Verify timer counts
6. Stop and verify file imported

---

## PHASE 4: Project Persistence

### Task F4.1: Define Project File Format
**Module**: New module - Project Management  
**Dependencies**: MVP Complete  
**Priority**: High

**Description**:
Define JSON-based project file format for saving/loading projects.

**Steps**:
1. Create project file schema:
   ```json
   {
     "version": "1.0.0",
     "name": "My Project",
     "created": "ISO-8601 timestamp",
     "modified": "ISO-8601 timestamp",
     "timeline": {
       "tracks": [...],
       "duration": 120.5
     },
     "media": [
       {
         "id": "uuid",
         "path": "relative/or/absolute",
         "name": "clip.mp4"
       }
     ],
     "settings": {
       "zoom": 50,
       "playheadPosition": 0
     }
   }
   ```
2. Add TypeScript interfaces for project structure
3. Handle relative vs absolute media paths
4. Version the format for future compatibility

**Acceptance Criteria**:
- [ ] Project schema defined clearly
- [ ] TypeScript interfaces match schema
- [ ] Schema is extensible (can add fields)
- [ ] Includes all necessary timeline data
- [ ] Media references handled correctly

**Files Created**:
- `src/types/project.ts`

---

### Task F4.2: Implement Save Project
**Module**: Project Management  
**Dependencies**: Task F4.1  
**Priority**: High

**Description**:
Save current project state to JSON file.

**Steps**:
1. Create project service:
   - `saveProject(path)` function
   - Serialize timeline state to JSON
   - Serialize media library
   - Handle relative paths for media files
2. Add Tauri command for file writing:
   - `save_project_file(path, content)`
3. Add UI for save:
   - "Save Project" in File menu
   - Save dialog to choose location
   - Remember last save location
4. Auto-generate project name if not set
5. Show save success notification

**Acceptance Criteria**:
- [ ] Save dialog opens
- [ ] Project saved as valid JSON
- [ ] File can be read as text
- [ ] All timeline data included
- [ ] Media references correct
- [ ] Save location remembered
- [ ] User notified on success

**Files Created**:
- `src/services/projectService.ts`

**Files Modified**:
- `src-tauri/src/commands.rs`
- `src/App.tsx`

**Test Plan**:
1. Create timeline with clips
2. Save project
3. Open JSON file and verify structure
4. Verify all data present
5. Save again (overwrite) and verify

---

### Task F4.3: Implement Load Project
**Module**: Project Management  
**Dependencies**: Task F4.2  
**Priority**: High

**Description**:
Load previously saved project from JSON file.

**Steps**:
1. Add project loading to project service:
   - `loadProject(path)` function
   - Parse JSON and validate schema
   - Verify media files still exist
   - Restore timeline state
   - Restore media library
2. Add Tauri command for reading:
   - `load_project_file(path)` 
3. Add UI for load:
   - "Open Project" in File menu
   - Open dialog to select .json file
4. Handle missing media files:
   - Warn user about missing files
   - Option to relink files
   - Continue with available files
5. Clear existing project before loading

**Acceptance Criteria**:
- [ ] Open dialog shows
- [ ] JSON file parsed correctly
- [ ] Timeline restored with all clips
- [ ] Media library populated
- [ ] Preview and playback work
- [ ] Missing files handled gracefully
- [ ] Error messages helpful

**Files Modified**:
- `src/services/projectService.ts`
- `src-tauri/src/commands.rs`
- `src/App.tsx`

**Test Plan**:
1. Load previously saved project
2. Verify all clips appear on timeline
3. Verify media library populated
4. Play preview and verify correct
5. Test loading with missing media file
6. Verify warning appears

---

### Task F4.4: Auto-Save Functionality
**Module**: Project Management  
**Dependencies**: Task F4.2  
**Priority**: Medium

**Description**:
Automatically save project at intervals to prevent data loss.

**Steps**:
1. Add auto-save to project service:
   - Save to temp location every N minutes
   - Configurable interval (default 5 min)
   - Only save if changes detected
2. Track "dirty" state:
   - Mark project as modified on edits
   - Clear dirty flag after save
3. Add UI indicator:
   - Show "*" in title if unsaved changes
   - Auto-save timestamp in UI
4. Recover auto-saved projects on crash:
   - Check for auto-save on launch
   - Prompt to restore if found
5. Clean up old auto-save files

**Acceptance Criteria**:
- [ ] Auto-save runs at intervals
- [ ] Only saves when changes made
- [ ] Temp files created correctly
- [ ] Recovery prompt on launch after crash
- [ ] Old auto-saves cleaned up
- [ ] User can disable auto-save

**Files Modified**:
- `src/services/projectService.ts`
- `src/store/appStore.ts`
- `src/App.tsx`

**Test Plan**:
1. Make edits and wait for auto-save
2. Verify temp file created
3. Force quit app
4. Relaunch and verify recovery prompt
5. Restore and verify data intact

---

## PHASE 5: Audio Features

### Task F5.1: Audio Waveform Visualization
**Module**: Module 8 (Timeline) extension  
**Dependencies**: MVP Complete  
**Priority**: Medium

**Description**:
Display audio waveforms on timeline for clips with audio.

**Steps**:
1. Add waveform generation:
   - Use FFmpeg to extract audio samples
   - Generate waveform data (peak/RMS values)
   - Cache waveform data per clip
2. Render waveforms on timeline:
   - Draw on canvas beneath/within clip
   - Scale waveform to clip duration
   - Color-code by audio level
3. Add Tauri command:
   - `generate_waveform(file_path)` returns sample data
4. Progressive rendering:
   - Generate waveforms asynchronously
   - Show placeholder while loading

**Acceptance Criteria**:
- [ ] Waveforms appear on audio clips
- [ ] Waveform accurately represents audio
- [ ] Rendering performant (no lag)
- [ ] Waveforms scale with zoom
- [ ] Cached to avoid regeneration
- [ ] Visual quality acceptable

**Files Created**:
- `src/utils/waveformGenerator.ts`

**Files Modified**:
- `src-tauri/src/ffmpeg.rs`
- `src-tauri/src/commands.rs`
- `src/components/Timeline/Timeline.tsx`

**Test Plan**:
1. Import video with audio
2. Add to timeline
3. Verify waveform appears
4. Zoom in/out and verify scaling
5. Compare waveform to audio playback

---

### Task F5.2: Volume Controls
**Module**: Timeline extension  
**Dependencies**: Task F5.1  
**Priority**: Medium

**Description**:
Add per-clip and per-track volume controls.

**Steps**:
1. Add volume property to clips and tracks:
   - Range 0-200% (0 = mute, 100 = original, 200 = boost)
   - Store in timeline state
2. Add UI controls:
   - Volume slider per track in track header
   - Volume slider for selected clip
   - Mute button (quick toggle to 0%)
3. Update export to apply volume:
   - Modify FFmpeg filter to apply volume
   - `volume=1.5` for 150%, etc.
4. Visual indication:
   - Volume level shown in UI
   - Muted tracks grayed out

**Acceptance Criteria**:
- [ ] Volume sliders adjust levels
- [ ] Mute button works instantly
- [ ] Export respects volume settings
- [ ] Muted tracks excluded from export
- [ ] UI shows current volume level
- [ ] Volume changes don't cause clipping (or warn)

**Files Modified**:
- `src/types/timeline.ts`
- `src/store/timelineStore.ts`
- `src/components/Timeline/Timeline.tsx`
- `src-tauri/src/ffmpeg.rs`

**Test Plan**:
1. Select clip and adjust volume
2. Export and verify volume applied
3. Mute track and verify export excludes it
4. Test with multiple clips at different volumes

---

### Task F5.3: Audio Fade In/Out
**Module**: Timeline extension  
**Dependencies**: Task F5.2  
**Priority**: Low

**Description**:
Add fade in/out effects to clips for smooth transitions.

**Steps**:
1. Add fade properties to clips:
   - `fadeInDuration` (seconds)
   - `fadeOutDuration` (seconds)
2. Add UI controls:
   - Fade handle on clip edges
   - Drag to adjust fade duration
   - Visual fade indicator (gradient)
3. Update export filter:
   - Apply `afade` filter in FFmpeg
   - `afade=t=in:st=0:d=2` for 2sec fade in
4. Fade waveform visualization to match

**Acceptance Criteria**:
- [ ] Fade handles draggable on clip edges
- [ ] Waveform shows fade gradient
- [ ] Export applies fade correctly
- [ ] Audio smoothly fades in/out
- [ ] Fade duration adjustable

**Files Modified**:
- `src/types/timeline.ts`
- `src/components/Timeline/Timeline.tsx`
- `src-tauri/src/ffmpeg.rs`

**Test Plan**:
1. Add fade in to clip start
2. Export and verify smooth fade
3. Add fade out to clip end
4. Verify both fades in export

---

## PHASE 6: Export Enhancements

### Task F6.1: Real Export Progress
**Module**: Module 5 (FFmpeg Integration)  
**Dependencies**: MVP Complete  
**Priority**: High

**Description**:
Parse FFmpeg output to show accurate export progress percentage.

**Steps**:
1. Update FFmpeg execution in Rust:
   - Capture stderr output in real-time
   - Parse progress lines (time=00:00:10.00)
   - Calculate percentage based on total duration
   - Send progress updates via Tauri events
2. Update frontend to receive events:
   - Listen for progress events
   - Update progress bar
   - Show ETA (estimated time remaining)
3. Handle FFmpeg errors in real-time:
   - Detect error messages
   - Cancel export on error
   - Show error to user

**Acceptance Criteria**:
- [ ] Progress bar shows accurate percentage
- [ ] Progress updates smoothly (not jumpy)
- [ ] ETA displayed and reasonable
- [ ] Errors detected and shown immediately
- [ ] Can cancel export mid-process
- [ ] Progress resets properly between exports

**Files Modified**:
- `src-tauri/src/ffmpeg.rs`
- `src/components/ExportDialog/ExportDialog.tsx`

**Test Plan**:
1. Start export of 2-minute timeline
2. Verify progress bar advances smoothly
3. Check ETA accuracy
4. Try canceling mid-export
5. Verify error handling with invalid settings

---

### Task F6.2: Export Presets
**Module**: Module 10 (Export Dialog)  
**Dependencies**: MVP Complete  
**Priority**: Medium

**Description**:
Add preset export configurations for common use cases.

**Steps**:
1. Define preset configurations:
   - YouTube (1080p, H.264, high quality)
   - Instagram (1080x1080, H.264, optimized)
   - Twitter (720p, H.264, max 2:20 duration)
   - High Quality (1080p, high bitrate)
   - Web Optimized (720p, lower bitrate)
2. Store presets in app state or config
3. Add preset selector to export dialog:
   - Dropdown showing preset names
   - Apply preset settings on selection
   - Can customize after selecting preset
4. Show preset details (resolution, format, etc.)

**Acceptance Criteria**:
- [ ] Presets available in export dialog
- [ ] Selecting preset applies settings
- [ ] Can modify preset settings before export
- [ ] Presets produce expected output
- [ ] Preset descriptions clear

**Files Modified**:
- `src/components/ExportDialog/ExportDialog.tsx`
- `src/types/timeline.ts`

**Test Plan**:
1. Open export dialog
2. Select each preset
3. Verify settings applied
4. Export with preset and verify output
5. Test customizing preset settings

---

### Task F6.3: Export to Cloud Storage
**Module**: New cloud integration module  
**Dependencies**: Task F6.1  
**Priority**: Low

**Description**:
Add ability to export directly to Google Drive or Dropbox.

**Steps**:
1. Research cloud storage APIs:
   - Google Drive API
   - Dropbox API
   - OAuth authentication flow
2. Add cloud provider selection to export dialog:
   - "Save to Drive" checkbox
   - "Save to Dropbox" checkbox
   - Account connection UI
3. Implement upload after export:
   - Export to temp file first
   - Upload to selected cloud service
   - Show upload progress
   - Delete temp file after upload
4. Handle authentication:
   - OAuth flow in Tauri window
   - Store tokens securely
5. Generate shareable link after upload

**Acceptance Criteria**:
- [ ] Can connect cloud accounts
- [ ] Export uploads to selected service
- [ ] Upload progress shown
- [ ] Shareable link provided after upload
- [ ] Temp files cleaned up
- [ ] Works with large files (5+ minutes)

**Files Created**:
- `src/services/cloudService.ts`

**Files Modified**:
- `src/components/ExportDialog/ExportDialog.tsx`
- `src-tauri/src/commands.rs` (for OAuth)

**Test Plan**:
1. Connect Google Drive account
2. Export video with cloud upload enabled
3. Verify upload completes
4. Check file appears in Drive
5. Test shareable link

---

## PHASE 7: Advanced Timeline Features

### Task F7.1: Clip Transitions
**Module**: Timeline extension  
**Dependencies**: MVP Complete  
**Priority**: Low

**Description**:
Add transition effects between clips (fade, dissolve, wipe).

**Steps**:
1. Define transition types:
   - Fade to black
   - Cross dissolve
   - Wipe (left, right, up, down)
   - Slide
2. Add transition data to timeline:
   - Store transition type and duration
   - Transitions apply between adjacent clips
3. Add UI for transitions:
   - Transition icon between clips
   - Click to edit transition
   - Transition selector dialog
   - Duration slider
4. Update export to apply transitions:
   - Use FFmpeg `xfade` filter
   - Calculate overlap timing
   - Handle audio crossfade

**Acceptance Criteria**:
- [ ] Transitions selectable between clips
- [ ] Multiple transition types available
- [ ] Duration adjustable
- [ ] Preview shows transition effect
- [ ] Export applies transitions correctly
- [ ] Audio transitions smoothly

**Files Created**:
- `src/components/Timeline/TransitionEditor.tsx`

**Files Modified**:
- `src/types/timeline.ts`
- `src/store/timelineStore.ts`
- `src-tauri/src/ffmpeg.rs`

**Test Plan**:
1. Add two adjacent clips
2. Add transition between them
3. Select different transition types
4. Export and verify transitions
5. Preview and verify smooth playback

---

### Task F7.2: Text Overlays
**Module**: Timeline extension  
**Dependencies**: Task F1.2 (Multi-track)  
**Priority**: Medium

**Description**:
Add text overlay capability for titles and captions.

**Steps**:
1. Create text clip type:
   - Separate from video clips
   - Properties: text, font, size, color, position
   - Duration on timeline
2. Add text editing UI:
   - Text input field
   - Font selector
   - Size slider
   - Color picker
   - Position selector (top, middle, bottom, custom)
3. Update export to render text:
   - Use FFmpeg `drawtext` filter
   - Apply font, size, color, position
   - Handle special characters
4. Add text layer on timeline

**Acceptance Criteria**:
- [ ] Can add text clips to timeline
- [ ] Text editable in UI
- [ ] Font, size, color customizable
- [ ] Text position adjustable
- [ ] Export renders text correctly
- [ ] Multiple text clips supported

**Files Created**:
- `src/components/Timeline/TextClipEditor.tsx`

**Files Modified**:
- `src/types/timeline.ts`
- `src/store/timelineStore.ts`
- `src-tauri/src/ffmpeg.rs`

**Test Plan**:
1. Add text clip to timeline
2. Enter text and customize appearance
3. Position over video clip
4. Export and verify text appears
5. Test multiple text overlays

---

### Task F7.3: Zoom to Fit / Zoom Presets
**Module**: Module 8 (Timeline)  
**Dependencies**: MVP Complete  
**Priority**: Low

**Description**:
Add quick zoom controls for timeline view.

**Steps**:
1. Add zoom preset buttons:
   - Zoom to fit (entire timeline visible)
   - Zoom to selection
   - Zoom in (+)
   - Zoom out (-)
   - Reset zoom (default)
2. Implement zoom to fit:
   - Calculate zoom level to fit duration in width
   - Constrain to min/max zoom levels
3. Keyboard shortcuts:
   - Cmd+0: Zoom to fit
   - Cmd++ : Zoom in
   - Cmd+- : Zoom out
4. Smooth zoom animation (optional)

**Acceptance Criteria**:
- [ ] Zoom to fit shows entire timeline
- [ ] Zoom presets work correctly
- [ ] Keyboard shortcuts functional
- [ ] Zoom constrained to reasonable limits
- [ ] Current zoom level displayed

**Files Modified**:
- `src/components/Timeline/Timeline.tsx`
- `src/store/timelineStore.ts`

**Test Plan**:
1. Create long timeline (2+ minutes)
2. Click zoom to fit
3. Verify entire timeline visible
4. Use keyboard shortcuts
5. Verify zoom in/out works

---

## PHASE 8: Performance Optimization

### Task F8.1: Thumbnail Strip Generation
**Module**: Module 6 (Video Service)  
**Dependencies**: MVP Complete  
**Priority**: Medium

**Description**:
Pre-generate thumbnail strips for smooth timeline scrubbing.

**Steps**:
1. Generate thumbnails on import:
   - Extract 1 frame per second using FFmpeg
   - Save as sprite sheet or individual files
   - Store paths in media file metadata
2. Use thumbnails for timeline:
   - Display thumbnails on clips
   - Show in tooltip when hovering
   - Use for scrubbing preview
3. Cache thumbnails on disk:
   - App data directory
   - Clean up on media removal
4. Progressive generation:
   - Generate critical frames first
   - Background generation for full strip

**Acceptance Criteria**:
- [ ] Thumbnails generated on import
- [ ] Timeline shows thumbnails on clips
- [ ] Hover shows thumbnail preview
- [ ] Scrubbing uses thumbnails (fast)
- [ ] Thumbnails cached for reuse
- [ ] No performance impact on import

**Files Modified**:
- `src/services/videoService.ts`
- `src-tauri/src/ffmpeg.rs`
- `src/components/Timeline/Timeline.tsx`

**Test Plan**:
1. Import video and verify thumbnails generate
2. Check thumbnail files on disk
3. Verify timeline shows thumbnails
4. Hover and verify preview tooltip
5. Re-import same file (should use cache)

---

### Task F8.2: Proxy Video Generation
**Module**: Video Service extension  
**Dependencies**: Task F8.1  
**Priority**: Low

**Description**:
Generate low-resolution proxy videos for smoother editing of large files.

**Steps**:
1. Add proxy generation on import:
   - Create 480p version using FFmpeg
   - Store alongside original
   - Optional: only for files >1080p
2. Add proxy toggle in settings:
   - Use proxies for preview
   - Use originals for export
3. Update preview player to use proxies
4. Transparent proxy switching

**Acceptance Criteria**:
- [ ] Proxies generated for large files
- [ ] Preview uses proxies when enabled
- [ ] Export always uses originals
- [ ] Proxy toggle in settings works
- [ ] Playback smoother with proxies
- [ ] Disk space managed (can delete proxies)

**Files Modified**:
- `src/services/videoService.ts`
- `src-tauri/src/ffmpeg.rs`
- `src/components/Preview/PreviewPlayer.tsx`

**Test Plan**:
1. Import 4K video
2. Verify proxy generated
3. Enable proxy mode
4. Verify smooth preview playback
5. Export and verify uses original
6. Check proxy file size

---

### Task F8.3: Virtual Scrolling for Large Timelines
**Module**: Module 8 (Timeline)  
**Dependencies**: MVP Complete  
**Priority**: Low

**Description**:
Optimize timeline rendering for projects with 100+ clips.

**Steps**:
1. Implement viewport culling:
   - Only render clips visible in current view
   - Calculate visible region based on scroll
   - Recalculate on scroll/zoom
2. Use Konva layer caching:
   - Cache static elements
   - Only redraw moving elements
3. Optimize clip rendering:
   - Simplify off-screen clips
   - Reduce detail at low zoom
4. Benchmark with 100+ clips

**Acceptance Criteria**:
- [ ] Timeline smooth with 100+ clips
- [ ] Scrolling doesn't lag
- [ ] Zoom remains responsive
- [ ] Memory usage reasonable
- [ ] Frame rate stays >30fps

**Files Modified**:
- `src/components/Timeline/Timeline.tsx`

**Test Plan**:
1. Create timeline with 100+ clips
2. Verify rendering performance
3. Scroll through entire timeline
4. Zoom in/out repeatedly
5. Monitor memory usage
6. Verify no visual glitches

---

## PHASE 9: User Experience Polish

### Task F9.1: Welcome Screen
**Module**: New UI component  
**Dependencies**: MVP Complete  
**Priority**: Low

**Description**:
Add welcome screen for first-time users.

**Steps**:
1. Create welcome screen component:
   - App logo and name
   - Quick start options:
     - New project
     - Open recent
     - Import media
   - Tutorial link (optional)
2. Show on first launch or when no project open
3. Add "Don't show again" checkbox
4. Recent projects list (from F4)

**Acceptance Criteria**:
- [ ] Welcome screen shows on first launch
- [ ] Options clearly labeled
- [ ] Can dismiss welcome screen
- [ ] Recent projects clickable
- [ ] Professional appearance

**Files Created**:
- `src/components/WelcomeScreen.tsx`

**Files Modified**:
- `src/App.tsx`

---

### Task F9.2: Tooltips and Help
**Module**: UI enhancement  
**Dependencies**: MVP Complete  
**Priority**: Low

**Description**:
Add helpful tooltips throughout the application.

**Steps**:
1. Add tooltip component (or use library)
2. Add tooltips to all buttons/controls:
   - Import, Export, Record
   - Timeline controls
   - Track controls
   - Playback controls
3. Include keyboard shortcuts in tooltips
4. Add context-sensitive help:
   - "?" icon in toolbar
   - Help panel or external documentation link

**Acceptance Criteria**:
- [ ] All major buttons have tooltips
- [ ] Tooltips appear on hover
- [ ] Tooltips include shortcuts where applicable
- [ ] Help documentation accessible
- [ ] Tooltips not intrusive

**Files Modified**:
- All component files (add tooltips)

**Test Plan**:
1. Hover over each button
2. Verify tooltip appears
3. Verify shortcuts listed
4. Check help documentation link

---

### Task F9.3: Theme System
**Module**: New theming module  
**Dependencies**: MVP Complete  
**Priority**: Low

**Description**:
Add light/dark theme toggle and custom themes.

**Steps**:
1. Create theme system:
   - Define color palette for dark theme
   - Define color palette for light theme
   - Store theme preference
2. Update all components to use theme colors:
   - Use CSS variables or Tailwind dark mode
   - Ensure contrast ratios meet accessibility
3. Add theme toggle in settings:
   - Dropdown or switch
   - Apply theme immediately
   - Persist preference
4. Support system theme preference (optional)

**Acceptance Criteria**:
- [ ] Dark theme (default) works
- [ ] Light theme available
- [ ] Theme switch updates entire app
- [ ] Preference persists across sessions
- [ ] Both themes accessible (good contrast)

**Files Created**:
- `src/utils/theme.ts`

**Files Modified**:
- `src/App.tsx`
- All component styling

**Test Plan**:
1. Toggle to light theme
2. Verify all UI elements readable
3. Switch back to dark theme
4. Restart app and verify theme persists
5. Check accessibility contrast ratios

---

## PHASE 10: Final Testing & Documentation

### Task F10.1: Comprehensive Manual Testing
**Module**: All  
**Dependencies**: All previous tasks  
**Priority**: Critical

**Description**:
Full end-to-end testing of complete application.

**Test Scenarios**:

**Multi-Track Editing**:
- [ ] Create project with 3 video tracks
- [ ] Add clips to each track
- [ ] Verify overlay compositing in preview
- [ ] Export and verify multi-track output

**Recording**:
- [ ] Record screen
- [ ] Record webcam
- [ ] Record screen + webcam simultaneously
- [ ] Verify audio captured correctly
- [ ] Add recordings to timeline

**Advanced Editing**:
- [ ] Split clips multiple times
- [ ] Undo/redo 10+ operations
- [ ] Add transitions between clips
- [ ] Add text overlays
- [ ] Trim clips precisely
- [ ] Verify snap-to-edges

**Project Management**:
- [ ] Save project
- [ ] Close and reopen project
- [ ] Verify auto-save works
- [ ] Recover from auto-save
- [ ] Load project with missing media

**Audio**:
- [ ] Verify waveforms display
- [ ] Adjust volume on clips and tracks
- [ ] Mute tracks
- [ ] Add audio fades
- [ ] Mix multiple audio sources

**Export**:
- [ ] Export with multiple presets
- [ ] Verify progress shows accurately
- [ ] Export to cloud (if implemented)
- [ ] Export large project (10+ minutes)
- [ ] Cancel export mid-process

**Performance**:
- [ ] Timeline with 50+ clips responsive
- [ ] Preview plays smoothly
- [ ] No memory leaks over 30 minutes
- [ ] Export completes reliably
- [ ] App launch under 5 seconds

**User Experience**:
- [ ] All keyboard shortcuts work
- [ ] Tooltips helpful and accurate
- [ ] Themes switch correctly
- [ ] Welcome screen functional
- [ ] Error messages clear

---

### Task F10.2: Bug Fixes and Refinement
**Module**: All  
**Dependencies**: Task F10.1  
**Priority**: Critical

**Description**:
Fix all bugs discovered during comprehensive testing.

**Process**:
1. Document each bug with:
   - Severity (critical, high, medium, low)
   - Steps to reproduce
   - Expected vs actual behavior
2. Prioritize critical and high severity bugs
3. Fix systematically from highest to lowest priority
4. Re-test after each fix
5. Regression test related features

**Acceptance Criteria**:
- [ ] Zero critical bugs
- [ ] Zero high severity bugs
- [ ] Medium/low bugs documented for future
- [ ] All features work as designed
- [ ] Application stable and reliable

---

### Task F10.3: User Documentation
**Module**: Documentation  
**Dependencies**: All features complete  
**Priority**: High

**Description**:
Create comprehensive user documentation.

**Documentation Sections**:
1. **Getting Started**:
   - Installation instructions
   - First project walkthrough
   - Interface overview
2. **Importing Media**:
   - Supported formats
   - Drag and drop
   - Media library management
3. **Timeline Editing**:
   - Adding clips
   - Moving and trimming
   - Multi-track editing
   - Splitting clips
4. **Recording**:
   - Screen recording
   - Webcam recording
   - Audio settings
5. **Export**:
   - Export settings explained
   - Presets guide
   - Cloud export
6. **Keyboard Shortcuts**:
   - Complete reference
7. **Troubleshooting**:
   - Common issues
   - Performance tips
   - FAQ

**Deliverables**:
- User manual (PDF)
- In-app help system
- Video tutorials (optional)

**Acceptance Criteria**:
- [ ] All features documented
- [ ] Screenshots included
- [ ] Clear, concise writing
- [ ] Organized by task/feature
- [ ] Accessible from app

**Files Created**:
- `docs/user-manual.pdf`
- `src/components/Help/HelpDocs.tsx`

---

### Task F10.4: Performance Benchmarking
**Module**: All  
**Dependencies**: All tasks complete  
**Priority**: High

**Description**:
Benchmark application performance against targets.

**Benchmarks**:
1. **App Launch Time**:
   - Target: <5 seconds
   - Measure from click to UI ready
2. **Timeline Rendering**:
   - Target: 60fps with 50 clips
   - Target: 30fps with 100 clips
3. **Preview Playback**:
   - Target: 30fps minimum
   - No dropped frames
4. **Export Speed**:
   - Measure time for various project lengths
   - Compare to real-time (1 min video = ? min export)
5. **Memory Usage**:
   - Baseline: app idle
   - With media loaded
   - During playback
   - After 30 minutes editing
   - Target: <1GB for typical project

**Process**:
1. Use dev tools for profiling
2. Record metrics for each benchmark
3. Compare against targets
4. Identify bottlenecks
5. Optimize if needed
6. Re-benchmark after optimization

**Acceptance Criteria**:
- [ ] All targets met or exceeded
- [ ] No memory leaks detected
- [ ] Performance acceptable on target hardware
- [ ] Benchmarks documented

---

### Task F10.5: Final Build and Release
**Module**: Build and deployment  
**Dependencies**: All tasks complete  
**Priority**: Critical

**Description**:
Create final production build and prepare for distribution.

**Steps**:
1. Update version number to 1.0.0
2. Run full production build
3. Test packaged .app thoroughly:
   - Fresh install test
   - All features functional
   - No dev tools or console logs
4. Create installer (.dmg):
   - Professional appearance
   - Clear instructions
   - App icon correct
5. Code signing (if certificates available):
   - Sign .app bundle
   - Notarize for macOS (optional for MVP)
6. Prepare release assets:
   - Application bundle
   - Installer DMG
   - User documentation
   - Release notes
7. Test on clean macOS system

**Acceptance Criteria**:
- [ ] Version 1.0.0 built successfully
- [ ] .dmg installer works on fresh system
- [ ] No crashes or critical bugs
- [ ] App meets all full product requirements
- [ ] Documentation complete
- [ ] Ready for distribution

**Deliverables**:
- `CapcutClone-v1.0.0.dmg`
- User documentation
- Release notes

---

## Feature Completion Checklist

### Core Features (Must Have)
- [ ] Multi-track timeline (video + audio)
- [ ] Screen recording
- [ ] Webcam recording
- [ ] Project save/load
- [ ] Audio waveforms and volume controls
- [ ] Real export progress
- [ ] Undo/redo system
- [ ] Keyboard shortcuts
- [ ] Split clip functionality
- [ ] Snap to edges

### Advanced Features (Should Have)
- [ ] Export presets
- [ ] Thumbnail strips
- [ ] Text overlays
- [ ] Transitions
- [ ] Audio fades
- [ ] Cloud export
- [ ] Welcome screen
- [ ] Theme system

### Polish Features (Nice to Have)
- [ ] Proxy videos
- [ ] Virtual scrolling optimization
- [ ] Comprehensive tooltips
- [ ] In-app help
- [ ] Auto-save and recovery

---

## Quality Standards

**Performance**:
- Timeline responsive with 50+ clips
- Preview playback at 30fps minimum
- Export completes without crashes
- App launch under 5 seconds
- No memory leaks during extended use

**Stability**:
- Zero critical bugs
- Graceful error handling
- Data loss prevention (auto-save)
- Reliable export process

**User Experience**:
- Intuitive interface
- Helpful error messages
- Professional appearance
- Comprehensive documentation

---

## Post-Release Considerations

**Version 1.1 Features** (Future):
- Plugin system for effects
- Color grading tools
- Advanced audio editing
- Collaboration features (multi-user)
- Motion tracking
- Chroma key (green screen)
- 360° video support
- Hardware acceleration (GPU)
- Mobile companion app

**Known Limitations**:
- macOS only (no Windows/Linux)
- No 4K preview (proxies recommended)
- Limited effect library
- No cloud collaboration

---

## Success Metrics

Full product is complete when:
1. ✅ All core features implemented and tested
2. ✅ Performance targets met
3. ✅ Zero critical bugs
4. ✅ User documentation complete
5. ✅ Final build packaged and tested
6. ✅ Ready for distribution

This represents a professional, feature-complete video editing application suitable for creators and professionals.
