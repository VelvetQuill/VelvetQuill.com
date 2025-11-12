
// backend/middleware/admin.js
import User from '../models/User.js';
import mongoose from 'mongoose';

// Audit log for admin actions
export const auditLog = (action) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log admin action after response is sent
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`🔧 ADMIN ACTION: ${req.user.username} (${req.user.role}) - ${action} - ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
                
                // In production, you'd save this to a proper audit log database
                // await AuditLog.create({
                //     admin: req.user._id,
                //     action: action,
                //     method: req.method,
                //     endpoint: req.originalUrl,
                //     ip: req.ip,
                //     userAgent: req.get('User-Agent'),
                //     timestamp: new Date()
                // });
            }
            originalSend.apply(res, arguments);
        };
        next();
    };
};

// Rate limiting for admin actions (more lenient than regular users)
export const adminRateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many admin requests, please try again later.'
    }
};

// Check system health before critical admin operations
export const systemHealthCheck = async (req, res, next) => {
    try {
        // Check database connection
        const dbState = mongoose.connection.readyState;
        if (dbState !== 1) { // 1 = connected
            return res.status(503).json({
                success: false,
                message: 'Database connection unavailable'
            });
        }

        // Check if there are active admin users
        const activeAdmins = await User.countDocuments({ 
            role: 'admin', 
            isActive: true 
        });

        if (activeAdmins === 0) {
            console.warn('⚠️  No active admin users found in system');
        }

        next();
    } catch (error) {
        console.error('System health check failed:', error);
        res.status(503).json({
            success: false,
            message: 'System health check failed'
        });
    }
};

// Backup check before destructive operations
export const backupCheck = (req, res, next) => {
    const destructiveMethods = ['DELETE', 'PUT', 'POST'];
    const destructiveEndpoints = [
        '/users/', '/stories/', '/categories/', '/contests/'
    ];

    const isDestructive = destructiveMethods.includes(req.method) && 
                         destructiveEndpoints.some(endpoint => req.originalUrl.includes(endpoint));

    if (isDestructive) {
        // In production, you'd check if a recent backup exists
        // For now, we'll just log a warning
        console.warn(`⚠️  DESTRUCTIVE ACTION: ${req.method} ${req.originalUrl} - Ensure backups are current`);
        
        // You could also require a confirmation header for very destructive actions
        if (req.method === 'DELETE' && !req.headers['x-confirm-destructive']) {
            return res.status(400).json({
                success: false,
                message: 'Destructive action requires confirmation header. Send x-confirm-destructive: true to proceed.'
            });
        }
    }

    next();
};

// Content moderation helper
export const contentModeration = async (req, res, next) => {
    // This middleware can scan content for inappropriate material
    // For now, it's a placeholder for future AI/content filtering integration
    
    const suspiciousPatterns = [
        /(http|https):\/\/[^\s]+/g, // URLs
        /[0-9]{3}-[0-9]{3}-[0-9]{4}/g, // Phone numbers
        /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g // Email addresses
    ];

    const checkContent = (content) => {
        const warnings = [];
        
        suspiciousPatterns.forEach((pattern, index) => {
            const matches = content.match(pattern);
            if (matches) {
                warnings.push({
                    type: ['url', 'phone', 'email'][index],
                    count: matches.length,
                    matches: matches.slice(0, 3) // Limit exposed data
                });
            }
        });

        return warnings;
    };

    // Attach content checker to request for use in controllers
    req.checkContent = checkContent;
    next();
};

                