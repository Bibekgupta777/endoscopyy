require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const Report = require('./models/Report');
const { uploadToCloudinary } = require('./config/cloudinary');

const migrateImages = async () => {
  await connectDB();
  console.log('🔄 Starting image migration to Cloudinary...\n');

  const reports = await Report.find({
    'images.0': { $exists: true }
  });

  console.log(`📋 Found ${reports.length} reports with images\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const report of reports) {
    let modified = false;

    for (let i = 0; i < report.images.length; i++) {
      const img = report.images[i];

      // Skip if already on Cloudinary
      if (img.path && img.path.startsWith('http')) {
        skippedCount++;
        console.log(`⏭️  Skip (already cloud): ${img.filename}`);
        continue;
      }

      // Skip if already has cloudinaryId
      if (img.cloudinaryId) {
        skippedCount++;
        console.log(`⏭️  Skip (has cloudinaryId): ${img.filename}`);
        continue;
      }

      // Try to find the local file
      const uploadsDir = path.join(__dirname, 'uploads');
      let localPath = img.path ? img.path.replace(/\\/g, '/') : '';

      // Add uploads/ prefix if missing
      if (!localPath.startsWith('uploads/')) {
        localPath = `uploads/${localPath}`;
      }

      const fullPath = path.join(__dirname, localPath);

      // Also try without uploads prefix
      const altPath = path.join(uploadsDir, img.path || '');

      let filePath = null;
      if (fs.existsSync(fullPath)) {
        filePath = fullPath;
      } else if (fs.existsSync(altPath)) {
        filePath = altPath;
      }

      if (!filePath) {
        failedCount++;
        console.log(`❌ File not found: ${img.path}`);
        console.log(`   Tried: ${fullPath}`);
        console.log(`   Tried: ${altPath}`);
        continue;
      }

      try {
        // Read file and upload to Cloudinary
        const buffer = fs.readFileSync(filePath);
        const filename = `migrated-${Date.now()}-${Math.round(Math.random() * 1E9)}`;

        const cloudResult = await uploadToCloudinary(buffer, {
          public_id: filename,
          folder: 'endoscopy-images',
          resource_type: 'image',
        });

        // Update the database record
        report.images[i].path = cloudResult.secure_url;
        report.images[i].cloudinaryId = cloudResult.public_id;
        modified = true;
        migratedCount++;

        console.log(`✅ Migrated: ${img.filename} → ${cloudResult.secure_url}`);
      } catch (error) {
        failedCount++;
        console.log(`❌ Upload failed for ${img.filename}: ${error.message}`);
      }
    }

    if (modified) {
      await report.save();
      console.log(`💾 Saved report: ${report.reportId}\n`);
    }
  }

  console.log('\n════════════════════════════════════');
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped:  ${skippedCount}`);
  console.log(`   ❌ Failed:   ${failedCount}`);
  console.log('════════════════════════════════════\n');

  process.exit(0);
};

migrateImages().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});