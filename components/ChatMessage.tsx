import React, { useState } from 'react';
import { ScanResult } from '../types';
import { Loader2, AlertCircle, Maximize2, Wifi, WifiOff } from 'lucide-react';

interface ChatMessageProps {
  message: ScanResult;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Format timestamp
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full py-2">
      {/* 1. User Input (The Image) - Right Aligned */}
      <div className="flex justify-end mb-2">
        <div className="flex flex-col items-end max-w-[85%]">
          <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-gray-700 shadow-md transition-transform hover:scale-[1.01]" onClick={() => setIsImageModalOpen(true)}>
             <img 
              src={message.imageUrl} 
              alt="Scanned content" 
              className="w-48 h-auto object-cover opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 w-6 h-6 drop-shadow-md" />
            </div>
            {/* Mode Badge */}
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              {message.mode === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
              <span className="uppercase">{message.mode}</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-500 mt-1 pr-1">{time}</span>
        </div>
      </div>

      {/* 2. System Response (The Translation) - Left Aligned */}
      <div className="flex justify-start">
        <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${message.status === 'error' ? 'bg-red-900/20 border border-red-800' : 'bg-surface border border-gray-700'}`}>
          
          {message.status === 'scanning' && (
            <div className="flex items-center gap-3 text-primary">
              <Loader2 className="animate-spin h-5 w-5" />
              <span className="text-sm font-medium animate-pulse">Reading and translating...</span>
            </div>
          )}

          {message.status === 'error' && (
            <div className="flex items-start gap-3 text-red-400">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Error</span>
                <span className="text-sm opacity-90">{message.errorMessage || "Could not process image."}</span>
              </div>
            </div>
          )}

          {message.status === 'complete' && (
            <div className="flex flex-col gap-3">
               {/* Translated Text (Primary) */}
               <div className="prose prose-invert prose-sm">
                  <p className="text-base text-white leading-relaxed whitespace-pre-wrap">{message.translatedText}</p>
               </div>
               
               {/* Divider */}
               <div className="h-px bg-gray-700 w-full my-1"></div>
               
               {/* Metadata */}
               <div className="flex justify-between items-end text-xs text-gray-400">
                 <div className="flex flex-col gap-1">
                   <span><span className="font-semibold text-gray-500">From:</span> {message.detectedLanguage || 'Auto'}</span>
                   <span><span className="font-semibold text-gray-500">To:</span> {message.targetLanguage}</span>
                 </div>
                 {/* Original Text Disclosure */}
                 <details className="group text-right">
                    <summary className="cursor-pointer text-primary hover:text-blue-300 list-none select-none">
                      Show Original
                    </summary>
                    <div className="mt-2 p-2 bg-black/20 rounded text-left text-gray-300 italic border border-gray-700/50 whitespace-pre-wrap max-w-xs md:max-w-md">
                      {message.originalText}
                    </div>
                 </details>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsImageModalOpen(false)}
        >
          <img 
            src={message.imageUrl} 
            alt="Full scan" 
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
          <button className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full">
            <XIcon />
          </button>
        </div>
      )}
    </div>
  );
};

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);