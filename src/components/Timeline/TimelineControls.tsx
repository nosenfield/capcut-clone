/**
 * Timeline Controls Component
 * 
 * Playback controls and zoom slider
 */

import React from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { TIMELINE_CONSTANTS } from '../../constants/timeline';

export const TimelineControls: React.FC = () => {
  const zoom = useTimelineStore((state) => state.zoom);
  const setZoom = useTimelineStore((state) => state.setZoom);
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);
  const isPlaying = useTimelineStore((state) => state.isPlaying);
  const setIsPlaying = useTimelineStore((state) => state.setIsPlaying);
  const duration = useTimelineStore((state) => state.duration);
  
  return (
    <div className="timeline-controls flex items-center gap-4 p-3 bg-gray-800 border-b border-gray-700">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
      >
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>
      
      <span className="text-white text-sm font-mono min-w-[120px]">
        {playheadPosition.toFixed(2)}s / {duration.toFixed(2)}s
      </span>
      
      <div className="flex items-center gap-2">
        <span className="text-white text-sm">Zoom:</span>
        <input
          type="range"
          min={TIMELINE_CONSTANTS.MIN_ZOOM}
          max={TIMELINE_CONSTANTS.MAX_ZOOM}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-white text-sm font-mono min-w-[60px]">{zoom}px/s</span>
      </div>
    </div>
  );
};

