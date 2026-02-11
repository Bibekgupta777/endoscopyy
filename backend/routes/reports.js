const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/endoscopy-images';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'endo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Create report
router.post('/', auth, async (req, res) => {
  try {
    const reportData = { ...req.body };

    // ✅ FIX: Ensure therapeutic procedures is correct structure
    if (reportData.therapeutic && Array.isArray(reportData.therapeutic.procedures)) {
      // Filter out empty entries if any
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
    console.error("Create Report Error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Capture snapshot (Base64)
router.post('/:id/capture', auth, async (req, res) => {
  try {
    const { image, tag } = req.body; // Added tag support
    if (!image) return res.status(400).json({ message: 'No image data provided' });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const uploadPath = path.join('uploads', 'endoscopy-images');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

    const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
    const filename = `cap-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const fullPath = path.join(uploadPath, filename);

    fs.writeFileSync(fullPath, base64Data, 'base64');

    const newImage = {
      filename: filename,
      path: `uploads/endoscopy-images/${filename}`,
      originalName: filename,
      caption: '',
      taggedOrgan: tag || '' // Save the organ tag
    };

    report.images.push(newImage);
    await report.save();

    res.json({ message: 'Snapshot captured', image: newImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Upload video
router.post('/:id/video', auth, upload.single('video'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const videoData = {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        };

        report.videos.push(videoData);
        await report.save();
        res.json({ message: 'Video saved', video: videoData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all reports
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) query.status = status;

    if (search) {
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

// Get single report
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

// Update report
router.put('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status === 'finalized') return res.status(403).json({ message: 'Cannot edit finalized report' });

    const updateData = { ...req.body };

    // ✅ FIX: Ensure therapeutic procedures structure is valid before update
    if (updateData.therapeutic && Array.isArray(updateData.therapeutic.procedures)) {
       // Only keep valid procedures or allow empty array
       updateData.therapeutic.procedures = updateData.therapeutic.procedures.filter(p => p.type);
    }

    // Use set() to update fields, safer than Object.assign for Mongoose
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

// Finalize report
router.post('/:id/finalize', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.status = 'finalized';
    report.finalizedAt = new Date();
    report.finalizedBy = req.user._id; // Track who finalized it
    await report.save();
    res.json({ message: 'Report finalized successfully', report });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload images
router.post('/:id/images', auth, upload.array('images', 10), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const tags = req.body.tags ? req.body.tags.split(',') : [];
    const captions = req.body.captions ? req.body.captions.split(',') : [];

    const images = req.files.map((file, index) => ({
      filename: file.filename,
      path: file.path,
      taggedOrgan: tags[index] || '', // Use the correct field name 'taggedOrgan'
      caption: captions[index] || ''
    }));

    report.images.push(...images);
    await report.save();
    res.json({ message: 'Images uploaded successfully', images });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete image from report
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const image = report.images.id(req.params.imageId);
    if (image) {
      if (fs.existsSync(image.path)) fs.unlinkSync(image.path);
      image.deleteOne();
      await report.save();
    }
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE report completely
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Delete all images from disk
    if (report.images && report.images.length > 0) {
      report.images.forEach(img => {
        if (img.path && fs.existsSync(img.path)) {
          try { fs.unlinkSync(img.path); } catch (e) {}
        }
      });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;