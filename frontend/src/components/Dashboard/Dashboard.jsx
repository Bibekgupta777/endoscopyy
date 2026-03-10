// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import api from '../../utils/api';
// import { FileText, Users, PlusCircle, Settings, TrendingUp, Activity } from 'lucide-react';
// import { 
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
//   PieChart, Pie, Cell, Legend 
// } from 'recharts';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// const Dashboard = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
  
//   // State for Display Name (Fetched from Settings)
//   const [displayName, setDisplayName] = useState(user?.name || 'Doctor');
  
//   const [stats, setStats] = useState({
//     totalReports: 0,
//     totalPatients: 0,
//     recentReports: [],
//     proceduresByType: [],
//     monthlyActivity: []
//   });

//   useEffect(() => {
//     const loadDashboardData = async () => {
//       await Promise.all([fetchStats(), fetchSettingsName()]);
//       setLoading(false);
//     };
//     loadDashboardData();
//   }, []);

//   // Fetch Admin Name from Settings
//   const fetchSettingsName = async () => {
//     try {
//       const { data } = await api.get('/settings');
//       if (data.adminName && data.adminName.trim() !== '') {
//         setDisplayName(data.adminName);
//       }
//     } catch (error) {
//       console.error('Failed to fetch settings name');
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       // Fetch basic data
//       const [reportsRes, patientsRes] = await Promise.all([
//         api.get('/reports?limit=100'), // Get more reports for analytics
//         api.get('/patients?limit=1')
//       ]);

//       const reports = reportsRes.data.reports;

//       // 1. Calculate Procedures by Type (for Pie Chart)
//       const typeCount = {};
//       reports.forEach(r => {
//         typeCount[r.procedureName] = (typeCount[r.procedureName] || 0) + 1;
//       });
//       const pieData = Object.keys(typeCount).map(key => ({
//         name: key,
//         value: typeCount[key]
//       }));

//       // 2. Calculate Monthly Activity (for Bar Chart)
//       const monthCount = {};
//       reports.forEach(r => {
//         const month = new Date(r.procedureDate).toLocaleString('default', { month: 'short' });
//         monthCount[month] = (monthCount[month] || 0) + 1;
//       });
//       const barData = Object.keys(monthCount).map(key => ({
//         name: key,
//         procedures: monthCount[key]
//       }));

//       setStats({
//         totalReports: reportsRes.data.total,
//         totalPatients: patientsRes.data.total,
//         recentReports: reports.slice(0, 5), // Only show top 5 in table
//         proceduresByType: pieData,
//         monthlyActivity: barData
//       });
//     } catch (error) {
//       console.error('Failed to fetch stats:', error);
//     }
//   };

//   if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500">
      
//       {/* Welcome Banner */}
//       <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
//         <div className="relative z-10">
//           <h1 className="text-3xl font-bold">Welcome back, {displayName}</h1>
//           <p className="mt-2 text-blue-100 opacity-90">
//             Here is your endoscopy unit's performance overview.
//           </p>
//         </div>
//         {/* Abstract Background Shape */}
//         <div className="absolute right-0 top-0 h-full w-1/3 bg-white opacity-5 transform skew-x-12 translate-x-10"></div>
//       </div>

//       {/* Quick Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <StatCard 
//           icon={PlusCircle} label="New Report" value="Create" 
//           color="bg-blue-500" onClick={() => navigate('/reports/new')} 
//         />
//         <StatCard 
//           icon={FileText} label="Total Reports" value={stats.totalReports} 
//           color="bg-indigo-500" onClick={() => navigate('/reports')} 
//         />
//         <StatCard 
//           icon={Users} label="Total Patients" value={stats.totalPatients} 
//           color="bg-purple-500" onClick={() => navigate('/patients')} 
//         />
//         <StatCard 
//           icon={Settings} label="Settings" value="Manage" 
//           color="bg-gray-600" onClick={() => navigate('/settings')} 
//         />
//       </div>

