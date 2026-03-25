const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');

// =================================================================
// ✅ LOCAL STORAGE SETUP (100% Offline)
// =================================================================
const getUploadsDir = (req) => {
  if (req && req.app && req.app.locals && req.app.locals.uploadsDir) {
    return req.app.locals.uploadsDir;
  }
  return path.join(__dirname, '../uploads');
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure Multer for local disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = getUploadsDir(req);
    const imagesDir = path.join(uploadsDir, 'endoscopy-images');
    ensureDirectoryExists(imagesDir);
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `endo-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Helper function to delete local file
const deleteLocalFile = (filePath, uploadsDir) => {
  if (!filePath) return;
  
  try {
    let fullPath;
    if (filePath.startsWith('uploads/')) {
      const relativePath = filePath.replace('uploads/', '');
      fullPath = path.join(uploadsDir, relativePath);
    } else {
      fullPath = path.join(uploadsDir, 'endoscopy-images', path.basename(filePath));
    }
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('🗑️ Deleted local file:', fullPath);
    }
  } catch (err) {
    console.error('Failed to delete file:', err.message);
  }
};

// =================================================================
// ✅ GET ALL REPORTS
// =================================================================
router.get('/', auth, async function(req, res) {
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
        { patient: { $in: patients.map(function(p) { return p._id; }) } }
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
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const count = await Report.countDocuments(query);

    res.json({
      reports: reports,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Get Reports Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =================================================================
// ✅ CREATE NEW REPORT
// =================================================================
router.post('/', auth, async function(req, res) {
  try {
    console.log('📝 Creating new report...');
    
    const reportData = { ...req.body };
    
    // Validate patient ID
    if (!reportData.patient) {
      return res.status(400).json({ message: 'Patient is required' });
    }
    
    // Ensure patient is a string ID, not an object
    if (typeof reportData.patient === 'object' && reportData.patient !== null) {
      reportData.patient = reportData.patient._id;
    }
    
    // Clean up therapeutic procedures
    if (reportData.therapeutic && Array.isArray(reportData.therapeutic.procedures)) {
      reportData.therapeutic.procedures = reportData.therapeutic.procedures.filter(function(p) { return p.type; });
    } else if (reportData.therapeutic) {
      reportData.therapeutic.procedures = [];
    }

    // Remove MongoDB fields
    delete reportData._id;
    delete reportData.__v;
    delete reportData.createdAt;
    delete reportData.updatedAt;
    delete reportData.images;
    delete reportData.videos;

    const report = new Report({
      ...reportData,
      createdBy: req.user._id,
      endoscopist: req.user._id
    });
    
    await report.save();
    await report.populate('patient');
    
    console.log('✅ Report created:', report._id);
    res.status(201).json(report);
  } catch (error) {
    console.error('❌ Create Report Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// =================================================================
// ✅ GET SINGLE REPORT
// =================================================================
router.get('/:id', auth, async function(req, res) {
  try {
    const report = await Report.findById(req.params.id)
      .populate('patient')
      .populate('endoscopist', 'name qualification signature')
      .populate('createdBy', 'name');
      
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Get Report Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =================================================================
// ✅ UPDATE REPORT
// =================================================================
router.put('/:id', auth, async function(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updateData = { ...req.body };
    
    // Clean up MongoDB fields
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.images;
    delete updateData.videos;

    // Ensure patient is a string ID
    if (updateData.patient && typeof updateData.patient === 'object') {
      updateData.patient = updateData.patient._id;
    }

    // Clean therapeutic procedures
    if (updateData.therapeutic && Array.isArray(updateData.therapeutic.procedures)) {
      updateData.therapeutic.procedures = updateData.therapeutic.procedures.filter(function(p) { return p.type; });
    }

    report.set(updateData);
    report.lastModifiedBy = req.user._id;

    await report.save();
    await report.populate('patient');
    
    console.log('✅ Report updated:', report._id);
    res.json(report);
  } catch (error) {
    console.error('Update Report Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// =================================================================
// ✅ FINALIZE REPORT
// =================================================================
router.post('/:id/finalize', auth, async function(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    report.status = 'finalized';
    report.finalizedAt = new Date();
    report.finalizedBy = req.user._id;
    await report.save();
    
    console.log('✅ Report finalized:', report._id);
    res.json({ message: 'Report finalized successfully', report: report });
  } catch (error) {
    console.error('Finalize Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// =================================================================
// 📸 CAPTURE ROUTE (Base64 → Local Disk)
// =================================================================
router.post('/:id/capture', auth, async function(req, res) {
  try {
    const { image, tag } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const uploadsDir = getUploadsDir(req);
    const imagesDir = path.join(uploadsDir, 'endoscopy-images');
    ensureDirectoryExists(imagesDir);

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename and save to disk
    const filename = 'endo-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.jpg';
    const filepath = path.join(imagesDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    console.log('💾 Captured image saved:', filename);

    const newImage = {
      filename: filename,
      path: 'uploads/endoscopy-images/' + filename,
      cloudinaryId: null,
      caption: '',
      taggedOrgan: tag || '',
      isSelected: true
    };

    report.images.push(newImage);
    await report.save();

    res.json({ message: 'Snapshot captured', image: newImage });
  } catch (error) {
    console.error('Capture Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =================================================================
// 📤 MULTIPLE IMAGE UPLOAD (Multer → Local Disk)
// =================================================================
router.post('/:id/images', auth, upload.array('images', 10), async function(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    var tags = [];
    var captions = [];
    
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',');
    }
    if (req.body.captions) {
      captions = Array.isArray(req.body.captions) ? req.body.captions : req.body.captions.split(',');
    }

    var uploadedImages = [];
    for (var i = 0; i < req.files.length; i++) {
      var file = req.files[i];
      console.log('💾 Saved image ' + (i + 1) + '/' + req.files.length + ':', file.filename);
      
      uploadedImages.push({
        filename: file.originalname,
        path: 'uploads/endoscopy-images/' + file.filename,
        cloudinaryId: null,
        taggedOrgan: tags[i] || '',
        caption: captions[i] || '',
        isSelected: true
      });
    }

    for (var j = 0; j < uploadedImages.length; j++) {
      report.images.push(uploadedImages[j]);
    }
    await report.save();

    res.json({ message: 'Images uploaded', images: uploadedImages });
  } catch (error) {
    console.error('Image Upload Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// =================================================================
// 🎥 VIDEO UPLOAD (Multer → Local Disk)
// =================================================================
router.post('/:id/video', auth, upload.single('video'), async function(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    console.log('💾 Video saved:', req.file.filename);

    const videoData = {
      filename: req.file.originalname,
      path: 'uploads/endoscopy-images/' + req.file.filename,
      cloudinaryId: null,
      size: req.file.size
    };

    report.videos.push(videoData);
    await report.save();

    res.json({ message: 'Video uploaded', video: videoData });
  } catch (error) {
    console.error('Video Upload Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =================================================================
// 🗑️ DELETE SINGLE IMAGE
// =================================================================
router.delete('/:id/images/:imageId', auth, async function(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const image = report.images.id(req.params.imageId);
    if (image) {
      const uploadsDir = getUploadsDir(req);
      deleteLocalFile(image.path || image.filename, uploadsDir);
      image.deleteOne();
      await report.save();
    }

    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Delete Image Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// =================================================================
// 🗑️ DELETE ENTIRE REPORT
// =================================================================
router.delete('/:id', auth, async function(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const uploadsDir = getUploadsDir(req);

    // Delete ALL images from Local Disk
    if (report.images && report.images.length > 0) {
      for (var i = 0; i < report.images.length; i++) {
        deleteLocalFile(report.images[i].path || report.images[i].filename, uploadsDir);
      }
    }

    // Delete ALL videos from Local Disk
    if (report.videos && report.videos.length > 0) {
      for (var j = 0; j < report.videos.length; j++) {
        deleteLocalFile(report.videos[j].path || report.videos[j].filename, uploadsDir);
      }
    }

    await Report.findByIdAndDelete(req.params.id);
    console.log('✅ Report deleted:', req.params.id);

    res.json({ message: 'Report and all media deleted' });
  } catch (error) {
    console.error('Delete Report Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;