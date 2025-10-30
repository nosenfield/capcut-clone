/**
 * Transcription Panel Component
 * 
 * Modal dialog for transcribing video clips using OpenAI Whisper API.
 * Reads API key from VITE_OPENAI_API_KEY environment variable.
 * Handles clip selection and transcription progress.
 */

import React, { useState } from 'react';
import { useTranscriptionStore } from '../../store/transcriptionStore';
import { useMediaStore } from '../../store/mediaStore';
import { useTimelineStore } from '../../store/timelineStore';
import { transcriptionService } from '../../services/transcriptionService';
import { toAppError } from '../../utils/errors';

/**
 * Get OpenAI API key from environment variable
 */
const getApiKey = (): string | null => {
  const envKey = import.meta.env.VITE_OPENAI_API_KEY;
  return envKey && typeof envKey === 'string' ? envKey.trim() : null;
};

interface TranscriptionPanelProps {
  onClose: () => void;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ onClose }) => {
  const { tracks } = useTimelineStore();
  const { files } = useMediaStore();
  const {
    isTranscribing,
    progress,
    setIsTranscribing,
    setProgress,
    addTranscript,
    transcripts,
  } = useTranscriptionStore();

  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Get all clips from timeline
  const allClips = tracks.flatMap((track) => track.clips);

  const handleTranscribe = async () => {
    if (!selectedClipId) {
      setError('Please select a clip to transcribe');
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      setError('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
      return;
    }

    const clip = allClips.find((c) => c.id === selectedClipId);
    if (!clip) {
      setError('Clip not found');
      return;
    }

    const mediaFile = files.find((f) => f.id === clip.mediaFileId);
    if (!mediaFile) {
      setError('Media file not found');
      return;
    }

    setError(null);
    setIsTranscribing(true);

    try {
      const transcript = await transcriptionService.transcribeClip(
        clip.id,
        mediaFile.path,
        clip.trimStart,
        clip.duration,
        apiKey,
        {
          language: language || undefined,
          model: 'whisper-1',
          responseFormat: 'verbose_json',
          temperature: 0.0,
        },
        (progress) => {
          setProgress(progress);
        }
      );

      // Generate hashtags from transcript content
      setProgress({
        clipId: clip.id,
        stage: 'processing',
        percent: 95,
        message: 'Generating hashtags...',
      });

      try {
        const hashtags = await transcriptionService.generateHashtags(
          transcript.fullText,
          apiKey,
          10
        );
        transcript.hashtags = hashtags;
      } catch (error) {
        // Log error but don't fail - hashtags are optional
        console.error('Failed to generate hashtags:', error);
      }

      addTranscript(transcript);
      setProgress(null);
      
      // Close panel on success
      onClose();
    } catch (err) {
      const appError = toAppError(err, 'TranscriptionPanel.handleTranscribe');
      setError(appError.userMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">AI Transcription</h2>
          {!isTranscribing && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded text-red-200">
            {error}
          </div>
        )}

        {!isTranscribing ? (
          <div className="space-y-6">
            {/* API Key Status */}
            {!getApiKey() && (
              <div className="p-3 bg-yellow-600/20 border border-yellow-600 rounded text-yellow-200">
                <p className="font-semibold mb-1">API Key Required</p>
                <p className="text-sm">
                  Please set <code className="bg-gray-700 px-1 rounded">VITE_OPENAI_API_KEY</code> in your <code className="bg-gray-700 px-1 rounded">.env</code> file.
                </p>
                <p className="text-xs mt-2 opacity-75">
                  Example: <code className="bg-gray-700 px-1 rounded">VITE_OPENAI_API_KEY=sk-...</code>
                </p>
              </div>
            )}

            {/* Clip Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Clip
              </label>
              <select
                value={selectedClipId || ''}
                onChange={(e) => setSelectedClipId(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Select a clip --</option>
                {allClips.map((clip) => {
                  const media = files.find((f) => f.id === clip.mediaFileId);
                  const hasTranscript = transcripts[clip.id];
                  return (
                    <option key={clip.id} value={clip.id}>
                      {media?.name || 'Unknown'} ({clip.duration.toFixed(1)}s)
                      {hasTranscript && ' ✓'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Language (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Language (Optional)
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="en, es, fr, etc. (leave blank for auto-detect)"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleTranscribe}
                disabled={!selectedClipId || !getApiKey()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Transcribe
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Progress View
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="inline-block w-16 h-16 rounded-full bg-blue-600 animate-pulse mb-4" />
              <p className="text-lg font-semibold text-white mb-2">
                {progress?.message || 'Processing...'}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">
                {Math.round(progress?.percent || 0)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

