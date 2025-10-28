# System Patterns - CapCut Clone Video Editor

**Last Updated**: 2025-01-XX  
**Architecture Version**: 1.0

## Architecture Overview

The application follows a modular, layered architecture optimized for AI-assisted development:

```
┌─────────────────────────────────────┐
│      React Frontend (TypeScript)    │
│  Components + Zustand State + UI    │
├─────────────────────────────────────┤
│    Tauri IPC (Communication)        │
├─────────────────────────────────────┤
│     Rust Backend (Commands)         │
│   File I/O + FFmpeg Execution       │
├─────────────────────────────────────┤
│      FFmpeg Binary (Media)          │
└─────────────────────────────────────┘
```

## Module Structure

### Frontend Modules (React/TypeScript)

**1. State Management (`src/store/`)**
- `mediaStore.ts` - Media file library state
- `timelineStore.ts` - Timeline tracks, clips, playhead
- `appStore.ts` - App-level state (export progress, errors)

**Pattern**: Zustand stores with explicit actions
- Immutable state updates
- Hook-based selectors
- No boilerplate (vs Redux)

**2. Services (`src/services/`)**
- `videoService.ts` - Orchestrates Tauri commands for media operations
- `projectService.ts` - Project save/load (post-MVP)

**Pattern**: Singleton services wrapping Tauri IPC
- All async operations go through services
- Centralized error handling
- Type-safe Tauri command invocations

**3. Components (`src/components/`)**
- `MediaLibrary/` - File import and library UI
- `Timeline/` - Konva.js canvas timeline editor
- `Preview/` - HTML5 video preview player
- `ExportDialog/` - Export settings and progress modal

**Pattern**: Functional components with hooks
- Separation of presentation and logic
- Reusable UI primitives
- TailwindCSS for styling

**4. Types (`src/types/`)**
- `media.ts` - MediaFile, MediaMetadata interfaces
- `timeline.ts` - TimelineClip, TimelineTrack, TimelineState

**Pattern**: Comprehensive TypeScript types
- All domain models strongly typed
- ID types (string for UUIDs)
- Time in seconds (not frames)

### Backend Modules (Rust)

**1. Commands (`src-tauri/src/commands.rs`)**
- `get_media_metadata` - PV probe for video info
- `generate_thumbnail` - FFmpeg thumbnail extraction
- `export_video` - FFmpeg video rendering

**Pattern**: Tauri command functions
- All async (non-blocking IPC)
- Return `Result<T, String>` for error handling
- Command structs derive Serialize/Deserialize

**2. FFmpeg Executor (`src-tauri/src/ffmpeg.rs`)**
- `FFmpegExecutor` struct wraps FFmpeg binary
- Path resolution from Tauri resource directory
- JSON parsing for metadata output
- Filter complex construction for exports

**Pattern**: Encapsulated media processing
- Binary path management centralized
- Error messages include FFmpeg stderr
- Idempotent operations where possible

**3. Main Entry (`src-tauri/src/main.rs`)**
- Registers Tauri commands
- Initializes app context
- Hooks into Tauri lifecycle

**Pattern**: Minimal main, delegate to library
- Library crate contains logic
- Main is thin wrapper
- Enable Windows subsystem for release

## State Management Patterns

### Zustand Store Pattern

```typescript
interface MyState {
  data: MyData[];
  selectedId: string | null;
  
  // Actions
  addItem: (item: MyData) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string | null) => void;
}

export const useMyStore = create<MyState>((set, get) => ({
  data: [],
  selectedId: null,
  
  addItem: (item) => set((state) => ({
    data: [...state.data, item]
  })),
  
  removeItem: (id) => set((state) => ({
    data: state.data.filter(item => item.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),
  
  selectItem: (id) => set({ selectedId: id })
}));
```

### Key Patterns:
- **Immutable updates**: Always create new state objects
- **Action functions**: Exposed as store properties
- **Selector optimization**: Multiple specific selectors vs. one large selector
- **Auto-recalculation**: Derived state recalculated in actions

## Data Flow Patterns

### Import Flow
```
User clicks Import
  → videoService.importVideos()
    → Tauri dialog.open() [file picker]
      → Loop through selected paths
        → invoke('get_media_metadata')
          → FFmpegExecutor.get_metadata()
            → Parse JSON, return MediaMetadata
        → invoke('generate_thumbnail')
          → FFmpegExecutor.generate_thumbnail()
            → Return base64 image
      → Create MediaFile object
        → mediaStore.addMediaFile()
          → State updates, UI re-renders
```

### Export Flow
```
User clicks Export
  → collect clips from timelineStore
    → map to ClipInfo format
      → ExportDialog calls videoService.exportVideo()
        → invoke('export_video')
          → FFmpegExecutor.export_video()
            → Build filter complex
            → Execute FFmpeg
            → Parse progress (future)
        → Update appStore.exportProgress
          → UI updates progress bar
```

### Timeline Edit Flow
```
User drags clip on timeline
  → Konva ClipRect.onDragEnd()
    → Calculate new position (x → time)
      → timelineStore.updateClip()
        → Find clip in tracks
          → Update with new startTime
            → Recalculate timeline duration
              → Zustand triggers re-render
                → Konva re-renders clip at new position
```

## Rendering Patterns

