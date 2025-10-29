/**
 * Custom Hook: usePlaybackSync
 * 
 * Handles synchronization between video element and timeline playhead.
 * Manages playback state, playhead updates, and video seeking.
 */

import { useEffect, useRef } from 'react';
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
  const compositionLength = useTimelineStore((state) => state.compositionLength);
  
  // Track last clip to detect clip changes
  const lastClipIdRef = useRef<string | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  
  // Handle clip changes - prepare video element when entering new clip
  useEffect(() => {
    if (!currentClip || !videoRef.current || !isPlaying) {
      lastClipIdRef.current = currentClip?.id || null;
      return;
    }
    
    const video = videoRef.current;
    
    // Detect clip change
    if (lastClipIdRef.current !== currentClip.id) {
      console.log(`[PlaybackSync] Entering clip ${currentClip.id}`);
      lastClipIdRef.current = currentClip.id;
      
      // Calculate target time
      const currentPos = useTimelineStore.getState().playheadPosition;
      const offsetIntoClip = currentPos - currentClip.startTime;
      const targetTime = currentClip.trimStart + offsetIntoClip;
      
      // Check if video needs seeking
      const timeDiff = Math.abs(video.currentTime - targetTime);
      if (timeDiff > 0.1) {
        console.log(`[PlaybackSync] Video time mismatch (${timeDiff.toFixed(2)}s), seeking to ${targetTime.toFixed(2)}s`);
        isSeekingRef.current = true;
        
        const handleSeeked = () => {
          video.removeEventListener('seeked', handleSeeked);
          isSeekingRef.current = false;
          console.log(`[PlaybackSync] Seek complete for clip ${currentClip.id}`);
          
          // Start playback if ready
          if (isPlaying && video.paused && video.readyState >= 3) {
            video.play().catch(err => {
              handleError(err, 'usePlaybackSync.clipChange');
            });
          }
        };
        
        video.addEventListener('seeked', handleSeeked, { once: true });
        video.currentTime = targetTime;
        
        // Timeout fallback
        setTimeout(() => {
          video.removeEventListener('seeked', handleSeeked);
          isSeekingRef.current = false;
        }, 200);
      } else {
        console.log(`[PlaybackSync] Video already at correct time (${video.currentTime.toFixed(2)}s)`);
      }
    }
  }, [currentClip, videoRef, isPlaying]);
  
  // Sync video currentTime when playhead changes (while paused)
  useEffect(() => {
    if (videoRef.current && currentClip && !isPlaying) {
      const video = videoRef.current;
      // Only seek if significantly different (avoid micro-seeks)
      if (Math.abs(video.currentTime - videoTime) > 0.1) {
        video.currentTime = videoTime;
      }
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
        const now = Date.now();
        const currentPos = useTimelineStore.getState().playheadPosition;
      
      // Check if we've reached the end of composition
      if (currentPos >= compositionLength) {
        console.log('[PlaybackSync] Reached end of composition:', {
          currentPos: currentPos.toFixed(3),
          compositionLength: compositionLength.toFixed(3),
        });
        setPlayheadPosition(compositionLength);
        setIsPlaying(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
        return;
      }
      
      let newPosition: number;
      const wasInClip = !!currentClip;
      
      if (currentClip && videoRef.current) {
        // IN CLIP: Let video element drive time
        const video = videoRef.current;
        
        // ✅ NO SEEKING - just read time and calculate position
        // Video element should already be at correct time from pool
        const actualVideoTime = video.currentTime;
        const offsetIntoClip = actualVideoTime - currentClip.trimStart;
        newPosition = currentClip.startTime + offsetIntoClip;
        
        const clipEndTime = currentClip.startTime + currentClip.duration;
        
        // Detect if video has reached the trimmed end (video stops advancing)
        // When actualVideoTime stops advancing and we're at the trimmed end point,
        // we need to exit the clip
        const trimmedEndTime = currentClip.trimStart + currentClip.duration;
        const atTrimmedEnd = Math.abs(actualVideoTime - trimmedEndTime) < 0.05;
        
        // If playhead has advanced beyond this clip OR video reached trimmed end, continue advancing
        if (newPosition >= clipEndTime || atTrimmedEnd) {
          if (atTrimmedEnd && newPosition < clipEndTime) {
            console.log('[PlaybackSync] ⚠️ Video reached trimmed TAIL - exiting clip:', {
              actualVideoTime: actualVideoTime.toFixed(3),
              trimmedEndTime: trimmedEndTime.toFixed(3),
              newPosition: newPosition.toFixed(3),
              clipEndTime: clipEndTime.toFixed(3),
              clipDuration: currentClip.duration.toFixed(3),
              trimEnd: currentClip.trimEnd.toFixed(3),
            });
          }
          console.log('[PlaybackSync] ⚠️ Clip END - passing clip tail:', {
            playheadPos: newPosition.toFixed(3),
            clipEndTime: clipEndTime.toFixed(3),
            clipDuration: currentClip.duration.toFixed(3),
            trimStart: currentClip.trimStart.toFixed(3),
            trimEnd: currentClip.trimEnd.toFixed(3),
            totalTrimmed: (currentClip.trimStart + currentClip.trimEnd).toFixed(3),
          });
          
          // Calculate delta from last frame to current frame
          const delta = (now - lastFrameTime) / 1000;
          newPosition = currentPos + delta;
          
          // Pause video when we've moved past the clip
          if (!video.paused) {
            video.pause();
          }
        } else {
          // Ensure video is playing if it paused AND ready (but not if seeking)
          if (video.paused && video.readyState >= 3 && !isSeekingRef.current) {
            video.play().catch(err => {
              handleError(err, 'usePlaybackSync.updatePlayhead');
              setIsPlaying(false);
            });
          }
        }
      } else {
        // IN GAP: Manually advance time with delta calculation
        if (wasInClip) {
          console.log('[PlaybackSync] ⚠️ Entered GAP');
        }
        
        const delta = (now - lastFrameTime) / 1000; // delta in seconds
        newPosition = currentPos + delta;
        
        // Pause video when in a gap
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
      
      // Always update lastFrameTime at end of frame for next frame's delta calculation
      lastFrameTime = now;
      
      // Update playhead position (allow it to continue past clips until it hits duration check)
      setPlayheadPosition(newPosition);
      
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };
    
    // Start playing video when isPlaying is true and we have a clip
    // Video element should already be at correct time from pool
    if (currentClip && videoRef.current) {
      const video = videoRef.current;
      if (video.paused && video.readyState >= 3) {
        video.play().catch(err => {
          handleError(err, 'usePlaybackSync.startPlayback');
          setIsPlaying(false);
        });
      }
    }
    
    animationFrameId = requestAnimationFrame(updatePlayhead);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, currentClip, compositionLength, videoRef, setPlayheadPosition, setIsPlaying]);
};

