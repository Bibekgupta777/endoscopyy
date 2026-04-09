// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       return res.status(401).json({ message: 'No authentication token, access denied' });
//     }
    
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select('-password');
    
//     if (!user || !user.isActive) {
//       return res.status(401).json({ message: 'User not found or inactive' });
//     }
    
//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Access forbidden: insufficient permissions' });
//     }
//     next();
//   };
// };

// module.exports = { auth, authorize };



const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // ✅ FIX 1: Handle missing Authorization header safely
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    // ✅ FIX 2: Handle malformed Authorization header
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token || token === 'undefined' || token === 'null' || token === '') {
      return res.status(401).json({ 
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
    }

    // ✅ FIX 3: Handle missing JWT_SECRET (common cause of crash)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET is not defined in environment!');
      return res.status(500).json({ 
        message: 'Server configuration error',
        code: 'CONFIG_ERROR'
      });
    }

    // ✅ FIX 4: Separate JWT verification errors from DB errors
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      // Specific error messages for different JWT failures
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Session expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      }
      if (jwtError.name === 'NotBeforeError') {
        return res.status(401).json({ 
          message: 'Token not yet valid',
          code: 'TOKEN_NOT_ACTIVE'
        });
      }
      // Unknown JWT error
      return res.status(401).json({ 
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }

    // ✅ FIX 5: Handle DB errors separately (don't mask as "invalid token")
    let user;
    try {
      user = await User.findById(decoded.userId).select('-password');
    } catch (dbError) {
      console.error('❌ Database error in auth middleware:', dbError.message);
      return res.status(503).json({ 
        message: 'Database temporarily unavailable',
        code: 'DB_ERROR'
      });
    }

    if (!user) {
      return res.status(401).json({ 
        message: 'User account not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated. Contact administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // ✅ Catch-all for any unexpected errors
    console.error('❌ Unexpected auth middleware error:', error.message);
    res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // ✅ FIX 6: Guard against missing req.user
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access forbidden: insufficient permissions',
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};

module.exports = { auth, authorize };