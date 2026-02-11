import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Import Toast
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout'; // Import Layout

import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import CreateReport from './components/Reports/CreateReport';
import ReportsList from './components/Reports/ReportsList';
import PrintReport from './components/Reports/PrintReport';
import PatientList from './components/Patients/PatientList';
import Settings from './components/Settings/Settings';
import FindingsPanel from './components/Reports/FindingsPanel';

// Wrapper for protected routes to apply Layout
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Router>
      <Toaster position="top-right" /> {/* Toast Container */}
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><ReportsList /></PrivateRoute>} />
        <Route path="/reports/new" element={<PrivateRoute><CreateReport /></PrivateRoute>} />
        <Route path="/reports/:id" element={<PrivateRoute><CreateReport /></PrivateRoute>} />
        <Route path="/reports/findings-panel" element={<PrivateRoute><FindingsPanel /></PrivateRoute>} />
        
        {/* Print page should NOT have the sidebar layout */}
        <Route path="/reports/:id/print" element={<PrintReport />} />
        
        <Route path="/patients" element={<PrivateRoute><PatientList /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;