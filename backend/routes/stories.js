// backend/routes/stories.js - UPDATED
import express from 'express';
import storyController from '../controllers/storyController.js';
import { authenticate, requireAuthor } from '../middleware/auth.js';
import { validateStory, validateRating, validatePage } from '../middleware/validation.js'; // ADD validatePage

const router = express.Router();

// Public routes 
router.get('/', storyController.getStories);
router.get('/search',storyController.getStoriesBySearch);
router.get('/featured', storyController.getFeaturedStories);
router.get('/trending', storyController.getTrendingStories);
router.get('/search', storyController.searchStories);
router.get('/:id', storyController.getStory);

// ADD: Public page reading route
router.get('/:id/pages/:pageNumber', storyController.getStoryPage);

// Protected routes
router.use(authenticate);

router.post('/', validateStory, storyController.createStory);
router.put('/:id', validateStory, storyController.updateStory);
router.delete('/:id', storyController.deleteStory);
router.post('/:id/like', storyController.likeStory);
router.post('/:id/reading-list', storyController.addToReadingList);
router.post('/:id/rate', validateRating, storyController.rateStory);
router.get('/:id/analytics', storyController.getStoryAnalytics);
router.get('/:id/user-interactions', storyController.getUserInteractions);
router.get('/bulk/interactions', storyController.getBulkUserInteractions);

// ADD: Page management routes (author only)
router.post('/:id/pages', requireAuthor, validatePage, storyController.addPage);
router.put('/:id/pages/:pageNumber', requireAuthor, validatePage, storyController.updatePage);
router.delete('/:id/pages/:pageNumber', requireAuthor, storyController.deletePage);

// ADD: Reading progress routes
router.post('/:id/reading-progress', storyController.updateReadingProgress);
router.get('/:id/reading-progress', storyController.getReadingProgress);

export default router;