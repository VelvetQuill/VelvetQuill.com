// userController.js
import User from '../models/User.js';
import Story from '../models/Story.js';
import Comment from '../models/Comment.js';

const userController = {
    // @desc    Get user profile
    // @route   GET /api/users/profile/:username
    // @access  Public
    async getUserProfile(req, res) {
        try {
            const user = await User.findOne({ username: req.params.username })
                .select('-password -email');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get user's published stories
            const stories = await Story.find({ 
                author: user._id, 
                status: 'published' 
            })
            .select('title excerpt coverImage category stats createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

            res.json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    displayName: user.displayName,
                    profile: user.profile,
                    isAuthor: user.isAuthor,
                    role: user.role,
                    stats: user.stats,
                    joinedAt: user.createdAt
                },
                stories
            });

        } catch (error) {
            console.error('Get user profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user profile'
            });
        }
    },

    // @desc    Get current user profile
    // @route   GET /api/users/me
    // @access  Private
    async getCurrentUser(req, res) {
        try {
            const user = await User.findById(req.userId).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user
            });

        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user data'
            });
        }
    },

    // @desc    Update user profile
    // @route   PUT /api/users/profile
    // @access  Private
    async updateProfile(req, res) {
        try {
            const { displayName, bio, location, website, socialLinks, preferences } = req.body;

            const updateData = {};
            
            if (displayName) updateData.displayName = displayName;
            if (bio !== undefined) updateData['profile.bio'] = bio;
            if (location !== undefined) updateData['profile.location'] = location;
            if (website !== undefined) updateData['profile.website'] = website;
            if (socialLinks) updateData['profile.socialLinks'] = socialLinks;
            if (preferences) updateData.preferences = preferences;

            const user = await User.findByIdAndUpdate(
                req.userId,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            res.json({
                success: true,
                user,
                message: 'Profile updated successfully'
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    },
    
// UPDATE the getUserProfile method to include proper stats
async getUserProfile(req, res) {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password -email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's published stories count and stats
        const publishedStories = await Story.find({ 
            author: user._id, 
            status: 'published' 
        });
        
        const totalViews = publishedStories.reduce((sum, story) => sum + (story.stats?.views || 0), 0);
        const totalLikes = publishedStories.reduce((sum, story) => sum + (story.stats?.likesCount || 0), 0);
        const avgRating = publishedStories.length > 0 
            ? publishedStories.reduce((sum, story) => sum + (story.stats?.averageRating || 0), 0) / publishedStories.length 
            : 0;

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                profile: user.profile,
                isAuthor: user.isAuthor,
                role: user.role,
                stats: {
                    storiesCount: publishedStories.length,
                    followersCount: user.followers.length,
                    totalViews: totalViews,
                    totalLikes: totalLikes,
                    avgRating: avgRating
                },
                joinedAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile'
        });
    }
},

    // @desc    Update avatar
    // @route   PUT /api/users/avatar
    // @access  Private
    async updateAvatar(req, res) {
        try {
            const { avatar } = req.body;

            if (!avatar) {
                return res.status(400).json({
                    success: false,
                    message: 'Avatar URL is required'
                });
            }

            const user = await User.findByIdAndUpdate(
                req.userId,
                { 'profile.avatar': avatar },
                { new: true }
            ).select('-password');

            res.json({
                success: true,
                user,
                message: 'Avatar updated successfully'
            });

        } catch (error) {
            console.error('Update avatar error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update avatar'
            });
        }
    },

    // @desc    Apply for author
    // @route   POST /api/users/apply-author
    // @access  Private
    async applyForAuthor(req, res) {
        try {
            const { bio } = req.body;
            const userId = req.userId;

            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if already an author
            if (user.isAuthor) {
                return res.status(400).json({
                    success: false,
                    message: 'User is already an author'
                });
            }

            // Check if already applied
            if (user.authorApplication && user.authorApplication.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Author application is already pending review'
                });
            }

            if(bio){
                user.profile.bio = bio
            }

            // Submit application
            user.authorApplication = {
                bio,
                status: 'pending',
                appliedAt: new Date()
            };

            await user.save();

            res.json({
                success: true,
                message: 'Author application submitted successfully'
            });

        } catch (error) {
            console.error('Apply for author error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit author application'
            });
        }
    },

    // @desc    Get user stories
    // @route   GET /api/users/stories
    // @access  Private
    async getUserStories(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;

            const filter = { author: req.userId };
            if (status) {
                filter.status = status;
            }

            const stories = await Story.find(filter)
                .select('title excerpt coverImage category status stats createdAt')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Story.countDocuments(filter);

            res.json({
                success: true,
                stories,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            console.error('Get user stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user stories'
            });
        }
    },

    // @desc    Get user reading list
    // @route   GET /api/users/reading-list
    // @access  Private
    async getReadingList(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;

            const user = await User.findById(req.userId)
                .populate({
                    path: 'readingList.story',
                    select: 'title excerpt coverImage category author stats',
                    populate: {
                        path: 'author',
                        select: 'username displayName profile.avatar isAuthor'
                    }
                });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Paginate reading list
            const readingList = user.readingList
                .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                .slice((page - 1) * limit, page * limit);

            res.json({
                success: true,
                readingList,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(user.readingList.length / limit),
                    total: user.readingList.length
                }
            });

        } catch (error) {
            console.error('Get reading list error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch reading list'
            });
        }
    },

    // @desc    Get user comments
    // @route   GET /api/users/comments
    // @access  Private
    async getUserComments(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;

            const comments = await Comment.find({ author: req.userId, status: 'active' })
                .populate('story', 'title slug')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Comment.countDocuments({ author: req.userId, status: 'active' });

            res.json({
                success: true,
                comments,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            console.error('Get user comments error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user comments'
            });
        }
    },

    // @desc    Get user stats
    // @route   GET /api/users/stats
    // @access  Private
    async getUserStats(req, res) {
        try {
            const user = await User.findById(req.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get additional stats
            const [storiesCount, publishedStoriesCount, totalViews, totalLikes, totalComments] = await Promise.all([
                Story.countDocuments({ author: req.userId }),
                Story.countDocuments({ author: req.userId, status: 'published' }),
                Story.aggregate([
                    { $match: { author: req.userId } },
                    { $group: { _id: null, total: { $sum: '$stats.views' } } }
                ]),
                Story.aggregate([
                    { $match: { author: req.userId } },
                    { $group: { _id: null, total: { $sum: '$stats.likesCount' } } }
                ]),
                Comment.countDocuments({author: req.userId, status: 'active'})
            ]);

            res.json({
                success: true,
                stats: {
                    stories: storiesCount,
                    publishedStories: publishedStoriesCount,
                    totalViews: totalViews[0]?.total || 0,
                    totalLikes: totalLikes[0]?.total || 0,
                    comments: totalComments,
                    followers: user.stats.followersCount,
                    following: user.stats.followingCount,
                    joinedAt: user.createdAt
                }
            });

        } catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user stats'
            });
        }
    },

    // @desc    Follow/Unfollow user
    // @route   POST /api/users/:userId/follow
    // @access  Private
    async toggleFollow(req, res) {
        try {
        const { userId } = req.params; // ✅ This matches route: /api/users/:userId/follow
        const currentUserId = req.userId;

        if (userId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot follow yourself'
            });
        }
            
            const userToFollow = await User.findById(userId);
            const currentUser = await User.findById(currentUserId);

            if (!userToFollow || !currentUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const isFollowing = currentUser.following.includes(userId);

            if (isFollowing) {
                // Unfollow
                currentUser.following.pull(userId);
                userToFollow.followers.pull(currentUserId);
            } else {
                // Follow
                currentUser.following.push(userId);
                userToFollow.followers.push(currentUserId);
            }

            await Promise.all([currentUser.save(), userToFollow.save()]);

            res.json({
                success: true,
                message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
                isFollowing: !isFollowing
            });

        } catch (error) {
            console.error('Toggle follow error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update follow status'
            });
        }
    },

    // @desc    Get user followers/following
    // @route   GET /api/users/:userId/:type
    // @access  Public
    // In userController.js - UPDATE getFollowList method
