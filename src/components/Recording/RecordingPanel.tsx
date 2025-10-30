// Recording Panel Component
//
// UI for screen and webcam recording with settings and controls.

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useMediaStore } from '../../store/mediaStore';
import { recordingService, CameraInfo } from '../../services/recordingService';
import { videoService } from '../../services/videoService';
import { toAppError } from '../../utils/errors';

interface RecordingPanelProps {
  onClose: () => void;
}

export const RecordingPanel: React.FC<RecordingPanelProps> = ({ onClose }) => {
  const { 
    isRecording, 
    recordingElapsed,
    setIsRecording, 
    setRecordingElapsed,
    setError 
  } = useAppStore();
  const { addMediaFile } = useMediaStore();

  const [recordingType, setRecordingType] = useState<'screen' | 'webcam'>('screen');
  const [resolution, setResolution] = useState<'720p' | '1080p' | 'source'>('1080p');
  const [fps, setFps] = useState<number>(30);
  const [captureCursor, setCaptureCursor] = useState<boolean>(true);
  const [captureClicks, setCaptureClicks] = useState<boolean>(true);
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState<number>(0);
  const [isLoadingCameras, setIsLoadingCameras] = useState<boolean>(false);

  // Load cameras when webcam recording type is selected
  useEffect(() => {
    if (recordingType === 'webcam' && cameras.length === 0 && !isLoadingCameras) {
      setIsLoadingCameras(true);
      recordingService.listCameras()
        .then((loadedCameras) => {
          setCameras(loadedCameras);
          if (loadedCameras.length > 0) {
            setSelectedCameraIndex(loadedCameras[0].index);
          }
        })
        .catch((error) => {
          console.error('Failed to load cameras:', error);
          const appError = toAppError(error);
          setError(appError.userMessage);
          // Set an empty array to prevent infinite retry loops
          setCameras([]);
        })
        .finally(() => {
          setIsLoadingCameras(false);
        });
    }
  }, [recordingType]);

  // Timer effect
  useEffect(() => {
    if (!isRecording) {
      setRecordingElapsed(0);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const status = await recordingService.getRecordingStatus();
        setRecordingElapsed(status.elapsed);
        if (!status.isRecording && isRecording) {
          // Recording stopped externally
          setIsRecording(false);
        }
      } catch (error) {
        console.error('Failed to get recording status:', error);
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isRecording, setIsRecording, setRecordingElapsed]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      if (recordingType === 'screen') {
        await recordingService.startScreenRecording(
          resolution,
          fps,
          captureCursor,
          captureClicks,
          includeAudio ? '1' : null // Audio device index 1 is typically microphone
        );
      } else {
        await recordingService.startWebcamRecording(
          selectedCameraIndex,
          resolution,
          fps,
          includeAudio ? '1' : null
        );
      }
      
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      const appError = toAppError(error);
      setError(appError.userMessage);
    }
  };

  const handleStopRecording = async () => {
    try {
      const outputPath = await recordingService.stopRecording();
      setIsRecording(false);
      
      // Import the recorded file to media library
      if (outputPath) {
        try {
          const mediaFile = await videoService.createMediaFileFromPath(outputPath);
          addMediaFile(mediaFile);
          console.log('Recorded file added to library:', mediaFile.name);
        } catch (error) {
          console.error('Failed to import recorded file:', error);
          // Don't show error - recording was successful, just import failed
        }
      }
      
      // Close panel after a short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      const appError = toAppError(error);
      setError(appError.userMessage);
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recording</h2>
          {!isRecording && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {isRecording ? (
          // Recording in progress view
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="inline-block w-16 h-16 rounded-full bg-red-600 animate-pulse mb-4"></div>
              <p className="text-lg font-semibold text-white mb-2">Recording in progress</p>
              <p className="text-4xl font-mono text-white">{formatTime(recordingElapsed)}</p>
            </div>
            <button
              onClick={handleStopRecording}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Stop Recording
            </button>
          </div>
        ) : (
          // Recording settings view
          <div className="space-y-6">
            {/* Recording Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recording Source
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setRecordingType('screen')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    recordingType === 'screen'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Screen
                </button>
                <button
                  onClick={() => setRecordingType('webcam')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    recordingType === 'webcam'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Webcam
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              {/* Resolution */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as '720p' | '1080p' | 'source')}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="source">Source</option>
                </select>
              </div>

              {/* FPS */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frame Rate (fps)
                </label>
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="24">24</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                </select>
              </div>
            </div>

            {/* Screen-specific options */}
            {recordingType === 'screen' && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captureCursor}
                    onChange={(e) => setCaptureCursor(e.target.checked)}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Capture cursor</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captureClicks}
                    onChange={(e) => setCaptureClicks(e.target.checked)}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Capture mouse clicks</span>
                </label>
              </div>
            )}

            {/* Webcam-specific options */}
            {recordingType === 'webcam' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Camera
                </label>
                {isLoadingCameras ? (
                  <div className="w-full px-3 py-2 bg-gray-700 text-gray-400 rounded-lg border border-gray-600">
                    Loading cameras...
                  </div>
                ) : cameras.length === 0 ? (
                  <div className="w-full px-3 py-2 bg-gray-700 text-red-400 rounded-lg border border-red-600">
                    No cameras found. Please ensure camera permissions are granted.
                  </div>
                ) : (
                  <select
                    value={selectedCameraIndex}
                    onChange={(e) => setSelectedCameraIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.index} value={camera.index}>
                        {camera.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Audio */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">Include audio (microphone)</span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartRecording}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Start Recording
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

