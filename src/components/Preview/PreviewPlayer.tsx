/**
 * Preview Player Component
 * 
 * Displays video preview for the current playhead position with playback controls.
 * Implementation for Task 5.1
 */

import React from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';

export const PreviewPlayer: React.FC = () => {
  const { tracks, playheadPosition, duration, isPlaying, setIsPlaying, setPlayheadPosition } = useTimelineStore();
  const { files } = useMediaStore();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  // Track previous clip to detect transitions
  const prevClipRef = React.useRef<string | null>(null);
  
  // Find current clip at playhead position
  const currentClip = React.useMemo(() => {
    for (const track of tracks) {
      const clip = track.clips.find(c => 
        c.startTime <= playheadPosition && 
        (c.startTime + c.duration) > playheadPosition
      );
      if (clip) {
        // Log when entering a new clip
        const clipId = `${clip.id}-${clip.startTime}`;
        if (prevClipRef.current !== clipId) {
          console.log('[Clip Transition] Entering clip:', {
            clipId: clip.id,
            clipStart: clip.startTime.toFixed(3),
            playheadPos: playheadPosition.toFixed(3),
            trimStart: clip.trimStart.toFixed(3),
            trimEnd: clip.trimEnd.toFixed(3),
            duration: clip.duration.toFixed(3)
          });
          prevClipRef.current = clipId;
        }
        return clip;
      }
    }
    // Log when exiting clip (entering gap)
    if (prevClipRef.current !== null) {
      console.log('[Clip Transition] Entering gap at playhead:', playheadPosition.toFixed(3));
      prevClipRef.current = null;
    }
    return null;
  }, [tracks, playheadPosition]);
  
  const currentMedia = React.useMemo(() => {
    if (!currentClip) return null;
    return files.find(f => f.id === currentClip.mediaFileId);
  }, [currentClip, files]);
  
  // State for video source URL and blob URL
  const [videoSrc, setVideoSrc] = React.useState<string | null>(null);
  const blobUrlRef = React.useRef<string | null>(null);
  const lastMediaPathRef = React.useRef<string | null>(null);
  const isVideoReadyRef = React.useRef<boolean>(false);
  
  // Create blob URL from file when media changes
  React.useEffect(() => {
    if (!currentMedia?.path) {
      // No media (gap) - keep existing blob URL but don't show video
      setVideoSrc(null);
      return;
    }
    
    // Don't reload if we already loaded this media path
    if (lastMediaPathRef.current === currentMedia.path) {
      // Same media - just set the video source if we have a blob URL
      if (blobUrlRef.current) {
        setVideoSrc(blobUrlRef.current);
      }
      return;
    }
    
    // Update tracked path
    lastMediaPathRef.current = currentMedia.path;
    
    // Store old blob URL before loading new one
    const oldBlobUrl = blobUrlRef.current;
    
    // Try to read file as blob
    const loadVideo = async () => {
      try {
        console.log('Reading video file:', currentMedia.path);
        const data = await readFile(currentMedia.path);
        const blob = new Blob([data], { type: 'video/mp4' });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        console.log('Created blob URL:', blobUrl);
        setVideoSrc(blobUrl);
        
        // Revoke old blob URL after a short delay to let video load new source
        if (oldBlobUrl) {
          setTimeout(() => {
            console.log('Revoking old blob URL:', oldBlobUrl);
            URL.revokeObjectURL(oldBlobUrl);
          }, 1000); // 1 second delay to ensure video has loaded new source
        }
      } catch (error) {
        console.error('Failed to read video file:', error);
        // Fallback to convertFileSrc
        try {
          const src = convertFileSrc(currentMedia.path);
          console.log('Using convertFileSrc:', src);
          setVideoSrc(src);
        } catch (e) {
          console.error('convertFileSrc also failed:', e);
          setVideoSrc(null);
        }
        
        // Revoke old blob URL if we're using fallback
        if (oldBlobUrl) {
          URL.revokeObjectURL(oldBlobUrl);
        }
      }
    };
    
    loadVideo();
    
    // Don't revoke in cleanup - let the loading function handle it with delay
    // Only cleanup on final unmount
    return () => {
      // This cleanup only runs on unmount, not on media change
      // Media changes are handled by the loadVideo async function
    };
  }, [currentMedia?.path]);
  
  // Cleanup blob URL on component unmount
  React.useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);
  
  // Calculate video time considering clip position and trim settings
  const videoTime = React.useMemo(() => {
    if (!currentClip || !currentMedia) return 0;
    
    // Calculate offset into clip from playhead position
    const offsetIntoClip = playheadPosition - currentClip.startTime;
    
    // Apply trimStart and clamp to valid range
    const time = currentClip.trimStart + offsetIntoClip;
    const maxTime = currentMedia.duration - currentClip.trimEnd;
    
    return Math.max(0, Math.min(time, maxTime));
  }, [currentClip, currentMedia, playheadPosition]);
  
  // Sync video currentTime when playhead changes
  React.useEffect(() => {
    if (videoRef.current && currentMedia && !isPlaying) {
      videoRef.current.currentTime = videoTime;
    }
  }, [currentMedia, videoTime, isPlaying]);
  
  // Track when video is ready to play and handle video loading state
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleLoadedMetadata = () => {
      isVideoReadyRef.current = true;
    };
    
    const handleLoadStart = () => {
      isVideoReadyRef.current = false;
    };
    
    const handleSeeked = () => {
      isVideoReadyRef.current = true;
    };
    
    const handleSeeking = () => {
      isVideoReadyRef.current = false;
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('seeking', handleSeeking);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, [videoSrc]);
  
  // Update playhead when video plays and control playback
  React.useEffect(() => {
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
      // Get current playhead position from store
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
        // IN CLIP: Let video element drive time (read-only, no forcing)
        // This preserves audio and smooth playback
        const video = videoRef.current;
        let actualVideoTime = video.currentTime;
        
        // Initialize video time if it's not in the valid range for this clip
        const expectedStart = currentClip.trimStart;
        const expectedEnd = currentClip.trimStart + currentClip.duration;
        
        // Check if video is at the wrong time (happens when entering clip)
        if (actualVideoTime < expectedStart || actualVideoTime > expectedEnd) {
          console.log('[Video Init] Video time out of range, setting to correct position:', {
            currentVideoTime: actualVideoTime.toFixed(3),
            expectedStart: expectedStart.toFixed(3),
            offsetIntoClip: (currentPos - currentClip.startTime).toFixed(3)
          });
          
          // Calculate correct video time based on current playhead position
          const offsetIntoClip = currentPos - currentClip.startTime;
          const correctVideoTime = currentClip.trimStart + offsetIntoClip;
          
          // Set video time before reading from it
          video.currentTime = correctVideoTime;
          actualVideoTime = correctVideoTime;
        }
        
        const offsetIntoClip = actualVideoTime - currentClip.trimStart;
        newPosition = currentClip.startTime + offsetIntoClip;
        
        // Debug logging for playhead calculation
        console.log('[Playback] Clip Info:', {
          videoTime: actualVideoTime.toFixed(3),
          clipStart: currentClip.startTime.toFixed(3),
          trimStart: currentClip.trimStart.toFixed(3),
          offsetIntoClip: offsetIntoClip.toFixed(3),
          newPosition: newPosition.toFixed(3),
          oldPosition: currentPos.toFixed(3),
          clipDuration: currentClip.duration.toFixed(3)
        });
        
        // Ensure video is playing if it paused AND ready
        // Check readyState: 0=nothing, 1=metadata, 2=current data, 3=future data, 4=enough data
        if (video.paused && video.readyState >= 2) {
          video.play().catch(err => {
            console.error('Error playing video:', err);
            setIsPlaying(false);
          });
        }
      } else {
        // IN GAP: Manually advance time with Date.now()
        // This allows playback to continue through gaps
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
      const positionChange = newPosition - currentPos;
      if (Math.abs(positionChange) > 0.001) {
        console.log('[Playhead Update]', {
          oldPos: currentPos.toFixed(3),
          newPos: newPosition.toFixed(3),
          change: positionChange.toFixed(3),
          isGoingBackwards: positionChange < 0
        });
      }
      setPlayheadPosition(newPosition);
      
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };
    
    // Start playing video when isPlaying is true and we have a clip
    // First set the correct start time for front-trimmed clips
    if (currentClip && videoRef.current && videoRef.current.readyState >= 2) {
      if (videoRef.current.paused) {
        const video = videoRef.current;
        
        // Set initial time before playing
        const currentPos = useTimelineStore.getState().playheadPosition;
        const offsetIntoClip = currentPos - currentClip.startTime;
        const initialTime = currentClip.trimStart + offsetIntoClip;
        
        console.log('[Start Playback] Setting initial video time:', {
          currentPos: currentPos.toFixed(3),
          clipStart: currentClip.startTime.toFixed(3),
          offsetIntoClip: offsetIntoClip.toFixed(3),
          trimStart: currentClip.trimStart.toFixed(3),
          initialVideoTime: initialTime.toFixed(3),
          currentVideoTime: video.currentTime.toFixed(3)
        });
        
        // If we need to seek first, wait for seek to complete
        if (Math.abs(video.currentTime - initialTime) > 0.1) {
          console.log('[Start Playback] Seeking needed');
          // Set up one-time listener for seeked event
          const handleSeekedOnce = () => {
            video.removeEventListener('seeked', handleSeekedOnce);
            console.log('[Start Playback] Seek complete, playing video');
            // Only play if video is still ready after seek
            if (video.readyState >= 2) {
              video.play().catch(err => {
                console.error('Error playing video after seek:', err);
                setIsPlaying(false);
              });
            }
          };
          
          video.addEventListener('seeked', handleSeekedOnce);
          video.currentTime = initialTime;
        } else {
          console.log('[Start Playback] Already at correct position, playing');
          // Already at correct position, just play
          video.play().catch(err => {
            console.error('Error playing video:', err);
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
  }, [isPlaying, currentClip, duration, setPlayheadPosition, setIsPlaying]);
  
  return (
    <div className="preview-player h-full w-full flex flex-col bg-black overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 min-w-0">
        {currentMedia ? (
          <div className="w-full h-full flex items-center justify-center">
            {videoSrc && (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-auto h-auto max-w-full max-h-full"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                playsInline
                muted={false}
                controls={false}
              />
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <p className="text-lg mb-2">No clip at current position</p>
            <p className="text-sm">Add clips to the timeline to preview</p>
          </div>
        )}
      </div>
    </div>
  );
};
