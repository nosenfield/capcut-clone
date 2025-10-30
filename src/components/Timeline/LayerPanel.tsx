/**
 * Hashtag Panel Component
 * 
 * Displays and generates hashtags for the current timeline
 */

import React, { useState } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useMediaStore } from '../../store/mediaStore';
import { useTranscriptionStore } from '../../store/transcriptionStore';
import { transcriptionService } from '../../services/transcriptionService';
import { toAppError } from '../../utils/errors';

/**
 * Get OpenAI API key from environment variable
 */
const getApiKey = (): string | null => {
  const envKey = import.meta.env.VITE_OPENAI_API_KEY;
  return envKey && typeof envKey === 'string' ? envKey.trim() : null;
};

export const HashtagPanel: React.FC = () => {
  const { tracks, compositionLength } = useTimelineStore();
  const { files } = useMediaStore();
  const {
    isTranscribing,
    setProgress,
    addTranscript,
    getTranscript,
  } = useTranscriptionStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get timeline transcript (clipId = "timeline")
  const timelineTranscript = getTranscript('timeline');
  const hashtags = timelineTranscript?.hashtags || [];

  // Get all clips from timeline
  const allClips = tracks.flatMap((track) => track.clips);

  const handleGenerate = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
      return;
    }

    if (allClips.length === 0) {
      setError('No clips on timeline to generate hashtags from');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Collect clips in timeline order (sorted by startTime)
      const timelineClips = allClips
        .filter((clip) => {
          // Filter to composition length
          return clip.startTime < compositionLength;
        })
        .map((clip) => {
          const mediaFile = files.find((f) => f.id === clip.mediaFileId);
          if (!mediaFile) throw new Error(`Media file not found: ${clip.mediaFileId}`);
          
          const effectiveDuration = Math.min(clip.duration, compositionLength - clip.startTime);
          
          return {
            filePath: mediaFile.path,
            startTime: clip.startTime,
            duration: effectiveDuration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
          };
        })
        .sort((a, b) => a.startTime - b.startTime);

      // Transcribe timeline
      const transcript = await transcriptionService.transcribeTimeline(
        timelineClips,
        compositionLength,
        apiKey,
        {
          language: undefined,
          model: 'whisper-1',
          responseFormat: 'verbose_json',
          temperature: 0.0,
        },
        (progress) => {
          setProgress(progress);
        }
      );

      // Generate hashtags for timeline transcript
      setProgress({
        clipId: 'timeline',
        stage: 'processing',
        percent: 95,
        message: 'Generating hashtags...',
      });

      try {
        const generatedHashtags = await transcriptionService.generateHashtags(
          transcript.fullText,
          apiKey,
          10
        );
        transcript.hashtags = generatedHashtags;
      } catch (error) {
        console.error('Failed to generate hashtags:', error);
      }

      // Store with clipId "timeline"
      addTranscript(transcript);
      setProgress(null);
    } catch (err) {
      const appError = toAppError(err, 'HashtagPanel.handleGenerate');
      setError(appError.userMessage);
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };
  
  return (
    <div className="hashtag-panel h-full flex flex-col bg-gray-900 text-white border-t border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-red-500">HASHTAGS</h2>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isTranscribing || allClips.length === 0 || !getApiKey()}
            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition-colors"
          >
            {isGenerating || isTranscribing ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-600/20 border border-red-600 rounded text-red-200 text-xs">
            {error}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {hashtags.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 text-sm">
            <p>No hashtags generated yet</p>
            <p className="text-xs mt-2 opacity-75">Click Generate to create hashtags from timeline</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm rounded border border-blue-500/30"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

