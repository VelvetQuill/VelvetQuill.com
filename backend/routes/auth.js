
// backend/routes/auth.js
import express from 'express';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateSignup, validateSignin } from '../middleware/validation.js';

const router = express.Router();

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', validateSignup, authController.signUp);

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
router.post('/signin', validateSignin, authController.signIn);

// @desc    Verify user token & get user data
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', authenticate, authController.verifyToken);

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, authController.logout);


export default router;


