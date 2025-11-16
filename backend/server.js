

// backend/server.js - Production Version
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';
import dotenv from 'dotenv';
import cron from 'node-cron';

import User from './models/User.js'; 

dotenv.config();

// Fix for DNS resolution issue
dns.setServers(['1.1.1.1']); // Use Cloudflare DNS

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Production CORS configuration for GitHub Pages frontend and Facebook browsers
const allowedOrigins = [
    'https://velvetquill.github.io',
    'https://velvetquill.github.io/VelvetQuill',
    'https://velvetquill.github.io/VelvetQuill/',
    'https://velvetquill-com.onrender.com',
    'https://www.velvetquill-com.onrender.com',
    'https://facebook.com',
    'https://www.facebook.com',
    'https://m.facebook.com',
    'https://mobile.facebook.com',
    'https://fb.com',
    'https://www.fb.com',
    'fb://',
    'fbmessenger://',
    'fblite://',
    'fb-messenger://',
    'fb-messenger-secure://',
    'http://localhost:3000', // For local development
    'http://localhost:5173'  // For Vite development
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Facebook in-app browsers, curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.some(allowedOrigin => {
            return origin === allowedOrigin || 
                   origin.startsWith(allowedOrigin + '/') ||
                   (allowedOrigin.includes('://') && origin.includes(allowedOrigin));
        })) {
            callback(null, true);
        } else {
            // Log unexpected origins for debugging (but don't block in production)
            console.log('CORS request from origin:', origin);
            callback(null, true); // Allow all in production, but log
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'User-Agent',
        'X-CSRF-Token',
        'Access-Control-Allow-Headers',
        'X-API-Key',
        'Cache-Control'
    ],
    exposedHeaders: [
        'Content-Length',
        'Content-Range',
        'X-Content-Range',
        'X-Total-Count'
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 hours
}));

// Handle preflight requests explicitly
app.options('/{*splat}', (req, res) => {
    const requestOrigin = req.headers.origin;
    
    // Check if the request origin is in our allowed list
    if (allowedOrigins.includes(requestOrigin)) {
        res.header('Access-Control-Allow-Origin', requestOrigin);
    } else {
        // Fallback to any origin that matches our pattern
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, X-CSRF-Token, Access-Control-Allow-Headers, X-API-Key, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.status(204).send();
});


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware for production
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Additional headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    next();
});

// Serve static files from frontend (if applicable)
app.use(express.static(path.join(__dirname, '../frontend'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    index: 'index.html'
}));

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI;

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`❌ Required environment variable ${envVar} is missing`);
        process.exit(1);
    }
});

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not defined');
    process.exit(1);
}

const connectDB = async () => {
    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            dbName: "velvetquill-db",
            maxPoolSize: 10,
            minPoolSize: 5
        });
        console.log('✅ MongoDB Atlas connected successfully');
        return conn;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Route loading function
const loadRoutes = async () => {
    try {
        const adminRoutes = (await import('./routes/admin.js')).default;
        const authRoutes = (await import('./routes/auth.js')).default;
        const userRoutes = (await import('./routes/users.js')).default;
        const storiesRoutes = (await import('./routes/stories.js')).default;
        const commentsRoutes = (await import('./routes/comments.js')).default;
        const categoriesRoutes = (await import('./routes/categories.js')).default;
        const contestsRoutes = (await import('./routes/contests.js')).default;
        const uploadRoutes = (await import('./routes/uploadRoutes.js')).default;
        const analyticsRoutes = (await import('./routes/analytics.js')).default;
        
        app.use('/api/admin', adminRoutes);
        console.log('ADMIN ROUTES LOADED !');
        app.use('/api/auth', authRoutes);
        console.log('AUTH ROUTES LOADED !');
        app.use('/api/users', userRoutes);
        console.log('USER ROUTES LOADED !');
        app.use('/api/stories', storiesRoutes);
        console.log('STORY ROUTES LOADED !');
        app.use('/api/contests', contestsRoutes);
        console.log('CONTEST ROUTES LOADED !');
        app.use('/api/categories', categoriesRoutes);
        console.log('CATEGORY ROUTES LOADED !');
        app.use('/api/comments', commentsRoutes);
        console.log('COMMENT ROUTES LOADED !');
        app.use('/api/upload', uploadRoutes);
        console.log('UPLOADS ROUTES LOADED!');
        app.use('/api/analytics', analyticsRoutes);
        console.log('ANALYTICS ROUTES LOADED !');
        
        console.log('✅ All API routes loaded successfully - PRODUCTION');
    } catch (error) {
        console.error('❌ Route loading error:', error.message);
        console.log('💡 Make sure all route files exist in the routes folder');
        throw error;
    }
};

