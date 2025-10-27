# MVP Task List - Video Editor

**Version**: 1.0  
**Target**: Minimum Viable Product  
**Last Updated**: 2025-10-27

## Overview

This task list defines all work required to deliver the MVP. The MVP proves we can handle media files in a desktop context with the fundamentals: import, display, timeline manipulation, and export.

**MVP Success Criteria**:
- ✅ Desktop app launches successfully
- ✅ Users can import video files (MP4/MOV)
- ✅ Timeline displays imported clips visually
- ✅ Preview player shows current frame at playhead
- ✅ Users can trim clips (adjust start/end)
- ✅ Export produces valid MP4 file
- ✅ App can be packaged as distributable .dmg

---

## Task Organization

Tasks are grouped by functional area and ordered for optimal implementation flow. Each task includes:
- **Module Reference**: Which architecture module(s) it implements
- **Dependencies**: Prerequisites that must be complete first
- **Description**: Clear implementation guidance
- **Acceptance Criteria**: How to verify completion

**Implementation Strategy**: Start with foundational modules, then build features incrementally. Test each component in isolation before integration.

---

## PHASE 1: Project Foundation

### Task 1.1: Initialize Tauri Project
**Module**: Module 1 (Project Structure)  
**Dependencies**: None  
**Priority**: Critical

**Description**:
Create new Tauri + React + TypeScript project with Vite. Set up directory structure as defined in architecture.

**Steps**:
1. Run `npm create tauri-app` with React + TypeScript template
2. Create directory structure:
   - `src/components/` with subdirectories
   - `src/store/` for state management
   - `src/services/` for business logic
   - `src/types/` for TypeScript definitions
   - `src/utils/` for helpers
3. Install core dependencies: `zustand`, `konva`, `react-konva`, `uuid`
4. Install TailwindCSS and configure
5. Verify dev server runs: `npm run tauri dev`

**Acceptance Criteria**:
- [ ] `npm run tauri dev` launches app window
- [ ] Hot reload works (changes reflect immediately)
- [ ] Directory structure matches architecture
- [ ] All dependencies installed and importable
- [ ] TailwindCSS classes work in components

**Files Created**:
- Project root with proper structure
- `tailwind.config.js`
- `vite.config.ts` (verify Tauri config)

---

### Task 1.2: Configure Tauri Settings
**Module**: Module 1 (Project Structure)  
**Dependencies**: Task 1.1  
**Priority**: Critical

**Description**:
Configure `tauri.conf.json` with proper permissions and settings for video editing app.

**Steps**:
1. Open `src-tauri/tauri.conf.json`
2. Set bundle identifier: `com.videoeditor.app`
3. Configure allowlist:
   - Enable `shell.execute` and `shell.sidecar` for FFmpeg
   - Enable `dialog.open` and `dialog.save` for file pickers
   - Enable `fs.readFile` and `fs.writeFile` with proper scopes
4. Set bundle target to `dmg` (macOS only)
5. Add resources path for FFmpeg binary (prepare for later)

