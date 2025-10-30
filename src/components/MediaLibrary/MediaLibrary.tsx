// Media Library Component
//
// Displays imported video files with thumbnails and metadata.
// Allows selection and removal of media files.

import React from 'react';
import { useMediaStore } from '../../store/mediaStore';
import { useTimelineStore } from '../../store/timelineStore';
import { useAppStore } from '../../store/appStore';
import { videoService } from '../../services/videoService';
import { MediaFile } from '../../types/media';
import { v4 as uuidv4 } from 'uuid';
import { toAppError } from '../../utils/errors';

interface MediaLibraryProps {
  onRecordClick?: () => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onRecordClick }) => {
  const { files, selectedFileId, addMediaFile, removeMediaFile, selectMediaFile } = useMediaStore();
  const { tracks, addClip, removeClip } = useTimelineStore();
  const { setError } = useAppStore();
  const [isImporting, setIsImporting] = React.useState(false);
  
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const importedFiles = await videoService.importVideos();
      
      // Add files to media library and create timeline clips
      importedFiles.forEach(file => {
        addMediaFile(file);
        
        // Automatically add clip to timeline (to the first track at the end)
        if (tracks.length > 0) {
          const firstTrack = tracks[0];
          const lastClip = firstTrack.clips[firstTrack.clips.length - 1];
          const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0;
          
          addClip({
            id: uuidv4(),
            mediaFileId: file.id,
            trackId: firstTrack.id,
            startTime: startTime,
            duration: file.duration,
            trimStart: 0,
            trimEnd: 0,
            layer: 0
          });
        }
      });
    } catch (error) {
      console.error('Import failed:', error);
      const appError = toAppError(error, 'MediaLibrary.handleImport');
      setError({
        message: appError.message,
        userMessage: appError.userMessage,
        code: appError.code,
        debug: appError.context?.debug || appError.message,
        context: appError.context,
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleInsert = (file: MediaFile, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Insert clip to the first track at the end
    if (tracks.length > 0) {
      const firstTrack = tracks[0];
      const lastClip = firstTrack.clips[firstTrack.clips.length - 1];
      const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0;
      
      addClip({
        id: uuidv4(),
        mediaFileId: file.id,
        trackId: firstTrack.id,
        startTime: startTime,
        duration: file.duration,
        trimStart: 0,
        trimEnd: 0,
        layer: 0
      });
    }
  };
  
  const handleRemove = async (id: string, e: React.MouseEvent) => {
    console.log('handleRemove called', id);
    e.stopPropagation();
    e.preventDefault();
    
    // Use async confirm with Tauri's message API
    const { confirm: tauriConfirm } = await import('@tauri-apps/plugin-dialog');
    const shouldRemove = await tauriConfirm('Remove this media file?', {
      title: 'Confirm Removal',
      kind: 'warning'
    });
    
    console.log('User confirmed:', shouldRemove);
    
    if (shouldRemove) {
      console.log('Removing media file:', id);
      
      // Find and remove all clips using this media file
      tracks.forEach(track => {
        track.clips.forEach(clip => {
          if (clip.mediaFileId === id) {
            removeClip(clip.id);
          }
        });
      });
      
      removeMediaFile(id);
    } else {
      console.log('User cancelled removal');
    }
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatResolution = (width: number, height: number): string => {
    return `${width}x${height}`;
  };
  
  return (
    <div data-name="media-library-container" className="media-library h-full flex flex-col bg-gray-900 text-white">
      <div data-name="media-library-header" className="p-4 border-b border-gray-700">
        <h2 data-name="media-library-title" className="text-lg font-bold text-red-500 mb-4">MEDIA LIBRARY</h2>
        <div className="flex gap-2">
          <button
            data-name="media-library-import-button"
            onClick={handleImport}
            disabled={isImporting}
            className="flex-1 bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-2 rounded transition-colors font-medium"
          >
            {isImporting ? 'Importing...' : '+Add Clip'}
          </button>
          {onRecordClick && (
            <button
              onClick={onRecordClick}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors font-medium"
            >
              Record
            </button>
          )}
        </div>
      </div>
      
      <div data-name="media-library-content" className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 text-sm">
            <p>No media files</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <MediaCard
                key={file.id}
                file={file}
                isSelected={file.id === selectedFileId}
                onSelect={() => selectMediaFile(file.id)}
                onInsert={(e) => handleInsert(file, e)}
                onRemove={(e) => handleRemove(file.id, e)}
                formatDuration={formatDuration}
                formatResolution={formatResolution}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MediaCardProps {
  file: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onInsert: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  formatDuration: (seconds: number) => string;
  formatResolution: (width: number, height: number) => string;
}

const MediaCard: React.FC<MediaCardProps> = ({
  file,
  isSelected,
  onSelect,
  onInsert,
  onRemove
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't select if clicking any button
    const target = e.target as HTMLElement;
    const isButton = target.closest('button');
    if (isButton) {
      return;
    }
    onSelect();
  };
  
  return (
    <div
      data-name={`media-card-${file.id}`}
      onClick={handleCardClick}
      className={`
        media-card cursor-pointer overflow-hidden
        transition-all bg-black text-white
        ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-900'}
      `}
    >
      {/* Thumbnail */}
      {file.thumbnailUrl && (
        <img 
          src={file.thumbnailUrl} 
          alt={file.name}
          className="w-full h-32 object-cover bg-gray-800"
        />
      )}
      
      <div data-name="media-card-content" className="flex flex-col gap-1 px-3 py-2 relative">
        <div data-name="media-card-name" className="font-medium text-sm truncate" title={file.name}>
          {file.name}
        </div>
        <div className="flex gap-3 text-xs text-gray-400">
          <span>{Math.floor(file.duration / 60)}:{String(Math.floor(file.duration % 60)).padStart(2, '0')}</span>
          <span>{file.width}x{file.height}</span>
          <span>{file.fps.toFixed(0)} fps</span>
          {file.fileSize > 0 && (
            <span>{(file.fileSize / (1024 * 1024)).toFixed(1)}MB</span>
          )}
        </div>
        
        <div className="flex gap-2 mt-2">
          <button
            data-name={`media-card-insert-button-${file.id}`}
            onClick={onInsert}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors font-medium"
            title="Insert into timeline"
          >
            Insert
          </button>
        </div>
        
        <button
          data-name={`media-card-remove-button-${file.id}`}
          onClick={onRemove}
          className="absolute top-2 right-2 text-red-500 hover:text-red-600 transition-colors text-xl font-bold bg-black/50 rounded w-6 h-6 flex items-center justify-center"
          title="Delete clip"
        >
          ×
        </button>
      </div>
    </div>
  );
};

