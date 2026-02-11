const express = require('express');
const Setting = require('../models/Setting');
const router = express.Router();

// Get Settings
router.get('/', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    
    if (!settings) {
      console.log("No settings found, creating new...");
      settings = await Setting.create({});
    }
    
    // ✅ DEBUG: Log what we're sending to frontend
    console.log("=== GET SETTINGS ===");
    console.log("clinicalLibrary exists:", !!settings.clinicalLibrary);
    if (settings.clinicalLibrary) {
      console.log("EGD count:", settings.clinicalLibrary.EGD?.length || 0);
      console.log("Colonoscopy count:", settings.clinicalLibrary.Colonoscopy?.length || 0);
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update Settings
router.put('/', async (req, res) => {
  try {
    // ✅ DEBUG: Log what we received from frontend
    console.log("=== PUT SETTINGS ===");
    console.log("Body keys:", Object.keys(req.body));
    console.log("clinicalLibrary exists in body:", !!req.body.clinicalLibrary);
    
    if (req.body.clinicalLibrary) {
      console.log("EGD in body:", req.body.clinicalLibrary.EGD?.length || 0);
      console.log("First EGD organ:", req.body.clinicalLibrary.EGD?.[0]?.organ || "none");
    }

    // Remove immutable fields
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    // ✅ DEBUG: Log before saving
    console.log("About to save clinicalLibrary:", JSON.stringify(updateData.clinicalLibrary, null, 2).substring(0, 500));

    const settings = await Setting.findOneAndUpdate(
      {},
      updateData, // Don't use $set, just replace directly
      { 
        new: true, 
        upsert: true,
        runValidators: false // ✅ Skip validation
      }
    );

    // ✅ DEBUG: Log what was saved
    console.log("=== AFTER SAVE ===");
    console.log("Saved clinicalLibrary EGD count:", settings.clinicalLibrary?.EGD?.length || 0);

    res.json(settings);
  } catch (error) {
    console.error("Save Settings Error:", error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;