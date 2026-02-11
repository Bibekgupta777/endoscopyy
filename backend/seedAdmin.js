require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminExists = await User.findOne({ email: 'admin@demo.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'Dr. Admin',
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin',
        qualification: 'MBBS, MD (Gastroenterology)'
      });
      
      console.log('✅ Admin user created');
      console.log('Email: admin@demo.com');
      console.log('Password: password123');
    } else {
      console.log('Admin already exists');
    }
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();