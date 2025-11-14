
// backend/routes/users.js - UPDATED
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Story from '../models/Story.js';
import userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validateAuthorApplication, validateProfileUpdate } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/profile/:username', userController.getUserProfile);

// ADD: Public follow list routes (fixed parameter name)
router.get('/:userId/followers', userController.getFollowList);
router.get('/:userId/following', userController.getFollowList);



/**
 * @route GET /api/users/profile/public/:identifier
 * @desc Get public user profile (no auth required)
 * @access Public
 */
router.get('/profile/public/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Find user by username or ID
        let user;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            user = await User.findById(identifier)
                .select('username displayName profile isAuthor stats createdAt followers following')
                .lean();
        } else {
            user = await User.findOne({ username: identifier })
                .select('username displayName profile isAuthor stats createdAt followers following')
                .lean();
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's published stories count
        const publishedStoriesCount = await Story.countDocuments({ 
            author: user._id, 
            status: 'published' 
        });

        // Calculate total views and likes from published stories
        const storyStats = await Story.aggregate([
            { $match: { author: user._id, status: 'published' } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$stats.views' },
                    totalLikes: { $sum: '$stats.likesCount' },
                    avgRating: { $avg: '$stats.averageRating' }
                }
            }
        ]);

        const stats = storyStats.length > 0 ? storyStats[0] : {
            totalViews: 0,
            totalLikes: 0,
            avgRating: 0
        };

        // Only return public information
        const publicProfile = {
            success: true,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                profile: {
                    bio: user.profile?.bio || '',
                    avatar: user.profile?.avatar || null,
                    avatarType: user.profile?.avatarType || null
                },
                isAuthor: user.isAuthor,
                stats: {
                    storiesCount: publishedStoriesCount,
                    followersCount: user.followers?.length || 0,
                    followingCount: user.following?.length || 0,
                    totalViews: stats.totalViews,
                    totalLikes: stats.totalLikes,
                    avgRating: stats.avgRating ? Number(stats.avgRating.toFixed(1)) : 0
                },
                createdAt: user.createdAt
            }
        };
        console.log(`PUBLIC PROFILE SENT FOR: ${user.username}`);
        res.json(publicProfile);
    } catch (error) {
        console.error('Public profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error loading profile'
        });
    }
});


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

