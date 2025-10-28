import "./App.css";
import { useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { MediaLibrary } from "./components/MediaLibrary/MediaLibrary";
import { Timeline } from "./components/Timeline/Timeline";
import { PreviewPlayer } from "./components/Preview/PreviewPlayer";
import { LayerPanel } from "./components/Timeline/LayerPanel";
import { ExportDialog } from "./components/ExportDialog/ExportDialog";
import { Toast } from "./components/Toast/Toast";

function App() {
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <ErrorBoundary>
      <div className="app-container h-screen flex flex-col bg-gray-800">
      {/* Top Row - Media Library and Preview Panel */}
      <div className="flex-1 flex flex-row overflow-hidden" style={{ minHeight: 0 }}>
        {/* Media Library - Left */}
        <div id="media-library-panel" className="w-80 flex-shrink-0 border-r border-gray-700">
          <MediaLibrary />
        </div>
        
        {/* Preview Panel - Right */}
        <div id="preview-panel" className="flex-1 flex flex-col relative">
          {/* Preview Player */}
          <div className="flex-1 bg-black overflow-hidden">
            <PreviewPlayer />
          </div>
        </div>
      </div>
      
      {/* Bottom Row - Layer Panel and Timeline Panel */}
      <div className="h-64 flex flex-row border-t border-gray-700">
        {/* Layer Panel - Left */}
        <div id="layer-panel" className="w-80 flex-shrink-0 border-r border-gray-700">
          <LayerPanel />
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
      
      {/* Toast Notifications */}
      <Toast />
      </div>
    </ErrorBoundary>
  );
}

export default App;
