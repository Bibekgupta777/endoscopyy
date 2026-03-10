import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  ArrowLeft, User, Calendar, Phone, MapPin,
  Image as ImageIcon, FileText, Trash2, Edit,
  ChevronRight, Plus, Stethoscope, Hash,
  Download, X, Maximize2, ArrowRight, AlertCircle,
  Eye, FilePlus, Loader2, ChevronLeft, ZoomIn,
  Shield, ImageOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   IMAGE URL BUILDER — matches PrintReport's working version exactly
   ═══════════════════════════════════════════════════════════════════ */
const getImageURL = (imagePath) => {
  if (!imagePath) return '';

  // Already a full URL or data URI — use as-is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Normalize slashes and strip leading slash
  let cleaned = imagePath.replace(/\\/g, '/').replace(/^\//, '');

  // Build base URL (strip trailing /api or /api/)
  let baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');

  // ✅ THE CRITICAL FIX: ensure uploads/ prefix exists
  if (!cleaned.startsWith('uploads/')) {
    cleaned = `uploads/${cleaned}`;
  }

  return `${baseURL}/${cleaned}`;
};

/* ═══════════════════════════════════════════════════════════════════
   SAFE IMAGE — shows fallback on load error
   ═══════════════════════════════════════════════════════════════════ */
const SafeImage = ({ src, alt, className, onClick, style }) => {
  const [status, setStatus] = useState('loading'); // loading | loaded | error

  useEffect(() => {
    setStatus('loading');
  }, [src]);

  if (!src || status === 'error') {
    return (
      <div
        className={clsx(
          className,
          'flex flex-col items-center justify-center bg-slate-100 text-slate-300'
        )}
        onClick={onClick}
        style={style}
      >
        <ImageOff size={20} />
        <span className="text-[9px] mt-1 text-slate-400">Unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" onClick={onClick} style={style}>
      {status === 'loading' && (
        <div
          className={clsx(
            className,
            'absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center'
          )}
        >
          <Loader2 size={16} className="animate-spin text-slate-300" />
        </div>
      )}
      <img
        src={src}
        alt={alt || ''}
        className={clsx(className, status === 'loading' && 'opacity-0')}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => {
          console.error('❌ Image failed to load:', src);
          setStatus('error');
        }}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   LIGHTBOX
   ═══════════════════════════════════════════════════════════════════ */
const Lightbox = ({ image, images = [], onClose, onNavigate }) => {
  if (!image) return null;

  const imageUrl = getImageURL(image.path);
  const currentIndex = images.findIndex((i) => i.path === image.path);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(images[currentIndex - 1]);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(images[currentIndex + 1]);
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [currentIndex, hasPrev, hasNext, images, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <span className="text-white/50 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium backdrop-blur-sm transition-all border border-white/10"
          >
            <Download size={16} /> Download
          </a>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(images[currentIndex - 1]);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all border border-white/10 backdrop-blur-sm z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(images[currentIndex + 1]);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all border border-white/10 backdrop-blur-sm z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={image.caption || 'Medical image'}
          className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Info */}
      <div className="mt-6 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-white font-semibold text-lg">
          {image.taggedOrgan || 'Untagged'}
        </p>
        <p className="text-white/50 text-sm mt-1">
          {image.caption || 'No caption'} · {image.procedureName} ·{' '}
          {new Date(image.procedureDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   DELETE MODAL
   ═══════════════════════════════════════════════════════════════════ */
const DeleteConfirmModal = ({ patientName, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">Delete Patient</h3>
      <p className="text-gray-500 text-sm mt-2 leading-relaxed">
        This will permanently delete{' '}
        <strong className="text-gray-700">{patientName}</strong>, all reports,
        and all images. This cannot be undone.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-white font-semibold bg-red-600 hover:bg-red-700 rounded-xl transition-colors text-sm shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SKELETONS
   ═══════════════════════════════════════════════════════════════════ */
const PageSkeleton = () => (
  <div className="min-h-screen bg-slate-50/50">
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-10">
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-4 w-28 bg-white/10 rounded-lg mb-8" />
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white/10 rounded-2xl" />
          <div className="space-y-3 flex-1">
            <div className="h-8 w-56 bg-white/10 rounded-lg" />
            <div className="h-4 w-80 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
          >
            <div className="h-3 w-20 bg-slate-100 rounded mb-3" />
            <div className="h-8 w-12 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const NotFoundState = ({ navigate }) => (
  <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6">
    <div className="text-center max-w-sm">
      <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
        <User size={36} className="text-red-300" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Patient Not Found</h2>
      <p className="text-gray-400 text-sm mt-2">
        This patient doesn't exist or may have been deleted.
      </p>
      <button
        onClick={() => navigate('/patients')}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
      >
        <ArrowLeft size={16} /> Back to Patients
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
const StatCard = ({ icon: Icon, label, value, color }) => {
  const styles = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      bar: 'from-indigo-500 to-indigo-600',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      bar: 'from-purple-500 to-purple-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      bar: 'from-emerald-500 to-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      bar: 'from-amber-500 to-orange-500',
    },
  };
  const s = styles[color] || styles.indigo;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group hover:shadow-md hover:border-gray-200 transition-all duration-300 relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.bar} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {value}
          </p>
        </div>
        <div
          className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}
        >
          <Icon size={20} className={s.text} />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const finalized = status === 'finalized';
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
        finalized
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full',
          finalized ? 'bg-emerald-500' : 'bg-amber-500'
        )}
      />
      {status}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="py-16 flex flex-col items-center justify-center text-center">
    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-5">
      <Icon size={36} strokeWidth={1.5} className="text-slate-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    <p className="text-slate-400 text-sm mt-1.5 max-w-sm">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
      >
        <Plus size={16} /> {action.label}
      </button>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN: PatientDetails
   ═══════════════════════════════════════════════════════════════════ */
const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('gallery');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filterOrgan, setFilterOrgan] = useState('all');

  // DEBUG: Log a sample image URL on mount
  useEffect(() => {
    if (reports.length > 0) {
      const sampleImg = reports.find((r) => r.images?.length > 0)?.images?.[0];
      if (sampleImg) {
        const url = getImageURL(sampleImg.path);
        console.log('🔍 DEBUG — Sample image path:', sampleImg.path);
        console.log('🔍 DEBUG — Built URL:', url);
        console.log('🔍 DEBUG — VITE_API_URL:', import.meta.env.VITE_API_URL);
      }
    }
  }, [reports]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [patientRes, reportsRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/reports?patient=${id}&limit=100`),
        ]);
        setPatient(patientRes.data);
        setReports(reportsRes.data.reports || []);
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDeletePatient = async () => {
    setDeleting(true);
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient and all records deleted');
      navigate('/patients');
    } catch {
      toast.error('Delete failed');
      setDeleting(false);
    }
  };

  /* Collect every image from every report */
  const galleryImages = useMemo(() => {
    const all = [];
    reports.forEach((r) => {
      (r.images || []).forEach((img) => {
        all.push({
          ...img,
          procedureDate: r.procedureDate,
          procedureName: r.procedureName,
          reportId: r._id,
        });
      });
    });
    return all.sort(
      (a, b) => new Date(b.procedureDate) - new Date(a.procedureDate)
    );
  }, [reports]);

  const organs = useMemo(
    () => [
      ...new Set(galleryImages.map((i) => i.taggedOrgan).filter(Boolean)),
    ],
    [galleryImages]
  );

  const filteredImages = useMemo(
    () =>
      filterOrgan === 'all'
        ? galleryImages
        : galleryImages.filter((i) => i.taggedOrgan === filterOrgan),
    [galleryImages, filterOrgan]
  );

  const groupedByDate = useMemo(() => {
    const map = {};
    filteredImages.forEach((img) => {
      const key = new Date(img.procedureDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      (map[key] ||= []).push(img);
    });
    return map;
  }, [filteredImages]);

  const getInitials = (name) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  if (loading) return <PageSkeleton />;
  if (!patient) return <NotFoundState navigate={navigate} />;

  const totalImages = galleryImages.length;
  const totalReports = reports.length;
  const finalizedReports = reports.filter(
    (r) => r.status === 'finalized'
  ).length;
  const draftReports = totalReports - finalizedReports;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Lightbox */}
      {selectedImage && (
        <Lightbox
          image={selectedImage}
          images={filteredImages}
          onClose={() => setSelectedImage(null)}
          onNavigate={setSelectedImage}
        />
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          patientName={patient.name}
          onConfirm={handleDeletePatient}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
        />
      )}

      {/* ═══════ HERO HEADER ═══════ */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-6 pb-4">
            <button
              onClick={() => navigate('/patients')}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
              Back to Patients
            </button>
          </div>

          <div className="pb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/30 flex-shrink-0">
                {getInitials(patient.name)}
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {patient.name}
                </h1>
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2">
                  {[
                    { icon: User, text: `${patient.age}Y / ${patient.sex}` },
                    { icon: Hash, text: patient.patientId },
                    patient.phone && { icon: Phone, text: patient.phone },
                    patient.address && { icon: MapPin, text: patient.address },
                    {
                      icon: Calendar,
                      text: `Registered ${new Date(
                        patient.createdAt
                      ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`,
                    },
                  ]
                    .filter(Boolean)
                    .map((item, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 text-slate-300 text-sm"
                      >
                        <item.icon size={14} className="text-slate-500" />
                        {item.text}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-red-300 rounded-xl border border-white/10 hover:bg-red-500/20 hover:text-red-200 transition-all text-sm font-medium backdrop-blur-sm"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                onClick={() =>
                  navigate(`/reports/new?patient=${patient._id}`)
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/25 text-sm font-semibold group"
              >
                <FilePlus size={16} />
                New Report
                <ArrowRight
                  size={14}
                  className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ImageIcon}
            label="Images"
            value={totalImages}
            color="indigo"
          />
          <StatCard
            icon={FileText}
            label="Reports"
            value={totalReports}
            color="purple"
          />
          <StatCard
            icon={Shield}
            label="Finalized"
            value={finalizedReports}
            color="emerald"
          />
          <StatCard
            icon={Edit}
            label="Drafts"
            value={draftReports}
            color="amber"
          />
        </div>
      </div>

      {/* ═══════ TABS + CONTENT ═══════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="px-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex gap-1">
              {[
                {
                  key: 'gallery',
                  icon: ImageIcon,
                  label: 'Media Gallery',
                  count: totalImages,
                },
                {
                  key: 'reports',
                  icon: FileText,
                  label: 'Reports',
                  count: totalReports,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    'relative flex items-center gap-2 px-4 py-4 text-sm font-semibold transition-all',
                    activeTab === tab.key
                      ? 'text-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  <tab.icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span
                    className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-bold tabular-nums',
                      activeTab === tab.key
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {tab.count}
                  </span>
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'gallery' && organs.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                  Filter
                </span>
                <select
                  value={filterOrgan}
                  onChange={(e) => setFilterOrgan(e.target.value)}
                  className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 cursor-pointer"
                >
                  <option value="all">All Organs</option>
                  {organs.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6">
            {/* GALLERY */}
            {activeTab === 'gallery' &&
              (filteredImages.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="No images found"
                  description={
                    filterOrgan !== 'all'
                      ? `No images tagged as "${filterOrgan}".`
                      : 'Create a report and capture images to see them here.'
                  }
                  action={
                    filterOrgan !== 'all'
                      ? {
                          label: 'Clear Filter',
                          onClick: () => setFilterOrgan('all'),
                        }
                      : {
                          label: 'Create Report',
                          onClick: () =>
                            navigate(
                              `/reports/new?patient=${patient._id}`
                            ),
                        }
                  }
                />
              ) : (
                <div className="space-y-10">
                  {Object.entries(groupedByDate).map(([date, images]) => (
                    <div key={date}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                          <Calendar size={14} className="text-indigo-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-700">
                          {date}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {images.length} image
                          {images.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {images.map((img, idx) => {
                          const url = getImageURL(img.path);
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedImage(img)}
                              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer ring-1 ring-slate-200 hover:ring-indigo-300 hover:shadow-xl transition-all duration-300 bg-slate-100"
                            >
                              <SafeImage
                                src={url}
                                alt={
                                  img.caption ||
                                  img.taggedOrgan ||
                                  'Image'
                                }
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />

                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                <p className="text-white text-xs font-bold truncate">
                                  {img.taggedOrgan || 'Untagged'}
                                </p>
                                <p className="text-white/60 text-[10px] truncate mt-0.5">
                                  {img.procedureName}
                                </p>
                              </div>

                              {/* Zoom icon */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 pointer-events-none">
                                <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-lg text-white border border-white/20">
                                  <ZoomIn size={12} />
                                </div>
                              </div>

                              {/* Organ tag */}
                              {img.taggedOrgan && (
                                <div className="absolute top-2 left-2 pointer-events-none">
                                  <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-md border border-white/10 uppercase tracking-wider">
                                    {img.taggedOrgan}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* REPORTS */}
            {activeTab === 'reports' &&
              (reports.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No reports yet"
                  description="Create your first report for this patient."
                  action={{
                    label: 'Create Report',
                    onClick: () =>
                      navigate(`/reports/new?patient=${patient._id}`),
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {[...reports]
                    .sort(
                      (a, b) =>
                        new Date(b.procedureDate) -
                        new Date(a.procedureDate)
                    )
                    .map((rep) => (
                      <div
                        key={rep._id}
                        className="group bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all duration-200"
                      >
                        <div className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
                            <Stethoscope
                              size={20}
                              className="text-indigo-600"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <p className="font-semibold text-slate-900 text-sm truncate">
                                {rep.procedureName}
                              </p>
                              <StatusBadge status={rep.status} />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(
                                  rep.procedureDate
                                ).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              {rep.images?.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <ImageIcon size={12} />
                                  {rep.images.length} image
                                  {rep.images.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {rep.status !== 'finalized' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/reports/${rep._id}/edit`);
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                navigate(`/reports/${rep._id}/print`)
                              }
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-indigo-600 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all opacity-60 group-hover:opacity-100"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">
                                View
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Thumbnail strip */}
                        {rep.images?.length > 0 && (
                          <div className="px-5 pb-4 flex gap-2 overflow-x-auto">
                            {rep.images.slice(0, 6).map((img, i) => (
                              <SafeImage
                                key={i}
                                src={getImageURL(img.path)}
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-200 flex-shrink-0 hover:ring-indigo-300 cursor-pointer transition-all hover:scale-105"
                                onClick={() => {
                                  setSelectedImage({
                                    ...img,
                                    procedureDate: rep.procedureDate,
                                    procedureName: rep.procedureName,
                                    reportId: rep._id,
                                  });
                                  setActiveTab('gallery');
                                }}
                              />
                            ))}
                            {rep.images.length > 6 && (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 ring-1 ring-slate-200">
                                +{rep.images.length - 6}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;