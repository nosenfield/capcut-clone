/**
 * Timeline Component
 * 
 * Canvas-based timeline editor using Konva.js
 * Displays tracks, clips, playhead, and time ruler
 */

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useTimelineStore } from '../../store/timelineStore';
import { TIMELINE_CONSTANTS } from '../../constants/timeline';
import { TimeRuler } from './TimeRuler';
import { Track } from './Track';
import { Playhead } from './Playhead';
import { TimelineControls } from './TimelineControls';

interface TimelineProps {
  onExportClick: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({ onExportClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(800);
  
  const tracks = useTimelineStore((state) => state.tracks);
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);
  const zoom = useTimelineStore((state) => state.zoom);
  const compositionLength = useTimelineStore((state) => state.compositionLength);
  const selectedClipId = useTimelineStore((state) => state.selectedClipId);
  const selectClip = useTimelineStore((state) => state.selectClip);
  const removeClip = useTimelineStore((state) => state.removeClip);
  const setPlayheadPosition = useTimelineStore((state) => state.setPlayheadPosition);
  
  // Update stage width on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        e.preventDefault();
        removeClip(selectedClipId);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, removeClip]);
  
  // Convert time to x position
  const timeToX = (time: number): number => time * zoom;
  
  const calculatedWidth = Math.max(stageWidth, timeToX(compositionLength));
  
  // Handle timeline click for seeking
  const handleTimelineClick = (e: any) => {
    const target = e.target;
    const targetName = target.name();
    
    if (!targetName || targetName === 'background') {
      const stage = target.getStage();
      const pointerPos = stage?.getPointerPosition();
      
      if (pointerPos && pointerPos.y <= TIMELINE_CONSTANTS.TIME_RULER_HEIGHT) {
        const newPosition = pointerPos.x / zoom;
        setPlayheadPosition(Math.max(0, Math.min(compositionLength, newPosition)));
      }
    }
    
    selectClip(null);
  };
  
  return (
    <div ref={containerRef} className="timeline-container h-full flex flex-col bg-gray-900">
      <TimelineControls onExportClick={onExportClick} />
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <Stage width={calculatedWidth} height={TIMELINE_CONSTANTS.TIMELINE_HEIGHT}>
          <Layer onClick={handleTimelineClick}>
            <Rect
              x={0}
              y={0}
              width={calculatedWidth}
              height={TIMELINE_CONSTANTS.TIMELINE_HEIGHT}
              fill="#1a1a1a"
              name="background"
            />
            
            <TimeRuler 
              zoom={zoom} 
              duration={compositionLength} 
              stageWidth={stageWidth}
              height={TIMELINE_CONSTANTS.TIME_RULER_HEIGHT}
              compositionLength={compositionLength}
              onSeek={setPlayheadPosition}
            />
            
            {tracks.map((track, index) => (
              <Track
                key={track.id}
                track={track}
                y={TIMELINE_CONSTANTS.TIME_RULER_HEIGHT + index * (TIMELINE_CONSTANTS.TRACK_HEIGHT + TIMELINE_CONSTANTS.TRACK_PADDING)}
                zoom={zoom}
                timeToX={timeToX}
                trackHeight={TIMELINE_CONSTANTS.TRACK_HEIGHT}
                selectedClipId={selectedClipId}
                onSelectClip={selectClip}
              />
            ))}
            
            <Playhead 
              position={playheadPosition} 
              zoom={zoom} 
              height={TIMELINE_CONSTANTS.TIMELINE_HEIGHT}
              rulerHeight={TIMELINE_CONSTANTS.TIME_RULER_HEIGHT}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
