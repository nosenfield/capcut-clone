/**
 * Preview Player Component
 * 
 * Displays video preview for the current playhead position
 * Placeholder implementation for Task 5.1
 */

import React from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';

export const PreviewPlayer: React.FC = () => {
  const { tracks, playheadPosition } = useTimelineStore();
  const { files } = useMediaStore();
  
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
  
  return (
    <div className="preview-player h-full w-full flex flex-col bg-black overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 min-w-0">
        {currentMedia ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={currentMedia.thumbnailUrl}
                alt={currentMedia.name}
                className="w-auto h-auto max-w-full max-h-full object-contain"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  aspectRatio: `${currentMedia.width} / ${currentMedia.height}`,
                }}
              />
            </div>
            <p className="text-gray-400 text-sm flex-shrink-0">{currentMedia.name}</p>
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

