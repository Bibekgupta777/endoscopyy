import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  FileText,
  Users,
  PlusCircle,
  Settings,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Clock,
  ChevronRight,
  Stethoscope,
  Eye,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

import heroImage from '../../assets/rrrr.avif';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const useSafeNavigate = () => {
  try { return useNavigate(); } catch (e) { return (path) => { window.location.hash = `#${path}`; }; }
};

const useSafeAuth = () => {
  try { return useAuth(); } catch (e) { return { user: null }; }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-gray-900 mt-0.5">
          {payload[0].value} <span className="text-sm font-normal text-gray-500">procedures</span>
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-900">{payload[0].name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {payload[0].value} procedures ({((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
    {payload?.map((entry, index) => (
      <div key={index} className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
        <span className="text-xs font-medium text-gray-600">{entry.value}</span>
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  const navigate = useSafeNavigate();
  const { user } = useSafeAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || 'Administrator');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalReports: 0,
    totalPatients: 0,
    recentReports: [],
    proceduresByType: [],
    monthlyActivity: [],
    thisMonthCount: 0,
    lastMonthCount: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try { await Promise.all([fetchStats(), fetchSettingsName()]); } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const fetchSettingsName = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data?.adminName?.trim()) setDisplayName(data.adminName);
    } catch (e) {}
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await fetchStats(); } catch (e) {}
    setTimeout(() => setRefreshing(false), 600);
  };

  const fetchStats = async () => {
    try {
      const [reportsRes, patientsRes] = await Promise.all([
        api.get('/reports?limit=100').catch(() => ({ data: { reports: [], total: 0 } })),
        api.get('/patients?limit=1').catch(() => ({ data: { total: 0 } })),
      ]);
      const reports = reportsRes.data?.reports ?? [];
      const totalReports = reportsRes.data?.total ?? 0;
      const totalPatients = patientsRes.data?.total ?? 0;
      const typeCount = {};
      reports.forEach((r) => { const p = r?.procedureName || 'Unknown'; typeCount[p] = (typeCount[p] || 0) + 1; });
      const total = reports.length;
      const pieData = Object.keys(typeCount).map((k) => ({ name: k, value: typeCount[k], total }));
      const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthCount = {};
      const now = new Date();
      let thisMonth = now.toLocaleString('default', { month: 'short' });
      let lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'short' });
      reports.forEach((r) => { if (r?.procedureDate) { const m = new Date(r.procedureDate).toLocaleString('default', { month: 'short' }); monthCount[m] = (monthCount[m] || 0) + 1; } });
      const barData = monthOrder.filter((m) => monthCount[m]).map((k) => ({ name: k, procedures: monthCount[k] }));
      setStats({ totalReports, totalPatients, recentReports: reports.slice(0, 6), proceduresByType: pieData, monthlyActivity: barData, thisMonthCount: monthCount[thisMonth] || 0, lastMonthCount: monthCount[lastMonth] || 0 });
    } catch (e) { console.error(e); }
  };

  const getGreeting = () => { const h = currentTime.getHours(); if (h < 12) return 'Good Morning'; if (h < 17) return 'Good Afternoon'; return 'Good Evening'; };
  const getGrowthPercent = () => { if (stats.lastMonthCount === 0) return stats.thisMonthCount > 0 ? 100 : 0; return (((stats.thisMonthCount - stats.lastMonthCount) / stats.lastMonthCount) * 100).toFixed(0); };
  const safeNavigate = (path) => { try { navigate(path); } catch (e) { window.location.hash = `#${path}`; } };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
          <Stethoscope className="text-white" size={28} />
        </div>
        <p className="text-gray-800 font-semibold text-lg">Loading Dashboard</p>
        <p className="text-gray-400 text-sm">Preparing your workspace...</p>
        <div className="flex gap-1 mt-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  const growth = getGrowthPercent();

  return (
    <div className="space-y-6 pb-8">

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  COMBINED HERO + METRIC CARDS — One bg image spans both       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl transform-gpu" /* <-- ADDED transform-gpu to fix scroll lag */
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'contain',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for hero text area */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {/* Top part: dark for hero text */}
          <div className="h-[100%] bg-gradient-to-r from-[#1B1B3A] via-[#1B1B3A]/95 to-[#1B1B3A]/30" />
          {/* Bottom part: light for cards */}
          <div className="h-[35%] bg-gradient-to-r from-white/95 via-white/90 to-white/80" />
        </div>

        {/* Smooth transition between dark and light */}
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <div className="absolute top-[60%] left-0 right-0 h-[15%] bg-gradient-to-b from-[#1B1B3A]/80 to-transparent" />
        </div>

        <div className="relative z-[3]">

          {/* ── Hero Content ── */}
          <div className="p-8 lg:p-10 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/15">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-[11px] font-bold tracking-widest uppercase">Live Dashboard</span>
                </div>
                <h1 className="text-3xl lg:text-[40px] font-bold text-white tracking-tight leading-tight">
                  {getGreeting()}, <span className="text-indigo-300">{displayName}</span>
                </h1>
                <p className="text-slate-300 text-base lg:text-lg max-w-xl leading-relaxed">
                  Monitor your endoscopy unit's performance, track procedures, and manage patient reports — all in one place.
                </p>
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2.5 text-slate-400 text-sm font-medium">
                    <Calendar size={16} />
                    <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400 text-sm font-medium">
                    <Clock size={16} />
                    <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start lg:self-center">
                <button onClick={handleRefresh} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm font-semibold transform-gpu">
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />Refresh
                </button>
                <button onClick={() => safeNavigate('/reports/new')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/25 text-sm font-semibold group transform-gpu">
                  <PlusCircle size={16} />New Report
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Metric Cards ── */}
          <div className="px-8 lg:px-10 pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard icon={FileText} label="Total Reports" value={stats.totalReports} sublabel="All time" gradient="from-indigo-500 to-indigo-600" lightBg="bg-indigo-50" lightText="text-indigo-600" onClick={() => safeNavigate('/reports')} />
              <MetricCard icon={Users} label="Total Patients" value={stats.totalPatients} sublabel="Registered" gradient="from-emerald-500 to-emerald-600" lightBg="bg-emerald-50" lightText="text-emerald-600" onClick={() => safeNavigate('/patients')} />
              <MetricCard icon={Activity} label="This Month" value={stats.thisMonthCount} sublabel={growth > 0 ? `+${growth}% vs last month` : growth < 0 ? `${growth}% vs last month` : 'No change'} trend={growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'} gradient="from-amber-500 to-orange-500" lightBg="bg-amber-50" lightText="text-amber-600" />
              <MetricCard icon={Sparkles} label="Procedure Types" value={stats.proceduresByType.length} sublabel="Categories" gradient="from-purple-500 to-purple-600" lightBg="bg-purple-50" lightText="text-purple-600" />
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  CHARTS                                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform-gpu">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl"><TrendingUp className="text-indigo-600" size={18} /></div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">Monthly Activity</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Procedure volume trends</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" />
                <span className="text-xs text-gray-500 font-medium">Procedures</span>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 pt-2">
            <div className="h-72">
              {stats.monthlyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyActivity} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="colorProcedures" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="procedures" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorProcedures)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="No monthly data available yet" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform-gpu">
          <div className="p-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl"><Activity className="text-purple-600" size={18} /></div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Distribution</h3>
                <p className="text-xs text-gray-400 mt-0.5">By procedure type</p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="h-72">
              {stats.proceduresByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.proceduresByType} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {stats.proceduresByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend content={<CustomLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="No procedure data yet" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  RECENT REPORTS TABLE                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform-gpu">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl"><FileText className="text-blue-600" size={18} /></div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Recent Reports</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest {stats.recentReports.length} of {stats.totalReports} reports</p>
            </div>
          </div>
          <button onClick={() => safeNavigate('/reports')} className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium group transition-colors">
            View All Reports<ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {stats.recentReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Procedure</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentReports.map((report) => (
                  <tr key={report._id} className="hover:bg-indigo-50/30 transition-colors duration-150 group cursor-pointer" onClick={() => safeNavigate(`/reports/${report._id}/print`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">{report.patient?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{report.patient?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400 font-mono">{report.patient?.patientId || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{report.procedureName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{new Date(report.procedureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={report.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); safeNavigate(`/reports/${report._id}/print`); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all opacity-70 group-hover:opacity-100">
                        <Eye size={14} />View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="text-gray-300" size={28} /></div>
            <p className="text-gray-500 font-medium">No reports yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first report to see it here</p>
            <button onClick={() => safeNavigate('/reports/new')} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
              <PlusCircle size={16} />Create Report
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  QUICK ACCESS                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction icon={PlusCircle} title="New Report" description="Create a new endoscopy report" onClick={() => safeNavigate('/reports/new')} color="indigo" />
        <QuickAction icon={Users} title="Manage Patients" description="View and manage patient records" onClick={() => safeNavigate('/patients')} color="emerald" />
        <QuickAction icon={Settings} title="Settings" description="Configure your preferences" onClick={() => safeNavigate('/settings')} color="slate" />
      </div>
    </div>
  );
};

/* ─── Sub Components ─── */

const MetricCard = ({ icon: Icon, label, value, sublabel, gradient, lightBg, lightText, trend, onClick }) => (
  // 🚀 FIXED: Removed backdrop-blur to eliminate scroll lag! Solid white background makes scrolling perfectly smooth.
  <div onClick={onClick} className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden group transition-all duration-200 hover:shadow-md hover:border-gray-200 transform-gpu ${onClick ? 'cursor-pointer' : ''}`}>
    <div className="relative z-10">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className={`inline-flex items-center justify-center w-11 h-11 ${lightBg} rounded-xl`}><Icon size={20} className={lightText} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
          </div>
        </div>
        {onClick && (<div className="p-2 rounded-lg bg-gray-50 opacity-0 group-hover:opacity-100 transition-all duration-300"><ArrowUpRight size={14} className="text-gray-400" /></div>)}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {trend === 'up' && (<div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><ArrowUpRight size={12} /><span className="text-xs font-semibold">{sublabel}</span></div>)}
        {trend === 'down' && (<div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-md"><ArrowUpRight size={12} className="rotate-90" /><span className="text-xs font-semibold">{sublabel}</span></div>)}
        {(!trend || trend === 'neutral') && (<span className="text-xs text-gray-400 font-medium">{sublabel}</span>)}
      </div>
    </div>
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20`} />
  </div>
);

const StatusBadge = ({ status }) => {
  const configs = {
    finalized: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Finalized' },
    draft: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Draft' },
  };
  const c = configs[status] || configs.draft;
  return (<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}</span>);
};

const QuickAction = ({ icon: Icon, title, description, onClick, color }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    slate: 'bg-slate-100 text-slate-600 group-hover:bg-slate-200',
  };
  return (
    <button onClick={onClick} className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 group text-left w-full transform-gpu">
      <div className={`p-3 rounded-xl transition-colors duration-300 ${colorMap[color]}`}><Icon size={20} /></div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
};

const EmptyChartState = ({ message }) => (
  <div className="h-full flex flex-col items-center justify-center">
    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3"><BarChart className="text-gray-300" size={24} /></div>
    <p className="text-sm text-gray-400 font-medium">{message}</p>
    <p className="text-xs text-gray-300 mt-1">Data will appear as reports are added</p>
  </div>
);

export default Dashboard;