
// backend/routes/users.js - UPDATED
import express from 'express';
import userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validateAuthorApplication, validateProfileUpdate } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/profile/:username', userController.getUserProfile);

// ADD: Public follow list routes (fixed parameter name)
router.get('/:userId/followers', userController.getFollowList);
router.get('/:userId/following', userController.getFollowList);

// Protected routes
router.use(authenticate);

router.get('/me/profile', userController.getCurrentUser);
router.put('/profile', validateProfileUpdate, userController.updateProfile);
router.put('/avatar', userController.updateAvatar); 
router.post('/apply-author', validateAuthorApplication, userController.applyForAuthor);
router.get('/stories/me', userController.getUserStories);
router.get('/reading-list/me', userController.getReadingList);
router.get('/comments/me', userController.getUserComments);
router.get('/stats/me', userController.getUserStats);
router.get('/author-stats/me', userController.getAuthorStats);

// ADD: Social features routes
router.post('/:userId/follow', userController.toggleFollow);
router.get('/:userId/follow-status', userController.getFollowStatus); 
router.get('/:userId/mutual-followers', userController.getMutualFollowers); 


// route for getting author stories
router.get('/:username/stories', userController.getAuthorStories);

// UPDATE the existing follow status route to be more specific
router.get('/:userId/follow-status', userController.getFollowStatus);

router.get('/comments/recent', userController.getAuthorRecentComments);
router.get('/followers/stats', userController.getAuthorFollowersStats);




export default router;

