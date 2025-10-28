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
    <div className="preview-player h-full flex flex-col bg-black">
      <div className="flex-1 flex items-center justify-center p-8">
        {currentMedia ? (
          <div className="text-center">
            <img
              src={currentMedia.thumbnailUrl}
              alt={currentMedia.name}
              className="max-w-full max-h-full mx-auto rounded"
              style={{ maxHeight: '80vh' }}
            />
            <p className="text-gray-400 text-sm mt-4">{currentMedia.name}</p>
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

