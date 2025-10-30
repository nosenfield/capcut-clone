/**
 * Transcript Viewer Component
 * 
 * Displays transcript with timestamps, search functionality, and export options.
 * Highlights active segment based on playhead position.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranscriptionStore } from '../../store/transcriptionStore';
import { useTimelineStore } from '../../store/timelineStore';
import { transcriptionService } from '../../services/transcriptionService';

interface TranscriptViewerProps {
  clipId: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ clipId }) => {
  const getTranscript = useTranscriptionStore((state) => state.getTranscript);
  const transcript = getTranscript(clipId);
  const { playheadPosition, setPlayheadPosition } = useTimelineStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update active segment based on playhead
  useEffect(() => {
    if (!transcript) return;

    const segment = transcriptionService.getSegmentAtTime(transcript, playheadPosition);
    setActiveSegmentId(segment?.id || null);

    // Auto-scroll to active segment
    if (segment && containerRef.current) {
      const segmentEl = containerRef.current.querySelector(`[data-segment-id="${segment.id}"]`);
      if (segmentEl) {
        segmentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [transcript, playheadPosition]);

  if (!transcript) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No transcript available for this clip</p>
        <p className="text-sm mt-2">Use the Transcription panel to generate one</p>
      </div>
    );
  }

  const filteredSegments = searchQuery
    ? transcriptionService.searchTranscript(transcript, searchQuery)
    : transcript.segments;

  const handleSegmentClick = (start: number) => {
    setPlayheadPosition(start);
  };

  const handleExport = async (format: 'txt' | 'srt' | 'vtt' | 'json') => {
    try {
      await transcriptionService.exportTranscript(transcript, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Transcript</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('txt')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              TXT
            </button>
            <button
              onClick={() => handleExport('srt')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              SRT
            </button>
            <button
              onClick={() => handleExport('vtt')}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              VTT
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transcript..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
        />

        {/* Info */}
        <div className="mt-2 text-xs text-gray-400">
          Language: {transcript.language} • Duration: {transcript.duration.toFixed(1)}s
        </div>

        {/* Hashtags */}
        {transcript.hashtags && transcript.hashtags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {transcript.hashtags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded border border-blue-500/30"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Segments */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredSegments.map((segment) => {
          const isActive = segment.id === activeSegmentId;
          return (
            <div
              key={segment.id}
              data-segment-id={segment.id}
              onClick={() => handleSegmentClick(segment.start)}
              className={`p-3 rounded cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-600/30 border border-blue-500'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 font-mono">
                  {formatTime(segment.start)} → {formatTime(segment.end)}
                </span>
                {isActive && (
                  <span className="text-xs text-blue-400 font-semibold">▶ Playing</span>
                )}
              </div>
              <p className="text-sm leading-relaxed">{segment.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}

