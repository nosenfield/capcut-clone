// Frontend Video Service
//
// Service layer that wraps Tauri commands for media operations.
// Provides high-level API for importing videos, generating thumbnails, and exporting.

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { MediaFile, MediaMetadata } from '../types/media';
import { v4 as uuidv4 } from 'uuid';
import { handleError, createFFmpegError, toAppError } from '../utils/errors';

export class VideoService {
  /**
   * Open file dialog and import selected video files
   * Returns array of MediaFile objects
   */
  async importVideos(): Promise<MediaFile[]> {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Video',
          extensions: ['mp4', 'mov', 'webm', 'avi']
        }]
      });
      
      if (!selected || (Array.isArray(selected) && selected.length === 0)) {
        return [];
      }
      
      const paths = Array.isArray(selected) ? selected : [selected];
      const mediaFiles: MediaFile[] = [];
      
      const errors: string[] = [];
      
      for (const path of paths) {
        try {
          const mediaFile = await this.createMediaFile(path as string);
          mediaFiles.push(mediaFile);
        } catch (error) {
          handleError(error, `VideoService.importVideos - ${path}`);
          const appError = toAppError(error, `VideoService.importVideos`);
          errors.push(`${path.split('/').pop()}: ${appError.userMessage}${appError.context?.debug ? `\nDebug: ${appError.context.debug}` : ''}`);
        }
      }
      
      // If some files failed to import, throw error with details
      if (errors.length > 0 && mediaFiles.length === 0) {
        // All files failed
        throw new Error(`Failed to import any files:\n${errors.join('\n')}`);
      } else if (errors.length > 0) {
        // Some files failed
        const partialError = new Error(`Some files failed to import:\n${errors.join('\n')}`);
        handleError(partialError, 'VideoService.importVideos - partial failure');
        // Return successfully imported files but don't throw (files may still be valid)
      }
      
      return mediaFiles;
    } catch (error) {
      handleError(error, 'VideoService.importVideos - dialog');
      throw error; // Re-throw to let caller handle UI display
    }
  }
  
  /**
   * Create MediaFile object from file path
   * Fetches metadata and generates thumbnail
   */
  private async createMediaFile(path: string): Promise<MediaFile> {
    try {
      // Get metadata from backend
      const metadata = await invoke<MediaMetadata>('get_media_metadata', {
        filePath: path
      });
      
      // Generate thumbnail
      const thumbnailUrl = await this.generateThumbnail(path, 0);
      
      const fileName = path.split('/').pop() || 'Unknown';
      
      return {
        id: uuidv4(),
        name: fileName,
        path,
        type: 'video',
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        fps: metadata.fps,
        fileSize: metadata.fileSize || 0,
        thumbnailUrl,
        createdAt: new Date()
      };
    } catch (error) {
      handleError(error, 'VideoService.createMediaFile');
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStderr = error && typeof error === 'object' && 'stderr' in error 
        ? String((error as any).stderr) 
        : errorMsg;
      throw createFFmpegError(errorStderr, `get_media_metadata for: ${path}`);
    }
  }
  
  /**
   * Generate thumbnail for video at specific timestamp
   * Returns base64 data URL
   */
  async generateThumbnail(filePath: string, timestamp: number): Promise<string> {
    try {
      const base64Image = await invoke<string>('generate_thumbnail', {
        filePath,
        timestamp
      });
      
      return `data:image/jpeg;base64,${base64Image}`;
    } catch (error) {
      handleError(error, 'VideoService.generateThumbnail');
      throw createFFmpegError(String(error));
    }
  }
  
  /**
   * Export timeline to video file
   */
  async exportVideo(
    clips: Array<{
      filePath: string;
      startTime: number;
      duration: number;
      trimStart: number;
      trimEnd: number;
    }>,
    outputPath: string,
    resolution: '720p' | '1080p' | 'source',
    fps: number,
    compositionLength: number
  ): Promise<void> {
    try {
      await invoke('export_video', {
        clips,
        outputPath,
        resolution,
        fps,
        compositionLength
      });
    } catch (error) {
      handleError(error, 'VideoService.exportVideo');
      throw createFFmpegError(String(error));
    }
  }
  
  /**
   * Get video duration without full metadata
   */
  async getVideoDuration(filePath: string): Promise<number> {
    try {
      const metadata = await invoke<MediaMetadata>('get_media_metadata', {
        filePath
      });
      return metadata.duration;
    } catch (error) {
      handleError(error, 'VideoService.getVideoDuration');
      throw createFFmpegError(String(error));
    }
  }

  /**
   * Create MediaFile from existing file path (e.g., after recording)
   * Adds the file to the media library
   */
  async createMediaFileFromPath(path: string): Promise<MediaFile> {
    try {
      const mediaFile = await this.createMediaFile(path);
      
      // Add to media store (via import, which will add to store and timeline)
      // This is a simple approach - in a more sophisticated implementation,
      // we might directly add to store
      return mediaFile;
    } catch (error) {
      handleError(error, 'VideoService.createMediaFileFromPath');
      throw createFFmpegError(String(error));
    }
  }
}

// Export singleton instance
export const videoService = new VideoService();

