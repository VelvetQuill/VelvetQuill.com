// storyController.js - UPDATED VERSION
import Story from '../models/Story.js';
import User from '../models/User.js';
import Category from '../models/Category.js';

const storyController = {


   // @desc    Get stories by category
    // @route   GET /api/stories
    // @access  Public
    async getStories(req, res) {
        try {
            const { 
                page = 1, 
                limit = 20, 
                category, 
                status = 'published',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const filter = { status };
            
            // Filter by category string
            if (category) {
                filter.category = category;
            }
            
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            const stories = await Story.find(filter)
                .populate('author', 'username displayName profile.avatar isAuthor')
                .populate('collaborators.user', 'username displayName profile.avatar')
                .sort(sort)
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
            console.error('Get stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stories'
            });
        }
    },
    
    // @desc    Search stories by title, excerpt, or tags
    // @route   GET /api/stories/search
    // @access  Public
    async getStoriesBySearch(req, res) {
        try {
            const { 
                q, // search query
                page = 1, 
                limit = 20,
                category,
                status = 'published',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const filter = { status };
            
            // Build search query for title, excerpt, or tags (not content)
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { excerpt: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];

            if (category) {
                filter.category = category;
            }

            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            const stories = await Story.find(filter)
                .populate('author', 'username displayName profile.avatar isAuthor')
                .populate('collaborators.user', 'username displayName profile.avatar')
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Story.countDocuments(filter);

            res.json({
                success: true,
                stories,
                searchQuery: q,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            console.error('Search stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search stories'
            });
        }
    },

    // @desc    Get stories by author (username or ID)
    // @route   GET /api/stories
    // @access  Public
    async getStoriesByAuthor(req, res) {
        try {
            const { 
                author, // username or ID
                page = 1, 
                limit = 20,
                status = 'published',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            if (!author) {
                return res.status(400).json({
                    success: false,
                    message: 'Author parameter is required'
                });
            }

            const filter = { status };
            
            // Handle author filtering by username or ID
            if (author.startsWith('@') || !author.match(/^[0-9a-fA-F]{24}$/)) {
                // Username search (with or without @ prefix)
                const username = author.startsWith('@') ? author.substring(1) : author;
                const user = await User.findOne({ username });
                
                if (!user) {
                    return res.json({
                        success: true,
                        stories: [],
                        author: null,
                        pagination: { 
                            current: 1, 
                            pages: 0, 
                            total: 0 
                        }
                    });
                }
                filter.author = user._id;
            } else {
                // Author ID search
                filter.author = author;
            }

            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            const stories = await Story.find(filter)
                .populate('author', 'username displayName profile.avatar isAuthor profile.bio')
                .populate('collaborators.user', 'username displayName profile.avatar')
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Story.countDocuments(filter);

            // Get author info for response
            const authorInfo = stories.length > 0 ? stories[0].author : 
                await User.findById(filter.author).select('username displayName profile.avatar isAuthor profile.bio');

            res.json({
                success: true,
                stories,
                author: authorInfo,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            console.error('Get stories by author error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stories by author'
            });
        }
    },

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Public
async getStory(req, res) {
    try {
        const story = await Story.findById(req.params.id)
            .populate('author', 'username displayName profile.avatar isAuthor')
            .populate('collaborators.user', 'username displayName profile.avatar');

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if user can view the story
        if (story.status !== 'published') {
            // Allow authors to view their own unpublished stories
            if (!req.userId || (story.author._id.toString() !== req.userId.toString() && 
                !story.collaborators.some(collab => collab.user._id.toString() === req.userId.toString()))) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        // Increment view count for published stories
        if (story.status === 'published') {
            story.stats.views += 1;
            story.stats.engagement = story.calculateEngagement();
            await story.save();
        }

        // Get user interactions if authenticated
        let userInteractions = {};
        if (req.userId) {
            userInteractions = {
                isLiked: story.likedBy.includes(req.userId),
                inReadingList: story.inReadingLists.includes(req.userId),
                userRating: story.ratings.find(rating => 
                    rating.user.toString() === req.userId.toString()
                )?.rating || null
            };
        }

        res.json({
            success: true,
            story: {
                _id: story._id,
                title: story.title,
                excerpt: story.excerpt,
                pages: story.pages, // Return all pages for the story
                category: story.category,
                tags: story.tags,
                status: story.status,
                coverImage: story.coverImage,
                author: story.author,
                collaborators: story.collaborators,
                stats: story.stats,
                metadata: story.metadata,
                isFeatured: story.isFeatured,
                createdAt: story.createdAt,
                updatedAt: story.updatedAt
            },
            userInteractions
        });

    } catch (error) {
        console.error('Get story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch story'
        });
    }
},

    // @desc    Create story
    // @route   POST /api/stories
    // @access  Private
   // In storyController.js - UPDATE the createStory method
async createStory(req, res) {
    try {
        const { title, excerpt, category, pages, tags, ...otherData } = req.body;
        
        // Validate that pages array is provided and has at least one page
        if (!pages || !Array.isArray(pages) || pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one page is required'
            });
        }

        //Validate category exists and is active!
        const categoryDoc = await Category.findOne({
            name: category,
            isActive: true
        });

        if(!categoryDoc){
            return res.status(400).json({
                success: false,
                message: `INVALID CATEGORY!: ${category} IS NOT A VALID CATEGORY!`
            });
        }

        const storyData = {
            title,
            author: req.userId,
            pages: pages,
            excerpt,
            category, 
            tags,
            ...otherData
        };

        // Rest of the method remains the same...
        const story = new Story(storyData);
        await story.save();

        //INCREMENT CATEGORY STORY COUNT
        categoryDoc.metadata.storyCount += 1;
        await categoryDoc.save();
         
            // Populate author info for response
            await story.populate('author', 'username displayName profile.avatar isAuthor');

            res.status(201).json({
                success: true,
                story: {
                    id: story._id,
                    title: story.title,
                    excerpt: story.excerpt,
                    category: story.category,
                    status: story.status,
                    coverImage: story.coverImage,
                    createdAt: story.createdAt,
                    author: story.author
                },
                message: 'Story created successfully'
            });

        } catch (error) {
            console.error('Create story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create story'
            });
        }
    },

    // @desc    Update story
    // @route   PUT /api/stories/:id
    // @access  Private (Author only)
    async updateStory(req, res) {
        try {
            const story = await Story.findById(req.params.id);

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            // Check if user is the author or collaborator
            const isAuthor = story.author.toString() === req.userId;
            const isCollaborator = story.collaborators.some(
                collab => collab.user.toString() === req.userId
            );

            if (!isAuthor && !isCollaborator) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this story'
                });
            }

            // Validate category if provided
            if (req.body.category) {
                const categoryExists = await Category.findOne({ 
                    name: req.body.category,
                    isActive: true 
                });
                
                if (!categoryExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid category'
                    });
                }
            }

            const updatedStory = await Story.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            )
            .populate('author', 'username displayName profile.avatar')
            .populate('collaborators.user', 'username displayName profile.avatar');

            res.json({
                success: true,
                story: updatedStory,
                message: 'Story updated successfully'
            });

        } catch (error) {
            console.error('Update story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update story'
            });
        }
    },

    // @desc    Delete story
    // @route   DELETE /api/stories/:id
    // @access  Private (Author only)
    async deleteStory(req, res) {
        try {
            const story = await Story.findById(req.params.id);

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            // Check if user is the author
            if (story.author.toString() !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this story'
                });
            }

            //Validate category exists and is active!
            const categoryDoc = await Category.findOne({slug: category});

            if (categoryDoc && categoryDoc.metadata.storyCount > 0) {
               categoryDoc.metadata.storyCount -= 1;
               await categoryDoc.save();
            }

            await Story.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: 'Story deleted successfully'
            });

        } catch (error) {
            console.error('Delete story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete story'
            });
        }
    },

    // @desc    Like/unlike story
    // @route   POST /api/stories/:id/like
    // @access  Private
    async likeStory(req, res) {
        try {
            const story = await Story.findById(req.params.id);

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            await story.likeStory(req.userId);

            res.json({
                success: true,
                message: 'Story like updated successfully',
                likesCount: story.stats.likesCount,
                isLiked: story.likedBy.includes(req.userId)
            });

        } catch (error) {
            console.error('Like story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update story like'
            });
        }
    },

    // @desc    Add to reading list
    // @route   POST /api/stories/:id/reading-list
    // @access  Private
    async addToReadingList(req, res) {
        try {
            const story = await Story.findById(req.params.id);

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            await story.addToReadingList(req.userId);

            res.json({
                success: true,
                message: 'Story added to reading list successfully',
                readingListCount: story.stats.readingListCount,
                inReadingList: story.inReadingLists.includes(req.userId)
            });

        } catch (error) {
            console.error('Add to reading list error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add story to reading list'
            });
        }
    },

    // @desc    Get story analytics
    // @route   GET /api/stories/:id/analytics
    // @access  Private (Author only)
    async getStoryAnalytics(req, res) {
        try {
            const story = await Story.findById(req.params.id);

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            // Check if user is the author or collaborator
            const isAuthor = story.author.toString() === req.userId;
            const isCollaborator = story.collaborators.some(
                collab => collab.user.toString() === req.userId
            );

            if (!isAuthor && !isCollaborator) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view analytics for this story'
                });
            }

            res.json({
                success: true,
                analytics: {
                    views: story.stats.views,
                    likes: story.stats.likesCount,
                    comments: story.stats.commentCount,
                    readingList: story.stats.readingListCount,
                    engagement: story.stats.engagement,
                    wordCount: story.metadata.wordCount,
                    readingTime: story.metadata.readingTime
                }
            });

        } catch (error) {
            console.error('Get story analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch story analytics'
            });
        }
    },

    // @desc    Get featured stories
    // @route   GET /api/stories/featured
    // @access  Public
    async getFeaturedStories(req, res) {
        try {
            const stories = await Story.find({ 
                status: 'published',
                isFeatured: true 
            })
            .populate('author', 'username displayName profile.avatar isAuthor')
            .populate('collaborators.user', 'username displayName profile.avatar')
            .sort({ 'stats.engagement': -1, createdAt: -1 })
            .limit(10);

            res.json({
                success: true,
                stories
            });

        } catch (error) {
            console.error('Get featured stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch featured stories'
            });
        }
    },

    // @desc    Get trending stories
    // @route   GET /api/stories/trending
    // @access  Public
    async getTrendingStories(req, res) {
        try {
            const stories = await Story.find({ status: 'published' })
                .populate('author', 'username displayName profile.avatar isAuthor')
                .populate('collaborators.user', 'username displayName profile.avatar')
                .sort({ 'stats.engagement': -1, 'stats.views': -1 })
                .limit(10);

            res.json({
                success: true,
                stories
            });

        } catch (error) {
            console.error('Get trending stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch trending stories'
            });
        }
    },

    // @desc    Search stories
    // @route   GET /api/stories/search
    // @access  Public
    async searchStories(req, res) {
        try {
            const { q, category, page = 1, limit = 20 } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const filter = { 
                status: 'published',
                $text: { $search: q } 
            };

            if (category) {
                filter.category = category;
            }

            const stories = await Story.find(filter, { score: { $meta: 'textScore' } })
                .populate('author', 'username displayName profile.avatar isAuthor')
                .populate('collaborators.user', 'username displayName profile.avatar')
                .sort({ score: { $meta: 'textScore' } })
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
            console.error('Search stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search stories'
            });
        }
    },

    // @desc    Check if user has liked story or added to reading list
    // @route   GET /api/stories/:id/user-interactions
    // @access  Private
    async getUserInteractions(req, res) {
        try {
            const story = await Story.findById(req.params.id);

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            res.json({
                success: true,
                interactions: {
                    isLiked: story.likedBy.includes(req.userId),
                    inReadingList: story.inReadingLists.includes(req.userId)
                }
            });

        } catch (error) {
            console.error('Get user interactions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user interactions'
            });
        }
    },

