


// backend/server.js - ES Module Version
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

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

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
            dbName: "velvetquill-db"
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

       
        
        console.log('✅ All API routes loaded successfully - 102');
    } catch (error) {
        console.error('❌ Route loading error:', error.message);
        console.log('💡 Make sure all route files exist in the routes folder');
        throw error; // Re-throw to handle in startServer
    }
};


// Auto-approve author applications after 8 hours
const autoApproveAuthorApplications = async () => {
    try {
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
        
        const pendingApplications = await User.find({
            'authorApplication.status': 'pending',
            'authorApplication.appliedAt': { $lte: eightHoursAgo }
        });

        for (const user of pendingApplications) {
            user.isAuthor = true;
            user.role = 'author';
            user.authorApplication.status = 'approved';
            user.authorApplication.reviewedAt = new Date();
            user.authorApplication.rejectionReason = 'Automatically approved after 8 hours';
            
            await user.save();
            console.log(`Auto-approved author application for user: ${user.username}`);
        }

        if (pendingApplications.length > 0) {
            console.log(`Auto-approved ${pendingApplications.length} author applications`);
        }
    } catch (error) {
        console.error('Error in auto-approving author applications:', error);
    }
};


// Schedule the job to run every hour
cron.schedule('0 * * * *', autoApproveAuthorApplications);
console.log('✅ Author auto-approval scheduler initialized');


// Start server function
const startServer = async () => {
    try {
        await connectDB();
        await loadRoutes();

        // Health check endpoint
        app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                message: 'Development server is running!',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                mongodb: 'Atlas Cluster'
            });
        });


        // Debug endpoints
        app.get('/api/debug/database', (req, res) => {
            res.json({
                databaseName: mongoose.connection.db?.databaseName,
                readyState: mongoose.connection.readyState,
                connection: {
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    name: mongoose.connection.name
                }
            });
        });


        // Test endpoint to verify server is working
        app.get('/api/test', (req, res) => {
            res.json({
                success: true,
                message: 'API is working!',
                server: 'VelvetQuill Development Server',
                version: '1.0.0',
                features: ['Authentication', 'User Management', 'Stories', 'Comments']
            });
        });


        // Handle 404 for API routes
        app.get('/{*splat}', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint not found',
                requestedUrl: req.originalUrl,
                availableEndpoints: [
                    '/api/health',
                    '/api/test',
                    '/api/debug/database',
                    '/api/admin/*',
                    '/api/auth/*',
                    '/api/users/*',
                    '/api/stories/*',
                    '/api/comments/*',
                    '/api/categories/*',
                    '/api/contests/*'
                ]
            });
        });


        // Serve frontend for all other routes (SPA fallback)
        app.get('/{*splat}', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/index.html'));
        });

        // Global error handling middleware
        app.use((err, req, res, next) => {
            console.error('🚨 Server Error:', err.message);

            res.status(500).json({
                success: false,
                message: 'Development server error',
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        });

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n' + '='.repeat(60));
            console.log('🚀 VELVETQUILL DEVELOPMENT SERVER');
            console.log('='.repeat(60));
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌍 Environment: DEVELOPMENT`);
            console.log(`🗄️  Database: MongoDB Atlas`);
            console.log(`🔗 Local API: http://localhost:${PORT}/api`);
            console.log(`🔗 Network API: http://YOUR_IP:${PORT}/api`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
            console.log('='.repeat(60));
            console.log('💡 Development Tips:');
            console.log('   • Use Postman to test API endpoints');
            console.log('   • Check MongoDB Atlas for database connection');
            console.log('   • Frontend should connect to this server');
            console.log('   • CORS is enabled for all origins');
            console.log('='.repeat(60) + '\n');
        });
    } catch (error) {
        console.error('FAILED TO START SERVER:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔻 Shutting down development server...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});


startServer();















