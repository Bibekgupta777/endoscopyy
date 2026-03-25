import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import EndoCamera from './EndoCamera';
import PentaxLiveFeed from './PentaxLiveFeed';
import { ArrowLeft, Save, FileText, Camera, X, ImagePlus, GripHorizontal, Clock, Calendar, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ============================================================================
// ✅ FIXED: BULLETPROOF IMAGE URL HELPER FOR DEV & DIST
// ============================================================================
const getImageURL = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;

  let cleaned = imagePath.replace(/\\/g, '/').replace(/^\//, '');
  if (!cleaned.startsWith('uploads/')) {
    if (!cleaned.includes('/')) {
      cleaned = `uploads/endoscopy-images/${cleaned}`;
    } else {
      cleaned = `uploads/${cleaned}`;
    }
  }

  const isDev = window.location.port === '5173' || window.location.port === '3000';
  const backendPort = isDev ? '5000' : window.location.port;
  const portString = backendPort ? `:${backendPort}` : '';
  const baseURL = `${window.location.protocol}//${window.location.hostname}${portString}`;

  return `${baseURL}/${cleaned}`;
};

// ============================================================================
// IMAGE COMPRESSOR
// ============================================================================
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
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(newFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const CreateReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientDropdownRef = useRef(null);

  const [patients, setPatients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activePatientData, setActivePatientData] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [cameraSource, setCameraSource] = useState('pentax');

  const [capturedPool, setCapturedPool] = useState([]);
  const [reportSlots, setReportSlots] = useState(Array(10).fill(null));
  const [isDraggingOverPool, setIsDraggingOverPool] = useState(false);

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

  useEffect(() => {
    const handler = (e) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [patientsRes, settingsRes] = await Promise.all([
          api.get('/patients?limit=100'),
          api.get('/settings')
        ]);
        const loadedPatients = patientsRes.data?.patients ?? [];
        setPatients(loadedPatients);
        setSettings(settingsRes.data);

        if (settingsRes.data.doctors?.length && !id && !searchParams.get('patient')) {
          setFormData(prev => ({ ...prev, performingDoctor: settingsRes.data.doctors[0] }));
        }

        const preSelectedPatientId = searchParams.get('patient');
        if (preSelectedPatientId && !id) {
          let matchedPatient = loadedPatients.find(p => p._id === preSelectedPatientId);
          if (matchedPatient) {
            let performingDoc = settingsRes.data?.doctors?.[0] || { name: '', qualification: '', signature: '' };
            if (matchedPatient.doneDoc && settingsRes.data?.doctors?.length) {
              const matched = settingsRes.data.doctors.find(
                d => d.name.toLowerCase() === matchedPatient.doneDoc.toLowerCase()
              );
              if (matched) performingDoc = matched;
              else performingDoc = { name: matchedPatient.doneDoc, qualification: '', signature: '' };
            }

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
            try { fetchedData.structuredFindings = JSON.parse(fetchedData.customImpression); } catch (e) { }
          }

          if (fetchedData.patient && typeof fetchedData.patient === 'object') {
            fetchedData.patient = fetchedData.patient._id;
          }

          setFormData(prev => ({ ...prev, ...fetchedData }));

          if (reportRes.data.patient) {
            setPatientSearch(reportRes.data.patient.name ?? '');
            setActivePatientData(reportRes.data.patient);
          }

          if (fetchedData.images && fetchedData.images.length > 0) {
            const poolImages = fetchedData.images.map(img => {
              const actualPath = typeof img === 'string' ? img : (img?.path || img?.filename || '');
              const actualCaption = typeof img === 'string' ? '' : (img?.caption || '');
              return {
                existingPath: actualPath,
                caption: actualCaption,
                file: null,
                preview: getImageURL(actualPath)
              };
            });
            setCapturedPool(poolImages);
            setReportSlots(Array(10).fill(null));
          }
        }
      } catch (err) {
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

  const handleQuickSave = async () => {
    if (!formData.patient) return toast.error('Select a patient first');

    const newImages = [
      ...capturedPool.filter(img => img.file),
      ...reportSlots.filter(img => img && img.file)
    ];

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

      if (newImages.length > 0) {
        const fd = new FormData();
        newImages.forEach(img => fd.append('images', img.file));
        fd.append('captions', newImages.map(() => '').join(','));
        await api.post(`/reports/${savedReport._id}/images`, fd);

        const refreshedReport = await api.get(`/reports/${savedReport._id}`);
        if (refreshedReport.data.images) {
          const updatedPool = refreshedReport.data.images.map(img => ({
            existingPath: img.path,
            caption: img.caption || '',
            file: null,
            preview: getImageURL(img.path)
          }));
          setCapturedPool(updatedPool);
          setReportSlots(Array(10).fill(null));
        }
      }

      toast.dismiss(loadingToast);
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white shadow-2xl rounded-xl p-4 border border-gray-200 max-w-sm`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-emerald-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">✅ Draft Saved Successfully!</p>
              <p className="text-sm text-gray-500 mt-1">Patient: {activePatientData?.name}</p>
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

      if (!id) {
        window.history.replaceState(null, '', `/reports/${savedReport._id}/edit`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Quick save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetForNextPatient = () => {
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
      performingDoctor: settings?.doctors?.[0] || { name: '', qualification: '', signature: '' },
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
    setReportSlots(Array(10).fill(null));
    navigate('/reports/new', { replace: true });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.patient) return toast.error('Select a patient');

    setSaving(true);
    const loadingToast = toast.loading('Uploading & Saving...');
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

      let savedReport;
      if (id) {
        savedReport = (await api.put(`/reports/${id}`, dataToSave)).data;
      } else {
        savedReport = (await api.post('/reports', dataToSave)).data;
      }

      const newImages = reportSlots.filter(img => img !== null && img.file !== null);

      if (newImages.length > 0) {
        const fd = new FormData();
        newImages.forEach(img => fd.append('images', img.file));
        fd.append('captions', newImages.map(i => (i.caption || '').replace(/,/g, ' ')).join(','));
        await api.post(`/reports/${savedReport._id}/images`, fd);
      }

      toast.dismiss(loadingToast);
      toast.success('Report saved successfully!');
      navigate(`/reports/${savedReport._id}/print`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const search = (patientSearch ?? '').toLowerCase();
    const name = (p?.name ?? '').toLowerCase();
    const pid = (p?.patientId ?? '').toLowerCase();
    return name.includes(search) || pid.includes(search);
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
      if (existingSlotImg) {
        newPool.push(existingSlotImg);
      }
      newSlots[targetSlotIndex] = { ...draggedImg };
    } else if (source === 'slot') {
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
    const removedImg = newSlots[index];
    if (removedImg && (removedImg.preview || removedImg.existingPath)) {
      setCapturedPool(prev => [...prev, removedImg]);
    }
    newSlots[index] = null;
    setReportSlots(newSlots);
  };

  const removePoolImage = (index) => {
    setCapturedPool(capturedPool.filter((_, i) => i !== index));
  };

  const getSlotLabel = (index) => {
    const labels = [
      "Image 1", "Image 2", "Image 3", "Image 4", "Image 5",
      "Image 6", "Image 7", "Image 8", "Image 9", "Image 10"
    ];
    return labels[index] || `Image ${index + 1}`;
  };

  const totalNewImages = capturedPool.filter(s => s.file).length + reportSlots.filter(s => s && s.file).length;

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-gray-100 overflow-hidden">
      <div className="flex flex-col w-full lg:w-[60%] h-full bg-white shadow-2xl z-10 border-r">
        <header className="bg-white px-4 py-3 border-b flex justify-between items-center shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {id ? 'Edit Report' : 'Create Report'}
              </h1>
              <p className="text-xs text-gray-500">
                {activePatientData ? (
                  <span className="text-blue-600 font-medium">{activePatientData.name}</span>
                ) : (
                  'Select a patient'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickSave}
              disabled={saving || !formData.patient}
              className={clsx(
                "px-3 py-2 text-sm font-bold rounded-lg flex items-center gap-1.5 transition-all",
                formData.patient
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Quick Save</span>
              {totalNewImages > 0 && (
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs ml-1" title="New captures">
                  +{totalNewImages}
                </span>
              )}
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Save size={16} />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save & Print'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 pb-32 custom-scrollbar">

          {/* ═══════════════════════════════════════════════════════════
              ✅ PATIENT & PROCEDURE — Cleaned up, no dropdown, no study type
              ═══════════════════════════════════════════════════════════ */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2 text-sm">
              <FileText size={16} className="text-blue-600" /> Patient & Procedure
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Search */}
              <div className="relative md:col-span-2" ref={patientDropdownRef}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patient *</label>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientDropdown(true);
                    if (formData.patient) {
                      updateField('patient', '');
                      updateField('procedureName', '');
                      setActivePatientData(null);
                    }
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none transition-colors font-medium"
                  placeholder="Search patient by name or ID..."
                />
                {showPatientDropdown && patientSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="p-3 text-center text-gray-500 text-sm">No patients found</div>
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

                            if (p.doneDoc && settings?.doctors?.length) {
                              const matchedDoc = settings.doctors.find(
                                d => d.name.toLowerCase() === p.doneDoc.toLowerCase()
                              );
                              if (matchedDoc) {
                                updateField('performingDoctor', matchedDoc);
                              } else {
                                updateField('performingDoctor', { name: p.doneDoc, qualification: '', signature: '' });
                              }
                            }
                          }}
                          className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-0"
                        >
                          <div className="font-semibold text-sm">{p.name ?? 'Unnamed'}</div>
                          <div className="text-xs text-gray-500">
                            {p.patientId} • {p.age}Y/{p.sex}
                            {p.procedureType && (
                              <span className="ml-2 text-blue-600 font-medium">• {p.procedureType}</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* ✅ Procedure — Auto-filled from patient, editable text input */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Procedure *</label>
                <input
                  type="text"
                  value={formData.procedureName}
                  onChange={(e) => updateField('procedureName', e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none font-medium"
                  placeholder="e.g., Video GastroDuodenoscopy, Colonoscopy..."
                />
                {activePatientData?.procedureType && formData.procedureName === activePatientData.procedureType && (
                  <p className="text-[10px] text-emerald-600 mt-1 font-medium">✓ Auto-filled from patient record</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> Date
                </label>
                <input
                  type="date"
                  value={formData.procedureDate}
                  onChange={(e) => updateField('procedureDate', e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} /> Time
                </label>
                <input
                  type="time"
                  value={formData.procedureTime}
                  onChange={(e) => updateField('procedureTime', e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Indication */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Indication</label>
                <input
                  list="indications"
                  value={formData.indication}
                  onChange={(e) => updateField('indication', e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none"
                  placeholder="e.g., Dyspepsia"
                />
                <datalist id="indications">
                  {settings?.indications?.map((ind, i) => <option key={i} value={ind} />)}
                </datalist>
              </div>

              {/* Referring Doctor */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Referring Doctor</label>
                <input
                  type="text"
                  value={formData.referringDoctor}
                  onChange={(e) => updateField('referringDoctor', e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* OPD/IPD Number */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">OPD/IPD Number</label>
                <input
                  type="text"
                  value={formData.opdIpdNumber}
                  onChange={(e) => updateField('opdIpdNumber', e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Bill Number */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bill Number</label>
                <input
                  type="text"
                  value={formData.billNumber}
                  onChange={(e) => updateField('billNumber', e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Examined By */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Examined By *</label>
                <select
                  className="w-full border-b-2 border-gray-200 bg-gray-50/50 rounded-t p-2 mt-1 focus:border-blue-600 focus:outline-none"
                  value={settings?.doctors?.findIndex(d => d.name === formData.performingDoctor?.name) ?? 0}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    if (idx >= 0 && settings?.doctors?.[idx]) {
                      updateField('performingDoctor', settings.doctors[idx]);
                    }
                  }}
                >
                  {settings?.doctors?.map((doc, i) => (
                    <option key={i} value={i}>{doc.name}</option>
                  ))}
                  {formData.performingDoctor?.name &&
                    !settings?.doctors?.some(d => d.name === formData.performingDoctor?.name) && (
                      <option value={-1}>{formData.performingDoctor.name}</option>
                    )}
                </select>
              </div>

              {/* Consent */}
              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consentObtained}
                  onChange={(e) => updateField('consentObtained', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <label htmlFor="consent" className="font-semibold text-gray-700 cursor-pointer text-sm">
                  Informed Consent Obtained
                </label>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              ENDOSCOPY FINDINGS — Unchanged
              ═══════════════════════════════════════════════════════════ */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2 text-sm">
              <FileText size={16} className="text-blue-600" /> Endoscopy Findings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-bold text-gray-700 bg-gray-100 p-1.5 px-3 rounded text-sm">Oesophagus</h3>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">Upper:</span>
                  <input type="text" value={formData.structuredFindings.oesophagus.upper} onChange={(e) => updateField('structuredFindings.oesophagus.upper', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">Middle:</span>
                  <input type="text" value={formData.structuredFindings.oesophagus.middle} onChange={(e) => updateField('structuredFindings.oesophagus.middle', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">Lower G-E:</span>
                  <input type="text" value={formData.structuredFindings.oesophagus.lowerGE} onChange={(e) => updateField('structuredFindings.oesophagus.lowerGE', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-gray-700 bg-gray-100 p-1.5 px-3 rounded text-sm">Stomach</h3>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">Fundus:</span>
                  <input type="text" value={formData.structuredFindings.stomach.fundus} onChange={(e) => updateField('structuredFindings.stomach.fundus', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">Body:</span>
                  <input type="text" value={formData.structuredFindings.stomach.body} onChange={(e) => updateField('structuredFindings.stomach.body', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">Antrum:</span>
                  <input type="text" value={formData.structuredFindings.stomach.antrum} onChange={(e) => updateField('structuredFindings.stomach.antrum', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">P-Ring:</span>
                  <input type="text" value={formData.structuredFindings.stomach.pRing} onChange={(e) => updateField('structuredFindings.stomach.pRing', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-gray-700 bg-gray-100 p-1.5 px-3 rounded text-sm">Duodenum</h3>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">Bulb:</span>
                  <input type="text" value={formData.structuredFindings.duodenum.bulb} onChange={(e) => updateField('structuredFindings.duodenum.bulb', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">D2:</span>
                  <input type="text" value={formData.structuredFindings.duodenum.d2} onChange={(e) => updateField('structuredFindings.duodenum.d2', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-sm text-gray-600 text-right">Papilla:</span>
                  <input type="text" value={formData.structuredFindings.duodenum.papilla} onChange={(e) => updateField('structuredFindings.duodenum.papilla', e.target.value)} className="border-b focus:border-blue-600 outline-none p-1 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-gray-700 bg-gray-100 p-1.5 px-3 rounded text-sm">Comments</h3>
                <textarea
                  rows="4"
                  className="w-full border border-gray-200 rounded p-2 text-sm focus:border-blue-600 focus:outline-none bg-gray-50/50"
                  value={formData.structuredFindings.comments}
                  onChange={(e) => updateField('structuredFindings.comments', e.target.value)}
                  placeholder="Additional findings, impressions..."
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              IMAGE SLOTS — Unchanged
              ═══════════════════════════════════════════════════════════ */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">Report Image Slots</h2>
                <p className="text-xs text-gray-500 mt-0.5">Drag photos from the right panel to arrange them in the report</p>
              </div>
              <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {reportSlots.filter(s => s !== null).length} / 10
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {reportSlots.map((slot, index) => (
                <div key={index} className="flex flex-col">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnSlot(e, index)}
                    draggable={slot !== null}
                    onDragStart={(e) => slot && handleDragStart(e, 'slot', index)}
                    className={clsx(
                      "relative aspect-[4/3] rounded-lg border-2 transition-all flex flex-col items-center justify-center overflow-hidden group",
                      slot === null
                        ? "border-dashed border-gray-300 bg-gray-50"
                        : "border-solid border-blue-400 bg-black cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg"
                    )}
                  >
                    {slot === null ? (
                      <div className="text-gray-400 flex flex-col items-center p-2 text-center pointer-events-none">
                        <ImagePlus size={18} className="mb-1 opacity-50" />
                        <span className="text-[9px] font-bold text-gray-500">{getSlotLabel(index)}</span>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => removeSlotImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 z-10 shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                        <div className="absolute top-1 left-1 bg-black/50 text-white rounded-full p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <GripHorizontal size={10} />
                        </div>
                        <img
                          src={slot.preview || getImageURL(slot.existingPath)}
                          className="w-full h-full object-cover pointer-events-none"
                          alt={`Slot ${index + 1}`}
                        />
                      </>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Caption..."
                    value={slot ? slot.caption || '' : ''}
                    onChange={(e) => {
                      if (!slot) return;
                      const newSlots = [...reportSlots];
                      newSlots[index] = { ...newSlots[index], caption: e.target.value };
                      setReportSlots(newSlots);
                    }}
                    disabled={slot === null}
                    className={clsx(
                      "mt-1 w-full text-[10px] p-1 border rounded text-center font-medium outline-none transition-colors",
                      slot === null
                        ? "bg-gray-100 border-gray-200 text-gray-400"
                        : "bg-white border-blue-300 focus:border-blue-600 text-gray-800"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT PANEL — Camera + Pool (Unchanged)
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col w-full lg:w-[40%] h-[50vh] lg:h-full bg-gray-900 shadow-2xl relative">
        <div className="bg-gray-800 p-3 flex justify-between items-center z-10 border-b border-gray-700">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Camera size={16} /> Live Capture
          </h2>
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
            <button
              type="button"
              onClick={() => setCameraSource('pentax')}
              className={clsx(
                'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                cameraSource === 'pentax' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              Endo
            </button>
            <button
              type="button"
              onClick={() => setCameraSource('webcam')}
              className={clsx(
                'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                cameraSource === 'webcam' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              Webcam
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 bg-black aspect-[4/3] w-full flex items-center justify-center overflow-hidden border-b-2 border-blue-900">
          {cameraSource === 'pentax' ? (
            <PentaxLiveFeed
              onCapture={async (file) => {
                const compressedFile = await compressImage(file);
                setCapturedPool(prev => [{ file: compressedFile, preview: URL.createObjectURL(compressedFile), caption: '' }, ...prev]);
              }}
            />
          ) : (
            <EndoCamera
              patientInfo={activePatientData}
              onCapture={async (file) => {
                const compressedFile = await compressImage(file);
                setCapturedPool(prev => [{ file: compressedFile, preview: URL.createObjectURL(compressedFile), caption: '' }, ...prev]);
              }}
            />
          )}
        </div>

        <div
          className={clsx(
            "flex-1 overflow-y-auto p-4 custom-scrollbar transition-all bg-gray-800",
            isDraggingOverPool ? "border-t-2 border-blue-500 bg-gray-800/80" : ""
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOverPool(true); }}
          onDragLeave={() => setIsDraggingOverPool(false)}
          onDrop={handleDropOnPool}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Captured Pool ({capturedPool.length})
              {isDraggingOverPool && <span className="text-[10px] text-blue-400 animate-pulse">Drop here to remove from slot</span>}
            </h3>
            {capturedPool.length > 0 && (
              <button
                type="button"
                onClick={() => setCapturedPool([])}
                className="text-red-400 text-xs hover:text-red-300 font-medium bg-red-400/10 px-2 py-1 rounded"
              >
                Clear All
              </button>
            )}
          </div>

          {capturedPool.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-600 rounded-xl p-4">
              <Camera size={24} className="mb-2 opacity-30" />
              <p className="text-xs font-bold text-center">Pool is empty</p>
              <p className="text-[10px] text-center mt-1 opacity-70">Capture photos above or drag them back from report slots</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {capturedPool.map((img, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'pool', idx)}
                  className="relative aspect-[4/3] border-2 border-gray-600 rounded bg-black cursor-grab active:cursor-grabbing hover:border-blue-500 transition-colors overflow-hidden group"
                >
                  <img
                    src={img.preview || getImageURL(img.existingPath)}
                    className="w-full h-full object-cover pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                    alt={`Capture ${idx}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">DRAG TO SLOT</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePoolImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded p-0.5 z-10 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
        .bg-gray-800 .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .bg-gray-800 .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default CreateReport;