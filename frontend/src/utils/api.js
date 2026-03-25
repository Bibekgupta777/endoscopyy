import axios from 'axios';
import toast from 'react-hot-toast';

// ✅ 100% Offline - Always use the local server
const getBaseURL = () => {
  // Always use 127.0.0.1 for offline mode
  return 'http://127.0.0.1:5000/api';
};

const BASE_URL = getBaseURL();
console.log('🌐 API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use(
  function(config) {
    var token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  function(response) {
    return response;
  },
  function(error) {
    if (error.message === 'Network Error') {
      console.error('❌ Network Error: Backend not reachable at', BASE_URL);
      toast.error('Cannot connect to server. Make sure the server is running.');
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ✅ Get server URL (without /api)
export const getServerURL = function() {
  return 'http://127.0.0.1:5000';
};

// ✅ FIXED: Get full image URL - Always use local server
export const getImageURL = function(imagePath) {
  if (!imagePath) return '';
  
  // If it's already a full localhost URL, return as-is
  if (imagePath.startsWith('http://127.0.0.1:5000')) {
    return imagePath;
  }
  
  // If it's already a full localhost URL with "localhost"
  if (imagePath.startsWith('http://localhost:5000')) {
    return imagePath.replace('http://localhost:5000', 'http://127.0.0.1:5000');
  }
  
  // If it's a data URI (base64), return as-is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If it's a Cloudinary URL or any other http URL, we need to handle it
  // For offline mode, these won't work, but let's not break the app
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.warn('⚠️ External URL detected (will not work offline):', imagePath);
    return imagePath;
  }
  
  // Clean up the path
  var cleanPath = imagePath.replace(/\\/g, '/').replace(/^\//, '');
  
  // Make sure path starts with 'uploads/'
  if (!cleanPath.startsWith('uploads/')) {
    // Check if it has 'endoscopy-images' in it
    if (cleanPath.includes('endoscopy-images/')) {
      cleanPath = 'uploads/' + cleanPath.substring(cleanPath.indexOf('endoscopy-images/'));
    } else {
      cleanPath = 'uploads/endoscopy-images/' + cleanPath;
    }
  }
  
  var fullURL = 'http://127.0.0.1:5000/' + cleanPath;
  console.log('🖼️ Image URL:', fullURL);
  return fullURL;
};

export default api;