async getFollowList(req, res) {
    try {
        const { userId, type } = req.params; // Now gets type from URL
        const { page = 1, limit = 20 } = req.query;

        // Validate type from URL parameter
        if (!['followers', 'following'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Must be "followers" or "following"'
            });
        }

        const user = await User.findById(userId)
            .select(`${type} username displayName`)
            .populate({
                path: type,
                select: 'username displayName profile.avatar isAuthor stats',
                options: {
                    limit: parseInt(limit),
                    skip: (parseInt(page) - 1) * parseInt(limit)
                }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const totalCount = type === 'followers' ? 
            user.followers.length : user.following.length;

        res.json({
            success: true,
            [type]: user[type],
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName
            },
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(totalCount / limit),
                total: totalCount
            }
        });

    } catch (error) {
        console.error('Get follow list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch follow list'
        });
    }
},
    
// @desc    Check follow status
// @route   GET /api/users/:userId/follow-status
// @access  Private
async getFollowStatus(req, res) {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        const currentUser = await User.findById(currentUserId);
        const isFollowing = currentUser.following.includes(userId);

        res.json({
            success: true,
            isFollowing,
            followersCount: (await User.findById(userId)).followers.length,
            followingCount: (await User.findById(userId)).following.length
        });
    } catch (error) {
        console.error('Get follow status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch follow status'
        });
    }
},