//       {/* Analytics Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
//         {/* Monthly Trend */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <div className="flex items-center gap-2 mb-6">
//             <TrendingUp className="text-blue-600" size={20} />
//             <h3 className="font-bold text-gray-800">Procedures per Month</h3>
//           </div>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={stats.monthlyActivity}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
//                 <YAxis axisLine={false} tickLine={false} />
//                 <Tooltip 
//                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
//                 />
//                 <Bar dataKey="procedures" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Procedure Distribution */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <div className="flex items-center gap-2 mb-6">
//             <Activity className="text-purple-600" size={20} />
//             <h3 className="font-bold text-gray-800">Procedure Types</h3>
//           </div>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={stats.proceduresByType}
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={60}
//                   outerRadius={80}
//                   paddingAngle={5}
//                   dataKey="value"
//                 >
//                   {stats.proceduresByType.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//                 <Legend verticalAlign="bottom" height={36}/>
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* Recent Reports Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//         <div className="p-6 border-b border-gray-100 flex justify-between items-center">
//           <h3 className="font-bold text-gray-800">Recent Reports</h3>
//           <button 
//             onClick={() => navigate('/reports')}
//             className="text-sm text-blue-600 hover:text-blue-800 font-medium"
//           >
//             View All
//           </button>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-left text-sm">
//             <thead className="bg-gray-50 text-gray-600">
//               <tr>
//                 <th className="px-6 py-4 font-semibold">Patient</th>
//                 <th className="px-6 py-4 font-semibold">Procedure</th>
//                 <th className="px-6 py-4 font-semibold">Date</th>
//                 <th className="px-6 py-4 font-semibold">Status</th>
//                 <th className="px-6 py-4 font-semibold text-right">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-50">
//               {stats.recentReports.map((report) => (
//                 <tr key={report._id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-6 py-4">
//                     <p className="font-medium text-gray-900">{report.patient?.name}</p>
//                     <p className="text-xs text-gray-500">{report.patient?.patientId}</p>
//                   </td>
//                   <td className="px-6 py-4 text-gray-700">{report.procedureName}</td>
//                   <td className="px-6 py-4 text-gray-500">
//                     {new Date(report.procedureDate).toLocaleDateString()}
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                       report.status === 'finalized' 
//                         ? 'bg-green-100 text-green-700 border border-green-200' 
//                         : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
//                     }`}>
//                       {report.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-right">
//                     <button
//                       onClick={() => navigate(`/reports/${report._id}/print`)}
//                       className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
//                     >
//                       View
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Helper Component for the top cards
// const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
//   <div 
//     onClick={onClick}
//     className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
//   >
//     <div className="flex items-center justify-between">
//       <div>
//         <p className="text-gray-500 text-sm font-medium">{label}</p>
//         <h4 className="text-2xl font-bold text-gray-800 mt-1">{value}</h4>
//       </div>
//       <div className={`${color} p-3 rounded-xl text-white shadow-sm opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
//         <Icon size={24} />
//       </div>
//     </div>
//   </div>
// );

