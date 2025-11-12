
// backend/server.js - PRODUCTION Version for Render
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Import User model - use dynamic import to avoid loading issues
let User;
import('./models/User.js').then(module => {
  User = module.default;
}).catch(err => {
  console.warn('User model import warning (may be normal during startup):', err.message);
});

dotenv.config();

// DNS configuration for production
dns.setServers(['1.1.1.1', '8.8.8.8']);

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: [
    'https://velvetquillstories.netlify.app',
    'https://velvetquill-backend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With','Accept','Origin']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware for production
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// MongoDB Atlas connection with production settings
const MONGODB_URI = process.env.MONGODB_URI;

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Required environment variable ${envVar} is missing`);
    process.exit(1);
  }
});

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
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

    app.use('/api/admin', adminRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/stories', storiesRoutes);
    app.use('/api/contests', contestsRoutes);
    app.use('/api/categories', categoriesRoutes);
    app.use('/api/comments', commentsRoutes);
    app.use('/api/upload', uploadRoutes);

    console.log('✅ All API routes loaded successfully');
  } catch (error) {
    console.error('❌ Route loading error:', error);
    throw error;
  }
};

// Auto-approve author applications after 8 hours
const autoApproveAuthorApplications = async () => {
  try {
    // Wait for User model to be available
    if (!User) {
      const userModule = await import('./models/User.js');
      User = userModule.default;
    }

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

    // Production health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: 'Production server is running!',
        timestamp: new Date().toISOString(),
        environment: 'production',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        version: '1.0.0',
        uptime: process.uptime()
      });
    });

    // API test endpoint
    app.get('/api/test', (req, res) => {
      res.json({
        success: true,
        message: 'Production API is working!',
        server: 'VelvetQuill Production Server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // Handle API 404
    app.get('/{*splat}', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        requestedUrl: req.originalUrl
      });
    });

    // Global error handling middleware
    app.use((err, req, res, next) => {
      console.error('🚨 Production Server Error:', err.message);

      // Don't leak error details in production
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    });

    const PORT = process.env.PORT || 10000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 VELVETQUILL PRODUCTION SERVER');
      console.log('='.repeat(60));
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: PRODUCTION`);
      console.log(`🗄️  Database: MongoDB Atlas`);
      console.log(`🔗 Health Check: /api/health`);
      console.log(`🔗 Test Endpoint: /api/test`);
      console.log('='.repeat(60));
      console.log('✅ Server ready to accept requests');
      console.log('='.repeat(60) + '\n');
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

process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();
