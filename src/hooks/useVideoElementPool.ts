/**
 * Custom Hook: useVideoElementPool
 * 
 * Manages a pool of preloaded video elements for smooth, stutter-free clip transitions.
 * Based on preloading-investigation.md recommendations.
 */

import { useEffect } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { useMediaStore } from '../store/mediaStore';
import { TimelineClip, TimelineTrack } from '../types/timeline';
import { videoCache } from './useVideoPreloader';
import { handleError } from '../utils/errors';

/**
 * State for a video element in the pool
 */
interface VideoElementState {
  element: HTMLVideoElement;
  clipId: string;
  mediaPath: string;
  isReady: boolean;
  lastUsed: number;
}

/**
 * Pool of preloaded video elements
 */
class VideoElementPool {
  private pool = new Map<string, VideoElementState>();
  private maxPoolSize = 3;

  /**
   * Get a video element for a clip if it's ready
   */
  getElement(clipId: string, _mediaPath: string, _trimStart: number): HTMLVideoElement | null {
    const existing = this.pool.get(clipId);
    if (existing && existing.isReady) {
      existing.lastUsed = Date.now();
      console.log(`[VideoPool] Retrieved preloaded clip ${clipId}`);
      return existing.element;
    }
    return null;
  }

  /**
   * Preload a video element for an upcoming clip
   */
  async preloadElement(
    clipId: string,
    mediaPath: string,
    trimStart: number
  ): Promise<void> {
    // Skip if already preloading or loaded
    if (this.pool.has(clipId)) {
      return;
    }

    console.log(`[VideoPool] Starting preload for clip ${clipId} at ${trimStart}s`);

    // Create hidden video element
    const video = document.createElement('video');
    video.style.display = 'none';
    video.style.position = 'absolute';
    video.style.top = '-9999px';
    video.preload = 'auto';
    video.muted = true; // Preloaded elements should be muted
    video.playsInline = true;
    document.body.appendChild(video);

    // Add to pool immediately (marks as loading)
    const state: VideoElementState = {
      element: video,
      clipId,
      mediaPath,
      isReady: false,
      lastUsed: Date.now(),
    };
    this.pool.set(clipId, state);

    try {
      // Get blob URL from cache
      const blobUrl = await videoCache.getBlobUrl(mediaPath);
      if (!blobUrl) {
        throw new Error('Failed to get blob URL');
      }

      // Set src and wait for metadata
      video.src = blobUrl;

      await new Promise<void>((resolve, reject) => {
        let resolved = false;

        const handleLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);

          // Pre-seek to trim start position
          video.currentTime = trimStart;

          const handleSeeked = () => {
            video.removeEventListener('seeked', handleSeeked);
            if (!resolved) {
              resolved = true;
              state.isReady = true;
              console.log(`[VideoPool] Preloaded clip ${clipId} ready at ${trimStart}s`);
              resolve();
            }
          };

          video.addEventListener('seeked', handleSeeked, { once: true });

          // Fallback timeout for seek
          setTimeout(() => {
            video.removeEventListener('seeked', handleSeeked);
            if (!resolved) {
              resolved = true;
              state.isReady = true;
              console.log(`[VideoPool] Preload clip ${clipId} ready (timeout)`);
              resolve();
            }
          }, 200);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });

        // Fallback if metadata never loads
        setTimeout(() => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          if (!resolved) {
            resolved = true;
            reject(new Error('Metadata load timeout'));
          }
        }, 2000);
      });

      // Evict old elements if pool is too large
      if (this.pool.size > this.maxPoolSize) {
        this.evictOldest();
      }
    } catch (error) {
      handleError(error, 'VideoElementPool.preloadElement');
      this.pool.delete(clipId);
      if (video.parentNode) {
        document.body.removeChild(video);
      }
    }
  }

  /**
   * Evict the least recently used element
   */
  private evictOldest(): void {
    let oldest: [string, VideoElementState] | null = null;

    for (const entry of this.pool.entries()) {
      if (!oldest || entry[1].lastUsed < oldest[1].lastUsed) {
        oldest = entry;
      }
    }

    if (oldest) {
      const [clipId, state] = oldest;
      state.element.src = '';
      if (state.element.parentNode) {
        document.body.removeChild(state.element);
      }
      this.pool.delete(clipId);
      console.log(`[VideoPool] Evicted clip ${clipId}`);
    }
  }

  /**
   * Clear all elements from pool
   */
  clear(): void {
    for (const state of this.pool.values()) {
      state.element.src = '';
      if (state.element.parentNode) {
        document.body.removeChild(state.element);
      }
    }
    this.pool.clear();
    console.log('[VideoPool] Cleared all elements');
  }
}

// Singleton instance
export const videoElementPool = new VideoElementPool();

/**
 * Find clips within a time range
 */
function findClipsInRange(
  tracks: TimelineTrack[],
  startTime: number,
  endTime: number
): TimelineClip[] {
  const clips: TimelineClip[] = [];

  for (const track of tracks) {
    for (const clip of track.clips) {
      const clipEnd = clip.startTime + clip.duration;

      // Check if clip overlaps with the range
      if (clip.startTime < endTime && clipEnd > startTime) {
        clips.push(clip);
      }
    }
  }

  // Sort by start time
  clips.sort((a, b) => a.startTime - b.startTime);

  return clips;
}

/**
 * Hook configuration
 */
interface UseVideoElementPreloaderOptions {
  /** Current clip being played */
  currentClipId: string | null;
  /** Lookahead window in seconds */
  lookAheadSeconds?: number;
}

/**
 * Hook to preload upcoming video elements
 */
export const useVideoElementPreloader = ({
  currentClipId,
  lookAheadSeconds = 2,
}: UseVideoElementPreloaderOptions): void => {
  const tracks = useTimelineStore((state) => state.tracks);
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);
  const files = useMediaStore((state) => state.files);
  const isPlaying = useTimelineStore((state) => state.isPlaying);

  useEffect(() => {
    if (!isPlaying) return;

    // Find upcoming clips
    const lookAheadEnd = playheadPosition + lookAheadSeconds;
    const upcomingClips = findClipsInRange(tracks, playheadPosition, lookAheadEnd);

    // Preload each upcoming clip
    upcomingClips.forEach((clip) => {
      if (clip.id === currentClipId) return;

      const mediaFile = files.find((f) => f.id === clip.mediaFileId);
      if (!mediaFile) return;

      // Start preloading asynchronously
      videoElementPool
        .preloadElement(clip.id, mediaFile.path, clip.trimStart)
        .catch((err) => {
          handleError(err, 'useVideoElementPreloader.preload');
        });
    });
  }, [playheadPosition, currentClipId, tracks, files, isPlaying, lookAheadSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      videoElementPool.clear();
    };
  }, []);
};

