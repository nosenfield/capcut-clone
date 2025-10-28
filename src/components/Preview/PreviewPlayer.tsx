/**
 * Preview Player Component
 * 
 * Displays video preview for the current playhead position with playback controls.
 * Refactored to use custom hooks for better separation of concerns.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { useCurrentClip } from '../../hooks/useCurrentClip';
import { useVideoLoader } from '../../hooks/useVideoLoader';
import { usePlaybackSync } from '../../hooks/usePlaybackSync';

export const PreviewPlayer: React.FC = () => {
  const files = useMediaStore((state) => state.files);
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Use custom hook to find current clip
  const currentClip = useCurrentClip();
  
  // Get media file for current clip
  const currentMedia = useMemo(() => {
    if (!currentClip) return null;
    return files.find(f => f.id === currentClip.mediaFileId);
  }, [currentClip, files]);
  
  // Use custom hook to load video
  const { videoSrc, isLoading, error } = useVideoLoader(currentMedia?.path || null);
  
  // Calculate video time considering clip position and trim settings
  const videoTime = useMemo(() => {
    if (!currentClip || !currentMedia) return 0;
    
    const offsetIntoClip = playheadPosition - currentClip.startTime;
    const time = currentClip.trimStart + offsetIntoClip;
    const maxTime = currentMedia.duration - currentClip.trimEnd;
    
    return Math.max(0, Math.min(time, maxTime));
  }, [currentClip, currentMedia, playheadPosition]);
  
  // Use custom hook to sync playback
  usePlaybackSync({ videoRef, currentClip, videoTime });
  
  // Track video loading state
  const isVideoReadyRef = useRef<boolean>(false);
  
  useEffect(() => {
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
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="preview-player h-full w-full flex items-center justify-center bg-black">
        <div className="text-gray-500 text-center">
          <p className="text-lg mb-2">Loading video...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="preview-player h-full w-full flex items-center justify-center bg-black">
        <div className="text-red-500 text-center">
          <p className="text-lg mb-2">Error loading video</p>
          <p className="text-sm text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="preview-player h-full w-full flex flex-col bg-black overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 min-w-0">
        {currentMedia && videoSrc ? (
          <div className="w-full h-full flex items-center justify-center">
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
