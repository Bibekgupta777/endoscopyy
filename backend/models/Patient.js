// const mongoose = require('mongoose');

// const patientSchema = new mongoose.Schema({
//   patientId: {
//     type: String,
//     unique: true
//     // REMOVED "required: true" here to allow auto-generation
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   dateOfBirth: {
//     type: Date,
//     required: true
//   },
//   age: Number, // Auto-calculated
//   sex: {
//     type: String,
//     enum: ['Male', 'Female', 'Other'],
//     required: true
//   },
//   phone: String,
//   address: String,
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
// }, {
//   timestamps: true
// });

// // Auto-generate Patient ID
// patientSchema.pre('save', async function(next) {
//   if (!this.patientId) {
//     // Get total count of patients to generate the next ID
//     const count = await mongoose.model('Patient').countDocuments();
//     // Generate ID like PAT000001, PAT000002
//     this.patientId = `PAT${String(count + 1).padStart(6, '0')}`;
//   }
  
//   // Calculate age from DOB
//   if (this.dateOfBirth) {
//     const today = new Date();
//     const birthDate = new Date(this.dateOfBirth);
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const monthDiff = today.getMonth() - birthDate.getMonth();
    
//     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//       age--;
//     }
//     this.age = age;
//   }
  
//   next();
// });

// module.exports = mongoose.model('Patient', patientSchema);

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  age: Number,
  sex: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  phone: String,
  address: String,
  email: String,
  mrn: String, // Medical Record Number
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