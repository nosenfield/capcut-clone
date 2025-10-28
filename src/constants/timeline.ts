/**
 * Timeline Constants
 * 
 * Constants for timeline rendering and interaction
 */

export const TIMELINE_CONSTANTS = {
  // Track dimensions
  TRACK_HEIGHT: 60,
  TRACK_PADDING: 4,
  TIMELINE_HEIGHT: 200,
  TIME_RULER_HEIGHT: 30,
  
  // Zoom settings
  MIN_ZOOM: 10, // pixels per second
  MAX_ZOOM: 200, // pixels per second
  DEFAULT_ZOOM: 50, // pixels per second
  
  // Clip settings
  MIN_CLIP_DURATION: 0.1, // seconds
  TRIM_HANDLE_WIDTH: 8, // pixels
  
  // Time ruler settings
  TICK_INTERVAL_SMALL: 1, // seconds
  TICK_INTERVAL_MEDIUM: 2, // seconds
  TICK_INTERVAL_LARGE: 5, // seconds
  ZOOM_THRESHOLD_SMALL: 30, // pixels per second
  ZOOM_THRESHOLD_MEDIUM: 50, // pixels per second
  ZOOM_THRESHOLD_LARGE: 20, // pixels per second
} as const;

