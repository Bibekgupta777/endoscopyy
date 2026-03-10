// import axios from 'axios';

// const api = axios.create({
//   baseURL: '/api'
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
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from 'axios';

// 🔧 FIX: Use absolute URL. 
// Relative paths ('/api') fail in Electron Production because there is no proxy.
const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL
  // DO NOT set default Content-Type here
  // Axios will auto-set 'application/json' for objects
  // and 'multipart/form-data' for FormData
});

// Add token to requests
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
    // If FormData, let the browser set the Content-Type with boundary
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a network error, log it specifically
    if (error.message === 'Network Error') {
        console.error('Network Error: Ensure Backend is running at http://localhost:5000');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;