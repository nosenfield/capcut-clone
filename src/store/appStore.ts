/**
 * App Store
 * 
 * Global state for app-level features (export progress, error handling).
 */

import { create } from 'zustand';

interface ErrorDetails {
  message: string;
  userMessage?: string;
  debug?: string;
  code?: string;
  context?: Record<string, any>;
  stack?: string;
}

interface AppState {
  isExporting: boolean;
  exportProgress: number;
  error: ErrorDetails | null;
  
  // Recording state
  isRecording: boolean;
  recordingElapsed: number;
  recordingOutputPath: string | null;
  
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setError: (error: ErrorDetails | string | null) => void;
  
  // Recording actions
  setIsRecording: (recording: boolean) => void;
  setRecordingElapsed: (elapsed: number) => void;
  setRecordingOutputPath: (path: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isExporting: false,
  exportProgress: 0,
  error: null,
  
  // Recording state
  isRecording: false,
  recordingElapsed: 0,
  recordingOutputPath: null,
  
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setError: (error) => {
    // Convert string errors to ErrorDetails format
    if (typeof error === 'string') {
      set({ error: { message: error, userMessage: error } });
    } else {
      set({ error });
    }
  },
  
  // Recording actions
  setIsRecording: (recording) => set({ isRecording: recording }),
  setRecordingElapsed: (elapsed) => set({ recordingElapsed: elapsed }),
  setRecordingOutputPath: (path) => set({ recordingOutputPath: path }),
}));

