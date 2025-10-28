/**
 * Playhead Component
 * 
 * Red indicator showing current playback position on timeline
 */

import React from 'react';
import { Group, Line } from 'react-konva';

export interface PlayheadProps {
  position: number;
  zoom: number;
  height: number;
  rulerHeight: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ position, zoom, height, rulerHeight }) => {
  const x = position * zoom;
  
  return (
    <Group
      name="playhead-group"
      x={0}
      y={rulerHeight - 8}
    >
      <Line
        name="playhead-triangle"
        points={[x, 8, x - 6, 0, x + 6, 0, x, 8]}
        fill="#ff4444"
        closed={true}
        listening={false}
      />
      <Line
        name="playhead-line"
        points={[x, 8, x, height - rulerHeight + 8]}
        stroke="#ff4444"
        strokeWidth={2}
        listening={false}
      />
    </Group>
  );
};
