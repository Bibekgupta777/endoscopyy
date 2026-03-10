import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useCamera = () => {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState('');
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // 1. Find all Cameras
  const initDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      // Auto-select the last device (usually the USB Capture Card)
      if (videoDevices.length > 0) {
        setActiveDeviceId(videoDevices[videoDevices.length - 1].deviceId);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Camera access denied.");
    }
  }, []);

  // 2. Start the Video Feed (Pentax Optimized)
  const startStream = useCallback(async (deviceId) => {
    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      // We don't ask for HD resolution because the Pentax is SD (Standard Def).
      // Asking for deviceId only is the safest way to connect.
      const constraints = {
        video: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStream(newStream);
      setActiveDeviceId(deviceId);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error("Stream error:", error);
      toast.error("Failed to start video. Check USB Capture connection.");
    }
  }, [stream]);

  // 3. Stop Feed
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // 4. Recording Logic
  const startRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];
    
    // Use codecs supported by Electron/Chrome
    const options = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
      ? { mimeType: 'video/webm; codecs=vp9' } 
      : { mimeType: 'video/webm' };

    const mediaRecorder = new MediaRecorder(stream, options);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = mediaRecorder;
    toast.success("Recording Started");
  }, [stream]);

  const stopRecording = useCallback((onSave) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        // Create file
        const file = new File([blob], `endo_${Date.now()}.webm`, { type: 'video/webm' });
        if (onSave) onSave(file);
        setIsRecording(false);
        toast.success("Recording Saved");
      };
    }
  }, [isRecording]);

  return {
    videoRef,
    devices,
    activeDeviceId,
    stream,
    isRecording,
    initDevices,
    startStream,
    stopStream,
    startRecording,
    stopRecording
  };
};