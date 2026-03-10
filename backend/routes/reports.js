const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');

// =================================================================
// 🌍 UNIVERSAL PATH RESOLVER (Works on Local, Online, & .exe)
// =================================================================
const getWritablePath = () => {
  // 1. If Production/Electron sets a specific path, use it.
  if (process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR;
  }

  // 2. Localhost / Online Hosting Fallback
  // We are in '/routes', so we go up (..) to 'backend', then into 'uploads'
  return path.join(__dirname, '../uploads');
};

// 📂 CONFIGURE STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadRoot = getWritablePath();
    const endoImagesDir = path.join(uploadRoot, 'endoscopy-images');

    // Ensure folder exists before writing
    if (!fs.existsSync(endoImagesDir)) {
      fs.mkdirSync(endoImagesDir, { recursive: true });
    }
    
    cb(null, endoImagesDir);
  },
  filename: function (req, file, cb) {
    // Generate clean unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'endo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// =================================================================
// 📸 1. CAPTURE ROUTE (Fixes Broken Images)
// =================================================================
router.post('/:id/capture', auth, async (req, res) => {
  try {
    const { image, tag } = req.body;
    if (!image) return res.status(400).json({ message: 'No image data provided' });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // 1. Prepare Path
    const uploadRoot = getWritablePath();
    const endoImagesDir = path.join(uploadRoot, 'endoscopy-images');
    
    // Ensure directory exists
    if (!fs.existsSync(endoImagesDir)) fs.mkdirSync(endoImagesDir, { recursive: true });

    // 2. Write File
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
    const filename = `endo-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const fullPath = path.join(endoImagesDir, filename);

    fs.writeFileSync(fullPath, base64Data, 'base64');

    // 3. Save to DB (Relative Path ONLY)
    // We do NOT add 'uploads/' here. The frontend adds it.
    const newImage = {
      filename: filename,
      path: `endoscopy-images/${filename}`, 
      originalName: filename,
      caption: '',
      taggedOrgan: tag || ''
    };

    report.images.push(newImage);
    await report.save();

    res.json({ message: 'Snapshot captured', image: newImage });
  } catch (error) {
    console.error("Capture Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// =================================================================
// 📤 2. MULTIPLE UPLOAD ROUTE (Fixes Manual Uploads)
// =================================================================
router.post('/:id/images', auth, upload.array('images', 10), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const tags = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',')) : [];
    const captions = req.body.captions ? (Array.isArray(req.body.captions) ? req.body.captions : req.body.captions.split(',')) : [];

    const images = req.files.map((file, index) => ({
      filename: file.filename,
      // Store relative path: 'endoscopy-images/file.jpg'
      path: `endoscopy-images/${file.filename}`, 
      taggedOrgan: tags[index] || '',
      caption: captions[index] || ''
    }));

    report.images.push(...images);
    await report.save();
    res.json({ message: 'Images uploaded successfully', images });
  } catch (error) {
    console.error("Image Upload Error:", error);
    res.status(400).json({ message: error.message });
  }
});

// =================================================================
// 🎥 3. VIDEO UPLOAD ROUTE
// =================================================================
router.post('/:id/video', auth, upload.single('video'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const videoData = {
            filename: req.file.filename,
            path: `endoscopy-images/${req.file.filename}`, // Relative path
            size: req.file.size
        };

        report.videos.push(videoData);
        await report.save();
        res.json({ message: 'Video saved', video: videoData });
    } catch (error) {
        console.error("Video Upload Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// =================================================================
// 🗑️ DELETE IMAGE
// =================================================================
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const image = report.images.id(req.params.imageId);
    if (image) {
      const uploadRoot = getWritablePath();
      // Only get the filename part to avoid path traversal issues
      const filename = path.basename(image.path); 
      const fullPath = path.join(uploadRoot, 'endoscopy-images', filename);

      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch(e) { console.error("File delete error:", e); }
      }

      image.deleteOne();
      await report.save();
    }
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// =================================================================
// 🗑️ DELETE REPORT
// =================================================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Cleanup files
    if (report.images && report.images.length > 0) {
      const uploadRoot = getWritablePath();
      report.images.forEach(img => {
        const filename = path.basename(img.path);
        const fullPath = path.join(uploadRoot, 'endoscopy-images', filename);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch (e) {}
        }
      });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... Standard GET/POST/PUT routes (Keep your existing ones for reports) ...
// ✅ GET ALL REPORTS
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, patient, page = 1, limit = 20 } = req.query;
    let query = {};

    if (patient) query.patient = patient;
    if (status) query.status = status;

    if (search) {
      const patients = await Patient.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const searchConditions = [
        { reportId: { $regex: search, $options: 'i' } },
        { patient: { $in: patients.map(p => p._id) } }
      ];

      if (query.$or) {
        query.$and = [{ $or: searchConditions }];
      } else {
        query.$or = searchConditions;
      }
    }

    const reports = await Report.find(query)
      .populate('patient', 'patientId name age sex')
      .populate('endoscopist', 'name qualification')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create
router.post('/', auth, async (req, res) => {
  try {
    const reportData = { ...req.body };
    if (reportData.therapeutic && Array.isArray(reportData.therapeutic.procedures)) {
      reportData.therapeutic.procedures = reportData.therapeutic.procedures.filter(p => p.type);
    } else if (reportData.therapeutic) {
      reportData.therapeutic.procedures = [];
    }

    const report = new Report({
      ...reportData,
      createdBy: req.user._id,
      endoscopist: req.user._id
    });
    await report.save();
    await report.populate('patient');
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Single
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('patient')
      .populate('endoscopist', 'name qualification signature')
      .populate('createdBy', 'name');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status === 'finalized') return res.status(403).json({ message: 'Cannot edit finalized report' });

    const updateData = { ...req.body };
    if (updateData.therapeutic && Array.isArray(updateData.therapeutic.procedures)) {
       updateData.therapeutic.procedures = updateData.therapeutic.procedures.filter(p => p.type);
    }

    report.set(updateData);
    report.lastModifiedBy = req.user._id;

    await report.save();
    await report.populate('patient');
    res.json(report);
  } catch (error) {
    console.error("Update Report Error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Finalize
router.post('/:id/finalize', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.status = 'finalized';
    report.finalizedAt = new Date();
    report.finalizedBy = req.user._id;
    await report.save();
    res.json({ message: 'Report finalized successfully', report });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;