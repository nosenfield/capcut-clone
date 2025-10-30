import "./App.css";
import { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { MediaLibrary } from "./components/MediaLibrary/MediaLibrary";
import { Timeline } from "./components/Timeline/Timeline";
import { PreviewPlayer } from "./components/Preview/PreviewPlayer";
import { HashtagPanel } from "./components/Timeline/LayerPanel";
import { ExportDialog } from "./components/ExportDialog/ExportDialog";
import { RecordingPanel } from "./components/Recording/RecordingPanel";
import { TranscriptViewer } from "./components/Transcription/TranscriptViewer";
import { Toast } from "./components/Toast/Toast";
import { useTimelineStore } from "./store/timelineStore";
import { useTranscriptionStore } from "./store/transcriptionStore";

function App() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const selectedClipId = useTimelineStore((state) => state.selectedClipId);
  const getTranscript = useTranscriptionStore((state) => state.getTranscript);
  const selectedTranscript = selectedClipId ? getTranscript(selectedClipId) : null;

  return (
    <ErrorBoundary>
      <div className="app-container h-screen flex flex-col bg-gray-800">
      {/* Top Row - Media Library and Preview Panel */}
      <div className="flex-1 flex flex-row overflow-hidden" style={{ minHeight: 0 }}>
        {/* Media Library - Left */}
        <div id="media-library-panel" className="w-[340px] flex-shrink-0 border-r border-gray-700">
          <MediaLibrary 
            onRecordClick={() => setShowRecordingPanel(true)}
          />
        </div>
        
        {/* Preview Panel - Right */}
        <div id="preview-panel" className="flex-1 flex flex-col relative">
          {/* Preview Player */}
          <div className="flex-1 bg-black overflow-hidden">
            <PreviewPlayer />
          </div>
          {/* Transcript Viewer - Show below preview if transcript exists */}
          {selectedTranscript && selectedClipId && (
            <div className="h-64 border-t border-gray-700">
              <TranscriptViewer clipId={selectedClipId} />
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Row - Layer Panel and Timeline Panel */}
      <div className="h-64 flex flex-row border-t border-gray-700">
        {/* Hashtag Panel - Left */}
        <div id="hashtag-panel" className="w-[340px] flex-shrink-0 border-r border-gray-700">
          <HashtagPanel />
        </div>
        
        {/* Timeline Panel - Right */}
        <div id="timeline-panel" className="flex-1 bg-gray-800 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          <Timeline onExportClick={() => setShowExportDialog(true)} />
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />

      {/* Recording Panel */}
      {showRecordingPanel && (
        <RecordingPanel onClose={() => setShowRecordingPanel(false)} />
      )}
      
      {/* Toast Notifications */}
      <Toast />
      </div>
    </ErrorBoundary>
  );
}

export default App;
