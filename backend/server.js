const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// ✅ CORS Configuration — Allow both Online & Offline
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

    // Add your Vercel URL here
    const vercelURL = process.env.FRONTEND_URL || 'https://your-frontend.vercel.app';
    allowedOrigins.push(vercelURL);

    // Allow requests with no origin (Electron, mobile apps, curl)
    if (!origin) return callback(null, true);

    // Allow any .vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('⚠️ Blocked by CORS:', origin);
    return callback(null, true); // Allow all for now, tighten later
  },
  credentials: true
}));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// =================================================================
// ✅ FIX: Robust Path Resolution
// =================================================================
const getWritablePath = () => {
  if (process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR;
  }
  return path.join(__dirname, 'uploads');
};

const uploadsDir = getWritablePath();
const endoImagesDir = path.join(uploadsDir, 'endoscopy-images');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📂 Created Root Uploads: ${uploadsDir}`);
}
if (!fs.existsSync(endoImagesDir)) {
  fs.mkdirSync(endoImagesDir, { recursive: true });
  console.log(`📂 Created Images Folder: ${endoImagesDir}`);
}

// =================================================================
// ✅ SERVE STATIC FILES (Images)
// =================================================================
app.use('/uploads', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}, express.static(uploadsDir));

// Make path available to routes
app.locals.uploadsDir = uploadsDir;

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    storagePath: uploadsDir,
    imagesCount: fs.existsSync(endoImagesDir) ? fs.readdirSync(endoImagesDir).length : 0
  });
});

// =================================================================
// ✅ SERVE REACT FRONTEND (OFFLINE MODE)
// =================================================================
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // Catch-all route to handle React Router URLs (like /reports/123)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.warn('⚠️ Frontend dist folder not found. Only API is running.');
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving uploads from: ${uploadsDir}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});