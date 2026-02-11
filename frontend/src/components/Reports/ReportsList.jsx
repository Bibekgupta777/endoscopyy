import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Search, Plus, Filter, FileText, CheckCircle, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportsList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, [search, statusFilter]);

  const fetchReports = async () => {
    try {
      const { data } = await api.get(`/reports?search=${search}&status=${statusFilter}`);
      setReports(data.reports);
    } catch (error) { toast.error('Failed to load reports'); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (reportId, reportName) => {
    if (!window.confirm(`Delete report "${reportName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/reports/${reportId}`);
      toast.success('Report deleted');
      fetchReports(); // Refresh list
    } catch (e) { toast.error('Failed to delete report'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Endoscopy Reports</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage procedure reports</p>
        </div>
        <button onClick={() => navigate('/reports/new')} className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/30">
          <Plus size={18} /> Create New Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search by Report ID, Patient Name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
          <Filter size={18} className="text-gray-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="outline-none text-gray-700 bg-transparent cursor-pointer">
            <option value="">All Status</option>
            <option value="draft">Drafts</option>
            <option value="finalized">Finalized</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <FileText size={32} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Report Info</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Patient</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><FileText size={18} /></div>
                      <div>
                        <p className="font-medium text-gray-900">{report.procedureName}</p>
                        <p className="text-xs text-gray-500 font-mono">{report.reportId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{report.patient?.name}</p>
                    <p className="text-xs text-gray-500">{report.patient?.age}Y / {report.patient?.sex}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(report.procedureDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    {report.status === 'finalized' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                        <CheckCircle size={12} /> Finalized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                        <Clock size={12} /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => navigate(`/reports/${report._id}/print`)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View & Print"
                      >
                        <Eye size={18} />
                      </button>
                      {report.status === 'draft' && (
                        <button 
                          onClick={() => navigate(`/reports/${report._id}`)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Report"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(report._id, report.reportId)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Report"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsList;