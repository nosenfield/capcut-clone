/**
 * Transcription Store
 * 
 * Global state management for transcription (transcripts, progress).
 * Uses Zustand for lightweight, hook-based state management with persistence.
 * Note: API key is read from VITE_OPENAI_API_KEY environment variable, not stored here.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transcript, TranscriptionProgress } from '../types/transcription';

interface TranscriptionState {
  transcripts: Record<string, Transcript>; // clipId -> Transcript
  activeTranscriptId: string | null;
  isTranscribing: boolean;
  progress: TranscriptionProgress | null;
  
  // Actions
  addTranscript: (transcript: Transcript) => void;
  removeTranscript: (clipId: string) => void;
  getTranscript: (clipId: string) => Transcript | undefined;
  setActiveTranscript: (clipId: string | null) => void;
  setIsTranscribing: (status: boolean) => void;
  setProgress: (progress: TranscriptionProgress | null) => void;
  clearAll: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>()(
  persist(
    (set, get) => ({
      transcripts: {},
      activeTranscriptId: null,
      isTranscribing: false,
      progress: null,
      
      addTranscript: (transcript) => set((state) => ({
        transcripts: {
          ...state.transcripts,
          [transcript.clipId]: transcript,
        },
      })),
      
      removeTranscript: (clipId) => set((state) => {
        const { [clipId]: removed, ...rest } = state.transcripts;
        return { transcripts: rest };
      }),
      
      getTranscript: (clipId) => get().transcripts[clipId],
      
      setActiveTranscript: (clipId) => set({ activeTranscriptId: clipId }),
      
      setIsTranscribing: (status) => set({ isTranscribing: status }),
      
      setProgress: (progress) => set({ progress }),
      
      clearAll: () => set({ 
        transcripts: {}, 
        activeTranscriptId: null,
        progress: null 
      }),
    }),
    {
      name: 'transcription-storage',
      // No custom serialization needed - Zustand handles objects natively
      partialize: (state) => ({
        transcripts: state.transcripts,
        // Don't persist API key - use .env instead
      }),
    }
  )
);

