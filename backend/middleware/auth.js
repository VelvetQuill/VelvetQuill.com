// backend/middleware/auth.js - CORRECTED VERSION
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Define public routes that don't require authentication
const publicRoutes = [
  '/api/auth/signin',
  '/api/auth/signup', 
  '/api/auth/verify',
  '/api/health',
  '/api/categories',
  '/api/stories/search'
];

// Check if route is public
const isPublicRoute = (path, method) => {
  console.log(`🔍 Checking route: ${method} ${path}`); // DEBUG LOG
  
 if(path.includes('/profile/public/')
   || path.includes('/stories/public/') 
   || path.includes('/categories') 
   || path.includes('stories/search')
  || path.includes('/auth/') 
 || (method === 'GET' && path === '/api/stories')){
  console.log(`PUBLIC ROUTE: ${path}`);
  return true;
 }

 console.log(`PROTECTED ROUTE: ${path}`);
 return false;
};


export const authenticate = async (req, res, next) => {
  try {
    // Skip authentication for public routes
    if (isPublicRoute(req.path, req.method)) {
      console.log(`✅ Skipping auth for public route: ${req.method} ${req.path}`);
      return next();
    }

    console.log(`🔒 Auth required for: ${req.method} ${req.path}`);
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({
        success: false,
        message: 'Token is invalid - user not found.'
      });
    }

    if (!user.isActive || user.status !== 'active') {
      console.log('❌ User account not active');
      return res.status(401).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    req.user = user;
    req.userId = user._id;
    console.log(`✅ Auth successful for user: ${user.username}`);
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// ... keep the rest of your middleware functions the same



// Enhanced optional auth middleware for mixed-access routes
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive && user.status === 'active') {
          req.user = user;
          req.userId = user._id;
        }
      } catch (tokenError) {
        // Token is invalid, but continue without user (optional auth)
        console.warn('Optional auth - invalid token:', tokenError.message);
      }
    }
    next();
  } catch (error) {
    // If any other error occurs, continue without user
    console.error('Optional auth error:', error);
    next();
  }
};

// Keep existing requireAdmin, requireAuthor, requireStoryAccess middleware unchanged
export const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'overallAdmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

export const requireAuthor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!req.user.isAuthor && !['admin', 'overallAdmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Author privileges required.'
    });
  }
  next();
};

export const requireStoryAccess = async (req, res, next) => {
  try {
    const storyId = req.params.id;
    const userId = req.userId;
    
    // This would typically check if user is author or collaborator
    // For now, we'll rely on controller-level checks
    next();
  } catch (error) {
    console.error('Story access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking story access'
    });
  }
};

