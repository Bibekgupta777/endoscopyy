

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

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// =================================================================
// ✅ FIX: Robust Path Resolution
// =================================================================
const getWritablePath = () => {
  // 1. If explicit path provided in ENV (Production/Electron)
  if (process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR;
  }

  // 2. Local Development (store in backend/uploads)
  return path.join(__dirname, 'uploads');
};

const uploadsDir = getWritablePath();

// Ensure directories exist
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
// ✅ SERVE STATIC FILES
// =================================================================
// This makes http://localhost:5000/uploads/... map to the folder
app.use('/uploads', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}, express.static(uploadsDir));

// Make path available to routes
app.locals.uploadsDir = uploadsDir;

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    storagePath: uploadsDir,
    imagesCount: fs.existsSync(endoImagesDir) ? fs.readdirSync(endoImagesDir).length : 0
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving uploads from: ${uploadsDir}`);
});