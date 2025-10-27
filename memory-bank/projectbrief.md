# Project Brief - CapCut Clone Video Editor

**Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Initial Development (MVP Planning)

## Executive Summary

This project is building a desktop video editing application similar to CapCut - a professional video editor for macOS that enables users to import video clips, arrange them on a timeline, perform basic editing operations, and export the final video.

The application uses modern web technologies (React + TypeScript) wrapped in a native desktop shell (Tauri/Rust), providing the performance of native applications with the flexibility of web-based UI.

## Project Goals

### Primary Objectives
1. **Build a functional video editing desktop application** for macOS
2. **Implement core editing features**: timeline manipulation, clip trimming, preview playback
3. **Enable video export** using FFmpeg for processing
4. **Create a distributable package** (.app bundle and .dmg installer)
5. **Demonstrate AI-assisted development workflow** using modular architecture

### Success Criteria (MVP)
- ✅ Desktop app launches successfully
- ✅ Import video files (MP4/MOV)
- ✅ Timeline displays imported clips
- ✅ Preview player shows current frame
- ✅ Trim clips (adjust start/end points)
- ✅ Export produces valid MP4 file
- ✅ App packaged as .dmg

## Scope

### In Scope (MVP)
- Video import and library management
- Timeline-based editing with single track
- Basic trim functionality
- Preview playback
- Video export to MP4
- macOS desktop application

### Out of Scope (MVP)
- Multiple tracks or layering
- Screen/webcam recording
- Audio editing or waveforms
- Transitions or effects
- Undo/redo system
- Project save/load
- Cloud export

### Future Scope (Post-MVP)
See `_docs/task-list-final.md` for full feature list including:
- Multi-track support
- Native recording (screen, webcam, audio)
- Project persistence
- Advanced audio features
- Export presets and cloud integration

## Constraints

### Technical Constraints
- **Platform**: macOS only (no Windows/Linux in MVP)
- **Performance**: Timeline responsive with 10+ clips
- **Bundle Size**: Reasonable package size (~200MB)
- **Dependencies**: Must bundle FFmpeg binary

### Resource Constraints
- Development timeline: Organized by phases (foundation → backend → frontend → integration)
- Learning curve: Tauri + Rust for backend
- Media processing: FFmpeg is critical dependency

## Target Users

### Primary Personas
1. **Content Creators**: Social media video creators needing quick edits
2. **Educators**: Creating tutorial and lesson videos
3. **Casual Editors**: Personal video projects and memories

### User Needs
- Simple, intuitive editing interface
- Fast import and preview
- Reliable export functionality
- Local desktop application (privacy-focused)

## Key Requirements

### Functional Requirements
1. Import multiple video files
2. Display thumbnails and metadata
3. Drag-and-drop clips onto timeline
4. Reposition clips on timeline
5. Trim clip start/end points
6. Play video preview at playhead position
7. Export timeline to MP4

### Non-Functional Requirements
1. **Performance**: App launch <5 seconds, preview at 30fps
2. **Responsiveness**: Timeline works smoothly with 10+ clips
3. **Reliability**: No crashes during normal operation
4. **Usability**: Clean, modern UI (dark theme)
5. **Maintainability**: Modular architecture for AI-assisted development

## Architecture Overview

The application follows a clear layered architecture:

```
React Frontend (TypeScript)
    ↓
Zustand State Management
    ↓
Tauri IPC
    ↓
Rust Backend
    ↓
FFmpeg Binary
```

**Key Components**:
- **Media Library**: Import and manage video files
- **Timeline Editor**: Konva.js canvas for clip arrangement
- **Preview Player**: HTML5 video element for playback
- **Export Dialog**: Settings and progress for video export
- **State Management**: Zustand stores for global state
- **Backend Services**: Rust commands for FFmpeg operations

## Development Strategy

### AI-First Development
- Modular design with clear boundaries
- Well-defined interfaces for incremental development
- Explicit dependency declarations
- Single responsibility per module

### Phase-Based Implementation
1. **Phase 1**: Project foundation (Task 1.1-1.4)
2. **Phase 2**: Backend & FFmpeg (Task 2.1-2.3)
3. **Phase 3**: Media import & library (Task 3.1-3.2)
4. **Phase 4**: Timeline editor (Task 4.1-4.3)
5. **Phase 5**: Video preview (Task 5.1-5.2)
6. **Phase 6**: Basic editing (Task 6.1-6.2)
7. **Phase 7**: Export functionality (Task 7.1-7.2)
8. **Phase 8**: Application integration (Task 8.1-8.2)
9. **Phase 9**: Testing & polish (Task 9.1-9.3)
10. **Phase 10**: Packaging (Task 10.1-10.3)

## References

- **Architecture Document**: `_docs/architecture.md`
- **MVP Task List**: `_docs/task-list-mvp.md`
- **Full Product Tasks**: `_docs/task-list-final.md`
- **Tauri Documentation**: https://tauri.app
- **FFmpeg Documentation**: https://ffmpeg.org

 alunos

