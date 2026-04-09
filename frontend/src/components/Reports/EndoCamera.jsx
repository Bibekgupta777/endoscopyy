import React, { useEffect, useState, useRef } from 'react';
import { 
  Camera, Video, Square, Power, Maximize, Mic, MicOff, 
  Clock, User, Upload, Image as ImageIcon, X, Trash2, RefreshCw 
} from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import toast from 'react-hot-toast';

const EndoCamera = ({ onCapture, onVideoReady, patientInfo }) => {
  const { 
    videoRef, devices, activeDeviceId, isRecording, isDisconnected, 
    initDevices, startStream, stopStream, 
    startRecording, stopRecording, stream 
  } = useCamera();

  const [isFeedActive, setIsFeedActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [procTimer, setProcTimer] = useState(0);
  const [recTimer, setRecTimer] = useState(0);
  const [flash, setFlash] = useState(false);
  
  const [capturedImages, setCapturedImages] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ CLEANUP ON UNMOUNT - FREE ALL BLOB URLS
  useEffect(() => {
    return () => {
      // Revoke all blob URLs
      capturedImages.forEach(img => {
        if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(img.previewUrl);
          } catch (e) {
            console.error('Error revoking URL:', e);
          }
        }
      });

      // Force garbage collection
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {}
      }
    };
  }, []); // Run only on unmount

  useEffect(() => {
    initDevices();
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      stopStream();
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [initDevices, stopStream]);

  useEffect(() => {
    let recognition;
    if (isListening && ('webkitSpeechRecognition' in window)) {
      recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const cmd = event.results[event.results.length - 1][0].transcript.toLowerCase();
        if (cmd.includes('capture') || cmd.includes('snap')) handleCapturePhoto();
        if (cmd.includes('record') || cmd.includes('video')) handleToggleRecording();
      };
      recognition.start();
    }
    return () => recognition?.stop();
  }, [isListening, isFeedActive, isRecording]);

  useEffect(() => {
    let interval;
    if (isFeedActive) {
      interval = setInterval(() => {
        setProcTimer(t => t + 1);
        if (isRecording) setRecTimer(t => t + 1);
      }, 1000);
    } else {
      setProcTimer(0);
      setRecTimer(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isFeedActive, isRecording]);

  useEffect(() => {
    if (isFeedActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isFeedActive, stream]);

  useEffect(() => {
    const handleBeforeClose = (e) => {
      if (isRecording) {
        toast.error("⚠️ VIDEO RECORDING ACTIVE! Please stop the video and save before exiting.", {
          duration: 6000,
          position: 'top-center',
          style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '14px' }
        });
        
        e.preventDefault();
        e.returnValue = 'Video recording in progress!';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeClose);
    return () => window.removeEventListener('beforeunload', handleBeforeClose);
  }, [isRecording]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !stream) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const track = stream.getVideoTracks()[0];

    try {
      let imageBitmap;

      if ('ImageCapture' in window) {
        try {
          const imageCapture = new ImageCapture(track);
          const blob = await imageCapture.takePhoto();
          imageBitmap = await createImageBitmap(blob);
        } catch (e) {
          console.warn("Native capture failed, using video frame");
        }
      }

      if (imageBitmap) {
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        ctx.drawImage(imageBitmap, 0, 0);
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
      }

      const fontSize = Math.max(24, Math.floor(canvas.width * 0.025)); 
      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      ctx.fillStyle = "yellow";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 4;
      
      const ts = new Date().toLocaleString();
      ctx.fillText(`PATIENT: ${patientInfo?.name || 'N/A'}`, fontSize, canvas.height - (fontSize * 2.5));
      ctx.fillText(`ID: ${patientInfo?.patientId || 'N/A'} | ${ts}`, fontSize, canvas.height - fontSize);

      canvas.toBlob((blob) => {
        const file = new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(file);
        
        setCapturedImages(prev => [...prev, { file, previewUrl, type: 'Live Capture', w: canvas.width, h: canvas.height }]);
        if (onCapture) onCapture(file, 'Live Capture');
        
        toast.success("Snapshot Saved");
      }, 'image/jpeg', 0.95);

    } catch (err) {
      console.error('Capture error:', err);
      toast.error("Capture Failed");
    }
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      startRecording();
      toast.success("Recording Started");
    } else {
      toast.loading("Capturing Video... Sending to hard drive.", { duration: 2000 });
      stopRecording(onVideoReady); 
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      files.forEach(file => {
        const previewUrl = URL.createObjectURL(file);
        setCapturedImages(prev => [...prev, { file, previewUrl, type: 'Local Upload' }]);
        if (onCapture) onCapture(file, 'Local Upload');
      });
      toast.success(`${files.length} images uploaded`);
    }
    e.target.value = null;
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  // ✅ MODIFIED: Revoke blob URL when removing
  const removeImage = (index) => {
    const img = capturedImages[index];
    
    // Free memory
    if (img && img.previewUrl && img.previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(img.previewUrl);
      } catch (e) {
        console.error('Error revoking URL:', e);
      }
    }
    
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div ref={containerRef} className={`bg-black flex flex-col w-full h-full transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'relative overflow-hidden'}`}>
      {flash && <div className="absolute inset-0 bg-white z-[60] opacity-70 animate-out fade-out duration-200" />}
      
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />

      {/* Toolbar */}
      <div className={`px-2 py-1.5 bg-gray-800 flex justify-between items-center border-b border-gray-700 ${isFullscreen ? 'absolute bottom-0 left-0 right-0 z-50 bg-black/90' : ''}`}>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar flex-1">
          
          <button onClick={initDevices} className="p-1.5 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors" title="Refresh Camera List">
            <RefreshCw size={14} />
          </button>

          <select className="bg-gray-700 text-white text-[10px] sm:text-xs rounded px-2 py-1 outline-none w-[100px] sm:w-[140px] truncate" value={activeDeviceId} onChange={(e) => startStream(e.target.value)}>
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0,5)}...`}
              </option>
            ))}
          </select>
          
          <button onClick={() => {if(isFeedActive) { stopStream(); setIsFeedActive(false); } else { setIsFeedActive(true); startStream(activeDeviceId); }}} className={`px-3 py-1 rounded text-[9px] sm:text-[10px] font-bold text-white transition-all whitespace-nowrap shadow-sm ${isFeedActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {isFeedActive ? 'POWER OFF' : 'START SCOPE'}
          </button>

          <button onClick={() => setIsListening(!isListening)} className={`p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_8px_red]' : 'bg-gray-700 text-gray-300 hover:text-white'}`} title="Voice Control">
            {isListening ? <Mic size={14}/> : <MicOff size={14}/>}
          </button>

          <button onClick={triggerFileUpload} className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors" title="Upload Local Images">
            <Upload size={14} />
          </button>
        </div>
        <button onClick={toggleFullscreen} className="p-1.5 bg-gray-700 rounded text-gray-300 hover:text-white ml-2 transition-colors">
          <Maximize size={14}/>
        </button>
      </div>

      {/* Main Video Area */}
      <div className={`relative flex items-center justify-center bg-black flex-1 min-h-[250px] ${isFullscreen ? 'h-screen w-screen' : 'w-full h-full'}`}>
        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${isFeedActive ? 'block' : 'hidden'}`} />
        
        {isDisconnected && (
          <div className="absolute inset-0 z-[100] bg-red-900/90 flex flex-col items-center justify-center text-white backdrop-blur-sm p-4 text-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Power size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2 uppercase tracking-widest">Connection Lost</h2>
            <p className="text-sm opacity-80 max-w-xs">
              The USB camera was unplugged. If you were recording, your video was saved safely.
            </p>
            <button onClick={() => { initDevices(); setIsFeedActive(false); }} className="mt-6 px-6 py-2 bg-white text-red-900 font-bold rounded-full hover:scale-105 transition-transform shadow-xl">
              Reconnect & Refresh
            </button>
          </div>
        )}
        
        {!isFeedActive && !isDisconnected && (
          <div className="text-center flex flex-col gap-4">
             <div className="flex gap-4 justify-center">
                <button onClick={() => { setIsFeedActive(true); startStream(activeDeviceId); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-gray-700 transition-colors">
                      <Power size={24} className="text-green-500" />
                  </div>
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-gray-300">Start</span>
                </button>
                <button onClick={triggerFileUpload} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-gray-700 transition-colors">
                      <ImageIcon size={24} className="text-blue-500" />
                  </div>
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest group-hover:text-gray-300">Upload</span>
                </button>
             </div>
          </div>
        )}

        {isFeedActive && !isDisconnected && (
          <>
            <div className="absolute top-0 left-0 right-0 p-3 z-50 flex justify-between items-start pointer-events-none gap-2">
              <div className="bg-black/60 backdrop-blur-md p-2 rounded border border-white/20 text-white max-w-[50%] shadow-lg">
                <div className="text-[8px] text-blue-400 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1"><User size={10}/> Patient</div>
                <div className="text-xs sm:text-sm font-mono font-bold leading-none truncate">{patientInfo?.name || '---'}</div>
                <div className="text-[9px] font-mono opacity-70 mt-1 truncate">MRN: {patientInfo?.patientId || '---'}</div>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-white font-mono flex items-center gap-1.5 text-[10px] sm:text-xs shadow-lg">
                  <Clock size={12} className="text-green-400"/> {formatTime(procTimer)}
                </div>
                {isRecording && (
                  <div className="bg-red-600/90 px-2 py-1 rounded text-white font-mono flex items-center gap-1.5 text-[10px] sm:text-xs shadow-[0_0_10px_red] animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" /> REC {formatTime(recTimer)}
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-4 flex gap-4 sm:gap-6 z-40">
              <button onClick={handleCapturePhoto} className="p-3 sm:p-4 bg-white text-black rounded-full hover:scale-110 active:scale-90 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-gray-200" title="Take Snapshot">
                <Camera size={24}/>
              </button>
              <button onClick={handleToggleRecording} className={`p-3 sm:p-4 rounded-full hover:scale-110 active:scale-90 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 ${isRecording ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-800/80 backdrop-blur border-gray-500 text-white'}`} title="Record Video">
                  {isRecording ? <Square size={20} fill="white"/> : <Video size={24}/>}
              </button>
            </div>

            {capturedImages.length > 0 && (
              <div className="absolute bottom-4 left-4 z-50 cursor-pointer group" onClick={() => setShowPreviewModal(true)}>
                <div className="relative w-12 h-12 rounded border border-white overflow-hidden shadow-lg hover:scale-105 transition-transform bg-black">
                  <img src={capturedImages[capturedImages.length - 1].previewUrl} alt="Latest" className="w-full h-full object-cover"/>
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-bl">{capturedImages.length}</div>
                </div>
                <span className="text-white text-[9px] font-bold drop-shadow-md mt-0.5 block text-center">Gallery</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <ImageIcon size={20} className="text-blue-400"/> Session Gallery
            </h3>
            <button onClick={() => setShowPreviewModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {capturedImages.map((img, idx) => (
                <div key={idx} className="relative group aspect-square bg-gray-900 rounded-lg overflow-hidden border border-white/10">
                  <img src={img.previewUrl} alt={`Capture ${idx}`} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"><Trash2 size={20} /></button>
                  </div>
                  {img.w && (
                    <div className="absolute top-1 left-1 bg-green-600/80 text-white text-[9px] px-1.5 rounded font-mono">
                      {img.w}x{img.h}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndoCamera;