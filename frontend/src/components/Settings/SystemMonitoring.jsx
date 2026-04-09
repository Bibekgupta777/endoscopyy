import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Database, HardDrive, RefreshCw, AlertCircle, CheckCircle, TrendingUp, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemMonitoring = () => {
  const [dbStats, setDbStats] = useState(null);
  const [collectionStats, setCollectionStats] = useState(null);
  const [systemMemory, setSystemMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAllStats = async () => {
    setIsRefreshing(true);
    try {
      if (!dbStats) setLoading(true);
      
      const [dbRes, colRes, memRes] = await Promise.all([
        api.get('/monitoring/db-stats').catch(() => ({ data: null })),
        api.get('/monitoring/collection-sizes').catch(() => ({ data: null })),
        api.get('/monitoring/system-info').catch(() => ({ data: null }))
      ]);
      
      setDbStats(dbRes.data);
      setCollectionStats(colRes.data);
      setSystemMemory(memRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchAllStats();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAllStats, 60000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleCleanup = async () => {
    if (!window.confirm('Delete reports older than 30 days? This cannot be undone!')) return;
    const toastId = toast.loading('Cleaning up old data...');
    try {
      const { data } = await api.post('/monitoring/cleanup-old-reports');
      toast.dismiss(toastId);
      toast.success(`✓ Deleted ${data.deletedCount} old reports`);
      fetchAllStats();
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Cleanup failed');
    }
  };

  if (loading && !dbStats) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-xl bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium">Gathering System Diagnostics...</p>
        </div>
      </div>
    );
  }

  const is32Bit = systemMemory?.arch === 'ia32' || systemMemory?.arch === 'x86';
  
  const dbSizeGb = parseFloat(dbStats?.dataSize?.gb || 0);
  const dbStorageGb = parseFloat(dbStats?.storageSize?.gb || 0);
  
  const isCritical = is32Bit && dbStorageGb > 2;
  const isWarning = is32Bit && dbStorageGb > 1;

  const dbStoragePercent = Math.min((dbStorageGb / 2) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="text-blue-600" /> Database & System Health
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {is32Bit ? "Monitoring strict 2GB limit for Windows 32-bit architecture." : "64-bit architecture detected. No strict database limits."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
            Auto-refresh (60s)
          </label>
          <button 
            onClick={fetchAllStats} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold transition"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> 
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Warning Banner (only on 32-bit when DB gets large) */}
      {(isWarning || isCritical) && (
        <div className={`p-5 rounded-xl border-2 flex items-start gap-3 shadow-sm ${isCritical ? 'bg-red-50 border-red-300 text-red-900' : 'bg-yellow-50 border-yellow-300 text-yellow-900'}`}>
          <AlertCircle size={28} className="mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-lg">{isCritical ? '🚨 CRITICAL: Database Limit Reached!' : '⚠️ WARNING: Database Size Growing'}</h4>
            <p className="text-sm mt-1 mb-3">
              {isCritical 
                ? 'Your database exceeds the safe 2GB limit for Windows 32-bit. The application may crash if not cleaned up.' 
                : 'Your database has exceeded 1GB. Consider cleaning up old unused records.'}
            </p>
            <button onClick={handleCleanup} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white shadow transition-all ${isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
              <Trash2 size={16} /> Delete Reports Older Than 30 Days
            </button>
          </div>
        </div>
      )}

      {/* ✅ CLEAN 4-BOX LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Box 1: Database (MERGED - Shows both data + storage in one box) */}
        <div className={`bg-white p-6 rounded-2xl border shadow-sm ${isCritical ? 'border-red-300 ring-2 ring-red-100' : ''}`}>
          <Database size={32} className={`mx-auto mb-2 ${isCritical ? 'text-red-500' : 'text-blue-600'}`} />
          <h3 className="font-bold text-gray-800 text-center">Database</h3>
          
          {/* Main number: Storage (the bigger, more important number) */}
          <p className={`text-3xl font-black mt-2 text-center ${isCritical ? 'text-red-600' : 'text-blue-600'}`}>
            {dbStorageGb.toFixed(2)} GB
          </p>
          
          <p className="text-[11px] text-gray-500 mt-1 mb-3 font-medium text-center">
            {is32Bit ? "Used out of 2.00 GB (32-bit Limit)" : "No strict limit (64-bit OS)"}
          </p>

          {/* Progress bar only on 32-bit */}
          {is32Bit && (
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
              <div className={`h-1.5 rounded-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${dbStoragePercent}%` }}></div>
            </div>
          )}
          
          {/* Sub-details: Data vs Storage breakdown */}
          <div className="border-t pt-3 mt-1 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Actual Data</span>
              <span className="text-xs font-bold text-gray-700">{dbStats?.dataSize?.mb} MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Reserved Storage</span>
              <span className="text-xs font-bold text-gray-700">{dbStats?.storageSize?.mb} MB</span>
            </div>
          </div>
        </div>

        {/* Box 2: PC Hard Drive */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <HardDrive size={32} className="mx-auto text-indigo-600 mb-2" />
          <h3 className="font-bold text-gray-800">PC Drive (C:)</h3>
          <p className="text-3xl font-black text-indigo-600 mt-2">{systemMemory?.disk?.usedGB || '0'} GB</p>
          <p className="text-[11px] text-gray-500 mt-1 mb-2 font-medium">Used out of {systemMemory?.disk?.totalGB || '0'} GB</p>
          {systemMemory?.disk && (
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
              <div className={`h-1.5 rounded-full ${systemMemory.disk.percentUsed > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${systemMemory.disk.percentUsed}%` }}></div>
            </div>
          )}
          {/* Sub-details */}
          <div className="border-t pt-3 mt-1 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Free Space</span>
              <span className="text-xs font-bold text-green-600">{systemMemory?.disk?.freeGB || '0'} GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Usage</span>
              <span className="text-xs font-bold text-gray-700">{systemMemory?.disk?.percentUsed || '0'}%</span>
            </div>
          </div>
        </div>

        {/* Box 3: Active Tables */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <CheckCircle size={32} className="mx-auto text-green-600 mb-2" />
          <h3 className="font-bold text-gray-800">Active Tables</h3>
          <p className="text-3xl font-black text-green-600 mt-2">{dbStats?.collections || '0'}</p>
          <p className="text-xs text-gray-500 mt-1 mb-2">Indexed safely</p>
          {/* Sub-details */}
          <div className="border-t pt-3 mt-4 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Total Indexes</span>
              <span className="text-xs font-bold text-gray-700">{dbStats?.indexes || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Avg Doc Size</span>
              <span className="text-xs font-bold text-gray-700">{dbStats?.avgObjSize || '0'} bytes</span>
            </div>
          </div>
        </div>

        {/* Box 4: RAM */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <TrendingUp size={32} className="mx-auto text-orange-600 mb-2" />
          <h3 className="font-bold text-gray-800">PC RAM</h3>
          <p className="text-3xl font-black text-orange-600 mt-2">{systemMemory?.usagePercent || '0'}%</p>
          <p className="text-[11px] text-gray-500 mt-1 mb-2 font-medium">
            {systemMemory?.usedMemory?.gb} GB of {systemMemory?.totalMemory?.gb} GB used
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
            <div className={`h-1.5 rounded-full ${parseFloat(systemMemory?.usagePercent || 0) > 90 ? 'bg-red-500' : parseFloat(systemMemory?.usagePercent || 0) > 70 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${systemMemory?.usagePercent || 0}%` }}></div>
          </div>
          {/* Sub-details */}
          <div className="border-t pt-3 mt-1 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Available</span>
              <span className="text-xs font-bold text-green-600">{systemMemory?.freeMemory?.gb} GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Total RAM</span>
              <span className="text-xs font-bold text-gray-700">{systemMemory?.totalMemory?.gb} GB</span>
            </div>
          </div>
        </div>

      </div>

      {/* Collection Breakdown */}
      {collectionStats && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Detailed App Storage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(collectionStats).map(([name, stats]) => (
              <div key={name} className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg">
                <div>
                  <p className="font-bold text-gray-700 capitalize">{name}</p>
                  <p className="text-xs text-gray-500">{stats.count} records</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-800">{stats.size.mb} MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1 mt-6">
        <Clock size={12} /> OS: {is32Bit ? '32-bit' : '64-bit'} • Last checked: {lastUpdated?.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SystemMonitoring;