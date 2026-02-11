require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin if exists
    await User.deleteOne({ email: 'admin@demo.com' });
    console.log('Deleted old admin user (if existed)');

    // Create new admin
    const admin = new User({
      name: 'Dr. Admin',
      email: 'admin@demo.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'admin',
      qualification: 'MBBS, MD (Gastroenterology)',
      isActive: true
    });

    await admin.save();
    console.log('\n✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email: admin@demo.com');
    console.log('Password: password123');
    console.log('-----------------------------------\n');

    // Verify the user was created
    const verifyUser = await User.findOne({ email: 'admin@demo.com' });
    if (verifyUser) {
      console.log('✅ Verified: User exists in database');
      console.log('User ID:', verifyUser._id);
      console.log('Name:', verifyUser.name);
      console.log('Email:', verifyUser.email);
      console.log('Role:', verifyUser.role);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();