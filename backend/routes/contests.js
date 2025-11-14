// backend/routes/contests.js
import express from 'express';
import contestController from '../controllers/contestController.js';
import { authenticate, requireAdmin, requireAuthor } from '../middleware/auth.js';
import { validateContest, validateContestSubmission } from '../middleware/validation.js';

const router = express.Router();

// Public routes
// @desc    Get all contests
// @route   GET /api/contests
// @access  Public
router.get('/', contestController.getContests);

// @desc    Get contest by ID
// @route   GET /api/contests/:id
// @access  Public
router.get('/:id', contestController.getContest);

// @desc    Get contest participants
// @route   GET /api/contests/:id/participants
// @access  Public
router.get('/:id/participants', contestController.getContestParticipants);

// @desc    Get contest submissions
// @route   GET /api/contests/:id/submissions
// @access  Public
router.get('/:id/submissions', contestController.getContestSubmissions);

// @desc    Get contest leaderboard
// @route   GET /api/contests/:id/leaderboard
// @access  Public
router.get('/:id/leaderboard', contestController.getContestLeaderboard);

// Protected routes
router.use(authenticate);

// @desc    Join a contest
// @route   POST /api/contests/:id/join
// @access  Private (Authors only)
router.post('/:id/join', requireAuthor, contestController.joinContest);

// @desc    Leave a contest
// @route   POST /api/contests/:id/leave
// @access  Private
router.post('/:id/leave', contestController.leaveContest);

// @desc    Submit story to contest
// @route   POST /api/contests/:id/submit
// @access  Private (Authors only)
router.post('/:id/submit', requireAuthor, validateContestSubmission, contestController.submitToContest);

// @desc    Remove submission from contest
// @route   DELETE /api/contests/:id/submit/:storyId
// @access  Private
router.delete('/:id/submit/:storyId', contestController.removeSubmission);

// Admin routes
router.use(requireAdmin);

// @desc    Create new contest
// @route   POST /api/contests
// @access  Private (Admin only)
router.post('/', validateContest, contestController.createContest);

// @desc    Update contest
// @route   PUT /api/contests/:id
// @access  Private (Admin only)
router.put('/:id', validateContest, contestController.updateContest);

// @desc    Delete contest
// @route   DELETE /api/contests/:id
// @access  Private (Admin only)
router.delete('/:id', contestController.deleteContest);

// @desc    Declare contest winners
// @route   POST /api/contests/:id/winners
// @access  Private (Admin only)
router.post('/:id/winners', contestController.declareWinners);


export default router;
