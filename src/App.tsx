import "./App.css";
import { MediaLibrary } from "./components/MediaLibrary/MediaLibrary";
import { Timeline } from "./components/Timeline/Timeline";
import { PreviewPlayer } from "./components/Preview/PreviewPlayer";
import { LayerPanel } from "./components/Timeline/LayerPanel";

function App() {
  return (
    <div className="app-container h-screen flex flex-col bg-gray-800">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Media Library and Layer Panel */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          {/* Media Library - top half */}
          <div className="h-1/2 border-b border-gray-700">
            <MediaLibrary />
          </div>
          
          {/* Layer Panel - bottom half */}
          <div className="h-1/2">
            <LayerPanel />
          </div>
        </div>
        
        {/* Main Content Area - Preview and Timeline */}
        <div className="flex-1 flex flex-col relative">
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
          
          {/* Timeline Panel */}
          <div className="bg-gray-800 border-t border-gray-700">
            <div className="p-2 border-b border-gray-700">
              <h2 className="text-lg font-bold text-red-500 text-center">TIMELINE PANEL</h2>
            </div>
            <div className="h-56">
              <Timeline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
