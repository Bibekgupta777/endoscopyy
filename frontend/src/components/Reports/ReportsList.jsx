import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageURL } from '../../utils/api';
import {
  Search, Plus, Filter, FileText, CheckCircle,
  Clock, Eye, Edit, Trash2, ChevronRight,
  MoreVertical, X, RefreshCw, ArrowRight,
  AlertCircle, Loader2, Stethoscope, Calendar,
  User, Hash, ArrowUpRight, Activity, Shield,
  Download, Printer, SlidersHorizontal, LayoutList,
  ChevronDown, Sparkles, TrendingUp, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const isFinalized = status === 'finalized';
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
        isFinalized
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full',
          isFinalized ? 'bg-emerald-500' : 'bg-amber-500'
        )}
      />
      {/* Changed label from Finalized to Completed to imply it is done, but not locked */}
      {isFinalized ? 'Completed' : 'Draft'}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   DELETE CONFIRMATION MODAL
   ═══════════════════════════════════════════════════════════════════ */
const DeleteConfirmModal = ({ reportName, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">Delete Report</h3>
      <p className="text-gray-500 text-sm mt-2 leading-relaxed">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-700">{reportName}</span>?
        <span className="block mt-1 text-red-500 font-medium text-xs">
          All images will also be permanently deleted from cloud storage.
        </span>
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
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   TABLE SKELETON
   ═══════════════════════════════════════════════════════════════════ */
const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 animate-pulse"
        style={{ animationDelay: `${i * 75}ms` }}
      >
        <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-gray-100 rounded-lg w-2/5" />
          <div className="h-3 bg-gray-50 rounded-lg w-1/4" />
        </div>
        <div className="h-6 bg-gray-100 rounded-lg w-20 hidden sm:block" />
        <div className="h-4 bg-gray-50 rounded-lg w-24 hidden md:block" />
        <div className="h-8 bg-gray-100 rounded-lg w-16 hidden md:block" />
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MOBILE ACTIONS DROPDOWN
   ═══════════════════════════════════════════════════════════════════ */
const MobileActions = ({ report, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={clsx(
          'p-2 rounded-xl transition-all',
          open
            ? 'bg-gray-100 text-gray-700'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        )}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-2 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Eye size={15} className="text-indigo-600" />
            </div>
            View & Print
          </button>
          
          {/* ✅ Edit button is now ALWAYS visible */}
          <button
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Edit size={15} className="text-emerald-600" />
            </div>
            Edit Report
          </button>
          
          <div className="border-t border-gray-100 my-1.5 mx-4" />
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Trash2 size={15} className="text-red-500" />
            </div>
            Delete Report
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN: REPORTS LIST
   ═══════════════════════════════════════════════════════════════════ */
const ReportsList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deletingReport, setDeletingReport] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/reports?search=${search}&status=${statusFilter}`
      );
      setReports(data.reports);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchReports, 300);
    return () => clearTimeout(debounce);
  }, [fetchReports]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleDelete = async () => {
    if (!deletingReport) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/reports/${deletingReport._id}`);
      toast.success('Report deleted successfully');
      setDeletingReport(null);
      fetchReports();
    } catch {
      toast.error('Failed to delete report');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // Stats
  const totalReports = reports.length;
  const draftCount = reports.filter((r) => r.status === 'draft').length;
  const finalizedCount = reports.filter((r) => r.status === 'finalized').length;
  const activeFilters = [statusFilter].filter(Boolean).length;

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const gradients = [
    'from-indigo-500 to-indigo-600',
    'from-emerald-500 to-emerald-600',
    'from-purple-500 to-purple-600',
    'from-amber-500 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-teal-500',
  ];

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      {/* Delete Modal */}
      {deletingReport && (
        <DeleteConfirmModal
          reportName={deletingReport.reportId || deletingReport.procedureName}
          onConfirm={handleDelete}
          onCancel={() => setDeletingReport(null)}
          loading={deleteLoading}
        />
      )}

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <FileText size={20} className="text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Reports
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-12">
            View, manage and track all endoscopy procedure reports
          </p>
        </div>
        <button
          onClick={() => navigate('/reports/new')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-lg shadow-indigo-500/20 group"
        >
          <Plus size={18} />
          <span>New Report</span>
          <ArrowRight
            size={14}
            className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all"
          />
        </button>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          icon={LayoutList}
          label="Total"
          value={totalReports}
          color="indigo"
          active={statusFilter === ''}
          onClick={() => setStatusFilter('')}
        />
        <StatsCard
          icon={Edit}
          label="Drafts"
          value={draftCount}
          color="amber"
          active={statusFilter === 'draft'}
          onClick={() =>
            setStatusFilter(statusFilter === 'draft' ? '' : 'draft')
          }
        />
        <StatsCard
          icon={Shield}
          label="Completed"
          value={finalizedCount}
          color="emerald"
          active={statusFilter === 'finalized'}
          onClick={() =>
            setStatusFilter(statusFilter === 'finalized' ? '' : 'finalized')
          }
        />
      </div>

      {/* ═══ SEARCH & FILTERS ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-0 z-30 sm:static">
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
          <Search className="text-gray-400 flex-shrink-0" size={20} />
          <input
            type="text"
            placeholder="Search by patient name, procedure, or report ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-gray-800 bg-transparent placeholder-gray-400 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          )}

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Desktop Filter */}
          <div className="hidden sm:flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="outline-none text-sm text-gray-600 font-medium bg-transparent cursor-pointer py-1 pr-6 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.2em 1.2em',
              }}
            >
              <option value="">All Status</option>
              <option value="draft">Drafts Only</option>
              <option value="finalized">Completed Only</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="hidden sm:flex p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'animate-spin' : ''}
            />
          </button>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={clsx(
              'sm:hidden p-2.5 rounded-xl border transition-all relative',
              showFilters || activeFilters > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'border-gray-200 text-gray-400'
            )}
          >
            <SlidersHorizontal size={16} />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Search Results Count */}
        {(search || statusFilter) && !loading && (
          <div className="px-5 py-2.5 bg-gray-50/80 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Found{' '}
              <span className="font-semibold text-gray-600">
                {reports.length}
              </span>{' '}
              report{reports.length !== 1 ? 's' : ''}
              {search && (
                <span>
                  {' '}
                  for "<span className="text-gray-600">{search}</span>"
                </span>
              )}
              {statusFilter && (
                <span>
                  {' '}
                  •{' '}
                  <span className="text-gray-600 capitalize">
                    {statusFilter === 'finalized' ? 'Completed' : statusFilter}
                  </span>
                </span>
              )}
            </span>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Mobile Filter Drawer */}
        <div
          className={clsx(
            'sm:hidden border-t border-gray-100 bg-gray-50/50 transition-all duration-300 overflow-hidden',
            showFilters ? 'max-h-40 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'
          )}
        >
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 block">
            Filter by Status
          </label>
          <div className="flex gap-2">
            {[
              { value: '', label: 'All', icon: LayoutList },
              { value: 'draft', label: 'Drafts', icon: Edit },
              { value: 'finalized', label: 'Completed', icon: CheckCircle },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setShowFilters(false);
                }}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all',
                  statusFilter === opt.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <opt.icon size={14} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      {loading ? (
        <TableSkeleton />
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <FileText size={36} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {search || statusFilter ? 'No reports found' : 'No reports yet'}
          </h3>
          <p className="text-gray-400 text-sm mt-1.5 max-w-sm mx-auto">
            {search || statusFilter
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Create your first endoscopy report to get started.'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            {(search || statusFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
                className="px-4 py-2.5 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => navigate('/reports/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} /> Create Report
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ─── Desktop Table ─── */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report, index) => (
                  <tr
                    key={report._id}
                    className="hover:bg-indigo-50/30 transition-colors duration-150 group cursor-pointer"
                    onClick={() => navigate(`/reports/${report._id}/print`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                          <Stethoscope
                            size={18}
                            className="text-indigo-600"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {report.procedureName}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {report.reportId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${
                            gradients[index % gradients.length]
                          } flex-shrink-0`}
                        >
                          {getInitials(report.patient?.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {report.patient?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {report.patient?.age}Y / {report.patient?.sex}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar
                          size={14}
                          className="text-gray-400 flex-shrink-0"
                        />
                        {formatDate(report.procedureDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            navigate(`/reports/${report._id}/print`)
                          }
                          className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="View & Print"
                        >
                          <Eye size={17} />
                        </button>
                        
                        {/* ✅ Edit button ALWAYS shown */}
                        <button
                          onClick={() => navigate(`/reports/${report._id}`)}
                          className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          title="Edit Report"
                        >
                          <Edit size={17} />
                        </button>

                        <button
                          onClick={() => setDeletingReport(report)}
                          className="p-2 rounded-xl text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Report"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── Mobile Cards ─── */}
          <div className="md:hidden space-y-3">
            {reports.map((report, index) => (
              <div
                key={report._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Card Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left */}
                    <div
                      className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() =>
                        navigate(`/reports/${report._id}/print`)
                      }
                    >
                      <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Stethoscope size={18} className="text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {report.procedureName}
                          </p>
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono">
                          {report.reportId}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <MobileActions
                      report={report}
                      onView={() => navigate(`/reports/${report._id}/print`)}
                      onEdit={() => navigate(`/reports/${report._id}`)}
                      onDelete={() => setDeletingReport(report)}
                    />
                  </div>

                  {/* Patient & Date */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br ${
                          gradients[index % gradients.length]
                        } flex-shrink-0`}
                      >
                        {getInitials(report.patient?.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {report.patient?.name || 'Unknown'}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {report.patient?.age}Y / {report.patient?.sex}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0 ml-3">
                      <Calendar size={12} />
                      {formatDate(report.procedureDate)}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center border-t border-gray-50 divide-x divide-gray-50">
                  <button
                    onClick={() =>
                      navigate(`/reports/${report._id}/print`)
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Eye size={14} /> View
                  </button>
                  
                  {/* ✅ Edit button ALWAYS shown */}
                  <button
                    onClick={() => navigate(`/reports/${report._id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  
                  <button
                    onClick={() => setDeletingReport(report)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   STATS CARD SUB-COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
const StatsCard = ({ icon: Icon, label, value, color, active, onClick }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      activeBorder: 'border-indigo-400',
      activeRing: 'ring-indigo-100',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      activeBorder: 'border-amber-400',
      activeRing: 'ring-amber-100',
      gradient: 'from-amber-500 to-orange-500',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      activeBorder: 'border-emerald-400',
      activeRing: 'ring-emerald-100',
      gradient: 'from-emerald-500 to-emerald-600',
    },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300 group relative overflow-hidden',
        active
          ? `${c.activeBorder} ring-2 ${c.activeRing} shadow-sm`
          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
      )}
    >
      <div
        className={clsx(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-opacity duration-300',
          c.gradient,
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={clsx(
            'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors',
            active ? c.bg : 'bg-gray-50 group-hover:' + c.bg
          )}
        >
          <Icon
            size={18}
            className={clsx(active ? c.text : 'text-gray-400 group-hover:' + c.text)}
          />
        </div>
      </div>
    </button>
  );
};

export default ReportsList;