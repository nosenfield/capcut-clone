# CapCut Clone - Video Editor

A desktop video editing application built with Tauri, React, and TypeScript. Edit videos locally with timeline-based editing, clip trimming, and professional export capabilities.

## 📚 Documentation

- **[Architecture Overview](_docs/architecture.md)** - Complete system specification and design
- **[MVP Task List](_docs/task-list-mvp.md)** - Development roadmap for MVP
- **[Full Product Tasks](_docs/task-list-final.md)** - Post-MVP feature roadmap
- **[Memory Bank](memory-bank/)** - AI development context and project state

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Rust (latest stable)
- FFmpeg (see setup below)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Download FFmpeg binaries (see below)
4. Run in development mode:
   ```bash
   npm run tauri dev
   ```

### FFmpeg Setup

Download FFmpeg and FFprobe binaries for macOS and place them in `src-tauri/binaries/`:

1. Download from [FFmpeg official site](https://ffmpeg.org/download.html) or use Homebrew
2. Copy binaries:
   ```bash
   cp /opt/homebrew/bin/ffmpeg src-tauri/binaries/
   cp /opt/homebrew/bin/ffprobe src-tauri/binaries/
   ```
3. Make executable:
   ```bash
   chmod +x src-tauri/binaries/ffmpeg
   chmod +x src-tauri/binaries/ffprobe
   ```

> **Note**: Binaries are gitignored due to size (~80MB). Each developer must download them separately.

## 📁 Project Structure

```
├── _docs/              # Project documentation
├── memory-bank/        # AI context (persistent across sessions)
├── src/                # React frontend
│   ├── components/     # UI components
│   ├── store/         # Zustand state management
│   ├── services/      # Business logic
│   └── types/         # TypeScript definitions
├── src-tauri/         # Rust backend
│   ├── src/           # Rust source code
│   └── binaries/      # FFmpeg binaries (gitignored)
└── scripts/           # Utility scripts
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run tauri dev` - Start full desktop app with hot reload
- `npm run build` - Build frontend for production
- `npm run tauri build` - Build complete desktop application

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 🎯 MVP Goals

- Import video files (MP4/MOV)
- Timeline-based editing with single track
- Basic trim functionality
- Video preview playback
- Export to MP4
- Package as macOS .app bundle

## 📝 Notes

- **AI Development**: This project uses a memory bank system for AI-assisted development. See `memory-bank/` for context.
- **Context Summaries**: The `_context-summaries/` directory contains session summaries (gitignored).
- **Temporary Files**: The `_temp/` directory is for scratch work (gitignored).

## 📄 License

MIT

## 🙏 Credits

Built with [Tauri](https://tauri.app), [React](https://react.dev), and [FFmpeg](https://ffmpeg.org)
