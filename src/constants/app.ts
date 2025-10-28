/**
 * Application-wide Constants
 */

export const APP_CONSTANTS = {
  // Video formats
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov', 'webm', 'avi'],
  
  // Export settings
  RESOLUTIONS: ['720p', '1080p', 'source'] as const,
  FPS_OPTIONS: [24, 30, 60],
  
  // Panel widths
  SIDEBAR_WIDTH: 320, // pixels
  
  // Performance targets
  TARGET_FPS: 60,
  TARGET_PREVIEW_FPS: 30,
} as const;

