import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraCapabilities } from '../types';
import { X, ZoomIn, ZoomOut, Zap, ZapOff, RotateCw } from 'lucide-react';
import { VIDEO_CONSTRAINTS } from '../constants';

interface CameraViewProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  
  const [zoom, setZoom] = useState<number>(1);
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({
    zoom: { min: 1, max: 1, step: 0.1, supported: false },
    torch: false,
  });
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera Switching State
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  // Pinch Zoom Refs
  const initialPinchDistance = useRef<number | null>(null);
  const startZoomRef = useRef<number>(1);

  const startCamera = useCallback(async (deviceId?: string) => {
    // Stop existing tracks to release camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      const constraints = { ...VIDEO_CONSTRAINTS };
      
      // If a specific device is requested, use it and remove facingMode preference
      if (deviceId) {
        // @ts-ignore
        delete constraints.facingMode;
        // @ts-ignore - TS might complain about exact in some configs but it's valid
        constraints.deviceId = { exact: deviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: constraints
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // Update capabilities
      const caps = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number, max: number, step: number }, torch?: boolean };
      
      const zoomCap = caps.zoom || { min: 1, max: 1, step: 0.1 }; // Default fallback

      setCapabilities({
        zoom: {
          min: zoomCap.min,
          max: zoomCap.max,
          step: zoomCap.step,
          supported: 'zoom' in caps
        },
        torch: !!caps.torch
      });
      
      if ('zoom' in caps) {
        setZoom(zoomCap.min);
      }

      // Sync current device ID from the active track
      const settings = track.getSettings();
      if (settings.deviceId) {
        setCurrentDeviceId(settings.deviceId);
      }

      // Refresh device list (now that we have permissions)
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);

    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, []);

  // Initial mount
  useEffect(() => {
    startCamera();
    
    // Listen for device changes (plugging in webcam etc)
    const handleDeviceChange = async () => {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  const switchCamera = () => {
    if (devices.length < 2) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
    // Cycle to next camera
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    startCamera(nextDevice.deviceId);
  };

  const applyZoom = async (newZoom: number) => {
    if (trackRef.current && capabilities.zoom.supported) {
      try {
        await trackRef.current.applyConstraints({
          advanced: [{ zoom: newZoom } as any]
        });
      } catch (err) {
        // Debounce or ignore frequent updates error
      }
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    applyZoom(newZoom);
  };

  const toggleTorch = async () => {
    if (trackRef.current && capabilities.torch) {
      try {
        await trackRef.current.applyConstraints({
          advanced: [{ torch: !isTorchOn } as any]
        });
        setIsTorchOn(!isTorchOn);
      } catch (err) {
        console.error("Torch failed", err);
      }
    }
  };

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw current frame - flip horizontally if it's likely a front cam for mirror effect?
        // Usually we capture exactly what the feed sees.
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(imageSrc);
      }
    }
  };

  // Pinch Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.pageX - touch2.pageX, touch1.pageY - touch2.pageY);
      initialPinchDistance.current = distance;
      startZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialPinchDistance.current !== null && capabilities.zoom.supported) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(touch1.pageX - touch2.pageX, touch1.pageY - touch2.pageY);
      
      // Calculate scale
      const scale = currentDistance / initialPinchDistance.current;
      let newZoom = startZoomRef.current * scale;
      
      // Clamp
      newZoom = Math.max(capabilities.zoom.min, Math.min(newZoom, capabilities.zoom.max));
      
      setZoom(newZoom);
      applyZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistance.current = null;
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={onClose} className="px-6 py-2 bg-surface rounded-full text-white">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button 
          onClick={onClose} 
          className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50"
        >
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-4">
          {devices.length > 1 && (
            <button 
              onClick={switchCamera}
              className="p-2 rounded-full backdrop-blur-md bg-black/30 text-white hover:bg-black/50 transition-colors"
              title="Switch Camera"
            >
              <RotateCw size={24} />
            </button>
          )}

          {capabilities.torch && (
            <button 
              onClick={toggleTorch}
              className={`p-2 rounded-full backdrop-blur-md transition-colors ${isTorchOn ? 'bg-yellow-500 text-black' : 'bg-black/30 text-white'}`}
            >
              {isTorchOn ? <Zap size={24} /> : <ZapOff size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Viewfinder */}
      <div 
        className="flex-1 relative bg-black flex items-center justify-center overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute min-w-full min-h-full object-cover"
        />
        
        {/* Reticle / Focus Area Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary -mt-0.5 -ml-0.5"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary -mt-0.5 -mr-0.5"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary -mb-0.5 -ml-0.5"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary -mb-0.5 -mr-0.5"></div>
           </div>
           {capabilities.zoom.supported && (
            <p className="absolute mt-72 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm transition-opacity duration-300">
              {zoom.toFixed(1)}x
            </p>
           )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-10 pt-6 px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-6">
        
        {/* Zoom Control */}
        {capabilities.zoom.supported && (
          <div className="w-full max-w-xs flex items-center gap-3">
            <ZoomOut size={16} className="text-white/70" />
            <input 
              type="range" 
              min={capabilities.zoom.min} 
              max={capabilities.zoom.max} 
              step={capabilities.zoom.step}
              value={zoom}
              onChange={handleZoomChange}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            <ZoomIn size={16} className="text-white/70" />
          </div>
        )}

        {/* Capture Button */}
        <button 
          onClick={capture}
          className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/40 transition-all active:scale-95 shadow-lg shadow-black/30"
          aria-label="Capture"
        >
          <div className="h-16 w-16 rounded-full bg-white"></div>
        </button>
      </div>
    </div>
  );
};