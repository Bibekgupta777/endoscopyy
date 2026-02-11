import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  // --- States ---
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // --- Refs ---
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // --- 1. Detect all cameras and get labels ---
  const initDevices = async () => {
    try {
      // First request permission so labels (e.g., "USB Capture Card") become visible
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((t) => t.stop());

      // Get list of devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      
      setDevices(videoInputs);

      // Default to the first camera if nothing is selected
      if (videoInputs.length > 0 && !activeDeviceId) {
        setActiveDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error("Camera Init Error:", err);
    }
  };

  // --- 2. Start the Live Feed ---
  const startStream = async (deviceId) => {
    // Stop any existing stream before starting a new one
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 }, // High resolution for endoscopy
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setActiveDeviceId(deviceId);
    } catch (err) {
      console.error("Error starting camera stream:", err);
    }
  };

  // --- 3. Stop the Feed ---
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  // --- 4. Recording Logic ---
  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    
    // Attempt to use high-quality codec, fallback to default webm if not supported
    const options = { mimeType: 'video/webm;codecs=vp9' };
    const actualType = MediaRecorder.isTypeSupported(options.mimeType) 
      ? options.mimeType 
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType: actualType });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start(1000); // Record in 1-second chunks
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = (onVideoReady) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        if (onVideoReady) {
          onVideoReady(blob);
        }
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Return all methods and states to the component ---
  return {
    videoRef,
    stream,
    devices,
    activeDeviceId,
    isRecording,
    initDevices,
    startStream,
    stopStream,
    startRecording,
    stopRecording
  };
};