// @desc    Get mutual followers
// @route   GET /api/users/:userId/mutual-followers
// @access  Private  
async getMutualFollowers(req, res) {
    try {
        const { userId } = req.params;
        const currentUser = await User.findById(req.userId);
        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const mutualFollowers = currentUser.getMutualFollowers(userId);

        res.json({
            success: true,
            mutualFollowers,
            count: mutualFollowers.length
        });
    } catch (error) {
        console.error('Get mutual followers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch mutual followers'
        });
    }
},


// ADD this new method to get stories by author username
async getAuthorStories(req, res) {
    try {
        const { username } = req.params;
        const { page = 1, limit = 10, status = 'published' } = req.query;

        console.log(`Fetching stories for author: ${username}`);

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build filter
        const filter = { author: user._id };
        if (status) filter.status = status;

        const stories = await Story.find(filter)
            .select('title excerpt coverImage category status stats createdAt pages')
            .populate('author', 'username displayName profile.avatar isAuthor')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Story.countDocuments(filter);

        res.json({
            success: true,
            stories,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        console.error('Get author stories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch author stories'
        });
    }
},


    // ADD these methods
    async getAuthorStats(req, res) {
        try {
            const user = await User.findById(req.userId);
            if(!user){
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if(!user.isAuthor){
                return res.status(403).json({
                    success: false,
                    message: 'User is not an author'
                });
            }

                        
            const [storiesCount, publishedStoriesCount, totalViews, totalLikes, totalComments] = await Promise.all([
                Story.countDocuments({ author: req.userId }),
                Story.countDocuments({ author: req.userId, status: 'published' }),
                Story.aggregate([
                            { $match: { author: req.userId } },
                            { $group: { _id: null, total: { $sum: '$stats.views' } } }
                            ]),
                Story.aggregate([
                      { $match: { author: req.userId } },
                        { $group: { _id: null, total: { $sum: '$stats.likesCount' } } }
                            ]),
                            Comment.countDocuments({author: req.userId, status: 'active'})
                            ]);

                            
            user.stats.commentsCount = totalComments;
            
            res.json({
                success: true,
                stats: {
                    stories: storiesCount,
                    publishedStories: publishedStoriesCount,
                    totalViews: totalViews[0]?.total || 0,
                    totalLikes: totalLikes[0]?.total || 0,
                    comments: totalComments,
                    followers: user.stats.followersCount,
                    following: user.stats.followingCount,
                    joinedAt: user.createdAt
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch author stats' });
        }
    },

    
// @desc    Get author recent comments
// @route   GET /api/users/comments/recent
// @access  Private
async getAuthorRecentComments(req, res) {
    try {
        const { limit = 10 } = req.query;
        
        const user = await User.findById(req.userId);
        if (!user || !user.isAuthor) {
            return res.status(403).json({
                success: false,
                message: 'User is not an author'
            });
        }

        // Get author's story IDs
        const authorStories = await Story.find({ author: req.userId }).select('_id');
        const storyIds = authorStories.map(story => story._id);

        const comments = await Comment.find({ 
            story: { $in: storyIds },
            status: 'active'
        })
        .populate('author', 'username displayName profile.avatar')
        .populate('story', 'title slug')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

        res.json({
            success: true,
            comments,
            total: comments.length
        });

    } catch (error) {
        console.error('Get author recent comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent comments'
        });
    }
},

// @desc    Get author followers stats
// @route   GET /api/users/followers/stats
// @access  Private
async getAuthorFollowersStats(req, res) {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.isAuthor) {
            return res.status(403).json({
                success: false,
                message: 'User is not an author'
            });
        }

        // Get basic follower statistics using existing fields
        const totalFollowers = user.followers.length;
        
        // Get followers growth (last 30 days) - simplified version
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Since we don't have follower join dates, we'll return basic stats
        res.json({
            success: true,
            stats: {
                totalFollowers,
                followingCount: user.following.length,
                // Since we don't have follower timestamps, we can't calculate recent growth
                // without modifying the User model
            }
        });

    } catch (error) {
        console.error('Get author followers stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch followers stats'
        });
    }
},

async getAuthorEngagementStats(req, res) {
        try {
            // Return last 6 months of engagement data
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const stories = await Story.find({
                author: req.userId,
                createdAt: { $gte: sixMonthsAgo }
            });

            // Generate monthly engagement data (simplified)
            const engagementData = await this.generateEngagementData(req.userId, sixMonthsAgo);

            res.json({ success: true, ...engagementData });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch engagement stats' });
        }
    }




    
};

export default userController;




