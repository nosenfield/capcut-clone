/**
 * Layer Panel Component
 * 
 * Shows list of clips/layers in the timeline
 */

import React from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';

export const LayerPanel: React.FC = () => {
  const { tracks } = useTimelineStore();
  const { getMediaFile } = useMediaStore();
  
  // Get all clips from all tracks
  const allClips = tracks.flatMap(track => track.clips);
  
  return (
    <div className="layer-panel h-full flex flex-col bg-gray-900 text-white border-t border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-red-500">LAYER PANEL</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {allClips.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 text-sm">
            <p>No clips on timeline</p>
          </div>
        ) : (
          <div className="space-y-1">
            {allClips.map((clip, index) => {
              const mediaFile = getMediaFile(clip.mediaFileId);
              return (
                <div
                  key={clip.id}
                  className="bg-black text-white px-3 py-2 rounded text-sm font-medium"
                >
                  {mediaFile?.name || `Clip #${index + 1}`}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

