import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Search, Plus, FileText, CheckCircle, Clock, Eye, Edit, Trash2,
  MoreVertical, X, RefreshCw, ArrowRight, AlertCircle,
  Loader2, Stethoscope, Calendar, LayoutList, SlidersHorizontal,
  Shield, CalendarRange, Download, Printer, Image as ImageIcon,
  CheckSquare, Square, Columns, AlignJustify, Keyboard, ArrowUp, ArrowDown,
  List, FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ✅ Safe Navigation Hook
const useSafeNavigate = () => {
  try { return useNavigate(); } catch (e) {
    return (path) => { window.location.hash = `#${path}`; };
  }
};

const StatusBadge = ({ status }) => {
  const isFinalized = status === 'finalized';
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border', isFinalized ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', isFinalized ? 'bg-emerald-500' : 'bg-amber-500')} />
      {isFinalized ? 'Completed' : 'Draft'}
    </span>
  );
};

const DeleteConfirmModal = ({ reportName, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} className="text-red-500" /></div>
      <h3 className="text-xl font-bold text-gray-900">Delete Report</h3>
      <p className="text-gray-500 text-sm mt-2 leading-relaxed">Are you sure you want to delete <span className="font-semibold text-gray-700">{reportName || 'this report'}</span>?<span className="block mt-1 text-red-500 font-medium text-xs">This action cannot be undone.</span></p>
      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2.5 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm disabled:opacity-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 text-white font-semibold bg-red-600 hover:bg-red-700 rounded-xl transition-colors text-sm shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

const QuickPreviewModal = ({ report, onClose }) => {
  if (!report) return null;
  const formattedDate = (() => { try { return report?.procedureDate ? new Date(report.procedureDate).toLocaleDateString() : 'N/A'; } catch { return 'N/A'; } })();
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
          <div><h3 className="text-lg font-bold text-gray-900">{report?.procedureName || 'Procedure Preview'}</h3><p className="text-xs text-gray-500 mt-1">{report?.reportId || 'No ID'}</p></div>
          <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl"><X size={18} /></button>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Patient:</span><span className="font-semibold text-gray-900">{report?.patient?.name || 'Unknown'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-semibold text-gray-900">{formattedDate}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Images attached:</span><span className="font-semibold text-gray-900 flex items-center gap-1"><ImageIcon size={14}/> {report?.images?.length || 0}</span></div>
          <div className="mt-4 p-4 bg-gray-50 rounded-xl"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Findings Summary</span><p className="text-gray-700 leading-relaxed line-clamp-3">{report?.findings || 'No findings recorded yet.'}</p></div>
        </div>
      </div>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 animate-pulse" style={{ animationDelay: `${i * 75}ms` }}>
        <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0" /><div className="flex-1 space-y-2.5"><div className="h-4 bg-gray-100 rounded-lg w-2/5" /><div className="h-3 bg-gray-50 rounded-lg w-1/4" /></div><div className="h-6 bg-gray-100 rounded-lg w-20 hidden sm:block" /><div className="h-4 bg-gray-50 rounded-lg w-24 hidden md:block" /><div className="h-8 bg-gray-100 rounded-lg w-16 hidden md:block" />
      </div>
    ))}
  </div>
);

