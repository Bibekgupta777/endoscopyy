const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  hospitalName: String,
  hospitalAddress: String,
  hospitalPhone: String,
  hospitalEmail: String,
  hospitalLogo: String,
  adminName: String,
  doctors: mongoose.Schema.Types.Mixed,
  clinicalLibrary: mongoose.Schema.Types.Mixed,
  procedures: mongoose.Schema.Types.Mixed,
  procedureNames: mongoose.Schema.Types.Mixed,
  studyTypes: mongoose.Schema.Types.Mixed,
  sedationDrugs: mongoose.Schema.Types.Mixed,
  indications: mongoose.Schema.Types.Mixed,
  therapeuticProcedures: mongoose.Schema.Types.Mixed,
  complications: mongoose.Schema.Types.Mixed
}, { 
  timestamps: true, 
  strict: false,
  minimize: false
});

// ✅ IMPORTANT: Mark clinicalLibrary as modified before saving
settingSchema.pre('save', function(next) {
  this.markModified('clinicalLibrary');
  this.markModified('doctors');
  this.markModified('procedures');
  next();
});

module.exports = mongoose.model('Setting', settingSchema);