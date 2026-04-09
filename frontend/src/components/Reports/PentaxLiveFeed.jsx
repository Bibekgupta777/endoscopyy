import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RefreshCw, AlertCircle, Monitor, Camera, Video,
  Info, Maximize, X, Power, Usb
} from 'lucide-react';
import toast from 'react-hot-toast';

const PentaxLiveFeed = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [streamInfo, setStreamInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  const [isFeedActive, setIsFeedActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [autoDetected, setAutoDetected] = useState(false);
  const [detectedDeviceName, setDetectedDeviceName] = useState('');
  
  const [userSelectedDevice, setUserSelectedDevice] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // ✅ NEW: Prevent concurrent scans

  // ── Debug Logger ──
  const log = useCallback((msg, type = 'info') => {
    const entry = { time: new Date().toLocaleTimeString(), msg, type };
    setDebugLog(prev => [...prev.slice(-30), entry]);
    console.log(`[PentaxFeed] ${msg}`);
  }, []);

  // ── Fullscreen Handler ──
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        containerRef.current.requestFullscreen().catch(err => console.log(err));
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {}
  };

  // ✅ PROPER STOP STREAM WITH FULL CLEANUP
  const stopStream = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
        streamRef.current = null;
      }

      if (stream) {
        stream.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
        setStream(null);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load();
        videoRef.current.pause();
      }

      setVideoPlaying(false);
      setStreamInfo(null);
      log('Stream stopped and resources released', 'success');
    } catch (e) {
      console.error('Error stopping stream:', e);
    }
  }, [stream, log]);

  const ENDOSCOPE_KEYWORDS = [
    'capture', 'easycap', 'avermedia', 'elgato', 'magewell', 'blackmagic', 
    'usb video', 'usb2.0 video', 'analog', 'composite', 's-video', 'av to usb',
    'video grabber', 'frame grabber', 'geniatech', 'yuan', 'hauppauge', 'startech', 
    'j5create', 'pengo', 'digitnow', 'ucec', 'blueavs'
  ];

  const isEndoscopeDevice = useCallback((label) => {
    if (!label) return false;
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('obs') || 
        lowerLabel.includes('virtual camera') || 
        lowerLabel.includes('virtualcamera')) {
      return false;
    }
    
    const hasKeyword = ENDOSCOPE_KEYWORDS.some(kw => lowerLabel.includes(kw));
    const isBuiltIn = lowerLabel.includes('integrated') || 
                     lowerLabel.includes('built-in') || 
                     lowerLabel.includes('facetime') ||
                     lowerLabel.includes('webcam');
    return hasKeyword || !isBuiltIn;
  }, []);

  // ✅ MODIFIED: Add scanning flag to prevent concurrent scans
  const getDevices = useCallback(async () => {
    if (isScanning) {
      log('⏭️ Already scanning, skipping...', 'warning');
      return;
    }

    try {
      setIsScanning(true);
      setLoading(true);
      setErrorMsg('');
      setDebugLog([]);
      setAutoDetected(false);
      log('🔍 Scanning for video devices...');

      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(t => t.stop());
      } catch (permErr) {
        setErrorMsg('Camera permission denied. Allow Camera in browser settings.');
        setLoading(false);
        setIsScanning(false);
        return;
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');

      setDevices(videoInputs);

      if (videoInputs.length === 0) {
        setErrorMsg('No video devices found. Is the USB capture card plugged in?');
        setLoading(false);
        setIsScanning(false);
        return;
      }

      if (!userSelectedDevice) {
        let selectedDevice = videoInputs.find(d => ENDOSCOPE_KEYWORDS.some(kw => d.label.toLowerCase().includes(kw))) 
                          || videoInputs.find(d => isEndoscopeDevice(d.label)) 
                          || videoInputs[videoInputs.length - 1];

        setSelectedDeviceId(selectedDevice.deviceId);

        if (isEndoscopeDevice(selectedDevice.label)) {
          setAutoDetected(true);
          setDetectedDeviceName(selectedDevice.label);
          log(`🎯 Auto-Detected: "${selectedDevice.label}"`, 'success');
        } else {
          setDetectedDeviceName(selectedDevice.label);
        }
      } else {
        log(`👤 Keeping user's manual selection`, 'info');
      }

    } catch (err) {
      setErrorMsg('Failed to scan devices. Refresh page and try again.');
      log(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  }, [log, isEndoscopeDevice, userSelectedDevice, isScanning]);

  // ✅ START STREAM WITH PROPER CLEANUP
  const startStream = useCallback(async (deviceId) => {
    if (!deviceId) return;
    
    stopStream();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setVideoPlaying(false);
    setStreamInfo(null);
    setErrorMsg('');

    const attempts = [
      { name: 'PAL Standard (720×576)', constraints: { video: { deviceId: { exact: deviceId }, width: { exact: 720 }, height: { exact: 576 }, frameRate: { ideal: 25 } } } },
      { name: 'NTSC Standard (720×480)', constraints: { video: { deviceId: { exact: deviceId }, width: { exact: 720 }, height: { exact: 480 }, frameRate: { ideal: 30 } } } },
      { name: 'Ideal SD Resolution', constraints: { video: { deviceId: { exact: deviceId }, width: { ideal: 720 }, height: { ideal: 576 } } } },
      { name: 'VGA Resolution (640×480)', constraints: { video: { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } } } },
      { name: 'Device Only', constraints: { video: { deviceId: { exact: deviceId } } } },
      { name: 'Any Video', constraints: { video: true } }
    ];

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      log(`Attempt ${i + 1}/${attempts.length}: ${attempt.name}...`);

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(attempt.constraints);
        const track = newStream.getVideoTracks()[0];
        const settings = track.getSettings();
        
        log(`✅ Connected! ${settings.width}x${settings.height} @ ${Math.round(settings.frameRate || 0)}fps`, 'success');

        streamRef.current = newStream;
        setStream(newStream);
        setStreamInfo({
          resolution: `${settings.width}×${settings.height}`,
          fps: `${Math.round(settings.frameRate || 0)}fps`,
          device: track.label
        });

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.onloadeddata = () => log('Video data loaded', 'success');
          videoRef.current.onplaying = () => {
            setVideoPlaying(true);
            log('Video is playing', 'success');
          };
          await videoRef.current.play().catch(e => log(`Play error: ${e.message}`, 'error'));
          setTimeout(() => checkForBlackFrame(), 3000);
        }

        if (i === 0) toast.success('Camera connected!');
        return; 
        
      } catch (err) {
        log(`❌ ${attempt.name} failed: ${err.message}`, 'error');
      }
    }

    setErrorMsg('Could not connect. Check USB and power.');
    toast.error('Connection failed');
    setIsFeedActive(false);
  }, [stopStream, log]);

  const checkForBlackFrame = useCallback(() => {
    try {
      if (!videoRef.current) return;
      const video = videoRef.current;
      if (video.videoWidth === 0) return;

      const canvas = document.createElement('canvas');
      canvas.width = 64; 
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 64, 64);
      
      const imageData = ctx.getImageData(0, 0, 64, 64).data;
      let totalBrightness = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        totalBrightness += imageData[i] + imageData[i + 1] + imageData[i + 2];
      }
      
      const avgBrightness = totalBrightness / (64 * 64 * 3);
      
      if (avgBrightness < 5) {
        log('⚠️ BLACK FRAME - Check Pentax power', 'warning');
      }
    } catch (e) {}
  }, [log]);

  // ✅ FIXED: Remove dependency loop
  useEffect(() => {
    getDevices();
    
    const handleDeviceChange = () => {
      log('🔌 Device change detected');
      getDevices();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Empty array - only run on mount/unmount

  return (
    <div ref={containerRef} className={`bg-black flex flex-col w-full h-full transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'relative overflow-hidden'}`}>

      <div className={`px-2 py-1.5 bg-gray-800 flex justify-between items-center border-b border-gray-700 ${isFullscreen ? 'absolute bottom-0 left-0 right-0 z-50 bg-black/90' : ''}`}>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar flex-1">
          
          <button 
            onClick={() => {
              setUserSelectedDevice(false);
              getDevices();
            }} 
            className="p-1.5 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors" 
            title="Refresh Camera List"
          >
            <RefreshCw size={14} />
          </button>

          {autoDetected && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-600/20 border border-green-500/30 rounded text-green-400 text-[9px] font-bold">
              <Usb size={10} /> AUTO
            </div>
          )}

          <select 
            className="bg-gray-700 text-white text-[10px] sm:text-xs rounded px-2 py-1 outline-none w-[100px] sm:w-[140px] truncate" 
            value={selectedDeviceId} 
            onChange={(e) => {
              setSelectedDeviceId(e.target.value);
              setUserSelectedDevice(true);
              setAutoDetected(false);
              if (isFeedActive) startStream(e.target.value);
            }}
          >
            {devices.length === 0 && <option>No devices found</option>}
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0,5)}...`}
              </option>
            ))}
          </select>

          <button 
            onClick={() => {
              if (isFeedActive) { 
                stopStream(); 
                setIsFeedActive(false); 
              } else { 
                setIsFeedActive(true); 
                startStream(selectedDeviceId); 
              }
            }} 
            className={`px-3 py-1 rounded text-[9px] sm:text-[10px] font-bold text-white transition-all whitespace-nowrap shadow-sm ${isFeedActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isFeedActive ? 'STOP' : 'START'}
          </button>

          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className={`p-1.5 rounded-full transition-colors ${showDebug ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'}`}
          >
            <Info size={14}/>
          </button>
        </div>
        
        <div className="flex items-center gap-1.5 ml-2">
          <button onClick={toggleFullscreen} className="p-1.5 bg-gray-700 rounded text-gray-300 hover:text-white transition-colors">
            <Maximize size={14}/>
          </button>
          {onClose && (
            <button 
              onClick={() => { 
                stopStream(); 
                onClose(); 
              }} 
              className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={`relative flex items-center justify-center bg-black flex-1 min-h-[250px] ${isFullscreen ? 'h-screen w-screen' : 'w-full h-full'}`}>
        
        {loading && (
          <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white p-4 text-center">
            <RefreshCw className="animate-spin text-gray-400 mb-4" size={40} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Scanning USB Devices</h2>
          </div>
        )}

        {errorMsg && !loading && (
          <div className="absolute inset-0 z-[100] bg-red-900/90 flex flex-col items-center justify-center text-white p-4 text-center">
            <AlertCircle size={32} className="mb-4 animate-bounce" />
            <p className="text-sm opacity-80 max-w-xs">{errorMsg}</p>
            <button 
              onClick={() => {
                setUserSelectedDevice(false);
                getDevices();
              }} 
              className="mt-6 px-6 py-2 bg-white text-red-900 font-bold rounded-full hover:scale-105"
            >
              Retry
            </button>
          </div>
        )}

        {!isFeedActive && !loading && !errorMsg && (
          <div className="text-center flex flex-col gap-4 z-50">
            <button 
              onClick={() => { 
                setIsFeedActive(true); 
                startStream(selectedDeviceId); 
              }} 
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-gray-700 transition-colors">
                <Power size={24} className="text-green-500" />
              </div>
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-gray-300">Start Feed</span>
            </button>
            {detectedDeviceName && (
              <p className="text-gray-500 text-[10px]">
                {userSelectedDevice ? 'Selected' : 'Detected'}: {detectedDeviceName.substring(0, 30)}...
              </p>
            )}
          </div>
        )}

        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-contain ${(isFeedActive && !loading && !errorMsg) ? 'block' : 'hidden'}`} 
        />
        
        {isFeedActive && stream && !videoPlaying && !loading && !errorMsg && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[50]">
            <div className="text-yellow-400 text-center">
              <Monitor size={40} className="mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-bold uppercase tracking-widest">Waiting for signal</p>
              <p className="text-xs text-gray-400 mt-1">Ensure camera is on</p>
            </div>
          </div>
        )}

        {isFeedActive && videoPlaying && !loading && !errorMsg && (
          <div className="absolute top-0 left-0 right-0 p-3 z-50 flex justify-between items-start pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[9px] text-green-400 font-mono flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {streamInfo?.resolution} • {streamInfo?.fps}
            </div>
          </div>
        )}

        {isFeedActive && videoPlaying && !loading && !errorMsg && (
          <div className="absolute bottom-4 flex justify-center w-full pointer-events-none z-[60]">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const btn = e.currentTarget;
                btn.style.transform = 'scale(0.9)';
                setTimeout(() => btn.style.transform = 'scale(1)', 150);
                
                const container = containerRef.current;
                if(container) {
                  container.click(); 
                }
              }} 
              className="pointer-events-auto p-4 bg-white/90 text-black rounded-full shadow-[0_0_20px_rgba(0,0,0,0.4)] border-4 border-gray-300 hover:bg-white transition-transform duration-100" 
              title="Capture Image"
            >
              <Camera size={26}/>
            </button>
          </div>
        )}
      </div>

      {showDebug && (
        <div className="absolute bottom-20 left-2 right-2 sm:left-auto sm:right-4 sm:w-96 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col border border-white/10 rounded-lg shadow-2xl">
          <div className="flex justify-between items-center p-3 border-b border-white/10">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Info size={16} className="text-blue-400"/> Diagnostics
            </h3>
            <button 
              onClick={() => setShowDebug(false)} 
              className="p-1.5 hover:bg-white/20 rounded text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 max-h-48">
            <div className="font-mono text-[10px] space-y-1">
              {debugLog.map((entry, i) => (
                <div 
                  key={i} 
                  className={`flex gap-2 ${
                    entry.type === 'error' ? 'text-red-400' : 
                    entry.type === 'success' ? 'text-green-400' : 
                    entry.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}
                >
                  <span className="text-gray-600 flex-shrink-0">{entry.time}</span>
                  <span>{entry.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PentaxLiveFeed;