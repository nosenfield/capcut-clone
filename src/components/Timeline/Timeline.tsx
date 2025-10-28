/**
 * Timeline Component
 * 
 * Canvas-based timeline editor using Konva.js
 * Displays tracks, clips, playhead, and time ruler
 */

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { TimelineClip } from '../../types/timeline';

const TRACK_HEIGHT = 60;
const TRACK_PADDING = 4;
const TIMELINE_HEIGHT = 200;
const TIME_RULER_HEIGHT = 30;

export const Timeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(800);
  
  const { tracks, playheadPosition, zoom, duration, selectedClipId, selectClip, removeClip } = useTimelineStore();
  
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
      // Delete key removes selected clip
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        e.preventDefault();
        removeClip(selectedClipId);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, removeClip]);
  
  // Convert time to x position
  const timeToX = (time: number): number => {
    return time * zoom;
  };
  
  // Convert x position to time
  const xToTime = (x: number): number => {
    return x / zoom;
  };
  
  const calculatedWidth = Math.max(stageWidth, timeToX(duration || 0));
  
  return (
    <div ref={containerRef} className="timeline-container h-full flex flex-col bg-gray-900">
      <TimelineControls />
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <Stage width={calculatedWidth} height={TIMELINE_HEIGHT}>
          <Layer onClick={() => selectClip(null)}>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={calculatedWidth}
              height={TIMELINE_HEIGHT}
              fill="#1a1a1a"
            />
            
            {/* Time ruler */}
            <TimeRuler 
              zoom={zoom} 
              duration={duration || 0} 
              stageWidth={stageWidth}
              height={TIME_RULER_HEIGHT}
            />
            
            {/* Tracks */}
            {tracks.map((track, index) => (
              <TrackLayer
                key={track.id}
                track={track}
                y={TIME_RULER_HEIGHT + index * (TRACK_HEIGHT + TRACK_PADDING)}
                zoom={zoom}
                timeToX={timeToX}
                trackHeight={TRACK_HEIGHT}
                selectedClipId={selectedClipId}
                onSelectClip={selectClip}
              />
            ))}
            
            {/* Playhead */}
            <Playhead 
              position={playheadPosition} 
              zoom={zoom} 
              height={TIMELINE_HEIGHT}
              rulerHeight={TIME_RULER_HEIGHT}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

interface TimeRulerProps {
  zoom: number;
  duration: number;
  stageWidth: number;
  height: number;
}

const TimeRuler: React.FC<TimeRulerProps> = ({ zoom, duration, stageWidth, height }) => {
  const ticks: JSX.Element[] = [];
  const interval = zoom < 20 ? 5 : zoom < 50 ? 2 : 1; // Seconds between ticks
  
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
  const smallTicks: JSX.Element[] = [];
  for (let t = 0; t <= Math.max(duration, 10) && zoom > 30; t++) {
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
  
  return (
    <>
      <Rect x={0} y={0} width={stageWidth} height={height} fill="#0f0f0f" />
      {smallTicks}
      {ticks}
    </>
  );
};

interface TrackLayerProps {
  track: any;
  y: number;
  zoom: number;
  timeToX: (time: number) => number;
  trackHeight: number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
}

const TrackLayer: React.FC<TrackLayerProps> = ({ track, y, zoom, timeToX, trackHeight, selectedClipId, onSelectClip }) => {
  const { getMediaFile } = useMediaStore();
  
  return (
    <>
      {/* Track background */}
      <Rect
        x={0}
        y={y}
        width={10000}
        height={trackHeight}
        fill="#2a2a2a"
        stroke="#444"
        strokeWidth={1}
      />
      
      {/* Track label */}
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
      
      {/* Clips */}
      {track.clips.map((clip: TimelineClip) => {
        const mediaFile = getMediaFile(clip.mediaFileId);
        return (
          <ClipRect
            key={clip.id}
            clip={clip}
            mediaFile={mediaFile}
            y={y + 2}
            zoom={zoom}
            timeToX={timeToX}
            height={trackHeight - 4}
            isSelected={clip.id === selectedClipId}
            onSelect={onSelectClip}
          />
        );
      })}
    </>
  );
};

interface ClipRectProps {
  clip: TimelineClip;
  mediaFile: any;
  y: number;
  zoom: number;
  timeToX: (time: number) => number;
  height: number;
  isSelected: boolean;
  onSelect: (clipId: string | null) => void;
}

const ClipRect: React.FC<ClipRectProps> = ({ clip, mediaFile, y, zoom, timeToX, height, isSelected, onSelect }) => {
  const { updateClip } = useTimelineStore();
  const [isDragging, setIsDragging] = useState(false);
  
  const x = timeToX(clip.startTime);
  const width = clip.duration * zoom;
  
  // Constrain drag to horizontal movement only (prevent vertical movement)
  const dragBoundFunc = (pos: { x: number; y: number }) => {
    return {
      x: pos.x,
      y: y // Lock y position to prevent vertical dragging
    };
  };
  
  const handleDragEnd = (e: any) => {
    const newX = e.target.x();
    const newStartTime = newX / zoom;
    
    updateClip(clip.id, { startTime: Math.max(0, newStartTime) });
    setIsDragging(false);
    
    // Reset position (store update will re-render)
    e.target.x(x);
  };
  
  const handleClick = (e: any) => {
    // Don't select if dragging
    if (isDragging) return;
    e.cancelBubble = true;
    onSelect(clip.id);
  };
  
  // Clip style colors - show selected state
  const fillColor = isDragging ? '#64a5f5' : isSelected ? '#3b82f6' : '#4a9eff';
  const strokeColor = isSelected ? '#60a5fa' : '#6bb0ff';
  const strokeWidth = isSelected ? 2.5 : 1.5;
  
  // Trim handle handlers
  const handleLeftTrimDrag = (e: any) => {
    const deltaX = (e.target.x() - x) / zoom;
    const newTrimStart = Math.max(0, Math.min(clip.trimStart + deltaX, (mediaFile?.duration || 0) - clip.trimEnd - 0.1));
    const actualDelta = newTrimStart - clip.trimStart;
    const newDuration = clip.duration - actualDelta;
    const newStartTime = clip.startTime - actualDelta;
    
    if (newDuration >= 0.1 && newStartTime >= 0) {
      updateClip(clip.id, { trimStart: newTrimStart, duration: newDuration, startTime: newStartTime });
    }
    e.target.x(x);
  };
  
  const handleRightTrimDrag = (e: any) => {
    const newWidth = e.target.x() - x;
    const newDuration = newWidth / zoom;
    const maxDuration = (mediaFile?.duration || 0) - clip.trimStart - clip.trimEnd;
    const constrainedDuration = Math.max(0.1, Math.min(newDuration, maxDuration));
    const actualDelta = constrainedDuration - clip.duration;
    const newTrimEnd = Math.max(0, clip.trimEnd - actualDelta);
    
    if (constrainedDuration >= 0.1) {
      updateClip(clip.id, { duration: constrainedDuration, trimEnd: newTrimEnd });
    }
    e.target.x(x + width);
  };
  
  return (
    <Group onClick={handleClick}>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        cornerRadius={3}
        draggable
        dragBoundFunc={dragBoundFunc}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        shadowColor={isSelected ? "#60a5fa" : "black"}
        shadowBlur={isSelected ? 12 : 8}
        shadowOpacity={isSelected ? 0.4 : 0.2}
      />
      
      {/* Trim handles - only show when selected */}
      {isSelected && (
        <>
          {/* Left trim handle */}
          <Rect
            x={x}
            y={y}
            width={8}
            height={height}
            fill="#ff6b35"
            stroke="#fff"
            strokeWidth={1}
            draggable
            dragBoundFunc={(pos) => ({ x: pos.x, y: y })}
            onDragEnd={handleLeftTrimDrag}
          />
          
          {/* Right trim handle */}
          <Rect
            x={x + width - 8}
            y={y}
            width={8}
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
      
      {/* Clip label */}
      {width > 40 && (
        <Text
          x={x + 6}
          y={y + 8}
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

interface PlayheadProps {
  position: number;
  zoom: number;
  height: number;
  rulerHeight: number;
}

const Playhead: React.FC<PlayheadProps> = ({ position, zoom, height, rulerHeight }) => {
  const x = position * zoom;
  
  return (
    <>
      {/* Playhead line */}
      <Line
        points={[x, rulerHeight, x, height]}
        stroke="#ff4444"
        strokeWidth={2}
        listening={false}
      />
      
      {/* Playhead triangle on ruler */}
      <Line
        points={[x, rulerHeight, x - 6, rulerHeight - 8, x + 6, rulerHeight - 8, x, rulerHeight]}
        fill="#ff4444"
        closed={true}
        listening={false}
      />
    </>
  );
};

const TimelineControls: React.FC = () => {
  const { zoom, setZoom, playheadPosition, isPlaying, setIsPlaying, duration } = useTimelineStore();
  
  return (
    <div className="timeline-controls flex items-center gap-4 p-3 bg-gray-800 border-b border-gray-700">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
      >
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>
      
      <span className="text-white text-sm font-mono min-w-[120px]">
        {playheadPosition.toFixed(2)}s / {duration.toFixed(2)}s
      </span>
      
      <div className="flex items-center gap-2">
        <span className="text-white text-sm">Zoom:</span>
        <input
          type="range"
          min="10"
          max="200"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-white text-sm font-mono min-w-[60px]">{zoom}px/s</span>
      </div>
    </div>
  );
};

