/**
 * App Store
 * 
 * Global state for app-level features (export progress, error handling).
 */

import { create } from 'zustand';

interface AppState {
  isExporting: boolean;
  exportProgress: number;
  error: string | null;
  
  // Recording state
  isRecording: boolean;
  recordingElapsed: number;
  recordingOutputPath: string | null;
  
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  
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
  setError: (error) => set({ error }),
  
  // Recording actions
  setIsRecording: (recording) => set({ isRecording: recording }),
  setRecordingElapsed: (elapsed) => set({ recordingElapsed: elapsed }),
  setRecordingOutputPath: (path) => set({ recordingOutputPath: path }),
}));

