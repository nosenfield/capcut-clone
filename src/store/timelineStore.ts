/**
 * Timeline Store
 * 
 * Global state management for timeline (tracks, clips, playhead).
 * Handles clip manipulation and timeline duration recalculation.
 */

import { create } from 'zustand';
import { TimelineState, TimelineClip, TimelineTrack } from '../types/timeline';

interface TimelineStoreState extends TimelineState {
  // Actions
  addClip: (clip: TimelineClip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  setPlayheadPosition: (position: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  addTrack: (track: TimelineTrack) => void;
  removeTrack: (trackId: string) => void;
  reorderClips: (trackId: string, clips: TimelineClip[]) => void;
  clearTimeline: () => void;
}

export const useTimelineStore = create<TimelineStoreState>((set) => ({
  tracks: [
    { id: 'track-1', name: 'Video Track 1', type: 'video', clips: [], muted: false, locked: false }
  ],
  playheadPosition: 0,
  duration: 0,
  zoom: 50, // 50 pixels per second default
  isPlaying: false,
  
  addClip: (clip) => set((state) => {
    const tracks = state.tracks.map(track => 
      track.id === clip.trackId
        ? { ...track, clips: [...track.clips, clip] }
        : track
    );
    
    // Recalculate total duration
    const maxEnd = Math.max(
      ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration))
    );
    
    return { tracks, duration: maxEnd };
  }),
  
  removeClip: (clipId) => set((state) => {
    const tracks = state.tracks.map(track => ({
      ...track,
      clips: track.clips.filter(c => c.id !== clipId)
    }));
    
    const maxEnd = Math.max(
      ...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)),
      0
    );
    
    return { tracks, duration: maxEnd };
  }),
  
  updateClip: (clipId, updates) => set((state) => ({
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    }))
  })),
  
  setPlayheadPosition: (position) => set({ playheadPosition: position }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setZoom: (zoom) => set({ zoom }),
  
  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track]
  })),
  
  removeTrack: (trackId) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== trackId)
  })),
  
  reorderClips: (trackId, clips) => set((state) => ({
    tracks: state.tracks.map(track =>
      track.id === trackId ? { ...track, clips } : track
    )
  })),
  
  clearTimeline: () => set({
    tracks: [
      { id: 'track-1', name: 'Video Track 1', type: 'video', clips: [], muted: false, locked: false }
    ],
    playheadPosition: 0,
    duration: 0,
    isPlaying: false
  })
}));

