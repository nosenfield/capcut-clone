/**
 * TimeRuler Component
 * 
 * Displays time markers on the timeline
 */

import React from 'react';
import { Rect, Line, Text } from 'react-konva';
import { TIMELINE_CONSTANTS } from '../../constants/timeline';

export interface TimeRulerProps {
  zoom: number;
  duration: number;
  stageWidth: number;
  height: number;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({ zoom, duration, stageWidth, height }) => {
  const ticks: React.ReactNode[] = [];
  const interval = zoom < TIMELINE_CONSTANTS.ZOOM_THRESHOLD_LARGE 
    ? TIMELINE_CONSTANTS.TICK_INTERVAL_LARGE 
    : zoom < TIMELINE_CONSTANTS.ZOOM_THRESHOLD_MEDIUM 
    ? TIMELINE_CONSTANTS.TICK_INTERVAL_MEDIUM 
    : TIMELINE_CONSTANTS.TICK_INTERVAL_SMALL;
  
  for (let t = 0; t <= Math.max(duration, 10); t += interval) {
    const x = t * zoom;
    if (x > stageWidth + 200) break;
    
    ticks.push(
      <React.Fragment key={t}>
        <Line
          points={[x, height - 10, x, height]}
          stroke="#555"
          strokeWidth={1}
        />
        <Text
          x={x + 4}
          y={8}
          text={`${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`}
          fontSize={11}
          fill="#999"
          fontFamily="monospace"
        />
      </React.Fragment>
    );
  }
  
  // Small ticks for every second
  const smallTicks: React.ReactNode[] = [];
  if (zoom > TIMELINE_CONSTANTS.ZOOM_THRESHOLD_SMALL) {
    for (let t = 0; t <= Math.max(duration, 10); t++) {
      const x = t * zoom;
      if (x > stageWidth + 200) break;
      
      if (t % interval !== 0) {
        smallTicks.push(
          <Line
            key={`small-${t}`}
            points={[x, height - 5, x, height]}
            stroke="#666"
            strokeWidth={0.5}
          />
        );
      }
    }
  }
  
  return (
    <>
      <Rect x={0} y={0} width={stageWidth} height={height} fill="#0f0f0f" />
      {smallTicks}
      {ticks}
    </>
  );
};

