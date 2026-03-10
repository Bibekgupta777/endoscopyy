import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
        
        :root {
          --primary-teal: #0A6E6E;
          --primary-teal-dark: #085252;
          --accent-coral: #E85D4A;
          --bg-cream: #FAF8F5;
          --bg-white: #FFFFFF;
          --text-primary: #1A2B2B;
          --text-secondary: #5A6B6B;
          --text-tertiary: #8A9B9B;
          --border-light: #E5E9E9;
          --border-medium: #CBD5D5;
          --error-red: #D64436;
          --error-bg: #FEF3F2;
          --success-green: #0A6E6E;
        }

        .login-container {
          min-height: 100vh;
          background: 
            linear-gradient(135deg, rgba(250, 248, 245, 0.92) 0%, rgba(240, 237, 232, 0.95) 100%),
            url('https://media.istockphoto.com/id/981992606/photo/endoscopy-at-the-hospital-doctor-holding-endoscope-before-gastroscopy.jpg?s=612x612&w=0&k=20&c=VvP0ERJJaP-kVy2LYuFVCMCKJkuVu8N0BhvXvD1PXDU=') center/cover no-repeat;
          background-attachment: fixed;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .login-container::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 80%;
          height: 120%;
          background: radial-gradient(circle, rgba(10, 110, 110, 0.03) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .login-container::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -15%;
          width: 60%;
          height: 80%;
          background: radial-gradient(circle, rgba(232, 93, 74, 0.02) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .login-card {
          background: var(--bg-white);
          width: 100%;
          max-width: 480px;
          border-radius: 16px;
          box-shadow: 
            0 2px 8px rgba(26, 43, 43, 0.03),
            0 12px 32px rgba(26, 43, 43, 0.06),
            0 0 0 1px var(--border-light);
          padding: 3.5rem 3rem;
          position: relative;
          z-index: 1;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header-section {
          margin-bottom: 2.5rem;
          text-align: center;
        }

        .brand-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 2rem;
          color: var(--primary-teal);
          margin: 0 0 0.5rem 0;
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .brand-subtitle {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          font-weight: 400;
          letter-spacing: 0.01em;
          margin: 0;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-light) 20%, var(--border-light) 80%, transparent);
          margin: 2rem 0;
        }

        .error-banner {
          background: var(--error-bg);
          border: 1px solid rgba(214, 68, 54, 0.2);
          color: var(--error-red);
          padding: 1rem 1.25rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-size: 0.9375rem;
          line-height: 1.5;
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }

        .form-group {
          margin-bottom: 1.75rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.625rem;
          letter-spacing: 0.01em;
        }

        .input-wrapper {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          font-size: 0.9375rem;
          color: var(--text-primary);
          background: var(--bg-white);
          border: 1.5px solid var(--border-medium);
          border-radius: 10px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: var(--text-tertiary);
        }

        .form-input:hover {
          border-color: var(--primary-teal);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary-teal);
          box-shadow: 0 0 0 4px rgba(10, 110, 110, 0.08);
        }

        .form-input.has-error {
          border-color: var(--error-red);
        }

        .form-input.has-error:focus {
          box-shadow: 0 0 0 4px rgba(214, 68, 54, 0.08);
        }

        .submit-button {
          width: 100%;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          color: var(--bg-white);
          background: var(--primary-teal);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
          position: relative;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .submit-button:hover::before {
          opacity: 1;
        }

        .submit-button:hover {
          background: var(--primary-teal-dark);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(10, 110, 110, 0.25);
        }

        .submit-button:active {
          transform: translateY(0);
        }

        .submit-button:disabled {
          background: var(--border-medium);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .submit-button:disabled::before {
          opacity: 0;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--bg-white);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .demo-credentials {
          margin-top: 2rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(10, 110, 110, 0.03) 0%, rgba(10, 110, 110, 0.05) 100%);
          border: 1px solid rgba(10, 110, 110, 0.1);
          border-radius: 10px;
          text-align: center;
        }

        .demo-title {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin: 0 0 0.75rem 0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .demo-info {
          font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
          color: var(--primary-teal);
          margin: 0;
          font-weight: 500;
        }

        .security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-light);
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        .security-icon {
          width: 16px;
          height: 16px;
          opacity: 0.6;
        }

        @media (max-width: 640px) {
          .login-card {
            padding: 2.5rem 2rem;
          }

          .brand-title {
            font-size: 1.75rem;
          }
        }
      `}</style>

      <div className="login-container">
        <div className="login-card">
          <div className="header-section">
            <h1 className="brand-title">Endoscopy System</h1>
            <p className="brand-subtitle">Medical Reporting Platform</p>
          </div>

          <div className="divider"></div>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`form-input ${error ? 'has-error' : ''}`}
                  placeholder="doctor@hospital.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`form-input ${error ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials</p>
            <p className="demo-info">admin@demo.com / password123</p>
          </div>

          <div className="security-badge">
            <svg className="security-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L3 3V7C3 10.5 5.5 13.5 8 14.5C10.5 13.5 13 10.5 13 7V3L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Secure Medical Portal
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;