
import React, { useState } from 'react';
import { MessageSquare, Image as ImageIcon, Volume2 } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import TextToSpeech from './components/TextToSpeech';
import { AppMode } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.CHAT);

  const renderContent = () => {
    switch (activeTab) {
      case AppMode.CHAT:
        return <ChatInterface />;
      case AppMode.IMAGE:
        return <ImageGenerator />;
      case AppMode.TTS:
        return <TextToSpeech />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col max-w-7xl">
        
        {/* Navigation */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center font-bold text-white">
              G
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Gemini 2.5 Flash Studio
            </h1>
          </div>
          
          <nav className="flex bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab(AppMode.CHAT)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === AppMode.CHAT
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquare size={16} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab(AppMode.IMAGE)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === AppMode.IMAGE
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ImageIcon size={16} />
              <span>Image Gen</span>
            </button>
            <button
              onClick={() => setActiveTab(AppMode.TTS)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === AppMode.TTS
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Volume2 size={16} />
              <span>Speech</span>
            </button>
          </nav>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>
        
      </div>
    </div>
  );
};

export default App;
