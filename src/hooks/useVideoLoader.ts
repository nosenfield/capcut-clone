/**
 * Custom Hook: useVideoLoader
 * 
 * Handles video file loading and blob URL management.
 * Extracts complex video loading logic from components.
 */

import { useState, useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { handleError } from '../utils/errors';
import { videoCache } from './useVideoPreloader';

export interface UseVideoLoaderResult {
  videoSrc: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for loading video files and managing blob URLs
 * 
 * @param filePath - Path to the video file, or null if no file
 * @returns Object with videoSrc (blob URL or asset URL), loading state, and error state
 */
export const useVideoLoader = (filePath: string | null): UseVideoLoaderResult => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const lastFilePathRef = useRef<string | null>(null);
  
  useEffect(() => {
    // No file path provided
    if (!filePath) {
      setVideoSrc(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    // Already loaded this file
    if (lastFilePathRef.current === filePath && blobUrlRef.current) {
      setVideoSrc(blobUrlRef.current);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    // Update tracked path
    lastFilePathRef.current = filePath;
    
    // Store old blob URL before loading new one
    const oldBlobUrl = blobUrlRef.current;
    let isCancelled = false;
    
    const loadVideo = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get blob URL from cache (will load if not already loaded/preloaded)
        const blobUrl = await videoCache.getBlobUrl(filePath);
        
        if (!blobUrl) {
          throw new Error('Failed to get blob URL from cache');
        }
        
        if (!isCancelled) {
          blobUrlRef.current = blobUrl;
          setVideoSrc(blobUrl);
          setIsLoading(false);
          
          // Revoke old blob URL after delay to let video load new source
          if (oldBlobUrl) {
            setTimeout(() => {
              URL.revokeObjectURL(oldBlobUrl);
            }, 1000);
          }
        }
      } catch (err) {
        if (isCancelled) return;
        handleError(err, 'useVideoLoader.loadVideo');
        
        // Fallback to convertFileSrc
        try {
          const src = convertFileSrc(filePath);
          setVideoSrc(src);
          setError(null);
          setIsLoading(false);
        } catch (fallbackErr) {
          if (!isCancelled) {
            setError(err as Error);
            setIsLoading(false);
            setVideoSrc(null);
          }
        }
        
        // Revoke old blob URL if using fallback
        if (oldBlobUrl && !isCancelled) {
          URL.revokeObjectURL(oldBlobUrl);
        }
      }
    };
    
    loadVideo();
    
    return () => {
      isCancelled = true;
    };
  }, [filePath]);
  
  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);
  
  return { videoSrc, isLoading, error };
};
