/**
 * Timeline Type Definitions
 * 
 * Types for managing clips on the timeline and export settings.
 * All time values are in seconds, not frames.
 */

/**
 * A clip placed on the timeline
 */
export interface TimelineClip {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Reference to the MediaFile this clip uses */
  mediaFileId: string;
  
  /** Which track this clip is on */
  trackId: string;
  
  /** Position on timeline in seconds */
  startTime: number;
  
  /** Clip duration in seconds */
  duration: number;
  
  /** Trim offset from source start in seconds */
  trimStart: number;
  
  /** Trim offset from source end in seconds */
  trimEnd: number;
  
  /** Z-index layer for overlays (0 = base layer) */
  layer: number;
}

/**
 * A track on the timeline (contains clips)
 */
export interface TimelineTrack {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Display name for the track */
  name: string;
  
  /** Type of track content */
  type: 'video' | 'audio';
  
  /** Ordered clips on this track */
  clips: TimelineClip[];
  
  /** Whether track is muted */
  muted: boolean;
  
  /** Whether track is locked (prevent editing) */
  locked: boolean;
}

/**
 * Complete timeline state
 */
export interface TimelineState {
  /** All tracks in the timeline */
  tracks: TimelineTrack[];
  
  /** Current playhead position in seconds */
  playheadPosition: number;
  
  /** Total timeline duration in seconds */
  duration: number;
  
  /** Pixels per second (for UI scaling) */
  zoom: number;
  
  /** Whether timeline is currently playing */
  isPlaying: boolean;
}

/**
 * Settings for video export
 */
export interface ExportSettings {
  /** Output resolution */
  resolution: '720p' | '1080p' | 'source';
  
  /** Output frame rate */
  fps: number;
  
  /** Video codec */
  codec: string;
  
  /** Output file path */
  outputPath: string;
}

