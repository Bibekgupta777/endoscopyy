const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },

  // ✅ Custom fields
  serialNumber: String,
  idNumber: String,
  billNumber: String,
  indication: String,
  referredDoc: String,
  doneDoc: String,
  remark: String,
  procedureType: String,  // ✅ NEW — e.g. "Video GastroDuodenoscopy", "Colonoscopy"

  // Core fields
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  age: Number,
  sex: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  phone: String,
  address: String,
  email: String,
  mrn: String,
  bloodGroup: String,

  // Medical History
  allergies: [String],
  comorbidities: [String],
  medications: [String],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientId = `PAT${String(count + 1).padStart(6, '0')}`;
  }

  if (!this.serialNumber) {
    const count = await mongoose.model('Patient').countDocuments();
    this.serialNumber = String(count + 1);
  }

  if (this.dateOfBirth) {
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    this.age = age;
  }

  next();
});

module.exports = mongoose.model('Patient', patientSchema);