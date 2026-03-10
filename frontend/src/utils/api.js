

// import axios from 'axios';

// // 🔧 FIX: Use absolute URL. 
// // Relative paths ('/api') fail in Electron Production because there is no proxy.
// const BASE_URL = 'http://localhost:5000/api';

// const api = axios.create({
//   baseURL: BASE_URL
//   // DO NOT set default Content-Type here
//   // Axios will auto-set 'application/json' for objects
//   // and 'multipart/form-data' for FormData
// });

// // Add token to requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     // Only set Content-Type to JSON if data is NOT FormData
//     if (config.data && !(config.data instanceof FormData)) {
//       config.headers['Content-Type'] = 'application/json';
//     }
//     // If FormData, let the browser set the Content-Type with boundary
    
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Handle response errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // If we get a network error, log it specifically
//     if (error.message === 'Network Error') {
//         console.error('Network Error: Ensure Backend is running at http://localhost:5000');
//     }

//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;


// frontend/src/utils/api.js
import axios from 'axios';

/**
 * API baseURL selection (works for):
 * 1) Local dev (localhost) -> http://localhost:5000/api
 * 2) Deployed (Vercel) -> set VITE_API_BASE to your Render backend, e.g.
 *    VITE_API_BASE=https://your-backend.onrender.com/api
 * 3) Electron:
 *    - If you bundle/run a local backend -> keep localhost reachable
 *    - If you want cloud backend -> set VITE_API_BASE at build time
 *
 * Optional behavior:
 * - If you set VITE_API_BASE, we will prefer it when not on localhost.
 * - We also do a lightweight runtime health check and automatically switch
 *   between local and remote if one is reachable.
 */

// ---- Configure these two endpoints
const LOCAL_API = 'http://localhost:5000/api';

// In production (Vercel), set this env var:
// VITE_API_BASE=https://<your-render-backend>.onrender.com/api
const REMOTE_API = import.meta.env.VITE_API_BASE;

// Fallback remote (only used if REMOTE_API is not set)
// Put your Render URL here if you want a hard fallback; otherwise leave null.
const HARD_REMOTE_FALLBACK = null; // e.g. 'https://your-backend.onrender.com/api'

// ---- Helpers
const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const pickInitialBaseURL = () => {
  // Local dev: default to local backend
  if (isLocalhost) return LOCAL_API;

  // Deployed: prefer env remote
  if (REMOTE_API) return REMOTE_API;

  // If no env var set, fallback to local (useful if Electron runs local backend)
  if (!REMOTE_API && !HARD_REMOTE_FALLBACK) return LOCAL_API;

  return HARD_REMOTE_FALLBACK || LOCAL_API;
};

const api = axios.create({
  baseURL: pickInitialBaseURL(),
  timeout: 30000, // 30s; adjust as needed for LAN
});

// ---- Runtime auto-switch (optional but useful)
// If local backend is running, prefer it. Else prefer remote if reachable.
// If neither reachable, keep the current baseURL and let requests fail gracefully.
async function canReachApiBase(apiBase) {
  if (!apiBase) return false;
  try {
    const origin = apiBase.replace(/\/api\/?$/, '');
    // your backend has /api/health
    await fetch(`${origin}/api/health`, { method: 'GET', cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}

(async () => {
  // Priority order:
  // 1) If localhost API reachable -> use it (best for offline/LAN)
  // 2) Else if remote reachable -> use it
  // 3) Else keep initial baseURL
  const localOk = await canReachApiBase(LOCAL_API);
  if (localOk) {
    api.defaults.baseURL = LOCAL_API;
    return;
  }

  const remoteCandidate = REMOTE_API || HARD_REMOTE_FALLBACK;
  const remoteOk = await canReachApiBase(remoteCandidate);
  if (remoteOk) {
    api.defaults.baseURL = remoteCandidate;
  }
})();

// ---- Attach token + content type handling (your logic preserved)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only set Content-Type to JSON if data is NOT FormData
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response error handling (your logic preserved, slightly safer redirect)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network/server unreachable
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error(`Network Error: Backend not reachable (current baseURL: ${api.defaults.baseURL})`);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Use hash routing if present, else normal
      const isHash = window.location.hash?.startsWith('#');
      window.location.href = isHash ? '#/login' : '/login';
    }

    return Promise.reject(error);
  }
);

export default api;