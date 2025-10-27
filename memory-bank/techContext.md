# Technical Context - CapCut Clone Video Editor

**Last Updated**: 2025-01-XX  
**Technology Stack Version**: As documented

## Core Technology Stack

### Desktop Framework
**Tauri v2** - Rust-based framework for building desktop applications
- **Purpose**: Native desktop shell wrapping web frontend
- **Why**: Small bundle size, fast performance, Rust backend for system operations
- **Integration**: IPC (Inter-Process Communication) between React frontend and Rust backend

### Frontend Framework
**React 19.1.0** - UI library
- **Purpose**: Component-based UI rendering
- **Why**: Industry standard, extensive ecosystem, component reusability
- **Style**: Functional components with hooks

**TypeScript ~5.8.3** - Type-safe JavaScript
- **Purpose**: Static type checking and improved DX
- **Why**: Catch errors at compile time, better IDE support
- **Configuration**: Stric mode enabled

**Vite 7.0.4** - Build tool and dev server
- **Purpose**: Fast development and optimized production builds
- **Why**: Instant HMR, fast builds, plugin ecosystem
- **Integration**: Tauri Vite plugin for desktop integration

### State Management
**Zustand 5.0.8** - Lightweight state management
- **Purpose**: Global application state
- **Why**: Minimal boilerplate, hook-based API, no context providers
- **Pattern**: One store per domain (media, timeline, app)

### Canvas & Rendering
**Konva 10.0.8** - 2D canvas library
- **Purpose**: Timeline rendering and interactions
- **Why**: Performance optimizations, event handling, layer system
- **Usage**: Timeline canvas with draggable clips, time ruler, playhead

**React-Konva 19.2.0** - React bindings for Konva
- **Purpose**: Declarative Konva components
- **Why**: React component model for canvas elements
- **Usage**: Timeline components rendered as React components

### Styling
**TailwindCSS 4.1.16** - Utility-first CSS framework
- **Purpose**: Rapid UI styling
- **Why**: Consistent design system, dark theme support, responsive utilities
- **Pattern**: Utility classes, dark mode via classes
- **Note**: TailwindCSS v4 doesn't require `tailwind.config.js` - uses `@import "tailwindcss"` in CSS files instead

**PostCSS 8.5.6** - CSS processing
- **Purpose**: TailwindCSS integration
- **Why**: Required for Tailwind build process

### Media Processing
**FFmpeg** - Video/audio processing (bundled binary)
- **Purpose**: Video metadata extraction, thumbnail generation, video export
- **Why**: Industry standard, comprehensive codec support
- **Integration**: Executed via Tauri backend (Rust command execution)
- **Size**: ~50-80MB binary

### Utilities
**UUID 13.0.0** - Unique identifier generation
- **Purpose**: Generate IDs for clips, tracks, media files
- **Why**: Guaranteed uniqueness across sessions

### Backend Language
**Rust (Edition 2021)** - Systems programming language
- **Purpose**: Tauri backend, FFmpeg execution, file I/O
- **Why**: Memory safety, performance, system integration
- **Cargo**: Rust package manager

## Development Tools

### Build Tools
- **Vite**: Frontend bundling and dev server
- **Cargo**: Rust compilation and dependency management
- **Tauri CLI**: Desktop app building and bundling

### Linting & Formatting
- **ESLint**: JavaScript/TypeScript linting (recommended)
- **Prettier**: Code formatting (recommended)

### Version Control
- **Git**: Source control

## Project Configuration Files

### Frontend Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler configuration
- `tsconfig.node.json` - TypeScript config for Vite
- `vite.config.ts` - Vite and Tauri plugin configuration
- **Note**: TailwindCSS v4 doesn't require a config file - uses CSS `@import` instead

### Backend Configuration
- `src-tauri/Cargo.toml` - Rust dependencies and crate configuration
- `src-tauri/tauri.conf.json` - Tauri app configuration (window, bundle settings)
- `src-tauri/capabilities/default.json` - Tauri v2 permissions (capabilities-based security)

**Note**: Tauri v2 uses capabilities-based permissions in `capabilities/default.json` rather than configuring permissions in `tauri.conf.json` directly.

### Build Configuration
- `.gitignore` - Git ignore patterns
- `.cursorignore` - Cursor IDE ignore patterns

## Scripts & Commands

### Development
```bash
npm run dev              # Start Vite dev server (frontend only)
npm run tauri dev        # Start Tauri dev mode (full desktop app)
```

### Production Build
```bash
npm run build            # Build frontend for production
npm run tauri build      # Build complete desktop app
```

### Preview
```bash
npm run preview          # Preview production frontend build
```

## Dependencies

### Production Dependencies
- `@tauri-apps/api ^2` - Tauri API client
- `@tauri-apps/plugin-opener ^2` - File opening plugin
- `konva ^10.0.8` - Canvas rendering
- `react ^19.1.0` - UI library
- `react-dom ^19.1.0` - React DOM renderer
- `react-konva ^19.2.0` - Konva React bindings
- `uuid ^13.0.0` - UUID generation
- `zustand ^5.0.8` - State management

