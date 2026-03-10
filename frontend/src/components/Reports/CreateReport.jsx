import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import EndoCamera from './EndoCamera';
import PentaxLiveFeed from './PentaxLiveFeed';
import FindingsPanel from './FindingsPanel';
import {
  ArrowLeft, Save, Calendar, Clock, FileText,
  Stethoscope, Plus, X, AlertCircle, Camera,
  CheckCircle, ChevronDown, ChevronUp, Monitor, Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

/* ─── Collapsible Section Wrapper ─── */
const Section = ({ title, icon: Icon, iconColor = 'text-blue-600', defaultOpen = true, badge, headerRight, children, className = '' }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 sm:p-6 
                   text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {Icon && <Icon size={20} className={clsx('flex-shrink-0', iconColor)} />}
          <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">
            {title}
          </h2>
          {badge && (
            <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full 
                             bg-blue-100 text-blue-700 flex-shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {headerRight && <div onClick={(e) => e.stopPropagation()}>{headerRight}</div>}
          {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>
      <div className={clsx(
        'transition-all duration-300 ease-in-out',
        open ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      )}>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

const CreateReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientDropdownRef = useRef(null);

  // ── Core Data ──
  const [patients, setPatients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [clinicalLibrary, setClinicalLibrary] = useState({});
  const [saving, setSaving] = useState(false);
  
  // ✅ FIX: Specific state to hold the patient object for the camera
  const [activePatientData, setActivePatientData] = useState(null);

  // ── UI State ──
  const [showFindingsPanel, setShowFindingsPanel] = useState(false);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [images, setImages] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [cameraSource, setCameraSource] = useState('pentax');

  // ── Form State ──
  const [formData, setFormData] = useState({
    patient: '',
    procedureDate: new Date().toISOString().split('T')[0],
    procedureTime: new Date().toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit'
    }),
    procedureName: '',
    studyType: 'Diagnostic',
    indication: '',
    sedation: { used: false, type: 'Conscious', drugName: '', dose: '' },
    consentObtained: false,
    opdIpdNumber: '',
    billNumber: '',
    referringDoctor: '',
    performingDoctor: { name: '', qualification: '', signature: '' },
    assistant: '',
    nurse: '',
    findings: [],
    organStatus: {
      esophagus: 'normal',
      geJunction: 'normal',
      stomach: 'normal',
      duodenum: 'normal'
    },
    geJunctionDetails: {
      distanceFromIncisors: '',
      hiatusHernia: false,
      herniaSize: '',
      incompetentLES: false,
      irregularZLine: false,
      barrettsEsophagus: false
    },
    biopsy: { taken: false, sites: [], numberOfSamples: 0, rut: false, histopathology: false },
    therapeutic: { performed: false, procedures: [] },
    complications: { occurred: false, types: [], management: '' },
    customImpression: '',
    recommendations: '',
    followUp: '',
    comments: ''
  });

  // Close patient dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      try {
        const [patientsRes, settingsRes] = await Promise.all([
          api.get('/patients?limit=100'),
          api.get('/settings')
        ]);
        const loadedPatients = patientsRes.data.patients;
        setPatients(loadedPatients);
        setSettings(settingsRes.data);
        if (settingsRes.data.clinicalLibrary) setClinicalLibrary(settingsRes.data.clinicalLibrary);
        if (settingsRes.data.doctors?.length) {
          setFormData(prev => ({ ...prev, performingDoctor: settingsRes.data.doctors[0] }));
        }

        // ✅ FIX: Handle Patient ID from URL (?patient=ID)
        const preSelectedPatientId = searchParams.get('patient');
        if (preSelectedPatientId && !id) {
          // 1. Try finding in loaded list
          let matchedPatient = loadedPatients.find(p => p._id === preSelectedPatientId);
          
          // 2. If not in list (pagination), fetch specifically
          if (!matchedPatient) {
            try {
              const res = await api.get(`/patients/${preSelectedPatientId}`);
              matchedPatient = res.data;
            } catch (e) {
              console.error("Could not fetch specific patient", e);
            }
          }

          if (matchedPatient) {
            setFormData(prev => ({ ...prev, patient: matchedPatient._id }));
            setPatientSearch(matchedPatient.name);
            setActivePatientData(matchedPatient); // Set for camera
          }
        }

        if (id) {
          const reportRes = await api.get(`/reports/${id}`);
          setFormData(reportRes.data);
          // Also fill patient search box when editing
          if (reportRes.data.patient) {
            const editPatient = reportRes.data.patient; // Often populated object
            setPatientSearch(editPatient.name || '');
            setActivePatientData(editPatient); // Set for camera
          }
        }
      } catch {
        toast.error('Failed to load data');
      }
    };
    init();
  }, [id, searchParams]);

  // ── Helpers ──
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

  const openFindingsPanel = (organ) => {
    setSelectedOrgan(organ);
    setShowFindingsPanel(true);
  };

  const addFinding = (findingData) => {
    setFormData(prev => ({
      ...prev,
      findings: [...prev.findings, findingData],
      organStatus: {
        ...prev.organStatus,
        [findingData.organ.toLowerCase().replace(/\s/g, '')]: 'abnormal'
      }
    }));
    toast.success(`Finding added: ${findingData.finding}`);
  };

  const removeFinding = (index) => {
    setFormData(prev => ({ ...prev, findings: prev.findings.filter((_, i) => i !== index) }));
  };

  const generateImpression = () => {
    const { findings, organStatus, geJunctionDetails, biopsy, therapeutic, complications } = formData;
    let impression = [];
    Object.entries(organStatus).forEach(([organ, status]) => {
      if (status === 'normal') {
        impression.push(`${organ.charAt(0).toUpperCase() + organ.slice(1)}: Normal study`);
      }
    });
    const grouped = findings.reduce((acc, f) => {
      if (!acc[f.organ]) acc[f.organ] = [];
      let text = f.finding;
      if (f.severity) text += ` (${f.severity})`;
      if (f.size) text += ` - ${f.size}`;
      if (f.location) text += ` at ${f.location}`;
      acc[f.organ].push(text);
      return acc;
    }, {});
    Object.entries(grouped).forEach(([organ, items]) => {
      impression.push(`${organ}: ${items.join(', ')}`);
    });
    if (geJunctionDetails.hiatusHernia) impression.push(`Hiatus hernia (${geJunctionDetails.herniaSize || 'size not specified'})`);
    if (biopsy.taken) impression.push(`Biopsy taken from: ${biopsy.sites.join(', ')} (${biopsy.numberOfSamples} samples)`);
    if (therapeutic.performed) impression.push(`Therapeutic procedures: ${therapeutic.procedures.map(p => p.type).join(', ')}`);
    if (complications.occurred) impression.push(`⚠️ Complications: ${complications.types.join(', ')}`);
    updateField('customImpression', impression.join('\n\n'));
    toast.success('Impression generated!');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.patient) return toast.error('Select a patient');
    if (!formData.procedureName) return toast.error('Select procedure name');
    if (!formData.consentObtained) {
      if (!window.confirm('Consent not marked. Continue anyway?')) return;
    }
    setSaving(true);
    const loadingToast = toast.loading('Saving report...');
    try {
      let savedReport;
      if (id) {
        savedReport = (await api.put(`/reports/${id}`, formData)).data;
      } else {
        savedReport = (await api.post('/reports', formData)).data;
      }
      if (images.length > 0) {
        const fd = new FormData();
        images.forEach(img => fd.append('images', img.file));
        fd.append('tags', images.map(i => i.taggedOrgan || '').join(','));
        fd.append('captions', images.map(i => i.caption || '').join(','));
        await api.post(`/reports/${savedReport._id}/images`, fd);
      }
      toast.dismiss(loadingToast);
      toast.success('Report saved!');
      navigate(`/reports/${savedReport._id}/print`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patientId.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-28 sm:pb-20">

      {/* ═══════ HEADER ═══════ */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4
                        flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => navigate('/reports')}
              className="p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 
                         hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">
                {id ? 'Edit Report' : 'New Report'}
              </h1>
              {activePatientData && (
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                  <span className="font-semibold text-blue-600">{activePatientData.name}</span>
                  <span className="hidden sm:inline"> ({activePatientData.patientId})</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="hidden sm:flex items-center gap-2 btn-primary shadow-lg 
                       disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Save size={18} />
            <span>Save & Print</span>
          </button>
        </div>
      </header>

      {/* ═══════ BODY ═══════ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── SECTION 1: Patient & Procedure ── */}
        <Section title="Patient & Procedure Details" icon={FileText}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* Patient Search */}
            <div className="relative sm:col-span-2 lg:col-span-1" ref={patientDropdownRef}>
              <label className="label">Patient *</label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                className="input-field"
                placeholder="Search patient by name or ID..."
              />
              {showPatientDropdown && patientSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg 
                                shadow-xl max-h-60 overflow-y-auto overscroll-contain">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">No patients found</div>
                  ) : (
                    filteredPatients.map(p => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          updateField('patient', p._id);
                          setPatientSearch(p.name);
                          setActivePatientData(p); // ✅ FIX: Explicitly set the patient for camera
                          setShowPatientDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50 
                                   active:bg-blue-100 transition-colors 
                                   border-b last:border-0"
                      >
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.patientId} • {p.age}Y/{p.sex}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Calendar size={14} /> Date *
              </label>
              <input
                type="date"
                value={formData.procedureDate}
                onChange={(e) => updateField('procedureDate', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Time */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Clock size={14} /> Time *
              </label>
              <input
                type="time"
                value={formData.procedureTime}
                onChange={(e) => updateField('procedureTime', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Procedure Name */}
            <div>
              <label className="label">Procedure Name *</label>
              <select
                value={formData.procedureName}
                onChange={(e) => updateField('procedureName', e.target.value)}
                className="input-field"
              >
                <option value="">Select...</option>
                {settings?.procedures?.map((proc, i) => (
                  <option key={i} value={proc.name}>{proc.name}</option>
                ))}
              </select>
            </div>

            {/* Study Type */}
            <div>
              <label className="label">Study Type *</label>
              <select
                value={formData.studyType}
                onChange={(e) => updateField('studyType', e.target.value)}
                className="input-field"
              >
                <option>Diagnostic</option>
                <option>Therapeutic</option>
                <option>Screening</option>
                <option>Surveillance</option>
              </select>
            </div>

            {/* Indication */}
            <div>
              <label className="label">Indication</label>
              <input
                list="indications"
                value={formData.indication}
                onChange={(e) => updateField('indication', e.target.value)}
                className="input-field"
                placeholder="e.g., Dyspepsia"
              />
              <datalist id="indications">
                {settings?.indications?.map((ind, i) => (
                  <option key={i} value={ind} />
                ))}
              </datalist>
            </div>

            {/* Referring Doctor */}
            <div>
              <label className="label">Referring Doctor</label>
              <input
                type="text"
                value={formData.referringDoctor}
                onChange={(e) => updateField('referringDoctor', e.target.value)}
                className="input-field"
              />
            </div>

            {/* OPD/IPD */}
            <div>
              <label className="label">OPD/IPD Number</label>
              <input
                type="text"
                value={formData.opdIpdNumber}
                onChange={(e) => updateField('opdIpdNumber', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Bill Number */}
            <div>
              <label className="label">Bill Number</label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) => updateField('billNumber', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Performing Doctor */}
            <div>
              <label className="label">Performing Doctor *</label>
              <select
                className="input-field"
                onChange={(e) => {
                  const doc = settings.doctors[e.target.value];
                  updateField('performingDoctor', doc);
                }}
              >
                {settings?.doctors?.map((doc, i) => (
                  <option key={i} value={i}>{doc.name}</option>
                ))}
              </select>
            </div>

            {/* Consent */}
            <div className="flex items-center gap-3 sm:pt-6">
              <input
                type="checkbox"
                id="consent"
                checked={formData.consentObtained}
                onChange={(e) => updateField('consentObtained', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 
                           focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="consent" className="font-semibold text-gray-700 cursor-pointer text-sm sm:text-base">
                Informed Consent Obtained
              </label>
            </div>
          </div>
        </Section>

        {/* ── SECTION 2: Sedation ── */}
        <Section
          title="Sedation"
          icon={Stethoscope}
          defaultOpen={formData.sedation.used}
          headerRight={
            <label className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={formData.sedation.used}
                onChange={(e) => updateField('sedation.used', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-600">Used</span>
            </label>
          }
        >
          {formData.sedation.used ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  value={formData.sedation.type}
                  onChange={(e) => updateField('sedation.type', e.target.value)}
                  className="input-field"
                >
                  <option>Conscious</option>
                  <option>Deep</option>
                  <option>Monitored Anesthesia Care</option>
                </select>
              </div>
              <div>
                <label className="label">Drug Name</label>
                <input
                  list="sedationDrugs"
                  value={formData.sedation.drugName}
                  onChange={(e) => updateField('sedation.drugName', e.target.value)}
                  className="input-field"
                />
                <datalist id="sedationDrugs">
                  {settings?.sedationDrugs?.map((drug, i) => (
                    <option key={i} value={drug} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="label">Dose</label>
                <input
                  type="text"
                  value={formData.sedation.dose}
                  onChange={(e) => updateField('sedation.dose', e.target.value)}
                  className="input-field"
                  placeholder="e.g., 2mg IV"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No sedation — toggle above to add details.</p>
          )}
        </Section>

        {/* ── SECTION 3: Examination Findings ── */}
        <Section
          title="Examination Findings"
          icon={Stethoscope}
          iconColor="text-indigo-600"
          badge={formData.findings.length > 0 ? formData.findings.length : null}
          headerRight={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                generateImpression();
              }}
              className="btn-secondary text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
            >
              <CheckCircle size={14} />
              <span className="hidden sm:inline">Auto-Generate</span>
              <span className="sm:hidden">Generate</span>
            </button>
          }
        >
          {/* Organ Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {['Esophagus', 'GE Junction', 'Stomach', 'Duodenum'].map(organ => {
              const key = organ.toLowerCase().replace(/\s/g, '');
              const status = formData.organStatus[key];
              const findingsCount = formData.findings.filter(
                f => f.organ.toLowerCase().replace(/\s/g, '') === key
              ).length;

              return (
                <button
                  key={organ}
                  type="button"
                  onClick={() => openFindingsPanel(organ)}
                  className={clsx(
                    'p-3 sm:p-4 rounded-xl border-2 transition-all text-left',
                    'active:scale-[0.97]',
                    status === 'abnormal'
                      ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100'
                      : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800 text-xs sm:text-sm leading-tight">
                      {organ}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {findingsCount > 0 && (
                        <span className="w-5 h-5 flex items-center justify-center 
                                         bg-red-500 text-white text-[10px] font-bold rounded-full">
                          {findingsCount}
                        </span>
                      )}
                      {status === 'abnormal' && (
                        <AlertCircle size={14} className="text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateField(`organStatus.${key}`, 'normal');
                      }}
                      className={clsx(
                        'text-[10px] sm:text-xs px-2 py-1 rounded font-medium transition-colors',
                        status === 'normal'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                      )}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFindingsPanel(organ);
                      }}
                      className={clsx(
                        'text-[10px] sm:text-xs px-2 py-1 rounded font-medium transition-colors',
                        status === 'abnormal'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                      )}
                    >
                      Abnormal
                    </button>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Findings */}
          {formData.findings.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">
                Documented Findings:
              </h3>
              <div className="space-y-2">
                {formData.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start gap-2 
                               bg-gray-50 p-3 rounded-lg border"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-blue-600 text-xs sm:text-sm">
                        {finding.organ}
                      </div>
                      <div className="text-xs sm:text-sm mt-0.5 flex flex-wrap gap-x-1">
                        <span className="font-bold">{finding.finding}</span>
                        {finding.severity && (
                          <span className="text-gray-600">• {finding.severity}</span>
                        )}
                        {finding.size && (
                          <span className="text-gray-600">• {finding.size}</span>
                        )}
                        {finding.location && (
                          <span className="text-gray-600">• {finding.location}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFinding(idx)}
                      className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── SECTION 4: GE Junction Details ── */}
        {formData.organStatus.geJunction === 'abnormal' && (
          <Section title="GE Junction Details" icon={AlertCircle} iconColor="text-amber-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Distance from Incisors (cm)</label>
                <input
                  type="text"
                  value={formData.geJunctionDetails.distanceFromIncisors}
                  onChange={(e) => updateField('geJunctionDetails.distanceFromIncisors', e.target.value)}
                  className="input-field"
                  placeholder="e.g., 40"
                />
              </div>

              <div className="space-y-3">
                {[
                  { key: 'hiatusHernia', label: 'Hiatus Hernia', color: '' },
                  { key: 'incompetentLES', label: 'Incompetent LES', color: '' },
                  { key: 'irregularZLine', label: 'Irregular Z-line', color: '' },
                  { key: 'barrettsEsophagus', label: "Barrett's Esophagus", color: 'text-red-600' },
                ].map(item => (
                  <div key={item.key}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.geJunctionDetails[item.key]}
                        onChange={(e) => updateField(`geJunctionDetails.${item.key}`, e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={clsx('font-semibold text-sm', item.color || 'text-gray-700')}>
                        {item.label}
                      </span>
                    </label>
                    {item.key === 'hiatusHernia' && formData.geJunctionDetails.hiatusHernia && (
                      <input
                        type="text"
                        placeholder="Size (e.g., 3cm)"
                        value={formData.geJunctionDetails.herniaSize}
                        onChange={(e) => updateField('geJunctionDetails.herniaSize', e.target.value)}
                        className="input-field ml-6 mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ── SECTION 5: Biopsy ── */}
        <Section
          title="Biopsy"
          defaultOpen={formData.biopsy.taken}
          headerRight={
            <label className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={formData.biopsy.taken}
                onChange={(e) => updateField('biopsy.taken', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-600">Taken</span>
            </label>
          }
        >
          {formData.biopsy.taken ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="label">Biopsy Sites</label>
                <input
                  type="text"
                  placeholder="e.g., Antrum, Body"
                  value={formData.biopsy.sites.join(', ')}
                  onChange={(e) => updateField('biopsy.sites', e.target.value.split(',').map(s => s.trim()))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Number of Samples</label>
                <input
                  type="number"
                  value={formData.biopsy.numberOfSamples}
                  onChange={(e) => updateField('biopsy.numberOfSamples', parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.biopsy.rut}
                  onChange={(e) => updateField('biopsy.rut', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="font-semibold text-sm">RUT (Rapid Urease Test)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.biopsy.histopathology}
                  onChange={(e) => updateField('biopsy.histopathology', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="font-semibold text-sm">Sent for Histopathology</span>
              </label>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No biopsy — toggle above to add details.</p>
          )}
        </Section>

        {/* ── SECTION 6: Therapeutic Procedures ── */}
        <Section
          title="Therapeutic Procedures"
          defaultOpen={formData.therapeutic.performed}
          badge={formData.therapeutic.procedures.length > 0 ? formData.therapeutic.procedures.length : null}
          headerRight={
            <label className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={formData.therapeutic.performed}
                onChange={(e) => updateField('therapeutic.performed', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-600">Performed</span>
            </label>
          }
        >
          {formData.therapeutic.performed ? (
            <div className="space-y-3">
              {formData.therapeutic.procedures.map((proc, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 
                                          items-stretch sm:items-start 
                                          bg-gray-50 p-3 rounded-lg border">
                  <select
                    value={proc.type}
                    onChange={(e) => {
                      const updated = [...formData.therapeutic.procedures];
                      updated[idx].type = e.target.value;
                      updateField('therapeutic.procedures', updated);
                    }}
                    className="input-field flex-1"
                  >
                    <option value="">Select type...</option>
                    <option>Polypectomy</option>
                    <option>APC</option>
                    <option>Injection Therapy</option>
                    <option>Variceal Banding</option>
                    <option>Dilatation</option>
                    <option>Stent Placement</option>
                    <option>Hemostasis</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Site"
                    value={proc.site}
                    onChange={(e) => {
                      const updated = [...formData.therapeutic.procedures];
                      updated[idx].site = e.target.value;
                      updateField('therapeutic.procedures', updated);
                    }}
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.therapeutic.procedures.filter((_, i) => i !== idx);
                      updateField('therapeutic.procedures', updated);
                    }}
                    className="text-red-500 hover:text-red-700 p-2 self-end sm:self-center"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  updateField('therapeutic.procedures', [
                    ...formData.therapeutic.procedures,
                    { type: '', site: '', details: '' }
                  ]);
                }}
                className="btn-secondary text-sm w-full flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Procedure
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No therapeutic procedures — toggle above.</p>
          )}
        </Section>

        {/* ── SECTION 7: Complications ── */}
        <Section
          title="Complications"
          icon={AlertCircle}
          iconColor="text-red-600"
          defaultOpen={formData.complications.occurred}
          headerRight={
            <label className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={formData.complications.occurred}
                onChange={(e) => updateField('complications.occurred', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-red-600">Occurred</span>
            </label>
          }
        >
          {formData.complications.occurred ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {['Bleeding', 'Perforation', 'Hypoxia', 'Hypotension', 'Arrhythmia', 'Aspiration'].map(comp => (
                  <label
                    key={comp}
                    className={clsx(
                      'flex items-center gap-2 p-2.5 sm:p-3 border rounded-lg cursor-pointer',
                      'transition-colors text-sm',
                      formData.complications.types.includes(comp)
                        ? 'bg-red-50 border-red-300'
                        : 'hover:bg-red-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.complications.types.includes(comp)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...formData.complications.types, comp]
                          : formData.complications.types.filter(c => c !== comp);
                        updateField('complications.types', updated);
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="font-semibold">{comp}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="label">Management</label>
                <textarea
                  value={formData.complications.management}
                  onChange={(e) => updateField('complications.management', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Describe management..."
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No complications — toggle above if needed.</p>
          )}
        </Section>

        {/* ── SECTION 8: Images ── */}
        <Section title="Procedure Images" icon={Camera}>
          
          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            <button 
              type="button"
              onClick={() => setCameraSource('pentax')}
              className={clsx(
                'px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2',
                cameraSource === 'pentax' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Monitor size={14} />
              Endoscopy Machine
            </button>
            <button 
              type="button"
              onClick={() => setCameraSource('webcam')}
              className={clsx(
                'px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2',
                cameraSource === 'webcam' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Video size={14} />
              Standard Webcam
            </button>
          </div>

          {cameraSource === 'pentax' ? (
            <PentaxLiveFeed
              onCapture={(file) => {
                setImages(prev => [...prev, {
                  file,
                  preview: URL.createObjectURL(file),
                  taggedOrgan: selectedOrgan || 'General',
                  caption: ''
                }]);
              }}
            />
          ) : (
            <EndoCamera
              patientInfo={activePatientData} // ✅ FIX: Use the resolved patient data
              onCapture={(file, tag) => {
                setImages(prev => [...prev, {
                  file,
                  preview: URL.createObjectURL(file),
                  taggedOrgan: tag,
                  caption: ''
                }]);
              }}
            />
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
              {images.map((img, idx) => (
                <div key={idx} className="relative border rounded-lg p-2 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white 
                               rounded-full p-1 z-10 shadow-md 
                               hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  <img
                    src={img.preview}
                    className="w-full h-24 sm:h-32 object-cover rounded"
                    alt={`Capture ${idx + 1}`}
                  />
                  <div className="text-[10px] sm:text-xs text-gray-600 mt-1.5 font-semibold truncate">
                    {img.taggedOrgan || 'Untagged'}
                  </div>
                  <input
                    type="text"
                    placeholder="Caption..."
                    value={img.caption}
                    onChange={(e) => {
                      const updated = [...images];
                      updated[idx].caption = e.target.value;
                      setImages(updated);
                    }}
                    className="input-field text-xs mt-1"
                  />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── SECTION 9: Final Impression ── */}
        <Section title="Final Impression" icon={FileText} iconColor="text-emerald-600">
          <textarea
            value={formData.customImpression}
            onChange={(e) => updateField('customImpression', e.target.value)}
            className="input-field font-semibold text-sm sm:text-base"
            rows={5}
            placeholder="Auto-generated or type manually..."
          />
        </Section>

        {/* ── SECTION 10: Recommendations & Follow-up ── */}
        <Section title="Recommendations & Follow-up" icon={CheckCircle} iconColor="text-teal-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="label">Recommendations</label>
              <textarea
                value={formData.recommendations}
                onChange={(e) => updateField('recommendations', e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Follow-up instructions..."
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="label">Follow-up</label>
                <input
                  type="text"
                  value={formData.followUp}
                  onChange={(e) => updateField('followUp', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Repeat in 3 months"
                />
              </div>
              <div>
                <label className="label">Comments</label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => updateField('comments', e.target.value)}
                  className="input-field"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ═══════ MOBILE FLOATING SAVE BAR ═══════ */}
      <div
        className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md 
                    border-t border-gray-200 p-3 z-40 safe-bottom"
        style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom, 0px))` }}
      >
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full btn-primary flex items-center justify-center gap-2 
                     py-3.5 text-base font-bold shadow-lg rounded-xl
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-transform"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save & Print Report'}
        </button>
      </div>

      {/* ═══════ FINDINGS PANEL ═══════ */}
      {showFindingsPanel && selectedOrgan && (() => {
        const selectedProcedure = settings?.procedures?.find(p => p.name === formData.procedureName);
        const procedureType = selectedProcedure?.type || 'EGD';
        const libraryForType = clinicalLibrary[procedureType] || [];
        return (
          <FindingsPanel
            organ={selectedOrgan}
            library={libraryForType}
            onAddFinding={addFinding}
            onClose={() => setShowFindingsPanel(false)}
          />
        );
      })()}
    </div>
  );
};

export default CreateReport;