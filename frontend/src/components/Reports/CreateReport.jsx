import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import EndoCamera from './EndoCamera';
import FindingsPanel from './FindingsPanel';
import {
  ArrowLeft, Save, Calendar, Clock, FileText, 
  Stethoscope, Plus, X, AlertCircle, Camera, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreateReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // ✅ CORE DATA
  const [patients, setPatients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [clinicalLibrary, setClinicalLibrary] = useState({});

  // ✅ FORM STATE
  const [formData, setFormData] = useState({
    patient: '',
    procedureDate: new Date().toISOString().split('T')[0],
    procedureTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    procedureName: '',
    studyType: 'Diagnostic',
    indication: '',
    
    sedation: {
      used: false,
      type: 'Conscious',
      drugName: '',
      dose: ''
    },

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

    biopsy: {
      taken: false,
      sites: [],
      numberOfSamples: 0,
      rut: false,
      histopathology: false
    },

    therapeutic: {
      performed: false,
      procedures: []
    },

    complications: {
      occurred: false,
      types: [],
      management: ''
    },

    customImpression: '',
    recommendations: '',
    followUp: '',
    comments: ''
  });

  // ✅ UI STATE
  const [showFindingsPanel, setShowFindingsPanel] = useState(false);
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [images, setImages] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // ✅ INITIALIZATION
  useEffect(() => {
    const init = async () => {
      try {
        const [patientsRes, settingsRes] = await Promise.all([
          api.get('/patients?limit=100'),
          api.get('/settings')
        ]);
        
        setPatients(patientsRes.data.patients);
        setSettings(settingsRes.data);

        // ✅ Load clinical library based on procedure
        if (settingsRes.data.clinicalLibrary) {
          setClinicalLibrary(settingsRes.data.clinicalLibrary);
        }

        // Set defaults
        if (settingsRes.data.doctors?.length) {
          setFormData(prev => ({
            ...prev,
            performingDoctor: settingsRes.data.doctors[0]
          }));
        }

        if (id) {
          const reportRes = await api.get(`/reports/${id}`);
          setFormData(reportRes.data);
        }

      } catch (error) {
        toast.error('Failed to load data');
      }
    };
    init();
  }, [id]);

  // ✅ OPEN FINDINGS PANEL FOR SPECIFIC ORGAN
  const openFindingsPanel = (organ) => {
    setSelectedOrgan(organ);
    setShowFindingsPanel(true);
  };

  // ✅ ADD FINDING FROM PANEL
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

  // ✅ REMOVE FINDING
  const removeFinding = (index) => {
    setFormData(prev => ({
      ...prev,
      findings: prev.findings.filter((_, i) => i !== index)
    }));
  };

  // ✅ AUTO-GENERATE IMPRESSION
  const generateImpression = () => {
    const { findings, organStatus, geJunctionDetails, biopsy, therapeutic, complications } = formData;

    let impression = [];

    // Normal organs
    Object.entries(organStatus).forEach(([organ, status]) => {
      if (status === 'normal') {
        impression.push(`${organ.charAt(0).toUpperCase() + organ.slice(1)}: Normal study`);
      }
    });

    // Abnormal findings
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

    // GE Junction special
    if (geJunctionDetails.hiatusHernia) {
      impression.push(`Hiatus hernia (${geJunctionDetails.herniaSize || 'size not specified'})`);
    }

    // Biopsy
    if (biopsy.taken) {
      impression.push(`Biopsy taken from: ${biopsy.sites.join(', ')} (${biopsy.numberOfSamples} samples)`);
    }

    // Therapeutic
    if (therapeutic.performed) {
      impression.push(`Therapeutic procedures: ${therapeutic.procedures.map(p => p.type).join(', ')}`);
    }

    // Complications
    if (complications.occurred) {
      impression.push(`⚠️ Complications: ${complications.types.join(', ')}`);
    }

    setFormData(prev => ({
      ...prev,
      customImpression: impression.join('\n\n')
    }));

    toast.success('Impression generated!');
  };

  // ✅ SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patient) return toast.error('Select a patient');
    if (!formData.procedureName) return toast.error('Select procedure name');
    if (!formData.consentObtained) {
      if (!window.confirm('Consent not marked. Continue anyway?')) return;
    }

    const loadingToast = toast.loading('Saving report...');

    try {
      let savedReport;
      if (id) {
        savedReport = (await api.put(`/reports/${id}`, formData)).data;
      } else {
        savedReport = (await api.post('/reports', formData)).data;
      }

      // Upload images
      if (images.length > 0) {
        const fd = new FormData();
        images.forEach(img => {
          fd.append('images', img.file);
        });
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
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patientId.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const currentPatient = patients.find(p => p._id === formData.patient);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ✅ HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50 px-6 py-4 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/reports')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{id ? 'Edit Report' : 'New Endoscopy Report'}</h1>
              {currentPatient && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Patient: <span className="font-semibold text-blue-600">{currentPatient.name}</span> ({currentPatient.patientId})
                </p>
              )}
            </div>
          </div>
          <button onClick={handleSubmit} className="btn-primary flex items-center gap-2 shadow-lg">
            <Save size={18} /> Save & Print
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* ✅ SECTION 1: PATIENT & METADATA */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Patient & Procedure Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Patient Search */}
            <div className="relative">
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
                placeholder="Search patient..."
              />
              {showPatientDropdown && patientSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {filteredPatients.map(p => (
                    <div
                      key={p._id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, patient: p._id }));
                        setPatientSearch(p.name);
                        setShowPatientDropdown(false);
                      }}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.patientId} • {p.age}Y/{p.sex}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="label flex items-center gap-2">
                <Calendar size={14} /> Date *
              </label>
              <input
                type="date"
                value={formData.procedureDate}
                onChange={(e) => setFormData(prev => ({ ...prev, procedureDate: e.target.value }))}
                className="input-field"
              />
            </div>

            {/* Time */}
            <div>
              <label className="label flex items-center gap-2">
                <Clock size={14} /> Time *
              </label>
              <input
                type="time"
                value={formData.procedureTime}
                onChange={(e) => setFormData(prev => ({ ...prev, procedureTime: e.target.value }))}
                className="input-field"
              />
            </div>

            {/* Procedure Name */}
            <div>
              <label className="label">Procedure Name *</label>
              <select
                value={formData.procedureName}
                onChange={(e) => setFormData(prev => ({ ...prev, procedureName: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, studyType: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, indication: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, referringDoctor: e.target.value }))}
                className="input-field"
              />
            </div>

            {/* OPD/IPD Number */}
            <div>
              <label className="label">OPD/IPD Number</label>
              <input
                type="text"
                value={formData.opdIpdNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, opdIpdNumber: e.target.value }))}
                className="input-field"
              />
            </div>

            {/* Bill Number */}
            <div>
              <label className="label">Bill Number</label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
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
                  setFormData(prev => ({ ...prev, performingDoctor: doc }));
                }}
              >
                {settings?.doctors?.map((doc, i) => (
                  <option key={i} value={i}>{doc.name}</option>
                ))}
              </select>
            </div>

            {/* Consent */}
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                checked={formData.consentObtained}
                onChange={(e) => setFormData(prev => ({ ...prev, consentObtained: e.target.checked }))}
                className="w-5 h-5"
              />
              <label className="font-semibold text-gray-700">Informed Consent Obtained</label>
            </div>

          </div>
        </div>

        {/* ✅ SECTION 2: SEDATION */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sedation</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <input
              type="checkbox"
              checked={formData.sedation.used}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                sedation: { ...prev.sedation, used: e.target.checked }
              }))}
              className="w-5 h-5"
            />
            <label className="font-semibold">Sedation Used</label>
          </div>

          {formData.sedation.used && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  value={formData.sedation.type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sedation: { ...prev.sedation, type: e.target.value }
                  }))}
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sedation: { ...prev.sedation, drugName: e.target.value }
                  }))}
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sedation: { ...prev.sedation, dose: e.target.value }
                  }))}
                  className="input-field"
                  placeholder="e.g., 2mg IV"
                />
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECTION 3: ORGAN FINDINGS (SMART UI) */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Examination Findings</h2>
            <button
              onClick={generateImpression}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <CheckCircle size={16} /> Auto-Generate Impression
            </button>
          </div>

          {/* Organ Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {['Esophagus', 'GE Junction', 'Stomach', 'Duodenum'].map(organ => {
              const key = organ.toLowerCase().replace(/\s/g, '');
              const status = formData.organStatus[key];
              
              return (
                <button
                  key={organ}
                  onClick={() => openFindingsPanel(organ)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    status === 'abnormal' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800">{organ}</span>
                    {status === 'abnormal' && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({
                          ...prev,
                          organStatus: { ...prev.organStatus, [key]: 'normal' }
                        }));
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        status === 'normal' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFindingsPanel(organ);
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        status === 'abnormal' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100'
                      }`}
                    >
                      Abnormal
                    </button>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Findings List */}
          {formData.findings.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3">Documented Findings:</h3>
              <div className="space-y-2">
                {formData.findings.map((finding, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg border">
                    <div>
                      <div className="font-semibold text-blue-600">{finding.organ}</div>
                      <div className="text-sm">
                        <span className="font-bold">{finding.finding}</span>
                        {finding.severity && <span className="text-gray-600"> • {finding.severity}</span>}
                        {finding.size && <span className="text-gray-600"> • {finding.size}</span>}
                        {finding.location && <span className="text-gray-600"> • {finding.location}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFinding(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECTION 4: GE JUNCTION DETAILS (Conditional) */}
        {formData.organStatus.geJunction === 'abnormal' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">GE Junction Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Distance from Incisors (cm)</label>
                <input
                  type="text"
                  value={formData.geJunctionDetails.distanceFromIncisors}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    geJunctionDetails: { ...prev.geJunctionDetails, distanceFromIncisors: e.target.value }
                  }))}
                  className="input-field"
                  placeholder="e.g., 40"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.geJunctionDetails.hiatusHernia}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      geJunctionDetails: { ...prev.geJunctionDetails, hiatusHernia: e.target.checked }
                    }))}
                  />
                  <span className="font-semibold">Hiatus Hernia</span>
                </label>

                {formData.geJunctionDetails.hiatusHernia && (
                  <input
                    type="text"
                    placeholder="Size (e.g., 3cm)"
                    value={formData.geJunctionDetails.herniaSize}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      geJunctionDetails: { ...prev.geJunctionDetails, herniaSize: e.target.value }
                    }))}
                    className="input-field ml-6"
                  />
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.geJunctionDetails.incompetentLES}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      geJunctionDetails: { ...prev.geJunctionDetails, incompetentLES: e.target.checked }
                    }))}
                  />
                  <span className="font-semibold">Incompetent LES</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.geJunctionDetails.irregularZLine}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      geJunctionDetails: { ...prev.geJunctionDetails, irregularZLine: e.target.checked }
                    }))}
                  />
                  <span className="font-semibold">Irregular Z-line</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.geJunctionDetails.barrettsEsophagus}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      geJunctionDetails: { ...prev.geJunctionDetails, barrettsEsophagus: e.target.checked }
                    }))}
                  />
                  <span className="font-semibold text-red-600">Barrett's Esophagus</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ✅ SECTION 5: BIOPSY */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="checkbox"
              checked={formData.biopsy.taken}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                biopsy: { ...prev.biopsy, taken: e.target.checked }
              }))}
              className="w-5 h-5"
            />
            <h2 className="text-lg font-bold text-gray-800">Biopsy Taken</h2>
          </div>

          {formData.biopsy.taken && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Biopsy Sites</label>
                <input
                  type="text"
                  placeholder="e.g., Antrum, Body"
                  value={formData.biopsy.sites.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    biopsy: { ...prev.biopsy, sites: e.target.value.split(',').map(s => s.trim()) }
                  }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Number of Samples</label>
                <input
                  type="number"
                  value={formData.biopsy.numberOfSamples}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    biopsy: { ...prev.biopsy, numberOfSamples: parseInt(e.target.value) }
                  }))}
                  className="input-field"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.biopsy.rut}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    biopsy: { ...prev.biopsy, rut: e.target.checked }
                  }))}
                />
                <span className="font-semibold">RUT (Rapid Urease Test)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.biopsy.histopathology}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    biopsy: { ...prev.biopsy, histopathology: e.target.checked }
                  }))}
                />
                <span className="font-semibold">Sent for Histopathology</span>
              </label>
            </div>
          )}
        </div>

        {/* ✅ SECTION 6: THERAPEUTIC PROCEDURES */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="checkbox"
              checked={formData.therapeutic.performed}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                therapeutic: { ...prev.therapeutic, performed: e.target.checked }
              }))}
              className="w-5 h-5"
            />
            <h2 className="text-lg font-bold text-gray-800">Therapeutic Procedures Performed</h2>
          </div>

          {formData.therapeutic.performed && (
            <div className="space-y-3">
              {formData.therapeutic.procedures.map((proc, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <select
                    value={proc.type}
                    onChange={(e) => {
                      const updated = [...formData.therapeutic.procedures];
                      updated[idx].type = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        therapeutic: { ...prev.therapeutic, procedures: updated }
                      }));
                    }}
                    className="input-field flex-1"
                  >
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
                      setFormData(prev => ({
                        ...prev,
                        therapeutic: { ...prev.therapeutic, procedures: updated }
                      }));
                    }}
                    className="input-field flex-1"
                  />

                  <button
                    onClick={() => {
                      const updated = formData.therapeutic.procedures.filter((_, i) => i !== idx);
                      setFormData(prev => ({
                        ...prev,
                        therapeutic: { ...prev.therapeutic, procedures: updated }
                      }));
                    }}
                    className="text-red-500 p-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    therapeutic: {
                      ...prev.therapeutic,
                      procedures: [...prev.therapeutic.procedures, { type: '', site: '', details: '' }]
                    }
                  }));
                }}
                className="btn-secondary text-sm w-full"
              >
                <Plus size={16} /> Add Procedure
              </button>
            </div>
          )}
        </div>

        {/* ✅ SECTION 7: COMPLICATIONS */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="checkbox"
              checked={formData.complications.occurred}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                complications: { ...prev.complications, occurred: e.target.checked }
              }))}
              className="w-5 h-5"
            />
            <h2 className="text-lg font-bold text-red-600">Complications</h2>
          </div>

          {formData.complications.occurred && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['Bleeding', 'Perforation', 'Hypoxia', 'Hypotension', 'Arrhythmia', 'Aspiration'].map(comp => (
                  <label key={comp} className="flex items-center gap-2 p-2 border rounded hover:bg-red-50">
                    <input
                      type="checkbox"
                      checked={formData.complications.types.includes(comp)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...formData.complications.types, comp]
                          : formData.complications.types.filter(c => c !== comp);
                        setFormData(prev => ({
                          ...prev,
                          complications: { ...prev.complications, types: updated }
                        }));
                      }}
                    />
                    <span className="font-semibold">{comp}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="label">Management</label>
                <textarea
                  value={formData.complications.management}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    complications: { ...prev.complications, management: e.target.value }
                  }))}
                  className="input-field"
                  rows={3}
                  placeholder="Describe management..."
                />
              </div>
            </div>
          )}
        </div>

        {/* ✅ SECTION 8: IMAGES */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Camera size={20} className="text-blue-600" />
            Procedure Images
          </h2>
          
          <EndoCamera 
            patientInfo={currentPatient}
            onCapture={(file, tag) => {
              setImages(prev => [...prev, { 
                file, 
                preview: URL.createObjectURL(file),
                taggedOrgan: tag,
                caption: ''
              }]);
            }}
          />

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              {images.map((img, idx) => (
                <div key={idx} className="relative border rounded-lg p-2">
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10"
                  >
                    <X size={12} />
                  </button>
                  <img src={img.preview} className="w-full h-32 object-cover rounded" alt="" />
                  <div className="text-xs text-gray-600 mt-1 font-semibold">{img.taggedOrgan || 'Untagged'}</div>
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
        </div>

        {/* ✅ SECTION 9: IMPRESSION */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Final Impression</h2>
          <textarea
            value={formData.customImpression}
            onChange={(e) => setFormData(prev => ({ ...prev, customImpression: e.target.value }))}
            className="input-field font-semibold"
            rows={6}
            placeholder="Auto-generated or type manually..."
          />
        </div>

        {/* ✅ SECTION 10: RECOMMENDATIONS */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Recommendations</label>
              <textarea
                value={formData.recommendations}
                onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                className="input-field"
                rows={4}
                placeholder="Follow-up instructions..."
              />
            </div>

            <div>
              <label className="label">Follow-up</label>
              <input
                type="text"
                value={formData.followUp}
                onChange={(e) => setFormData(prev => ({ ...prev, followUp: e.target.value }))}
                className="input-field"
                placeholder="e.g., Repeat in 3 months"
              />
              
              <label className="label mt-4">Comments</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                className="input-field"
                rows={2}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ✅ FINDINGS PANEL (SIDE MODAL) */}
{showFindingsPanel && selectedOrgan && (() => {
  // ✅ FIX: Find the procedure type from the selected procedure name
  const selectedProcedure = settings?.procedures?.find(p => p.name === formData.procedureName);
  const procedureType = selectedProcedure?.type || 'EGD'; // Default to EGD
  const libraryForType = clinicalLibrary[procedureType] || [];
  
  console.log("Selected Procedure:", formData.procedureName);
  console.log("Procedure Type:", procedureType);
  console.log("Library for type:", libraryForType);
  
  return (
    <FindingsPanel
      organ={selectedOrgan}
      library={libraryForType}  // ✅ CORRECT: Pass the array for this procedure type
      onAddFinding={addFinding}
      onClose={() => setShowFindingsPanel(false)}
    />
  );
})()}
    </div>
  );
};

export default CreateReport;