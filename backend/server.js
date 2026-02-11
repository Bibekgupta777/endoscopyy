require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// ✅ CORS Configuration: Allow all origins (or specify your frontend URL)
app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true 
}));

// ✅ Payload Limit: Increase for large images/videos
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// ✅ STATIC FILES WITH CORS HEADERS (Fix for PDF Image Issue)
// This middleware adds "Access-Control-Allow-Origin" to every image served from /uploads
app.use('/uploads', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));