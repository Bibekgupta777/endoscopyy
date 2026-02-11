const express = require('express');
const Patient = require('../models/Patient');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create patient
router.post('/', auth, async (req, res) => {
  try {
    const patient = new Patient({
      ...req.body,
      createdBy: req.user._id
    });
    
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Optional: Delete reports associated with this patient
    // await Report.deleteMany({ patient: req.params.id });
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all patients
router.get('/', auth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Patient.countDocuments(query);
    
    res.json({
      patients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single patient
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update patient
router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;