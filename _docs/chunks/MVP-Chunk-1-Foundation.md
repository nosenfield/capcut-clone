# MVP Development - Chunk 1: Foundation

**Phase**: Phase 1 - Project Foundation  
**Estimated Time**: 2-4 hours  
**Dependencies**: None (starting point)

## Architecture Reference

This chunk implements:
- **Module 1**: Project Structure & Configuration
- **Module 2**: Type Definitions
- **Module 3**: State Management

See `_docs/architecture.md` for complete specifications.

---

## Overview

This chunk establishes the foundational structure of the application. You'll set up the Tauri + React project, define TypeScript types, and create Zustand state stores. This foundation is critical for all subsequent development.

**Success Criteria**:
- ✅ Dev environment launches successfully
- ✅ All type definitions compile
- ✅ State stores work in isolation
- ✅ Project structure matches architecture

---

## Tasks

### Task 1.1: Initialize Tauri Project
**Module**: Module 1 (Project Structure)  
**Priority**: Critical

**Description**:
Create new Tauri + React + TypeScript project with Vite. Set up directory structure as defined in architecture.

**Steps**:
1. Run `npm create tauri-app` with React + TypeScript template (if starting fresh)
2. Verify documentation directories exist:
   - `_docs/` with architecture.md, task lists
   - `_context-summaries/` for AI context (add .gitkeep if empty)
   - `_temp/` for temporary files (add .gitkeep if empty)
3. Create source code directory structure:
   - `src/components/` with subdirectories (MediaLibrary, Timeline, Preview, ExportDialog)
   - `src/store/` for state management
   - `src/services/` for business logic
   - `src/types/` for TypeScript definitions
   - `src/utils/` for helpers
4. Create backend directory structure:
   - `src-tauri/binaries/` for FFmpeg (add to .gitignore)
   - `scripts/` for utility scripts
5. Install core dependencies: `zustand`, `konva`, `react-konva`, `uuid`
6. Install TailwindCSS and configure
7. Create comprehensive `.gitignore` file
8. Verify dev server runs: `npm run tauri dev`

**Acceptance Criteria**:
- [ ] `npm run tauri dev` launches app window
- [ ] Hot reload works (changes reflect immediately)
- [ ] Directory structure matches architecture
- [ ] All dependencies installed and importable
- [ ] TailwindCSS classes work in components
- [ ] `.gitignore` configured properly

**Files Created**:
- Project root with proper structure
- `tailwind.config.js`
- `vite.config.ts`
- `.gitignore`
- `_context-summaries/.gitkeep`
- `_temp/.gitkeep`
- `src-tauri/binaries/` directory
- `scripts/` directory

---

### Task 1.2: Configure Tauri Settings
**Module**: Module 1 (Project Structure)  
**Dependencies**: Task 1.1  
**Priority**: Critical

**Description**:
Configure `tauri.conf.json` with proper permissions and settings.

**Steps**:
1. Open `src-tauri/tauri.conf.json`
2. Set bundle identifier: `com.nosenfield.capcut-clone`
3. Configure allowlist:
   - Enable `shell.execute` and `shell.sidecar` for FFmpeg
   - Enable `dialog.open` and `dialog.save` for file pickers
   - Enable `fs.readFile` and `fs.writeFile` with proper scopes
4. Set bundle target to `dmg` (macOS only)
5. Add resources path for FFmpeg binaries (directory prepared in Task 1.1)

**Acceptance Criteria**:
- [ ] `tauri.conf.json` has restrictive permissions
- [ ] Bundle settings configured for macOS
- [ ] File system scope includes necessary directories
- [ ] App identifier is unique
- [ ] Resources array configured for FFmpeg

**Files Modified**:
- `src-tauri/tauri.conf.json`

---

### Task 1.3: Define TypeScript Types
**Module**: Module 2 (Type Definitions)  
**Dependencies**: Task 1.1  
**Priority**: High

**Description**:
Create all TypeScript interfaces for domain models as specified in Module 2 of the architecture.

**Steps**:
1. Create `src/types/media.ts` with:
   - `MediaFile` interface
   - `MediaMetadata` interface
2. Create `src/types/timeline.ts` with:
   - `TimelineClip` interface
   - `TimelineTrack` interface
   - `TimelineState` interface
   - `ExportSettings` interface
3. Add JSDoc comments for complex fields

**Type Specifications** (from architecture):

```typescript
// src/types/media.ts
export interface MediaFile {
  id: string;                    // UUID
  name: string;                  // Original filename
  path: string;                  // Absolute file path
  type: 'video' | 'audio';
  duration: number;              // Seconds
  width: number;
  height: number;
  fps: number;
  fileSize: number;              // Bytes
  thumbnailUrl: string;          // Data URL
  createdAt: Date;
}

export interface MediaMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

// src/types/timeline.ts
export interface TimelineClip {
  id: string;
  mediaFileId: string;
  trackId: string;
  startTime: number;             // Seconds
  duration: number;              // Seconds
  trimStart: number;
  trimEnd: number;
  layer: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio';
  clips: TimelineClip[];
  muted: boolean;
  locked: boolean;
}

export interface TimelineState {
  tracks: TimelineTrack[];
  playheadPosition: number;
  duration: number;
  zoom: number;                  // Pixels per second
  isPlaying: boolean;
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | 'source';
  fps: number;
  codec: string;
  outputPath: string;
}
```

**Acceptance Criteria**:
- [ ] All interfaces defined with correct types
- [ ] IDs typed as `string` (UUIDs)
- [ ] Times in seconds (`number`)
- [ ] No TypeScript errors
- [ ] Interfaces match architecture exactly

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
   - Add CRUD actions for media files
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

**Store Specifications** (from architecture):

See Module 3 in architecture.md for complete store implementations including:
- `useMediaStore`: files, selectedFileId, actions
- `useTimelineStore`: tracks, playhead, zoom, actions
- `useAppStore`: export state, errors

**Acceptance Criteria**:
- [ ] All three stores created and exportable
- [ ] Store actions work (test in dev tools)
- [ ] Initial state correct
- [ ] Duration recalculates when clips added/removed
- [ ] No TypeScript errors
- [ ] Zustand devtools show state updates

**Files Created**:
- `src/store/mediaStore.ts`
- `src/store/timelineStore.ts`
- `src/store/appStore.ts`

---

## Testing This Chunk

**Verification Steps**:
1. Launch `npm run tauri dev` - app should open
2. Import types in App.tsx - should compile
3. Import stores in App.tsx - should work
4. Check Zustand devtools - stores should be visible
5. Test a store action (add a test button) - state should update

**Common Issues**:
- Tauri not launching: Check Node version (16+)
- TypeScript errors: Verify all types imported correctly
- Zustand not working: Check installation (`npm install zustand`)

---

## Next Chunk

**MVP-Chunk-2-Backend**: Backend & FFmpeg Integration (Phase 2)
- Implements FFmpeg execution in Rust
- Creates Tauri commands
- Requires completion of this chunk first
