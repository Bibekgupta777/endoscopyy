// // // // const express = require('express');
// // // // const jwt = require('jsonwebtoken');
// // // // const User = require('../models/User');
// // // // const { auth } = require('../middleware/auth');

// // // // const router = express.Router();

// // // // // Register (Admin only in production)
// // // // router.post('/register', async (req, res) => {
// // // //   try {
// // // //     const { name, email, password, role, qualification } = req.body;
    
// // // //     // Check if user exists
// // // //     const existingUser = await User.findOne({ email });
// // // //     if (existingUser) {
// // // //       return res.status(400).json({ message: 'User already exists' });
// // // //     }
    
// // // //     const user = new User({
// // // //       name,
// // // //       email,
// // // //       password,
// // // //       role,
// // // //       qualification
// // // //     });
    
// // // //     await user.save();
    
// // // //     res.status(201).json({ message: 'User created successfully' });
// // // //   } catch (error) {
// // // //     res.status(500).json({ message: error.message });
// // // //   }
// // // // });

// // // // // Login
// // // // router.post('/login', async (req, res) => {
// // // //   try {
// // // //     const { email, password } = req.body;
    
// // // //     const user = await User.findOne({ email });
// // // //     if (!user) {
// // // //       return res.status(401).json({ message: 'Invalid credentials' });
// // // //     }
    
// // // //     const isMatch = await user.comparePassword(password);
// // // //     if (!isMatch) {
// // // //       return res.status(401).json({ message: 'Invalid credentials' });
// // // //     }
    
// // // //     if (!user.isActive) {
// // // //       return res.status(401).json({ message: 'Account is inactive' });
// // // //     }
    
// // // //     const token = jwt.sign(
// // // //       { userId: user._id, role: user.role },
// // // //       process.env.JWT_SECRET,
// // // //       { expiresIn: '24h' }
// // // //     );
    
// // // //     res.json({
// // // //       token,
// // // //       user: {
// // // //         id: user._id,
// // // //         name: user.name,
// // // //         email: user.email,
// // // //         role: user.role,
// // // //         qualification: user.qualification
// // // //       }
// // // //     });
// // // //   } catch (error) {
// // // //     res.status(500).json({ message: error.message });
// // // //   }
// // // // });

// // // // // Get current user
// // // // router.get('/me', auth, async (req, res) => {
// // // //   res.json(req.user);
// // // // });

// // // // module.exports = router;


// // // const express = require('express');
// // // const jwt = require('jsonwebtoken');
// // // const User = require('../models/User');
// // // const { auth } = require('../middleware/auth');

// // // const router = express.Router();

// // // // Register (Admin only in production)
// // // router.post('/register', async (req, res) => {
// // //   try {
// // //     const { name, email, password, role, qualification } = req.body;
    
// // //     // Check if user exists
// // //     const existingUser = await User.findOne({ email });
// // //     if (existingUser) {
// // //       return res.status(400).json({ message: 'User already exists' });
// // //     }
    
// // //     const user = new User({
// // //       name,
// // //       email,
// // //       password,
// // //       role,
// // //       qualification
// // //     });
    
// // //     await user.save();
    
// // //     res.status(201).json({ message: 'User created successfully' });
// // //   } catch (error) {
// // //     res.status(500).json({ message: error.message });
// // //   }
// // // });

// // // // Login
// // // router.post('/login', async (req, res) => {
// // //   try {
// // //     const { email, password } = req.body;
    
// // //     const user = await User.findOne({ email });
// // //     if (!user) {
// // //       return res.status(401).json({ message: 'Invalid credentials' });
// // //     }
    
// // //     const isMatch = await user.comparePassword(password);
// // //     if (!isMatch) {
// // //       return res.status(401).json({ message: 'Invalid credentials' });
// // //     }
    
// // //     if (!user.isActive) {
// // //       return res.status(401).json({ message: 'Account is inactive' });
// // //     }
    
// // //     const token = jwt.sign(
// // //       { userId: user._id, role: user.role },
// // //       process.env.JWT_SECRET,
// // //       { expiresIn: '24h' }
// // //     );
    
// // //     res.json({
// // //       token,
// // //       user: {
// // //         id: user._id,
// // //         name: user.name,
// // //         email: user.email,
// // //         role: user.role,
// // //         qualification: user.qualification
// // //       }
// // //     });
// // //   } catch (error) {
// // //     res.status(500).json({ message: error.message });
// // //   }
// // // });

// // // // Get current user
// // // router.get('/me', auth, async (req, res) => {
// // //   res.json(req.user);
// // // });

// // // module.exports = router;


// // const express = require('express');
// // const jwt = require('jsonwebtoken');
// // const User = require('../models/User');
// // const { auth } = require('../middleware/auth');

// // const router = express.Router();

// // // ✅ FIX 1: Add async error wrapper to prevent unhandled promise rejections
// // const asyncHandler = (fn) => (req, res, next) => {
// //   Promise.resolve(fn(req, res, next)).catch(next);
// // };

