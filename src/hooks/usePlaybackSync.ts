/**
 * Custom Hook: usePlaybackSync
 * 
 * Handles synchronization between video element and timeline playhead.
 * Manages playback state, playhead updates, and video seeking.
 */

import { useEffect } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { TimelineClip } from '../types/timeline';
import { handleError } from '../utils/errors';

export interface UsePlaybackSyncOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentClip: TimelineClip | null;
  videoTime: number;
}

/**
 * Hook for syncing video playback with timeline playhead
 * 
 * @param options - Configuration object with video ref, current clip, and calculated video time
 */
export const usePlaybackSync = ({ videoRef, currentClip, videoTime }: UsePlaybackSyncOptions): void => {
  const isPlaying = useTimelineStore((state) => state.isPlaying);
  const setIsPlaying = useTimelineStore((state) => state.setIsPlaying);
  const setPlayheadPosition = useTimelineStore((state) => state.setPlayheadPosition);
  const duration = useTimelineStore((state) => state.duration);
  
  // Sync video currentTime when playhead changes (while paused)
  useEffect(() => {
    if (videoRef.current && currentClip && !isPlaying) {
      videoRef.current.currentTime = videoTime;
    }
  }, [videoRef, currentClip, videoTime, isPlaying]);
  
  // Main playback loop - updates playhead during playback
  useEffect(() => {
    if (!isPlaying) {
      // Pause video when not playing
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      return;
    }
    
    let animationFrameId: number;
    let lastFrameTime = Date.now();
    
    const updatePlayhead = () => {
      const currentPos = useTimelineStore.getState().playheadPosition;
      
      // Check if we've reached the end of timeline
      if (currentPos >= duration) {
        setPlayheadPosition(duration);
        setIsPlaying(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
        return;
      }
      
      let newPosition: number;
      
      if (currentClip && videoRef.current) {
        // IN CLIP: Let video element drive time
        const video = videoRef.current;
        let actualVideoTime = video.currentTime;
        
        // Initialize video time if it's not in the valid range for this clip
        const expectedStart = currentClip.trimStart;
        const expectedEnd = currentClip.trimStart + currentClip.duration;
        
        // Check if video is at the wrong time (happens when entering clip)
        if (actualVideoTime < expectedStart || actualVideoTime > expectedEnd) {
          // Calculate correct video time based on current playhead position
          const offsetIntoClip = currentPos - currentClip.startTime;
          const correctVideoTime = currentClip.trimStart + offsetIntoClip;
          
          // Set video time before reading from it
          video.currentTime = correctVideoTime;
          actualVideoTime = correctVideoTime;
        }
        
        const offsetIntoClip = actualVideoTime - currentClip.trimStart;
        newPosition = currentClip.startTime + offsetIntoClip;
        
        // Ensure video is playing if it paused AND ready
        if (video.paused && video.readyState >= 2) {
          video.play().catch(err => {
            handleError(err, 'usePlaybackSync.updatePlayhead');
            setIsPlaying(false);
          });
        }
      } else {
        // IN GAP: Manually advance time with Date.now()
        const now = Date.now();
        const delta = (now - lastFrameTime) / 1000; // delta in seconds
        lastFrameTime = now;
        newPosition = currentPos + delta;
        
        // Pause video when in a gap
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
      
      // Update playhead position
      setPlayheadPosition(newPosition);
      
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };
    
    // Start playing video when isPlaying is true and we have a clip
    if (currentClip && videoRef.current && videoRef.current.readyState >= 2) {
      if (videoRef.current.paused) {
        const video = videoRef.current;
        
        // Set initial time before playing
        const currentPos = useTimelineStore.getState().playheadPosition;
        const offsetIntoClip = currentPos - currentClip.startTime;
        const initialTime = currentClip.trimStart + offsetIntoClip;
        
        // Set up one-time listener for seeked event
        const handleSeekedOnce = () => {
          video.removeEventListener('seeked', handleSeekedOnce);
          // Only play if video is still ready after seek
          if (video.readyState >= 2) {
            video.play().catch(err => {
              handleError(err, 'usePlaybackSync.startPlayback');
              setIsPlaying(false);
            });
          }
        };
        
        // If we need to seek first, wait for seek to complete
        if (Math.abs(video.currentTime - initialTime) > 0.1) {
          video.addEventListener('seeked', handleSeekedOnce);
          video.currentTime = initialTime;
        } else {
          // Already at correct position, just play
          video.play().catch(err => {
            handleError(err, 'usePlaybackSync.startPlayback');
            setIsPlaying(false);
          });
        }
      }
    }
    
    animationFrameId = requestAnimationFrame(updatePlayhead);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, currentClip, duration, videoRef, setPlayheadPosition, setIsPlaying]);
};

