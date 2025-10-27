import "./App.css";
import { MediaLibrary } from "./components/MediaLibrary/MediaLibrary";

function App() {
  return (
    <div className="app-container h-screen flex flex-col bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-3">
        <h1 className="text-xl font-semibold text-white">CapCut Clone - Video Editor</h1>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Media Library Sidebar */}
        <div className="w-80 border-r border-gray-700">
          <MediaLibrary />
        </div>
        
        {/* Main Content Area - Timeline and Preview (placeholder) */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-900 flex items-center justify-center">
            <p className="text-gray-500">Preview Player (Coming Soon)</p>
          </div>
          <div className="h-48 bg-gray-950 border-t border-gray-700 flex items-center justify-center">
            <p className="text-gray-500">Timeline (Coming Soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
