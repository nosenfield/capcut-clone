/**
 * Export Dialog Component
 * 
 * Modal dialog for configuring and executing video exports.
 * Shows export settings (resolution, fps) and progress.
 */

import React, { useState, useRef, useEffect } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { useAppStore } from '../../store/appStore';
import { videoService } from '../../services/videoService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const { tracks, compositionLength } = useTimelineStore();
  const { files } = useMediaStore();
  const { isExporting, exportProgress, setIsExporting, setExportProgress } = useAppStore();
  
  const [resolution, setResolution] = useState<'720p' | '1080p' | 'source'>('1080p');
  const [fps, setFps] = useState(30);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);
  
  const handleExport = async () => {
    // Open save dialog
    const outputPath = await save({
      filters: [{
        name: 'Video',
        extensions: ['mp4']
      }],
      defaultPath: 'exported-video.mp4'
    });
    
    if (!outputPath) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Collect all clips from timeline, filtering to composition length
      const allClips = tracks.flatMap(track => 
        track.clips
          .filter(clip => {
            // Filter out clips that are completely outside composition length
            return clip.startTime < compositionLength;
          })
          .map(clip => {
            const mediaFile = files.find(f => f.id === clip.mediaFileId);
            if (!mediaFile) throw new Error(`Media file not found: ${clip.mediaFileId}`);
            
            // Calculate the effective duration within composition length
            // This ensures we only export content within the composition length
            const effectiveDuration = Math.min(clip.duration, compositionLength - clip.startTime);
            
            return {
              filePath: mediaFile.path,
              startTime: clip.startTime,
              duration: effectiveDuration,
              trimStart: clip.trimStart,
              trimEnd: clip.trimEnd
            };
          })
      );
      
      // Sort clips by start time
      allClips.sort((a, b) => a.startTime - b.startTime);
      
      if (allClips.length === 0) {
        alert('No clips on timeline to export');
        return;
      }
      
      // Simulate progress with animation (since we can't parse FFmpeg output easily)
      let currentProgress = 0;
      progressIntervalRef.current = setInterval(() => {
        currentProgress += Math.random() * 10; // Increase by 0-10%
        if (currentProgress > 90) currentProgress = 90; // Cap at 90% until completion
        setExportProgress(currentProgress);
      }, 300); // Update every 300ms
      
      await videoService.exportVideo(allClips, outputPath, resolution, fps);
      
      // Clean up interval and set to 100%
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setExportProgress(100);
      alert('Export completed successfully!');
      onClose();
      
    } catch (error) {
      console.error('Export failed:', error);
      
      // Clean up interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      alert(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 text-white">
        <h2 className="text-xl font-bold mb-4">Export Video</h2>
        
        {isExporting ? (
          <div className="space-y-4">
            <p>Exporting video...</p>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{Math.round(exportProgress)}%</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="720p">720p (1280x720)</option>
                  <option value="1080p">1080p (1920x1080)</option>
                  <option value="source">Source Resolution</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Frame Rate</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value={24}>24 fps</option>
                  <option value={30}>30 fps</option>
                  <option value={60}>60 fps</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Export
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

