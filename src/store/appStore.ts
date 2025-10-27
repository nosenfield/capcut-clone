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
  
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isExporting: false,
  exportProgress: 0,
  error: null,
  
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setError: (error) => set({ error })
}));

