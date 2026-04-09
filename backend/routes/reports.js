

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');

// ✅ FIX 1: Add async error wrapper at the top
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ✅ FIX 2: Wrap fs operations in try-catch
const getUploadsDir = (req) => {
  try {
    if (req && req.app && req.app.locals && req.app.locals.uploadsDir) {
      return req.app.locals.uploadsDir;
    }
  } catch (e) {
    console.error('Error getting uploadsDir:', e);
  }
  return path.join(__dirname, '../uploads');
};

const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (e) {
    console.error('Failed to create directory:', dirPath, e.message);
  }
};

const sanitizeFolderName = (name) => {
  if (!name || typeof name !== 'string') return 'Unknown';
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100) || 'Unknown';
};

// ✅ FIX 3: Safe file move function
const safeFileMove = (oldPath, newPath) => {
  try {
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      return true;
    }
  } catch (e) {
    console.error('File move failed:', e.message);
    // Try copy + delete as fallback
    try {
      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
      return true;
    } catch (e2) {
      console.error('Copy fallback also failed:', e2.message);
    }
  }
  return false;
};

// Configure Multer with error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const uploadsDir = getUploadsDir(req);
      const imagesDir = path.join(uploadsDir, 'endoscopy-images');
      ensureDirectoryExists(imagesDir);
      cb(null, imagesDir);
    } catch (e) {
      cb(e, null);
    }
  },
  filename: function (req, file, cb) {
    try {
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `endo-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      cb(null, filename);
    } catch (e) {
      cb(e, null);
    }
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and PDF files are allowed'));
    }
  }
});

// ✅ FIX 4: Add multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 100MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// ✅ FIX 5: Validate ObjectId helper
const isValidObjectId = (id) => {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};


// =================================================================
// UPLOAD FRONTEND-GENERATED PDF TO PATIENT FOLDER
// =================================================================
router.post('/:id/upload-pdf', auth, upload.single('pdf'), asyncHandler(async function(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No PDF file uploaded' });
  }

  const report = await Report.findById(req.params.id).populate('patient', 'name');
  if (!report) return res.status(404).json({ message: 'Report not found' });

  const patientName = report.patient?.name || 'Unknown';
  const safeName = sanitizeFolderName(patientName);
  
  const uploadsDir = getUploadsDir(req);
  const pdfDir = path.join(uploadsDir, 'endoscopy-images', safeName); // Saving in the same folder as images
  ensureDirectoryExists(pdfDir);

  const oldPath = req.file.path;
  const newPath = path.join(pdfDir, req.file.filename);
  
  safeFileMove(oldPath, newPath);

  const savedPath = `uploads/endoscopy-images/${safeName}/${req.file.filename}`;
  
  report.pdfPath = savedPath;
  report.pdfGeneratedAt = new Date();
  await report.save();

  console.log('✅ Frontend PDF saved to folder:', savedPath);
  res.json({ success: true, path: savedPath });
}));

// =================================================================
// GET ALL REPORTS
// =================================================================
router.get('/', auth, asyncHandler(async function(req, res) {
  const { search, status, patient, page = 1, limit = 20 } = req.query;
  
  // ✅ FIX 6: Sanitize pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  let query = {};

  if (patient && isValidObjectId(patient)) {
    query.patient = patient;
  }
  if (status) {
    query.status = status;
  }

  if (search && search.trim()) {
    const patients = await Patient.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');

    query.$or = [
      { reportId: { $regex: search, $options: 'i' } },
      { patient: { $in: patients.map(p => p._id) } }
    ];
  }

  const reports = await Report.find(query)
    .populate('patient', 'patientId name age sex')
    .populate('endoscopist', 'name qualification')
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum);

  const count = await Report.countDocuments(query);

  res.json({
    reports,
    totalPages: Math.ceil(count / limitNum),
    currentPage: pageNum,
    total: count
  });
}));

// =================================================================
// CREATE NEW REPORT
// =================================================================
router.post('/', auth, asyncHandler(async function(req, res) {
  console.log('📝 Creating new report...');

  const reportData = { ...req.body };

  // ✅ FIX 7: Validate patient exists
  if (!reportData.patient) {
    return res.status(400).json({ message: 'Patient is required' });
  }

  const patientId = typeof reportData.patient === 'object' 
    ? reportData.patient._id 
    : reportData.patient;

  if (!isValidObjectId(patientId)) {
    return res.status(400).json({ message: 'Invalid patient ID format' });
  }

  // Verify patient exists
  const patientExists = await Patient.findById(patientId);
  if (!patientExists) {
    return res.status(400).json({ message: 'Patient not found' });
  }

  reportData.patient = patientId;

  if (reportData.therapeutic && Array.isArray(reportData.therapeutic.procedures)) {
    reportData.therapeutic.procedures = reportData.therapeutic.procedures.filter(p => p && p.type);
  } else if (reportData.therapeutic) {
    reportData.therapeutic.procedures = [];
  }

  // Clean immutable fields
  delete reportData._id;
  delete reportData.__v;
  delete reportData.createdAt;
  delete reportData.updatedAt;
  delete reportData.images;
  delete reportData.videos;
  delete reportData.poolImages;

  const report = new Report({
    ...reportData,
    createdBy: req.user._id,
    endoscopist: req.user._id
  });

  await report.save();
  await report.populate('patient');

  console.log('✅ Report created:', report._id);
  res.status(201).json(report);
}));

// =================================================================
// GET SINGLE REPORT
// =================================================================
router.get('/:id', auth, asyncHandler(async function(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id)
    .populate('patient')
    .populate('endoscopist', 'name qualification signature')
    .populate('createdBy', 'name');

  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  res.json(report);
}));

// =================================================================
// UPDATE REPORT
// =================================================================
router.put('/:id', auth, asyncHandler(async function(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  const updateData = { ...req.body };

  delete updateData._id;
  delete updateData.__v;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  if (updateData.patient && typeof updateData.patient === 'object') {
    updateData.patient = updateData.patient._id;
  }

  if (updateData.therapeutic && Array.isArray(updateData.therapeutic.procedures)) {
    updateData.therapeutic.procedures = updateData.therapeutic.procedures.filter(p => p && p.type);
  }

  report.set(updateData);
  report.lastModifiedBy = req.user._id;

  await report.save();
  await report.populate('patient');

  console.log('✅ Report updated:', report._id);
  res.json(report);
}));

// =================================================================
// AUTO-SAVE IMAGE TO PATIENT FOLDER
// =================================================================
router.post('/auto-save', auth, upload.single('image'), handleMulterError, asyncHandler(async function(req, res) {
  const patientName = req.body.patientName;
  if (!patientName) {
    return res.status(400).json({ message: 'patientName is required' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  const safeName = sanitizeFolderName(patientName);
  const uploadsDir = getUploadsDir(req);
  const patientDir = path.join(uploadsDir, 'endoscopy-images', safeName);
  ensureDirectoryExists(patientDir);

  const oldPath = req.file.path;
  const newPath = path.join(patientDir, req.file.filename);

  safeFileMove(oldPath, newPath);

  const savedPath = 'uploads/endoscopy-images/' + safeName + '/' + req.file.filename;
  console.log('📸 Auto-saved capture:', savedPath);

  res.json({
    success: true,
    path: savedPath,
    folder: safeName,
    filename: req.file.filename
  });
}));

// =================================================================
// FINALIZE REPORT
// =================================================================
router.post('/:id/finalize', auth, asyncHandler(async function(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  report.status = 'finalized';
  report.finalizedAt = new Date();
  report.finalizedBy = req.user._id;
  await report.save();

  console.log('✅ Report finalized:', report._id);
  res.json({ message: 'Report finalized successfully', report });
}));

// =================================================================
// SAVE ALL IMAGES (SLOTTED + POOL)
// =================================================================
router.post('/:id/save-all-images', auth, upload.array('images', 50), handleMulterError, asyncHandler(async function(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id).populate('patient', 'name');
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  const patientName = report.patient?.name || 'Unknown';
  const safeName = sanitizeFolderName(patientName);
  const uploadsDir = getUploadsDir(req);
  const patientDir = path.join(uploadsDir, 'endoscopy-images', safeName);
  ensureDirectoryExists(patientDir);

  // ✅ FIX 8: Safe parsing of form data arrays
  let slotIndices = [];
  let captions = [];
  let existingPaths = [];

  try {
    if (req.body.slotIndices) {
      slotIndices = Array.isArray(req.body.slotIndices)
        ? req.body.slotIndices.map(Number)
        : String(req.body.slotIndices).split(',').map(Number);
    }
    if (req.body.captions) {
      captions = Array.isArray(req.body.captions)
        ? req.body.captions
        : String(req.body.captions).split('|||');
    }
    if (req.body.existingPaths) {
      existingPaths = Array.isArray(req.body.existingPaths)
        ? req.body.existingPaths
        : String(req.body.existingPaths).split('|||');
    }
  } catch (e) {
    console.error('Error parsing form data:', e);
  }

  console.log('📸 Saving all images:', {
    newFiles: req.files?.length || 0,
    existingPaths: existingPaths.length,
    slotIndices: slotIndices
  });

  const newImageData = [];
  if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const oldPath = file.path;
      const newPath = path.join(patientDir, file.filename);

      safeFileMove(oldPath, newPath);

      const savedPath = 'uploads/endoscopy-images/' + safeName + '/' + file.filename;

      newImageData.push({
        filename: file.originalname,
        path: savedPath,
        cloudinaryId: null,
        caption: captions[i] || '',
        slotIndex: slotIndices[i] !== undefined ? slotIndices[i] : -1,
        timestamp: new Date()
      });

      console.log('💾 Saved:', savedPath, 'slot:', slotIndices[i]);
    }
  }

  const existingImageData = [];
  for (let i = 0; i < existingPaths.length; i++) {
    if (existingPaths[i]) {
      const slotIdx = slotIndices[newImageData.length + i];
      existingImageData.push({
        filename: path.basename(existingPaths[i]),
        path: existingPaths[i],
        cloudinaryId: null,
        caption: captions[newImageData.length + i] || '',
        slotIndex: slotIdx !== undefined ? slotIdx : -1,
        timestamp: new Date()
      });
    }
  }

  const allImages = [...newImageData, ...existingImageData];

  const slottedImages = allImages
    .filter(img => img.slotIndex >= 0)
    .sort((a, b) => a.slotIndex - b.slotIndex);

  const poolImages = allImages.filter(img => img.slotIndex < 0);

  report.images = slottedImages;
  report.poolImages = poolImages;

  await report.save();

  console.log('✅ All images saved:', {
    slotted: slottedImages.length,
    pool: poolImages.length,
    total: allImages.length
  });

  res.json({
    message: 'All images saved',
    slottedCount: slottedImages.length,
    poolCount: poolImages.length,
    images: slottedImages,
    poolImages: poolImages
  });
}));

// =================================================================
// CAPTURE ROUTE (Base64)
// =================================================================
router.post('/:id/capture', auth, asyncHandler(async function(req, res) {
  const { image, tag, isPoolImage } = req.body;
  if (!image) {
    return res.status(400).json({ message: 'No image data provided' });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id).populate('patient', 'name');
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  const uploadsDir = getUploadsDir(req);
  const imagesDir = path.join(uploadsDir, 'endoscopy-images');
  ensureDirectoryExists(imagesDir);

  const patientName = report.patient?.name || 'Unknown';
  const safeName = sanitizeFolderName(patientName);
  const patientDir = path.join(imagesDir, safeName);
  ensureDirectoryExists(patientDir);

  // ✅ FIX 9: Safe base64 parsing
  let buffer;
  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } catch (e) {
    return res.status(400).json({ message: 'Invalid image data format' });
  }

  const filename = 'endo-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.jpg';
  const filepath = path.join(patientDir, filename);

  try {
    fs.writeFileSync(filepath, buffer);
  } catch (e) {
    console.error('Failed to write image:', e);
    return res.status(500).json({ message: 'Failed to save image' });
  }

  console.log('💾 Captured image saved:', safeName + '/' + filename);

  const newImage = {
    filename: filename,
    path: 'uploads/endoscopy-images/' + safeName + '/' + filename,
    cloudinaryId: null,
    caption: '',
    taggedOrgan: tag || '',
    slotIndex: -1
  };

  if (isPoolImage !== false) {
    report.poolImages.push(newImage);
  } else {
    report.images.push(newImage);
  }

  await report.save();

  res.json({ message: 'Snapshot captured', image: newImage });
}));

// =================================================================
// 🚀 SMART AUTO-SAVE: Generates paths for Electron to save the PDF
// =================================================================
router.post('/:id/save-pdf', auth, asyncHandler(async function(req, res) {
  console.log('📄 Preparing auto-save paths for Electron PDF engine...');
  
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id).populate('patient', 'name');
  if (!report) return res.status(404).json({ message: 'Report not found' });

  // 1. Calculate the exact hard disk folder path for this patient
  const patientName = report.patient?.name || 'Unknown';
  const safeName = sanitizeFolderName(patientName);
  const uploadsDir = getUploadsDir(req);
  const folderPath = path.join(uploadsDir, 'endoscopy-images', safeName);
  ensureDirectoryExists(folderPath);

  // 2. Create the PDF filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fileName = `Report_${safeName}_${timestamp}.pdf`;
  
  // 3. Save the relative path to the database so the app remembers it
  const relativePath = `uploads/endoscopy-images/${safeName}/${fileName}`;
  report.pdfPath = relativePath;
  report.pdfGeneratedAt = new Date();
  await report.save();

  // 4. Send the absolute path back to the frontend so Electron can save the file!
  res.json({ 
    success: true, 
    folderPath: folderPath,
    fileName: fileName
  });
}));



// =================================================================
// MULTIPLE IMAGE UPLOAD (Legacy)
// =================================================================
router.post('/:id/images', auth, upload.array('images', 10), handleMulterError, asyncHandler(async function(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id).populate('patient', 'name');
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No image files provided' });
  }

  const patientName = report.patient?.name || 'Unknown';
  const safeName = sanitizeFolderName(patientName);
  const uploadsDir = getUploadsDir(req);
  const patientDir = path.join(uploadsDir, 'endoscopy-images', safeName);
  ensureDirectoryExists(patientDir);

  let tags = [];
  let captions = [];
  let isPoolImages = req.body.isPoolImages === 'true';

  try {
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) ? req.body.tags : String(req.body.tags).split(',');
    }
    if (req.body.captions) {
      captions = Array.isArray(req.body.captions) ? req.body.captions : String(req.body.captions).split(',');
    }
  } catch (e) {
    console.error('Error parsing tags/captions:', e);
  }

  const uploadedImages = [];
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];

    const oldPath = file.path;
    const newPath = path.join(patientDir, file.filename);
    safeFileMove(oldPath, newPath);

    const savedPath = 'uploads/endoscopy-images/' + safeName + '/' + file.filename;
    console.log('💾 Saved image ' + (i + 1) + '/' + req.files.length + ':', savedPath);

    uploadedImages.push({
      filename: file.originalname,
      path: savedPath,
      cloudinaryId: null,
      taggedOrgan: tags[i] || '',
      caption: captions[i] || '',
      slotIndex: isPoolImages ? -1 : i
    });
  }

  if (isPoolImages) {
    report.poolImages.push(...uploadedImages);
  } else {
    report.images.push(...uploadedImages);
  }

  await report.save();

  res.json({ message: 'Images uploaded', images: uploadedImages });
}));

// =================================================================
// VIDEO UPLOAD
// =================================================================
router.post('/:id/video', auth, upload.single('video'), handleMulterError, asyncHandler(async function(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id).populate('patient', 'name');
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No video file provided' });
  }

  const patientName = report.patient?.name || 'Unknown';
  const safeName = sanitizeFolderName(patientName);
  const uploadsDir = getUploadsDir(req);
  const patientDir = path.join(uploadsDir, 'endoscopy-images', safeName);
  ensureDirectoryExists(patientDir);

  const oldPath = req.file.path;
  const newPath = path.join(patientDir, req.file.filename);
  safeFileMove(oldPath, newPath);

  const savedPath = 'uploads/endoscopy-images/' + safeName + '/' + req.file.filename;
  console.log('💾 Video saved:', savedPath);

  const videoData = {
    filename: req.file.originalname,
    path: savedPath,
    cloudinaryId: null,
    size: req.file.size
  };

  report.videos.push(videoData);
  await report.save();

  res.json({ message: 'Video uploaded', video: videoData });
}));

// =================================================================
// DELETE SINGLE IMAGE
// =================================================================
router.delete('/:id/images/:imageId', auth, asyncHandler(async function(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  let image = report.images.id(req.params.imageId);

  if (!image) {
    image = report.poolImages.id(req.params.imageId);
  }

  if (image) {
    console.log('📁 Unlinked from report (file preserved):', image.path);
    image.deleteOne();
    await report.save();
  }

  res.json({ message: 'Image removed from report (file preserved in patient folder)' });
}));

// =================================================================
// DELETE ENTIRE REPORT
// =================================================================
router.delete('/:id', auth, asyncHandler(async function(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID format' });
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  const totalImages = (report.images?.length || 0) + (report.poolImages?.length || 0);
  if (totalImages > 0) {
    console.log('📁 Preserving', totalImages, 'image(s) in patient folder');
  }
  if (report.videos && report.videos.length > 0) {
    console.log('📁 Preserving', report.videos.length, 'video(s) in patient folder');
  }

  await Report.findByIdAndDelete(req.params.id);
  console.log('✅ Report deleted (media files preserved):', req.params.id);

  res.json({ message: 'Report deleted (media files preserved in patient folder)' });
}));

// ✅ FIX 10: Add router-level error handler
router.use((err, req, res, next) => {
  console.error('❌ Report route error:', err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  res.status(500).json({ message: 'Report operation failed' });
});

module.exports = router;