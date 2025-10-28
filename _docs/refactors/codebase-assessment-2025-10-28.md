# Codebase Assessment & Refactoring Plan

**Date:** October 28, 2025  
**Reviewer:** AI Code Review  
**Project:** CapCut Clone Video Editor  
**Version:** 1.0

---

## Executive Summary

The codebase demonstrates strong architectural planning with excellent separation of concerns between frontend and backend, comprehensive type safety, and well-documented module specifications. However, several modularity and scalability issues need to be addressed before the application grows larger.

**Overall Grade: B+ (Good, Needs Improvement)**

**Key Strengths:**
- Excellent architecture documentation and planning
- Strong TypeScript type safety throughout
- Clean Tauri/React separation
- Appropriate state management choice (Zustand)

**Critical Issues:**
- Large, multi-responsibility components
- Missing custom hooks for complex logic
- Inconsistent error handling
- Performance concerns (no memoization)
- Tight coupling between components and stores

---

## Table of Contents

1. [Detailed Assessment](#detailed-assessment)
2. [Critical Issues](#critical-issues)
3. [Refactoring Plan](#refactoring-plan)
4. [Implementation Guide](#implementation-guide)
5. [Priority Matrix](#priority-matrix)

---

## Detailed Assessment

### ✅ Strengths

#### 1. Architecture & Documentation
- **Comprehensive module specifications** in `architecture.md`
- Clear dependency mapping between modules
- Well-defined interfaces and contracts
- AI-first development methodology clearly articulated

#### 2. Type Safety
- Strong TypeScript usage throughout frontend
- Proper interface definitions for domain models
- Type safety extends to Rust backend with Serde
- Centralized type exports via `src/types/index.ts`

#### 3. State Management
- Appropriate choice of Zustand for lightweight state
- State properly separated by concern (media, timeline, app)
- Actions co-located with state for clarity
- Immutable updates by convention

#### 4. Separation of Concerns
- Clean frontend/backend boundary via Tauri IPC
- Service layer properly abstracts Tauri commands
- Business logic separated from UI in most places
- Modular directory structure

#### 5. Modern React Patterns
- Functional components throughout
- Proper use of hooks (useState, useEffect, useMemo in some places)
- No class components (avoiding legacy patterns)

---

## Critical Issues

### 1. Component Size & Complexity Violations

#### Problem: Components Exceed Recommended Limits

**`Timeline.tsx` (370+ lines)**
```
Main Component:     ~100 lines
TimeRuler:          ~50 lines
TrackLayer:         ~60 lines
ClipRect:          ~100 lines
Playhead:           ~40 lines
TimelineControls:   ~30 lines
─────────────────────────────
Total:             ~380 lines (1 file)
```

This violates the Single Responsibility Principle. The component:
- Manages canvas rendering
- Handles user interactions
- Calculates time conversions
- Renders 5+ sub-components
- Manages keyboard shortcuts

**Impact:**
- Difficult to test individual pieces
- Hard to reuse components elsewhere
- Merge conflicts more likely
- Cognitive overload for developers

#### Solution: Split into Module

```
src/components/Timeline/
├── Timeline.tsx          # Main orchestrator (50-80 lines)
├── TimeRuler.tsx        # Time ruler component
├── Track.tsx            # Track rendering
├── Clip.tsx             # Clip component
├── Playhead.tsx         # Playhead component
├── Controls.tsx         # Timeline controls
├── types.ts             # Timeline-specific types
├── utils.ts             # Helper functions (timeToX, etc.)
└── constants.ts         # Timeline constants
```

**Benefits:**
- Each file under 100 lines
- Components are independently testable
- Clear responsibilities
- Easier code navigation
- Better tree-shaking

---

**`PreviewPlayer.tsx` (280+ lines)**

Similar issues:
- Mixes video loading logic with rendering
- Handles blob URL management inline
- Manages playback synchronization
- Contains complex useEffect chains

#### Solution: Extract Custom Hooks

```
src/components/Preview/
├── PreviewPlayer.tsx         # Main component (80-100 lines)
├── PreviewControls.tsx      # Separate controls
└── hooks/
    ├── useVideoLoader.ts    # Video loading & blob URLs
    ├── usePlaybackSync.ts   # Playback synchronization
    └── useClipDetection.ts  # Clip at playhead detection
```

---

### 2. Missing Custom Hooks for Complex Logic

#### Problem: Complex Logic Embedded in Components

**Current Anti-Pattern:**
```typescript
// PreviewPlayer.tsx - 50+ lines of blob URL management
const [videoSrc, setVideoSrc] = React.useState<string | null>(null);
const blobUrlRef = React.useRef<string | null>(null);
const lastMediaPathRef = React.useRef<string | null>(null);
const isVideoReadyRef = React.useRef<boolean>(false);

React.useEffect(() => {
  // 40+ lines of complex loading logic
  // Mixed with component lifecycle
  // Hard to test or reuse
}, [currentMedia?.path]);
```

**Issues:**
- Logic cannot be tested in isolation
- Cannot be reused in other components
- Component becomes harder to understand
- Violates separation of concerns

#### Solution: Custom Hook Pattern

```typescript
// hooks/useVideoLoader.ts
export const useVideoLoader = (filePath: string | null) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!filePath) {
      setVideoSrc(null);
      return;
    }
    
    let isCancelled = false;
    
    const loadVideo = async () => {
      setIsLoading(true);
      try {
        const data = await readFile(filePath);
        const blob = new Blob([data], { type: 'video/mp4' });
        const blobUrl = URL.createObjectURL(blob);
        
        if (!isCancelled) {
          // Revoke old blob URL
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          blobUrlRef.current = blobUrl;
          setVideoSrc(blobUrl);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    loadVideo();
    
    return () => {
      isCancelled = true;
    };
  }, [filePath]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);
  
  return { videoSrc, isLoading, error };
};

// Usage in component - clean and simple
const PreviewPlayer: React.FC = () => {
  const { currentMedia } = useCurrentClip();
  const { videoSrc, isLoading, error } = useVideoLoader(currentMedia?.path);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return <video src={videoSrc} />;
};
```

**Benefits:**
- Logic is isolated and testable
- Can be reused in thumbnail generation, etc.
- Component is simpler and more readable
- Easier to debug
- Better error handling

#### Recommended Custom Hooks to Create

| Hook Name | Purpose | Lines Saved | Priority |
|-----------|---------|-------------|----------|
| `useVideoLoader` | Video file loading & blob URLs | ~80 | High |
| `usePlaybackSync` | Sync video element with timeline | ~100 | High |
| `useClipTrimming` | Handle clip trim operations | ~60 | Medium |
| `useTimelineNavigation` | Timeline scrolling & zooming | ~40 | Medium |
| `useKeyboardShortcuts` | Centralized keyboard handling | ~50 | Medium |
| `useCurrentClip` | Find clip at playhead position | ~30 | High |

**Total Lines Extracted: ~360 lines**

---

### 3. Inconsistent Error Handling

#### Problem: No Standardized Error Strategy

**Current Approach Varies:**

```typescript
// MediaLibrary.tsx - Browser alert (bad UX)
catch (error) {
  console.error('Import failed:', error);
  alert('Failed to import videos'); // Blocking, no details
}

// VideoService.ts - Logs but throws raw error
catch (error) {
  console.error('Failed to create media file:', error);
  throw error; // User gets technical error
}

// PreviewPlayer.tsx - Silent failure
catch (error) {
  console.error('Failed to read video file:', error);
  // User never knows anything went wrong
  setVideoSrc(null);
}
```

**Issues:**
- Inconsistent user experience
- No error recovery options
- Technical errors exposed to users
- No centralized error tracking
- Difficult to debug production issues

#### Solution: Centralized Error Handling System

```typescript
// utils/errors.ts

/**
 * Application error with user-friendly messaging
 */
export class AppError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code: string,
    public recoverable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error codes for categorization
 */
export enum ErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FORMAT = 'INVALID_FORMAT',
  FFMPEG_FAILED = 'FFMPEG_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Convert unknown errors to AppError
 */
export const toAppError = (error: unknown, context?: string): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Parse common error patterns
  if (errorMessage.includes('No such file')) {
    return new AppError(
      errorMessage,
      'The selected file could not be found. It may have been moved or deleted.',
      ErrorCode.FILE_NOT_FOUND,
      false
    );
  }
  
  if (errorMessage.includes('permission denied')) {
    return new AppError(
      errorMessage,
      'Permission denied. Please check file permissions and try again.',
      ErrorCode.PERMISSION_DENIED,
      true
    );
  }
  
  // Default unknown error
  return new AppError(
    errorMessage,
    'An unexpected error occurred. Please try again.',
    ErrorCode.UNKNOWN,
    true,
    { context, originalError: error }
  );
};

/**
 * Display error to user with Tauri dialog
 */
export const handleError = async (
  error: unknown,
  context: string,
  options: {
    silent?: boolean;
    showDetails?: boolean;
  } = {}
): Promise<void> => {
  const appError = toAppError(error, context);
  
  // Always log to console
  console.error(`[${context}]`, {
    message: appError.message,
    code: appError.code,
    context: appError.context,
  });
  
  // Show to user unless silent
  if (!options.silent) {
    const { message: tauriMessage } = await import('@tauri-apps/plugin-dialog');
    
    const displayMessage = options.showDetails
      ? `${appError.userMessage}\n\nDetails: ${appError.message}`
      : appError.userMessage;
    
    await tauriMessage(displayMessage, {
      title: 'Error',
      kind: 'error',
    });
  }
  
  // TODO: Send to error tracking service (Sentry, etc.)
};

/**
 * Create specific error types
 */
export const createFileNotFoundError = (filePath: string): AppError => {
  return new AppError(
    `File not found: ${filePath}`,
    'The video file could not be found. It may have been moved or deleted.',
    ErrorCode.FILE_NOT_FOUND,
    false,
    { filePath }
  );
};

export const createFFmpegError = (stderr: string): AppError => {
  return new AppError(
    `FFmpeg error: ${stderr}`,
    'Video processing failed. The file may be corrupted or in an unsupported format.',
    ErrorCode.FFMPEG_FAILED,
    true,
    { stderr }
  );
};
```

**Usage Examples:**

```typescript
// MediaLibrary.tsx
const handleImport = async () => {
  setIsImporting(true);
  try {
    const importedFiles = await videoService.importVideos();
    importedFiles.forEach(file => addMediaFile(file));
  } catch (error) {
    await handleError(error, 'MediaLibrary.importVideos');
  } finally {
    setIsImporting(false);
  }
};

// VideoService.ts
async importVideos(): Promise<MediaFile[]> {
  try {
    const selected = await open({ /* ... */ });
    // ... implementation
  } catch (error) {
    throw toAppError(error, 'VideoService.importVideos');
  }
}

// FFmpeg executor (Rust side) - return structured errors
pub fn get_metadata(&self, file_path: &str) -> Result<MediaMetadata, String> {
    if !std::path::Path::new(file_path).exists() {
        return Err(format!("FILE_NOT_FOUND: {}", file_path));
    }
    // ... rest of implementation
}
```

**Benefits:**
- Consistent error messages
- Better user experience
- Easier debugging
- Error recovery options
- Centralized error tracking
- Type-safe error codes

---

### 4. Tight Coupling Between Components and Stores

#### Problem: Components Know Too Much About Store Structure

**Current Anti-Pattern:**
```typescript
// Timeline.tsx - Direct store access
const { 
  tracks, 
  playheadPosition, 
  zoom, 
  duration, 
  selectedClipId,
  selectClip, 
  removeClip, 
  setPlayheadPosition 
} = useTimelineStore();

const { getMediaFile } = useMediaStore();

// Component now tightly coupled to:
// 1. Timeline store structure
// 2. Media store structure
// 3. Both stores' action names
```

**Issues:**
- Hard to test (need to mock entire stores)
- Cannot reuse component with different data source
- Refactoring store breaks components
- Difficult to change state management library later

#### Solution: Container/Presenter Pattern

```typescript
// containers/TimelineContainer.tsx
export const TimelineContainer: React.FC = () => {
  const timelineState = useTimelineStore();
  const { getMediaFile } = useMediaStore();
  
  // Enrich data in container
  const enrichedTracks = timelineState.tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => ({
      ...clip,
      media: getMediaFile(clip.mediaFileId),
    })),
  }));
  
  // Map store actions to props
  const handleSelectClip = (clipId: string | null) => {
    timelineState.selectClip(clipId);
  };
  
  const handleUpdateClip = (clipId: string, updates: Partial<TimelineClip>) => {
    timelineState.updateClip(clipId, updates);
  };
  
  return (
    <Timeline
      tracks={enrichedTracks}
      playheadPosition={timelineState.playheadPosition}
      zoom={timelineState.zoom}
      duration={timelineState.duration}
      selectedClipId={timelineState.selectedClipId}
      onSelectClip={handleSelectClip}
      onUpdateClip={handleUpdateClip}
      onSeek={timelineState.setPlayheadPosition}
    />
  );
};

// components/Timeline/Timeline.tsx (Pure/Presenter)
interface EnrichedClip extends TimelineClip {
  media?: MediaFile;
}

interface EnrichedTrack extends TimelineTrack {
  clips: EnrichedClip[];
}

interface TimelineProps {
  tracks: EnrichedTrack[];
  playheadPosition: number;
  zoom: number;
  duration: number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  onSeek: (position: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  playheadPosition,
  zoom,
  duration,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  onSeek,
}) => {
  // Pure component - no store access
  // Easy to test with mock props
  // Can be used in Storybook
  // Can switch state management without touching this file
};
```

**Benefits:**
- Components are truly reusable
- Easy to test with mock data
- Can use in Storybook/documentation
- State management can be changed without touching presenters
- Clear data flow
- Better separation of concerns

#### Additional Pattern: Custom Hook Selectors

```typescript
// hooks/useTimelineSelectors.ts
export const useCurrentClip = () => {
  return useTimelineStore(
    state => {
      const playhead = state.playheadPosition;
      for (const track of state.tracks) {
        const clip = track.clips.find(
          c => c.startTime <= playhead && c.startTime + c.duration > playhead
        );
        if (clip) return clip;
      }
      return null;
    },
    shallow // Only re-render if result changes
  );
};

export const useIsPlaying = () => {
  return useTimelineStore(state => state.isPlaying);
};

// Usage - component only re-renders when specific value changes
const PreviewPlayer: React.FC = () => {
  const currentClip = useCurrentClip(); // Selective subscription
  const isPlaying = useIsPlaying();     // Selective subscription
  
  // Component won't re-render when zoom changes, etc.
};
```

---

### 5. Missing Validation & Guards

#### Problem: No Input Validation Before State Updates

**Current Code Has No Guards:**
```typescript
// timelineStore.ts
updateClip: (clipId, updates) => set((state) => ({
  tracks: state.tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip =>
      clip.id === clipId ? { ...clip, ...updates } : clip
    )
  }))
}))

// What if updates.duration is -5?
// What if updates.startTime is NaN?
// What if updates.trimStart > mediaFile.duration?
```

**Issues:**
- Invalid data can corrupt state
- Bugs are hard to trace
- No clear contract for what's valid
- Silent failures or crashes

#### Solution: Validation Layer

```typescript
// utils/validators.ts

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate timeline clip updates
 */
export const validateClipUpdate = (
  clip: TimelineClip,
  updates: Partial<TimelineClip>,
  mediaFile?: MediaFile
): ValidationResult => {
  const errors: string[] = [];
  const merged = { ...clip, ...updates };
  
  // Duration must be positive and at least 0.1 seconds
  if (merged.duration < 0.1) {
    errors.push('Clip duration must be at least 0.1 seconds');
  }
  
  // Start time cannot be negative
  if (merged.startTime < 0) {
    errors.push('Clip start time cannot be negative');
  }
  
  // Trim values cannot be negative
  if (merged.trimStart < 0) {
    errors.push('Trim start cannot be negative');
  }
  
  if (merged.trimEnd < 0) {
    errors.push('Trim end cannot be negative');
  }
  
  // If we have media file, validate against source duration
  if (mediaFile) {
    const totalTrimmed = merged.trimStart + merged.trimEnd;
    if (totalTrimmed >= mediaFile.duration) {
      errors.push('Cannot trim entire video');
    }
    
    const maxDuration = mediaFile.duration - totalTrimmed;
    if (merged.duration > maxDuration) {
      errors.push(`Duration cannot exceed ${maxDuration.toFixed(2)}s`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate media file
 */
export const validateMediaFile = (file: Partial<MediaFile>): ValidationResult => {
  const errors: string[] = [];
  
  if (!file.path || file.path.trim() === '') {
    errors.push('File path is required');
  }
  
  if (file.duration !== undefined && file.duration <= 0) {
    errors.push('Duration must be positive');
  }
  
  if (file.width !== undefined && file.width <= 0) {
    errors.push('Width must be positive');
  }
  
  if (file.height !== undefined && file.height <= 0) {
    errors.push('Height must be positive');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Assert validation or throw
 */
export const assertValid = (result: ValidationResult): void => {
  if (!result.valid) {
    throw new AppError(
      `Validation failed: ${result.errors.join(', ')}`,
      'Invalid data. Please check your input.',
      ErrorCode.VALIDATION_ERROR,
      true,
      { errors: result.errors }
    );
  }
};
```

**Usage in Store:**

```typescript
// timelineStore.ts
updateClip: (clipId, updates) => {
  const state = get();
  
  // Find current clip
  let currentClip: TimelineClip | undefined;
  for (const track of state.tracks) {
    currentClip = track.clips.find(c => c.id === clipId);
    if (currentClip) break;
  }
  
  if (!currentClip) {
    console.error('Clip not found:', clipId);
    return;
  }
  
  // Get media file for validation
  const mediaFile = useMediaStore.getState().getMediaFile(currentClip.mediaFileId);
  
  // Validate update
  const validation = validateClipUpdate(currentClip, updates, mediaFile);
  
  if (!validation.valid) {
    console.error('Invalid clip update:', validation.errors);
    // Optionally show error to user
    handleError(
      new AppError(
        validation.errors.join(', '),
        'Cannot update clip: ' + validation.errors[0],
        ErrorCode.VALIDATION_ERROR
      ),
      'timelineStore.updateClip',
      { silent: false }
    );
    return; // Don't update with invalid data
  }
  
  // Update is valid, proceed
  set((state) => ({
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    }))
  }));
}
```

**Benefits:**
- Data integrity guaranteed
- Clear error messages for developers
- Easier debugging
- Prevents corrupt state
- Self-documenting (validation shows requirements)

---

### 6. Performance Concerns

#### Problem A: No Memoization of Expensive Calculations

**Current Code:**
```typescript
// Timeline.tsx - Recalculated on EVERY render
const calculatedWidth = Math.max(stageWidth, timeToX(duration || 0));

// PreviewPlayer.tsx - useMemo used, but still issues
const currentClip = React.useMemo(() => {
  // Good!
}, [tracks, playheadPosition]);

const videoTime = React.useMemo(() => {
  // Good!
}, [currentClip, currentMedia, playheadPosition]);

// But no memoization for callbacks passed to children
const handleClick = (e: any) => {
  // Re-created on every render
  // Causes child components to re-render unnecessarily
};
```

#### Problem B: Entire Store Subscriptions

**Current Code:**
```typescript
// PreviewPlayer.tsx - Subscribes to ENTIRE timeline store
const { tracks, playheadPosition, duration, isPlaying, 
        setIsPlaying, setPlayheadPosition } = useTimelineStore();

// Component re-renders when:
// - Zoom changes (doesn't affect preview)
// - Selected clip changes (doesn't affect preview)
// - ANY track change (even if not current clip)
// - Timeline duration changes
// - etc.
```

**Impact:**
- Unnecessary re-renders
- Wasted CPU cycles
- Janky UI with many clips
- Poor timeline scrubbing performance

#### Solution: Comprehensive Performance Optimization

```typescript
// 1. Memoize calculations
const calculatedWidth = useMemo(
  () => Math.max(stageWidth, timeToX(duration || 0)),
  [stageWidth, duration, zoom] // Only recalculate when these change
);

// 2. Memoize callbacks
const handleTimelineClick = useCallback((e: any) => {
  const stage = e.target.getStage();
  const pointerPos = stage.getPointerPosition();
  if (pointerPos && pointerPos.y <= TIME_RULER_HEIGHT) {
    const newPosition = pointerPos.x / zoom;
    setPlayheadPosition(Math.max(0, newPosition));
  }
  selectClip(null);
}, [zoom, setPlayheadPosition, selectClip]);

// 3. Use selective store subscriptions
const playheadPosition = useTimelineStore(state => state.playheadPosition);
const isPlaying = useTimelineStore(state => state.isPlaying);
const duration = useTimelineStore(state => state.duration);
// Only subscribe to what you need!

// 4. Memoize child components
const MemoizedClipRect = React.memo(ClipRect, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.clip === nextProps.clip &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.zoom === nextProps.zoom
  );
});

// 5. Use React.memo for pure components
export const TimeRuler: React.FC<TimeRulerProps> = React.memo(
  ({ zoom, duration, stageWidth, height }) => {
    // Component won't re-render unless props change
  }
);

// 6. Debounce expensive operations
import { useDebouncedCallback } from 'use-debounce';

const handleZoomChange = useDebouncedCallback(
  (value: number) => {
    setZoom(value);
  },
  50 // Wait 50ms after user stops dragging
);
```

#### Problem C: No Virtualization for Long Lists

**Current Code:**
```typescript
// MediaLibrary.tsx - Will lag with 100+ files
<div className="space-y-2">
  {files.map(file => (
    <MediaCard key={file.id} file={file} />
  ))}
</div>
```

**With 100 files:**
- Renders 100 MediaCard components
- All thumbnails loaded at once
- Scroll is janky
- High memory usage

#### Solution: Virtual Scrolling

```typescript
import { FixedSizeList as List } from 'react-window';

// MediaLibrary.tsx
<List
  height={600}
  itemCount={files.length}
  itemSize={80} // Height of each card
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <MediaCard file={files[index]} />
    </div>
  )}
</List>
```

**Benefits:**
- Only renders visible items
- Smooth scrolling with 1000+ items
- Lower memory usage
- Better performance

#### Performance Measurement Plan

```typescript
// utils/performance.ts
export const measurePerformance = (name: string) => {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      if (duration > 16.67) { // Slower than 60fps
        console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      }
    },
  };
};

// Usage
const perf = measurePerformance('Timeline render');
// ... render logic
perf.end();
```

**Performance Targets:**
- Timeline interactions < 16ms (60fps)
- Media import < 2s per file
- Playback start < 500ms
- Export preview < 1s

---

### 7. Missing Accessibility (A11y)

#### Problem: No ARIA Labels or Keyboard Navigation

**Current Issues:**
```typescript
// No ARIA labels
<button onClick={handleImport}>
  +Add Clip
</button>

// No keyboard navigation for timeline
<Stage> 
  {/* Canvas - not keyboard accessible */}
</Stage>

// No focus management
// No screen reader support
// No skip links
```

**Impact:**
- Unusable for keyboard-only users
- Not accessible to screen readers
- Fails WCAG guidelines
- Potential legal issues

#### Solution: Add Accessibility Features

```typescript
// 1. ARIA labels on all interactive elements
<button
  onClick={handleImport}
  disabled={isImporting}
  aria-label="Import video files"
  aria-busy={isImporting}
  aria-describedby="import-help"
>
  {isImporting ? 'Importing...' : '+Add Clip'}
</button>
<p id="import-help" className="sr-only">
  Click to open file dialog and select video files to import
</p>

// 2. Keyboard navigation
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Space':
      e.preventDefault();
      setIsPlaying(!isPlaying);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      setPlayheadPosition(Math.max(0, playheadPosition - 0.1));
      break;
    case 'ArrowRight':
      e.preventDefault();
      setPlayheadPosition(Math.min(duration, playheadPosition + 0.1));
      break;
    case 'Delete':
      if (selectedClipId) {
        removeClip(selectedClipId);
      }
      break;
  }
};

// 3. Focus management
<div
  ref={timelineRef}
  tabIndex={0}
  role="application"
  aria-label="Video timeline editor"
  onKeyDown={handleKeyDown}
>

// 4. Live regions for status updates
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {isPlaying ? 'Playing' : 'Paused'} at {formatTime(playheadPosition)}
</div>

// 5. Screen reader only text
<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

---

### 8. No Loading States

#### Problem: Blank Screens During Async Operations

**Current Code:**
```typescript
// PreviewPlayer.tsx
{currentMedia ? (
  <video src={videoSrc} />
) : (
  <div>No clip</div>
)}
// What about when video is loading?
// User sees nothing, thinks app is broken
```

#### Solution: Proper Loading States

```typescript
// components/common/LoadingSpinner.tsx
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-gray-400">{message}</p>
      )}
    </div>
  );
};

// Usage
const PreviewPlayer: React.FC = () => {
  const { videoSrc, isLoading, error } = useVideoLoader(currentMedia?.path);
  
  if (!currentMedia) {
    return <EmptyState message="No clip at current position" />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading video..." />;
  }
  
  return <video src={videoSrc} />;
};
```

---

## Refactoring Plan

### Phase 1: Foundation (Week 1)
**Goal:** Set up infrastructure for better code quality

#### Tasks:
- [ ] Create error handling utilities
  - `utils/errors.ts` - AppError class, error codes
  - `utils/errorHandler.ts` - handleError function
  - Update all catch blocks to use new system
  - **Estimated time:** 1 day

- [ ] Create validation utilities
  - `utils/validators.ts` - Validation functions
  - Add to all store update methods
  - **Estimated time:** 1 day

- [ ] Create constants file
  - `constants/timeline.ts` - Timeline constants
  - `constants/app.ts` - App-wide constants
  - Replace magic numbers throughout codebase
  - **Estimated time:** 0.5 days

- [ ] Set up performance monitoring
  - `utils/performance.ts` - Performance measurement utilities
  - Add to critical paths
  - **Estimated time:** 0.5 days

**Total Phase 1: 3 days**

---

### Phase 2: Extract Custom Hooks (Week 1-2)
**Goal:** Move complex logic out of components

#### Tasks:
- [ ] `hooks/useVideoLoader.ts`
  - Extract video loading logic from PreviewPlayer
  - Handle blob URL lifecycle
  - Add loading/error states
  - **Estimated time:** 4 hours

- [ ] `hooks/usePlaybackSync.ts`
  - Extract playback synchronization logic
  - Handle requestAnimationFrame loop
  - Sync video element with timeline
  - **Estimated time:** 6 hours

- [ ] `hooks/useCurrentClip.ts`
  - Extract clip detection logic
  - Memoize result
  - Add to useTimelineSelectors
  - **Estimated time:** 2 hours

- [ ] `hooks/useKeyboardShortcuts.ts`
  - Centralize all keyboard handling
  - Make configurable
  - Add help dialog
  - **Estimated time:** 4 hours

- [ ] `hooks/useClipTrimming.ts`
  - Extract trim handle logic
  - Validate trim bounds
  - **Estimated time:** 4 hours

**Total Phase 2: 2.5 days**

---

### Phase 3: Component Refactoring (Week 2)
**Goal:** Break large components into smaller, focused pieces

#### Tasks:
- [ ] Refactor Timeline component
  - Split into separate files (Timeline, Track, Clip, etc.)
  - Move to Timeline directory structure
  - Extract utils (timeToX, etc.)
  - **Estimated time:** 2 days

- [ ] Refactor PreviewPlayer component
  - Use new custom hooks
  - Extract PreviewControls
  - Simplify component logic
  - **Estimated time:** 1 day

- [ ] Create container components
  - TimelineContainer.tsx
  - PreviewContainer.tsx
  - Implement container/presenter pattern
  - **Estimated time:** 1 day

**Total Phase 3: 4 days**

---

### Phase 4: Performance Optimization (Week 3)
**Goal:** Improve rendering performance

#### Tasks:
- [ ] Add memoization
  - useMemo for expensive calculations
  - useCallback for event handlers
  - React.memo for pure components
  - **Estimated time:** 1 day

- [ ] Implement selective store subscriptions
  - Create selector hooks
  - Update all components
  - Measure improvement
  - **Estimated time:** 1 day

- [ ] Add virtualization
  - Install react-window
  - Implement in MediaLibrary
  - Implement in LayerPanel
  - **Estimated time:** 0.5 days

- [ ] Performance testing
  - Test with 100+ clips
  - Profile rendering performance
  - Optimize hotspots
  - **Estimated time:** 0.5 days

**Total Phase 4: 3 days**

---

### Phase 5: Polish & Testing (Week 3-4)
**Goal:** Production-ready quality

#### Tasks:
- [ ] Add loading states
  - LoadingSpinner component
  - Update all async operations
  - Add skeleton screens
  - **Estimated time:** 1 day

- [ ] Add accessibility features
  - ARIA labels
  - Keyboard navigation
  - Focus management
  - **Estimated time:** 1.5 days

- [ ] Write tests
  - Unit tests for hooks
  - Unit tests for stores
  - Integration tests for key flows
  - **Estimated time:** 2 days

- [ ] Documentation
  - Update architecture.md
  - Document new patterns
  - Add code examples
  - **Estimated time:** 0.5 days

**Total Phase 5: 5 days**

---

## Implementation Guide

### Step-by-Step: Extract Custom Hook

**Example: Creating `useVideoLoader`**

#### 1. Identify the Logic to Extract
Look for complex useEffect logic in components:
```typescript
// BEFORE - In PreviewPlayer.tsx
const [videoSrc, setVideoSrc] = React.useState<string | null>(null);
const blobUrlRef = React.useRef<string | null>(null);

React.useEffect(() => {
  // 40+ lines of loading logic
}, [currentMedia?.path]);
```

#### 2. Create the Hook File
```typescript
// hooks/useVideoLoader.ts
import { useState, useEffect, useRef } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';

export const useVideoLoader = (filePath: string | null) => {
  // Move all state here
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  
  // Move useEffect logic here
  useEffect(() => {
    // ... implementation
  }, [filePath]);
  
  // Return only what the component needs
  return { videoSrc, isLoading, error };
};
```

#### 3. Update the Component
```typescript
// AFTER - In PreviewPlayer.tsx
const { videoSrc, isLoading, error } = useVideoLoader(currentMedia?.path);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorDisplay error={error} />;
if (!videoSrc) return <EmptyState />;

return <video src={videoSrc} />;
```

#### 4. Write Tests
```typescript
// hooks/__tests__/useVideoLoader.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useVideoLoader } from '../useVideoLoader';

describe('useVideoLoader', () => {
  it('should load video and return blob URL', async () => {
    const { result } = renderHook(() => useVideoLoader('/path/to/video.mp4'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.videoSrc).toContain('blob:');
    });
  });
  
  it('should handle errors', async () => {
    const { result } = renderHook(() => useVideoLoader('/invalid/path'));
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

---

### Step-by-Step: Split Large Component

**Example: Splitting Timeline.tsx**

#### 1. Analyze Current Structure
```
Timeline.tsx (370 lines)
├── Timeline component (100 lines)
├── TimeRuler component (50 lines)
├── TrackLayer component (60 lines)
├── ClipRect component (100 lines)
├── Playhead component (40 lines)
└── TimelineControls (30 lines)
```

#### 2. Create Directory Structure
```bash
mkdir -p src/components/Timeline
touch src/components/Timeline/{Timeline,TimeRuler,Track,Clip,Playhead,Controls}.tsx
touch src/components/Timeline/{types,utils,constants}.ts
```

#### 3. Move Each Component to Separate File

```typescript
// Timeline/TimeRuler.tsx
import React from 'react';
import { Line, Text, Rect } from 'react-konva';

interface TimeRulerProps {
  zoom: number;
  duration: number;
  stageWidth: number;
  height: number;
}

export const TimeRuler: React.FC<TimeRulerProps> = React.memo(({
  zoom,
  duration,
  stageWidth,
  height
}) => {
  // Component logic here
});
```

#### 4. Extract Shared Types
```typescript
// Timeline/types.ts
export interface TimelineConfig {
  trackHeight: number;
  trackPadding: number;
  rulerHeight: number;
}

export interface TimeConversions {
  timeToX: (time: number) => number;
  xToTime: (x: number) => number;
}
```

#### 5. Extract Utilities
```typescript
// Timeline/utils.ts
export const createTimeConversions = (zoom: number) => ({
  timeToX: (time: number) => time * zoom,
  xToTime: (x: number) => x / zoom,
});

export const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

#### 6. Update Main Component
```typescript
// Timeline/Timeline.tsx
import { TimeRuler } from './TimeRuler';
import { Track } from './Track';
import { Playhead } from './Playhead';
import { Controls } from './Controls';
import { createTimeConversions } from './utils';
import { TIMELINE_CONSTANTS } from './constants';

export const Timeline: React.FC<TimelineProps> = (props) => {
  const conversions = createTimeConversions(props.zoom);
  
  return (
    <>
      <Controls {...controlProps} />
      <Stage>
        <Layer>
          <TimeRuler {...rulerProps} />
          {props.tracks.map(track => (
            <Track key={track.id} {...trackProps} />
          ))}
          <Playhead {...playheadProps} />
        </Layer>
      </Stage>
    </>
  );
};
```

---

## Priority Matrix

### Critical (Do Immediately)
These issues will cause problems as the codebase grows and are blocking other work.

| Task | Impact | Effort | Priority Score |
|------|--------|--------|----------------|
| Extract custom hooks | High | Medium | 🔴 Critical |
| Split Timeline.tsx | High | Medium | 🔴 Critical |
| Add error handling | High | Low | 🔴 Critical |
| Add validation | Medium | Low | 🔴 Critical |

### High Priority (Do This Week)
Important for code quality and maintainability.

| Task | Impact | Effort | Priority Score |
|------|--------|--------|----------------|
| Split PreviewPlayer.tsx | Medium | Low | 🟠 High |
| Container/presenter pattern | Medium | Medium | 🟠 High |
| Performance optimization | Medium | Medium | 🟠 High |
| Add constants file | Low | Low | 🟠 High |

### Medium Priority (Do This Month)
Improves quality but not urgent.

| Task | Impact | Effort | Priority Score |
|------|--------|--------|----------------|
| Add loading states | Medium | Low | 🟡 Medium |
| Add accessibility | Medium | High | 🟡 Medium |
| Add virtualization | Low | Medium | 🟡 Medium |
| Write tests | High | High | 🟡 Medium |

### Low Priority (Nice to Have)
Can be deferred to later sprints.

| Task | Impact | Effort | Priority Score |
|------|--------|--------|----------------|
| Comprehensive docs | Low | Medium | 🟢 Low |
| Performance monitoring | Low | Low | 🟢 Low |
| Advanced keyboard shortcuts | Low | Medium | 🟢 Low |

---

## Metrics & Success Criteria

### Code Quality Metrics

**Before Refactoring:**
- Average component size: 180 lines
- Largest component: 370 lines (Timeline.tsx)
- Store coupling: High (components access 2-3 stores)
- Test coverage: 0%
- Performance: Unknown

**After Refactoring Goals:**
- Average component size: <100 lines
- Largest component: <150 lines
- Store coupling: Low (container pattern)
- Test coverage: >60%
- Performance: <16ms render time

### Timeline

**Week 1:** Foundation + Custom Hooks (5.5 days)
- Day 1-3: Error handling, validation, constants, performance utils
- Day 4-5.5: Extract custom hooks

**Week 2:** Component Refactoring (4 days)
- Day 1-2: Refactor Timeline
- Day 3: Refactor PreviewPlayer
- Day 4: Create containers

**Week 3:** Performance + Polish (3 days)
- Day 1-2: Performance optimization
- Day 2.5-3: Virtualization & testing

**Week 4:** Testing & Documentation (5 days)
- Day 1: Loading states
- Day 2-2.5: Accessibility
- Day 3-4: Write tests
- Day 4.5-5: Documentation

**Total Time: ~17.5 days (3.5 weeks)**

---

## Conclusion

The codebase has a solid architectural foundation but needs refactoring for scalability. The main issues are:

1. **Component complexity** - Large components need to be split
2. **Logic extraction** - Complex logic should be in custom hooks
3. **Error handling** - Needs standardization
4. **Performance** - Needs memoization and optimization
5. **Testing** - Needs test infrastructure

Following this refactoring plan will result in:
- ✅ More maintainable code
- ✅ Better performance
- ✅ Easier testing
- ✅ Clearer separation of concerns
- ✅ Scalable architecture for future features

The estimated timeline is **3.5 weeks** for a complete refactoring, but phases can be done incrementally without blocking development.

---

## Quick Wins (Can Do Today)

If you want to make immediate improvements, start with these:

### 1. Add Constants File (30 minutes)
```typescript
// constants/timeline.ts
export const TIMELINE_CONSTANTS = {
  TRACK_HEIGHT: 60,
  TRACK_PADDING: 4,
  TIME_RULER_HEIGHT: 30,
  MIN_CLIP_DURATION: 0.1,
} as const;
```

### 2. Create Error Handler (1 hour)
```typescript
// utils/errorHandler.ts
export const handleError = async (error: unknown, context: string) => {
  console.error(`[${context}]`, error);
  // Show to user
};
```

### 3. Add LoadingSpinner Component (30 minutes)
```typescript
// components/common/LoadingSpinner.tsx
export const LoadingSpinner = () => <div className="spinner">Loading...</div>;
```

### 4. Extract useCurrentClip Hook (1 hour)
```typescript
// hooks/useCurrentClip.ts
export const useCurrentClip = () => {
  return useTimelineStore(state => {
    // Find clip at playhead
  });
};
```

**Total: ~3 hours for immediate improvement**

---

**Document Version:** 1.0  
**Last Updated:** October 28, 2025  
**Next Review:** After Phase 1 completion
