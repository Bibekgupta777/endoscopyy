const express = require('express');
const Setting = require('../models/Setting');
const fs = require('fs'); // ✅ Required for crash-proof directory check
const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get Settings
router.get('/', asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();

  if (!settings) {
    console.log("No settings found, creating new...");
    settings = await Setting.create({});
  }

  // DEBUG
  console.log("=== GET SETTINGS ===");
  console.log("clinicalLibrary exists:", !!settings.clinicalLibrary);
  if (settings.clinicalLibrary) {
    console.log("EGD count:", settings.clinicalLibrary.EGD?.length || 0);
    console.log("Colonoscopy count:", settings.clinicalLibrary.Colonoscopy?.length || 0);
  }

  res.json(settings);
}));

// Update Settings
router.put('/', asyncHandler(async (req, res) => {
  console.log("=== PUT SETTINGS ===");
  console.log("Body keys:", Object.keys(req.body));
  console.log("clinicalLibrary exists in body:", !!req.body.clinicalLibrary);

  if (req.body.clinicalLibrary) {
    console.log("EGD in body:", req.body.clinicalLibrary.EGD?.length || 0);
    console.log("First EGD organ:", req.body.clinicalLibrary.EGD?.[0]?.organ || "none");
  }

  let updateData;
  try {
    updateData = JSON.parse(JSON.stringify(req.body));
  } catch (e) {
    updateData = { ...req.body };
  }

  delete updateData._id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.__v;

  console.log("About to save clinicalLibrary:", 
    JSON.stringify(updateData.clinicalLibrary, null, 2).substring(0, 500));

  const settings = await Setting.findOneAndUpdate(
    {},
    updateData,
    {
      new: true,
      upsert: true,
      runValidators: false
    }
  );

  // ✅ SAFELY APPLY NEW FOLDER PATH TO RUNNING EXPRESS SERVER
  if (settings && settings.saveLocation) {
    try {
      if (!fs.existsSync(settings.saveLocation)) {
        fs.mkdirSync(settings.saveLocation, { recursive: true });
      }
      req.app.locals.uploadsDir = settings.saveLocation; // Tell server to use this immediately!
      console.log('✅ Global save location updated dynamically to:', settings.saveLocation);
    } catch (err) {
      console.error('❌ Failed to create custom folder, app will use fallback. Error:', err.message);
    }
  }

  console.log("=== AFTER SAVE ===");
  console.log("Saved clinicalLibrary EGD count:", settings.clinicalLibrary?.EGD?.length || 0);

  res.json(settings);
}));

router.use((err, req, res, next) => {
  console.error('❌ Settings route error:', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  res.status(500).json({ message: 'Settings operation failed' });
});

module.exports = router;