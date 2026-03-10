import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Camera,
  ChevronDown,
  Activity,
  ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const [branding, setBranding] = useState({
    name: 'ENDO-SYS',
    admin: user?.name || 'Medical Staff',
    hospital: 'General Hospital'
  });

  // Fetch Branding Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setBranding({
          name: data?.hospitalName || 'ENDO-SYS',
          admin: data?.adminName || user?.name || 'Administrator',
          hospital: 'Medical Unit'
        });
      } catch (e) {
        // Fallback or silent error
      }
    };
    fetchSettings();
  }, [user]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Handle outside click for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Patients', icon: Users, path: '/patients' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Diagnostics', icon: Camera, path: '/camera-test' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = useCallback(
    (path) =>
      location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path)),
    [location.pathname]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* ════════════════════════════════════════════════════════════════════
          TOP NAVIGATION BAR (Glassmorphism)
          ════════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* 1. Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-indigo-500/30 transition-all duration-300">
              <Activity size={20} className="text-indigo-50" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none group-hover:text-indigo-700 transition-colors">
                {branding.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                  System Active
                </p>
              </div>
            </div>
          </div>

          {/* 2. Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={clsx(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-slate-100 text-indigo-700 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Icon size={18} className={clsx(active ? 'text-indigo-600' : 'text-slate-400')} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* 3. User Profile & Actions */}
          <div className="flex items-center gap-4">
            
            {/* Divider */}
            <div className="hidden md:block h-6 w-px bg-slate-200"></div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <div className="hidden lg:block text-right mr-1">
                  <p className="text-sm font-semibold text-slate-700 leading-none">
                    {branding.admin}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Admin</p>
                </div>
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 shadow-sm">
                  <User size={20} />
                </div>
                <ChevronDown size={14} className={clsx("text-slate-400 transition-transform duration-200 hidden sm:block", profileOpen && "rotate-180")} />
              </button>

              {/* Enhanced Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1 lg:hidden">
                    <p className="text-sm font-semibold text-slate-900">{branding.admin}</p>
                    <p className="text-xs text-slate-500">Administrator</p>
                  </div>
                  
                  <div className="px-2">
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <Settings size={16} /> Account Settings
                    </button>
                    
                  </div>

                  <div className="my-1 border-t border-slate-100"></div>

                  <div className="px-2">
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE MENU (Slide Down)
          ════════════════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden pt-16">
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl animate-in slide-in-from-top-2 duration-300">
            <div className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all',
                      active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <div className={clsx("p-1.5 rounded-lg", active ? "bg-indigo-100" : "bg-slate-100")}>
                      <Icon size={18} className={active ? 'text-indigo-600' : 'text-slate-500'} />
                    </div>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{branding.admin}</p>
                  <p className="text-xs text-slate-500">System Administrator</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-red-600 font-medium hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
      
    </div>
  );
};

export default MainLayout;