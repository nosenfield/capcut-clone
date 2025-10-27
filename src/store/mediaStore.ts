/**
 * Media Store
 * 
 * Global state management for media library (imported files).
 * Uses Zustand for lightweight, hook-based state management.
 */

import { create } from 'zustand';
import { MediaFile } from '../types/media';

interface MediaState {
  files: MediaFile[];
  selectedFileId: string | null;
  
  // Actions
  addMediaFile: (file: MediaFile) => void;
  removeMediaFile: (id: string) => void;
  selectMediaFile: (id: string | null) => void;
  getMediaFile: (id: string) => MediaFile | undefined;
  clearAllMedia: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  files: [],
  selectedFileId: null,
  
  addMediaFile: (file) => set((state) => ({
    files: [...state.files, file]
  })),
  
  removeMediaFile: (id) => set((state) => ({
    files: state.files.filter(f => f.id !== id),
    selectedFileId: state.selectedFileId === id ? null : state.selectedFileId
  })),
  
  selectMediaFile: (id) => set({ selectedFileId: id }),
  
  getMediaFile: (id) => get().files.find(f => f.id === id),
  
  clearAllMedia: () => set({ files: [], selectedFileId: null })
}));