const MobileActions = ({ report, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className={clsx('p-2 rounded-xl transition-all', open ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')}><MoreVertical size={18} /></button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { onView(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"><div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center"><Eye size={15} className="text-indigo-600" /></div>View & Print</button>
          <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"><div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center"><Edit size={15} className="text-emerald-600" /></div>Edit Report</button>
          <div className="border-t border-gray-100 my-1.5 mx-4" />
          <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"><div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><Trash2 size={15} className="text-red-500" /></div>Delete Report</button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   STATS CARD
═══════════════════════════════════════════════════════════════════ */
const StatsCard = ({ icon: Icon, label, value, color, active, onClick }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', activeBorder: 'border-indigo-400', activeRing: 'ring-indigo-100', gradient: 'from-indigo-500 to-indigo-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', activeBorder: 'border-amber-400', activeRing: 'ring-amber-100', gradient: 'from-amber-500 to-orange-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', activeBorder: 'border-emerald-400', activeRing: 'ring-emerald-100', gradient: 'from-emerald-500 to-emerald-600' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', activeBorder: 'border-cyan-400', activeRing: 'ring-cyan-100', gradient: 'from-cyan-500 to-teal-500' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <button onClick={onClick} className={clsx('bg-white rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300 group relative overflow-hidden', active ? `${c.activeBorder} ring-2 ${c.activeRing} shadow-sm` : 'border-gray-100 hover:border-gray-200 hover:shadow-sm')}>
      <div className={clsx('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-opacity duration-300', c.gradient, active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 tracking-tight">{value}</p>
        </div>
        <div className={clsx('w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors', active ? c.bg : 'bg-gray-50 group-hover:' + c.bg)}>
          {Icon && <Icon size={18} className={clsx(active ? c.text : 'text-gray-400 group-hover:' + c.text)} />}
        </div>
      </div>
    </button>
  );
};

const ReportsList = () => {
  const navigate = useSafeNavigate();
  const searchInputRef = useRef(null);
  
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deletingReport, setDeletingReport] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [viewMode, setViewMode] = useState('normal'); 
  const [groupBy, setGroupBy] = useState('none'); 
  const [previewReport, setPreviewReport] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const [patientFilter, setPatientFilter] = useState('');
  const [procedureFilter, setProcedureFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');

  const [downloadProgress, setDownloadProgress] = useState({ active: false, current: 0, total: 0 });

  // ✅ Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/reports?search=${encodeURIComponent(search || '')}&status=${encodeURIComponent(statusFilter || '')}`;
      if (dateFrom) url += `&dateFrom=${encodeURIComponent(dateFrom)}`;
      if (dateTo) url += `&dateTo=${encodeURIComponent(dateTo)}`;
      const { data } = await api.get(url);
      
      let filteredReports = data?.reports || [];
      if (dateFrom || dateTo) {
        filteredReports = filteredReports.filter(report => {
          if (!report?.procedureDate) return true;
          const reportDate = new Date(report.procedureDate);
          if (isNaN(reportDate.getTime())) return true;
          if (dateFrom && dateTo) return reportDate >= new Date(dateFrom) && reportDate <= new Date(dateTo + 'T23:59:59');
          else if (dateFrom) return reportDate >= new Date(dateFrom);
          else if (dateTo) return reportDate <= new Date(dateTo + 'T23:59:59');
          return true;
        });
      }
      setReports(filteredReports);
    } catch (error) { toast.error('Failed to load reports'); setReports([]); } finally { setLoading(false); }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const debounce = setTimeout(() => { fetchReports().catch(e => console.error(e)); }, 300);
    return () => clearTimeout(debounce);
  }, [fetchReports]);

  // ✅ Reset to Page 1 when any filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFrom, dateTo, patientFilter, procedureFilter, doctorFilter, sortConfig]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      try {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
        switch (e.key.toLowerCase()) {
          case 'n': e.preventDefault(); navigate('/reports/new'); break;
          case 's': case '/': e.preventDefault(); searchInputRef.current?.focus(); break;
          case 'f': e.preventDefault(); setShowFilters(f => !f); break;
          case 'e': e.preventDefault(); handleExportCSV(); break;
          case 'p': e.preventDefault(); handlePrintList(); break;
          case '?': e.preventDefault(); setShowShortcuts(s => !s); break;
          case 'escape': setPreviewReport(null); setDeletingReport(null); setShowShortcuts(false); break;
          default: break;
        }
      } catch (err) {}
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const processedReports = useMemo(() => {
    try {
      let result = Array.isArray(reports) ? [...reports] : [];
      if (patientFilter) result = result.filter(r => r?.patient?.name === patientFilter);
      if (procedureFilter) result = result.filter(r => r?.procedureName === procedureFilter);
      if (doctorFilter) result = result.filter(r => r?.referringDoctor === doctorFilter);

      result.sort((a, b) => {
        let valA, valB;
        switch (sortConfig.key) {
          case 'patient': valA = a?.patient?.name?.toLowerCase() || ''; valB = b?.patient?.name?.toLowerCase() || ''; break;
          case 'status': valA = a?.status || ''; valB = b?.status || ''; break;
          case 'procedure': valA = a?.procedureName || ''; valB = b?.procedureName || ''; break;
          case 'date': default: valA = new Date(a?.procedureDate || 0).getTime(); valB = new Date(b?.procedureDate || 0).getTime(); break;
        }
        if (isNaN(valA)) valA = 0; if (isNaN(valB)) valB = 0;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      return result;
    } catch (e) { return []; }
  }, [reports, sortConfig, patientFilter, procedureFilter, doctorFilter]);

  // ✅ Apply Pagination to processed list
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedReports.slice(start, start + itemsPerPage);
  }, [processedReports, currentPage]);

  const totalPages = Math.ceil(processedReports.length / itemsPerPage);

  const uniquePatients = useMemo(() => [...new Set(reports.map(r => r?.patient?.name).filter(Boolean))], [reports]);
  const uniqueProcedures = useMemo(() => [...new Set(reports.map(r => r?.procedureName).filter(Boolean))], [reports]);
  
  const groupedReports = useMemo(() => {
    try {
      if (groupBy === 'none') return { 'All Reports': paginatedReports };
      return paginatedReports.reduce((acc, report) => {
        let key = 'Other';
        if (groupBy === 'date') key = formatDate(report?.procedureDate);
        if (groupBy === 'patient') key = report?.patient?.name || 'Unknown Patient';
        if (groupBy === 'procedure') key = report?.procedureName || 'Unknown Procedure';
        if (!acc[key]) acc[key] = []; acc[key].push(report); return acc;
      }, {});
    } catch (e) { return { 'All Reports': paginatedReports }; }
  }, [paginatedReports, groupBy]);

  const totalReports = processedReports.length;
  const draftCount = processedReports.filter(r => r?.status === 'draft').length;
  const finalizedCount = processedReports.filter(r => r?.status === 'finalized').length;
  const withImagesCount = processedReports.filter(r => r?.images?.length > 0).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = processedReports.filter(r => r?.procedureDate?.startsWith(todayStr)).length;
  
  const staleDrafts = processedReports.filter(r => {
    try {
      if (r?.status !== 'draft' || !r?.procedureDate) return false;
      const diffTime = Math.abs(new Date() - new Date(r.procedureDate));
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) > 7;
    } catch { return false; }
  });

  const activeFilters = [statusFilter, dateFrom, dateTo, patientFilter, procedureFilter, doctorFilter].filter(Boolean).length;

  const handleRefresh = async () => { setRefreshing(true); try { await fetchReports(); } catch (e) {} finally { setTimeout(() => setRefreshing(false), 600); } };

  const handleDelete = async () => {
    if (!deletingReport?._id) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/reports/${deletingReport._id}`);
      toast.success('Report deleted successfully');
      setSelectedIds(prev => { const newSet = new Set(prev); newSet.delete(deletingReport._id); return newSet; });
      setDeletingReport(null); await fetchReports();
    } catch (error) { toast.error(error?.response?.data?.message || 'Failed to delete report'); } finally { setDeleteLoading(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} reports?`)) return;
    setLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/reports/${id}`)));
      toast.success(`${selectedIds.size} reports deleted`);
      setSelectedIds(new Set()); await fetchReports();
    } catch (error) { toast.error('Some reports failed to delete'); } finally { setLoading(false); }
  };

  const handleExportCSV = () => {
    try {
      const dataToExport = selectedIds.size > 0 ? processedReports.filter(r => selectedIds.has(r?._id)) : processedReports;
      if (dataToExport.length === 0) return toast.error('No reports to export');
      const headers = ['Report ID', 'Procedure', 'Patient Name', 'Age/Sex', 'Date', 'Status', 'Images'];
      const csvContent = dataToExport.map(r => [ r?.reportId || '', `"${r?.procedureName || ''}"`, `"${r?.patient?.name || ''}"`, `${r?.patient?.age || ''}/${r?.patient?.sex || ''}`, formatDate(r?.procedureDate), r?.status || '', r?.images?.length || 0 ].join(','));
      const blob = new Blob([headers.join(',') + '\n' + csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Reports_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success('Exported successfully');
    } catch (error) { toast.error('Export failed'); }
  };

  const handlePrintList = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return toast.error('Pop-up blocked. Please allow pop-ups to print.');
      const dataToPrint = selectedIds.size > 0 ? processedReports.filter(r => selectedIds.has(r?._id)) : processedReports;
      const html = `<html><head><title>Reports List</title><style>body { font-family: system-ui, sans-serif; padding: 20px; color: #333; } h1 { color: #4f46e5; margin-bottom: 5px; } p { color: #666; font-size: 14px; margin-bottom: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; font-size: 14px; } th { background: #f8fafc; font-weight: 600; color: #555; }</style></head><body><h1>Endoscopy Reports List</h1><p>Generated on ${new Date().toLocaleString()}</p><table><thead><tr><th>ID</th><th>Procedure</th><th>Patient</th><th>Date</th><th>Status</th></tr></thead><tbody>${dataToPrint.map(r => `<tr><td>${r?.reportId || '-'}</td><td>${r?.procedureName || '-'}</td><td>${r?.patient?.name || '-'}</td><td>${formatDate(r?.procedureDate)}</td><td><span style="text-transform: uppercase; font-size: 12px; font-weight: bold;">${r?.status || '-'}</span></td></tr>`).join('')}</tbody></table><script>window.onload = () => { window.print(); setTimeout(()=>window.close(), 500); }</script></body></html>`;
      printWindow.document.write(html); printWindow.document.close();
    } catch (e) { toast.error('Print failed'); }
  };

  const handleBulkDownloadPDF = async () => {
    if (!window.electronAPI || !window.electronAPI.downloadPDF) {
      return toast.error('PDF Download is only available in the Desktop App.');
    }
    
    try {
      const folderPath = await window.electronAPI.selectFolder();
      if (!folderPath) return; 

      const idsArray = Array.from(selectedIds);
      setDownloadProgress({ active: true, current: 0, total: idsArray.length });
      
      const baseUrl = window.location.origin + window.location.pathname;

      for (let i = 0; i < idsArray.length; i++) {
        const id = idsArray[i];
        const report = processedReports.find(r => r._id === id);
        
        const safeName = report?.patient?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
        const safeProc = report?.procedureName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Procedure';
        const fileName = `${report?.reportId || id}_${safeName}_${safeProc}.pdf`;
        
        const reportUrl = `${baseUrl}#/reports/${id}/print`;

        await window.electronAPI.downloadPDF({ url: reportUrl, folderPath, fileName });
        
        setDownloadProgress(prev => ({ ...prev, current: i + 1 }));
      }
      
      toast.success('All PDFs downloaded successfully!');
      setSelectedIds(new Set()); 
    } catch(e) {
      console.error('Bulk PDF Error:', e);
      toast.error('Download failed. Please check the logs.');
    } finally {
      setDownloadProgress({ active: false, current: 0, total: 0 });
    }
  };

  const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const toggleSelection = (id) => { if (!id) return; const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); };
  const toggleSelectAll = () => { if (selectedIds.size === processedReports.length && processedReports.length > 0) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(processedReports.map(r => r?._id).filter(Boolean))); } };
  const handleClearFilters = () => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPatientFilter(''); setProcedureFilter(''); setDoctorFilter(''); };
  const formatDate = (dateStr) => { try { if (!dateStr) return 'N/A'; const d = new Date(dateStr); if (isNaN(d.getTime())) return 'Invalid Date'; return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return 'Invalid date'; } };
  const getInitials = (name) => { try { if (!name || typeof name !== 'string') return '?'; return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(); } catch (e) { return '?'; } };
  const calculateProgress = (report) => { if (!report) return 0; let p = 0; if (report.procedureName) p += 25; if (report.patient) p += 25; if (report.findings) p += 25; if (report.images && report.images.length > 0) p += 25; return p; };

  const onTouchStart = (e) => { try { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); } catch {} };
  const onTouchMove = (e) => { try { setTouchEnd(e.targetTouches[0].clientX); } catch {} };
  const onTouchEndAction = (report) => { try { if (!touchStart || !touchEnd || !report) return; const distance = touchStart - touchEnd; if (distance > minSwipeDistance) setDeletingReport(report); if (distance < -minSwipeDistance && report._id) navigate(`/reports/${report._id}/print`); } catch (e) {} };
  const safeNavigate = (path) => { try { navigate(path); } catch (e) { window.location.hash = `#${path}`; } };

  const gradients = ['from-indigo-500 to-indigo-600', 'from-emerald-500 to-emerald-600', 'from-purple-500 to-purple-600', 'from-amber-500 to-orange-500', 'from-pink-500 to-rose-500', 'from-cyan-500 to-teal-500'];

  return (
    // ✅ CHANGE 1: Root container is now fixed height with flex column
    <div className="h-screen flex flex-col overflow-hidden">
      
      {/* MODALS - No changes */}
      {deletingReport && <DeleteConfirmModal reportName={deletingReport?.reportId || deletingReport?.procedureName} onConfirm={handleDelete} onCancel={() => setDeletingReport(null)} loading={deleteLoading} />}
      {previewReport && <QuickPreviewModal report={previewReport} onClose={() => setPreviewReport(null)} />}

      {/* BLOCKING PROGRESS MODAL - No changes */}
      {downloadProgress.active && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900">Downloading PDFs</h3>
            <p className="text-gray-500 text-sm mt-2">Please wait, do not close the app.</p>
            <div className="mt-6 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300" 
                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }} 
              />
            </div>
            <p className="text-sm font-bold text-indigo-600 mt-3">
              {downloadProgress.current} / {downloadProgress.total} completed
            </p>
          </div>
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-800"><Keyboard size={20}/> Keyboard Shortcuts</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between"><kbd className="bg-gray-100 px-2 py-1 rounded border text-gray-800 font-mono">N</kbd> <span>New Report</span></div>
              <div className="flex justify-between"><kbd className="bg-gray-100 px-2 py-1 rounded border text-gray-800 font-mono">S / /</kbd> <span>Search</span></div>
              <div className="flex justify-between"><kbd className="bg-gray-100 px-2 py-1 rounded border text-gray-800 font-mono">F</kbd> <span>Toggle Filters</span></div>
              <div className="flex justify-between"><kbd className="bg-gray-100 px-2 py-1 rounded border text-gray-800 font-mono">E</kbd> <span>Export CSV</span></div>
              <div className="flex justify-between"><kbd className="bg-gray-100 px-2 py-1 rounded border text-gray-800 font-mono">P</kbd> <span>Print List</span></div>
              <div className="flex justify-between"><kbd className="bg-gray-100 px-2 py-1 rounded border text-gray-800 font-mono">Esc</kbd> <span>Close Modals</span></div>
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full mt-6 bg-gray-100 hover:bg-gray-200 transition-colors py-2.5 rounded-xl font-semibold text-gray-700">Close</button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          ✅ CHANGE 2: FIXED HEADER SECTION - flex-shrink-0 prevents it from scrolling
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 space-y-6 p-4 sm:p-6 pb-0 bg-gray-50">
        
        {staleDrafts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl"><Clock size={20} className="text-orange-600" /></div>
              <div>
                <h4 className="text-sm font-bold text-orange-900">Stale Drafts Alert</h4>
                <p className="text-xs text-orange-700">You have {staleDrafts.length} draft report{staleDrafts.length > 1 ? 's' : ''} older than 7 days.</p>
              </div>
            </div>
            <button onClick={() => { setStatusFilter('draft'); setDateTo(new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]); }} className="text-sm font-semibold text-orange-700 bg-white px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
              View Stale Drafts
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-indigo-50 rounded-xl"><FileText size={20} className="text-indigo-600" /></div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                Reports 
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 font-medium">
                  {totalReports} total • {todayCount} today
                </span>
              </h1>
            </div>
            <p className="text-sm text-gray-400 ml-12">View, manage and track all endoscopy procedure reports</p>
          </div>
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
            <button onClick={() => setShowShortcuts(true)} className="p-2.5 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all" title="Keyboard Shortcuts (?)"><Keyboard size={18} /></button>
            <button onClick={handleExportCSV} className="p-2.5 bg-white text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all" title="Export CSV (E)"><Download size={18} /></button>
            <button onClick={handlePrintList} className="p-2.5 bg-white text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all" title="Print List (P)"><Printer size={18} /></button>
            <button onClick={() => safeNavigate('/reports/new')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-lg shadow-indigo-500/20 group">
              <Plus size={18} /><span>New Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard icon={LayoutList} label="Total" value={totalReports} color="indigo" active={statusFilter === ''} onClick={() => setStatusFilter('')} />
          <StatsCard icon={Edit} label="Drafts" value={draftCount} color="amber" active={statusFilter === 'draft'} onClick={() => setStatusFilter(statusFilter === 'draft' ? '' : 'draft')} />
          <StatsCard icon={Shield} label="Completed" value={finalizedCount} color="emerald" active={statusFilter === 'finalized'} onClick={() => setStatusFilter(statusFilter === 'finalized' ? '' : 'finalized')} />
          <StatsCard icon={ImageIcon} label="With Images" value={withImagesCount} color="cyan" active={false} onClick={() => {}} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 flex-wrap sm:flex-nowrap">
            <Search className="text-gray-400 flex-shrink-0" size={20} />
            <input ref={searchInputRef} type="text" placeholder="Search (Press 'S' or '/')..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 outline-none text-gray-800 bg-transparent placeholder-gray-400 text-sm min-w-[150px]" />
            {search && <button onClick={() => setSearch('')} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={16} /></button>}

            <div className="hidden sm:block w-px h-6 bg-gray-200" />
            
            <div className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button onClick={() => setViewMode('normal')} className={clsx("p-1.5 rounded-md transition-all", viewMode==='normal' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600')} title="Normal View"><AlignJustify size={16}/></button>
              <button onClick={() => setViewMode('compact')} className={clsx("p-1.5 rounded-md transition-all", viewMode==='compact' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600')} title="Compact View"><List size={16}/></button>
              <button onClick={() => setViewMode('timeline')} className={clsx("p-1.5 rounded-md transition-all", viewMode==='timeline' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600')} title="Timeline View"><Columns size={16}/></button>
            </div>

            <div className="hidden sm:block w-px h-6 bg-gray-200" />

            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium">Group:</span>
              <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="bg-transparent outline-none cursor-pointer border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50">
                <option value="none">None</option>
                <option value="date">Date</option>
                <option value="patient">Patient</option>
                <option value="procedure">Procedure</option>
              </select>
            </div>

            <button onClick={handleRefresh} disabled={refreshing} className="hidden sm:flex p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50" title="Refresh">
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <button onClick={() => setShowFilters((f) => !f)} className={clsx('p-2.5 rounded-xl border transition-all relative ml-auto sm:ml-0', showFilters || activeFilters > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50')}>
              <SlidersHorizontal size={16} />
              {activeFilters > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{activeFilters}</span>}
            </button>
          </div>

          <div className={clsx('border-t border-gray-100 bg-gray-50/50 transition-all duration-300 overflow-hidden', showFilters ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0')}>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Patient</label>
                    <select value={patientFilter} onChange={e => setPatientFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors">
                      <option value="">All Patients</option>
                      {uniquePatients.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Procedure</label>
                    <select value={procedureFilter} onChange={e => setProcedureFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors">
                      <option value="">All Procedures</option>
                      {uniqueProcedures.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Status</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors">
                      <option value="">All Statuses</option>
                      <option value="draft">Drafts Only</option>
                      <option value="finalized">Completed Only</option>
                    </select>
                 </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><CalendarRange size={12} /> Date Range</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} max={dateTo || undefined} className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors" />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} min={dateFrom || undefined} className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors" />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap pt-2">
                <button onClick={() => { setDateFrom(todayStr); setDateTo(todayStr); }} className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Today</button>
                <button onClick={() => { const d = new Date(); d.setDate(d.getDate()-7); setDateFrom(d.toISOString().split('T')[0]); setDateTo(todayStr); }} className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Last 7 Days</button>
                <button onClick={handleClearFilters} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-semibold rounded-lg hover:bg-red-100 ml-auto transition-colors">Clear Filters</button>
              </div>
            </div>
          </div>

          {(activeFilters > 0 || search) && !loading && (
            <div className="px-5 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Found <strong className="text-gray-800">{processedReports.length}</strong> results</span>
              <button onClick={handleClearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">Clear All</button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ✅ CHANGE 3: SCROLLABLE CONTENT AREA - flex-1 overflow-y-auto
      ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-6">

        {/* BULK ACTIONS FLOATING BAR */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-bounce-short">
            <span className="text-sm font-semibold border-r border-gray-700 pr-4">{selectedIds.size} Selected</span>
            
            <button onClick={handleBulkDownloadPDF} className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
              <FileDown size={16}/> Download PDFs
            </button>
            
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors text-sm font-medium"><Download size={16}/> Export</button>
            <button onClick={handlePrintList} className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors text-sm font-medium"><Printer size={16}/> Print</button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors text-sm font-medium ml-2"><Trash2 size={16}/> Delete</button>
            <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-gray-800 rounded-full ml-2 transition-colors"><X size={16}/></button>
          </div>
        )}

        {/* CONTENT AREA */}
        {loading ? <TableSkeleton /> : processedReports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-5"><FileText size={36} className="text-gray-300" /></div>
            <h3 className="text-lg font-semibold text-gray-900">No reports found</h3>
            <p className="text-gray-400 text-sm mt-1.5">Try adjusting filters or create a new one.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-24">
            {Object.entries(groupedReports).map(([groupName, items]) => (
              <div key={groupName} className="space-y-3">
                {groupBy !== 'none' && <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded-md">{groupName} <span className="text-gray-400">({items?.length || 0})</span></h3>}
                
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-4 py-4 w-12 text-center">
                          <button onClick={toggleSelectAll} className="text-gray-400 hover:text-indigo-600 transition-colors">
                            {selectedIds.size === processedReports.length && processedReports.length > 0 ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18}/>}
                          </button>
                        </th>
                        <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('procedure')}>
                          <div className="flex items-center gap-1">Report {sortConfig.key === 'procedure' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                        <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('patient')}>
                          <div className="flex items-center gap-1">Patient {sortConfig.key === 'patient' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                        <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('date')}>
                          <div className="flex items-center gap-1">Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                        <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-1">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                        <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={clsx("divide-y divide-gray-50", viewMode === 'compact' ? "text-sm" : "")}>
                      {(items || []).map((report, index) => {
                        if (!report) return null;
                        const isSelected = selectedIds.has(report._id);
                        
                        let isStale = false;
                        if (report.status === 'draft' && report.procedureDate) {
                           const dTime = new Date() - new Date(report.procedureDate);
                           if (!isNaN(dTime) && dTime / 86400000 > 7) isStale = true;
                        }
                        
                        const progress = calculateProgress(report);

                        return (
                          <tr key={report._id || index} className={clsx('hover:bg-indigo-50/30 transition-colors duration-150 group cursor-pointer', isSelected && 'bg-indigo-50/50', isStale && 'border-l-4 border-l-orange-400')} onClick={() => report._id && safeNavigate(`/reports/${report._id}/print`)}>
                            <td className="px-4 py-4 text-center" onClick={e => { e.stopPropagation(); toggleSelection(report._id); }}>
                              {isSelected ? <CheckSquare size={18} className="text-indigo-600 mx-auto"/> : <Square size={18} className="text-gray-300 hover:text-gray-400 mx-auto"/>}
                            </td>
                            <td className={clsx("px-4", viewMode==='compact'?'py-2':'py-4')}>
                              <div className="flex items-center gap-3 relative">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors"><Stethoscope size={18} className="text-indigo-600" /></div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 truncate flex items-center gap-2">
                                    {report.procedureName || 'Unknown Procedure'}
                                    {report.images?.length > 0 && <span title={`${report.images.length} images`} className="text-xs text-gray-400 flex items-center gap-1"><ImageIcon size={12}/>{report.images.length}</span>}
                                  </p>
                                  <p className="text-xs text-gray-400 font-mono">{report.reportId || '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0`}>{getInitials(report?.patient?.name)}</div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{report?.patient?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-400">{report?.patient?.age || '-'}Y / {report?.patient?.sex || '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                                {formatDate(report.procedureDate)}
                              </div>
                            </td>
                            <td className="px-4">
                              <div>
                                <StatusBadge status={report.status} />
                                {report.status === 'draft' && (
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden" title={`${progress}% Complete`}>
                                    <div className={clsx("h-full", progress===100?'bg-emerald-500':'bg-amber-400')} style={{ width: `${progress}%` }} />
                                  </div>
                                )}
                                {isStale && <p className="text-[10px] text-orange-500 font-medium mt-1">Stale Draft</p>}
                              </div>
                            </td>
                            <td className="px-4">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setPreviewReport(report)} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Quick Preview"><Eye size={17} /></button>
                                <button onClick={() => report._id && safeNavigate(`/reports/${report._id}`)} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Edit Report"><Edit size={17} /></button>
                                <button onClick={() => setDeletingReport(report)} className="p-2 rounded-xl text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" title="Delete Report"><Trash2 size={17} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Timeline Cards View */}
                <div className="md:hidden space-y-3">
                  {(items || []).map((report, index) => {
                    if (!report) return null;
                    
                    let isStale = false;
                    if (report.status === 'draft' && report.procedureDate) {
                       const dTime = new Date() - new Date(report.procedureDate);
                       if (!isNaN(dTime) && dTime / 86400000 > 7) isStale = true;
                    }

                    return (
                      <div 
                        key={report._id || index} 
                        className={clsx("bg-white rounded-2xl shadow-sm border overflow-hidden relative", isStale ? 'border-orange-300' : 'border-gray-100')}
                        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => onTouchEndAction(report)}
                      >
                        {/* Mobile Card Layout */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => report._id && safeNavigate(`/reports/${report._id}/print`)}>
                              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0"><Stethoscope size={18} className="text-indigo-600" /></div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{report.procedureName || 'Unknown Procedure'}</p>
                                  <StatusBadge status={report.status} />
                                </div>
                                <p className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                                  {report.reportId || '-'} 
                                  {report.images?.length > 0 && <span className="flex items-center gap-1"><ImageIcon size={10}/>{report.images.length}</span>}
                                </p>
                              </div>
                            </div>
                            <MobileActions report={report} onView={() => report._id && safeNavigate(`/reports/${report._id}/print`)} onEdit={() => report._id && safeNavigate(`/reports/${report._id}`)} onDelete={() => setDeletingReport(report)} />
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0`}>{getInitials(report?.patient?.name)}</div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{report?.patient?.name || 'Unknown'}</p>
                                <p className="text-[11px] text-gray-400">{report?.patient?.age || '-'}Y / {report?.patient?.sex || '-'}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                               <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0"><Calendar size={12} />{formatDate(report.procedureDate)}</div>
                               {isStale && <span className="text-[10px] text-orange-500 font-medium">Stale Draft</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center border-t border-gray-50 bg-gray-50/50">
                          <button onClick={() => setPreviewReport(report)} className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"><Eye size={14} /> Quick Preview</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ✅ PAGINATION UI */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm mt-6 gap-4">
                <span className="text-sm text-gray-500 font-medium">
                  Showing <span className="font-bold text-indigo-600">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-indigo-600">{Math.min(currentPage * itemsPerPage, processedReports.length)}</span> of <span className="font-bold text-gray-900">{processedReports.length}</span> reports
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center justify-center min-w-[5rem] px-2 text-sm font-bold text-gray-800 bg-gray-50 rounded-xl py-2 border border-gray-100">
                    {currentPage} <span className="text-gray-400 font-medium mx-1">/</span> {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsList;