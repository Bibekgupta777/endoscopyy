// // const express = require('express');
// // const fs = require('fs'); // Import File System
// // const path = require('path'); // Import Path
// // const Patient = require('../models/Patient');
// // const Report = require('../models/Report'); // Import Report Model
// // const { auth } = require('../middleware/auth');

// // const router = express.Router();

// // // Create patient
// // router.post('/', auth, async (req, res) => {
// //   try {
// //     const patient = new Patient({
// //       ...req.body,
// //       createdBy: req.user._id
// //     });
    
// //     await patient.save();
// //     res.status(201).json(patient);
// //   } catch (error) {
// //     res.status(400).json({ message: error.message });
// //   }
// // });

// // // @route   DELETE api/patients/:id
// // // @desc    Delete patient AND their reports AND the physical images
// // router.delete('/:id', auth, async (req, res) => {
// //   try {
// //     const patientId = req.params.id;

// //     // 1. Check if patient exists
// //     const patient = await Patient.findById(patientId);
// //     if (!patient) {
// //       return res.status(404).json({ message: 'Patient not found' });
// //     }

// //     // 2. Find all reports associated with this patient
// //     const reports = await Report.find({ patient: patientId });

// //     // 3. Define the path to your images folder
// //     // Navigate from: backend/routes/ -> backend/uploads/endoscopy-images
// //     const imagesDir = path.join(__dirname, '..', 'uploads', 'endoscopy-images');

// //     // 4. Loop through reports and delete physical files
// //     reports.forEach((report) => {
// //       // Handle Images
// //       if (report.images && Array.isArray(report.images)) {
// //         report.images.forEach((imgObj) => {
// //           if (imgObj.filename) {
// //             const filePath = path.join(imagesDir, imgObj.filename);
// //             // Check if file exists before trying to delete
// //             if (fs.existsSync(filePath)) {
// //               try {
// //                 fs.unlinkSync(filePath); // Delete file
// //                 console.log(`Deleted image: ${imgObj.filename}`);
// //               } catch (err) {
// //                 console.error(`Error deleting file ${imgObj.filename}:`, err);
// //               }
// //             }
// //           }
// //         });
// //       }

// //       // Optional: Handle Videos (if you store videos in the future)
// //       if (report.videos && Array.isArray(report.videos)) {
// //         report.videos.forEach((vidObj) => {
// //           if (vidObj.filename) {
// //             const vidPath = path.join(imagesDir, vidObj.filename); 
// //             if (fs.existsSync(vidPath)) {
// //               try {
// //                 fs.unlinkSync(vidPath);
// //               } catch (err) {
// //                 console.error(`Error deleting video ${vidObj.filename}:`, err);
// //               }
// //             }
// //           }
// //         });
// //       }
// //     });

// //     // 5. Delete all Report documents associated with the patient
// //     await Report.deleteMany({ patient: patientId });

// //     // 6. Finally, delete the Patient document
// //     await Patient.findByIdAndDelete(patientId);
    
// //     res.json({ message: 'Patient, reports, and associated media deleted successfully' });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: error.message });
// //   }
// // });

// // // Get all patients
// // router.get('/', auth, async (req, res) => {
// //   try {
// //     const { search, page = 1, limit = 20 } = req.query;
    
// //     let query = {};
// //     if (search) {
// //       query = {
// //         $or: [
// //           { name: { $regex: search, $options: 'i' } },
// //           { patientId: { $regex: search, $options: 'i' } },
// //           { phone: { $regex: search, $options: 'i' } }
// //         ]
// //       };
// //     }
    
// //     const patients = await Patient.find(query)
// //       .sort({ createdAt: -1 })
// //       .limit(limit * 1)
// //       .skip((page - 1) * limit);
    
// //     const count = await Patient.countDocuments(query);
    
// //     res.json({
// //       patients,
// //       totalPages: Math.ceil(count / limit),
// //       currentPage: page,
// //       total: count
// //     });
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // });

// // // Get single patient
// // router.get('/:id', auth, async (req, res) => {
// //   try {
// //     const patient = await Patient.findById(req.params.id);
// //     if (!patient) {
// //       return res.status(404).json({ message: 'Patient not found' });
// //     }
// //     res.json(patient);
// //   } catch (error) {
// //     res.status(500).json({ message: error.message });
// //   }
// // });

// // // Update patient
// // router.put('/:id', auth, async (req, res) => {
// //   try {
// //     const patient = await Patient.findByIdAndUpdate(
// //       req.params.id,
// //       req.body,
// //       { new: true, runValidators: true }
// //     );
    
// //     if (!patient) {
// //       return res.status(404).json({ message: 'Patient not found' });
// //     }
    
// //     res.json(patient);
// //   } catch (error) {
// //     res.status(400).json({ message: error.message });
// //   }
// // });

// // module.exports = router;

// const express = require('express');
// const fs = require('fs'); 
// const path = require('path'); 
// const Patient = require('../models/Patient');
// const Report = require('../models/Report'); 
// const { auth } = require('../middleware/auth');

// const router = express.Router();

// // Create patient
// router.post('/', auth, async (req, res) => {
//   try {
//     const patient = new Patient({
//       ...req.body,
//       createdBy: req.user._id
//     });
    
//     await patient.save();
//     res.status(201).json(patient);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // @route   DELETE api/patients/:id
// // @desc    Delete patient AND their reports (PRESERVES PHYSICAL IMAGES)
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const patientId = req.params.id;

//     // 1. Check if patient exists
//     const patient = await Patient.findById(patientId);
//     if (!patient) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }

//     // 2. Delete all Report documents associated with the patient
//     await Report.deleteMany({ patient: patientId });

//     // 3. Finally, delete the Patient document
//     await Patient.findByIdAndDelete(patientId);
    
//     // (Physical files are ignored and preserved on disk)
//     res.json({ message: 'Patient and reports deleted successfully. Photos preserved.' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get all patients
// router.get('/', auth, async (req, res) => {
//   try {
//     const { search, page = 1, limit = 20 } = req.query;
    
//     let query = {};
//     if (search) {
//       query = {
//         $or: [
//           { name: { $regex: search, $options: 'i' } },
//           { patientId: { $regex: search, $options: 'i' } },
//           { phone: { $regex: search, $options: 'i' } }
//         ]
//       };
//     }
    
//     const patients = await Patient.find(query)
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);
    
//     const count = await Patient.countDocuments(query);
    
//     res.json({
//       patients,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       total: count
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get single patient
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);
//     if (!patient) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }
//     res.json(patient);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Update patient
// router.put('/:id', auth, async (req, res) => {
//   try {
//     const patient = await Patient.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );
    
//     if (!patient) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }
    
//     res.json(patient);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// module.exports = router;



const express = require('express');
const fs = require('fs');
const path = require('path');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ✅ FIX 1: Add async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create patient
router.post('/', auth, asyncHandler(async (req, res) => {
  // ✅ FIX 2: Validate required fields
  const { name, patientId } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Patient name is required' });
  }

  // ✅ FIX 3: Check for duplicate patientId if provided
  if (patientId) {
    const existing = await Patient.findOne({ patientId: patientId.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Patient ID already exists' });
    }
  }

  const patient = new Patient({
    ...req.body,
    name: name.trim(),
    createdBy: req.user._id
  });

  await patient.save();
  res.status(201).json(patient);
}));

// Delete patient AND their reports
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const patientId = req.params.id;

  // ✅ FIX 4: Validate ObjectId format
  if (!patientId || !patientId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid patient ID format' });
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  // Delete all Report documents associated with the patient
  const deleteResult = await Report.deleteMany({ patient: patientId });
  console.log(`🗑️ Deleted ${deleteResult.deletedCount} reports for patient ${patientId}`);

  await Patient.findByIdAndDelete(patientId);

  res.json({ 
    message: 'Patient and reports deleted successfully. Photos preserved.',
    reportsDeleted: deleteResult.deletedCount
  });
}));

// Get all patients
router.get('/', auth, asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  // ✅ FIX 5: Sanitize pagination params
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

  let query = {};
  if (search && search.trim()) {
    const searchTerm = search.trim();
    query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { patientId: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    };
  }

  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum);

  const count = await Patient.countDocuments(query);

  res.json({
    patients,
    totalPages: Math.ceil(count / limitNum),
    currentPage: pageNum,
    total: count
  });
}));

// Get single patient
router.get('/:id', auth, asyncHandler(async (req, res) => {
  // ✅ FIX 6: Validate ObjectId format
  const { id } = req.params;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid patient ID format' });
  }

  const patient = await Patient.findById(id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  res.json(patient);
}));

// Update patient
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid patient ID format' });
  }

  // ✅ FIX 7: Remove immutable fields from update
  const updateData = { ...req.body };
  delete updateData._id;
  delete updateData.__v;
  delete updateData.createdAt;
  delete updateData.createdBy;

  const patient = await Patient.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  res.json(patient);
}));

// ✅ FIX 8: Add router-level error handler
router.use((err, req, res, next) => {
  console.error('❌ Patient route error:', err.message);

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Patient ID already exists' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  res.status(500).json({ message: 'Patient operation failed' });
});

module.exports = router;