/**
 * Custom Hook: useVideoPreloader
 * 
 * Preloads video blob URLs for upcoming clips to reduce stutter when entering clips.
 * Based on playback-optimization-analysis.md recommendations.
 */

import { useEffect, useRef } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';
import { useTimelineStore } from '../store/timelineStore';
import { useMediaStore } from '../store/mediaStore';
import { TimelineClip } from '../types/timeline';
import { handleError } from '../utils/errors';

/**
 * Blob URL cache for video files
 */
interface BlobUrlCache {
  filePath: string;
  blobUrl: string;
  accessTime: number;
}

class VideoPreloadCache {
  private cache = new Map<string, BlobUrlCache>();
  private loadingPromises = new Map<string, Promise<string>>();
  private maxCacheSize = 5; // Maximum number of preloaded videos

  /**
   * Get or preload a blob URL for a video file
   */
  async getBlobUrl(filePath: string): Promise<string | null> {
    // Check if already in cache
    const cached = this.cache.get(filePath);
    if (cached) {
      cached.accessTime = Date.now();
      return cached.blobUrl;
    }

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(filePath);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Start loading
    const promise = this.loadBlobUrl(filePath);
    this.loadingPromises.set(filePath, promise);

    try {
      const blobUrl = await promise;
      this.loadingPromises.delete(filePath);
      return blobUrl;
    } catch (error) {
      this.loadingPromises.delete(filePath);
      handleError(error, 'VideoPreloadCache.getBlobUrl');
      return null;
    }
  }

  /**
   * Load blob URL from file
   */
  private async loadBlobUrl(filePath: string): Promise<string> {
    try {
      const data = await readFile(filePath);
      const blob = new Blob([data], { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);

      // Add to cache
      this.cache.set(filePath, {
        filePath,
        blobUrl,
        accessTime: Date.now(),
      });

      // Evict old entries if cache is too large
      if (this.cache.size > this.maxCacheSize) {
        this.evictOldest();
      }

      return blobUrl;
    } catch (error) {
      handleError(error, 'VideoPreloadCache.loadBlobUrl');
      throw error;
    }
  }

  /**
   * Evict the oldest cached entry
   */
  private evictOldest() {
    let oldest: [string, BlobUrlCache] | null = null;

    for (const entry of this.cache.entries()) {
      if (!oldest || entry[1].accessTime < oldest[1].accessTime) {
        oldest = entry;
      }
    }

    if (oldest) {
      // Revoke blob URL to free memory
      URL.revokeObjectURL(oldest[1].blobUrl);
      this.cache.delete(oldest[0]);
    }
  }

  /**
   * Clear all cached blob URLs
   */
  clear() {
    for (const cache of this.cache.values()) {
      URL.revokeObjectURL(cache.blobUrl);
    }
    this.cache.clear();
  }

  /**
   * Check if a file path is cached
   */
  has(filePath: string): boolean {
    return this.cache.has(filePath);
  }
}

// Shared cache instance
const videoCache = new VideoPreloadCache();

/**
 * Export cache instance for use by useVideoLoader
 */
export { videoCache };

/**
 * Find clips within a time range
 */
function findClipsInRange(
  tracks: any[],
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
interface UseVideoPreloaderOptions {
  /** Current clip being played */
  currentClipId: string | null;
  /** Lookahead window in seconds */
  lookAheadSeconds?: number;
}

/**
 * Hook for preloading upcoming video clips
 */
export const useVideoPreloader = ({
  currentClipId,
  lookAheadSeconds = 2,
}: UseVideoPreloaderOptions): void => {
  const tracks = useTimelineStore((state) => state.tracks);
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);
  const files = useMediaStore((state) => state.files);
  const isPlaying = useTimelineStore((state) => state.isPlaying);
  
  const preloadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    // Find clips within lookahead window
    const lookAheadEnd = playheadPosition + lookAheadSeconds;
    const upcomingClips = findClipsInRange(tracks, playheadPosition, lookAheadEnd);

    // Preload each upcoming clip
    upcomingClips.forEach((clip) => {
      // Skip current clip - already loaded
      if (clip.id === currentClipId) {
        return;
      }

      // Skip if already preloading
      if (preloadingRef.current.has(clip.id)) {
        return;
      }

      // Find media file
      const mediaFile = files.find((f) => f.id === clip.mediaFileId);
      if (!mediaFile) {
        return;
      }

      // Check if already cached
      if (videoCache.has(mediaFile.path)) {
        return;
      }

      // Start preloading
      preloadingRef.current.add(clip.id);
      
      videoCache.getBlobUrl(mediaFile.path)
        .then(() => {
          console.log(`[VideoPreloader] Preloaded clip ${clip.id}`);
          preloadingRef.current.delete(clip.id);
        })
        .catch((error) => {
          handleError(error, 'useVideoPreloader.preload');
          preloadingRef.current.delete(clip.id);
        });
    });

    // Cleanup clips that have passed
    const now = playheadPosition;
    upcomingClips.forEach((clip) => {
      const clipEnd = clip.startTime + clip.duration;
      
      // If clip has already passed, remove from preloading tracking
      if (clipEnd < now - 1) {
        preloadingRef.current.delete(clip.id);
      }
    });
  }, [playheadPosition, currentClipId, tracks, files, lookAheadSeconds, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadingRef.current.clear();
    };
  }, []);
};

