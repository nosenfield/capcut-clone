// Frontend Recording Service
//
// Service layer that wraps Tauri commands for screen/webcam recording operations.

import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { handleError, toAppError } from '../utils/errors';

export interface RecordingStatus {
  isRecording: boolean;
  elapsed: number;
  outputPath: string | null;
  recordingType: 'screen' | { type: 'webcam'; cameraIndex: number };
}

export interface CameraInfo {
  index: number;
  name: string;
}

export class RecordingService {
  /**
   * Start screen recording
   */
  async startScreenRecording(
    resolution: '720p' | '1080p' | 'source' = '1080p',
    fps: number = 30,
    captureCursor: boolean = true,
    captureClicks: boolean = true,
    audioDevice: string | null = null
  ): Promise<void> {
    try {
      // Open save dialog for output file
      const outputPath = await save({
        filters: [{
          name: 'Video',
          extensions: ['mp4']
        }],
        defaultPath: `screen-recording-${Date.now()}.mp4`
      });

      if (!outputPath) {
        return; // User cancelled
      }

      const resolutionStr = resolution === 'source' ? 'source' : 
        resolution === '720p' ? '1280x720' : '1920x1080';

      await invoke('start_screen_recording', {
        outputPath,
        resolution: resolutionStr,
        fps,
        captureCursor,
        captureClicks,
        audioDevice: audioDevice || undefined,
      });
    } catch (error) {
      handleError(error, 'RecordingService.startScreenRecording');
      throw toAppError(error);
    }
  }

  /**
   * Start webcam recording
   */
  async startWebcamRecording(
    cameraIndex: number = 0,
    resolution: '720p' | '1080p' | 'source' = '720p',
    fps: number = 30,
    audioDevice: string | null = null
  ): Promise<void> {
    try {
      // Open save dialog for output file
      const outputPath = await save({
        filters: [{
          name: 'Video',
          extensions: ['mp4']
        }],
        defaultPath: `webcam-recording-${Date.now()}.mp4`
      });

      if (!outputPath) {
        return; // User cancelled
      }

      const resolutionStr = resolution === 'source' ? 'source' : 
        resolution === '720p' ? '1280x720' : '1920x1080';

      await invoke('start_webcam_recording', {
        outputPath,
        cameraIndex,
        resolution: resolutionStr,
        fps,
        audioDevice: audioDevice || undefined,
      });
    } catch (error) {
      handleError(error, 'RecordingService.startWebcamRecording');
      throw toAppError(error);
    }
  }

  /**
   * Stop current recording
   * Returns the output file path
   */
  async stopRecording(): Promise<string> {
    try {
      const outputPath = await invoke<string>('stop_recording');
      return outputPath;
    } catch (error) {
      handleError(error, 'RecordingService.stopRecording');
      throw toAppError(error);
    }
  }

  /**
   * Get current recording status
   */
  async getRecordingStatus(): Promise<RecordingStatus> {
    try {
      const status = await invoke<RecordingStatus>('get_recording_status');
      return status;
    } catch (error) {
      handleError(error, 'RecordingService.getRecordingStatus');
      throw toAppError(error);
    }
  }

  /**
   * List available cameras
   */
  async listCameras(): Promise<CameraInfo[]> {
    try {
      const cameras = await invoke<CameraInfo[]>('list_cameras');
      return cameras;
    } catch (error) {
      handleError(error, 'RecordingService.listCameras');
      throw toAppError(error);
    }
  }
}

// Export singleton instance
export const recordingService = new RecordingService();


