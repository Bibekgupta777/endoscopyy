

const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();

// ═══════════════════════════════════════════════════════════
// 🔐 BACKEND LICENSE CHECK
// ═══════════════════════════════════════════════════════════
function verifyBackendLicense() {
  try {
    let userDataPath;

    if (process.env.UPLOAD_PATH) {
      userDataPath = path.dirname(process.env.UPLOAD_PATH);
    } else {
      const appName = 'endoscopy-system';
      if (process.platform === 'win32') {
        userDataPath = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName);
      } else if (process.platform === 'darwin') {
        userDataPath = path.join(os.homedir(), 'Library', 'Application Support', appName);
      } else {
        userDataPath = path.join(os.homedir(), '.config', appName);
      }
    }

    const licensePath = path.join(userDataPath, '.license.enc');

    if (!fs.existsSync(licensePath)) {
      console.error('❌ License file not found at:', licensePath);
      return false;
    }

    const stats = fs.statSync(licensePath);
    if (stats.size < 50) {
      console.error('❌ License file is too small — likely corrupted');
      return false;
    }

    const content = fs.readFileSync(licensePath, 'utf8');
    if (!content.includes(':')) {
      console.error('❌ License file format is invalid');
      return false;
    }

    console.log('✅ Backend license check passed');
    return true;

  } catch (e) {
    console.error('❌ Backend license check error:', e.message);
    return false;
  }
}

if (process.env.NODE_ENV === 'production') {
  if (!verifyBackendLicense()) {
    console.error('');
    console.error('═══════════════════════════════════════════════════');
    console.error('   ❌ INVALID LICENSE');
    console.error('   Server will not start without a valid license.');
    console.error('   Please activate the application first.');
    console.error('═══════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  }
}

// Global crash guards
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Database connection
let dbReady = false;

async function initDatabase() {
  try {
    await connectDB();
    dbReady = true;
  } catch (error) {
    console.error('❌ Initial DB connection failed:', error.message);
    console.log('⚠️ Server will start without DB. Retrying in 10s...');
    dbReady = false;

    setTimeout(async () => {
      try {
        await connectDB();
        dbReady = true;
        console.log('✅ DB reconnected on retry');
        await createDefaultAdmin();
      } catch (e) {
        console.error('❌ DB retry failed:', e.message);
        setInterval(async () => {
          if (!dbReady && mongoose.connection.readyState !== 1) {
            try {
              await connectDB();
              dbReady = true;
              console.log('✅ DB reconnected');
              await createDefaultAdmin();
            } catch (_) {}
          }
        }, 30000);
      }
    }, 10000);
  }
}

initDatabase();

// =================================================================
// AUTO-CREATE DEFAULT ADMIN
// =================================================================
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const adminCount = await User.countDocuments({ role: 'admin' });

    if (adminCount === 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('📝 FIRST TIME SETUP DETECTED');
      console.log('   No admin account found...');
      console.log('   Creating default admin account...');
      console.log('');

      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Narayani123', salt);

      const admin = new User({
        name: 'System Administrator',
        email: 'narayani@hospital.com',
        password: hashedPassword,
        role: 'admin',
        qualification: '',
        signature: '',
        isActive: true,
        mustChangePassword: true
      });

      await admin.save({ validateBeforeSave: false });

      console.log('✅ DEFAULT ADMIN CREATED SUCCESSFULLY!');
    } else {
      console.log(`✅ Admin account exists. Count: ${adminCount}`);
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
};

mongoose.connection.once('open', async () => {
  console.log('✅ MongoDB Connected');
  dbReady = true;
  
  // ✅ DYNAMIC PATH RECOVERY: Safely read custom folder path from DB on Boot
  try {
    const Setting = require('./models/Setting');
    const settings = await Setting.findOne();
    if (settings && settings.saveLocation) {
       if (!fs.existsSync(settings.saveLocation)) {
         fs.mkdirSync(settings.saveLocation, { recursive: true });
       }
       app.locals.uploadsDir = settings.saveLocation; // Restore saved path instantly
       console.log(`📂 Restored Custom Uploads Path: ${settings.saveLocation}`);
    }
  } catch (e) {
    console.log('⚠️ No custom path loaded, using default fallback path.');
  }

  await createDefaultAdmin();
});

mongoose.connection.on('disconnected', () => {
  dbReady = false;
});
mongoose.connection.on('reconnected', () => {
  dbReady = true;
});

// =================================================================
// CORS CONFIGURATION
// =================================================================
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5000',
    ];

    const vercelURL = process.env.FRONTEND_URL || 'https://your-frontend.vercel.app';
    allowedOrigins.push(vercelURL);

    if (!origin) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(null, true);
  },
  credentials: true
}));

