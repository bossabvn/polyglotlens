import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Wifi, WifiOff, Download, Check, Settings, X, Cloud, CloudOff } from 'lucide-react';
import { CameraView } from './components/CameraView';
import { ChatMessage } from './components/ChatMessage';
import { LanguageSelector } from './components/LanguageSelector';
import { ScanResult, SupportedLanguage } from './types';
import { DEFAULT_LANGUAGE, APP_NAME, LANGUAGES } from './constants';
import { scanAndTranslate } from './services/geminiService';
import { offlineScanAndTranslate, isPackDownloaded, downloadPack, deletePack } from './services/offlineService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ScanResult[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // To trigger re-renders when packs change
  const [packsUpdateTrigger, setPacksUpdateTrigger] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[0]?.status]);

  const handleCapture = async (imageSrc: string) => {
    setIsCameraOpen(false);

    const newScanId = Date.now().toString();
    const mode = isOnline ? 'online' : 'offline';

    const newScan: ScanResult = {
      id: newScanId,
      timestamp: Date.now(),
      imageUrl: imageSrc,
      originalText: '',
      translatedText: '',
      targetLanguage: targetLanguage,
      status: 'scanning',
      mode: mode
    };

    setMessages((prev) => [...prev, newScan]);

    try {
      let result;
      if (isOnline) {
        result = await scanAndTranslate(imageSrc, targetLanguage);
      } else {
        result = await offlineScanAndTranslate(imageSrc, targetLanguage);
      }
      
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === newScanId 
            ? { 
                ...msg, 
                status: 'complete', 
                originalText: result.originalText, 
                translatedText: result.translatedText,
                detectedLanguage: result.detectedLanguage 
              } 
            : msg
        )
      );
    } catch (error: any) {
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === newScanId 
            ? { ...msg, status: 'error', errorMessage: error.message || "Unknown error occurred" } 
            : msg
        )
      );
    }
  };

  const clearHistory = () => {
    if (window.confirm("Clear all scan history?")) {
      setMessages([]);
    }
  };

  const handleDownload = async (lang: SupportedLanguage) => {
    await downloadPack(lang);
    setPacksUpdateTrigger(prev => prev + 1);
  };

  const handleDelete = (lang: SupportedLanguage) => {
    deletePack(lang);
    setPacksUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-background relative max-w-2xl mx-auto border-x border-gray-800 shadow-2xl">
      
      {/* Header */}
      <header className="flex-none p-4 border-b border-gray-800 bg-background/95 backdrop-blur z-20 sticky top-0">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {APP_NAME}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-surface"
                aria-label="Offline Packs Settings"
              >
                <Settings size={20} />
              </button>
              {messages.length > 0 && (
                <button 
                  onClick={clearHistory} 
                  className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-surface"
                  aria-label="Clear history"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
             <div className="flex-1">
               <LanguageSelector 
                 currentLanguage={targetLanguage} 
                 onLanguageChange={setTargetLanguage}
                 disabled={isCameraOpen}
               />
             </div>
             {/* Network Status Indicator */}
             <div className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border ${isOnline ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-amber-900/20 border-amber-800 text-amber-400'}`}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area (Chat List) */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4 opacity-70 mt-20">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-4 relative">
              <Camera size={48} className="text-primary/50" />
              <div className="absolute -bottom-2 -right-2 bg-background border border-gray-700 p-2 rounded-full">
                {isOnline ? <Cloud className="text-blue-400 w-4 h-4"/> : <CloudOff className="text-amber-400 w-4 h-4"/>}
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-300">
               {isOnline ? 'Ready to Scan' : 'Offline Mode Ready'}
            </h2>
            <p className="max-w-xs mx-auto text-sm">
              {isOnline 
                ? "Point your camera at signs, menus, or documents to instantly translate them." 
                : "Limited connectivity. Ensure language packs are downloaded for translation."}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-30 px-4 pointer-events-none">
        <button
          onClick={() => setIsCameraOpen(true)}
          className={`pointer-events-auto shadow-lg shadow-blue-500/20 text-white rounded-full px-8 py-4 flex items-center gap-3 font-semibold text-lg transition-transform active:scale-95 group ${isOnline ? 'bg-primary hover:bg-blue-600' : 'bg-amber-600 hover:bg-amber-700'}`}
        >
          <Camera className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span>{isOnline ? 'Scan Text' : 'Scan Offline'}</span>
        </button>
      </div>

      {/* Camera Overlay */}
      {isCameraOpen && (
        <CameraView 
          onCapture={handleCapture} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}

      {/* Offline Packs Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-background border border-gray-700 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                 <h3 className="font-semibold text-lg">Offline Language Packs</h3>
                 <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto p-4 space-y-3">
                 <div className="bg-surface/50 rounded-lg p-3 mb-4 border border-gray-700/30">
                   <p className="text-sm text-gray-300 mb-2">
                     Download languages to enable translation when internet is unavailable.
                   </p>
                   <p className="text-xs text-gray-500 italic flex items-center flex-wrap gap-1">
                     Tap <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-700 text-xs not-italic"><Download size={10} className="mr-1"/> Download</span> to install. 
                     Look for <span className="text-green-400 not-italic flex items-center"><Check size={10} className="mr-0.5"/> Ready</span> to confirm success.
                   </p>
                 </div>
                 {LANGUAGES.map(lang => {
                    const isDownloaded = isPackDownloaded(lang);
                    const isDownloading = false; // Simplified for this demo
                    
                    return (
                      <div key={lang} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-gray-700/50">
                        <span className="font-medium">{lang}</span>
                        {isDownloaded ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-400 flex items-center gap-1 font-medium"><Check size={12}/> Ready</span>
                            <button 
                              onClick={() => handleDelete(lang)}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors"
                              title="Delete pack"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDownload(lang)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
                          >
                             <Download size={14} /> Download
                          </button>
                        )}
                      </div>
                    );
                 })}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;