### Development Dependencies
- `@tauri-apps/cli ^2` - Tauri CLI tools
- `@types/react ^19.1.8` - React type definitions
- `@types/react-dom ^19.1.6` - React DOM type definitions
- `@vitejs/plugin-react ^4.6.0` - Vite React plugin
- `autoprefixer ^10.4.21` - CSS vendor prefixing
- `postcss ^8.5.6` - CSS processing
- `tailwindcss ^4.1.16` - CSS framework
- `typescript ~5.8.3` - Type checking
- `vite ^7.0.4` - Build tool

### Rust Dependencies (Cargo.toml)
- `tauri ^2` - Tauri framework
- `tauri-plugin-opener ^2` - File opening
- `tauri-plugin-dialog ^2` - File dialogs (added in setup)
- `tauri-plugin-fs ^2` - Filesystem operations (added in setup)
- `serde ^1` - Serialization framework
- `serde_json ^1` - JSON parsing

## Platform Requirements

### Target Platform
- **OS**: macOS (Apple Silicon and Intel)
- **Architecture**: macOS bundle (.app), DMG installer

### Development Requirements
- **Node.js**: v18+ recommended
- **Rust**: Latest stable version
- **Cargo**: Bundled with Rust
- **FFmpeg**: Will be bundled with app

### Runtime Requirements (User)
- **macOS**: 10.13 or later
- **Disk Space**: ~200MB for application + FFmpeg

## File Structure

```
capcut-clone/
├── _docs/                    # Project documentation
│   ├── architecture.md
│   ├── task-list-mvp.md
│   └── task-list-final.md
├── memory-bank/              # AI context (this directory)
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── activeContext.md
│   ├── systemPatterns.md
│   ├── techContext.md (this file)
│   └── progress.md
├── src/                      # React frontend
│   ├── components/          # UI components
│   ├── store/               # Zustand stores
│   ├── services/            # Business logic
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Helper functions
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── commands.rs      # Tauri commands
│   │   ├── ffmpeg.rs        # FFmpeg execution
│   │   └── main.rs          # Entry point
│   ├── binaries/            # FFmpeg binary (gitignored)
│   ├── icons/               # App icons
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Development Setup

### Initial Setup Steps
1. Clone repository
2. Run `npm install`
3. Install Rust (if not installed)
4. Build Rust dependencies: `cd src-tauri && cargo build`
5. Download FFmpeg binary to `src-tauri/binaries/`
6. Run `npm run tauri dev`

### IDE Setup
- **Recommended**: VS Code with extensions:
  - Tauri VS Code extension
  - rust-analyzer
  - ESLint
  - Prettier

## API Reference (Tauri Commands)

### Media Operations
- `get_media_metadata(file_path: String)` → `MediaMetadata`
- `generate_thumbnail(file_path: String, timestamp: f64)` → `String` (base64)

### Export Operations
- `export_video(clips: Vec<ClipInfo>, output_path: String, resolution: String, fps: u32)` → `Result<()>`

### Data Types (Rust)
```rust
pub struct MediaMetadata {
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub codec: String,
    pub bitrate: u64,
}

pub struct ClipInfo {
    pub file_path: String,
    pub start_time: f64,
    pub duration: f64,
    pub trim_start: f64,
    pub trim_end: f64,
}
```

## Security Considerations

### Tauri Permissions
- **Principle**: Least privilege
- **File System**: Restricted to app data directories
- **Shell**: Only FFmpeg execution via sidecar
- **Dialog**: Open/save file dialogs

### Data Privacy
- All processing local (no cloud dependencies)
- Media files not uploaded anywhere
- No telemetry or analytics

## Performance Characteristics

### Startup Time
- Target: <5 seconds
- Factors: Tauri initialization, Rust compilation in dev, FF crunch load

### Runtime Performance
- **Timeline**: Responsive with 10+ clips (60fps target)
- **Preview**: 30fps minimum playback
- **Export**: Near real-time for simple projects
- **Memory**: <1GB for typical project

### Bundle Size
- Target: <200MB total
- Breakdown: FFmpeg (~80MB) + Tauri (~20MB) + Frontend (~10MB) + Assets

## Known Technical Constraints

1. **FFmpeg Dependency**: Large binary must be bundled
2. **Single-threaded Preview**: JavaScript preview uses single video element
3. **No Hardware Acceleration**: CPU-based rendering (future enhancement)
4. **macOS Only**: No Windows/Linux support in MVP

## Future Technical Enhancements

1. Hardware-accelerated encoding (GPU)
2. Proxy video generation for large files
3. WebWorkers for off-main-thread processing
4. Virtual scrolling for 100+ clip timelines
5. Progressive thumbnail generation

