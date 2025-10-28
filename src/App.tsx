import "./App.css";
import { MediaLibrary } from "./components/MediaLibrary/MediaLibrary";
import { Timeline } from "./components/Timeline/Timeline";
import { PreviewPlayer } from "./components/Preview/PreviewPlayer";
import { LayerPanel } from "./components/Timeline/LayerPanel";

function App() {
  return (
    <div className="app-container h-screen flex flex-col bg-gray-800">
      {/* Top Row - Media Library and Preview Panel */}
      <div className="flex-1 flex flex-row overflow-hidden" style={{ display: 'flex', minHeight: 0 }}>
        {/* Media Library - Left */}
        <div id="media-library-panel" className="border-r border-gray-700" style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}>
          <MediaLibrary />
        </div>
        
        {/* Preview Panel - Right */}
        <div id="preview-panel" className="flex-1 flex flex-col relative" style={{ minWidth: 0 }}>
          {/* Preview Panel Label */}
          <div className="absolute top-0 right-0 z-10 p-4">
            <h2 className="text-lg font-bold text-red-500 writing-mode-vertical transform rotate-0" style={{ writingMode: 'vertical-rl' }}>
              PREVIEW PANEL
            </h2>
          </div>
          
          {/* Preview Player */}
          <div className="flex-1 bg-black overflow-hidden">
            <PreviewPlayer />
          </div>
        </div>
      </div>
      
      {/* Bottom Row - Layer Panel and Timeline Panel */}
      <div className="h-64 flex flex-row border-t border-gray-700" style={{ display: 'flex' }}>
        {/* Layer Panel - Left */}
        <div id="layer-panel" className="border-r border-gray-700" style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}>
          <LayerPanel />
        </div>
        
        {/* Timeline Panel - Right */}
        <div id="timeline-panel" className="flex-1 bg-gray-800" style={{ minWidth: 0 }}>
          <div className="p-2 border-b border-gray-700">
            <h2 className="text-lg font-bold text-red-500 text-center">TIMELINE PANEL</h2>
          </div>
          <div className="h-56">
            <Timeline />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
