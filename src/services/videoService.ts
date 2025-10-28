// Frontend Video Service
//
// Service layer that wraps Tauri commands for media operations.
// Provides high-level API for importing videos, generating thumbnails, and exporting.

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { MediaFile, MediaMetadata } from '../types/media';
import { v4 as uuidv4 } from 'uuid';
import { handleError, createFFmpegError } from '../utils/errors';

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
      
      for (const path of paths) {
        try {
          const mediaFile = await this.createMediaFile(path as string);
          mediaFiles.push(mediaFile);
        } catch (error) {
          handleError(error, `VideoService.importVideos - ${path}`);
        }
      }
      
      return mediaFiles;
    } catch (error) {
      handleError(error, 'VideoService.importVideos - dialog');
      return [];
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
        fileSize: 0, // TODO: Get file size from metadata
        thumbnailUrl,
        createdAt: new Date()
      };
    } catch (error) {
      handleError(error, 'VideoService.createMediaFile');
      throw createFFmpegError(String(error));
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
    fps: number
  ): Promise<void> {
    try {
      await invoke('export_video', {
        clips,
        outputPath,
        resolution,
        fps
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
}

// Export singleton instance
export const videoService = new VideoService();

