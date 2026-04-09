// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('✅ MongoDB Connected');
//   } catch (error) {
//     console.error('❌ MongoDB Connection Error:', error.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;


const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ✅ FIX 1: Add fallback URI (yours was undefined if env missing)
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/endoscopy_database';

    await mongoose.connect(uri, {
      // ✅ FIX 2: Add timeout options (without these, it hangs forever
      //    on Windows 7 if MongoDB is slow to respond)
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    });

    console.log('✅ MongoDB Connected');

    // ✅ FIX 3: Add reconnection handlers (MongoDB can drop connection
    //    during long procedures — without these the app crashes silently)
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Mongoose will auto-reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // ✅ FIX 4: NEVER process.exit(1) — it kills backend instantly
    //    with no error shown to user. Throw instead so server.js 
    //    can handle it and keep running.
    //
    // BEFORE (CRASH):  process.exit(1);
    // AFTER  (SAFE):   throw error;
    throw error;
  }
};

module.exports = connectDB;