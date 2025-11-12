
// backend/middleware/auth.js - UPDATED
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
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
            return res.status(401).json({
                success: false,
                message: 'Token is invalid - user not found.'
            });
        }

        if (!user.isActive || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is not active.'
            });
        }

        req.user = user;
        req.userId = user._id;
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

export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user && user.isActive && user.status === 'active') {
                req.user = user;
                req.userId = user._id;
            }
        }
        next();
    } catch (error) {
        // If token is invalid, continue without user (optional auth)
        next();
    }
};

// NEW: Middleware to check story ownership or collaboration
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




