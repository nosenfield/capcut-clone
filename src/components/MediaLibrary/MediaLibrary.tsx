// Media Library Component
//
// Displays imported video files with thumbnails and metadata.
// Allows selection and removal of media files.

import React from 'react';
import { useMediaStore } from '../../store/mediaStore';
import { videoService } from '../../services/videoService';
import { MediaFile } from '../../types/media';

export const MediaLibrary: React.FC = () => {
  const { files, selectedFileId, addMediaFile, removeMediaFile, selectMediaFile } = useMediaStore();
  const [isImporting, setIsImporting] = React.useState(false);
  
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const importedFiles = await videoService.importVideos();
      importedFiles.forEach(file => addMediaFile(file));
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import videos');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const shouldRemove = window.confirm('Remove this media file?');
    if (shouldRemove) {
      removeMediaFile(id);
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
    <div className="media-library h-full flex flex-col bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded transition-colors"
        >
          {isImporting ? 'Importing...' : 'Import Videos'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">No media files imported</p>
            <p className="text-sm">Click "Import Videos" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
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
  onRemove,
  formatDuration,
  formatResolution
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        media-card cursor-pointer rounded-lg overflow-hidden
        border-2 transition-all
        ${isSelected ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-850 hover:border-gray-600'}
      `}
    >
      <div className="aspect-video bg-gray-950 relative">
        <img
          src={file.thumbnailUrl}
          alt={file.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
          aria-label="Remove media file"
        >
          Remove
        </button>
      </div>
      
      <div className="p-3">
        <p className="font-medium text-sm truncate" title={file.name}>{file.name}</p>
        <div className="flex gap-3 mt-2 text-xs text-gray-400">
          <span>{formatDuration(file.duration)}</span>
          <span>{formatResolution(file.width, file.height)}</span>
          <span>{file.fps.toFixed(0)} fps</span>
        </div>
      </div>
    </div>
  );
};

