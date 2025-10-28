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
  
  // Create blob URL from file when media changes
  React.useEffect(() => {
    if (!currentMedia?.path) return;
    
    let blobUrl: string | null = null;
    
    // Try to read file as blob
    const loadVideo = async () => {
      try {
        console.log('Reading video file:', currentMedia.path);
        const data = await readFile(currentMedia.path);
        const blob = new Blob([data], { type: 'video/mp4' });
        blobUrl = URL.createObjectURL(blob);
        console.log('Created blob URL:', blobUrl);
        setVideoSrc(blobUrl);
      } catch (error) {
        console.error('Failed to read video file:', error);
        // Fallback to convertFileSrc
        try {
          const src = convertFileSrc(currentMedia.path);
          console.log('Using convertFileSrc:', src);
          setVideoSrc(src);
        } catch (e) {
          console.error('convertFileSrc also failed:', e);
        }
      }
    };
    
    loadVideo();
    
    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [currentMedia?.path]);
  
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
    
    const updatePlayhead = () => {
      if (!videoRef.current || !currentClip) return;
      
      // Calculate timeline position from video time
      const actualVideoTime = videoRef.current.currentTime;
      const timelineTime = currentClip.startTime + (actualVideoTime - currentClip.trimStart);
      
      // Update playhead
      setPlayheadPosition(timelineTime);
      
      // Check if we've reached the end of the clip or timeline
      if (timelineTime >= currentClip.startTime + currentClip.duration || timelineTime >= duration) {
        setIsPlaying(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      } else {
        animationFrameId = requestAnimationFrame(updatePlayhead);
      }
    };
    
    // Start playing video when isPlaying is true
    if (videoRef.current && videoRef.current.paused) {
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