// export default Dashboard;

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
  LayoutDashboard,
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

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-xs font-medium text-gray-600">{entry.value}</span>
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || 'Doctor');
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
    const loadDashboardData = async () => {
      await Promise.all([fetchStats(), fetchSettingsName()]);
      setLoading(false);
    };
    loadDashboardData();
  }, []);

  const fetchSettingsName = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.adminName && data.adminName.trim() !== '') {
        setDisplayName(data.adminName);
      }
    } catch (error) {
      console.error('Failed to fetch settings name');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setTimeout(() => setRefreshing(false), 600);
  };

  const fetchStats = async () => {
    try {
      const [reportsRes, patientsRes] = await Promise.all([
        api.get('/reports?limit=100'),
        api.get('/patients?limit=1'),
      ]);

      const reports = reportsRes.data.reports;

      const typeCount = {};
      reports.forEach((r) => {
        typeCount[r.procedureName] = (typeCount[r.procedureName] || 0) + 1;
      });
      const total = reports.length;
      const pieData = Object.keys(typeCount).map((key) => ({
        name: key,
        value: typeCount[key],
        total,
      }));

      const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthCount = {};
      const now = new Date();
      const thisMonth = now.toLocaleString('default', { month: 'short' });
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = lastMonthDate.toLocaleString('default', { month: 'short' });

      reports.forEach((r) => {
        const month = new Date(r.procedureDate).toLocaleString('default', { month: 'short' });
        monthCount[month] = (monthCount[month] || 0) + 1;
      });

      const barData = monthOrder
        .filter((m) => monthCount[m])
        .map((key) => ({
          name: key,
          procedures: monthCount[key],
        }));

      setStats({
        totalReports: reportsRes.data.total,
        totalPatients: patientsRes.data.total,
        recentReports: reports.slice(0, 6),
        proceduresByType: pieData,
        monthlyActivity: barData,
        thisMonthCount: monthCount[thisMonth] || 0,
        lastMonthCount: monthCount[lastMonth] || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGrowthPercent = () => {
    if (stats.lastMonthCount === 0) return stats.thisMonthCount > 0 ? 100 : 0;
    return (((stats.thisMonthCount - stats.lastMonthCount) / stats.lastMonthCount) * 100).toFixed(0);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Stethoscope className="text-white" size={28} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-800 font-semibold text-lg">Loading Dashboard</p>
          <p className="text-gray-400 text-sm mt-1">Preparing your workspace...</p>
        </div>
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
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 lg:p-10">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-300 text-xs font-medium tracking-wide uppercase">
                  Live Dashboard
                </span>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {getGreeting()}, <span className="text-indigo-300">{displayName}</span>
            </h1>
            <p className="text-slate-400 text-base max-w-lg">
              Monitor your endoscopy unit's performance, track procedures, and manage patient reports — all in one place.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar size={14} />
                <span>
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock size={14} />
                <span>
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all duration-300 text-sm font-medium"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/reports/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-all duration-300 shadow-lg shadow-indigo-500/25 text-sm font-medium group"
            >
              <PlusCircle size={16} />
              New Report
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          icon={FileText}
          label="Total Reports"
          value={stats.totalReports}
          sublabel="All time"
          gradient="from-indigo-500 to-indigo-600"
          lightBg="bg-indigo-50"
          lightText="text-indigo-600"
          onClick={() => navigate('/reports')}
        />
        <MetricCard
          icon={Users}
          label="Total Patients"
          value={stats.totalPatients}
          sublabel="Registered"
          gradient="from-emerald-500 to-emerald-600"
          lightBg="bg-emerald-50"
          lightText="text-emerald-600"
          onClick={() => navigate('/patients')}
        />
        <MetricCard
          icon={Activity}
          label="This Month"
          value={stats.thisMonthCount}
          sublabel={
            growth > 0
              ? `+${growth}% vs last month`
              : growth < 0
              ? `${growth}% vs last month`
              : 'No change'
          }
          trend={growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'}
          gradient="from-amber-500 to-orange-500"
          lightBg="bg-amber-50"
          lightText="text-amber-600"
        />
        <MetricCard
          icon={Sparkles}
          label="Procedure Types"
          value={stats.proceduresByType.length}
          sublabel="Categories"
          gradient="from-purple-500 to-purple-600"
          lightBg="bg-purple-50"
          lightText="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl">
                  <TrendingUp className="text-indigo-600" size={18} />
                </div>
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
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="procedures"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#colorProcedures)"
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="No monthly data available yet" />
              )}
            </div>
          </div>
        </div>

        {/* Procedure Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <Activity className="text-purple-600" size={18} />
              </div>
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
                    <Pie
                      data={stats.proceduresByType}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.proceduresByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
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

      {/* Recent Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <FileText className="text-blue-600" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Recent Reports</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Latest {stats.recentReports.length} of {stats.totalReports} reports
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium group transition-colors"
          >
            View All Reports
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {stats.recentReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Procedure
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentReports.map((report, index) => (
                  <tr
                    key={report._id}
                    className="hover:bg-indigo-50/30 transition-colors duration-150 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">
                            {report.patient?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {report.patient?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {report.patient?.patientId || '—'}
                          </p>
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
                        <span className="text-sm text-gray-600">
                          {new Date(report.procedureDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/reports/${report._id}/print`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all duration-200 opacity-70 group-hover:opacity-100"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="text-gray-300" size={28} />
            </div>
            <p className="text-gray-500 font-medium">No reports yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first report to see it here</p>
            <button
              onClick={() => navigate('/reports/new')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle size={16} />
              Create Report
            </button>
          </div>
        )}
      </div>

      {/* Quick Access Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          icon={PlusCircle}
          title="New Report"
          description="Create a new endoscopy report"
          onClick={() => navigate('/reports/new')}
          color="indigo"
        />
        <QuickAction
          icon={Users}
          title="Manage Patients"
          description="View and manage patient records"
          onClick={() => navigate('/patients')}
          color="emerald"
        />
        <QuickAction
          icon={Settings}
          title="Settings"
          description="Configure your preferences"
          onClick={() => navigate('/settings')}
          color="slate"
        />
      </div>
    </div>
  );
};

/* ─── Sub-Components ─── */

const MetricCard = ({ icon: Icon, label, value, sublabel, gradient, lightBg, lightText, trend, onClick }) => (
  <div
    onClick={onClick}
    className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-gray-200 ${
      onClick ? 'cursor-pointer' : ''
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <div className={`inline-flex items-center justify-center w-11 h-11 ${lightBg} rounded-xl`}>
          <Icon size={20} className={lightText} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
        </div>
      </div>
      {onClick && (
        <div className="p-2 rounded-lg bg-gray-50 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-1">
          <ArrowUpRight size={14} className="text-gray-400" />
        </div>
      )}
    </div>
    <div className="mt-3 flex items-center gap-2">
      {trend === 'up' && (
        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
          <ArrowUpRight size={12} />
          <span className="text-xs font-semibold">{sublabel}</span>
        </div>
      )}
      {trend === 'down' && (
        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
          <ArrowUpRight size={12} className="rotate-90" />
          <span className="text-xs font-semibold">{sublabel}</span>
        </div>
      )}
      {(!trend || trend === 'neutral') && (
        <span className="text-xs text-gray-400 font-medium">{sublabel}</span>
      )}
    </div>
    {/* Decorative gradient line at the top */}
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
  </div>
);

const StatusBadge = ({ status }) => {
  const configs = {
    finalized: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Finalized',
    },
    draft: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Draft',
    },
  };
  const config = configs[status] || configs.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const QuickAction = ({ icon: Icon, title, description, onClick, color }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    slate: 'bg-slate-100 text-slate-600 group-hover:bg-slate-200',
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 group text-left w-full"
    >
      <div className={`p-3 rounded-xl transition-colors duration-300 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
      </div>
      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </button>
  );
};

const EmptyChartState = ({ message }) => (
  <div className="h-full flex flex-col items-center justify-center">
    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
      <BarChart className="text-gray-300" size={24} />
    </div>
    <p className="text-sm text-gray-400 font-medium">{message}</p>
    <p className="text-xs text-gray-300 mt-1">Data will appear as reports are added</p>
  </div>
);

export default Dashboard;