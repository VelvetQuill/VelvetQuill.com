// backend/routes/admin.js
import express from 'express';
import adminController from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateAnnouncement } from '../middleware/validation.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate, requireAdmin);

// Dashboard
// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/dashboard-stats', adminController.getDashboardStats);

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
router.get('/analytics', adminController.getPlatformAnalytics);

// User Management
// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', adminController.getUsers);

// @desc    Get user by ID
// @route   GET /api/admin/users/:userId
// @access  Private (Admin only)
router.get('/users/:userId', adminController.getUser);

// @desc    Update user
// @route   PUT /api/admin/users/:userId
// @access  Private (Admin only)
router.put('/users/:userId', adminController.updateUser);

// @desc    Suspend user
// @route   POST /api/admin/users/:userId/suspend
// @access  Private (Admin only)
router.post('/users/:userId/suspend', adminController.suspendUser);

// @desc    Activate user
// @route   POST /api/admin/users/:userId/activate
// @access  Private (Admin only)
router.post('/users/:userId/activate', adminController.activateUser);

// Author Management
// @desc    Get author applications
// @route   GET /api/admin/authors
// @access  Private (Admin only)
router.get('/authors', adminController.getAuthors);

// @desc    Approve author application
// @route   POST /api/admin/authors/:userId/approve
// @access  Private (Admin only)
router.post('/authors/:userId/approve', adminController.approveAuthor);

// @desc    Reject author application
// @route   POST /api/admin/authors/:userId/reject
// @access  Private (Admin only)
router.post('/authors/:userId/reject', adminController.rejectAuthor);

// Content Moderation
// @desc    Get pending stories for moderation
// @route   GET /api/admin/stories/pending
// @access  Private (Admin only)
router.get('/stories/pending', adminController.getPendingStories);
 
// @desc    Approve story
// @route   POST /api/admin/stories/:storyId/approve
// @access  Private (Admin only)
router.post('/stories/:storyId/approve', adminController.approveStory);

// @desc    Reject story
// @route   POST /api/admin/stories/:storyId/reject
// @access  Private (Admin only)
router.post('/stories/:storyId/reject', adminController.rejectStory);

// @desc    Get flagged comments
// @route   GET /api/admin/comments/flagged
// @access  Private (Admin only)
router.get('/comments/flagged', adminController.getFlaggedComments);

// @desc    Moderate comment
// @route   POST /api/admin/comments/:commentId/moderate
// @access  Private (Admin only)
router.post('/comments/:commentId/moderate', adminController.moderateComment);

// Announcements
// @desc    Create platform announcement
// @route   POST /api/admin/announcements
// @access  Private (Admin only)
router.post('/announcements', validateAnnouncement, adminController.createAnnouncement);

// @desc    Get all announcements
// @route   GET /api/admin/announcements
// @access  Private (Admin only)
router.get('/announcements', adminController.getAnnouncements);

// @desc    Update announcement
// @route   PUT /api/admin/announcements/:id
// @access  Private (Admin only)
router.put('/announcements/:id', validateAnnouncement, adminController.updateAnnouncement);

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private (Admin only)
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// ADD: Contest Management routes
// @desc    Get all contests (admin view)
// @route   GET /api/admin/contests
// @access  Private (Admin only)
router.get('/contests', adminController.getContests);

// @desc    Update contest status
// @route   PUT /api/admin/contests/:contestId/status
// @access  Private (Admin only)
router.put('/contests/:contestId/status', adminController.updateContestStatus);

// @desc    Get contest analytics
// @route   GET /api/admin/contests/:contestId/analytics
// @access  Private (Admin only)
router.get('/contests/:contestId/analytics', adminController.getContestAnalytics);


// ==================== BADGE MANAGEMENT ====================

// @desc    Get all badges
// @route   GET /api/admin/badges
// @access  Private (Admin only)
router.get('/badges', adminController.getBadges);

// @desc    Create new badge
// @route   POST /api/admin/badges
// @access  Private (Admin only)
router.post('/badges', adminController.createBadge);

// @desc    Update badge
// @route   PUT /api/admin/badges/:id
// @access  Private (Admin only)
router.put('/badges/:id', adminController.updateBadge);

// @desc    Delete badge
// @route   DELETE /api/admin/badges/:id
// @access  Private (Admin only)
router.delete('/badges/:id', adminController.deleteBadge);





export default router;