app.options('*', cors());

app.use(express.json({ limit: '1000mb' })); 
app.use(express.urlencoded({ limit: '1000mb', extended: true })); 

// =================================================================
// PATH RESOLUTION
// =================================================================
const getWritablePath = () => {
  if (process.env.UPLOAD_PATH) return process.env.UPLOAD_PATH;
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;

  if (process.pkg || (process.versions && process.versions.electron)) {
    return path.join(process.cwd(), 'uploads');
  }

  return path.join(__dirname, 'uploads');
};

const uploadsDir = getWritablePath();
const endoImagesDir = path.join(uploadsDir, 'endoscopy-images');
const logosDir = path.join(uploadsDir, 'logos');
const signaturesDir = path.join(uploadsDir, 'signatures');

[uploadsDir, endoImagesDir, logosDir, signaturesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📂 Created: ${dir}`);
  }
});

// =================================================================
// SERVE STATIC FILES (CRASH-PROOF)
// =================================================================
app.locals.uploadsDir = uploadsDir; // Initial Fallback

app.use('/uploads', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Get active directory dynamically (falls back automatically if DB path is empty)
  const activeDir = req.app.locals.uploadsDir || uploadsDir;
  
  try {
    const requestedFile = path.join(activeDir, req.path);
    const resolvedPath = path.resolve(requestedFile);

    // Security: Stop directory traversal attacks
    if (!resolvedPath.startsWith(path.resolve(activeDir))) {
       return res.status(403).send('Access Denied');
    }

    // Only serve if file actually exists (Prevents server from crashing on unplugged drive)
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        return res.sendFile(resolvedPath);
    }
  } catch (error) {
    // Fails silently, avoiding crash
  }
  
  next();
});

// DB availability middleware
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (req.path.startsWith('/auth')) return next();

  if (!dbReady && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database is temporarily unavailable. Please wait a moment and try again.',
    });
  }
  next();
});

// =================================================================
// API ROUTES
// =================================================================
try { app.use('/api/auth', require('./routes/auth')); }
catch (e) { console.error('❌ Failed to load auth routes:', e.message); }

try { app.use('/api/patients', require('./routes/patients')); }
catch (e) { console.error('❌ Failed to load patient routes:', e.message); }

try { app.use('/api/reports', require('./routes/reports')); }
catch (e) { console.error('❌ Failed to load report routes:', e.message); }

try { app.use('/api/settings', require('./routes/settings')); }
catch (e) { console.error('❌ Failed to load settings routes:', e.message); }

// ✅ ADDED: MONITORING ROUTE
try { app.use('/api/monitoring', require('./routes/monitoring')); }
catch (e) { console.error('❌ Failed to load monitoring routes:', e.message); }

// Health Check
app.get('/api/health', (req, res) => {
  let imagesCount = 0;
  const activeDir = req.app.locals.uploadsDir || uploadsDir;
  try {
    const imagesDir = path.join(activeDir, 'endoscopy-images');
    if (fs.existsSync(imagesDir)) {
      imagesCount = fs.readdirSync(imagesDir).length;
    }
  } catch (_) {
    imagesCount = -1;
  }

  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: mongoose.connection.readyState === 1,
    storagePath: activeDir,
    imagesCount,
    timestamp: new Date().toISOString()
  });
});

// =================================================================
// SERVE FRONTEND
// =================================================================
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

  if (fs.existsSync(frontendDistPath)) {
    console.log(`📦 Serving frontend from: ${frontendDistPath}`);

    app.use(express.static(frontendDistPath));

    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return res.status(404).json({
          message: 'Route not found',
          path: req.path
        });
      }

      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }
} else {
  console.log('🔧 Development mode: Frontend on Vite (port 5173)');
}

// =================================================================
// ERROR HANDLER
// =================================================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format provided.' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `A record with this ${field} already exists.` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token. Please login again.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Session expired. Please login again.' });
  }

  res.status(500).json({
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =================================================================
// START SERVER
// =================================================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploads: ${app.locals.uploadsDir}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 MongoDB: ${process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/endoscopy_database'}`);
  console.log('═══════════════════════════════════════════════════');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log(`Trying port ${Number(PORT) + 1}...`);
    app.listen(Number(PORT) + 1, () => {
      console.log(`🚀 Server running on fallback port ${Number(PORT) + 1}`);
    });
  } else {
    console.error('❌ Server error:', err.message);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (e) {
    console.error('Error closing DB:', e.message);
  }
  process.exit(0);
});