// // // Register (Admin only in production)
// // router.post('/register', asyncHandler(async (req, res) => {
// //   const { name, email, password, role, qualification } = req.body;

// //   // ✅ FIX 2: Validate required fields
// //   if (!name || !email || !password) {
// //     return res.status(400).json({ 
// //       message: 'Name, email and password are required' 
// //     });
// //   }

// //   // ✅ FIX 3: Validate email format
// //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //   if (!emailRegex.test(email)) {
// //     return res.status(400).json({ 
// //       message: 'Invalid email format' 
// //     });
// //   }

// //   // ✅ FIX 4: Validate password length
// //   if (password.length < 6) {
// //     return res.status(400).json({ 
// //       message: 'Password must be at least 6 characters' 
// //     });
// //   }

// //   // Check if user exists
// //   const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
// //   if (existingUser) {
// //     return res.status(400).json({ message: 'User already exists with this email' });
// //   }

// //   const user = new User({
// //     name: name.trim(),
// //     email: email.toLowerCase().trim(),
// //     password,
// //     role: role || 'doctor',
// //     qualification: qualification || ''
// //   });

// //   await user.save();

// //   res.status(201).json({ message: 'User created successfully' });
// // }));

// // // Login
// // router.post('/login', asyncHandler(async (req, res) => {
// //   const { email, password } = req.body;

// //   // ✅ FIX 5: Validate input exists
// //   if (!email || !password) {
// //     return res.status(400).json({ 
// //       message: 'Email and password are required' 
// //     });
// //   }

// //   const user = await User.findOne({ email: email.toLowerCase().trim() });
// //   if (!user) {
// //     // ✅ FIX 6: Don't reveal whether email exists (security)
// //     return res.status(401).json({ message: 'Invalid email or password' });
// //   }

// //   // ✅ FIX 7: Handle comparePassword errors
// //   let isMatch;
// //   try {
// //     isMatch = await user.comparePassword(password);
// //   } catch (compareError) {
// //     console.error('❌ Password comparison error:', compareError.message);
// //     return res.status(500).json({ message: 'Authentication error' });
// //   }

// //   if (!isMatch) {
// //     return res.status(401).json({ message: 'Invalid email or password' });
// //   }

// //   if (!user.isActive) {
// //     return res.status(401).json({ message: 'Account is inactive. Contact administrator.' });
// //   }

// //   // ✅ FIX 8: Handle missing JWT_SECRET
// //   const jwtSecret = process.env.JWT_SECRET;
// //   if (!jwtSecret) {
// //     console.error('❌ JWT_SECRET is not defined!');
// //     return res.status(500).json({ message: 'Server configuration error' });
// //   }

// //   // ✅ FIX 9: Use JWT_EXPIRE from env if available
// //   const expiresIn = process.env.JWT_EXPIRE || '24h';

// //   const token = jwt.sign(
// //     { userId: user._id, role: user.role },
// //     jwtSecret,
// //     { expiresIn }
// //   );

// //   res.json({
// //     token,
// //     user: {
// //       id: user._id,
// //       name: user.name,
// //       email: user.email,
// //       role: user.role,
// //       qualification: user.qualification || '',
// //       signature: user.signature || ''
// //     }
// //   });
// // }));

// // // Get current user
// // router.get('/me', auth, asyncHandler(async (req, res) => {
// //   // ✅ FIX 10: Return consistent user object
// //   if (!req.user) {
// //     return res.status(401).json({ message: 'Not authenticated' });
// //   }

// //   res.json({
// //     user: {
// //       id: req.user._id,
// //       name: req.user.name,
// //       email: req.user.email,
// //       role: req.user.role,
// //       qualification: req.user.qualification || '',
// //       signature: req.user.signature || ''
// //     }
// //   });
// // }));

// // // ✅ FIX 11: Add error handler at router level
// // router.use((err, req, res, next) => {
// //   console.error('❌ Auth route error:', err.message);
  
// //   // Mongoose duplicate key error
// //   if (err.code === 11000) {
// //     return res.status(400).json({ message: 'User already exists with this email' });
// //   }
  
// //   // Mongoose validation error
// //   if (err.name === 'ValidationError') {
// //     const messages = Object.values(err.errors).map(e => e.message);
// //     return res.status(400).json({ message: messages.join(', ') });
// //   }

// //   res.status(500).json({ message: 'Authentication service error' });
// // });

// // module.exports = router;


// const express = require('express');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { auth } = require('../middleware/auth');

// const router = express.Router();

// // ✅ FIX 1: Add async error wrapper to prevent unhandled promise rejections
// const asyncHandler = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

// // Register (Admin only in production)
// router.post('/register', asyncHandler(async (req, res) => {
//   const { name, email, password, role, qualification } = req.body;

