// Media Library Component
//
// Displays imported video files with thumbnails and metadata.
// Allows selection and removal of media files.

import React from 'react';
import { useMediaStore } from '../../store/mediaStore';
import { useTimelineStore } from '../../store/timelineStore';
import { videoService } from '../../services/videoService';
import { MediaFile } from '../../types/media';
import { v4 as uuidv4 } from 'uuid';

export const MediaLibrary: React.FC = () => {
  const { files, selectedFileId, addMediaFile, removeMediaFile, selectMediaFile } = useMediaStore();
  const { tracks, addClip, removeClip } = useTimelineStore();
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
      alert('Failed to import videos');
    } finally {
      setIsImporting(false);
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
        <button
          data-name="media-library-import-button"
          onClick={handleImport}
          disabled={isImporting}
          className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-2 rounded transition-colors font-medium"
        >
          {isImporting ? 'Importing...' : '+Add Clip'}
        </button>
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
  onRemove: (e: React.MouseEvent) => void;
  formatDuration: (seconds: number) => string;
  formatResolution: (width: number, height: number) => string;
}

const MediaCard: React.FC<MediaCardProps> = ({
  file,
  isSelected,
  onSelect,
  onRemove
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    console.log('handleCardClick called');
    console.log('Event target:', e.target);
    // Don't select if clicking the remove button
    const target = e.target as HTMLElement;
    const isButton = target.closest('button');
    console.log('Is button:', isButton);
    if (isButton) {
      console.log('Ignoring card selection - clicked button');
      return;
    }
    console.log('Selecting card');
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
      <div data-name="media-card-content" className="flex items-center gap-2 px-3 py-2">
        <div data-name="media-card-name" className="flex-1 font-medium text-sm truncate" title={file.name}>
          {file.name}
        </div>
        <div data-name="media-card-size" className="text-xs text-gray-400">
          {(file.fileSize / (1024 * 1024)).toFixed(1)}MB
        </div>
        <button
          data-name={`media-card-remove-button-${file.id}`}
          onClick={onRemove}
          className="text-red-500 hover:text-red-600 transition-colors text-lg font-bold"
          title="Delete clip"
        >
          ×
        </button>
      </div>
    </div>
  );
};

