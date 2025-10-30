/**
 * Transcription Service
 * 
 * Service layer that wraps Tauri commands for transcription operations.
 * Provides high-level API for transcribing clips and exporting transcripts.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save } from '@tauri-apps/plugin-dialog';
import { Transcript, TranscriptionProgress, TranscriptionConfig } from '../types/transcription';
import { handleError, toAppError, AppError, ErrorCode } from '../utils/errors';

export class TranscriptionService {
  private progressListener: (() => void) | null = null;

  /**
   * Transcribe a video clip
   */
  async transcribeClip(
    clipId: string,
    filePath: string,
    trimStart: number,
    duration: number,
    apiKey: string,
    config: TranscriptionConfig,
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<Transcript> {
    try {
      // Set up progress listener
      if (onProgress) {
        this.progressListener = await listen<TranscriptionProgress>(
          'transcription-progress',
          (event) => {
            if (event.payload.clipId === clipId) {
              onProgress(event.payload);
            }
          }
        );
      }

      console.log('[TranscriptionService] Invoking transcribe_clip command');
      const transcript = await invoke<Transcript>('transcribe_clip', {
        clipId,
        filePath,
        trimStart,
        duration,
        apiKey,
        config,
      });

      console.log('[TranscriptionService] Received transcript from backend:', transcript);

      // Clean up listener
      if (this.progressListener) {
        this.progressListener();
        this.progressListener = null;
      }

      return transcript;
    } catch (error) {
      // Clean up listener on error
      if (this.progressListener) {
        this.progressListener();
        this.progressListener = null;
      }

      handleError(error, 'TranscriptionService.transcribeClip');
      
      // Enhance error with transcription-specific context
      const appError = toAppError(error, 'TranscriptionService.transcribeClip');
      
      // Check for specific API errors
      if (appError.message.includes('API error 401')) {
        throw new AppError(
          appError.message,
          'Invalid OpenAI API key. Please check your API key and try again.',
          ErrorCode.PERMISSION_DENIED,
          true,
          appError.context
        );
      }
      
      if (appError.message.includes('API error 429')) {
        throw new AppError(
          appError.message,
          'API rate limit exceeded. Please wait a moment and try again.',
          'RATE_LIMIT_ERROR',
          true,
          appError.context
        );
      }
      
      throw appError;
    }
  }

  /**
   * Export transcript to file
   */
  async exportTranscript(
    transcript: Transcript,
    format: 'txt' | 'srt' | 'vtt' | 'json' = 'txt'
  ): Promise<void> {
    try {
      // Open save dialog
      const outputPath = await save({
        filters: [{
          name: 'Transcript',
          extensions: [format]
        }],
        defaultPath: `transcript-${transcript.clipId}.${format}`
      });

      if (!outputPath) {
        return; // User cancelled
      }

      await invoke('export_transcript', {
        transcript,
        outputPath,
        format,
      });
    } catch (error) {
      handleError(error, 'TranscriptionService.exportTranscript');
      throw toAppError(error, 'TranscriptionService.exportTranscript');
    }
  }

  /**
   * Search within transcript
   */
  searchTranscript(transcript: Transcript, query: string): Transcript['segments'] {
    const lowerQuery = query.toLowerCase();
    return transcript.segments.filter((segment) =>
      segment.text.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get segment at specific time
   */
  getSegmentAtTime(transcript: Transcript, time: number): Transcript['segments'][0] | null {
    return transcript.segments.find(
      (segment) => time >= segment.start && time < segment.end
    ) || null;
  }

  /**
   * Generate hashtags from transcript content using OpenAI
   */
  async generateHashtags(
    transcriptText: string,
    apiKey: string,
    maxHashtags: number = 10
  ): Promise<string[]> {
    try {
      const prompt = `Based on the following video transcript, generate up to ${maxHashtags} relevant hashtags that summarize the key topics, themes, and content. Return only the hashtags, one per line, formatted with # symbols (e.g., #example #hashtag). Do not include any other text or explanation.

Transcript:
${transcriptText}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // Parse hashtags from response
      // Handle both formats: lines with #hashtag or just hashtag text
      const hashtags = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => {
          // Remove # if present (we'll add it back when displaying)
          const cleaned = line.replace(/^#+\s*/, '').trim();
          return cleaned;
        })
        .filter((tag: string) => tag.length > 0)
        .slice(0, maxHashtags);

      return hashtags;
    } catch (error) {
      console.error('[TranscriptionService] Failed to generate hashtags:', error);
      // Return empty array on error - don't fail the whole transcription
      return [];
    }
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();

