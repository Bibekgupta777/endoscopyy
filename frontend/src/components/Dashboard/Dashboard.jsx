import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FileText, Users, PlusCircle, Settings, TrendingUp, Activity } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State for Display Name (Fetched from Settings)
  const [displayName, setDisplayName] = useState(user?.name || 'Doctor');
  
  const [stats, setStats] = useState({
    totalReports: 0,
    totalPatients: 0,
    recentReports: [],
    proceduresByType: [],
    monthlyActivity: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      await Promise.all([fetchStats(), fetchSettingsName()]);
      setLoading(false);
    };
    loadDashboardData();
  }, []);

  // Fetch Admin Name from Settings
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

  const fetchStats = async () => {
    try {
      // Fetch basic data
      const [reportsRes, patientsRes] = await Promise.all([
        api.get('/reports?limit=100'), // Get more reports for analytics
        api.get('/patients?limit=1')
      ]);

      const reports = reportsRes.data.reports;

      // 1. Calculate Procedures by Type (for Pie Chart)
      const typeCount = {};
      reports.forEach(r => {
        typeCount[r.procedureName] = (typeCount[r.procedureName] || 0) + 1;
      });
      const pieData = Object.keys(typeCount).map(key => ({
        name: key,
        value: typeCount[key]
      }));

      // 2. Calculate Monthly Activity (for Bar Chart)
      const monthCount = {};
      reports.forEach(r => {
        const month = new Date(r.procedureDate).toLocaleString('default', { month: 'short' });
        monthCount[month] = (monthCount[month] || 0) + 1;
      });
      const barData = Object.keys(monthCount).map(key => ({
        name: key,
        procedures: monthCount[key]
      }));

      setStats({
        totalReports: reportsRes.data.total,
        totalPatients: patientsRes.data.total,
        recentReports: reports.slice(0, 5), // Only show top 5 in table
        proceduresByType: pieData,
        monthlyActivity: barData
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Welcome back, {displayName}</h1>
          <p className="mt-2 text-blue-100 opacity-90">
            Here is your endoscopy unit's performance overview.
          </p>
        </div>
        {/* Abstract Background Shape */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white opacity-5 transform skew-x-12 translate-x-10"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={PlusCircle} label="New Report" value="Create" 
          color="bg-blue-500" onClick={() => navigate('/reports/new')} 
        />
        <StatCard 
          icon={FileText} label="Total Reports" value={stats.totalReports} 
          color="bg-indigo-500" onClick={() => navigate('/reports')} 
        />
        <StatCard 
          icon={Users} label="Total Patients" value={stats.totalPatients} 
          color="bg-purple-500" onClick={() => navigate('/patients')} 
        />
        <StatCard 
          icon={Settings} label="Settings" value="Manage" 
          color="bg-gray-600" onClick={() => navigate('/settings')} 
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-600" size={20} />
            <h3 className="font-bold text-gray-800">Procedures per Month</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="procedures" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Procedure Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-purple-600" size={20} />
            <h3 className="font-bold text-gray-800">Procedure Types</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.proceduresByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.proceduresByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Recent Reports</h3>
          <button 
            onClick={() => navigate('/reports')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Procedure</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentReports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{report.patient?.name}</p>
                    <p className="text-xs text-gray-500">{report.patient?.patientId}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{report.procedureName}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(report.procedureDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'finalized' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/reports/${report._id}/print`)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper Component for the top cards
const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <h4 className="text-2xl font-bold text-gray-800 mt-1">{value}</h4>
      </div>
      <div className={`${color} p-3 rounded-xl text-white shadow-sm opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default Dashboard;