### Konva Timeline Rendering
```typescript
<Stage width={width} height={height}>
  <Layer>
    {/* Static background */}
    <Rect x={0} y={0} width={width} height={height} fill="#1a1a1a" />
    
    {/* Time ruler */}
    <TimeRuler />
    
    {/* Dynamic tracks */}
    {tracks.map(track => (
      <TrackLayer key={track.id} track={track} />
    ))}
    
    {/* Overlay elements */}
    <Playhead />
  </Layer>
</Stage>
```

**Pattern**: Hierarchical rendering
- Static background rendered once
- Dynamic elements re-render on state changes
- Layer separation for z-ordering

### Video Preview Pattern
```typescript
// Calculate current clip at playhead
const currentClip = useMemo(() => {
  for (const track of tracks) {
    const clip = track.clips.find(c => 
      c.startTime <= playheadPosition && 
      (c.startTime + c.duration) > playheadPosition
    );
    if (clip) return clip;
  }
  return null;
}, [tracks, playheadPosition]);

// Sync video element
useEffect(() => {
  if (videoRef.current && currentMedia) {
    videoRef.current.currentTime = videoTime;
  }
}, [currentMedia, videoTime]);
```

**Pattern**: Reactive synchronization
- Derived state from playhead position
- Effects sync external DOM (video element)
- RequestAnimationFrame for smooth updates

## Error Handling Patterns

### Frontend Error Handling
```typescript
try {
  await videoService.importVideos();
} catch (error) {
  console.error('Import failed:', error);
  appStore.setError('Failed to import videos');
  // User-friendly message displayed
}
```

### Backend Error Handling
```rust
#[command]
pub async fn get_media_metadata(file_path: String) -> Result<MediaMetadata, String> {
    let metadata = ffmpeg_executor.get_metadata(&file_path)
        .map_err(|e| format!("Failed to get metadata: {}", e))?;
    Ok(metadata)
}
```

**Pattern**: Propagate errors with context
- Include error source in messages
- Frontend shows user-friendly messages
- Console logs include technical details

## Performance Optimization Patterns

### 1. Derive State Memoization
```typescript
const currentClip = useMemo(() => {
  // Expensive calculation
  return findClipAtPosition(tracks, playheadPosition);
}, [tracks, playheadPosition]);
```

### 2. RequestAnimationFrame for Smooth Updates
```typescript
useEffect(() => {
  if (!isPlaying) return;
  
  let animationFrameId: number;
  const updatePlayhead = () => {
    const newPosition = calculateNewPosition();
    setPlayheadPosition(newPosition);
    animationFrameId = requestAnimationFrame(updatePlayhead);
  };
  
  animationFrameId = requestAnimationFrame(updatePlayhead);
  return () => cancelAnimationFrame(animationFrameId);
}, [isPlaying]);
```

### 3. Blob URL Management
```typescript
// Create blob URL
const blobUrl = URL.createObjectURL(blob);

// Clean up when done
useEffect(() => {
  return () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  };
}, [blobUrl]);
```

## File Structure Patterns

### Component Organization
```
src/components/
  ComponentName/
    ComponentName.tsx       # Main component
    ComponentName.css       # Component styles (optional)
    index.ts                # Export
```

### Service Organization
```
src/services/
  videoService.ts           # Video operations
  projectService.ts         # Project persistence
  
  Export singleton instances:
    export const videoService = new VideoService();
```

### Store Organization
```
src/store/
  mediaStore.ts             # Media library state
  timelineStore.ts          # Timeline state
  appStore.ts               # App-level state
  
  Each exports hook:
    export const useMediaStore = create(...);
```

## Naming Conventions

- **Components**: PascalCase (`MediaLibrary`, `Timeline`)
- **Files**: Match component name (`MediaLibrary.tsx`)
- **Stores**: camelCase with "use" prefix (`useMediaStore`)
- **Services**: camelCase (`videoService`)
- **Types**: PascalCase (`MediaFile`, `TimelineClip`)
- **Functions**: camelCase (`importVideos`, `addMediaFile`)
- **Rust modules**: snake_case (`commands`, `ffmpeg`)

## Testing Patterns

### Manual Testing Hierarchy
1. **Unit-level**: Test stores and services in isolation
2. **Component-level**: Test UI components with mock data
3. **Integration-level**: Test workflows (import → edit → export)
4. **End-to-end**: Full user scenarios

### Test File Organization
- Component tests adjacent to components
- Store tests in `__tests__` subdirectories
- Integration tests in root `__tests__` directory

## Documentation Patterns

- **JSDoc** for all public functions
- **README** in component directories for complex components
- **ARCHITECTURE** comments in code for complex logic
- **TODO** comments with context for future work
- **.cursor/rules/** - Project intelligence for AI-assisted development

### Cursor Rules Structure
Project intelligence captured in `.cursor/rules/*.mdc` files:
- `project-base.mdc` - Core architecture and workflow patterns
- `tauri-patterns.mdc` - Tauri v2 specific configurations and gotchas
- `ffmpeg-patterns.mdc` - FFmpeg integration patterns and best practices
- `zustand-patterns.mdc` - State management patterns and conventions
- `frontend-service-patterns.mdc` - Service layer patterns for Tauri integration
- `react-component-patterns.mdc` - React component patterns and best practices
- `tailwind-v4-patterns.mdc` - TailwindCSS v4 configuration patterns

