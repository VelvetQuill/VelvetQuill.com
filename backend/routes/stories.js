// backend/routes/stories.js - UPDATED
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Story from '../models/Story.js';
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

// routes/stories.js - Add public stories route

/**
 * @route GET /api/stories/public/author/:identifier
 * @desc Get published stories by author (no auth required)
 * @access Public
 */
router.get('/public/author/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const { 
            page = 1, 
            limit = 6, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        const mongoose = await import('mongoose');
        
        // Find user to get their ID
        let user;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            user = await User.findById(identifier);
        } else {
            user = await User.findOne({ username: identifier });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Author not found'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query for published stories by this author
        const query = { 
            author: user._id, 
            status: 'published' 
        };

        // Build sort object
        const sort = {};
        if (sortBy === 'popular') {
            sort['stats.engagement'] = -1;
        } else if (sortBy === 'rating') {
            sort['stats.averageRating'] = -1;
        } else {
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        // Get stories with pagination
        const stories = await Story.find(query)
            .select('title excerpt category coverImage stats createdAt tags pages')
            .populate('author', 'username displayName profile.avatar')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const totalStories = await Story.countDocuments(query);

        // Transform stories for public view
        const publicStories = stories.map(story => ({
            _id: story._id,
            title: story.title,
            excerpt: story.excerpt,
            category: story.category,
            coverImage: story.coverImage,
            tags: story.tags || [],
            stats: {
                views: story.stats?.views || 0,
                likesCount: story.stats?.likesCount || 0,
                averageRating: story.stats?.averageRating || 0,
                commentCount: story.stats?.commentCount || 0,
                readingTime: story.metadata?.totalReadingTime || 0
            },
            createdAt: story.createdAt,
            author: {
                username: story.author?.username,
                displayName: story.author?.displayName,
                avatar: story.author?.profile?.avatar
            }
        }));

        res.json({
            success: true,
            stories: publicStories,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalStories / limitNum),
                totalStories,
                hasNext: pageNum < Math.ceil(totalStories / limitNum),
                hasPrev: pageNum > 1
            },
            author: {
                id: user._id,
                username: user.username,
                displayName: user.displayName
            }
        });

    } catch (error) {
        console.error('Public stories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error loading stories'
        });
    }
});


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