
// adminController.js
import User from '../models/User.js';
import Story from '../models/Story.js';
import Comment from '../models/Comment.js';
import Contest from '../models/Contest.js';
import Category from '../models/Category.js';


const adminController = {
    // Dashboard Stats
    async getDashboardStats(req, res) {
        try {
            const [
                totalStories,
                totalUsers,
                totalAuthors,
                pendingStories,
                pendingAuthors,
                recentStories,
                recentUsers
            ] = await Promise.all([
                Story.countDocuments(),
                User.countDocuments(),
                User.countDocuments({ isAuthor: true }),
                Story.countDocuments({ status: 'pending' }),
                User.countDocuments({ 'authorApplication.status': 'pending' }),
                Story.find({ status: 'published' })
                    .populate('author', 'username displayName')
                    .sort({ createdAt: -1 })
                    .limit(5),
                User.find().sort({ createdAt: -1 }).limit(5)
            ]);

            res.json({
                success: true,
                stats: {
                    totalStories,
                    totalUsers,
                    totalAuthors,
                    pendingStories,
                    pendingAuthors
                },
                recentStories,
                recentUsers
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats'
            });
        }
    },

    // In adminController.js - UPDATE analytics to handle multi-page stories
async getPlatformAnalytics(req, res) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            newUsers,
            newStories,
            activeUsers,
            topStories,
            // ADD: Total pages and reading stats
            totalPagesPublished,
            totalWordsPublished
        ] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Story.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),
            Story.find({ status: 'published' })
                .populate('author', 'username displayName')
                .sort({ 'stats.engagement': -1 })
                .limit(10),
            // ADD: New analytics for pages
            Story.aggregate([
                { $match: { status: 'published', createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: null, totalPages: { $sum: '$metadata.pageCount' } } }
            ]),
            Story.aggregate([
                { $match: { status: 'published', createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: null, totalWords: { $sum: '$metadata.totalWordCount' } } }
            ])
        ]);

        res.json({
            success: true,
            analytics: {
                period: 'last_30_days',
                newUsers,
                newStories,
                activeUsers,
                totalPages: totalPagesPublished[0]?.totalPages || 0,
                totalWords: totalWordsPublished[0]?.totalWords || 0
            },
            topStories
        });
    }catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch platform analytics'
            });
        }
    },

    // User Management
    async getUsers(req, res) {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const skip = (page - 1) * limit;

            let query = {};
            if (search) {
                query = {
                    $or: [
                        { username: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { displayName: { $regex: search, $options: 'i' } }
                    ]
                };
            }

            const [users, total] = await Promise.all([
                User.find(query)
                    .select('-password')
                    .sort({ createdAt: -1 })
                    .limit(parseInt(limit))
                    .skip(skip),
                User.countDocuments(query)
            ]);

            res.json({
                success: true,
                users,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users'
            });
        }
    },

    async getUser(req, res) {
        try {
            const user = await User.findById(req.params.userId).select('-password');
            
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
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user'
            });
        }
    },

    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const updateData = req.body;

            // Remove sensitive fields
            delete updateData.password;
            delete updateData.email; // Email should be updated separately with verification

            const user = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User updated successfully',
                user
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update user'
            });
        }
    },

    async suspendUser(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;

            const user = await User.findByIdAndUpdate(
                userId,
                { 
                    status: 'suspended',
                    suspensionReason: reason,
                    suspendedAt: new Date()
                },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User suspended successfully',
                user
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to suspend user'
            });
        }
    },

    async activateUser(req, res) {
        try {
            const { userId } = req.params;

            const user = await User.findByIdAndUpdate(
                userId,
                { 
                    status: 'active',
                    suspensionReason: undefined,
                    suspendedAt: undefined
                },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User activated successfully',
                user
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to activate user'
            });
        }
    },

    // Author Management
    async getAuthors(req, res) {
        try {
            const { status, page = 1, limit = 10} = req.query;
            const skip = (page - 1) * limit;

            let query = { 'authorApplication.status': { $exists: true } };
            if (status) {
                query['authorApplication.status'] = status;
            }

            const [authors, total] = await Promise.all([
                User.find(query)
                    .select('-password')
                    .sort({ 'authorApplication.appliedAt': -1 })
                    .limit(parseInt(limit))
                    .skip(skip),
                User.countDocuments(query)
            ]);

            res.json({
                success: true,
                authors,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch authors'
            });
        }
    },

    async approveAuthor(req, res) {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            user.isAuthor = true;
            user.role = 'author';
            user.authorApplication.status = 'approved';
            user.authorApplication.reviewedAt = new Date();

            await user.save();

            res.json({
                success: true,
                message: 'Author application approved successfully'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to approve author'
            });
        }
    },

    async rejectAuthor(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            user.authorApplication.status = 'rejected';
            user.authorApplication.rejectionReason = reason;
            user.authorApplication.reviewedAt = new Date();

            await user.save();

            res.json({
                success: true,
                message: 'Author application rejected successfully'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to reject author'
            });
        }
    },

    // Content Moderation
    async getPendingStories(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;

            const stories = await Story.find({ status: 'pending' })
                .populate('author', 'username displayName')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Story.countDocuments({ status: 'pending' });

            res.json({
                success: true,
                stories,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending stories'
            });
        }
    },

    async approveStory(req, res) {
        try {
            const { storyId } = req.params;

            const story = await Story.findById(storyId);
            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            story.status = 'published';
            await story.save();

            res.json({
                success: true,
                message: 'Story approved and published successfully'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to approve story'
            });
        }
    },

    async rejectStory(req, res) {
        try {
            const { storyId } = req.params;
            const { reason } = req.body;

            const story = await Story.findById(storyId);
            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            story.status = 'rejected';
            story.rejectionReason = reason;
            await story.save();

            res.json({
                success: true,
                message: 'Story rejected successfully'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to reject story'
            });
        }
    },

    async getFlaggedComments(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;

            const comments = await Comment.find({ status: 'flagged' })
                .populate('author', 'username displayName')
                .populate('story', 'title')
                .sort({ 'engagement.reportCount': -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Comment.countDocuments({ status: 'flagged' });

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
            res.status(500).json({
                success: false,
                message: 'Failed to fetch flagged comments'
            });
        }
    },

    async moderateComment(req, res) {
        try {
            const { commentId } = req.params;
            const { action, reason } = req.body;

            const comment = await Comment.findById(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            switch (action) {
                case 'approve':
                    comment.status = 'active';
                    comment.moderation.flaggedBy = [];
                    comment.engagement.reportCount = 0;
                    break;
                case 'delete':
                    comment.status = 'deleted';
                    break;
                case 'hide':
                    comment.status = 'hidden';
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid moderation action'
                    });
            }

            comment.moderation.moderatedBy = req.userId;
            comment.moderation.moderationReason = reason;
            comment.moderation.moderatedAt = new Date();

            await comment.save();

            res.json({
                success: true,
                message: `Comment ${action}d successfully`
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to moderate comment'
            });
        }
    },

    // Announcements
    async createAnnouncement(req, res) {
        try {
            const announcementData = {
                ...req.body,
                createdBy: req.userId
            };

            // In a real app, you'd have an Announcement model
            // For now, we'll return a success response
            res.status(201).json({
                success: true,
                message: 'Announcement created successfully',
                announcement: announcementData
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create announcement'
            });
        }
    },

    async getAnnouncements(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;

            // In a real app, you'd fetch from Announcement model
            // For now, return empty array
            res.json({
                success: true,
                announcements: [],
                pagination: {
                    current: parseInt(page),
                    pages: 0,
                    total: 0
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch announcements'
            });
        }
    },

    async updateAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // In a real app, you'd update in Announcement model
            res.json({
                success: true,
                message: 'Announcement updated successfully',
                announcement: { id, ...updateData }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update announcement'
            });
        }
    },

    async deleteAnnouncement(req, res) {
        try {
            const { id } = req.params;

            // In a real app, you'd delete from Announcement model
            res.json({
                success: true,
                message: 'Announcement deleted successfully'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete announcement'
            });
        }
    },

    // Contest Management (additional function)
    
    async getContests(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const skip = (page - 1) * limit;

            let filter = {};
            if (status) {
                filter.status = status;
            }

            const [contests, total] = await Promise.all([
                Contest.find(filter)
                    .populate('createdBy', 'username displayName profile.avatar')
                    .populate('participants.user', 'username displayName')
                    .sort({ createdAt: -1 })
                    .limit(parseInt(limit))
                    .skip(skip),
                Contest.countDocuments(filter)
            ]);

            res.json({
                success: true,
                contests,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            console.error('Admin get contests error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contests'
            });
        }
    },

    async updateContestStatus(req, res) {
        try {
            const { contestId } = req.params;
            const { status } = req.body;

            const validStatuses = ['draft', 'upcoming', 'active', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid contest status'
                });
            }

            const contest = await Contest.findByIdAndUpdate(
                contestId,
                { status },
                { new: true, runValidators: true }
            );

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            res.json({
                success: true,
                message: `Contest status updated to ${status}`,
                contest
            });

        } catch (error) {
            console.error('Update contest status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update contest status'
            });
        }
    },

    async getContestAnalytics(req, res) {
        try {
            const { contestId } = req.params;

            const contest = await Contest.findById(contestId)
                .populate('participants.user', 'username displayName profile.avatar')
                .populate('participants.submissions', 'title stats metadata');

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Calculate analytics
            const analytics = {
                totalParticipants: contest.participants.length,
                totalSubmissions: contest.participants.reduce((sum, participant) => 
                    sum + (participant.submissions?.length || 0), 0),
                totalViews: contest.participants.reduce((sum, participant) => 
                    sum + (participant.submissions?.reduce((storySum, story) => 
                        storySum + (story.stats?.views || 0), 0) || 0), 0),
                averageRating: 0,
                engagementScore: 0
            };

            // Calculate average rating
            let totalRating = 0;
            let ratingCount = 0;
            
            contest.participants.forEach(participant => {
                if (participant.submissions) {
                    participant.submissions.forEach(story => {
                        if (story.stats?.averageRating > 0) {
                            totalRating += story.stats.averageRating;
                            ratingCount++;
                        }
                    });
                }
            });

            analytics.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
            analytics.engagementScore = contest.participants.reduce((sum, participant) => 
                sum + (participant.submissions?.reduce((storySum, story) => 
                    storySum + (story.stats?.engagement || 0), 0) || 0), 0);

            res.json({
                success: true,
                analytics,
                contest: {
                    name: contest.name,
                    theme: contest.theme,
                    status: contest.status,
                    timeline: contest.timeline
                }
            });

        } catch (error) {
            console.error('Get contest analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contest analytics'
            });
        }
    },

    // ==================== BADGE MANAGEMENT ====================

    // @desc    Get all badges
    // @route   GET /api/admin/badges
    // @access  Private/Admin
    async getBadges(req, res) {
        try {
            // Temporary implementation - return empty array for now
            // Later you can connect to actual Badge model
            res.json({
                success: true,
                data: [],
                message: 'Badges retrieved successfully'
            });
        } catch (error) {
            console.error('Get badges error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching badges'
            });
        }
    },

    // @desc    Create new badge
    // @route   POST /api/admin/badges
    // @access  Private/Admin
    async createBadge(req, res) {
        try {
            const { name, description, type, color, criteria } = req.body;

            // Basic validation
            if (!name || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and description are required'
                });
            }

            // Temporary - just return success
            // Later you'll save to Badge model
            res.json({
                success: true,
                message: 'Badge created successfully',
                data: {
                    _id: 'temp_' + Date.now(),
                    name,
                    description,
                    type,
                    color,
                    criteria,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error('Create badge error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating badge'
            });
        }
    },

    // @desc    Update badge
    // @route   PUT /api/admin/badges/:id
    // @access  Private/Admin
    async updateBadge(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            res.json({
                success: true,
                message: 'Badge updated successfully',
                data: {
                    _id: id,
                    ...updateData,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error('Update badge error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating badge'
            });
        }
    },

    // @desc    Delete badge
    // @route   DELETE /api/admin/badges/:id
    // @access  Private/Admin
    async deleteBadge(req, res) {
        try {
            const { id } = req.params;

            res.json({
                success: true,
                message: 'Badge deleted successfully'
            });
        } catch (error) {
            console.error('Delete badge error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting badge'
            });
        }
    }

    

};


export default adminController;




    
    
    
