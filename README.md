# CapCut Clone - Video Editor

A desktop video editing application built with Tauri, React, and TypeScript. Edit videos locally with timeline-based editing, clip trimming, AI-powered transcription, hashtag generation, and professional export capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Rust (latest stable)
- FFmpeg binaries (see setup below)

### Installation

```bash
# Clone and install dependencies
npm install

# Set up FFmpeg binaries (macOS)
cp /opt/homebrew/bin/ffmpeg src-tauri/binaries/
cp /opt/homebrew/bin/ffprobe src-tauri/binaries/
chmod +x src-tauri/binaries/*

# Optional: Add OpenAI API key for transcription/hashtag features
cp .env.example .env
# Edit .env: VITE_OPENAI_API_KEY=sk-your-key-here

# Run in development
npm run tauri dev
```

### Build

```bash
npm run build              # Build frontend
npm run tauri build        # Build desktop app (.app bundle)
```

## ✨ Features

- **Media Library**: Import and manage video files with thumbnails
- **Timeline Editor**: Drag-and-drop clips, trim, rearrange
- **Video Preview**: Real-time playback synchronized with timeline
- **AI Transcription**: OpenAI Whisper-powered transcription with timeline support
- **Hashtag Generation**: AI-generated hashtags from transcript content
- **Video Export**: Export timeline to MP4 with configurable settings

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + TailwindCSS v4
- **Backend**: Rust + Tauri v2
- **State**: Zustand
- **Canvas**: Konva.js (timeline rendering)
- **Media**: FFmpeg (bundled)
- **AI**: OpenAI Whisper API (optional)

## 📁 Project Structure

```
src/                # React frontend (components, store, services)
src-tauri/         # Rust backend (commands, FFmpeg executor)
_docs/             # Architecture and task documentation
memory-bank/       # AI development context
```

## 📚 Documentation

- **[Architecture](_docs/architecture.md)** - Complete system specification
- **[MVP Tasks](_docs/task-list-mvp.md)** - Development roadmap
- **Memory Bank** - Project context and patterns

## 🎯 MVP Status

- ✅ Video import and library
- ✅ Timeline-based editing
- ✅ Clip trimming
- ✅ Video preview
- ✅ Timeline transcription
- ✅ Hashtag generation
- ✅ Video export
- ✅ macOS desktop app

## 📝 License

MIT
