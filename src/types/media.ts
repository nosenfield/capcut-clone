/**
 * Media Type Definitions
 * 
 * Types for managing video/audio files in the media library.
 * All time values are in seconds, not frames.
 */

/**
 * Represents an imported media file in the library
 */
export interface MediaFile {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Original filename */
  name: string;
  
  /** Absolute file path on disk */
  path: string;
  
  /** Type of media content */
  type: 'video' | 'audio';
  
  /** Duration in seconds */
  duration: number;
  
  /** Video width in pixels */
  width: number;
  
  /** Video height in pixels */
  height: number;
  
  /** Frames per second */
  fps: number;
  
  /** File size in bytes */
  fileSize: number;
  
  /** Thumbnail data URL or blob URL for preview */
  thumbnailUrl: string;
  
  /** Timestamp when file was imported */
  createdAt: Date;
}

/**
 * Metadata extracted from video file via FFprobe
 */
export interface MediaMetadata {
  /** Duration in seconds */
  duration: number;
  
  /** Video width in pixels */
  width: number;
  
  /** Video height in pixels */
  height: number;
  
  /** Frames per second */
  fps: number;
  
  /** Video codec (e.g., 'h264', 'vp9') */
  codec: string;
  
  /** Bitrate in bits per second */
  bitrate: number;
}

