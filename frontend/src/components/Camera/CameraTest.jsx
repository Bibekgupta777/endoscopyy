import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Monitor, Shield, Video, Image as ImageIcon,
  ArrowLeft, Download, Play, Square, Settings, 
  ChevronDown, Cpu, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

// ✅ FIXED IMPORT: Changed 'layout' to 'Layout' and adjusted relative path
import MainLayout from '../Layout/MainLayout'; 

const CameraTest = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [tests, setTests] = useState({
    browserSupport: { status: 'pending', message: 'Waiting to start...' },
    permissions: { status: 'pending', message: 'Waiting to start...' },
    devices: { status: 'pending', message: 'Waiting to start...', list: [] },
    stream: { status: 'pending', message: 'Waiting to start...', resolution: '' },
    capture: { status: 'pending', message: 'Waiting to start...', imageUrl: '' }
  });
  
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamRef, setStreamRef] = useState(null);
  const [testing, setTesting] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // 1. Browser Support Test
  const testBrowserSupport = () => {
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
    const hasEnumerateDevices = !!navigator.mediaDevices?.enumerateDevices;
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';

    if (hasMediaDevices && hasGetUserMedia && hasEnumerateDevices && isSecure) {
      setTests(prev => ({
        ...prev,
        browserSupport: { 
          status: 'pass', 
          message: `Browser fully supports camera access (${location.protocol})` 
        }
      }));
      return true;
    } else {
      let issues = [];
      if (!hasMediaDevices) issues.push('MediaDevices API missing');
      if (!hasGetUserMedia) issues.push('getUserMedia missing');
      if (!hasEnumerateDevices) issues.push('enumerateDevices missing');
      if (!isSecure) issues.push('Not HTTPS (required)');
      
      setTests(prev => ({
        ...prev,
        browserSupport: { 
          status: 'fail', 
          message: `Issues found: ${issues.join(', ')}` 
        }
      }));
      return false;
    }
  };

  // 2. Permission Test
  const testPermissions = async () => {
    try {
      // Some browsers don't support query for 'camera'
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      
      if (permissionStatus.state === 'granted') {
        setTests(prev => ({
          ...prev,
          permissions: { status: 'pass', message: 'Camera permission granted' }
        }));
        return true;
      } else if (permissionStatus.state === 'prompt') {
        setTests(prev => ({
          ...prev,
          permissions: { status: 'warning', message: 'Permission will be requested on stream start' }
        }));
        return true;
      } else {
        setTests(prev => ({
          ...prev,
          permissions: { status: 'fail', message: 'Permission denied. Check browser settings.' }
        }));
        return false;
      }
    } catch (e) {
      // Fallback for browsers without permission API support
      setTests(prev => ({
        ...prev,
        permissions: { status: 'warning', message: 'Cannot verify permissions beforehand' }
      }));
      return true;
    }
  };

  // 3. Device Enumeration
  const testDevices = async () => {
    try {
      // Request permission briefly to get labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());
      } catch (e) {
        // Ignore if denied here, handled later
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');

      if (videoDevices.length > 0) {
        setTests(prev => ({
          ...prev,
          devices: { 
            status: 'pass', 
            message: `Found ${videoDevices.length} camera(s)`,
            list: videoDevices
          }
        }));
        // Select first device if none selected
        if (!selectedDeviceId) setSelectedDeviceId(videoDevices[0].deviceId);
        return true;
      } else {
        setTests(prev => ({
          ...prev,
          devices: { 
            status: 'fail', 
            message: 'No cameras detected. Check connection.',
            list: []
          }
        }));
        return false;
      }
    } catch (e) {
      setTests(prev => ({
        ...prev,
        devices: { 
          status: 'fail', 
          message: `Error: ${e.message}`,
          list: []
        }
      }));
      return false;
    }
  };

  // 4. Start Stream
  const startStream = async (deviceId) => {
    try {
      // Stop existing
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStreamRef(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();

      setTests(prev => ({
        ...prev,
        stream: { 
          status: 'pass', 
          message: `Active: ${track.label}`,
          resolution: `${settings.width}x${settings.height} @ ${settings.frameRate?.toFixed(0) || 30}fps`
        },
        permissions: { status: 'pass', message: 'Permission confirmed' }
      }));

      setIsStreaming(true);
      return true;
    } catch (e) {
      setTests(prev => ({
        ...prev,
        stream: { 
          status: 'fail', 
          message: `Stream failed: ${e.message}`,
          resolution: ''
        }
      }));
      setIsStreaming(false);
      return false;
    }
  };

  const stopStream = () => {
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
      setStreamRef(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setTests(prev => ({
      ...prev,
      stream: { status: 'pending', message: 'Stream stopped', resolution: '' }
    }));
  };

  // 5. Capture Image
  const captureImage = async () => {
    if (!videoRef.current || !streamRef) {
      toast.error('Start stream first');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Add timestamp watermark
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = 'yellow';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(new Date().toLocaleString(), 20, canvas.height - 20);

      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageUrl);

      setTests(prev => ({
        ...prev,
        capture: { 
          status: 'pass', 
          message: 'Image captured successfully',
          resolution: `${canvas.width}x${canvas.height}`
        }
      }));
      toast.success('Capture successful');
    } catch (e) {
      setTests(prev => ({
        ...prev,
        capture: { status: 'fail', message: `Capture failed: ${e.message}` }
      }));
    }
  };

  // Run all diagnostics
  const runDiagnostics = async () => {
    setTesting(true);
    // Reset states
    setTests({
      browserSupport: { status: 'pending', message: 'Testing...' },
      permissions: { status: 'pending', message: 'Testing...' },
      devices: { status: 'pending', message: 'Testing...', list: [] },
      stream: { status: 'pending', message: 'Waiting...', resolution: '' },
      capture: { status: 'pending', message: 'Waiting...', imageUrl: '' }
    });

    // Run sequence
    await new Promise(r => setTimeout(r, 600));
    const browserOk = testBrowserSupport();
    
    await new Promise(r => setTimeout(r, 600));
    const permOk = await testPermissions();
    
    await new Promise(r => setTimeout(r, 600));
    const devicesOk = await testDevices();

    if (browserOk && permOk && devicesOk) {
      toast.success('Diagnostics passed. Ready to stream.');
    } else {
      toast.error('Issues detected. Check details below.');
    }
    setTesting(false);
  };

  useEffect(() => {
    runDiagnostics();
    return () => stopStream();
  }, []);

  const StatusIcon = ({ status }) => {
    if (status === 'pass') return <CheckCircle className="text-emerald-500" size={20} />;
    if (status === 'fail') return <XCircle className="text-red-500" size={20} />;
    if (status === 'warning') return <AlertCircle className="text-amber-500" size={20} />;
    return <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="text-indigo-600" size={28} />
              Camera Diagnostics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Verify browser support, permissions, and camera connectivity.
            </p>
          </div>
          <button 
            onClick={runDiagnostics}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={testing ? 'animate-spin' : ''} />
            Re-run Tests
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Diagnostics */}
          <div className="space-y-4">
            
            {/* Test 1: Browser */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <StatusIcon status={tests.browserSupport.status} />
                <div>
                  <h3 className="font-semibold text-gray-900">Browser Compatibility</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{tests.browserSupport.message}</p>
                </div>
              </div>
            </div>

            {/* Test 2: Permissions */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <StatusIcon status={tests.permissions.status} />
                <div>
                  <h3 className="font-semibold text-gray-900">Camera Permissions</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{tests.permissions.message}</p>
                </div>
              </div>
            </div>

            {/* Test 3: Devices */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <StatusIcon status={tests.devices.status} />
                <div className="w-full">
                  <h3 className="font-semibold text-gray-900">Connected Devices</h3>
                  <p className="text-sm text-gray-500 mt-0.5 mb-3">{tests.devices.message}</p>
                  
                  {tests.devices.list.length > 0 && (
                    <div className="relative">
                      <select 
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 pr-8 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      >
                        {tests.devices.list.map((device, idx) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test 4: Stream */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <StatusIcon status={tests.stream.status} />
                <div className="w-full">
                  <h3 className="font-semibold text-gray-900">Video Stream</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{tests.stream.message}</p>
                  {tests.stream.resolution && (
                     <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-mono font-medium">
                       <Activity size={12} /> {tests.stream.resolution}
                     </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    {!isStreaming ? (
                      <button 
                        onClick={() => startStream(selectedDeviceId)}
                        disabled={tests.devices.status !== 'pass' || testing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200"
                      >
                        <Play size={16} fill="currentColor" /> Start Stream
                      </button>
                    ) : (
                      <button 
                        onClick={stopStream}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        <Square size={16} fill="currentColor" /> Stop Stream
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Test 5: Capture */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <StatusIcon status={tests.capture.status} />
                <div className="w-full">
                  <h3 className="font-semibold text-gray-900">Image Capture</h3>
                  <p className="text-sm text-gray-500 mt-0.5 mb-3">{tests.capture.message}</p>
                  
                  <button 
                    onClick={captureImage}
                    disabled={!isStreaming}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ImageIcon size={18} /> Test Capture
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Preview */}
          <div className="space-y-6">
            
            {/* Live Feed */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg aspect-video relative group">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-contain ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {!isStreaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                    <Video size={32} className="opacity-50" />
                  </div>
                  <p className="text-sm font-medium">Stream inactive</p>
                  <p className="text-xs opacity-60">Click "Start Stream" to test video</p>
                </div>
              )}

              {isStreaming && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
                  LIVE
                </div>
              )}
            </div>

            {/* Capture Preview */}
            {capturedImage && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-4">
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <CheckCircle size={18} className="text-emerald-500" /> 
                     Capture Result
                   </h3>
                   <a 
                     href={capturedImage} 
                     download="test-capture.jpg"
                     className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                   >
                     <Download size={14} /> Download
                   </a>
                 </div>
                 <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                   <img src={capturedImage} alt="Capture" className="w-full h-full object-contain" />
                 </div>
              </div>
            )}
            
            {/* Troubleshooting Tip */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">Troubleshooting</h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  If the browser cannot detect your capture card, ensure you are using <strong>HTTPS</strong> or <strong>localhost</strong>. 
                  Some capture cards (e.g., EasyCap) may require OBS Virtual Camera to act as a bridge.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CameraTest;