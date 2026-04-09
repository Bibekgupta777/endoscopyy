import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageURL } from '../../utils/api';
import {
  Search, Plus, User, Phone, Calendar, ArrowRight,
  Edit, Trash2, X, MoreVertical, FilePlus, Image as ImageIcon,
  MapPin, FileText, ExternalLink, Maximize2, Download,
  ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc,
  Clock, Hash, Activity, Eye, ZoomIn, ChevronDown,
  UserPlus, AlertCircle, CheckCircle, Loader2, ArrowUpDown,
  Stethoscope, Users, CalendarDays, Clipboard, BadgeCheck,
  CircleDot, LayoutList, CalendarRange, SlidersHorizontal,
  MessageCircle, Printer, FileSpreadsheet, Keyboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ✅ Safe Navigation Hook
const useSafeNavigate = () => {
  try {
    return useNavigate();
  } catch (e) {
    console.error('useNavigate error:', e);
    return (path) => {
      try {
        window.location.hash = `#${path}`;
      } catch (navError) {
        console.error('Navigation failed:', navError);
      }
    };
  }
};

/* ═══════════════════════════════════════════════════════════════════
   ✅ PAGINATION CONSTANT
   ═══════════════════════════════════════════════════════════════════ */
const PATIENTS_PER_PAGE = 20;

/* ═══════════════════════════════════════════════════════════════════
   ✅ EXPORT TO CSV UTILITY (Crash-proof)
   ═══════════════════════════════════════════════════════════════════ */
const exportToCSV = (patients, filename) => {
  try {
    if (!patients || !Array.isArray(patients) || patients.length === 0) {
      toast.error('No patients to export');
      return;
    }

    const headers = [
      'S.No',
      'Name',
      'Age',
      'Sex',
      'Bill Number',
      'Patient ID',
      'Phone',
      'Address',
      'Procedure Type',
      'Indication',
      'Referred By',
      'Performed By',
      'Remarks',
      'Registration Date',
      'Registration Time'
    ];

    const rows = patients.map((patient, index) => {
      try {
        const regDate = patient.createdAt ? new Date(patient.createdAt) : null;
        return [
          index + 1,
          (patient.name || '').replace(/,/g, ' '),
          patient.age || '',
          patient.sex || '',
          (patient.billNumber || '').replace(/,/g, ' '),
          (patient.idNumber || '').replace(/,/g, ' '),
          (patient.phone || '').replace(/,/g, ' '),
          (patient.address || '').replace(/,/g, ' '),
          (patient.procedureType || '').replace(/,/g, ' '),
          (patient.indication || '').replace(/,/g, ' '),
          (patient.referredDoc || '').replace(/,/g, ' '),
          (patient.doneDoc || '').replace(/,/g, ' '),
          (patient.remark || '').replace(/,/g, ' ').replace(/\n/g, ' '),
          regDate ? regDate.toLocaleDateString('en-US') : '',
          regDate ? regDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
        ];
      } catch (rowErr) {
        console.error('CSV row error:', rowErr);
        return [index + 1, patient.name || 'Unknown', '', '', '', '', '', '', '', '', '', '', '', '', ''];
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename || 'patients.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      URL.revokeObjectURL(url);
    } catch (_) {}

    toast.success(`Exported ${patients.length} patients to CSV`);
  } catch (err) {
    console.error('Export CSV error:', err);
    toast.error('Failed to export CSV');
  }
};

/* ═══════════════════════════════════════════════════════════════════
   ✅ PRINT UTILITY (Crash-proof)
   ═══════════════════════════════════════════════════════════════════ */
const printPatientList = (groupedData, filterInfo) => {
  try {
    if (!groupedData || groupedData.length === 0) {
      toast.error('No patients to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    let totalPatients = 0;
    try {
      totalPatients = groupedData.reduce((acc, g) => acc + (g.patients?.length || 0), 0);
    } catch (_) {}

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient List</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header h1 { font-size: 18px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 11px; }
          .filter-info { background: #f5f5f5; padding: 8px 12px; margin-bottom: 15px; border-radius: 4px; font-size: 11px; }
          .date-group { margin-bottom: 20px; }
          .date-header { background: #e8e8e8; padding: 6px 10px; font-weight: bold; margin-bottom: 8px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; font-size: 10px; }
          td { font-size: 11px; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Patient List</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Total Patients: ${totalPatients}</p>
        </div>
        ${filterInfo ? `<div class="filter-info">${filterInfo}</div>` : ''}
        ${groupedData.map(group => {
          try {
            return `
              <div class="date-group">
                <div class="date-header">${group.dateStr || 'Unknown Date'} (${group.patients?.length || 0} patients)</div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Age/Sex</th>
                      <th>Bill No</th>
                      <th>Phone</th>
                      <th>Procedure</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(group.patients || []).map((p, i) => {
                      try {
                        const time = p.createdAt ? new Date(p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
                        return `
                          <tr>
                            <td>${i + 1}</td>
                            <td>${p.name || '-'}</td>
                            <td>${p.age || '-'}Y / ${p.sex || '-'}</td>
                            <td>${p.billNumber || '-'}</td>
                            <td>${p.phone || '-'}</td>
                            <td>${p.procedureType || '-'}</td>
                            <td>${time}</td>
                          </tr>
                        `;
                      } catch (_) {
                        return '<tr><td colspan="7">Error</td></tr>';
                      }
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;
          } catch (_) {
            return '';
          }
        }).join('')}
        <div class="footer">
          <p>Endoscopy Report System</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('Print error:', err);
    toast.error('Failed to print');
  }
};

/* ═══════════════════════════════════════════════════════════════════
   ✅ CLICK TO CONTACT COMPONENT (Crash-proof)
   ═══════════════════════════════════════════════════════════════════ */
const ContactButtons = ({ phone }) => {
  if (!phone) return null;

  const cleanPhone = (() => {
    try {
      return phone.replace(/[^0-9+]/g, '');
    } catch (_) {
      return '';
    }
  })();

  if (!cleanPhone) return null;

  const handleCall = (e) => {
    try {
      e.stopPropagation();
      window.location.href = `tel:${cleanPhone}`;
    } catch (err) {
      console.error('Call error:', err);
    }
  };

  const handleWhatsApp = (e) => {
    try {
      e.stopPropagation();
      const waNumber = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;
      window.open(`https://wa.me/${waNumber}`, '_blank');
    } catch (err) {
      console.error('WhatsApp error:', err);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 ml-1">
      <button
        onClick={handleCall}
        className="p-1 rounded-md text-blue-500 hover:bg-blue-50 transition-all"
        title="Call"
      >
        <Phone size={12} />
      </button>
      <button
        onClick={handleWhatsApp}
        className="p-1 rounded-md text-green-500 hover:bg-green-50 transition-all"
        title="WhatsApp"
      >
        <MessageCircle size={12} />
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ✅ KEYBOARD SHORTCUTS HELP MODAL (Crash-proof)
   ═══════════════════════════════════════════════════════════════════ */
const KeyboardShortcutsHelp = ({ onClose }) => {
  const shortcuts = [
    { key: 'N', description: 'Add New Patient' },
    { key: 'S or /', description: 'Focus Search' },
    { key: 'F', description: 'Toggle Filters' },
    { key: 'E', description: 'Export to CSV' },
    { key: 'P', description: 'Print List' },
    { key: 'Esc', description: 'Close Modals' },
    { key: '?', description: 'Show Shortcuts' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard size={20} className="text-white" />
            <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
              <span className="text-sm text-slate-600">{s.description}</span>
              <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">Press any key to close</p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   AUTOCOMPLETE INPUT
   ═══════════════════════════════════════════════════════════════════ */
const AutocompleteInput = ({ value, onChange, storageKey, placeholder, className, required }) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`endo_${storageKey}`) || '[]');
      setSuggestions(Array.isArray(saved) ? saved : []);
    } catch {
      setSuggestions([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      try {
        if (!ref.current?.contains(e.target)) setOpen(false);
      } catch (_) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      try {
        document.removeEventListener('mousedown', handler);
      } catch (_) {}
    };
  }, [open]);

  const filtered = suggestions.filter(s => {
    try {
      return s.toLowerCase().includes((value || '').toLowerCase()) &&
        s.toLowerCase() !== (value || '').toLowerCase();
    } catch {
      return false;
    }
  });

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const handleDelete = (e, val) => {
    e.stopPropagation();
    try {
      const updated = suggestions.filter(s => s !== val);
      setSuggestions(updated);
      localStorage.setItem(`endo_${storageKey}`, JSON.stringify(updated));
      toast.success(`Removed "${val}"`, { duration: 1500 });
    } catch (err) {
      console.error('Failed to delete suggestion:', err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        className={className || "w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm outline-none focus:bg-blue-50/30 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-md focus:shadow-blue-500/10 transition-all duration-200"}
      />
      {open && (filtered.length > 0 || (suggestions.length > 0 && !value)) && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/50 max-h-48 overflow-y-auto">
          {(value ? filtered : suggestions).slice(0, 15).map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3.5 py-2.5 hover:bg-blue-50 cursor-pointer group border-b border-slate-50 last:border-0 transition-colors"
            >
              <span
                onClick={() => handleSelect(s)}
                className="flex-1 text-sm text-slate-700 font-medium truncate"
              >
                {s}
              </span>
              <button
                onClick={(e) => handleDelete(e, s)}
                className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2"
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {value && filtered.length === 0 && suggestions.length > 0 && (
            <div className="px-3.5 py-2.5 text-xs text-slate-400 text-center">
              No matches — will be saved as new
            </div>
          )}
        </div>
      )}
    </div>
  );
};

AutocompleteInput.save = (key, val) => {
  if (!val || !val.trim()) return;
  const trimmed = val.trim();
  try {
    const existing = JSON.parse(localStorage.getItem(`endo_${key}`) || '[]');
    if (!existing.includes(trimmed)) {
      const updated = [trimmed, ...existing].slice(0, 50);
      localStorage.setItem(`endo_${key}`, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('AutocompleteInput.save error:', e);
  }
};

/* ═══════════════════════════════════════════════════════════════════
   LIGHTBOX
   ═══════════════════════════════════════════════════════════════════ */
const Lightbox = ({ image, onClose, images, onNavigate }) => {
  if (!image) return null;

  let imageUrl = '';
  try {
    imageUrl = getImageURL(image.path);
  } catch (_) {}

  const currentIndex = (() => {
    try {
      return images?.findIndex(i => i.path === image.path) ?? -1;
    } catch {
      return -1;
    }
  })();

  useEffect(() => {
    const handler = (e) => {
      try {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(images[currentIndex - 1]);
        if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(images[currentIndex + 1]);
      } catch (_) {}
    };
    document.addEventListener('keydown', handler);
    try {
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    return () => {
      try {
        document.removeEventListener('keydown', handler);
      } catch (_) {}
      try {
        document.body.style.overflow = '';
      } catch (_) {}
    };
  }, [currentIndex, images, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 flex items-center justify-between px-8">
        <div className="text-white/60 text-sm font-medium tracking-wide">
          {currentIndex >= 0 && (
            <span className="bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
              {currentIndex + 1} <span className="text-white/40">of</span> {images?.length || 0}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300"
            title="Download"
          >
            <Download size={18} />
          </a>
          <button
            onClick={onClose}
            className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {currentIndex > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex - 1]); }}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {Array.isArray(images) && currentIndex < images.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex + 1]); }}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <div className="relative max-w-[88vw] max-h-[78vh]" onClick={e => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt={image.caption || 'Medical image'}
          className="max-w-full max-h-[78vh] rounded-2xl shadow-2xl shadow-black/50 object-contain select-none ring-1 ring-white/10"
          draggable={false}
        />
      </div>

      <div className="mt-8 text-center text-white px-6" onClick={e => e.stopPropagation()}>
        <p className="font-semibold text-lg tracking-tight">{image.taggedOrgan || 'Untagged'}</p>
        <p className="text-white/40 text-sm mt-1.5 font-medium">
          {image.caption || 'No caption'} &middot; {(() => {
            try {
              return new Date(image.procedureDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            } catch {
              return 'N/A';
            }
          })()}
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SKELETONS
   ═══════════════════════════════════════════════════════════════════ */
const GallerySkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {[...Array(10)].map((_, i) => (
      <div
        key={i}
        className="aspect-square bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 rounded-2xl animate-pulse"
        style={{ animationDelay: `${i * 80}ms` }}
      />
    ))}
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-0">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 px-6 py-4 border-b border-slate-100/60 animate-pulse"
        style={{ animationDelay: `${i * 80}ms` }}
      >
        <div className="w-7 h-7 bg-slate-100 rounded-lg shrink-0" />
        <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
          <div className="h-3 bg-slate-50 rounded-lg w-1/5" />
        </div>
        <div className="h-4 bg-slate-50 rounded-lg w-20 hidden sm:block" />
        <div className="h-4 bg-slate-50 rounded-lg w-24 hidden sm:block" />
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   PATIENT GALLERY MODAL
   ═══════════════════════════════════════════════════════════════════ */
const PatientGalleryModal = ({ patient, onClose }) => {
  const navigate = useSafeNavigate();
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('gallery');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    try {
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    return () => {
      try {
        document.body.style.overflow = '';
      } catch (_) {}
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/reports?patient=${patient._id}&limit=100`);
        setReports(data?.reports || []);
      } catch (error) {
        console.error('Failed to load reports:', error);
        toast.error('Failed to load history');
        setReports([]);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    })();
  }, [patient._id]);

  const galleryImages = React.useMemo(() => {
    try {
      const all = [];
      reports.forEach(r => {
        (r.images || []).forEach(img => {
          if (img) {
            all.push({
              ...img,
              procedureDate: r.procedureDate,
              procedureName: r.procedureName,
              reportId: r._id
            });
          }
        });
      });
      return all.sort((a, b) => {
        try {
          return new Date(b.procedureDate) - new Date(a.procedureDate);
        } catch {
          return 0;
        }
      });
    } catch (e) {
      console.error('Gallery images error:', e);
      return [];
    }
  }, [reports]);

  const safeNavigate = (path) => {
    try {
      navigate(path);
    } catch (e) {
      window.location.hash = `#${path}`;
    }
  };

  const getInitials = (n) => {
    try {
      if (!n || typeof n !== 'string') return '?';
      return n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    } catch {
      return '?';
    }
  };

  return (
    <>
      {selectedImage && (
        <Lightbox
          image={selectedImage}
          images={galleryImages}
          onClose={() => setSelectedImage(null)}
          onNavigate={setSelectedImage}
        />
      )}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full h-full sm:h-[92vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">

          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-7 text-white shrink-0 overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white/20 flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30">
                  {getInitials(patient.name)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{patient.name}</h2>
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm">
                      <User size={12} /> {patient.age}Y / {patient.sex}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-mono backdrop-blur-sm">
                      <Hash size={12} /> {patient.billNumber || 'No Bill No'}
                    </span>
                    {patient.phone && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm">
                        <Phone size={12} /> {patient.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.06] rounded-2xl transition-all duration-300"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 bg-white border-b border-slate-200/80 shrink-0">
            <div className="flex gap-2">
              {[
                { id: 'gallery', label: 'Gallery', icon: ImageIcon, count: galleryImages.length },
                { id: 'reports', label: 'Reports', icon: FileText, count: reports.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'relative flex items-center gap-2.5 px-5 py-4 text-sm font-semibold transition-all duration-300',
                    activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  <tab.icon size={16} />{tab.label}
                  <span className={clsx(
                    'text-[11px] min-w-[28px] text-center px-2 py-0.5 rounded-full font-bold tabular-nums',
                    activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {tab.count}
                  </span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gradient-to-b from-slate-50/80 to-white">
            {loading ? (
              activeTab === 'gallery' ? <GallerySkeleton /> : <TableSkeleton />
            ) : (
              <>
                {activeTab === 'gallery' && (
                  galleryImages.length === 0 ? (
                    <div className="h-72 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                        <ImageIcon size={40} strokeWidth={1.5} className="text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-700 text-lg">No images yet</p>
                      <p className="text-sm mt-1.5 text-slate-400">Images from reports will appear here</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {galleryImages.map((img, idx) => {
                        let imgUrl = '';
                        try {
                          imgUrl = getImageURL(img.path);
                        } catch (_) {}

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedImage(img)}
                            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-100 ring-1 ring-black/[0.06] hover:ring-2 hover:ring-blue-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
                          >
                            <img
                              src={imgUrl}
                              className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
                              alt={img.caption}
                              loading="lazy"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400">
                              <p className="text-white text-sm font-bold truncate">{img.taggedOrgan || 'Untagged'}</p>
                              <p className="text-white/50 text-xs mt-1 font-medium">
                                {(() => {
                                  try {
                                    return new Date(img.procedureDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    });
                                  } catch {
                                    return 'N/A';
                                  }
                                })()}
                              </p>
                            </div>
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                              <div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-xl text-white border border-white/10">
                                <ZoomIn size={15} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {activeTab === 'reports' && (
                  reports.length === 0 ? (
                    <div className="h-72 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                        <FileText size={40} strokeWidth={1.5} className="text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-700 text-lg">No reports found</p>
                      <p className="text-sm mt-1.5 text-slate-400">Create a report to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map(rep => (
                        <div
                          key={rep._id}
                          onClick={() => safeNavigate(`/reports/${rep._id}/print`)}
                          className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200/80 p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/[0.06] hover:-translate-y-0.5"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-blue-50 group-hover:to-blue-100 flex items-center justify-center transition-all duration-300 border border-slate-200/60 group-hover:border-blue-200/60">
                            <FileText size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate text-[15px]">{rep.procedureName}</p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
                              <Calendar size={12} />
                              {(() => {
                                try {
                                  return new Date(rep.procedureDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  });
                                } catch {
                                  return 'N/A';
                                }
                              })()}
                              {Array.isArray(rep.images) && rep.images.length > 0 && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <ImageIcon size={12} />{rep.images.length} image{rep.images.length > 1 ? 's' : ''}
                                </>
                              )}
                            </p>
                          </div>
                          <span className={clsx(
                            'hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border',
                            rep.status === 'finalized'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                              : 'bg-amber-50 text-amber-600 border-amber-200/60'
                          )}>
                            {rep.status}
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-all duration-300">
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-slate-200/80 px-8 py-5 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              Close
            </button>
            <button
              onClick={() => safeNavigate(`/reports/new?patient=${patient._id}`)}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97]"
            >
              <FilePlus size={17} /> New Report
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MOBILE ACTION MENU
   ═══════════════════════════════════════════════════════════════════ */
const MobileActions = ({ onEdit, onDelete, onCreateReport, onViewGallery }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      try {
        if (!ref.current?.contains(e.target)) setOpen(false);
      } catch (_) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => {
      try {
        document.removeEventListener('mousedown', close);
      } catch (_) {}
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={clsx(
          'p-2 rounded-xl transition-all duration-200',
          open ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
        )}
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200/80 z-30 py-1.5 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <button
            onClick={() => { onCreateReport(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
          >
            <FilePlus size={15} className="text-blue-500" />Create Report
          </button>
          <button
            onClick={() => { onViewGallery(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-all"
          >
            <Eye size={15} className="text-violet-500" />View Profile
          </button>
          <div className="my-1.5 mx-3 border-t border-slate-100" />
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Edit size={15} className="text-slate-400" />Edit
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash2 size={15} className="text-red-400" />Delete
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN — PatientList
   ═══════════════════════════════════════════════════════════════════ */
const PatientList = () => {
  const navigate = useSafeNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [viewingPatient, setViewingPatient] = useState(null);

  const [filterSex, setFilterSex] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');
  const [filterProcedure, setFilterProcedure] = useState('');

  const [showShortcuts, setShowShortcuts] = useState(false);

  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('asc');
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '', age: '', sex: 'Male', phone: '', address: '',
    idNumber: '', billNumber: '',
    indication: '', referredDoc: '', doneDoc: '', remark: '',
    procedureType: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);

  const safeNavigate = (path) => {
    try {
      navigate(path);
    } catch (e) {
      window.location.hash = `#${path}`;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data || {});
      } catch (e) {
        console.error('Settings fetch failed:', e);
        setSettings({});
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPatients().catch(e => console.error('Fetch error:', e));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStartDate, filterEndDate, filterSex, filterAgeRange, filterProcedure, sortField, sortDir]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      try {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        if (showForm || viewingPatient || showShortcuts) {
          if (e.key === 'Escape') {
            e.preventDefault();
            if (showShortcuts) setShowShortcuts(false);
            else if (viewingPatient) setViewingPatient(null);
            else if (showForm) resetForm();
          }
          return;
        }

        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            resetForm();
            setShowForm(true);
            break;
          case 's':
          case '/':
            e.preventDefault();
            try {
              searchRef.current?.focus();
            } catch (_) {}
            break;
          case 'f':
            e.preventDefault();
            setShowFilters(f => !f);
            break;
          case 'e':
            e.preventDefault();
            handleExportCSV();
            break;
          case 'p':
            e.preventDefault();
            handlePrint();
            break;
          case '?':
            e.preventDefault();
            setShowShortcuts(true);
            break;
          case 'escape':
            e.preventDefault();
            setShowFilters(false);
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('Keyboard shortcut error:', err);
      }
    };

    try {
      document.addEventListener('keydown', handleKeyDown);
    } catch (_) {}

    return () => {
      try {
        document.removeEventListener('keydown', handleKeyDown);
      } catch (_) {}
    };
  }, [showForm, viewingPatient, showShortcuts]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/patients?search=${encodeURIComponent(search)}`);
      setPatients(data?.patients ?? []);
    } catch (error) {
      console.error('Fetch patients error:', error);
      toast.error('Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getDateLabel = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Unknown date';
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === today.toDateString()) return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const isToday = (dateStr) => {
    try {
      return new Date(dateStr).toDateString() === new Date().toDateString();
    } catch {
      return false;
    }
  };

  const todayCount = React.useMemo(() => {
    try {
      return patients.filter(p => {
        try {
          return new Date(p.createdAt).toDateString() === new Date().toDateString();
        } catch {
          return false;
        }
      }).length;
    } catch {
      return 0;
    }
  }, [patients]);

  const handleClearDateFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleClearAllFilters = () => {
    try {
      setSearch('');
      setFilterStartDate('');
      setFilterEndDate('');
      setFilterSex('');
      setFilterAgeRange('');
      setFilterProcedure('');
    } catch (err) {
      console.error('Clear filters error:', err);
    }
  };

  const activeFilters = [filterStartDate, filterEndDate, filterSex, filterAgeRange, filterProcedure].filter(Boolean).length;

  const uniqueProcedures = React.useMemo(() => {
    try {
      const procedures = new Set();
      patients.forEach(p => {
        if (p.procedureType && typeof p.procedureType === 'string') {
          procedures.add(p.procedureType.trim());
        }
      });
      return Array.from(procedures).sort();
    } catch (err) {
      console.error('Unique procedures error:', err);
      return [];
    }
  }, [patients]);

  const groupedByDate = React.useMemo(() => {
    try {
      const filteredPatients = patients.filter(patient => {
        try {
          if (filterStartDate || filterEndDate) {
            const pDate = new Date(patient.createdAt);
            if (isNaN(pDate.getTime())) return true;

            if (filterStartDate) {
              const start = new Date(filterStartDate);
              start.setHours(0, 0, 0, 0);
              if (pDate < start) return false;
            }

            if (filterEndDate) {
              const end = new Date(filterEndDate);
              end.setHours(23, 59, 59, 999);
              if (pDate > end) return false;
            }
          }

          if (filterSex) {
            if ((patient.sex || '').toLowerCase() !== filterSex.toLowerCase()) return false;
          }

          if (filterAgeRange) {
            const age = parseInt(patient.age) || 0;
            switch (filterAgeRange) {
              case '0-18':
                if (age > 18) return false;
                break;
              case '19-40':
                if (age < 19 || age > 40) return false;
                break;
              case '41-60':
                if (age < 41 || age > 60) return false;
                break;
              case '60+':
                if (age < 60) return false;
                break;
              default:
                break;
            }
          }

          if (filterProcedure) {
            if ((patient.procedureType || '').toLowerCase() !== filterProcedure.toLowerCase()) return false;
          }

          return true;
        } catch (filterErr) {
          console.error('Patient filter error:', filterErr);
          return true;
        }
      });

      const groups = {};
      filteredPatients.forEach(patient => {
        try {
          const dateKey = new Date(patient.createdAt).toDateString();
          if (!groups[dateKey]) groups[dateKey] = [];
          groups[dateKey].push(patient);
        } catch (e) {
          console.error('Date grouping error:', e);
        }
      });

      Object.values(groups).forEach(group => {
        group.sort((a, b) => {
          try {
            let av, bv;
            if (sortField === 'name') {
              av = (a.name || '').toLowerCase();
              bv = (b.name || '').toLowerCase();
            } else if (sortField === 'age') {
              av = parseInt(a.age) || 0;
              bv = parseInt(b.age) || 0;
            } else {
              av = new Date(a.createdAt);
              bv = new Date(b.createdAt);
            }
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
          } catch {
            return 0;
          }
        });
      });

      return Object.entries(groups)
        .map(([dateStr, pts]) => ({ dateStr, date: new Date(dateStr), patients: pts }))
        .sort((a, b) => b.date - a.date);
    } catch (e) {
      console.error('Grouping error:', e);
      return [];
    }
  }, [patients, sortField, sortDir, filterStartDate, filterEndDate, filterSex, filterAgeRange, filterProcedure]);

  const filteredPatientsCount = React.useMemo(() => {
    return groupedByDate.reduce((acc, group) => acc + group.patients.length, 0);
  }, [groupedByDate]);

  const allFilteredPatients = React.useMemo(() => {
    try {
      return groupedByDate.flatMap(g => g.patients || []);
    } catch (err) {
      console.error('Flat patients error:', err);
      return [];
    }
  }, [groupedByDate]);

  const totalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil(filteredPatientsCount / PATIENTS_PER_PAGE));
  }, [filteredPatientsCount]);

  const paginatedGroups = React.useMemo(() => {
    try {
      const allPatients = groupedByDate.flatMap(g =>
        (g.patients || []).map(p => ({
          ...p,
          _groupDateStr: g.dateStr,
          _groupDate: g.date
        }))
      );

      const start = (currentPage - 1) * PATIENTS_PER_PAGE;
      const end = start + PATIENTS_PER_PAGE;
      const pagePatients = allPatients.slice(start, end);

      const groups = {};
      pagePatients.forEach(patient => {
        const dateKey = patient._groupDateStr;
        if (!groups[dateKey]) {
          groups[dateKey] = {
            dateStr: dateKey,
            date: patient._groupDate,
            patients: []
          };
        }
        groups[dateKey].patients.push(patient);
      });

      return Object.values(groups).sort((a, b) => b.date - a.date);
    } catch (e) {
      console.error('Pagination error:', e);
      return groupedByDate;
    }
  }, [groupedByDate, currentPage]);

  const pageStartIndex = (currentPage - 1) * PATIENTS_PER_PAGE;

  const handleExportCSV = () => {
    try {
      const filename = `patients_${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(allFilteredPatients, filename);
    } catch (err) {
      console.error('Export handler error:', err);
      toast.error('Export failed');
    }
  };

  const handlePrint = () => {
    try {
      let filterInfo = '';
      const parts = [];
      if (search) parts.push(`Search: "${search}"`);
      if (filterStartDate || filterEndDate) {
        parts.push(`Date: ${formatDate(filterStartDate) || 'Start'} - ${formatDate(filterEndDate) || 'End'}`);
      }
      if (filterSex) parts.push(`Sex: ${filterSex}`);
      if (filterAgeRange) parts.push(`Age: ${filterAgeRange}`);
      if (filterProcedure) parts.push(`Procedure: ${filterProcedure}`);
      if (parts.length > 0) filterInfo = `Filters: ${parts.join(' | ')}`;

      printPatientList(groupedByDate, filterInfo);
    } catch (err) {
      console.error('Print handler error:', err);
      toast.error('Print failed');
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortDir === 'asc'
      ? <SortAsc size={12} className="text-blue-600" />
      : <SortDesc size={12} className="text-blue-600" />;
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
    } catch (_) {}

    if (!formData.name.trim()) return toast.error('Name is required');
    if (!formData.age || parseInt(formData.age) < 0) return toast.error('Valid age is required');

    setSubmitting(true);
    try {
      const birthYear = new Date().getFullYear() - parseInt(formData.age);
      const payload = { ...formData, dateOfBirth: new Date(birthYear, 0, 1) };

      if (editingPatient) {
        await api.put(`/patients/${editingPatient._id}`, payload);
        toast.success('Patient updated successfully');
      } else {
        await api.post('/patients', payload);
        toast.success('Patient added successfully');
      }

      try {
        AutocompleteInput.save('procedureType', formData.procedureType);
        AutocompleteInput.save('indication', formData.indication);
        AutocompleteInput.save('referredDoc', formData.referredDoc);
        AutocompleteInput.save('doneDoc', formData.doneDoc);
      } catch (acErr) {
        console.error('Autocomplete save error:', acErr);
      }

      resetForm();
      await fetchPatients();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return toast.error('Invalid patient ID');
    if (!window.confirm('Delete this patient and all their data? This cannot be undone.')) return;

    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      await fetchPatients();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleEdit = (patient) => {
    try {
      setEditingPatient(patient);
      const age = patient.dateOfBirth
        ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
        : patient.age || '';
      setFormData({
        name: patient.name || '',
        age,
        sex: patient.sex || 'Male',
        phone: patient.phone || '',
        address: patient.address || '',
        idNumber: patient.idNumber || '',
        billNumber: patient.billNumber || '',
        indication: patient.indication || '',
        referredDoc: patient.referredDoc || '',
        doneDoc: patient.doneDoc || '',
        remark: patient.remark || '',
        procedureType: patient.procedureType || ''
      });
      setShowForm(true);
    } catch (e) {
      console.error('Edit error:', e);
      toast.error('Failed to load patient data');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPatient(null);
    setFormData({
      name: '', age: '', sex: 'Male', phone: '', address: '',
      idNumber: '', billNumber: '',
      indication: '', referredDoc: '', doneDoc: '', remark: '',
      procedureType: ''
    });
  };

  const getInitials = (n) => {
    try {
      if (!n || typeof n !== 'string') return '?';
      return n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    } catch {
      return '?';
    }
  };

  const avatarColors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
    'from-indigo-500 to-violet-600',
  ];

  const getColorIndex = (name) => {
    try {
      if (!name) return 0;
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return Math.abs(hash) % avatarColors.length;
    } catch {
      return 0;
    }
  };

  const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-blue-50/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400";
  const labelCls = "text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block";

  const getPageNumbers = () => {
    try {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
      return pages;
    } catch (e) {
      console.error('Page numbers error:', e);
      return [1];
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* ✅ KEYBOARD SHORTCUTS MODAL */}
      {showShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}

      {/* ✅ FIXED HEADER + SEARCH SECTION */}
      <div className="shrink-0 bg-slate-100 px-4 sm:px-6 pt-4 space-y-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Users size={20} className="text-white" />
              </div>
              Patients
            </h1>
            {!loading && patients.length > 0 && (
              <div className="flex items-center gap-2 mt-3 ml-[52px]">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                  <Users size={12} className="text-slate-400" />{patients.length} total
                </span>
                <span className={clsx(
                  'inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border shadow-sm',
                  todayCount > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-400 border-slate-200'
                )}>
                  <CircleDot size={10} className={todayCount > 0 ? 'text-emerald-500 animate-pulse' : 'text-slate-300'} />
                  {todayCount} today
                </span>
              </div>
            )}
          </div>

          {/* HEADER BUTTONS */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              disabled={loading || allFilteredPatients.length === 0}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to CSV (E)"
            >
              <FileSpreadsheet size={16} />
              <span className="hidden lg:inline">Export</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={loading || groupedByDate.length === 0}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Print List (P)"
            >
              <Printer size={16} />
              <span className="hidden lg:inline">Print</span>
            </button>

            <button
              onClick={() => setShowShortcuts(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard size={16} />
            </button>

            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 hover:shadow-xl active:scale-[0.97]"
            >
              <Plus size={18} strokeWidth={2.5} /> Add Patient
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
            <Search className="text-slate-400 flex-shrink-0" size={20} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name, bill no, or phone… (Press S or /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none text-slate-800 bg-transparent placeholder-slate-400 text-sm"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            )}

            <div className="hidden sm:block w-px h-6 bg-slate-200" />

            {/* Mobile Export/Print Buttons */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={handleExportCSV}
                disabled={loading || allFilteredPatients.length === 0}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                title="Export CSV"
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                onClick={handlePrint}
                disabled={loading || groupedByDate.length === 0}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                title="Print"
              >
                <Printer size={16} />
              </button>
            </div>

            <button
              onClick={() => setShowFilters((f) => !f)}
              className={clsx(
                'p-2.5 rounded-xl border transition-all relative',
                showFilters || activeFilters > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              )}
            >
              <SlidersHorizontal size={16} />
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* EXPANDABLE FILTER SECTION */}
          <div
            className={clsx(
              'border-t border-slate-100 bg-slate-50/50 transition-all duration-300 overflow-hidden',
              showFilters ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="p-4 space-y-4">

              {/* SEX & AGE RANGE FILTERS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <User size={12} />
                    Filter by Sex
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {['', 'Male', 'Female', 'Other'].map((sex) => (
                      <button
                        key={sex || 'all'}
                        onClick={() => setFilterSex(sex)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          filterSex === sex
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                        )}
                      >
                        {sex || 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Hash size={12} />
                    Filter by Age
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { value: '', label: 'All' },
                      { value: '0-18', label: '0-18' },
                      { value: '19-40', label: '19-40' },
                      { value: '41-60', label: '41-60' },
                      { value: '60+', label: '60+' },
                    ].map((range) => (
                      <button
                        key={range.value || 'all'}
                        onClick={() => setFilterAgeRange(range.value)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          filterAgeRange === range.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PROCEDURE TYPE FILTER */}
              {uniqueProcedures.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Stethoscope size={12} />
                    Filter by Procedure
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setFilterProcedure('')}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        filterProcedure === ''
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                      )}
                    >
                      All
                    </button>
                    {uniqueProcedures.map((proc) => (
                      <button
                        key={proc}
                        onClick={() => setFilterProcedure(filterProcedure === proc ? '' : proc)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all max-w-[200px] truncate',
                          filterProcedure === proc
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                        )}
                        title={proc}
                      >
                        {proc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <CalendarRange size={12} />
                  Filter by Registration Date
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">From</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      max={filterEndDate || undefined}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">To</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      min={filterStartDate || undefined}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  {(filterStartDate || filterEndDate) && (
                    <div className="flex items-end">
                      <button
                        onClick={handleClearDateFilter}
                        className="px-3 py-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
                      >
                        <X size={14} />
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Date Presets */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">
                  Quick Date Filters
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Today', days: 0 },
                    { label: 'Last 7 Days', days: 7 },
                    { label: 'Last 30 Days', days: 30 },
                    { label: 'Last 90 Days', days: 90 },
                    { label: 'This Year', days: 365 },
                  ].map((preset) => {
                    const isActive = () => {
                      if (!filterStartDate) return false;
                      const today = new Date();
                      const fromDate = new Date(filterStartDate);
                      const daysDiff = Math.floor((today - fromDate) / (1000 * 60 * 60 * 24));
                      return preset.days === 0
                        ? filterStartDate === today.toISOString().split('T')[0] && filterEndDate === today.toISOString().split('T')[0]
                        : daysDiff === preset.days && filterEndDate === today.toISOString().split('T')[0];
                    };

                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          const today = new Date();
                          const toDateStr = today.toISOString().split('T')[0];
                          let fromDateStr;

                          if (preset.days === 0) {
                            fromDateStr = toDateStr;
                          } else {
                            const fromDate = new Date(today);
                            fromDate.setDate(fromDate.getDate() - preset.days);
                            fromDateStr = fromDate.toISOString().split('T')[0];
                          }

                          setFilterStartDate(fromDateStr);
                          setFilterEndDate(toDateStr);
                        }}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          isActive()
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CLEAR ALL FILTERS BUTTON */}
              {activeFilters > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <X size={14} />
                    Clear All Filters ({activeFilters})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Summary */}
          {(search || filterStartDate || filterEndDate || filterSex || filterAgeRange || filterProcedure) && !loading && (
            <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-50 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-400">
                Found{' '}
                <span className="font-semibold text-slate-600">
                  {filteredPatientsCount}
                </span>{' '}
                patient{filteredPatientsCount !== 1 ? 's' : ''}
                {search && (
                  <span>
                    {' '}for "<span className="text-slate-600">{search}</span>"
                  </span>
                )}
                {filterSex && (
                  <span> • <span className="text-slate-600">{filterSex}</span></span>
                )}
                {filterAgeRange && (
                  <span> • <span className="text-slate-600">Age {filterAgeRange}</span></span>
                )}
                {filterProcedure && (
                  <span> • <span className="text-slate-600">{filterProcedure}</span></span>
                )}
                {(filterStartDate || filterEndDate) && (
                  <span>
                    {' '}•{' '}
                    <span className="text-slate-600">
                      {filterStartDate && filterEndDate
                        ? `${formatDate(filterStartDate)} - ${formatDate(filterEndDate)}`
                        : filterStartDate
                        ? `From ${formatDate(filterStartDate)}`
                        : `Until ${formatDate(filterEndDate)}`}
                    </span>
                  </span>
                )}
              </span>
              <button
                onClick={handleClearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <X size={12} />
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
      {/* ✅ END FIXED HEADER + SEARCH SECTION */}

      {/* ✅ SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">

        {/* TABLE */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <TableSkeleton />
          </div>
        ) : patients.length === 0 || groupedByDate.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-5">
              <User size={36} strokeWidth={1.5} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">
              {(search || filterStartDate || filterEndDate || filterSex || filterAgeRange || filterProcedure) ? 'No results found' : 'No patients yet'}
            </h3>
            <p className="text-slate-400 text-sm mt-2 text-center max-w-xs">
              {(search || filterStartDate || filterEndDate || filterSex || filterAgeRange || filterProcedure) ? 'Try adjusting your search or filters.' : 'Start by adding your first patient.'}
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              {(search || filterStartDate || filterEndDate || filterSex || filterAgeRange || filterProcedure) && (
                <button
                  onClick={handleClearAllFilters}
                  className="px-4 py-2.5 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
              {!(search || filterStartDate || filterEndDate || filterSex || filterAgeRange || filterProcedure) && (
                <button
                  onClick={() => { resetForm(); setShowForm(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  <Plus size={16} strokeWidth={2.5} /> Add First Patient
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="w-14 px-4 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">#</th>
                    <th
                      onClick={() => toggleSort('name')}
                      className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none hover:text-slate-600 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">Patient <SortIcon field="name" /></span>
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill No</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Contact</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">Procedure</th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                    <th className="w-52 px-4 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGroups.map((group) => (
                    <React.Fragment key={group.dateStr}>
                      <tr>
                        <td colSpan={7} className="px-0 py-0">
                          <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border-y border-slate-100">
                            <div className={clsx(
                              'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                              isToday(group.dateStr) ? 'bg-emerald-100' : 'bg-blue-100/80'
                            )}>
                              <Calendar size={13} className={isToday(group.dateStr) ? 'text-emerald-600' : 'text-blue-500'} />
                            </div>
                            <span className="font-bold text-slate-700 text-[13px]">{getDateLabel(group.dateStr)}</span>
                            {isToday(group.dateStr) && (
                              <span className="text-[9px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                Live
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 bg-white px-2.5 py-0.5 rounded-full font-bold border border-slate-200/60 tabular-nums">
                              {group.patients.length}
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-slate-200/60 to-transparent" />
                          </div>
                        </td>
                      </tr>

                      {group.patients.map((patient, i) => (
                        <tr
                          key={patient._id}
                          className="group border-b border-slate-50 hover:bg-blue-50/40 transition-colors duration-150"
                        >
                          <td className="px-4 py-3.5 text-center">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold inline-flex items-center justify-center tabular-nums group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 cursor-pointer" onClick={() => setViewingPatient(patient)}>
                            <div className="flex items-center gap-3">
                              <div className={clsx(
                                'w-10 h-10 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-sm',
                                avatarColors[getColorIndex(patient.name)]
                              )}>
                                {getInitials(patient.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-[13px] truncate leading-tight group-hover:text-blue-600 transition-colors">
                                  {patient.name}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                  {patient.age}Y &middot; {patient.sex}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-[11px] text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-lg font-semibold border border-slate-200/60">
                              {patient.billNumber || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            {patient.phone ? (
                              <span className="inline-flex items-center gap-1 text-[12px] text-slate-600 font-medium">
                                <Phone size={12} className="text-slate-400" /> {patient.phone}
                                <ContactButtons phone={patient.phone} />
                              </span>
                            ) : (
                              <span className="text-slate-300 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 hidden xl:table-cell">
                            {patient.procedureType ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-lg font-semibold border border-blue-100/80 max-w-[160px] truncate">
                                <Stethoscope size={10} className="flex-shrink-0" />{patient.procedureType}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                              <Clock size={11} className="text-slate-400" />
                              {(() => {
                                try {
                                  return new Date(patient.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  });
                                } catch {
                                  return 'N/A';
                                }
                              })()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <button
                                onClick={() => safeNavigate(`/reports/new?patient=${patient._id}`)}
                                className="p-2.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-all"
                                title="Create Report"
                              >
                                <FilePlus size={17} />
                              </button>
                              <button
                                onClick={() => safeNavigate(`/patients/${patient._id}`)}
                                className="p-2.5 rounded-lg text-violet-600 hover:bg-violet-100 transition-all"
                                title="View Profile (Gallery)"
                              >
                                <ImageIcon size={17} />
                              </button>
                              <button
                                onClick={() => handleEdit(patient)}
                                className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(patient._id)}
                                className="p-2.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-5">
              {paginatedGroups.map((group) => (
                <div key={group.dateStr}>
                  <div className="flex items-center gap-2.5 mb-2.5 px-1">
                    <div className={clsx(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                      isToday(group.dateStr) ? 'bg-emerald-100' : 'bg-blue-100'
                    )}>
                      <Calendar size={13} className={isToday(group.dateStr) ? 'text-emerald-600' : 'text-blue-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 text-[13px]">{getDateLabel(group.dateStr)}</span>
                        {isToday(group.dateStr) && (
                          <span className="text-[8px] font-extrabold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {group.patients.length} patient{group.patients.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.patients.map((patient, i) => (
                      <div
                        key={patient._id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.995]"
                      >
                        <div className="p-3.5 flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold inline-flex items-center justify-center flex-shrink-0 tabular-nums">
                            {i + 1}
                          </span>
                          <div
                            className="flex-1 min-w-0 flex items-center gap-3 cursor-pointer"
                            onClick={() => setViewingPatient(patient)}
                          >
                            <div className={clsx(
                              'w-10 h-10 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-sm',
                              avatarColors[getColorIndex(patient.name)]
                            )}>
                              {getInitials(patient.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-800 text-[13px] truncate">{patient.name}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {patient.age}Y &middot; {patient.sex}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded font-semibold border border-slate-100">
                                  {patient.billNumber || '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <MobileActions
                            onEdit={() => handleEdit(patient)}
                            onDelete={() => handleDelete(patient._id)}
                            onCreateReport={() => safeNavigate(`/reports/new?patient=${patient._id}`)}
                            onViewGallery={() => safeNavigate(`/patients/${patient._id}`)}
                          />
                        </div>

                        <div className="px-3.5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            {patient.phone && (
                              <span className="inline-flex items-center gap-1 font-medium">
                                <Phone size={11} className="text-slate-400" /> {patient.phone}
                                <ContactButtons phone={patient.phone} />
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                              <Clock size={10} />
                              {(() => {
                                try {
                                  return new Date(patient.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  });
                                } catch {
                                  return 'N/A';
                                }
                              })()}
                            </span>
                          </div>
                          <button
                            onClick={() => safeNavigate(`/reports/new?patient=${patient._id}`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            <FilePlus size={13} /> Report
                          </button>
                        </div>

                        {patient.procedureType && (
                          <div className="px-3.5 py-2 border-t border-slate-100">
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-semibold border border-blue-100">
                              <Stethoscope size={9} />{patient.procedureType}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-2xl border border-slate-200/80 px-5 py-4 mt-5 shadow-sm gap-3">
                <p className="text-sm text-slate-500 font-medium">
                  Showing{' '}
                  <span className="font-bold text-slate-700">
                    {pageStartIndex + 1}–{Math.min(pageStartIndex + PATIENTS_PER_PAGE, filteredPatientsCount)}
                  </span>{' '}
                  of <span className="font-bold text-slate-700">{filteredPatientsCount}</span> patients
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((item, idx) => {
                      if (item === '...') {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm"
                          >
                            …
                          </span>
                        );
                      }
                      return (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={clsx(
                            'w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200',
                            currentPage === item
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                              : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* ✅ END SCROLLABLE CONTENT */}

      {/* READ-ONLY PATIENT DETAILS MODAL */}
      {viewingPatient && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPatient(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
            onClick={e => e.stopPropagation()}
          >

            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
              <div className="flex items-center gap-4 relative">
                <div className={clsx(
                  'w-12 h-12 rounded-full bg-white flex-shrink-0 flex items-center justify-center text-blue-600 text-lg font-bold shadow-md'
                )}>
                  {getInitials(viewingPatient.name)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{viewingPatient.name}</h2>
                  <p className="text-white/80 text-[12px] font-medium mt-0.5">
                    {viewingPatient.age} Years &middot; {viewingPatient.sex}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPatient(null)}
                className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Details Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm">

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Bill Number</p>
                  <p className="font-semibold text-slate-700 font-mono">{viewingPatient.billNumber || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Patient ID No.</p>
                  <p className="font-semibold text-slate-700 font-mono">{viewingPatient.idNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-700 font-medium">{viewingPatient.phone || 'Not provided'}</p>
                      {viewingPatient.phone && <ContactButtons phone={viewingPatient.phone} />}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address</p>
                    <p className="text-slate-700 font-medium">{viewingPatient.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 my-2"></div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Stethoscope size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Procedure Type</p>
                    <p className="text-slate-700 font-medium">{viewingPatient.procedureType || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Indication</p>
                    <p className="text-slate-700 font-medium">{viewingPatient.indication || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Referred By</p>
                  <p className="text-slate-700 font-medium text-[13px]">{viewingPatient.referredDoc || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Performed By</p>
                  <p className="text-slate-700 font-medium text-[13px]">{viewingPatient.doneDoc || '-'}</p>
                </div>
              </div>

              {viewingPatient.remark && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mt-2">
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Remarks</p>
                  <p className="text-slate-700 text-[13px]">{viewingPatient.remark}</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end">
              <button
                onClick={() => setViewingPatient(null)}
                className="px-6 py-2 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ✅ COMPACT GRID POPUP MODAL (Add/Edit Patient) */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6"
          onClick={resetForm}
        >
          <div
            className="bg-white w-full max-w-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={clsx(
              'px-6 py-4 flex items-center justify-between relative overflow-hidden shrink-0',
              editingPatient ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            )}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
              <div className="flex items-center gap-3 relative">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-sm">
                  {editingPatient
                    ? <Edit size={18} className="text-white" />
                    : <UserPlus size={18} className="text-white" />
                  }
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingPatient ? 'Edit Patient' : 'Register New Patient'}
                  </h2>
                  <p className="text-white/80 text-[11px] font-medium mt-0.5">
                    {editingPatient ? 'Update patient information' : 'Fill all required fields'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Multi-column grid */}
            <div className="px-6 py-5 bg-slate-50/30 max-h-[70vh] overflow-y-auto">
              <form id="patientForm" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-3.5">
                
                {/* Row 1 */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Patient full name"
                    className={inputCls}
                    required
                    autoFocus
                  />
                </div>
                <div className="col-span-1">
                  <label className={labelCls}>Age <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Years"
                    className={inputCls}
                    required
                    min="0"
                    max="150"
                  />
                </div>
                <div className="col-span-1">
                  <label className={labelCls}>Sex <span className="text-red-400">*</span></label>
                  <div className="flex gap-1 h-[34px]">
                    {['Male', 'Female', 'Other'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, sex: s })}
                        className={clsx(
                          'flex-1 text-[10px] font-bold rounded-lg border transition-all duration-200',
                          formData.sex === s
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 2 */}
                <div className="col-span-1">
                  <label className={labelCls}>Patient ID No.</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                    placeholder="ID Number"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-1">
                  <label className={labelCls}>Bill Number</label>
                  <input
                    type="text"
                    value={formData.billNumber}
                    onChange={e => setFormData({ ...formData, billNumber: e.target.value })}
                    placeholder="Receipt No"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-1">
                  <label className={labelCls}>Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+\-\s()]/g, '') })}
                    onKeyDown={e => {
                      if (e.key.length === 1 && !/[0-9+\-\s()]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Contact number"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-1">
                  <label className={labelCls}>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="City / Region"
                    className={inputCls}
                  />
                </div>

                <div className="col-span-1 sm:col-span-4 border-t border-slate-200/60 my-1" />

                {/* Row 3 */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelCls}>Procedure Type <span className="text-red-400">*</span></label>
                  <AutocompleteInput
                    required
                    value={formData.procedureType}
                    onChange={(val) => setFormData({ ...formData, procedureType: val })}
                    storageKey="procedureType"
                    placeholder="e.g., Video GastroDuodenoscopy"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelCls}>Indication <span className="text-red-400">*</span></label>
                  <AutocompleteInput
                    required
                    value={formData.indication}
                    onChange={(val) => setFormData({ ...formData, indication: val })}
                    storageKey="indication"
                    placeholder="e.g., Dyspepsia, GERD"
                    className={inputCls}
                  />
                </div>

                {/* Row 4 */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelCls}>Referred By <span className="text-red-400">*</span></label>
                  <AutocompleteInput
                    required
                    value={formData.referredDoc}
                    onChange={(val) => setFormData({ ...formData, referredDoc: val })}
                    storageKey="referredDoc"
                    placeholder="Referring doctor"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelCls}>Performed By <span className="text-red-400">*</span></label>
                  <AutocompleteInput
                    required
                    value={formData.doneDoc}
                    onChange={(val) => setFormData({ ...formData, doneDoc: val })}
                    storageKey="doneDoc"
                    placeholder="Doctor name"
                    className={inputCls}
                  />
                </div>

                {/* Row 5 */}
                <div className="col-span-1 sm:col-span-4">
                  <label className={labelCls}>Remarks</label>
                  <textarea
                    value={formData.remark}
                    onChange={e => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="Additional clinical notes or remarks…"
                    rows={1}
                    className={clsx(inputCls, "resize-none h-[34px] overflow-hidden")}
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="patientForm"
                disabled={submitting}
                className={clsx(
                  'px-8 py-2 text-sm font-bold text-white rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg transition-all',
                  editingPatient
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                )}
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Saving…</>
                ) : (
                  <><CheckCircle size={15} /> {editingPatient ? 'Update Patient' : 'Register Patient'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;