import ImageViewer from './ImageViewer';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import PentaxLiveFeed from './PentaxLiveFeed';
import { ArrowLeft, Save, FileText, Camera, X, ImagePlus, GripHorizontal, Clock, Calendar, CheckCircle, Users, FolderOpen, Upload, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ── helpers ──────────────────────────────────────────
const getImageURL = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
  let cleaned = imagePath.replace(/\\/g, '/').replace(/^\//, '');
  if (!cleaned.startsWith('uploads/')) {
    if (!cleaned.includes('/')) cleaned = `uploads/endoscopy-images/${cleaned}`;
    else cleaned = `uploads/${cleaned}`;
  }
  const isDev = window.location.port === '5173' || window.location.port === '3000';
  const backendPort = isDev ? '5000' : window.location.port;
  const portString = backendPort ? `:${backendPort}` : '';
  const baseURL = `${window.location.protocol}//${window.location.hostname}${portString}`;
  return `${baseURL}/${cleaned}`;
};

const compressImage = (file, maxWidth = 800, quality = 0.6) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const resolvePerformingDoctor = (patientDoneDoc, settingsDoctors) => {
  if (!patientDoneDoc) return null;
  const doctors = settingsDoctors || [];
  const matched = doctors.find(d => d.name.toLowerCase().trim() === patientDoneDoc.toLowerCase().trim());
  if (matched) return { ...matched };
  return { name: patientDoneDoc, qualification: '', signature: '' };
};

const OESO_FIELDS = [
  { key: 'upper', label: 'Upper' },
  { key: 'middle', label: 'Middle' },
  { key: 'lowerGE', label: 'Lower G-E' },
];
const STOMACH_FIELDS = [
  { key: 'fundus', label: 'Fundus' },
  { key: 'body', label: 'Body' },
  { key: 'antrum', label: 'Antrum' },
  { key: 'pRing', label: 'P-Ring' },
];
const DUODENUM_FIELDS = [
  { key: 'bulb', label: 'Bulb' },
  { key: 'd2', label: 'D2' },
  { key: 'papilla', label: 'Papilla' },
];

const DEFAULT_SLOT_CAPTIONS = [
  "Oesophagus",
  "EG Junction",
  "Body",
  "Fundus",
  "Pylorus",
  "D1",
  "D2"
];

// ═════════════════════════════════════════════════════════════════
const CreateReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [patients, setPatients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activePatientData, setActivePatientData] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [capturedPool, setCapturedPool] = useState([]);
  const [reportSlots, setReportSlots] = useState(Array(7).fill(null));
  const [isDraggingOverPool, setIsDraggingOverPool] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isResettingCam, setIsResettingCam] = useState(false); // ✅ NEW
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImageSrc, setViewerImageSrc] = useState('');
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0);

  const cameraContainerRef = useRef(null);
  const [captureFlash, setCaptureFlash] = useState(false);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showCaptureIndicator, setShowCaptureIndicator] = useState(false);
  const [lastCapturePreview, setLastCapturePreview] = useState(null);
  const fullscreenElementRef = useRef(null);
  const capturingRef = useRef(false);

  const [formData, setFormData] = useState({
    patient: '',
    procedureDate: new Date().toISOString().split('T')[0],
    procedureTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    procedureName: '',
    indication: '',
    sedation: { used: false, type: 'Conscious', drugName: '', dose: '' },
    consentObtained: true,
    opdIpdNumber: '',
    billNumber: '',
    referringDoctor: '',
    performingDoctor: { name: '', qualification: '', signature: '' },
    assistant: '',
    nurse: '',
    findings: [],
    organStatus: { esophagus: 'normal', geJunction: 'normal', stomach: 'normal', duodenum: 'normal' },
    geJunctionDetails: { distanceFromIncisors: '', hiatusHernia: false, herniaSize: '', incompetentLES: false, irregularZLine: false, barrettsEsophagus: false },
    biopsy: { taken: false, sites: [], numberOfSamples: 0, rut: false, histopathology: false },
    therapeutic: { performed: false, procedures: [] },
    complications: { occurred: false, types: [], management: '' },
    customImpression: '',
    recommendations: '',
    followUp: '',
    comments: '',
    structuredFindings: {
      oralCavity: '',
      oesophagus: { upper: 'Normal', middle: 'Normal', lowerGE: 'At 38 cms' },
      stomach: { fundus: 'Normal', body: 'Normal', antrum: 'Normal', pRing: 'Normal' },
      duodenum: { bulb: 'Normal', d2: 'Normal', papilla: 'Normal' },
      comments: ''
    }
  });

  // ✅ CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      capturedPool.forEach(img => {
        if (img && img.preview && img.preview.startsWith('blob:')) {
          try { URL.revokeObjectURL(img.preview); } catch (e) {}
        }
      });
      reportSlots.forEach(slot => {
        if (slot && slot.preview && slot.preview.startsWith('blob:')) {
          try { URL.revokeObjectURL(slot.preview); } catch (e) {}
        }
      });
      if (window.gc) { try { window.gc(); } catch (e) {} }
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) setShowPatientDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasData = formData.patient || reportSlots.some(s => s !== null) || capturedPool.length > 0;
      if (hasData && !saving) {
        toast.error("⚠️ UNSAVED CHANGES! Please click 'Quick Save' or 'Save & Print' before closing.", {
          duration: 6000,
          position: 'top-center',
          style: { background: '#f59e0b', color: '#fff', fontWeight: 'bold', fontSize: '14px' }
        });
        e.preventDefault();
        e.returnValue = 'You have unsaved changes! Are you sure you want to exit?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData.patient, reportSlots, capturedPool, saving]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullEl = document.fullscreenElement || document.webkitFullscreenElement;
      const isFull = !!fullEl;
      if (fullEl) {
        fullscreenElementRef.current = fullEl.tagName === 'VIDEO' ? (fullEl.parentElement || fullEl) : fullEl;
      } else {
        fullscreenElementRef.current = null;
      }
      setIsFullScreen(isFull);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [patientsRes, settingsRes] = await Promise.all([api.get('/patients?limit=100'), api.get('/settings')]);
        const loadedPatients = patientsRes.data?.patients ?? [];
        setPatients(loadedPatients);
        setSettings(settingsRes.data);
        const settingsDoctors = settingsRes.data?.doctors || [];
        if (settingsDoctors.length && !id && !searchParams.get('patient')) {
          setFormData(prev => ({ ...prev, performingDoctor: settingsDoctors[0] }));
        }
        const preSelectedPatientId = searchParams.get('patient');
        if (preSelectedPatientId && !id) {
          const matchedPatient = loadedPatients.find(p => p._id === preSelectedPatientId);
          if (matchedPatient) {
            const performingDoc = resolvePerformingDoctor(matchedPatient.doneDoc, settingsDoctors) || settingsDoctors[0] || { name: '', qualification: '', signature: '' };
            setFormData(prev => ({ 
              ...prev, 
              patient: matchedPatient._id, 
              indication: matchedPatient.indication || prev.indication, 
              referringDoctor: matchedPatient.referredDoc || prev.referringDoctor, 
              billNumber: matchedPatient.billNumber || prev.billNumber, 
              opdIpdNumber: matchedPatient.idNumber || prev.opdIpdNumber, 
              procedureName: matchedPatient.procedureType || prev.procedureName, 
              performingDoctor: performingDoc 
            }));
            setPatientSearch(matchedPatient.name ?? '');
            setActivePatientData(matchedPatient);
          }
        }
        if (id) {
          const reportRes = await api.get(`/reports/${id}`);
          let fetchedData = reportRes.data;
          if (typeof fetchedData.customImpression === 'string' && fetchedData.customImpression.startsWith('{')) { 
            try { 
              fetchedData.structuredFindings = JSON.parse(fetchedData.customImpression); 
            } catch (e) { } 
          }
          const populatedPatient = (typeof fetchedData.patient === 'object' && fetchedData.patient !== null) ? fetchedData.patient : null;
          if (fetchedData.patient && typeof fetchedData.patient === 'object') fetchedData.patient = fetchedData.patient._id;
          setFormData(prev => ({ ...prev, ...fetchedData }));
          if (populatedPatient) {
            setPatientSearch(populatedPatient.name ?? '');
            setActivePatientData(populatedPatient);
            setFormData(prev => ({ 
              ...prev, 
              indication: prev.indication || populatedPatient.indication || '', 
              referringDoctor: prev.referringDoctor || populatedPatient.referredDoc || '', 
              billNumber: prev.billNumber || populatedPatient.billNumber || '', 
              opdIpdNumber: prev.opdIpdNumber || populatedPatient.idNumber || '', 
              procedureName: prev.procedureName || populatedPatient.procedureType || '', 
              performingDoctor: (prev.performingDoctor?.name) ? prev.performingDoctor : resolvePerformingDoctor(populatedPatient.doneDoc, settingsRes.data?.doctors) || settingsRes.data?.doctors?.[0] || { name: '', qualification: '', signature: '' } 
            }));
          }
          
          const newSlots = Array(7).fill(null);
          const newPool = [];
          
          if (fetchedData.images && fetchedData.images.length > 0) {
            fetchedData.images.forEach((img, idx) => {
              const actualPath = typeof img === 'string' ? img : (img?.path || img?.filename || '');
              const actualCaption = typeof img === 'string' ? '' : (img?.caption || '');
              const slotIndex = typeof img === 'object' ? (img.slotIndex ?? idx) : idx;
              const imageObj = { 
                existingPath: actualPath, 
                caption: actualCaption || (slotIndex >= 0 && slotIndex < 7 ? DEFAULT_SLOT_CAPTIONS[slotIndex] : ''), 
                file: null, 
                preview: getImageURL(actualPath),
                _id: img._id 
              };
              if (slotIndex >= 0 && slotIndex < 7) {
                newSlots[slotIndex] = imageObj;
              } else {
                newPool.push(imageObj);
              }
            });
          }
          
          if (fetchedData.poolImages && fetchedData.poolImages.length > 0) {
            fetchedData.poolImages.forEach(img => {
              const actualPath = typeof img === 'string' ? img : (img?.path || img?.filename || '');
              const actualCaption = typeof img === 'string' ? '' : (img?.caption || '');
              newPool.push({ 
                existingPath: actualPath, 
                caption: actualCaption, 
                file: null, 
                preview: getImageURL(actualPath),
                _id: img._id
              });
            });
          }
          
          setReportSlots(newSlots);
          setCapturedPool(newPool);
        }
      } catch (err) { 
        console.error('Init error:', err);
        toast.error('Failed to load data'); 
      }
    };
    init();
  }, [id, searchParams]);

  const updateField = useCallback((path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      if (keys.length === 1) return { ...prev, [keys[0]]: value };
      const copy = { ...prev };
      let ref = copy;
      for (let i = 0; i < keys.length - 1; i++) { 
        ref[keys[i]] = { ...ref[keys[i]] }; 
        ref = ref[keys[i]]; 
      }
      ref[keys[keys.length - 1]] = value;
      return copy;
    });
  }, []);

  const autoSaveToPatientFolder = useCallback(async (file) => {
    if (!activePatientData?.name) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('patientName', activePatientData.name);
      await api.post('/reports/auto-save', fd);
      console.log(`📁 Auto-saved to folder: ${activePatientData.name}`);
    } catch (err) {
      console.error('Auto-save to patient folder failed:', err);
    }
  }, [activePatientData]);

  const handleLocalImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const loadingToast = toast.loading(`Processing ${files.length} image(s)...`);
    const uploadedImages = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }

      try {
        const compressed = await compressImage(file);
        const preview = URL.createObjectURL(compressed);
        uploadedImages.push({ 
          file: compressed, 
          preview, 
          caption: file.name.replace(/\.[^/.]+$/, '')
        });
        
        if (activePatientData?.name) {
          autoSaveToPatientFolder(compressed);
        }
      } catch (err) {
        console.error('Error processing image:', err);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    if (uploadedImages.length > 0) {
      setCapturedPool(prev => [...uploadedImages, ...prev]);
      toast.dismiss(loadingToast);
      toast.success(`📁 ${uploadedImages.length} image(s) added to pool`);
    } else {
      toast.dismiss(loadingToast);
    }

    e.target.value = '';
  }, [activePatientData, autoSaveToPatientFolder]);

  const performCapture = useCallback(async () => {
    if (capturingRef.current) return;
    capturingRef.current = true;

    try {
      const container = cameraContainerRef.current;

      let video = container?.querySelector('video');
      if (!video || video.readyState < 2) {
        const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
        if (fsEl) {
          video = fsEl.tagName === 'VIDEO' ? fsEl : fsEl.querySelector('video');
        }
      }
      if (!video || video.tagName !== 'VIDEO' || video.readyState < 2 || video.videoWidth === 0) {
        capturingRef.current = false;
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (!blob) { capturingRef.current = false; return; }

      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const compressed = await compressImage(file);
      const preview = URL.createObjectURL(compressed);

      setCapturedPool(prev => [{ file: compressed, preview, caption: '' }, ...prev]);
      autoSaveToPatientFolder(compressed);

      setCaptureFlash(true);
      setTimeout(() => setCaptureFlash(false), 150);

      if (document.fullscreenElement || document.webkitFullscreenElement) {
        setShowCaptureIndicator(true);
        setLastCapturePreview(preview);
        setTimeout(() => setShowCaptureIndicator(false), 800);
        setTimeout(() => setLastCapturePreview(null), 2500);
      }
    } catch (err) {
      console.error('Capture error:', err);
    } finally {
      setTimeout(() => { capturingRef.current = false; }, 300);
    }
  }, [autoSaveToPatientFolder]);

  const handleCameraAreaClick = useCallback(async (e) => {
    try {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('[data-no-capture]')) {
        return;
      }
      performCapture();
    } catch (err) {
      console.error('Tap-to-capture error:', err);
    }
  }, [performCapture]);

  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e) => {
      const ignoredKeys = [
        'Control', 'Alt', 'Shift', 'Meta', 'Tab', 'CapsLock',
        'NumLock', 'ScrollLock', 'Escape',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
        'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
      ];
      if (ignoredKeys.includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      performCapture();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, performCapture]);

  useEffect(() => {
    if (!isFullScreen) return;
    const handleFullscreenClick = (e) => {
      if (e.target.closest('button') || e.target.closest('input') || 
          e.target.closest('select') || e.target.closest('[data-no-capture]')) return;
      performCapture();
    };
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      fsEl.addEventListener('click', handleFullscreenClick);
      return () => fsEl.removeEventListener('click', handleFullscreenClick);
    }
  }, [isFullScreen, performCapture]);

  const saveAllImages = async (reportId) => {
    const fd = new FormData();
    const slotIndices = [];
    const captions = [];
    const existingPaths = [];
    
    reportSlots.forEach((slot, index) => {
      if (slot) {
        if (slot.file) {
          fd.append('images', slot.file);
          slotIndices.push(index);
          captions.push(slot.caption || '');
        } else if (slot.existingPath) {
          existingPaths.push(slot.existingPath);
          slotIndices.push(index);
          captions.push(slot.caption || '');
        }
      }
    });
    
    capturedPool.forEach(img => {
      if (img.file) {
        fd.append('images', img.file);
        slotIndices.push(-1);
        captions.push(img.caption || '');
      } else if (img.existingPath) {
        existingPaths.push(img.existingPath);
        slotIndices.push(-1);
        captions.push(img.caption || '');
      }
    });
    
    fd.append('slotIndices', slotIndices.join(','));
    fd.append('captions', captions.join('|||'));
    fd.append('existingPaths', existingPaths.join('|||'));
    
    await api.post(`/reports/${reportId}/save-all-images`, fd);
  };

  const handleQuickSave = async () => {
    if (!formData.patient) return toast.error('Select a patient first');
    
    setSaving(true);
    const loadingToast = toast.loading(`Quick saving...`);
    try {
      let safePatientId = formData.patient;
      if (typeof safePatientId === 'object' && safePatientId !== null) safePatientId = safePatientId._id;
      
      const draftData = { 
        patient: safePatientId, 
        procedureDate: formData.procedureDate, 
        procedureTime: formData.procedureTime, 
        procedureName: formData.procedureName || 'Endoscopy', 
        indication: formData.indication, 
        referringDoctor: formData.referringDoctor, 
        performingDoctor: formData.performingDoctor, 
        opdIpdNumber: formData.opdIpdNumber, 
        billNumber: formData.billNumber, 
        consentObtained: formData.consentObtained, 
        status: 'draft', 
        comments: formData.comments || '⏳ Quick capture - Report pending completion' 
      };
      delete draftData._id; 
      delete draftData.__v;
      
      let savedReport;
      if (id) { 
        savedReport = (await api.put(`/reports/${id}`, draftData)).data; 
      } else { 
        savedReport = (await api.post('/reports', draftData)).data; 
      }
      
      const hasAnyImages = reportSlots.some(s => s !== null) || capturedPool.length > 0;
      if (hasAnyImages) {
        await saveAllImages(savedReport._id);
      }
      
      const refreshedReport = await api.get(`/reports/${savedReport._id}`);
      if (refreshedReport.data) {
        const newSlots = Array(7).fill(null);
        const newPool = [];
        
        if (refreshedReport.data.images) {
          refreshedReport.data.images.forEach((img, idx) => {
            const slotIndex = img.slotIndex ?? idx;
            const imageObj = { 
              existingPath: img.path, 
              caption: img.caption || '', 
              file: null, 
              preview: getImageURL(img.path),
              _id: img._id
            };
            if (slotIndex >= 0 && slotIndex < 7) {
              newSlots[slotIndex] = imageObj;
            } else {
              newPool.push(imageObj);
            }
          });
        }
        
        if (refreshedReport.data.poolImages) {
          refreshedReport.data.poolImages.forEach(img => {
            newPool.push({ 
              existingPath: img.path, 
              caption: img.caption || '', 
              file: null, 
              preview: getImageURL(img.path),
              _id: img._id
            });
          });
        }
        
        setReportSlots(newSlots);
        setCapturedPool(newPool);
      }
      
      toast.dismiss(loadingToast);
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white shadow-2xl rounded-xl p-4 border border-gray-200 max-w-sm`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-emerald-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">✅ Draft Saved!</p>
              <p className="text-sm text-gray-500 mt-1">Patient: {activePatientData?.name}</p>
              <p className="text-xs text-emerald-600 mt-1">
                📸 {reportSlots.filter(s => s !== null).length} slotted + {capturedPool.length} pool images saved
              </p>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => { resetForNextPatient(); toast.dismiss(t.id); }} 
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Users size={12} /> Next Patient
                </button>
                <button 
                  onClick={() => { navigate('/patients'); toast.dismiss(t.id); }} 
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 10000 });
      
      if (!id) window.history.replaceState(null, '', `/reports/${savedReport._id}/edit`);
    } catch (error) { 
      toast.dismiss(loadingToast); 
      toast.error(error.response?.data?.message || 'Quick save failed'); 
    } finally { 
      setSaving(false); 
    }
  };

  const resetForNextPatient = () => {
    capturedPool.forEach(img => {
      if (img && img.preview && img.preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(img.preview); } catch (e) {}
      }
    });
    reportSlots.forEach(slot => {
      if (slot && slot.preview && slot.preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(slot.preview); } catch (e) {}
      }
    });
    setFormData(prev => ({ 
      ...prev, 
      patient: '', 
      procedureName: '', 
      indication: '', 
      referringDoctor: '', 
      opdIpdNumber: '', 
      billNumber: '', 
      procedureDate: new Date().toISOString().split('T')[0], 
      procedureTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), 
      performingDoctor: { name: '', qualification: '', signature: '' }, 
      structuredFindings: { 
        oralCavity: '', 
        oesophagus: { upper: 'Normal', middle: 'Normal', lowerGE: 'At 38 cms' }, 
        stomach: { fundus: 'Normal', body: 'Normal', antrum: 'Normal', pRing: 'Normal' }, 
        duodenum: { bulb: 'Normal', d2: 'Normal', papilla: 'Normal' }, 
        comments: '' 
      } 
    }));
    setPatientSearch(''); 
    setActivePatientData(null); 
    setCapturedPool([]); 
    setReportSlots(Array(7).fill(null)); 
    setActiveTab('details'); 
    navigate('/reports/new', { replace: true });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.patient) return toast.error('Select a patient');
    setSaving(true);
    const loadingToast = toast.loading('Uploading & Saving Report...');
    try {
      const dataToSave = { 
        ...formData, 
        procedureName: formData.procedureName || 'Endoscopy', 
        customImpression: JSON.stringify(formData.structuredFindings), 
        status: 'finalized' 
      };
      delete dataToSave._id; 
      delete dataToSave.__v; 
      delete dataToSave.createdAt; 
      delete dataToSave.updatedAt; 
      delete dataToSave.images; 
      delete dataToSave.videos;
      delete dataToSave.poolImages;
      
      let savedReport;
      if (id) { 
        savedReport = (await api.put(`/reports/${id}`, dataToSave)).data; 
      } else { 
        savedReport = (await api.post('/reports', dataToSave)).data; 
      }
      
      const hasAnyImages = reportSlots.some(s => s !== null) || capturedPool.length > 0;
      if (hasAnyImages) {
        await saveAllImages(savedReport._id);
      }

      toast.dismiss(loadingToast); 
      toast.success('Report saved successfully!');
      navigate(`/reports/${savedReport._id}/print`, { state: { autoSave: true } });
      
    } catch (error) { 
      toast.dismiss(loadingToast); 
      toast.error(error.response?.data?.message || 'Failed to save'); 
    } finally { 
      setSaving(false); 
    }
  };

  const filteredPatients = patients.filter(p => {
    const search = (patientSearch ?? '').toLowerCase();
    return (p?.name ?? '').toLowerCase().includes(search) || (p?.patientId ?? '').toLowerCase().includes(search);
  });

  const handleDragStart = (e, source, index) => { 
    e.dataTransfer.setData('sourceInfo', JSON.stringify({ source, index })); 
  };

  const handleDropOnSlot = (e, targetSlotIndex) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('sourceInfo');
    if (!data) return;
    const { source, index: sourceIndex } = JSON.parse(data);
    const newSlots = [...reportSlots]; 
    const newPool = [...capturedPool];
    
    if (source === 'pool') { 
      const draggedImg = newPool[sourceIndex]; 
      const existingSlotImg = newSlots[targetSlotIndex]; 
      newPool.splice(sourceIndex, 1); 
      if (existingSlotImg) newPool.push(existingSlotImg); 
      newSlots[targetSlotIndex] = { 
        ...draggedImg,
        caption: draggedImg.caption || DEFAULT_SLOT_CAPTIONS[targetSlotIndex]
      }; 
    }
    else if (source === 'slot') { 
      const temp = newSlots[targetSlotIndex]; 
      newSlots[targetSlotIndex] = newSlots[sourceIndex]; 
      newSlots[sourceIndex] = temp; 
    }
    setReportSlots(newSlots); 
    setCapturedPool(newPool);
  };

  const handleDropOnPool = (e) => {
    e.preventDefault(); 
    setIsDraggingOverPool(false);
    const data = e.dataTransfer.getData('sourceInfo');
    if (!data) return;
    const { source, index: sourceIndex } = JSON.parse(data);
    if (source === 'slot') { 
      const newSlots = [...reportSlots]; 
      const newPool = [...capturedPool]; 
      const draggedImg = newSlots[sourceIndex]; 
      if (draggedImg) { 
        newPool.push(draggedImg); 
        newSlots[sourceIndex] = null; 
        setReportSlots(newSlots); 
        setCapturedPool(newPool); 
      } 
    }
  };

  const removeSlotImage = (index) => { 
    const newSlots = [...reportSlots]; 
    const img = newSlots[index]; 
    if (img && img.preview && img.preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(img.preview); } catch (e) {}
    }
    if (img && (img.preview || img.existingPath)) {
      setCapturedPool(prev => [...prev, img]); 
    }
    newSlots[index] = null; 
    setReportSlots(newSlots); 
  };
  
  const removePoolImage = (index) => { 
    const img = capturedPool[index];
    if (img && img.preview && img.preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(img.preview); } catch (e) {}
    }
    setCapturedPool(capturedPool.filter((_, i) => i !== index)); 
  };

  const openImageViewer = useCallback((imageSrc, allImages = [], currentIdx = 0) => {
    setViewerImageSrc(imageSrc);
    setViewerImages(allImages);
    setViewerCurrentIndex(currentIdx);
    setViewerOpen(true);
  }, []);

  const handleViewerNavigate = useCallback((newIndex) => {
    if (viewerImages[newIndex]) {
      const img = viewerImages[newIndex];
      const src = typeof img === 'string' ? img : (img.preview || getImageURL(img.existingPath));
      setViewerImageSrc(src);
      setViewerCurrentIndex(newIndex);
    }
  }, [viewerImages]);

  const getAllViewableImages = useCallback(() => {
    const slotImages = reportSlots
      .filter(s => s !== null)
      .map(s => s.preview || getImageURL(s.existingPath));
    const poolImagesArr = capturedPool
      .map(p => p.preview || getImageURL(p.existingPath));
    return [...slotImages, ...poolImagesArr];
  }, [reportSlots, capturedPool]);

  const slotsFilled = reportSlots.filter(s => s !== null).length;
  const totalImages = slotsFilled + capturedPool.length;

  const inputCls = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300";
  const labelCls = "block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1";

  const tabs = [
    { key: 'details',  icon: FileText,  label: 'Details',  badge: formData.patient ? '✓' : null },
    { key: 'findings', icon: ImagePlus, label: 'Findings & Images', badge: totalImages > 0 ? totalImages : null },
  ];

  const renderSlot = (index) => {
    const slot = reportSlots[index];
    return (
      <div key={index} className="flex flex-col h-full w-full">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDropOnSlot(e, index)}
          draggable={slot !== null}
          onDragStart={(e) => slot && handleDragStart(e, 'slot', index)}
          onDoubleClick={() => {
            if (slot) {
              const allImages = getAllViewableImages();
              const currentSrc = slot.preview || getImageURL(slot.existingPath);
              const currentIdx = allImages.findIndex(src => src === currentSrc);
              openImageViewer(currentSrc, allImages, currentIdx >= 0 ? currentIdx : 0);
            }
          }}
          className={clsx(
            "relative aspect-[4/3] rounded-xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden group",
            slot === null
              ? "border-dashed border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/30"
              : "border-solid border-blue-500 bg-black cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl hover:border-blue-400 ring-2 ring-blue-500/10"
          )}
        >
          {slot === null ? (
            <div className="text-slate-400 flex flex-col items-center p-2 text-center pointer-events-none">
              <ImagePlus size={20} className="mb-1 opacity-30" />
              <span className="text-[10px] font-extrabold text-slate-400">{DEFAULT_SLOT_CAPTIONS[index]}</span>
              <span className="text-[8px] font-semibold text-slate-300 mt-0.5">(Slot {index + 1})</span>
            </div>
          ) : (
            <>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); removeSlotImage(index); }} 
                className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center z-10 shadow-lg hover:bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
              <div className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-full p-1 z-10 opacity-0 group-hover:opacity-70 transition-opacity pointer-events-none">
                <GripHorizontal size={10} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-6 z-[5] pointer-events-none" />
              <span className="absolute bottom-1 left-1.5 text-[8px] font-bold text-white/80 z-10 pointer-events-none">{index + 1}</span>
              <img src={slot.preview || getImageURL(slot.existingPath)} className="w-full h-full object-cover pointer-events-none" alt={`Slot ${index + 1}`} />
            </>
          )}
        </div>
        <input
          type="text"
          placeholder={DEFAULT_SLOT_CAPTIONS[index]}
          value={slot ? slot.caption || '' : ''}
          onChange={(e) => { 
            if (!slot) return; 
            const ns = [...reportSlots]; 
            ns[index] = { ...ns[index], caption: e.target.value }; 
            setReportSlots(ns); 
          }}
          disabled={slot === null}
          className={clsx(
            "mt-1 w-full text-[10px] p-1 rounded text-center font-medium outline-none transition-colors border flex-shrink-0",
            slot === null ? "bg-slate-50 border-slate-200 text-slate-300" : "bg-white border-blue-200 focus:border-blue-500 text-slate-700"
          )}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] overflow-hidden bg-slate-100">

      {/* LEFT PANEL — FORM */}
      <div className="flex flex-col w-full lg:w-[55%] xl:w-[58%] h-full bg-slate-50 z-10">

        <header className="h-[52px] bg-white border-b border-slate-200/80 px-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button 
              onClick={() => navigate(-1)} 
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="min-w-0">
              <h1 className="text-[13px] font-extrabold text-slate-800 leading-none">
                {id ? 'Edit Report' : 'New Report'}
              </h1>
              {activePatientData ? (
                <p className="text-[11px] text-blue-600 font-semibold truncate leading-tight mt-0.5">
                  {activePatientData.name} &bull; {activePatientData.age}Y/{activePatientData.sex}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Select patient to begin</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleQuickSave}
              disabled={saving || !formData.patient}
              className={clsx(
                "h-8 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all",
                formData.patient
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              <Camera size={13} />
              <span className="hidden sm:inline">Quick Save</span>
              {totalImages > 0 && (
                <span className="bg-white/20 text-[10px] px-1 rounded ml-0.5">{totalImages}</span>
              )}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Save size={13} />
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save & Print'}</span>
            </button>
          </div>
        </header>

        <nav className="h-10 bg-white border-b border-slate-200/80 px-3 flex items-end gap-0.5 flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  "relative px-4 h-9 text-[11px] font-bold tracking-wide rounded-t-lg flex items-center gap-1.5 transition-all",
                  active
                    ? "bg-slate-50 text-blue-600 border border-slate-200/80 border-b-slate-50 -mb-px z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/60 border border-transparent"
                )}
              >
                <Icon size={12} />
                {tab.label}
                {tab.badge && (
                  <span className={clsx(
                    "text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none",
                    active ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {activeTab === 'details' && (
            <div className="p-4 lg:p-5 space-y-4">
              <div className="relative" ref={patientDropdownRef}>
                <label className={labelCls}>Patient *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => { 
                      setPatientSearch(e.target.value); 
                      setShowPatientDropdown(true); 
                      if (formData.patient) { 
                        updateField('patient', ''); 
                        updateField('procedureName', ''); 
                        updateField('performingDoctor', { name: '', qualification: '', signature: '' }); 
                        setActivePatientData(null); 
                      } 
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className={clsx(inputCls, "pl-9 !bg-slate-50 !border-slate-300 font-semibold")}
                    placeholder="Type patient name or ID…"
                  />
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {showPatientDropdown && patientSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-sm">No matches</div>
                    ) : (
                      filteredPatients.map(p => (
                        <button
                          key={p._id} 
                          type="button"
                          onClick={() => {
                            updateField('patient', p._id); 
                            setPatientSearch(p.name ?? ''); 
                            setActivePatientData(p); 
                            setShowPatientDropdown(false);
                            if (p.procedureType) updateField('procedureName', p.procedureType);
                            if (p.indication) updateField('indication', p.indication);
                            if (p.referredDoc) updateField('referringDoctor', p.referredDoc);
                            if (p.billNumber) updateField('billNumber', p.billNumber);
                            if (p.idNumber) updateField('opdIpdNumber', p.idNumber);
                            const resolvedDoc = resolvePerformingDoctor(p.doneDoc, settings?.doctors);
                            if (resolvedDoc) updateField('performingDoctor', resolvedDoc);
                            else if (settings?.doctors?.length) updateField('performingDoctor', settings.doctors[0]);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {(p.name ?? '?')[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{p.name ?? 'Unnamed'}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {p.patientId} &bull; {p.age}Y/{p.sex}
                                {p.procedureType && <span className="text-blue-500 font-medium"> &bull; {p.procedureType}</span>}
                                {p.doneDoc && <span className="text-emerald-500 font-medium"> &bull; Dr.{p.doneDoc}</span>}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {activePatientData && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-2.5 border border-blue-200/60">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(activePatientData.name ?? '?')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{activePatientData.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {activePatientData.patientId} &bull; {activePatientData.age}Y / {activePatientData.sex}
                      {activePatientData.procedureType && <span className="ml-1 text-blue-600 font-semibold">&bull; {activePatientData.procedureType}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => { 
                      updateField('patient', ''); 
                      updateField('procedureName', ''); 
                      setPatientSearch(''); 
                      setActivePatientData(null); 
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2">
                  <label className={labelCls}>Procedure *</label>
                  <input 
                    type="text" 
                    value={formData.procedureName} 
                    onChange={(e) => updateField('procedureName', e.target.value)} 
                    className={inputCls} 
                    placeholder="e.g. Video GastroDuodenoscopy" 
                  />
                  {activePatientData?.procedureType && formData.procedureName === activePatientData.procedureType && (
                    <p className="text-[9px] text-emerald-500 mt-0.5 font-semibold">✓ Auto-filled from patient</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    <Calendar size={10} className="inline mr-1 -mt-0.5" />Date
                  </label>
                  <input 
                    type="date" 
                    value={formData.procedureDate} 
                    onChange={(e) => updateField('procedureDate', e.target.value)} 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Clock size={10} className="inline mr-1 -mt-0.5" />Time
                  </label>
                  <input 
                    type="time" 
                    value={formData.procedureTime} 
                    onChange={(e) => updateField('procedureTime', e.target.value)} 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className={labelCls}>Indication</label>
                  <input 
                    list="indications" 
                    value={formData.indication} 
                    onChange={(e) => updateField('indication', e.target.value)} 
                    className={inputCls} 
                    placeholder="e.g. Dyspepsia" 
                  />
                  <datalist id="indications">
                    {settings?.indications?.map((ind, i) => <option key={i} value={ind} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Referring Doctor</label>
                  <input 
                    type="text" 
                    value={formData.referringDoctor} 
                    onChange={(e) => updateField('referringDoctor', e.target.value)} 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className={labelCls}>Patient ID</label>
                  <input 
                    type="text" 
                    value={formData.opdIpdNumber} 
                    onChange={(e) => updateField('opdIpdNumber', e.target.value)} 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className={labelCls}>Bill Number</label>
                  <input 
                    type="text" 
                    value={formData.billNumber} 
                    onChange={(e) => updateField('billNumber', e.target.value)} 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className={labelCls}>Examined By *</label>
                  <select
                    className={inputCls}
                    value={settings?.doctors?.findIndex(d => d.name === formData.performingDoctor?.name) ?? -1}
                    onChange={(e) => { 
                      const idx = parseInt(e.target.value); 
                      if (idx >= 0 && settings?.doctors?.[idx]) updateField('performingDoctor', settings.doctors[idx]); 
                    }}
                  >
                    {settings?.doctors?.map((doc, i) => <option key={i} value={i}>{doc.name}</option>)}
                    {formData.performingDoctor?.name && !settings?.doctors?.some(d => d.name === formData.performingDoctor?.name) && (
                      <option value={-1}>{formData.performingDoctor.name}</option>
                    )}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={formData.consentObtained} 
                      onChange={(e) => updateField('consentObtained', e.target.checked)} 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                    />
                    <span className="text-xs font-semibold text-slate-600">Consent Obtained</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'findings' && (
            <div className="p-4 lg:p-5 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">Findings & Report Images</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fill details and drag captures into slots.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={clsx("text-xs font-extrabold px-3 py-1.5 rounded-full", totalImages > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                    📸 {totalImages} total
                  </div>
                  <div className={clsx("text-xs font-extrabold px-3 py-1.5 rounded-full", slotsFilled > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400")}>
                    {slotsFilled} / 7 slotted
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-800 font-medium">
                  💡 <strong>All images are saved!</strong> Both slotted images (for report) and pool images (extra captures) are preserved when you save.
                </p>
              </div>

              <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-5 rounded-full bg-rose-400" />
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Oesophagus</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {OESO_FIELDS.map(f => (
                        <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <label className={clsx(labelCls, "sm:w-28 !mb-0")}>{f.label}</label>
                          <input 
                            type="text" 
                            value={formData.structuredFindings.oesophagus[f.key]} 
                            onChange={(e) => updateField(`structuredFindings.oesophagus.${f.key}`, e.target.value)} 
                            className={clsx(inputCls, "flex-1")} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-5 rounded-full bg-amber-400" />
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Stomach</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {STOMACH_FIELDS.map(f => (
                        <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <label className={clsx(labelCls, "sm:w-28 !mb-0")}>{f.label}</label>
                          <input 
                            type="text" 
                            value={formData.structuredFindings.stomach[f.key]} 
                            onChange={(e) => updateField(`structuredFindings.stomach.${f.key}`, e.target.value)} 
                            className={clsx(inputCls, "flex-1")} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-5 rounded-full bg-blue-400" />
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Duodenum</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {DUODENUM_FIELDS.map(f => (
                        <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <label className={clsx(labelCls, "sm:w-28 !mb-0")}>{f.label}</label>
                          <input 
                            type="text" 
                            value={formData.structuredFindings.duodenum[f.key]} 
                            onChange={(e) => updateField(`structuredFindings.duodenum.${f.key}`, e.target.value)} 
                            className={clsx(inputCls, "flex-1")} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-5 rounded-full bg-emerald-400" />
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Comments & Impression</h3>
                    </div>
                    <textarea
                      rows={5}
                      value={formData.structuredFindings.comments}
                      onChange={(e) => updateField('structuredFindings.comments', e.target.value)}
                      className={clsx(inputCls, "resize-none")}
                      placeholder="Additional findings, impressions, conclusions…"
                    />
                  </div>
                </div>
                <div className="w-full xl:w-[220px] shrink-0 flex flex-col gap-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center xl:text-right">
                    Report Slots 1-4
                  </div>
                  {[0, 1, 2, 3].map(i => renderSlot(i))}
                </div>
              </div>
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row xl:flex-row-reverse gap-3 xl:justify-start">
                  {[4, 5, 6].map(i => (
                    <div key={i} className="w-full sm:flex-1 xl:flex-none xl:w-[220px] flex-shrink-0">
                      {renderSlot(i)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — CAMERA + POOL */}
      <div className="flex flex-col w-full lg:w-[45%] xl:w-[42%] h-[50vh] lg:h-full bg-slate-900 relative">

        {/* ✅ CAMERA PANEL HEADER - Reset Cam button lives here safely */}
        <div className="h-11 bg-slate-800/90 backdrop-blur px-3 flex items-center justify-between flex-shrink-0 border-b border-slate-700/60">
          <h2 className="text-white/90 font-bold text-xs flex items-center gap-1.5 tracking-wide">
            <Camera size={13} /> Endoscope Feed
          </h2>
          <div className="flex items-center gap-2">

            {/* ✅ RESET CAM BUTTON - Safe location in camera panel */}
            <button
              onClick={async () => {
                try {
                  setIsResettingCam(true);
                  toast.loading('🔄 Resetting camera...', { id: 'cam-reset' });
                  
                  const devices = await navigator.mediaDevices.enumerateDevices();
                  const videoDev = devices.filter(d => d.kind === 'videoinput');
                  
                  for (const dev of videoDev) {
                    try {
                      const s = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: dev.deviceId }
                      });
                      s.getTracks().forEach(t => {
                        t.stop();
                        t.enabled = false;
                      });
                    } catch (e) {}
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  toast.success('✅ Camera reset! Click START in feed.', { 
                    id: 'cam-reset',
                    duration: 4000 
                  });
                } catch (error) {
                  toast.error('❌ Reset failed', { id: 'cam-reset' });
                } finally {
                  setIsResettingCam(false);
                }
              }}
              disabled={isResettingCam}
              data-no-capture
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold transition-all",
                isResettingCam
                  ? "bg-amber-500/30 text-amber-300 cursor-not-allowed"
                  : "bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30"
              )}
              title="Reset camera if stuck"
            >
              <RefreshCw size={10} className={isResettingCam ? 'animate-spin' : ''} />
              <span>{isResettingCam ? 'Resetting...' : 'Reset Cam'}</span>
            </button>

            <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Auto-Detect
            </div>
          </div>
        </div>

        <div
          ref={cameraContainerRef}
          onClick={handleCameraAreaClick}
          className="flex-shrink-0 bg-black aspect-[4/3] w-full flex items-center justify-center overflow-hidden border-b-2 border-blue-500/30 cursor-pointer relative"
        >
          <PentaxLiveFeed 
            onCapture={async (file) => { 
              const c = await compressImage(file); 
              setCapturedPool(prev => [{ file: c, preview: URL.createObjectURL(c), caption: '' }, ...prev]); 
              autoSaveToPatientFolder(c);
            }} 
          />
          {captureFlash && (
            <div className="absolute inset-0 bg-white/70 z-50 pointer-events-none animate-pulse" />
          )}
        </div>

        {/* POOL AREA */}
        <div
          className={clsx(
            "flex-1 overflow-y-auto p-3 custom-scrollbar transition-all", 
            isDraggingOverPool ? "bg-slate-700/50 ring-2 ring-inset ring-blue-500/40" : "bg-slate-800"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOverPool(true); }}
          onDragLeave={() => setIsDraggingOverPool(false)}
          onDrop={handleDropOnPool}
        >
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em] flex items-center gap-2">
              Pool ({capturedPool.length})
              {isDraggingOverPool && (
                <span className="text-[9px] text-blue-400 animate-pulse normal-case tracking-normal">
                  ← Drop to unslot
                </span>
              )}
            </h3>
            
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleLocalImageUpload}
                className="hidden"
                data-no-capture
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-no-capture
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-lg hover:shadow-blue-500/30"
              >
                <Upload size={12} />
                Upload
              </button>
              {capturedPool.length > 0 && (
                <span className="text-[9px] text-emerald-400 font-semibold">
                  ✓ Will be saved
                </span>
              )}
            </div>
          </div>

          {capturedPool.length === 0 ? (
            <div 
              className="h-24 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-slate-700/30 transition-all"
              onClick={() => fileInputRef.current?.click()}
              data-no-capture
            >
              <FolderOpen size={18} className="mb-1 opacity-40" />
              <p className="text-[10px] font-bold">No images yet</p>
              <p className="text-[9px] opacity-50 mt-0.5">Click to upload or tap live feed to capture</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {capturedPool.map((img, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'pool', idx)}
                  onDoubleClick={() => {
                    const allImages = getAllViewableImages();
                    const slottedCount = reportSlots.filter(s => s !== null).length;
                    const currentSrc = img.preview || getImageURL(img.existingPath);
                    openImageViewer(currentSrc, allImages, slottedCount + idx);
                  }}
                  className="relative aspect-[4/3] border border-slate-600/60 rounded-lg bg-black cursor-grab active:cursor-grabbing hover:border-blue-400 hover:ring-1 hover:ring-blue-400/30 transition-all overflow-hidden group"
                >
                  <img 
                    src={img.preview || getImageURL(img.existingPath)} 
                    className="w-full h-full object-cover pointer-events-none opacity-75 group-hover:opacity-100 transition-opacity" 
                    alt={`Capture ${idx}`} 
                  />
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removePoolImage(idx); }} 
                    className="absolute top-0.5 right-0.5 bg-red-600/90 text-white rounded-full w-4 h-4 flex items-center justify-center z-10 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={8} />
                  </button>
                  {img.existingPath && !img.file && (
                    <div className="absolute bottom-0.5 left-0.5 bg-emerald-600/90 text-white rounded px-1 py-0.5 text-[7px] font-bold">
                      SAVED
                    </div>
                  )}
                  {img.file && img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-1 py-0.5 text-[7px] truncate">
                      📁 {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageSrc={viewerImageSrc}
        images={viewerImages}
        currentIndex={viewerCurrentIndex}
        onNavigate={handleViewerNavigate}
      />

      {/* Fullscreen Overlay */}
      {isFullScreen && fullscreenElementRef.current && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none',
            zIndex: 2147483647,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 16, right: 16,
              background: 'rgba(0,0,0,0.75)',
              color: 'white',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: 24 }}>📸</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#34d399', transition: 'transform 0.15s', transform: showCaptureIndicator ? 'scale(1.35)' : 'scale(1)' }}>
                {totalImages}
              </div>
              <div style={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>
                captures
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{slotsFilled}</div>
              <div style={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>slotted</div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 20, left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.55)',
              color: 'rgba(255,255,255,0.75)',
              borderRadius: 10,
              padding: '8px 22px',
              fontSize: 13, fontWeight: 600,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              whiteSpace: 'nowrap', letterSpacing: 0.3,
            }}
          >
            ⌨️ Press any key or tap to capture &nbsp;•&nbsp; ESC to exit
          </div>

          {showCaptureIndicator && (
            <div
              style={{
                position: 'absolute', inset: 0,
                border: '5px solid #10b981',
                pointerEvents: 'none',
                animation: 'fcFlash 0.8s ease-out forwards',
              }}
            />
          )}

          {lastCapturePreview && (
            <div
              style={{
                position: 'absolute', bottom: 60, right: 16,
                width: 140, borderRadius: 12,
                border: '3px solid #10b981',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                animation: 'fcSlideIn 0.3s ease-out',
              }}
            >
              <img src={lastCapturePreview} style={{ width: '100%', display: 'block' }} alt="Last capture" />
              <div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(16, 185, 129, 0.92)',
                  color: 'white', fontSize: 10, fontWeight: 700,
                  textAlign: 'center', padding: '4px 0',
                  textTransform: 'uppercase', letterSpacing: 1.2,
                }}
              >
                Captured ✓
              </div>
            </div>
          )}
        </div>,
        fullscreenElementRef.current
      )}

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar{width:5px}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#94a3b8}
        .bg-slate-800 .custom-scrollbar::-webkit-scrollbar-thumb{background:#475569}
        @keyframes fcFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fcSlideIn {
          0% { transform: translateX(60px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CreateReport;