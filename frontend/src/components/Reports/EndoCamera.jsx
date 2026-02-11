import React, { useEffect, useState, useRef } from 'react';
import { Camera, Video, Square, RefreshCw, Settings, Circle, Play, Power, Maximize, Minimize, Mic, MicOff, Clock, User } from 'lucide-react';
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
  
  const containerRef = useRef(null);

  useEffect(() => {
    initDevices();
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      stopStream();
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Voice Recognition Logic
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
    if (!isFeedActive) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Medical Watermark
    ctx.font = "bold 24px Courier New";
    ctx.fillStyle = "yellow";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    const ts = new Date().toLocaleString();
    ctx.fillText(`PATIENT: ${patientInfo?.name || 'N/A'}`, 20, canvas.height - 70);
    ctx.fillText(`ID: ${patientInfo?.patientId || 'N/A'} | ${ts}`, 20, canvas.height - 30);

    canvas.toBlob((blob) => {
      onCapture(new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      toast.success("Snapshot Saved");
    }, 'image/jpeg', 0.95);
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

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className={`bg-black transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-xl border-4 border-gray-800 relative overflow-hidden shadow-2xl'}`}>
      {flash && <div className="absolute inset-0 bg-white z-[60] opacity-70 animate-out fade-out duration-200" />}

      {/* Medical Overlays */}
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
        <div className="flex items-center gap-4">
          <select className="bg-gray-700 text-white text-xs rounded-md px-2 py-1 outline-none" value={activeDeviceId} onChange={(e) => startStream(e.target.value)}>
            {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera Source'}</option>)}
          </select>
          <button onClick={() => {if(isFeedActive) { stopStream(); setIsFeedActive(false); } else { setIsFeedActive(true); startStream(activeDeviceId); }}} className={`px-4 py-1 rounded-md text-[10px] font-bold text-white transition-all ${isFeedActive ? 'bg-red-600' : 'bg-green-600'}`}>
            {isFeedActive ? 'POWER OFF SCOPE' : 'INITIALIZE SCOPE'}
          </button>
          <button onClick={() => setIsListening(!isListening)} className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-600 text-gray-400'}`}>
            {isListening ? <Mic size={16}/> : <MicOff size={16}/>}
          </button>
        </div>
        <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white"><Maximize size={20}/></button>
      </div>

      {/* Video Area */}
      <div className={`relative flex items-center justify-center ${isFullscreen ? 'h-screen w-screen' : 'aspect-video'}`}>
        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${isFeedActive ? 'block' : 'hidden'}`} />
        {!isFeedActive && (
          <div className="text-center">
             <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                <RefreshCw size={40} className="text-gray-600" />
             </div>
             <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">Endoscopy Standby</p>
          </div>
        )}
        {isFeedActive && (
          <div className="absolute bottom-10 flex gap-10">
            <button onClick={handleCapturePhoto} className="p-6 bg-white text-black rounded-full hover:scale-110 active:scale-90 transition-all shadow-2xl border-4 border-gray-200"><Camera size={32}/></button>
            <button onClick={handleToggleRecording} className={`p-6 rounded-full hover:scale-110 active:scale-90 transition-all shadow-2xl border-4 ${isRecording ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-700 border-gray-600 text-white'}`}>
                {isRecording ? <Square size={32} fill="white"/> : <Video size={32}/>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndoCamera;