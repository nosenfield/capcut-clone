/**
 * Clip Component
 * 
 * Individual clip rectangle on the timeline
 */

import React, { useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { TimelineClip } from '../../types/timeline';
import { TIMELINE_CONSTANTS } from '../../constants/timeline';

export interface ClipProps {
  clip: TimelineClip;
  y: number;
  zoom: number;
  timeToX: (time: number) => number;
  height: number;
  isSelected: boolean;
  onSelect: (clipId: string | null) => void;
}

export const Clip: React.FC<ClipProps> = ({ clip, y, zoom, timeToX, height, isSelected, onSelect }) => {
  const { updateClip } = useTimelineStore();
  const { getMediaFile } = useMediaStore();
  const [isDragging, setIsDragging] = useState(false);
  
  const mediaFile = getMediaFile(clip.mediaFileId);
  const x = timeToX(clip.startTime);
  const width = clip.duration * zoom;
  
  const dragBoundFunc = (pos: { x: number; y: number }) => ({
    x: pos.x,
    y: y
  });
  
  const handleDragEnd = (e: any) => {
    const newX = e.target.x();
    const newStartTime = newX / zoom;
    
    updateClip(clip.id, { startTime: Math.max(0, newStartTime) });
    setIsDragging(false);
    
    e.target.x(0);
  };
  
  const handleClick = (e: any) => {
    if (isDragging) return;
    e.cancelBubble = true;
    onSelect(clip.id);
  };
  
  const fillColor = isDragging ? '#64a5f5' : isSelected ? '#3b82f6' : '#4a9eff';
  const strokeColor = isSelected ? '#60a5fa' : '#6bb0ff';
  const strokeWidth = isSelected ? 2.5 : 1.5;
  
  const handleLeftTrimDrag = (e: any) => {
    e.cancelBubble = true;
    e.evt?.stopPropagation();
    
    const deltaX = e.target.x() / zoom;
    const newTrimStart = Math.max(0, Math.min(clip.trimStart + deltaX, (mediaFile?.duration || 0) - clip.trimEnd - TIMELINE_CONSTANTS.MIN_CLIP_DURATION));
    const actualDelta = newTrimStart - clip.trimStart;
    const newDuration = clip.duration - actualDelta;
    const newStartTime = clip.startTime + actualDelta;
    
    if (newDuration >= TIMELINE_CONSTANTS.MIN_CLIP_DURATION && newStartTime >= 0) {
      updateClip(clip.id, { trimStart: newTrimStart, duration: newDuration, startTime: newStartTime });
    }
    
    e.target.x(0);
  };
  
  const handleRightTrimDrag = (e: any) => {
    e.cancelBubble = true;
    e.evt?.stopPropagation();
    
    const currentPos = e.target.x();
    const deltaX = currentPos - (width - TIMELINE_CONSTANTS.TRIM_HANDLE_WIDTH);
    const deltaTime = deltaX / zoom;
    const newDuration = clip.duration + deltaTime;
    const maxDuration = (mediaFile?.duration || 0) - clip.trimStart - clip.trimEnd;
    const constrainedDuration = Math.max(TIMELINE_CONSTANTS.MIN_CLIP_DURATION, Math.min(newDuration, maxDuration));
    const actualDelta = constrainedDuration - clip.duration;
    const newTrimEnd = Math.max(0, clip.trimEnd - actualDelta);
    
    if (constrainedDuration >= TIMELINE_CONSTANTS.MIN_CLIP_DURATION) {
      updateClip(clip.id, { duration: constrainedDuration, trimEnd: newTrimEnd });
    }
    
    e.target.x(constrainedDuration * zoom - TIMELINE_CONSTANTS.TRIM_HANDLE_WIDTH);
  };
  
  return (
    <Group 
      name={`clip-group-${clip.id}`}
      x={x}
      y={y}
      onClick={handleClick}
      draggable
      dragBoundFunc={dragBoundFunc}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        cornerRadius={3}
        shadowColor={isSelected ? "#60a5fa" : "black"}
        shadowBlur={isSelected ? 12 : 8}
        shadowOpacity={isSelected ? 0.4 : 0.2}
      />
      
      {isSelected && (
        <>
          <Rect
            x={0}
            y={0}
            width={TIMELINE_CONSTANTS.TRIM_HANDLE_WIDTH}
            height={height}
            fill="#ff6b35"
            stroke="#fff"
            strokeWidth={1}
            draggable
            dragBoundFunc={(pos) => ({ x: pos.x, y: y })}
            onDragEnd={handleLeftTrimDrag}
          />
          <Rect
            x={width - TIMELINE_CONSTANTS.TRIM_HANDLE_WIDTH}
            y={0}
            width={TIMELINE_CONSTANTS.TRIM_HANDLE_WIDTH}
            height={height}
            fill="#ff6b35"
            stroke="#fff"
            strokeWidth={1}
            draggable
            dragBoundFunc={(pos) => ({ x: pos.x, y: y })}
            onDragEnd={handleRightTrimDrag}
          />
        </>
      )}
      
      {width > 40 && (
        <Text
          x={6}
          y={8}
          text={mediaFile?.name || 'Unknown'}
          fontSize={11}
          fill="#fff"
          fontFamily="sans-serif"
          listening={false}
          width={width - 12}
          ellipsis={true}
        />
      )}
    </Group>
  );
};

