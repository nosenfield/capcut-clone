# CapCut Clone - Project Documentation

> **Comprehensive documentation hub for the CapCut Clone video editor application**

This directory contains all technical documentation, architecture specifications, development guidelines, and implementation roadmaps for the video editing desktop application.

---

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [Core Documentation](#-core-documentation)
- [Project Overview](#-project-overview)
- [Development Workflow](#-development-workflow)
- [Implementation Roadmap](#-implementation-roadmap)
- [Code Guidelines](#-code-guidelines)
- [Architecture Deep Dive](#-architecture-deep-dive)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

### Essential Reading Order

1. **Start Here**: [Project Overview](#-project-overview) _(below)_
2. **Architecture**: [`architecture.md`](./architecture.md) - System design & technical stack
3. **Development**: [`task-list-mvp.md`](./task-list-mvp.md) - MVP implementation tasks
4. **Guidelines**: [`react-best-practices.md`](./react-best-practices.md) - Code standards

### For Developers New to the Project

```bash
# 1. Read this README fully
# 2. Review architecture.md for system understanding
# 3. Check current progress in task-list-mvp.md
# 4. Follow react-best-practices.md for code standards
# 5. Start implementing tasks from chunks/ directory
```

---

## 📚 Core Documentation

### Primary Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[architecture.md](./architecture.md)** | Complete system architecture, module specifications, technology stack | Understanding system design, implementing new modules, technical decisions |
| **[task-list-mvp.md](./task-list-mvp.md)** | MVP task breakdown with acceptance criteria | Daily development, tracking progress, implementation guidance |
| **[task-list-final.md](./task-list-final.md)** | Post-MVP features and enhancements | Planning future iterations, feature prioritization |
| **[react-best-practices.md](./react-best-practices.md)** | React development standards and patterns | Writing components, state management, code reviews |

### Implementation Chunks

Progressive implementation guides in the [`chunks/`](./chunks/) directory:

- **[MVP-Chunk-1-Foundation.md](./chunks/MVP-Chunk-1-Foundation.md)** - Project setup & foundation
- **[MVP-Chunk-2-Backend.md](./chunks/MVP-Chunk-2-Backend.md)** - FFmpeg integration & backend
- **[MVP-Chunk-3-MediaImport.md](./chunks/MVP-Chunk-3-MediaImport.md)** - Media library & import

Each chunk represents a deployable, testable increment of functionality.

---

## 🎯 Project Overview

### What We're Building

A **desktop video editing application** similar to CapCut that enables users to:
- Import video files (MP4/MOV)
- Arrange clips on a visual timeline
- Perform basic editing (trim, split, reorder)
- Preview edited content in real-time
- Export final video as MP4

### Technology Stack

**Core Technologies:**
- **Desktop Framework**: Tauri (Rust + WebView)
- **Frontend**: React 18 + TypeScript + Vite
- **Canvas Rendering**: Konva.js (timeline visualization)
- **Media Processing**: FFmpeg (bundled binary)
- **State Management**: Zustand
- **Styling**: TailwindCSS

**Why This Stack?**
- Tauri provides native performance with web technologies
- React + TypeScript ensures type safety and maintainability
- Konva.js enables performant canvas-based timeline
- FFmpeg handles all video processing reliably
- Zustand offers simple, effective state management

### Target Platform

**MVP**: macOS only (Intel & Apple Silicon)  
**Future**: Windows and Linux support

### Key Features (MVP)

✅ **Media Management**
- Import video files via file dialog
- Display thumbnails with metadata
- Organize in media library

✅ **Timeline Editing**
- Drag-and-drop clips onto timeline
- Visual timeline with zoom controls
- Clip repositioning and trimming
- Playhead scrubbing

✅ **Video Preview**
- Real-time preview at playhead position
- Play/pause controls
- Frame-accurate seeking

✅ **Export**
- Configurable resolution (720p/1080p/source)
- Adjustable frame rate (24/30/60 fps)
- H.264 codec with quality settings
- Progress indication

---

## 💻 Development Workflow

### Project Structure

```
video-editor/
├── _docs/                    # 📖 Documentation (you are here)
│   ├── README.md            # This file - documentation hub
│   ├── architecture.md      # System architecture
│   ├── task-list-mvp.md     # MVP tasks
│   ├── task-list-final.md   # Post-MVP features
│   ├── react-best-practices.md
│   └── chunks/              # Progressive implementation guides
│
├── _context-summaries/      # 🤖 AI development context (gitignored)
│   └── .gitkeep
│
├── _temp/                   # 🧪 Temporary files (gitignored)
│   ├── test-exports/
│   └── debug-logs/
│
├── src/                     # 🎨 React frontend
│   ├── components/
│   ├── store/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── src-tauri/               # ⚙️ Rust backend
│   ├── src/
│   ├── binaries/           # FFmpeg (gitignored, ~80MB)
│   └── icons/
│
└── public/                  # 📁 Static assets
```

### Documentation Directories

- **`_docs/`** - All project documentation (persistent, versioned)
- **`_context-summaries/`** - AI context for development tools (gitignored)
- **`_temp/`** - Scratch space for experiments (gitignored)

### AI-First Development

This project follows an **AI-assisted development methodology**:

1. **Clear Documentation**: All specs written for both human and AI consumption
2. **Modular Architecture**: Independent modules with explicit dependencies
3. **Context Management**: Use `_context-summaries/` for session continuity
4. **Iterative Implementation**: Follow chunk-based development approach

**Working with AI Coding Tools (like Cursor):**
- Start each session by reviewing relevant docs
- Use chunks/ guides for step-by-step implementation
- Store session summaries in `_context-summaries/`
- Reference architecture.md for design decisions

---

## 🗺️ Implementation Roadmap

### MVP Development Phases

**Current Status**: [Update this section as you progress]

#### Phase 1: Foundation ⚙️
- [x] Project structure and configuration
- [x] TypeScript type definitions
- [x] Zustand state stores
- **See**: [MVP-Chunk-1-Foundation.md](./chunks/MVP-Chunk-1-Foundation.md)

#### Phase 2: Backend & FFmpeg 🔧
- [ ] FFmpeg binary integration
- [ ] Rust command implementation
- [ ] Metadata extraction
- **See**: [MVP-Chunk-2-Backend.md](./chunks/MVP-Chunk-2-Backend.md)

#### Phase 3: Media Import 📥
- [ ] Media library component
- [ ] File import workflow
- [ ] Thumbnail generation
- **See**: [MVP-Chunk-3-MediaImport.md](./chunks/MVP-Chunk-3-MediaImport.md)

#### Phase 4: Timeline Editor 🎬
- [ ] Timeline canvas rendering
- [ ] Clip drag-and-drop
- [ ] Timeline controls

#### Phase 5: Video Preview 📺
- [ ] Preview player component
- [ ] Playback synchronization
- [ ] Seek controls

#### Phase 6: Basic Editing ✂️
- [ ] Clip selection
- [ ] Trim functionality
- [ ] Delete operations

#### Phase 7: Export 📤
- [ ] Export dialog UI
- [ ] Video rendering
- [ ] Progress tracking

#### Phase 8: Integration 🔗
- [ ] Main application layout
- [ ] Error handling
- [ ] Testing & polish

#### Phase 9: Packaging 📦
- [ ] App icon
- [ ] Production build
- [ ] DMG creation

### Task Management

**Primary Task List**: [`task-list-mvp.md`](./task-list-mvp.md)

Each task includes:
- Module reference
- Dependencies
- Detailed steps
- Acceptance criteria
- Files to create/modify

**Tracking Progress:**
1. Mark tasks complete in `task-list-mvp.md`
2. Check off acceptance criteria
3. Update roadmap status above
4. Move to next phase when ready

---

## 📋 Code Guidelines

### React Best Practices

Comprehensive guidelines in [`react-best-practices.md`](./react-best-practices.md)

**Key Principles:**
- Use functional components with hooks
- Keep components small (<200 lines)
- Apply single responsibility principle
- Leverage composition over inheritance
- Write testable, maintainable code

**State Management:**
- Local state for component-specific data
- Zustand stores for shared application state
- Custom hooks for reusable logic

**Performance:**
- Use `React.memo` for expensive components
- Apply `useMemo` and `useCallback` appropriately
- Implement code splitting and lazy loading

### Architecture Adherence

Follow patterns defined in [`architecture.md`](./architecture.md):

1. **Modular Design**: Each feature is an independent module
2. **Clear Dependencies**: Modules declare dependencies explicitly
3. **Type Safety**: Full TypeScript coverage
4. **Separation of Concerns**: Backend (Rust) vs Frontend (React)

### Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Follow configured rules
- **Testing**: Write tests for utilities and critical paths
- **Documentation**: Add JSDoc for complex functions
- **Comments**: Explain "why," not "what"

---

## 🏗️ Architecture Deep Dive

### System Overview

```
┌─────────────────────────────────────────┐
│         React Application               │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │  Media   │ │ Timeline │ │ Preview │ │
│  │ Library  │ │  Editor  │ │ Player  │ │
│  └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       └────────────┴──────────────┘     │
│              Global State               │
│               (Zustand)                 │
└───────────────────┬─────────────────────┘
                    │ Tauri IPC
┌───────────────────▼─────────────────────┐
│        Tauri Backend (Rust)             │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ File I/O │ │  FFmpeg  │ │ System  │ │
│  │ Commands │ │ Executor │ │ Dialogs │ │
│  └──────────┘ └──────────┘ └─────────┘ │
└───────────────────┬─────────────────────┘
                    │
              ┌─────▼──────┐
              │   FFmpeg   │
              │   Binary   │
              └────────────┘
```

### Module Architecture

The application is organized into **11 independent modules**:

1. **Project Structure** - Directory layout and configuration
2. **Type Definitions** - TypeScript interfaces
3. **State Management** - Zustand stores
4. **Tauri Commands** - IPC command definitions
5. **FFmpeg Integration** - Video processing layer
6. **Video Service** - Frontend service wrapper
7. **Media Library** - Import and display media
8. **Timeline Canvas** - Visual timeline editor
9. **Preview Player** - Video playback
10. **Export Dialog** - Export configuration and execution
11. **Main Layout** - Application composition

**Full details**: See [architecture.md](./architecture.md) for complete module specifications.

### Data Flow

```
User Action → React Component → Zustand Store → Tauri IPC → Rust Command → FFmpeg → Result → Store Update → UI Re-render
```

### Performance Considerations

- Timeline responsive with 10+ clips
- Preview playback at 30fps minimum
- App launch under 5 seconds
- No memory leaks during 15+ minute sessions

**Optimization strategies detailed in**: [architecture.md](./architecture.md)

---

## 🧪 Testing Strategy

### Manual Testing

Primary checklist in: [`task-list-mvp.md`](./task-list-mvp.md) - Task 9.1

**Key Test Scenarios:**
- Import workflows (single/multiple files)
- Timeline operations (drag, trim, reorder)
- Preview playback and seeking
- Export with various settings
- Performance under load (10+ clips)

### Automated Testing

**Future Implementation:**
- Unit tests for utilities and services
- Integration tests for FFmpeg commands
- E2E tests with Playwright

---

## 🤝 Contributing

### Getting Started

1. **Read Documentation**: Review this README and architecture.md
2. **Set Up Environment**: Follow setup instructions in task-list-mvp.md
3. **Choose a Task**: Pick from current phase in task-list-mvp.md
4. **Follow Guidelines**: Adhere to react-best-practices.md
5. **Test Thoroughly**: Complete acceptance criteria before submission

### Development Best Practices

- Write clear, self-documenting code
- Follow TypeScript strict mode
- Test locally before committing
- Update documentation when making architectural changes
- Use meaningful commit messages

### Reporting Issues

When reporting bugs or requesting features:
- Describe expected vs actual behavior
- Include reproduction steps
- Provide relevant screenshots/logs
- Reference related documentation

---

## 📝 Additional Resources

### External Documentation

- [Tauri Docs](https://tauri.app/v1/guides/) - Desktop framework
- [React Docs](https://react.dev) - Frontend library
- [Konva.js Docs](https://konvajs.org/docs/) - Canvas library
- [FFmpeg Docs](https://ffmpeg.org/documentation.html) - Media processing
- [Zustand Docs](https://zustand-demo.pmnd.rs/) - State management

### Helpful Tools

- **Cursor IDE**: AI-assisted development (use `_context-summaries/`)
- **React DevTools**: Component and state inspection
- **Tauri DevTools**: Backend debugging
- **FFmpeg CLI**: Testing video operations

---

## 📊 Project Status

**Version**: 1.0.0-alpha  
**Last Updated**: 2025-10-27  
**Status**: In Development

### Milestones

- [x] Documentation complete
- [x] Architecture defined
- [ ] MVP Phase 1 complete
- [ ] MVP Phase 2-9 in progress
- [ ] MVP feature complete
- [ ] Production build ready
- [ ] Public release

---

## 📧 Contact & Support

For questions about this documentation or the project:
- Review existing documentation thoroughly first
- Check task-list-mvp.md for implementation guidance
- Consult architecture.md for design decisions
- Reference react-best-practices.md for code standards

---

## 🔄 Document Maintenance

This README should be updated when:
- New documentation files are added
- Project structure changes significantly
- Development phases complete
- Architecture decisions evolve
- New resources or tools are adopted

**Last Major Update**: Initial creation - 2025-10-27

---

Made with ❤️ for the GauntletAI CapCut Clone project
