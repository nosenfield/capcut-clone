/**
 * Preview Player Component
 * 
 * Displays video preview for the current playhead position with playback controls.
 * Uses video element pool for smooth, stutter-free clip transitions.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { useCurrentClip } from '../../hooks/useCurrentClip';
import { usePlaybackSync } from '../../hooks/usePlaybackSync';
import { videoElementPool, useVideoElementPreloader } from '../../hooks/useVideoElementPool';
import { videoCache } from '../../hooks/useVideoPreloader';

export const PreviewPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);
  const files = useMediaStore((state) => state.files);
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);
  
  // Use custom hook to find current clip
  const currentClip = useCurrentClip();
  
  // Get media file for current clip
  const currentMedia = useMemo(() => {
    if (!currentClip) return null;
    return files.find(f => f.id === currentClip.mediaFileId);
  }, [currentClip, files]);
  
  // Calculate video time considering clip position and trim settings
  const videoTime = useMemo(() => {
    if (!currentClip || !currentMedia) return 0;
    
    const offsetIntoClip = playheadPosition - currentClip.startTime;
    const time = currentClip.trimStart + offsetIntoClip;
    const maxTime = currentMedia.duration - currentClip.trimEnd;
    
    return Math.max(0, Math.min(time, maxTime));
  }, [currentClip, currentMedia, playheadPosition]);
  
  // Preload upcoming video elements
  useVideoElementPreloader({ currentClipId: currentClip?.id || null, lookAheadSeconds: 2 });
  
  // Get or create video element for current clip
  useEffect(() => {
    if (!currentClip || !currentMedia || !containerRef.current) {
      // No clip - hide current video if any
      if (currentVideoRef.current) {
        currentVideoRef.current.style.display = 'none';
      }
      return;
    }
    
    // Try to get preloaded element
    const preloadedVideo = videoElementPool.getElement(
      currentClip.id,
      currentMedia.path,
      currentClip.trimStart
    );
    
    if (preloadedVideo && preloadedVideo !== currentVideoRef.current) {
      console.log(`[PreviewPlayer] Swapping to preloaded video for clip ${currentClip.id}`);
      
      // Hide old video if exists
      if (currentVideoRef.current && currentVideoRef.current.parentNode) {
        currentVideoRef.current.style.display = 'none';
      }
      
      // Show preloaded video
      preloadedVideo.style.display = 'block';
      preloadedVideo.style.position = 'static';
      preloadedVideo.style.top = 'auto';
      preloadedVideo.muted = false; // Unmute for playback
      preloadedVideo.className = 'w-auto h-auto max-w-full max-h-full';
      preloadedVideo.style.maxWidth = '100%';
      preloadedVideo.style.maxHeight = '100%';
      preloadedVideo.style.objectFit = 'contain';
      
      // Move to container if not already there
      if (preloadedVideo.parentNode !== containerRef.current) {
        containerRef.current.appendChild(preloadedVideo);
      }
      
      currentVideoRef.current = preloadedVideo;
    } else if (!preloadedVideo) {
      // Check if we need to create/update fallback video
      const needsNewVideo = !currentVideoRef.current || 
                           currentVideoRef.current.dataset.clipId !== currentClip.id ||
                           currentVideoRef.current.dataset.mediaPath !== currentMedia.path;
      
      if (needsNewVideo) {
        console.log(`[PreviewPlayer] No preloaded video, creating fallback element for clip ${currentClip.id}`);
        
        // Fallback: create new video element
        // This should rarely happen if preloading works correctly
        const video = document.createElement('video');
        video.className = 'w-auto h-auto max-w-full max-h-full';
        video.style.maxWidth = '100%';
        video.style.maxHeight = '100%';
        video.style.objectFit = 'contain';
        video.muted = false;
        video.playsInline = true;
        video.controls = false;
        video.dataset.clipId = currentClip.id;
        video.dataset.mediaPath = currentMedia.path;
        
        // Get blob URL and load with proper event handling
        videoCache.getBlobUrl(currentMedia.path).then(blobUrl => {
          if (blobUrl && video.parentNode) {
            video.src = blobUrl;
            
            // Wait for metadata before seeking
            const handleLoadedMetadata = () => {
              video.removeEventListener('loadedmetadata', handleLoadedMetadata);
              video.currentTime = currentClip.trimStart;
              console.log(`[PreviewPlayer] Fallback video ready for clip ${currentClip.id}`);
            };
            
            video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            
            // Timeout fallback
            setTimeout(() => {
              video.removeEventListener('loadedmetadata', handleLoadedMetadata);
              if (video.readyState >= 1) {
                video.currentTime = currentClip.trimStart;
              }
            }, 1000);
          }
        }).catch(err => {
          console.error('[PreviewPlayer] Failed to load fallback video:', err);
        });
        
        if (containerRef.current) {
          // Hide old video
          if (currentVideoRef.current && currentVideoRef.current.parentNode) {
            currentVideoRef.current.style.display = 'none';
          }
          
          containerRef.current.appendChild(video);
          currentVideoRef.current = video;
        }
      }
    }
  }, [currentClip, currentMedia]);
  
  // Use playback sync with current video ref
  usePlaybackSync({ 
    videoRef: currentVideoRef, 
    currentClip, 
    videoTime 
  });
  
  return (
    <div className="preview-player h-full w-full flex flex-col bg-black overflow-hidden">
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 min-h-0 min-w-0"
      >
        {!currentMedia && (
          <div className="text-gray-500 text-center">
            <p className="text-lg mb-2">No clip at current position</p>
            <p className="text-sm">Add clips to the timeline to preview</p>
          </div>
        )}
      </div>
    </div>
  );
};
