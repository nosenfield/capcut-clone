# MVP Development - Chunk 3: Media Import & Library

**Phase**: Phase 3 - Media Import & Library  
**Estimated Time**: 3-4 hours  
**Dependencies**: MVP-Chunk-1-Foundation, MVP-Chunk-2-Backend

## Architecture Reference

This chunk implements:
- **Module 6**: Frontend Video Service
- **Module 7**: Media Library Component

See `_docs/architecture.md` sections for Module 6 and Module 7 for complete specifications.

---

## Prerequisites

Before starting this chunk, ensure:
- ✅ MVP-Chunk-1-Foundation is complete (types, stores defined)
- ✅ MVP-Chunk-2-Backend is complete (Tauri commands working)
- ✅ FFmpeg binaries are bundled and accessible
- ✅ Backend commands tested and working

---

## Overview

This chunk creates the media import system and visual library. You'll build a service layer that wraps Tauri commands, then create a React component to display imported media with thumbnails and metadata.

**Success Criteria**:
- ✅ File dialog opens and allows selection
- ✅ Selected videos import successfully
- ✅ Media library displays thumbnails
- ✅ Metadata shown correctly (duration, resolution, fps)
- ✅ Can select and remove media files

---

## Tasks

### Task 3.1: Create Video Service
**Module**: Module 6 (Frontend Video Service)  
**Dependencies**: Tasks 2.3, 1.4 (Backend commands, State stores)  
**Priority**: High

**Description**:
Frontend service layer that wraps Tauri commands and manages media operations.

**Steps**:
1. Create `src/services/videoService.ts`
2. Install UUID package if not already: `npm install uuid @types/uuid`
3. Implement `VideoService` class with methods:
   - `importVideos()` - opens file dialog and processes selections
   - `createMediaFile()` - private method to create MediaFile from path
   - `generateThumbnail()` - wrapper for Tauri command
   - `exportVideo()` - wrapper for export command
   - `getVideoDuration()` - quick duration lookup
4. Export singleton instance: `export const videoService = new VideoService()`
5. Add error handling for all Tauri invokes
6. Handle file dialog cancellation gracefully

**Implementation Reference**:
See Module 6 in `architecture.md` for complete VideoService implementation including:
- File dialog with video filters (MP4, MOV, WEBM, AVI)
- MediaFile creation with UUID generation
- Thumbnail generation as base64 data URL
- Batch import with per-file error handling
- Export video with clip information

**Key Code Snippets**:
```typescript
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { MediaFile, MediaMetadata } from '../types/media';
import { v4 as uuidv4 } from 'uuid';

export class VideoService {
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
  
  private async createMediaFile(path: string): Promise<MediaFile> {
    const metadata = await invoke<MediaMetadata>('get_media_metadata', {
      filePath: path
    });
    
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
      fileSize: 0,
      thumbnailUrl,
      createdAt: new Date()
    };
  }
  
  async generateThumbnail(filePath: string, timestamp: number): Promise<string> {
    const base64Image = await invoke<string>('generate_thumbnail', {
      filePath,
      timestamp
    });
    return `data:image/jpeg;base64,${base64Image}`;
  }
}

export const videoService = new VideoService();
```

**Acceptance Criteria**:
- [ ] VideoService compiles without errors
- [ ] All methods properly typed with TypeScript
- [ ] File dialog opens when `importVideos()` called
- [ ] Metadata fetched successfully for test video
- [ ] Thumbnail generated as base64 data URL
- [ ] Errors logged to console (don't crash)
- [ ] Service can be imported in components

**Files Created**:
- `src/services/videoService.ts`

---

### Task 3.2: Build Media Library Component
**Module**: Module 7 (Media Library Component)  
**Dependencies**: Task 3.1, Task 1.4 (VideoService, State stores)  
**Priority**: High

**Description**:
Create UI component for displaying and managing imported media files.

**Steps**:
1. Create `src/components/MediaLibrary/MediaLibrary.tsx`
2. Implement main `MediaLibrary` component:
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
8. Format duration as MM:SS
9. Format file size as MB

**Implementation Reference**:
See Module 7 in `architecture.md` for complete component implementation including:
- Three-column grid layout
- Card-based media display
- Import button with loading state
- Selected state highlighting
- Remove confirmation dialog

**Key UI Components**:
- Header with "Import Videos" button
- Scrollable grid of media cards
- Each card shows: thumbnail, filename, duration, resolution, fps
- Selected card has blue border
- Remove button on each card (red, top-right corner)
- Empty state when no media imported

**Styling Notes**:
- Dark theme (bg-gray-900)
- Cards: rounded corners, border on hover/select
- Thumbnail: 16:9 aspect ratio
- Metadata: small text, gray color
- Import button: blue, full width in header

**Acceptance Criteria**:
- [ ] Component renders without errors
- [ ] Import button opens file dialog
- [ ] Selected files appear in library
- [ ] Thumbnails display correctly
- [ ] Metadata formatted properly (MM:SS for duration)
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
6. Check responsive behavior

---

## Testing This Chunk

**Integration Test Steps**:
1. Launch app: `npm run tauri dev`
2. The MediaLibrary component should render (add temporarily to App.tsx if needed)
3. Click "Import Videos"
4. Select one or more video files
5. Verify:
   - Import button shows "Importing..." during process
   - Each video appears as a card
   - Thumbnails are visible
   - Duration shown as "MM:SS"
   - Resolution shown as "1920x1080" (or actual resolution)
   - FPS shown with correct value
6. Click a card:
   - Border should turn blue (selected state)
   - Store should update (check Zustand devtools)
7. Click remove button on a card:
   - Confirmation dialog should appear
   - After confirm, card should disappear
   - Store should update

**Common Issues**:
- Thumbnails not showing: Check base64 encoding in backend
- Import hangs: Check FFprobe execution and error handling
- Cards not displaying: Check Tailwind classes are configured
- Remove doesn't work: Check store actions are connected

**Debug Tips**:
- Open browser console to see any errors
- Check Network tab (although this is Tauri IPC, not HTTP)
- Use Zustand devtools to inspect state changes
- Add console.log in videoService methods to track flow

---

## Next Chunk

**MVP-Chunk-4-Timeline**: Timeline Core (Phase 4)
- Creates timeline canvas with Konva
- Implements drag-and-drop from library to timeline
- Requires completion of this chunk (media must be importable)