**Acceptance Criteria**:
- [ ] `tauri.conf.json` has restrictive permissions (only what's needed)
- [ ] Bundle settings configured for macOS
- [ ] File system scope includes necessary directories
- [ ] App identifier is unique and proper

**Files Modified**:
- `src-tauri/tauri.conf.json`

---

### Task 1.3: Define TypeScript Types
**Module**: Module 2 (Type Definitions)  
**Dependencies**: Task 1.1  
**Priority**: High

**Description**:
Create all TypeScript interfaces for domain models as specified in Module 2.

**Steps**:
1. Create `src/types/media.ts` with:
   - `MediaFile` interface
   - `MediaMetadata` interface
2. Create `src/types/timeline.ts` with:
   - `TimelineClip` interface
   - `TimelineTrack` interface
   - `TimelineState` interface
   - `ExportSettings` interface
3. Export all types from index file if desired
4. Add JSDoc comments for complex fields

**Acceptance Criteria**:
- [ ] All interfaces defined with correct property types
- [ ] IDs are typed as `string` (for UUIDs)
- [ ] Times are in seconds (`number`)
- [ ] No TypeScript errors when importing types
- [ ] Interfaces match architecture specification exactly

**Files Created**:
- `src/types/media.ts`
- `src/types/timeline.ts`

---

### Task 1.4: Create Zustand Stores
**Module**: Module 3 (State Management)  
**Dependencies**: Task 1.3  
**Priority**: High

**Description**:
Implement global state stores using Zustand as specified in Module 3.

**Steps**:
1. Create `src/store/mediaStore.ts`:
   - Implement `MediaState` interface
   - Add all CRUD actions for media files
   - Export `useMediaStore` hook
2. Create `src/store/timelineStore.ts`:
   - Implement `TimelineStoreState` interface
   - Add actions for clips and tracks
   - Include duration recalculation logic
   - Initialize with one default track
3. Create `src/store/appStore.ts`:
   - Implement export progress state
   - Add error handling state
4. Test stores in isolation (create simple test component)

**Acceptance Criteria**:
- [ ] All three stores created and exportable
- [ ] Store actions work (test in dev tools)
- [ ] Initial state is correct
- [ ] Duration recalculates when clips added/removed
- [ ] No TypeScript errors
- [ ] Zustand devtools show state updates

**Files Created**:
- `src/store/mediaStore.ts`
- `src/store/timelineStore.ts`
- `src/store/appStore.ts`

---

## PHASE 2: Backend & FFmpeg Integration

### Task 2.1: Download and Bundle FFmpeg
**Module**: Module 5 (FFmpeg Integration)  
**Dependencies**: Task 1.2  
**Priority**: Critical

**Description**:
Download FFmpeg and FFprobe binaries for macOS and add to project resources.

**Steps**:
1. Download FFmpeg static build for macOS from official source or homebrew
2. Extract `ffmpeg` and `ffprobe` binaries
3. Create `src-tauri/binaries/` directory
4. Copy binaries to `src-tauri/binaries/`
5. Make executable: `chmod +x src-tauri/binaries/ffmpeg src-tauri/binaries/ffprobe`
6. Update `tauri.conf.json` resources array to include binaries
7. Verify binaries are included in dev build

**Acceptance Criteria**:
- [ ] FFmpeg binary (~50-80MB) in `src-tauri/binaries/`
- [ ] FFprobe binary in same directory
- [ ] Binaries are executable (check permissions)
- [ ] `tauri.conf.json` resources includes binary paths
- [ ] Binaries accessible in dev mode (test with path resolution)

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
2. Implement `FFmpegExecutor` struct with:
   - Constructor that resolves bundled binary paths
   - `get_metadata()` method using FFprobe
   - `parse_metadata()` helper to parse JSON output
   - `parse_fps()` helper for frame rate strings
   - `generate_thumbnail()` method
   - `export_video()` method (basic implementation)
   - `build_filter_complex()` for concatenation
3. Add necessary dependencies to `Cargo.toml`:
   - `serde` and `serde_json` for JSON parsing
   - `tauri` APIs
4. Handle errors gracefully with `Result<T, String>`
5. Test binary path resolution in dev mode

**Acceptance Criteria**:
- [ ] `FFmpegExecutor` compiles without errors
- [ ] Binary paths resolve correctly (test with debug output)
- [ ] FFprobe JSON parsing works
- [ ] FPS parsing handles fractional rates (e.g., "30000/1001")
- [ ] Error messages include stderr output
- [ ] All methods return `Result` for error handling

**Files Created**:
- `src-tauri/src/ffmpeg.rs`

**Files Modified**:
- `src-tauri/Cargo.toml` (add dependencies)

---

### Task 2.3: Create Tauri Commands
**Module**: Module 4 (Tauri Backend Commands)  
**Dependencies**: Task 2.2  
**Priority**: Critical

**Description**:
Define Tauri IPC commands that frontend can invoke.

**Steps**:
1. Create `src-tauri/src/commands.rs`
2. Define structs: `MediaMetadata`, `ClipInfo`
3. Implement commands:
   - `get_media_metadata(file_path: String)` -> calls FFmpegExecutor
   - `generate_thumbnail(file_path, timestamp)` -> calls FFmpegExecutor
   - `export_video(clips, output_path, resolution, fps)` -> calls FFmpegExecutor
4. Update `src-tauri/src/main.rs`:
   - Add `mod commands;` and `mod ffmpeg;`
   - Register commands in `invoke_handler`
5. Test commands using Tauri's invoke from dev tools

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

## PHASE 3: Media Import & Library

### Task 3.1: Create Video Service
**Module**: Module 6 (Frontend Video Service)  
**Dependencies**: Task 2.3, Task 1.4  
**Priority**: High

**Description**:
Frontend service layer that wraps Tauri commands and manages media operations.

**Steps**:
1. Create `src/services/videoService.ts`
2. Implement `VideoService` class with:
   - `importVideos()` - opens file dialog and processes selections
   - `createMediaFile()` - private method to create MediaFile from path
   - `generateThumbnail()` - wrapper for Tauri command
   - `exportVideo()` - wrapper for export command
   - `getVideoDuration()` - quick duration lookup
3. Export singleton instance: `export const videoService = new VideoService()`
4. Add error handling for all Tauri invokes
5. Handle file dialog cancellation gracefully

**Acceptance Criteria**:
- [ ] VideoService compiles without errors
- [ ] All methods properly typed with TypeScript
- [ ] File dialog opens when `importVideos()` called
- [ ] Metadata fetched successfully for test video
- [ ] Thumbnail generated as base64 data URL
- [ ] Errors logged to console
- [ ] Service can be imported and used in components

**Files Created**:
- `src/services/videoService.ts`

---

### Task 3.2: Build Media Library Component
**Module**: Module 7 (Media Library Component)  
**Dependencies**: Task 3.1, Task 1.4  
**Priority**: High

**Description**:
Create UI component for displaying and managing imported media files.

**Steps**:
1. Create `src/components/MediaLibrary/MediaLibrary.tsx`
2. Implement main component:
   - Import button with loading state
   - Grid layout for media cards
   - Empty state message
3. Implement `MediaCard` sub-component:
   - Thumbnail display
   - Metadata (duration, resolution, fps)
   - Remove button
   - Selection highlight
4. Connect to `useMediaStore` for state
5. Use `videoService.importVideos()` for import
6. Add Tailwind styling for professional look
7. Handle long filenames with truncation

**Acceptance Criteria**:
- [ ] Component renders without errors
- [ ] Import button opens file dialog
- [ ] Selected files appear in library
- [ ] Thumbnails display correctly
- [ ] Metadata formatted properly (duration as MM:SS)
- [ ] Remove button works and confirms action
- [ ] Selection state highlights card
- [ ] Empty state shows helpful message
- [ ] Responsive layout works at different widths

**Files Created**:
- `src/components/MediaLibrary/MediaLibrary.tsx`

**Test Plan**:
1. Click "Import Videos" and select test file
2. Verify thumbnail and metadata appear
3. Click card to select (should highlight)
4. Click remove and confirm deletion
5. Import multiple files and verify grid layout

---

## PHASE 4: Timeline Editor

### Task 4.1: Create Timeline Canvas Component
**Module**: Module 8 (Timeline Canvas Component)  
**Dependencies**: Task 1.4  
**Priority**: High

**Description**:
Build timeline UI using Konva.js for rendering tracks and clips.

**Steps**:
1. Create `src/components/Timeline/Timeline.tsx`
2. Implement main `Timeline` component:
   - Konva Stage with dynamic width
   - Background layer
   - Time ruler with second markers
   - Track layers
   - Playhead indicator
3. Implement helper components:
   - `TimeRuler` - shows time markers
   - `TrackLayer` - renders single track with clips
   - `ClipRect` - individual clip rectangle
   - `Playhead` - red vertical line
   - `TimelineControls` - play/pause, zoom controls
4. Implement coordinate conversion:
   - `timeToX(time)` - convert seconds to pixels
   - `xToTime(x)` - convert pixels to seconds
5. Make clips draggable (basic implementation)
6. Update responsive width on window resize

**Acceptance Criteria**:
- [ ] Timeline renders with proper dimensions
- [ ] Time ruler shows second markers
- [ ] Default track visible
- [ ] Playhead renders at position 0
- [ ] Zoom slider changes pixels-per-second
- [ ] Play/pause button updates state
- [ ] Timeline scrolls horizontally if content exceeds width
- [ ] No performance issues with canvas rendering

**Files Created**:
- `src/components/Timeline/Timeline.tsx`

**Test Plan**:
1. Launch app and verify timeline renders
2. Adjust zoom slider (timeline should scale)
3. Verify time ruler updates with zoom
4. Check playhead is visible at 0 seconds

---

### Task 4.2: Implement Add Clip to Timeline
**Module**: Module 8 (Timeline Canvas Component)  
**Dependencies**: Task 4.1, Task 3.2  
**Priority**: High

**Description**:
Enable dragging media files from library onto timeline to create clips.

**Steps**:
1. Add drag handlers to MediaCard component:
   - `onDragStart` - set dragged media ID in state/dataTransfer
   - `draggable={true}` attribute
2. Add drop handlers to Timeline component:
   - `onDrop` - create new TimelineClip
   - `onDragOver` - prevent default and show drop indicator
3. Implement clip creation logic:
   - Generate UUID for clip ID
   - Calculate drop position on timeline (convert x to time)
   - Set clip duration from media file duration
   - Default trimStart/trimEnd to 0
   - Add to appropriate track
4. Update timeline store with new clip
5. Render clip on timeline canvas

**Acceptance Criteria**:
- [ ] Media cards are draggable
- [ ] Timeline accepts dropped media
- [ ] Clip appears on timeline at drop position
- [ ] Clip width represents duration (scaled by zoom)
- [ ] Clip shows media filename
- [ ] Multiple clips can be added
- [ ] Timeline duration extends to accommodate clips
- [ ] Clips snap to track boundaries

**Test Plan**:
1. Import video file
2. Drag from media library to timeline
3. Verify clip appears at correct position
4. Verify clip width matches duration
5. Add multiple clips and verify layout

---

### Task 4.3: Implement Clip Dragging on Timeline
**Module**: Module 8 (Timeline Canvas Component)  
**Dependencies**: Task 4.2  
**Priority**: Medium

**Description**:
Allow users to reposition clips on timeline by dragging.

**Steps**:
1. Update `ClipRect` component:
   - Already has `draggable` prop in architecture
   - Implement `onDragEnd` handler
   - Calculate new startTime from final x position
   - Update clip in store via `updateClip` action
2. Add visual feedback during drag:
   - Change clip color while dragging
   - Show semi-transparent preview
3. Prevent negative positions (clips can't start before 0)
4. Reset Konva node position after drag (store update re-renders)
5. Recalculate timeline duration if needed

**Acceptance Criteria**:
- [ ] Clips can be dragged left/right on timeline
- [ ] Clip position updates in store after drag
- [ ] Timeline re-renders with new position
- [ ] Clips cannot be dragged before timeline start
- [ ] Visual feedback shows dragging state
- [ ] Smooth dragging experience (no jank)
- [ ] Timeline duration updates if clip extends past current end

**Test Plan**:
1. Add clip to timeline
2. Drag clip to different position
3. Verify clip updates position
4. Try dragging before timeline start (should clamp to 0)
5. Drag clip far right (timeline duration should extend)

---

## PHASE 5: Video Preview

### Task 5.1: Create Preview Player Component
**Module**: Module 9 (Video Preview Player)  
**Dependencies**: Task 1.4  
**Priority**: High

**Description**:
Build video player that shows current frame at playhead position.

**Steps**:
1. Create `src/components/Preview/PreviewPlayer.tsx`
2. Implement main `PreviewPlayer` component:
   - HTML5 `<video>` element with ref
   - Calculate current clip at playhead position
   - Set video src to current clip's media file path
   - Calculate video time from playhead (considering trim)
3. Implement `PreviewControls` sub-component:
   - Play/Pause button
   - Seek slider (updates playhead position)
   - Time display (current / total)
4. Sync video playback with timeline:
   - Update video.currentTime when playhead changes
   - Update playhead when video plays (RAF loop)
   - Pause when reaching clip end
5. Handle no-clip state (empty timeline)

**Acceptance Criteria**:
- [ ] Video element displays when clip on timeline
- [ ] Correct frame shown at playhead position
- [ ] Play button starts playback
- [ ] Playhead advances during playback
- [ ] Pause button stops playback
- [ ] Seek slider updates playhead
- [ ] Time display shows current and total time
- [ ] Empty state shows when no clips
- [ ] Video pauses at clip end
- [ ] Smooth playback (30fps minimum)

**Files Created**:
- `src/components/Preview/PreviewPlayer.tsx`

**Test Plan**:
1. Add clip to timeline
2. Verify video loads and shows first frame
3. Click play and verify smooth playback
4. Verify playhead advances with video
5. Click pause and verify video stops
6. Drag seek slider and verify video seeks
7. Play to end of clip and verify auto-pause

---

### Task 5.2: Sync Preview with Timeline Playhead
**Module**: Module 9 (Video Preview Player)  
**Dependencies**: Task 5.1, Task 4.1  
**Priority**: High

**Description**:
Ensure preview player and timeline playhead stay synchronized.

**Steps**:
1. Update preview player to watch `playheadPosition` from store
2. Update video element's currentTime when playhead changes externally
3. Use requestAnimationFrame to update playhead during playback
4. Calculate correct video time considering clip's trim settings
5. Handle playhead scrubbing (direct position updates)
6. Update timeline's playhead visual during playback
7. Handle edge case: playhead moves to clip with different media file

**Acceptance Criteria**:
- [ ] Clicking timeline updates preview video
- [ ] Playing video updates timeline playhead
- [ ] Timeline playhead and video stay in sync
- [ ] Scrubbing timeline seeks video correctly
- [ ] Trim settings applied correctly to video time
- [ ] Switching between clips loads correct video
- [ ] No visual lag between playhead and video

**Test Plan**:
1. Play video and watch timeline playhead move
2. Click on timeline (different position)
3. Verify video jumps to clicked position
4. Add multiple clips and verify seamless playback
5. Test trim settings (verify offset applied)

---

## PHASE 6: Basic Editing

### Task 6.1: Implement Clip Selection
**Module**: Module 8 (Timeline Canvas Component)  
**Dependencies**: Task 4.2  
**Priority**: Medium

**Description**:
Allow users to select clips on timeline for editing operations.

**Steps**:
1. Add `selectedClipId` to timeline store
2. Add `selectClip(clipId)` action to timeline store
3. Update `ClipRect` component:
   - Add click handler to select clip
   - Visual styling for selected state (border/glow)
4. Add keyboard shortcut to delete selected clip (Delete key)
5. Show selected clip info in UI (optional for MVP)

**Acceptance Criteria**:
- [ ] Clicking clip selects it
- [ ] Selected clip shows visual distinction
- [ ] Only one clip selected at a time
- [ ] Clicking empty space deselects
- [ ] Delete key removes selected clip
- [ ] Selection state persists in store

**Test Plan**:
1. Click on clip (should highlight)
2. Click another clip (first deselects, second selects)
3. Press Delete key (selected clip removes)
4. Verify store updates correctly

---

### Task 6.2: Implement Basic Trim Controls
**Module**: Module 8 (Timeline Canvas Component)  
**Dependencies**: Task 6.1  
**Priority**: Medium

**Description**:
Add simple trim controls to adjust clip start/end points (trim from source video).

**Steps**:
1. Add trim handles to selected clip:
   - Small rectangles on left/right edges of clip
   - Different color/style than clip body
2. Make trim handles draggable:
   - Left handle adjusts `trimStart`
   - Right handle adjusts `trimEnd`
   - Update clip duration when trimming
3. Implement trim constraints:
   - Cannot trim beyond original media duration
   - Minimum clip duration (e.g., 0.1 seconds)
4. Update clip visual width when trimmed
5. Show trim values in UI (optional tooltip/overlay)

**Acceptance Criteria**:
- [ ] Selected clip shows trim handles
- [ ] Left handle trims from start
- [ ] Right handle trims from end
- [ ] Clip width updates during trim
- [ ] Cannot trim beyond media bounds
- [ ] Preview shows correct trimmed content
- [ ] Trim values stored in clip state
- [ ] Smooth dragging experience

**Test Plan**:
1. Select clip and verify trim handles appear
2. Drag left handle inward (trimStart increases)
3. Play preview and verify start is trimmed
4. Drag right handle inward (duration decreases)
5. Verify clip width updates
6. Try over-trimming (should clamp to valid range)

---

## PHASE 7: Export Functionality

### Task 7.1: Create Export Dialog UI
**Module**: Module 10 (Export Dialog Component)  
**Dependencies**: Task 1.4  
**Priority**: High

**Description**:
Build modal dialog for export settings and progress display.

**Steps**:
1. Create `src/components/ExportDialog/ExportDialog.tsx`
2. Implement modal overlay with:
   - Resolution dropdown (720p, 1080p, source)
   - FPS dropdown (24, 30, 60)
   - Export button
   - Cancel button
3. Add export progress view:
   - Progress bar
   - Percentage display
   - Status message
4. Connect to app store for export state
5. Use Tauri save dialog for output path selection
6. Style with Tailwind (professional modal appearance)

**Acceptance Criteria**:
- [ ] Dialog opens when Export button clicked
- [ ] Modal overlay dims background
- [ ] Resolution and FPS selectors work
- [ ] Export button triggers save file dialog
- [ ] Cancel button closes dialog
- [ ] Progress bar shows during export
- [ ] Cannot close dialog during export
- [ ] Success/error messages display

**Files Created**:
- `src/components/ExportDialog/ExportDialog.tsx`

**Test Plan**:
1. Click Export button in header
2. Verify modal opens with settings
3. Change resolution and FPS
4. Click Cancel (should close)
5. Open again and verify defaults

---

### Task 7.2: Implement Export Video Functionality
**Module**: Module 10 (Export Dialog Component), Module 6 (Video Service)  
**Dependencies**: Task 7.1, Task 2.3  
**Priority**: Critical

**Description**:
Wire up export dialog to actually export video via FFmpeg.

**Steps**:
1. Update export handler in ExportDialog:
   - Collect all clips from timeline
   - Sort by start time
   - Map to `ClipInfo` format
   - Call `videoService.exportVideo()`
2. Handle export progress:
   - Set `isExporting` to true
   - Show progress UI
   - For MVP: indeterminate progress (50%)
   - Set to 100% on completion
3. Handle export errors:
   - Show error message in alert
   - Log to console
   - Reset export state
4. Handle success:
   - Show success message
   - Close dialog
   - Reset state
5. Test with single clip
6. Test with multiple clips

**Acceptance Criteria**:
- [ ] Export dialog calls backend correctly
- [ ] FFmpeg processes clips in correct order
- [ ] Output file created at selected path
- [ ] Output video plays in external player
- [ ] Video contains all clips in sequence
- [ ] Resolution/FPS settings applied
- [ ] Progress UI shows during export
- [ ] Success message on completion
- [ ] Error handling works (try invalid settings)

**Test Plan**:
1. Add 2-3 clips to timeline
2. Click Export and choose settings
3. Select output path
4. Wait for export (watch console for FFmpeg output)
5. Open exported video in QuickTime/VLC
6. Verify all clips present and in order
7. Check resolution matches setting
8. Test error case (invalid output path)

---

## PHASE 8: Application Integration

### Task 8.1: Build Main Application Layout
**Module**: Module 11 (Main Application Layout)  
**Dependencies**: All component tasks (3.2, 4.1, 5.1, 7.1)  
**Priority**: High

**Description**:
Compose all components into final application layout.

**Steps**:
1. Create/update `src/App.tsx`
2. Implement layout structure:
   - Header with app title and Export button
   - Three-pane layout (sidebar, main area)
   - Media Library in left sidebar (fixed width)
   - Preview Player in top-right (flexible)
   - Timeline at bottom (fixed height)
3. Add state for export dialog visibility
4. Wire Export button to open dialog
5. Apply global styling and theme
6. Ensure responsive behavior

**Acceptance Criteria**:
- [ ] All components render in correct positions
- [ ] Layout uses full screen height
- [ ] Sidebar has fixed width (320px)
- [ ] Preview takes remaining vertical space
- [ ] Timeline has fixed height at bottom
- [ ] Export button opens dialog
- [ ] No scrolling on main window (only within panels)
- [ ] Professional appearance with dark theme

**Files Created/Modified**:
- `src/App.tsx`

**Test Plan**:
1. Launch app and verify layout
2. Verify all three sections visible
3. Resize window (layout should adjust)
4. Test full workflow: import → add to timeline → preview → export

---

### Task 8.2: Add Global Error Handling
**Module**: Module 3 (State Management)  
**Dependencies**: Task 8.1  
**Priority**: Medium

**Description**:
Implement application-wide error handling and display.

**Steps**:
1. Add error toast/snackbar component
2. Update app store error state usage
3. Catch and display errors from:
   - Video import failures
   - Metadata fetch failures
   - Playback errors
   - Export failures
4. Add error boundary component (React)
5. Log all errors to console
6. Show user-friendly messages

**Acceptance Criteria**:
- [ ] Errors display as toast notifications
- [ ] Error messages are user-friendly
- [ ] Technical details logged to console
- [ ] Errors auto-dismiss after delay
- [ ] Critical errors don't crash app
- [ ] Error boundary catches React errors

**Test Plan**:
1. Try importing invalid file (should show error)
2. Try exporting with no clips (should show error)
3. Cause React error (should show error boundary)
4. Verify errors dismiss automatically

---

## PHASE 9: Testing & Polish

### Task 9.1: Manual Testing Checklist
**Module**: All  
**Dependencies**: Task 8.1  
**Priority**: High

**Description**:
Comprehensive manual testing of all MVP features.

**Test Scenarios**:

**Import & Library**:
- [ ] Import single MP4 file
- [ ] Import single MOV file
- [ ] Import multiple files at once
- [ ] Import displays correct thumbnails
- [ ] Import shows correct metadata (duration, resolution, fps)
- [ ] Remove file from library
- [ ] Cancel file dialog (no error)

**Timeline**:
- [ ] Drag clip from library to timeline
- [ ] Clip appears at correct position
- [ ] Clip width represents duration
- [ ] Drag clip to new position on timeline
- [ ] Multiple clips can coexist on timeline
- [ ] Timeline scrolls if content exceeds width
- [ ] Zoom slider changes scale correctly

**Preview**:
- [ ] Video plays when Play clicked
- [ ] Video pauses when Pause clicked
- [ ] Playhead moves during playback
- [ ] Seek slider updates video position
- [ ] Video shows correct frame for playhead position
- [ ] Video pauses at clip end

**Editing**:
- [ ] Click clip to select
- [ ] Selected clip shows highlight
- [ ] Delete key removes selected clip
- [ ] Trim handles appear on selected clip
- [ ] Left trim handle adjusts start
- [ ] Right trim handle adjusts end
- [ ] Preview respects trim settings

**Export**:
- [ ] Export dialog opens from button
- [ ] Resolution dropdown works
- [ ] FPS dropdown works
- [ ] Save file dialog opens
- [ ] Export completes successfully
- [ ] Output file exists at chosen path
- [ ] Output video plays in external player
- [ ] Output contains all clips in order
- [ ] Progress bar shows during export

**Performance**:
- [ ] App launches under 5 seconds
- [ ] Timeline responsive with 10+ clips
- [ ] Preview plays smoothly (30fps+)
- [ ] No memory leaks after 15 minutes
- [ ] No crashes during testing

---

### Task 9.2: Fix Critical Bugs
**Module**: All  
**Dependencies**: Task 9.1  
**Priority**: Critical

**Description**:
Address any critical bugs discovered during testing.

**Bug Categories**:
1. **Crashes**: App crashes or freezes
2. **Data Loss**: User loses work unexpectedly
3. **Export Failures**: Export doesn't complete or produces invalid video
4. **Playback Issues**: Video doesn't play or shows wrong content
5. **UI Blocking**: User cannot proceed with workflow

**Process**:
1. Document each bug with reproduction steps
2. Prioritize by severity
3. Fix critical bugs first
4. Re-test after fixes
5. Update task list with any new issues found

**Acceptance Criteria**:
- [ ] Zero crash bugs
- [ ] Zero data loss bugs
- [ ] Export succeeds reliably
- [ ] Preview playback works consistently
- [ ] All UI interactions respond correctly

---

### Task 9.3: UI Polish & Refinement
**Module**: All UI components  
**Dependencies**: Task 9.1  
**Priority**: Low

**Description**:
Improve visual polish and user experience details.

**Polish Items**:
1. **Visual Consistency**:
   - [ ] Consistent button styles across app
   - [ ] Consistent spacing and padding
   - [ ] Consistent color scheme (dark theme)
   - [ ] Proper hover states on interactive elements
2. **Feedback**:
   - [ ] Loading states show during async operations
   - [ ] Cursor changes on draggable elements
   - [ ] Disabled states prevent invalid actions
   - [ ] Success states confirm actions completed
3. **Typography**:
   - [ ] Readable font sizes throughout
   - [ ] Proper text hierarchy
   - [ ] Truncation for long filenames
4. **Accessibility**:
   - [ ] Sufficient color contrast
   - [ ] Focus indicators on keyboard navigation
   - [ ] Descriptive button labels

**Acceptance Criteria**:
- [ ] App looks professional and polished
- [ ] No visual glitches or artifacts
- [ ] Smooth animations and transitions
- [ ] Clear visual feedback for all actions
- [ ] Consistent design language

---

## PHASE 10: Packaging & Distribution

### Task 10.1: Configure App Icon
**Module**: Module 1 (Project Structure)  
**Dependencies**: None  
**Priority**: Low

**Description**:
Create and configure application icon for macOS.

**Steps**:
1. Create app icon (1024x1024 PNG)
2. Use icon generator to create .icns file
3. Place in `src-tauri/icons/`
4. Update `tauri.conf.json` to reference icon
5. Rebuild and verify icon appears in Finder

**Acceptance Criteria**:
- [ ] Icon file created and placed correctly
- [ ] Icon shows in app window title bar
- [ ] Icon shows in Dock when app running
- [ ] Icon shows in Finder for .app bundle

**Files Created**:
- `src-tauri/icons/icon.icns`
- `src-tauri/icons/icon.png`

---

### Task 10.2: Build Production App
**Module**: Module 1 (Project Structure)  
**Dependencies**: All tasks complete  
**Priority**: Critical

**Description**:
Build production-ready distributable application.

**Steps**:
1. Run production build: `npm run tauri build`
2. Verify FFmpeg binary included in bundle
3. Test built .app bundle:
   - Double-click to launch
   - Import video
   - Create timeline
   - Export video
4. Check bundle size (should be reasonable)
5. Verify no dev dependencies included

**Acceptance Criteria**:
- [ ] Build completes without errors
- [ ] .app bundle created in `src-tauri/target/release/bundle/macos/`
- [ ] .dmg installer created
- [ ] App launches from .app bundle
- [ ] All features work in production build
- [ ] Bundle size reasonable (<200MB)
- [ ] FFmpeg included and functional

**Deliverables**:
- `.app` bundle
- `.dmg` installer

---

### Task 10.3: Create Release DMG
**Module**: Module 1 (Project Structure)  
**Dependencies**: Task 10.2  
**Priority**: High

**Description**:
Package application as distributable .dmg for easy installation.

**Steps**:
1. Tauri automatically creates .dmg during build
2. Test .dmg installer:
   - Open .dmg file
   - Drag app to Applications folder
   - Launch from Applications
   - Verify all features work
3. Name properly: `VideoEditor-v1.0.0.dmg`
4. Optional: Customize .dmg appearance (background, window size)

**Acceptance Criteria**:
- [ ] .dmg file opens correctly
- [ ] User can drag to Applications folder
- [ ] App launches from Applications
- [ ] App retains all functionality when installed
- [ ] .dmg is properly named with version

**Deliverables**:
- `VideoEditor-v1.0.0.dmg`

---

## Completion Checklist

### MVP Must-Have Features
- [ ] Desktop app launches
- [ ] Import video files (MP4/MOV)
- [ ] Timeline displays clips
- [ ] Preview shows video at playhead
- [ ] Clips can be dragged on timeline
- [ ] Basic trim functionality
- [ ] Export to MP4
- [ ] Packaged as .dmg

### Technical Requirements
- [ ] No crashes during normal operation
- [ ] Timeline responsive with 10+ clips
- [ ] Preview plays at 30fps minimum
- [ ] Export completes successfully
- [ ] Bundle size reasonable

### Quality Standards
- [ ] All acceptance criteria met
- [ ] Manual testing checklist complete
- [ ] No critical bugs
- [ ] Professional UI appearance
- [ ] Code follows architecture patterns

---

## Post-MVP Considerations

**Not Required for MVP** (defer to full product):
- Screen/webcam recording
- Multiple tracks
- Split clip functionality
- Undo/redo
- Project save/load
- Audio waveforms
- Transitions/effects
- Keyboard shortcuts

**Known Limitations**:
- Export progress is indeterminate (not real percentage)
- Single track only
- No multi-clip playback (preview shows current clip only)
- No project persistence
- No undo/redo

---

## Success Metrics

MVP is complete when:
1. ✅ All tasks marked complete
2. ✅ Manual testing checklist passes
3. ✅ Export produces valid video files
4. ✅ App packaged as working .dmg
5. ✅ No critical bugs remain

This represents a functional proof-of-concept that validates the core technology stack and architecture.
