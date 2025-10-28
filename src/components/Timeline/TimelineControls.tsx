/**
 * Timeline Controls Component
 * 
 * Playback controls, zoom slider, and export button
 */

import React from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { TIMELINE_CONSTANTS } from '../../constants/timeline';

interface TimelineControlsProps {
  onExportClick: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({ onExportClick }) => {
  const zoom = useTimelineStore((state) => state.zoom);
  const setZoom = useTimelineStore((state) => state.setZoom);
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);
  const isPlaying = useTimelineStore((state) => state.isPlaying);
  const setIsPlaying = useTimelineStore((state) => state.setIsPlaying);
  const compositionLength = useTimelineStore((state) => state.compositionLength);
  const setCompositionLength = useTimelineStore((state) => state.setCompositionLength);
  
  return (
    <div className="timeline-controls flex items-center justify-between gap-4 p-3 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        
        <div className="flex items-center gap-1 text-white text-sm font-mono">
          <span>{playheadPosition.toFixed(2)}s / </span>
          <input
            type="number"
            min="0.1"
            max="600"
            step="0.1"
            value={compositionLength}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              if (newValue > 0) {
                setCompositionLength(newValue);
              }
            }}
            onBlur={(e) => {
              const newValue = Number(e.target.value);
              if (newValue <= 0 || isNaN(newValue)) {
                // Reset to last valid value if input is invalid
                e.target.value = compositionLength.toString();
              }
            }}
            className="w-32 px-2 py-1 bg-gray-700 text-white text-sm rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span>s</span>
        </div>
        
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
      
      <button
        onClick={onExportClick}
        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors font-medium"
      >
        Export Video
      </button>
    </div>
  );
};
