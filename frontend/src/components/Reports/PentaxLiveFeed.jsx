import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RefreshCw, Camera, AlertCircle, Video, 
  Monitor, CheckCircle, XCircle, Usb, Info 
} from 'lucide-react';
import toast from 'react-hot-toast';

const PentaxLiveFeed = ({ onCapture }) => {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [streamInfo, setStreamInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // ── Debug Logger ──
  const log = useCallback((msg, type = 'info') => {
    const entry = { 
      time: new Date().toLocaleTimeString(), 
      msg, 
      type 
    };
    setDebugLog(prev => [...prev, entry]);
    console.log(`[PentaxFeed] ${msg}`);
  }, []);

  // ── 1. Get List of ALL Cameras ──
  const getDevices = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setDebugLog([]);
      log('Scanning for video devices...');

      // Request permission to get device labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
        tempStream.getTracks().forEach(t => t.stop());
        log('Camera permission granted', 'success');
      } catch (permErr) {
        log(`Permission error: ${permErr.message}`, 'error');
        setErrorMsg('Camera permission denied. Click the 🔒 icon in address bar → Allow Camera');
        setLoading(false);
        return;
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');

      log(`Found ${videoInputs.length} video device(s):`);
      videoInputs.forEach((d, i) => {
        log(`  [${i}] "${d.label || 'Unnamed Device'}"`, 
            d.label.toLowerCase().match(/usb|capture|av|video|cam/) 
              ? 'success' : 'info'
        );
      });

      setDevices(videoInputs);

      if (videoInputs.length === 0) {
        setErrorMsg('No video devices found. Is the USB capture card plugged in?');
        log('No devices found!', 'error');
        setLoading(false);
        return;
      }

      // ── Smart Auto-Selection ──
      // Priority: capture card keywords > OBS Virtual > last device
      const priorityKeywords = [
        'capture', 'easycap', 'avermedia', 'elgato', 
        'magewell', 'blackmagic', 'usb video', 'usb2.0 video',
        'analog', 'composite', 's-video', 'av to usb',
        'video grabber', 'frame grabber', 'geniatech',
        'yuan', 'hauppauge', 'startech', 'j5create',
        'pengo', 'digitnow', 'ucec', 'BlueAVS'
      ];

      const obsVirtual = videoInputs.find(d => 
        d.label.toLowerCase().includes('obs virtual') ||
        d.label.toLowerCase().includes('obs-camera')
      );

      const captureCard = videoInputs.find(d => {
        const label = d.label.toLowerCase();
        return priorityKeywords.some(kw => label.includes(kw));
      });

      // Also try: any device that is NOT the built-in laptop camera
      const externalDevice = videoInputs.find(d => {
        const label = d.label.toLowerCase();
        return !label.includes('integrated') && 
               !label.includes('built-in') && 
               !label.includes('facetime') &&
               !label.includes('ir camera') &&
               !label.includes('laptop');
      });

      let selectedDevice = null;

      if (captureCard) {
        selectedDevice = captureCard;
        log(`Auto-selected CAPTURE CARD: "${captureCard.label}"`, 'success');
      } else if (obsVirtual) {
        selectedDevice = obsVirtual;
        log(`Auto-selected OBS Virtual Camera: "${obsVirtual.label}"`, 'success');
      } else if (externalDevice) {
        selectedDevice = externalDevice;
        log(`Auto-selected external device: "${externalDevice.label}"`, 'success');
      } else {
        selectedDevice = videoInputs[videoInputs.length - 1];
        log(`Defaulting to last device: "${selectedDevice.label}"`, 'warning');
      }

      setSelectedDeviceId(selectedDevice.deviceId);

    } catch (err) {
      console.error(err);
      log(`Fatal error: ${err.message}`, 'error');
      setErrorMsg('Failed to scan devices. Refresh page and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── 2. Start Stream with Multiple Fallback Attempts ──
  const startStream = async (deviceId) => {
    if (!deviceId) return;
    
    // Stop existing stream
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    
    setVideoPlaying(false);
    setStreamInfo(null);
    setErrorMsg('');

    // ── ATTEMPT CHAIN ──
    // Different capture cards need different constraints.
    // We try from most specific → most generic.
    const attempts = [
      {
        name: 'PAL Standard (720×576)',
        constraints: {
          video: {
            deviceId: { exact: deviceId },
            width: { exact: 720 },
            height: { exact: 576 },
            frameRate: { ideal: 25 }
          }
        }
      },
      {
        name: 'NTSC Standard (720×480)',
        constraints: {
          video: {
            deviceId: { exact: deviceId },
            width: { exact: 720 },
            height: { exact: 480 },
            frameRate: { ideal: 30 }
          }
        }
      },
      {
        name: 'Ideal SD Resolution',
        constraints: {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 720 },
            height: { ideal: 576 }
          }
        }
      },
      {
        name: 'VGA Resolution (640×480)',
        constraints: {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        }
      },
      {
        name: 'Device Only (No Constraints)',
        constraints: {
          video: {
            deviceId: { exact: deviceId }
          }
        }
      },
      {
        name: 'Bare Minimum (Any Video)',
        constraints: {
          video: true
        }
      }
    ];

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      log(`Attempt ${i + 1}/${attempts.length}: ${attempt.name}...`);

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(
          attempt.constraints
        );
        
        // SUCCESS — Get stream info
        const track = newStream.getVideoTracks()[0];
        const settings = track.getSettings();
        
        log(`✅ Connected! ${settings.width}x${settings.height} @ ${Math.round(settings.frameRate || 0)}fps`, 'success');
        log(`Track label: "${track.label}"`, 'info');

        setStream(newStream);
        setStreamInfo({
          resolution: `${settings.width}×${settings.height}`,
          fps: `${Math.round(settings.frameRate || 0)}fps`,
          device: track.label,
          attempt: attempt.name
        });

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          
          // Wait for video to actually start playing
          videoRef.current.onloadeddata = () => {
            log('Video data loaded', 'success');
          };
          
          videoRef.current.onplaying = () => {
            setVideoPlaying(true);
            log('Video is playing', 'success');
          };
          
          // Detect black frames (no signal)
          setTimeout(() => {
            checkForBlackFrame();
          }, 2000);
        }

        if (i > 0) {
          toast(`Connected in "${attempt.name}" mode`, { icon: '⚠️' });
        } else {
          toast.success('Endoscope feed connected!');
        }
        
        return; // Exit on first success
        
      } catch (err) {
        log(`❌ ${attempt.name} failed: ${err.message}`, 'error');
      }
    }

    // ALL attempts failed
    log('All connection attempts failed!', 'error');
    setErrorMsg(
      'Could not connect to endoscope. Common fixes:\n' +
      '1. Reconnect USB capture card\n' +
      '2. Check if Pentax light source is ON\n' +
      '3. Try OBS Virtual Camera (see guide below)\n' +
      '4. Check Device Manager for driver issues'
    );
    toast.error('Connection failed — see troubleshooting guide');
  };

  // ── 3. Black Frame Detection ──
  const checkForBlackFrame = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    if (video.videoWidth === 0) {
      log('⚠️ Video has 0 width — no signal detected', 'warning');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64; // Small sample
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
      log('⚠️ BLACK FRAME detected — Feed connected but no video signal from Pentax', 'warning');
      log('Check: Is the Pentax light source powered ON?', 'warning');
      log('Check: Is the endoscope connected to the processor?', 'warning');
      toast('Feed connected but image is black — check Pentax power', { 
        icon: '⚠️', 
        duration: 6000 
      });
    } else {
      log(`Image brightness OK (avg: ${avgBrightness.toFixed(1)})`, 'success');
    }
  };

  // ── 4. Capture Image ──
  const captureImage = () => {
    if (!videoRef.current || !videoPlaying) {
      toast.error('No active video feed');
      return;
    }

    const video = videoRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (vw === 0 || vh === 0) {
      toast.error('Video not ready');
      return;
    }

    // Correct aspect ratio for analog video
    // PAL 720x576 (1.25:1) should display as 4:3 (1.33:1)
    // NTSC 720x480 (1.5:1) should display as 4:3
    const canvas = document.createElement('canvas');
    
    // Force 4:3 output for medical correctness
    const outputHeight = vh;
    const outputWidth = Math.round(vh * (4 / 3));
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, outputWidth, outputHeight);

    // Timestamp watermark
    const fontSize = Math.max(16, Math.floor(canvas.height * 0.035));
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    const timestamp = new Date().toLocaleString();
    const textY = canvas.height - fontSize;
    ctx.strokeText(timestamp, fontSize, textY);
    ctx.fillText(timestamp, fontSize, textY);

    canvas.toBlob(blob => {
      if (!blob) {
        toast.error('Capture failed');
        return;
      }
      const file = new File(
        [blob], 
        `endo-${Date.now()}.jpg`, 
        { type: 'image/jpeg' }
      );
      onCapture(file);
      toast.success(`Captured (${outputWidth}×${outputHeight})`);
    }, 'image/jpeg', 0.95);
  };

  // ── Lifecycle ──
  useEffect(() => {
    getDevices();

    // Listen for device changes (USB plug/unplug)
    const handleDeviceChange = () => {
      log('🔌 Device change detected! Rescanning...', 'warning');
      toast('USB device change detected', { icon: '🔌' });
      getDevices();
    };
    
    navigator.mediaDevices.addEventListener(
      'devicechange', handleDeviceChange
    );

    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange', handleDeviceChange
      );
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (selectedDeviceId) startStream(selectedDeviceId);
  }, [selectedDeviceId]);

  return (
    <div className="bg-black rounded-xl overflow-hidden border border-gray-700 
                    shadow-lg">
      
      {/* ── Video Display ── */}
      <div className="relative aspect-[4/3] bg-gray-900 flex items-center 
                      justify-center">
        
        {loading ? (
          <div className="text-gray-400 animate-pulse flex flex-col 
                          items-center gap-2">
            <RefreshCw className="animate-spin" size={32} />
            <span className="text-sm">Scanning USB devices...</span>
          </div>
        ) : errorMsg ? (
          <div className="text-red-400 text-center p-6 max-w-md">
            <AlertCircle size={40} className="mx-auto mb-3" />
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {errorMsg}
            </p>
            <button 
              onClick={getDevices} 
              className="mt-4 px-6 py-2 bg-gray-800 rounded-lg 
                         hover:bg-gray-700 transition-colors text-sm
                         flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            
            {/* Stream Info Overlay */}
            {streamInfo && videoPlaying && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm 
                              px-2 py-1 rounded text-[10px] text-green-400 
                              font-mono flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full 
                                animate-pulse" />
                {streamInfo.resolution} • {streamInfo.fps}
              </div>
            )}

            {/* No Signal Warning */}
            {stream && !videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center 
                              bg-black/80">
                <div className="text-yellow-400 text-center">
                  <Monitor size={40} className="mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-bold">Waiting for video signal...</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ensure Pentax light source is ON
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Controls Bar ── */}
      <div className="p-3 bg-gray-800 space-y-2">
        <div className="flex gap-2 justify-between items-center">
          
          {/* Device Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Usb size={16} className="text-gray-400 flex-shrink-0" />
            <select
              className="bg-gray-700 text-white text-xs p-2 rounded 
                         w-full border border-gray-600 outline-none 
                         truncate"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              {devices.length === 0 && (
                <option>No devices found</option>
              )}
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
            <button 
              onClick={getDevices} 
              className="text-gray-400 hover:text-white flex-shrink-0" 
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Capture Button */}
          <button
            onClick={captureImage}
            disabled={!videoPlaying}
            className="bg-blue-600 hover:bg-blue-700 
                       disabled:opacity-30 disabled:cursor-not-allowed 
                       text-white px-6 py-2 rounded flex items-center 
                       gap-2 font-bold text-sm transition-all shadow-md 
                       active:scale-95 flex-shrink-0"
          >
            <Camera size={18} /> CAPTURE
          </button>
        </div>

        {/* Debug Toggle */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-gray-500 hover:text-gray-300 text-[10px] 
                     flex items-center gap-1 transition-colors"
        >
          <Info size={12} />
          {showDebug ? 'Hide' : 'Show'} Diagnostics
        </button>

        {/* Debug Panel */}
        {showDebug && (
          <div className="bg-gray-900 rounded-lg p-3 max-h-48 
                          overflow-y-auto border border-gray-700">
            <div className="font-mono text-[11px] space-y-0.5">
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
                  <span className="text-gray-600 flex-shrink-0">
                    {entry.time}
                  </span>
                  <span>{entry.msg}</span>
                </div>
              ))}
              {debugLog.length === 0 && (
                <span className="text-gray-600">No logs yet...</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PentaxLiveFeed;