
import React, { useEffect, useState, useRef } from 'react';
import { 
  Camera, Video, Square, Power, Maximize, Mic, MicOff, 
  Clock, User, Upload, Image as ImageIcon, X, Trash2, RefreshCw 
} from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import toast from 'react-hot-toast';

const EndoCamera = ({ onCapture, onVideoReady, patientInfo }) => {
  const { 
    videoRef, devices, activeDeviceId, isRecording, 
    initDevices, startStream, stopStream, 
    startRecording, stopRecording, stream 
  } = useCamera();

  const [isFeedActive, setIsFeedActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [procTimer, setProcTimer] = useState(0);
  const [recTimer, setRecTimer] = useState(0);
  const [flash, setFlash] = useState(false);
  
  // Preview State
  const [capturedImages, setCapturedImages] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize and list devices on mount
  useEffect(() => {
    initDevices();
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      stopStream();
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Voice Recognition
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

  // Timers
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     🚀 4K CAPTURE LOGIC (ImageCapture API)
     ═══════════════════════════════════════════════════════════════════════ */
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

      // 1. Try native high-res capture
      if ('ImageCapture' in window) {
        try {
          const imageCapture = new ImageCapture(track);
          const blob = await imageCapture.takePhoto();
          imageBitmap = await createImageBitmap(blob);
        } catch (e) {
          console.warn("Native capture failed, using video frame");
        }
      }

      // 2. Draw to Canvas
      if (imageBitmap) {
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        ctx.drawImage(imageBitmap, 0, 0);
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
      }

      // 3. Watermark
      const fontSize = Math.max(24, Math.floor(canvas.width * 0.025)); 
      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      ctx.fillStyle = "yellow";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 4;
      
      const ts = new Date().toLocaleString();
      ctx.fillText(`PATIENT: ${patientInfo?.name || 'N/A'}`, fontSize, canvas.height - (fontSize * 2.5));
      ctx.fillText(`ID: ${patientInfo?.patientId || 'N/A'} | ${ts}`, fontSize, canvas.height - fontSize);

      // 4. Save
      canvas.toBlob((blob) => {
        const file = new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(file);
        
        setCapturedImages(prev => [...prev, { file, previewUrl, type: 'Live Capture', w: canvas.width, h: canvas.height }]);
        onCapture(file, 'Live Capture');
        
        toast.success("Snapshot Saved");
      }, 'image/jpeg', 0.95);

    } catch (err) {
      toast.error("Capture Failed");
    }
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      startRecording();
      toast.success("Recording Started");
    } else {
      stopRecording(onVideoReady);
      toast.success("Video Clip Saved");
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      files.forEach(file => {
        const previewUrl = URL.createObjectURL(file);
        setCapturedImages(prev => [...prev, { file, previewUrl, type: 'Local Upload' }]);
        onCapture(file, 'Local Upload');
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

  const removeImage = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div ref={containerRef} className={`bg-black transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-xl border-4 border-gray-800 relative overflow-hidden shadow-2xl'}`}>
      {flash && <div className="absolute inset-0 bg-white z-[60] opacity-70 animate-out fade-out duration-200" />}
      
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />

      {/* Overlays */}
      {isFeedActive && (
        <div className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-start pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md p-4 rounded-lg border border-white/20 text-white">
            <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><User size={14}/> Live Patient Info</div>
            <div className="text-xl font-mono leading-none">{patientInfo?.name || '---'}</div>
            <div className="text-xs font-mono opacity-70 mt-1">MRN: {patientInfo?.patientId || '---'}</div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 text-white font-mono flex items-center gap-2">
              <Clock size={16} className="text-green-400"/> {formatTime(procTimer)}
            </div>
            {isRecording && (
              <div className="bg-red-600/80 px-4 py-2 rounded-lg text-white font-mono flex items-center gap-2 animate-pulse">
                <Circle fill="white" size={12}/> REC {formatTime(recTimer)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={`p-3 bg-gray-800 flex justify-between items-center ${isFullscreen ? 'absolute bottom-0 left-0 right-0 z-50 bg-black/80' : ''}`}>
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          
          {/* Refresh Devices */}
          <button onClick={initDevices} className="p-2 bg-gray-700 rounded-md text-white hover:bg-gray-600" title="Refresh Camera List">
            <RefreshCw size={16} />
          </button>

          {/* Camera Select */}
          <select className="bg-gray-700 text-white text-xs rounded-md px-2 py-1.5 outline-none max-w-[200px]" value={activeDeviceId} onChange={(e) => startStream(e.target.value)}>
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0,5)}...`}
              </option>
            ))}
          </select>
          
          <button onClick={() => {if(isFeedActive) { stopStream(); setIsFeedActive(false); } else { setIsFeedActive(true); startStream(activeDeviceId); }}} className={`px-4 py-1 rounded-md text-[10px] font-bold text-white transition-all whitespace-nowrap ${isFeedActive ? 'bg-red-600' : 'bg-green-600'}`}>
            {isFeedActive ? 'POWER OFF' : 'START SCOPE'}
          </button>

          <button onClick={() => setIsListening(!isListening)} className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-600 text-gray-400'}`} title="Voice Control">
            {isListening ? <Mic size={16}/> : <MicOff size={16}/>}
          </button>

          <button onClick={triggerFileUpload} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500" title="Upload Local Images">
            <Upload size={16} />
          </button>
        </div>
        <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white ml-2"><Maximize size={20}/></button>
      </div>

      {/* Main Area */}
      <div className={`relative flex items-center justify-center ${isFullscreen ? 'h-screen w-screen' : 'aspect-video'}`}>
        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${isFeedActive ? 'block' : 'hidden'}`} />
        
        {/* Standby */}
        {!isFeedActive && (
          <div className="text-center flex flex-col gap-6">
             <div className="flex gap-6 justify-center">
                <button onClick={() => { setIsFeedActive(true); startStream(activeDeviceId); }} className="flex flex-col items-center gap-2 group">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-gray-700 transition-colors">
                      <Power size={40} className="text-green-500" />
                  </div>
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest group-hover:text-gray-300">Start Scope</span>
                </button>
                <button onClick={triggerFileUpload} className="flex flex-col items-center gap-2 group">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-gray-700 transition-colors">
                      <ImageIcon size={40} className="text-blue-500" />
                  </div>
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest group-hover:text-gray-300">Upload Files</span>
                </button>
             </div>
          </div>
        )}

        {/* Live Controls */}
        {isFeedActive && (
          <>
            <div className="absolute bottom-10 flex gap-10 z-40">
              <button onClick={handleCapturePhoto} className="p-6 bg-white text-black rounded-full hover:scale-110 active:scale-90 transition-all shadow-2xl border-4 border-gray-200" title="Take Snapshot"><Camera size={32}/></button>
              <button onClick={handleToggleRecording} className={`p-6 rounded-full hover:scale-110 active:scale-90 transition-all shadow-2xl border-4 ${isRecording ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-700 border-gray-600 text-white'}`} title="Record Video">
                  {isRecording ? <Square size={32} fill="white"/> : <Video size={32}/>}
              </button>
            </div>

            {/* Preview Thumbnail */}
            {capturedImages.length > 0 && (
              <div 
                className="absolute bottom-6 left-6 z-50 cursor-pointer group"
                onClick={() => setShowPreviewModal(true)}
              >
                <div className="relative w-16 h-16 rounded-lg border-2 border-white overflow-hidden shadow-lg hover:scale-105 transition-transform bg-black">
                  <img src={capturedImages[capturedImages.length - 1].previewUrl} alt="Latest" className="w-full h-full object-cover"/>
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md">{capturedImages.length}</div>
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow-md mt-1 block text-center">Gallery</span>
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