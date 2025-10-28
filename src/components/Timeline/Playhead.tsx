/**
 * Playhead Component
 * 
 * Red indicator showing current playback position on timeline
 */

import React from 'react';
import { Group, Line } from 'react-konva';
import { useTimelineStore } from '../../store/timelineStore';

export interface PlayheadProps {
  position: number;
  zoom: number;
  height: number;
  rulerHeight: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ position, zoom, height, rulerHeight }) => {
  const setPlayheadPosition = useTimelineStore((state) => state.setPlayheadPosition);
  const duration = useTimelineStore((state) => state.duration);
  const x = position * zoom;
  
  const handleDragEnd = (e: any) => {
    const group = e.target.getType() === 'Group' ? e.target : e.target.getParent();
    if (!group) return;
    
    const dragOffset = group.x();
    const newPosition = Math.max(0, Math.min(duration, (x + dragOffset) / zoom));
    
    setPlayheadPosition(newPosition);
    group.x(0);
  };
  
  return (
    <Group
      name="playhead-group"
      x={0}
      y={rulerHeight - 8}
      draggable
      dragBoundFunc={(pos) => {
        const maxX = duration * zoom;
        const clampedX = Math.max(0, Math.min(maxX, pos.x));
        return { x: clampedX, y: rulerHeight - 8 };
      }}
      onDragEnd={handleDragEnd}
    >
      <Line
        name="playhead-triangle"
        points={[x, 8, x - 6, 0, x + 6, 0, x, 8]}
        fill="#ff4444"
        closed={true}
      />
      <Line
        name="playhead-line"
        points={[x, 8, x, height - rulerHeight + 8]}
        stroke="#ff4444"
        strokeWidth={2}
      />
    </Group>
  );
};

