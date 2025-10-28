/**
 * Track Component
 * 
 * Individual track on the timeline
 */

import React from 'react';
import { Rect, Text } from 'react-konva';
import { TimelineTrack, TimelineClip } from '../../types/timeline';
import { Clip } from './Clip';

export interface TrackProps {
  track: TimelineTrack;
  y: number;
  zoom: number;
  timeToX: (time: number) => number;
  trackHeight: number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
}

export const Track: React.FC<TrackProps> = ({ track, y, zoom, timeToX, trackHeight, selectedClipId, onSelectClip }) => {
  return (
    <>
      <Rect
        x={0}
        y={y}
        width={10000}
        height={trackHeight}
        fill="#2a2a2a"
        stroke="#444"
        strokeWidth={1}
      />
      
      <Rect
        x={0}
        y={y}
        width={120}
        height={trackHeight}
        fill="#333"
        stroke="#444"
        strokeWidth={1}
      />
      <Text
        x={8}
        y={y + 18}
        text={track.name}
        fontSize={12}
        fill="#aaa"
        fontFamily="sans-serif"
      />
      
      {track.clips.map((clip: TimelineClip) => (
        <Clip
          key={clip.id}
          clip={clip}
          y={y + 2}
          zoom={zoom}
          timeToX={timeToX}
          height={trackHeight - 4}
          isSelected={clip.id === selectedClipId}
          onSelect={onSelectClip}
        />
      ))}
    </>
  );
};