// ADD: Rate a story method
async rateStory(req, res) {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        const userId = req.userId;

        const story = await Story.findById(id);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        await story.rateStory(userId, rating);

        res.json({
            success: true,
            message: 'Story rated successfully',
            averageRating: story.stats.averageRating,
            ratingCount: story.stats.ratingCount
        });

    } catch (error) {
        console.error('Rate story error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rate story'
        });
    }
},

// ADD: Get user's reading list status for multiple stories
async getBulkUserInteractions(req, res) {
    try {
        const { storyIds } = req.query;
        
        if (!storyIds) {
            return res.status(400).json({
                success: false,
                message: 'Story IDs are required'
            });
        }

        const ids = Array.isArray(storyIds) ? storyIds : storyIds.split(',');
        
        const stories = await Story.find({
            _id: { $in: ids }
        }).select('likedBy inReadingLists');

        const interactions = {};
        stories.forEach(story => {
            interactions[story._id] = {
                isLiked: story.likedBy.includes(req.userId),
                inReadingList: story.inReadingLists.includes(req.userId)
            };
        });

        res.json({
            success: true,
            interactions
        });

    } catch (error) {
        console.error('Get bulk user interactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user interactions'
        });
    }
},

// @desc    Get specific page of a story
// @route   GET /api/stories/:id/pages/:pageNumber
// @access  Public 
async getStoryPage(req, res) {
    try {
        const { id, pageNumber } = req.params;
        const pageNum = parseInt(pageNumber) || 1;

        const story = await Story.findById(id)
            .populate('author', 'username displayName profile.avatar profile.bio isAuthor');

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        if (story.status !== 'published' && (!req.userId || story.author._id.toString() !== req.userId.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const page = story.pages.find(p => p.pageNumber === pageNum);
        
        if (!page) {
            return res.status(404).json({
                success: false,
                message: `Page ${pageNum} not found`
            });
        }

        // Track page view
        await story.trackPageView(pageNum);

        // Get user reading progress if authenticated
        let userProgress = null;
        if (req.userId) {
            userProgress = story.getUserReadingProgress(req.userId);
        }

        res.json({
            success: true,
            story: {
                _id: story._id,
                title: story.title,
                author: story.author,
                category: story.category,
                totalPages: story.pages.length
            },
            page: {
                pageNumber: page.pageNumber,
                content: page.content,
                wordCount: page.wordCount,
                readingTime: page.readingTime
            },
            navigation: {
                currentPage: pageNum,
                totalPages: story.pages.length,
                hasPrevious: pageNum > 1,
                hasNext: pageNum < story.pages.length
            },
            userProgress: userProgress
        });

    } catch (error) {
        console.error('Get story page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch story page'
        });
    }
},

// @desc    Update reading progress
// @route   POST /api/stories/:id/reading-progress
// @access  Private
async updateReadingProgress(req, res) {
    try {
        const { id } = req.params;
        const { currentPage, timeSpent = 0 } = req.body;

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        await story.updateReadingProgress(req.userId, currentPage, timeSpent);

        res.json({
            success: true,
            message: 'Reading progress updated',
            progress: story.getUserReadingProgress(req.userId)
        });

    } catch (error) {
        console.error('Update reading progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update reading progress'
        });
    }
},

