// backend/server.js - Production Version
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Production CORS configuration
const allowedOrigins = [
  'https://your-netlify-app.netlify.app', // Replace with your actual Netlify URL
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? allowedOrigins 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// MongoDB connection with production optimizations
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 50000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false,
      dbName: "velvetquill-db"
    });
    console.log('✅ MongoDB connected successfully');
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

    // API Routes
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
    const User = (await import('./models/User.js')).default;
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

// Schedule the job to run every hour (only in production)
if (process.env.NODE_ENV === 'production') {
  cron.schedule('0 * * * *', autoApproveAuthorApplications);
  console.log('✅ Author auto-approval scheduler initialized');
}

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
        version: '1.0.0'
      });
    });

    // Test endpoint
    app.get('/api/test', (req, res) => {
      res.json({
        success: true,
        message: 'API is working!',
        server: 'VelvetQuill Production Server',
        environment: process.env.NODE_ENV
      });
    });

    // Handle 404 for API routes
    app.use('/{*splat}', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        requestedUrl: req.originalUrl
      });
    });

    // Global error handling middleware
    app.use((err, req, res, next) => {
      console.error('🚨 Server Error:', err);

      // Don't leak error details in production
      const errorResponse = {
        success: false,
        message: 'Something went wrong!'
      };

      if (process.env.NODE_ENV === 'development') {
        errorResponse.error = err.message;
        errorResponse.stack = err.stack;
      }

      res.status(err.status || 500).json(errorResponse);
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 VELVETQUILL PRODUCTION SERVER');
      console.log('='.repeat(60));
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`🗄️  Database: MongoDB Atlas`);
      console.log(`❤️  Health Check: /api/health`);
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('FAILED TO START SERVER:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔻 Shutting down server gracefully...');
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




