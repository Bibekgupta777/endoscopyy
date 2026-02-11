import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { LayoutDashboard, FileText, Users, Settings, LogOut, UserCircle } from 'lucide-react';
import clsx from 'clsx';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [branding, setBranding] = useState({
    name: 'ENDO-SYS',
    admin: user?.name || 'Doctor'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        // Safety check to prevent crash if data is missing
        setBranding({
          name: data?.hospitalName || 'ENDO-SYS',
          admin: data?.adminName || user?.name || 'Administrator'
        });
      } catch (e) {
        console.error("Layout load error", e);
      }
    };
    fetchSettings();
  }, [user]);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Patients', icon: Users, path: '/patients' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white shadow-xl hidden md:flex flex-col z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider text-blue-400 truncate">
            {branding.name ? branding.name.split(' ')[0] : 'ENDO'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Medical Admin</p>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  'w-full flex items-center px-4 py-3 text-sm font-medium transition-all rounded-lg mb-1',
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon size={18} className={clsx("mr-3", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="bg-slate-800 p-2 rounded-full">
               <UserCircle className="text-blue-400" size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate w-32">{branding.admin}</p>
              <p className="text-xs text-slate-500 truncate">Logged In</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;