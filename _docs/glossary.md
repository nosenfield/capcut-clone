# Video Editor UX Glossary

**Purpose**: Common terms and definitions for discussing video editor UX/UI concepts.

---

## Core Concepts

### **Composition**
The overall "container" or "sequence" for a video project. Think of it like a Premiere Pro sequence or Final Cut event.

- A composition contains tracks, clips, and settings
- When the user opens the app, they have one empty composition
- The composition has a defined length/duration (working area)

### **Composition Length / Duration**
The fixed time limit of the working area, measured in seconds.

- Default: 10 seconds
- User can change this via timeline controls
- Does NOT automatically change when clips are added
- Represents the "working area" or "canvas" for the video
- Playback stops when playhead reaches composition length

### **Timeline**
The visual representation of the composition, showing tracks, clips, and time markers.

- Shows the time ruler with second markers
- Displays clips positioned on tracks
- Visualizes the playhead position
- Different from "composition" - timeline is just the UI view

### **Playhead**
The red vertical indicator showing the current playback position.

- Moves horizontally during playback
- Can be dragged to scrub through the timeline
- Represents the "current time" in the composition

### **Clip**
A piece of media (video, audio, etc.) placed on the timeline.

- Has a start time and duration
- Can be trimmed, moved, deleted
- References a source media file
- Multiple clips can be on the same track

### **Track**
A horizontal row where clips are arranged.

- Can contain multiple clips
- Tracks are stacked vertically (Track 1, Track 2, etc.)
- For MVP: single video track

### **Media Library**
The collection of imported source files.

- Displays thumbnails and metadata
- Files can be imported, previewed, and deleted
- Files are NOT automatically on the timeline

---

## Timeline Concepts

### **Time Ruler**
The horizontal time scale at the top of the timeline.

- Shows second/minute markers
- Updates with zoom level
- Used for seeking (clicking to jump to position)

### **Zoom Level**
The scale of the timeline, measured in pixels per second.

- Affects how clips are displayed (wider when zoomed in)
- User can adjust via zoom slider
- Affects tick marks on time ruler

### **Trim**
Adjusting the start/end points of a clip to remove unwanted content.

- **Trim Start / Head Trim / Front Trim**: Remove beginning of clip
- **Trim End / Tail Trim / Back Trim**: Remove end of clip
- Clips can be trimmed independently of their position

**Terminology:**
- **Head / Front / Start**: The beginning of a clip
- **Tail / Back / End**: The ending of a clip
- We may use these terms interchangeably when discussing clip boundaries

---

## Playback Concepts

### **Gap**
Empty space between clips or before/after clips on the timeline.

- Playhead should continue advancing through gaps
- No video plays during gaps (video element pauses)
- Playback continues until reaching composition end

### **Playback Position**
The current time position during playback.

- Synced between timeline playhead and video element
- Advances in real-time during playback
- Can be manually changed via seeking

### **Seeking**
Manually moving the playhead to a different position.

- Clicking timeline ruler
- Dragging playhead
- Updating playback position programmatically

---

## State Management

### **Timeline Duration (Current - WRONG)**
Currently calculated as the end of the last clip.

- **Problem**: Grows automatically as clips are added
- **Should be**: A separate fixed value (composition length)
- **Fix needed**: Remove automatic duration calculation for playback logic

### **Composition Length (Should Be)**
The fixed working area duration, set by the user.

- Default: 10 seconds
- User-controlled via settings
- Used to determine when playback should stop
- Independent of clip positions

---

## Current Issues

### Issue 1: Composition vs Timeline Duration
- **Expected**: Fixed 10s composition length
- **Actual**: Duration auto-grows with clips
- **Fix**: Separate `compositionLength` state from auto-calculated `duration`

### Issue 2: Playhead Stopping
- **Expected**: Playhead continues to composition end
- **Actual**: Playhead stops at end of last clip
- **Fix**: Check against `compositionLength` not calculated `duration`

---

## Implementation Notes

When implementing features, use this terminology:
- Say "composition length" not "timeline duration"
- Say "playhead" not "cursor" or "scrubber"
- Say "clip" not "segment" or "element"
- Say "track" not "layer" or "channel"

