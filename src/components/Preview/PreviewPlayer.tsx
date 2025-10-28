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
  
  // Find current clip at playhead position
  const currentClip = React.useMemo(() => {
    for (const track of tracks) {
      const clip = track.clips.find(c => 
        c.startTime <= playheadPosition && 
        (c.startTime + c.duration) > playheadPosition
      );
      if (clip) return clip;
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
      const now = Date.now();
      const delta = (now - lastFrameTime) / 1000; // delta in seconds
      lastFrameTime = now;
      
      // Get current playhead position from store
      const currentPos = useTimelineStore.getState().playheadPosition;
      const newPosition = currentPos + delta;
      
      // Stop if reached end of timeline
      if (newPosition >= duration) {
        setPlayheadPosition(duration);
        setIsPlaying(false);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        return;
      }
      
      // Update playhead position
      setPlayheadPosition(newPosition);
      
      // Handle video playback based on current clip
      if (videoRef.current) {
        if (currentClip) {
          // We're in a clip - sync and play video
          const actualVideoTime = currentClip.trimStart + (newPosition - currentClip.startTime);
          videoRef.current.currentTime = actualVideoTime;
          
          // Ensure video is playing
          if (videoRef.current.paused) {
            videoRef.current.play().catch(err => {
              console.error('Error playing video:', err);
              setIsPlaying(false);
            });
          }
        } else {
          // We're in a gap - pause video
          if (!videoRef.current.paused) {
            videoRef.current.pause();
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };
    
    // Start playing video when isPlaying is true (initial state)
    if (currentClip && videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        setIsPlaying(false);
      });
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