//   // ✅ FIX 2: Validate required fields
//   if (!name || !email || !password) {
//     return res.status(400).json({ 
//       message: 'Name, email and password are required' 
//     });
//   }

//   // ✅ FIX 3: Validate email format
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return res.status(400).json({ 
//       message: 'Invalid email format' 
//     });
//   }

//   // ✅ FIX 4: Validate password length
//   if (password.length < 6) {
//     return res.status(400).json({ 
//       message: 'Password must be at least 6 characters' 
//     });
//   }

//   // Check if user exists
//   const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
//   if (existingUser) {
//     return res.status(400).json({ message: 'User already exists with this email' });
//   }

//   const user = new User({
//     name: name.trim(),
//     email: email.toLowerCase().trim(),
//     password,
//     role: role || 'doctor',
//     qualification: qualification || ''
//   });

//   await user.save();

//   res.status(201).json({ message: 'User created successfully' });
// }));

// // Login
// router.post('/login', asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   // ✅ FIX 5: Validate input exists
//   if (!email || !password) {
//     return res.status(400).json({ 
//       message: 'Email and password are required' 
//     });
//   }

//   const user = await User.findOne({ email: email.toLowerCase().trim() });
//   if (!user) {
//     // ✅ FIX 6: Don't reveal whether email exists (security)
//     return res.status(401).json({ message: 'Invalid email or password' });
//   }

//   // ✅ FIX 7: Handle comparePassword errors
//   let isMatch;
//   try {
//     isMatch = await user.comparePassword(password);
//   } catch (compareError) {
//     console.error('❌ Password comparison error:', compareError.message);
//     return res.status(500).json({ message: 'Authentication error' });
//   }

//   if (!isMatch) {
//     return res.status(401).json({ message: 'Invalid email or password' });
//   }

//   if (!user.isActive) {
//     return res.status(401).json({ message: 'Account is inactive. Contact administrator.' });
//   }

//   // ✅ FIX 8: Handle missing JWT_SECRET
//   const jwtSecret = process.env.JWT_SECRET;
//   if (!jwtSecret) {
//     console.error('❌ JWT_SECRET is not defined!');
//     return res.status(500).json({ message: 'Server configuration error' });
//   }

//   // ✅ FIX 9: Use JWT_EXPIRE from env if available
//   const expiresIn = process.env.JWT_EXPIRE || '24h';

//   const token = jwt.sign(
//     { userId: user._id, role: user.role },
//     jwtSecret,
//     { expiresIn }
//   );

//   res.json({
//     token,
//     user: {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       qualification: user.qualification || '',
//       signature: user.signature || ''
//     }
//   });
// }));

// // Get current user
// router.get('/me', auth, asyncHandler(async (req, res) => {
//   // ✅ FIX 10: Return consistent user object
//   if (!req.user) {
//     return res.status(401).json({ message: 'Not authenticated' });
//   }

//   res.json({
//     user: {
//       id: req.user._id,
//       name: req.user.name,
//       email: req.user.email,
//       role: req.user.role,
//       qualification: req.user.qualification || '',
//       signature: req.user.signature || ''
//     }
//   });
// }));

// // ✅ FIX 11: Add error handler at router level
// router.use((err, req, res, next) => {
//   console.error('❌ Auth route error:', err.message);
  
//   // Mongoose duplicate key error
//   if (err.code === 11000) {
//     return res.status(400).json({ message: 'User already exists with this email' });
//   }
  
//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     const messages = Object.values(err.errors).map(e => e.message);
//     return res.status(400).json({ message: messages.join(', ') });
//   }

//   res.status(500).json({ message: 'Authentication service error' });
// });

// module.exports = router;



const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Register (Admin only in production)
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role, qualification } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ 
      message: 'Name, email and password are required' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      message: 'Invalid email format' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters' 
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  const user = new User({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role || 'doctor',
    qualification: qualification || ''
  });

  await user.save();

  res.status(201).json({ message: 'User created successfully' });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email and password are required' 
    });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  let isMatch;
  try {
    isMatch = await user.comparePassword(password);
  } catch (compareError) {
    console.error('❌ Password comparison error:', compareError.message);
    return res.status(500).json({ message: 'Authentication error' });
  }

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(401).json({ message: 'Account is inactive. Contact administrator.' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET is not defined!');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // ✅ THIS FIXES ISSUE 2: Hardcoded to 1 year (365 days) for offline use!
  const expiresIn = '365d'; 

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    jwtSecret,
    { expiresIn }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      qualification: user.qualification || '',
      signature: user.signature || ''
    }
  });
}));

// Get current user
router.get('/me', auth, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      qualification: req.user.qualification || '',
      signature: req.user.signature || ''
    }
  });
}));

router.use((err, req, res, next) => {
  console.error('❌ Auth route error:', err.message);
  
  if (err.code === 11000) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  res.status(500).json({ message: 'Authentication service error' });
});

module.exports = router;