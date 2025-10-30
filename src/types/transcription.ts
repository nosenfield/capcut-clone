/**
 * Transcription Type Definitions
 * 
 * Types for AI-powered transcription using OpenAI Whisper API.
 * All time values are in seconds.
 */

/**
 * A segment of transcribed text with timestamps
 */
export interface TranscriptSegment {
  /** Unique identifier (UUID) */
  id: string;
  
  /** The transcribed text for this segment */
  text: string;
  
  /** Start time in seconds */
  start: number;
  
  /** End time in seconds */
  end: number;
  
  /** Confidence score (0-1, optional) */
  confidence?: number;
}

/**
 * A single word in the transcript with timestamps
 */
export interface TranscriptWord {
  /** The word text */
  word: string;
  
  /** Start time in seconds */
  start: number;
  
  /** End time in seconds */
  end: number;
  
  /** Confidence score (0-1, optional) */
  confidence?: number;
}

/**
 * Complete transcript for a video clip
 */
export interface Transcript {
  /** Unique identifier (UUID) */
  id: string;
  
  /** ID of the clip this transcript belongs to */
  clipId: string;
  
  /** Detected or specified language (ISO 639-1 code) */
  language: string;
  
  /** Segments of transcribed text */
  segments: TranscriptSegment[];
  
  /** Word-level timestamps (if available) */
  words: TranscriptWord[];
  
  /** Full transcript text (all segments concatenated) */
  fullText: string;
  
  /** Duration of the transcribed audio in seconds */
  duration: number;
  
  /** ISO 8601 timestamp when transcript was created */
  createdAt: string;
}

/**
 * Progress update during transcription
 */
export interface TranscriptionProgress {
  /** ID of the clip being transcribed */
  clipId: string;
  
  /** Current stage of transcription */
  stage: 'extracting' | 'transcribing' | 'processing' | 'complete' | 'error';
  
  /** Progress percentage (0-100) */
  percent: number;
  
  /** Human-readable status message */
  message: string;
}

/**
 * Configuration for transcription
 */
export interface TranscriptionConfig {
  /** Language code (ISO 639-1) - if not provided, will auto-detect */
  language?: string;
  
  /** OpenAI model to use (default: "whisper-1") */
  model: string;
  
  /** Response format (default: "verbose_json") */
  responseFormat: string;
  
  /** Temperature for sampling (0-1, default: 0.0) */
  temperature: number;
}