// @desc    Get user's reading progress for a story
// @route   GET /api/stories/:id/reading-progress
// @access  Private
async getReadingProgress(req, res) {
    try {
        const { id } = req.params;

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        const progress = story.getUserReadingProgress(req.userId);

        res.json({
            success: true,
            progress
        });

    } catch (error) {
        console.error('Get reading progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reading progress'
        });
    }
},

// @desc    Add a page to a story (for authors)
// @route   POST /api/stories/:id/pages
// @access  Private (Author only)
async addPage(req, res) {
    try {
        const { id } = req.params;
        const { content, pageNumber } = req.body;

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if user is the author or collaborator
        const isAuthor = story.author.toString() === req.userId;
        const isCollaborator = story.collaborators.some(
            collab => collab.user.toString() === req.userId
        );

        if (!isAuthor && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this story'
            });
        }

        await story.addPage(content, pageNumber);

        res.json({
            success: true,
            message: 'Page added successfully',
            story: {
                _id: story._id,
                pages: story.pages,
                metadata: story.metadata
            }
        });

    } catch (error) {
        console.error('Add page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add page'
        });
    }
},

// @desc    Update a page in a story (for authors)
// @route   PUT /api/stories/:id/pages/:pageNumber
// @access  Private (Author only)
async updatePage(req, res) {
    try {
        const { id, pageNumber } = req.params;
        const { content } = req.body;
        const pageNum = parseInt(pageNumber);

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if user is the author or collaborator
        const isAuthor = story.author.toString() === req.userId;
        const isCollaborator = story.collaborators.some(
            collab => collab.user.toString() === req.userId
        );

        if (!isAuthor && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this story'
            });
        }

        await story.updatePage(pageNum, content);

        res.json({
            success: true,
            message: 'Page updated successfully',
            page: story.pages.find(p => p.pageNumber === pageNum)
        });

    } catch (error) {
        console.error('Update page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update page'
        });
    }
},

// @desc    Delete a page from a story (for authors)
// @route   DELETE /api/stories/:id/pages/:pageNumber
// @access  Private (Author only)
async deletePage(req, res) {
    try {
        const { id, pageNumber } = req.params;
        const pageNum = parseInt(pageNumber);

        const story = await Story.findById(id);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if user is the author or collaborator
        const isAuthor = story.author.toString() === req.userId;
        const isCollaborator = story.collaborators.some(
            collab => collab.user.toString() === req.userId
        );

        if (!isAuthor && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this story'
            });
        }

        await story.deletePage(pageNum);

        res.json({
            success: true,
            message: 'Page deleted successfully',
            story: {
                _id: story._id,
                pages: story.pages,
                metadata: story.metadata
            }
        });

    } catch (error) {
        console.error('Delete page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete page'
        });
    }
}

}


export default storyController;