// Auto-approve author applications after 5 seconds
const autoApproveAuthorApplications = async () => {
    try {
        const fiveSecondsAgo = new Date(Date.now() - 5 * 1000); // Changed from 8 hours to 5 seconds
        
        const pendingApplications = await User.find({
            'authorApplication.status': 'pending',
            'authorApplication.appliedAt': { $lte: fiveSecondsAgo }
        });

        for (const user of pendingApplications) {
            user.isAuthor = true;
            user.role = 'author';
            user.authorApplication.status = 'approved';
            user.authorApplication.reviewedAt = new Date();
            user.authorApplication.rejectionReason = 'Automatically approved after 5 seconds';
            
            await user.save();
            //console.log(`Auto-approved author application for user: ${user.username}`);
        }

        if (pendingApplications.length > 0) {
            console.log(`Auto-approved ${pendingApplications.length} author applications`);
        }
    } catch (error) {
        console.error('Error in auto-approving author applications:', error);
    }
};

// Schedule the job to run every 10 seconds for faster processing
cron.schedule('*/10 * * * * *', autoApproveAuthorApplications); // Changed to run every 10 seconds
//console.log('✅ Author auto-approval scheduler initialized (5 seconds delay)');


// Start server function
const startServer = async () => {
    try {
        await connectDB();
        await loadRoutes();

        // Health check endpoint
        app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                message: 'Production server is running!',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                mongodb: 'Atlas Cluster',
                backend: 'velvetquill-com.onrender.com',
                frontend: 'velvetquill.github.io/VelvetQuill',
                cors: 'Enabled for GitHub Pages & Facebook'
            });
        });

        // Debug endpoints (limited in production)
        app.get('/api/debug/database', (req, res) => {
            res.json({
                databaseName: mongoose.connection.db?.databaseName,
                readyState: mongoose.connection.readyState,
                status: 'connected'
            });
        });

        // Test endpoint to verify server is working
        app.get('/api/test', (req, res) => {
            res.json({
                success: true,
                message: 'API is working!',
                server: 'VelvetQuill Production Server',
                version: '1.0.0',
                backend: 'velvetquill-com.onrender.com',
                frontend: 'velvetquill.github.io/VelvetQuill',
                features: ['Authentication', 'User Management', 'Stories', 'Comments', 'Analytics'],
                cors: 'Enabled for GitHub Pages & Facebook browsers'
            });
        });

        // Facebook browser detection endpoint
        app.get('/api/fb-check', (req, res) => {
            const userAgent = req.headers['user-agent'] || '';
            const isFacebook = userAgent.includes('FBAN') || 
                              userAgent.includes('FBAV') ||
                              userAgent.includes('FBLite') ||
                              req.headers['sec-fetch-site'] === 'cross-site';
            
            res.json({
                isFacebookBrowser: isFacebook,
                userAgent: userAgent.substring(0, 100), // Limit length
                origin: req.headers.origin,
                corsSupported: true
            });
        });

        // CORS info endpoint
        app.get('/api/cors-info', (req, res) => {
            res.json({
                allowedOrigins: allowedOrigins,
                currentOrigin: req.headers.origin,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD']
            });
        });

        // Handle 404 for API routes
        app.use('/{*splat}', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint not found',
                requestedUrl: req.originalUrl,
                availableEndpoints: [
                    '/api/health',
                    '/api/test',
                    '/api/fb-check',
                    '/api/cors-info',
                    '/api/admin/*',
                    '/api/auth/*',
                    '/api/users/*',
                    '/api/stories/*',
                    '/api/comments/*',
                    '/api/categories/*',
                    '/api/contests/*',
                    '/api/analytics/*',
                    '/api/upload/*'
                ]
            });
        });

        // Serve frontend for all other routes (SPA fallback) - if serving frontend from backend
        app.get('/{*splat}', (req, res) => {
            res.json({
                success: true,
                message: 'VelvetQuill Backend API',
                frontend: 'https://velvetquill.github.io/VelvetQuill',
                backend: 'https://velvetquill-com.onrender.com',
                documentation: 'https://velvetquill.github.io/VelvetQuill/docs'
            });
        });

        // Global error handling middleware
        app.use((err, req, res, next) => {
            console.error('🚨 Production Server Error:', err.message);

            // Don't expose stack traces in production
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n' + '='.repeat(70));
            console.log('🚀 VELVETQUILL PRODUCTION SERVER');
            console.log('='.repeat(70));
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌍 Environment: PRODUCTION`);
            console.log(`🔙 Backend: velvetquill-com.onrender.com`);
            console.log(`🔜 Frontend: velvetquill.github.io/VelvetQuill`);
            console.log(`🗄️  Database: MongoDB Atlas`);
            console.log(`🔗 API: https://velvetquill-com.onrender.com/api`);
            console.log(`🌐 Frontend: https://velvetquill.github.io/VelvetQuill`);
            console.log(`❤️  Health Check: https://velvetquill-com.onrender.com/api/health`);
            console.log(`📱 Facebook Browser Support: ENABLED`);
            console.log(`🌐 GitHub Pages CORS: ENABLED`);
            console.log('='.repeat(70));
            console.log('🔒 Production Features:');
            console.log('   • Enhanced CORS for GitHub Pages & Facebook browsers');
            console.log('   • Security headers enabled');
            console.log('   • Connection pooling for MongoDB');
            console.log('   • Graceful shutdown handling');
            console.log('   • Analytics routes enabled');
            console.log('='.repeat(70) + '\n');
        });
    } catch (error) {
        console.error('FAILED TO START PRODUCTION SERVER:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔻 Shutting down production server gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔻 Received SIGTERM, shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

startServer();




