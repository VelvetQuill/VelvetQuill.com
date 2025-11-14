// backend/models/Story.js - UPDATED for Multi-Page Support
import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        minlength: [5, 'Title must be at least 5 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters'],
        trim: true
    },
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    pages: [{
        pageNumber: {
            type: Number,
            required: true,
            min: 1
        },
        content: {
            type: String,
            required: true,
            minlength: [3500, 'Each page must have at least 3500 characters'],
            maxlength: [25000, 'Page content cannot exceed 24000 characters']
        },
        wordCount: {
            type: Number,
            default: 0,
            min: 0
        },
        readingTime: {
            type: Number,
            default: 0,
            min: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    excerpt: { 
        type: String,
        maxlength: [300, 'Excerpt cannot exceed 300 characters']
    },
    category: { 
        type: String, 
        required: true
    },
    tags: [{
        type: String,
        maxlength: [20, 'Tag cannot exceed 20 characters']
    }],
    status: { 
        type: String, 
        enum: ['draft', 'pending', 'published', 'rejected', 'archived'], 
        default: 'draft' 
    },
    rejectionReason: String,
    metadata: {
        totalWordCount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalReadingTime: {
            type: Number,
            default: 0,
            min: 0
        },
        pageCount: {
            type: Number,
            default: 0,
            min: 0
        },
        contentRating: { 
            type: String, 
            enum: ['G', 'PG', 'PG-13', 'R'], 
            default: 'PG-13' 
        },
        contentWarnings: [String],
        language: {
            type: String,
            default: 'en'
        }
    },
    stats: {
        views: { 
            type: Number, 
            default: 0,
            min: 0
        },
        likesCount: { 
            type: Number, 
            default: 0,
            min: 0
        },
        rating: { 
            type: Number, 
            default: 0,
            min: 0,
            max: 5
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        ratingCount: { 
            type: Number, 
            default: 0,
            min: 0
        },
        commentCount: { 
            type: Number, 
            default: 0,
            min: 0
        },
        readingListCount: { 
            type: Number, 
            default: 0,
            min: 0
        },
        engagement: { 
            type: Number, 
            default: 0,
            min: 0
        },
        shares: {
            type: Number,
            default: 0,
            min: 0
        },
        // ADD: Page view tracking
        pageViews: [{
            pageNumber: Number,
            views: {
                type: Number,
                default: 0
            }
        }]
    },
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        ratedAt: {
            type: Date,
            default: Date.now
        }
    }],
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    inReadingLists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    coverImage: {
        type: String,
        match: [/^https?:\/\/.+\..+/, 'Please provide a valid image URL']
    },
    isFeatured: { 
        type: Boolean, 
        default: false 
    },
    featuredUntil: Date,
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['co-author', 'editor', 'beta-reader'],
            default: 'co-author'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        permissions: [{
            type: String,
            enum: ['read', 'write', 'comment', 'publish']
        }]
    }],
    seo: {
        metaTitle: String,
        metaDescription: String,
        slug: {
            type: String,
            unique: true,
            sparse: true
        },
        keywords: [String]
    },
    // ADD: Reading progress tracking
    readingProgress: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        currentPage: {
            type: Number,
            default: 1,
            min: 1
        },
        completed: {
            type: Boolean,
            default: false
        },
        lastReadAt: {
            type: Date,
            default: Date.now
        },
        timeSpent: {
            type: Number, // in seconds
            default: 0
        }
    }]
}, { 
    timestamps: true 
});

// ==================== INSTANCE METHODS ====================

// Method to like/unlike a story
storySchema.methods.likeStory = async function(userId) {
    const userIndex = this.likedBy.indexOf(userId);
    
    if (userIndex === -1) {
        this.likedBy.push(userId);
        this.stats.likesCount += 1;
    } else {
        this.likedBy.splice(userIndex, 1);
        this.stats.likesCount -= 1;
    }
    
    this.stats.engagement = this.calculateEngagement();
    await this.save();
};

// Method to add/remove from reading list
storySchema.methods.addToReadingList = async function(userId) {
    const userIndex = this.inReadingLists.indexOf(userId);
    
    if (userIndex === -1) {
        this.inReadingLists.push(userId);
        this.stats.readingListCount += 1;
    } else {
        this.inReadingLists.splice(userIndex, 1);
        this.stats.readingListCount -= 1;
    }
    
    this.stats.engagement = this.calculateEngagement();
    await this.save();
};

// Method to rate a story
storySchema.methods.rateStory = async function(userId, rating) {
    const existingRatingIndex = this.ratings.findIndex(r => r.user.toString() === userId.toString());
    
    if (existingRatingIndex > -1) {
        this.ratings[existingRatingIndex].rating = rating;
        this.ratings[existingRatingIndex].ratedAt = new Date();
    } else {
        this.ratings.push({
            user: userId,
            rating: rating,
            ratedAt: new Date()
        });
        this.stats.ratingCount += 1;
    }
    
    // Calculate average rating
    const totalRating = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.stats.averageRating = totalRating / this.ratings.length;
    this.stats.rating = this.stats.averageRating;
    
    this.stats.engagement = this.calculateEngagement();
    await this.save();
};

// ADD: Method to track page view
storySchema.methods.trackPageView = async function(pageNumber = 1) {
    this.stats.views += 1;
    
    // Track individual page views
    const pageViewIndex = this.stats.pageViews.findIndex(pv => pv.pageNumber === pageNumber);
    if (pageViewIndex > -1) {
        this.stats.pageViews[pageViewIndex].views += 1;
    } else {
        this.stats.pageViews.push({
            pageNumber: pageNumber,
            views: 1
        });
    }
    
    await this.save();
};

// ADD: Method to update reading progress
storySchema.methods.updateReadingProgress = async function(userId, currentPage, timeSpent = 0) {
    const progressIndex = this.readingProgress.findIndex(rp => rp.user.toString() === userId.toString());
    const totalPages = this.pages.length;
    const completed = currentPage >= totalPages;
    
    if (progressIndex > -1) {
        this.readingProgress[progressIndex].currentPage = currentPage;
        this.readingProgress[progressIndex].completed = completed;
        this.readingProgress[progressIndex].lastReadAt = new Date();
        this.readingProgress[progressIndex].timeSpent += timeSpent;
    } else {
        this.readingProgress.push({
            user: userId,
            currentPage: currentPage,
            completed: completed,
            lastReadAt: new Date(),
            timeSpent: timeSpent
        });
    }
    
    await this.save();
};

// ADD: Method to get reading progress for a user
storySchema.methods.getUserReadingProgress = function(userId) {
    return this.readingProgress.find(rp => rp.user.toString() === userId.toString()) || {
        currentPage: 1,
        completed: false,
        timeSpent: 0
    };
};

// ADD: Method to add a page
storySchema.methods.addPage = async function(pageContent, pageNumber = null) {
    const newPageNumber = pageNumber || this.pages.length + 1;
    
    const wordCount = this.countWords(pageContent);
    const readingTime = Math.ceil(wordCount / 200);
    
    this.pages.push({
        pageNumber: newPageNumber,
        content: pageContent,
        wordCount: wordCount,
        readingTime: readingTime,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    // Update story statistics
    await this.updateStoryStatistics();
    return this.save();
};

// ADD: Method to update a page
storySchema.methods.updatePage = async function(pageNumber, newContent) {
    const pageIndex = this.pages.findIndex(page => page.pageNumber === pageNumber);
    
    if (pageIndex === -1) {
        throw new Error(`Page ${pageNumber} not found`);
    }
    
    const wordCount = this.countWords(newContent);
    const readingTime = Math.ceil(wordCount / 200);
    
    this.pages[pageIndex].content = newContent;
    this.pages[pageIndex].wordCount = wordCount;
    this.pages[pageIndex].readingTime = readingTime;
    this.pages[pageIndex].updatedAt = new Date();
    
    // Update story statistics
    await this.updateStoryStatistics();
    return this.save();
};

// ADD: Method to delete a page
storySchema.methods.deletePage = async function(pageNumber) {
    const pageIndex = this.pages.findIndex(page => page.pageNumber === pageNumber);
    
    if (pageIndex === -1) {
        throw new Error(`Page ${pageNumber} not found`);
    }
    
    this.pages.splice(pageIndex, 1);
    
    // Re-number remaining pages
    this.pages.forEach((page, index) => {
        page.pageNumber = index + 1;
    });
    
    // Update story statistics
    await this.updateStoryStatistics();
    return this.save();
};

// ADD: Method to update story statistics
storySchema.methods.updateStoryStatistics = async function() {
    const totalWordCount = this.pages.reduce((sum, page) => sum + page.wordCount, 0);
    const totalReadingTime = this.pages.reduce((sum, page) => sum + page.readingTime, 0);
    
    this.metadata.totalWordCount = totalWordCount;
    this.metadata.totalReadingTime = totalReadingTime;
    this.metadata.pageCount = this.pages.length;
    
    this.stats.engagement = this.calculateEngagement();
    
    return this;
};

// Method to calculate engagement score
storySchema.methods.calculateEngagement = function() {
    return (this.stats.views * 0.1) + 
           (this.stats.likesCount * 2) + 
           (this.stats.commentCount * 3) + 
           (this.stats.readingListCount * 4) +
           (this.stats.ratingCount * 1.5) +
           (this.stats.shares * 2);
};

// ADD: Utility method to count words
storySchema.methods.countWords = function(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
};

// ==================== PRE-SAVE MIDDLEWARE ====================

storySchema.pre('save', function(next) {
    // Generate slug from title
    if (this.isModified('title') && !this.seo.slug) {
        this.seo.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    
    // Auto-generate excerpt if not provided and there are pages
    if ((!this.excerpt || this.isModified('pages')) && this.pages.length > 0) {
        const firstPageContent = this.pages[0].content;
        this.excerpt = firstPageContent.substring(0, 297) + (firstPageContent.length > 297 ? '...' : '');
    }
    
    // Update story statistics when pages change
    if (this.isModified('pages')) {
        this.updateStoryStatistics();
    }
    
    // Calculate engagement on save
    if (this.isModified()) {
        this.stats.engagement = this.calculateEngagement();
    }
    
    next();
});

// ==================== STATIC METHODS ====================

// Static method to get trending stories
storySchema.statics.getTrendingStories = function(limit = 10) {
    return this.find({ status: 'published' })
        .populate('author', 'username displayName profile.avatar isAuthor')
        .sort({ 'stats.engagement': -1, createdAt: -1 })
        .limit(limit);
};

// Static method to get stories by category
storySchema.statics.getByCategory = function(category, limit = 20) {
    return this.find({ category, status: 'published' })
        .populate('author', 'username displayName profile.avatar isAuthor')
        .sort({ 'stats.engagement': -1 })
        .limit(limit);
};

// ADD: Static method to get a specific page of a story
storySchema.statics.getStoryPage = async function(storyId, pageNumber = 1) {
    const story = await this.findById(storyId);
    
    if (!story) {
        throw new Error('Story not found');
    }
    
    const page = story.pages.find(p => p.pageNumber === pageNumber);
    
    if (!page) {
        throw new Error(`Page ${pageNumber} not found`);
    }
    
    return {
        story: {
            _id: story._id,
            title: story.title,
            author: story.author,
            category: story.category
        },
        page: page,
        totalPages: story.pages.length,
        currentPage: pageNumber
    };
};

// ADD: Static method to get stories with pagination info
storySchema.statics.getStoriesWithPageInfo = function(filter = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    return this.find(filter)
        .populate('author', 'username displayName profile.avatar isAuthor')
        .select('title excerpt category tags status metadata stats coverImage createdAt pages')
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

// Indexes for better performance
storySchema.index({ title: 'text', excerpt: 'text', tags: 'text' });
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ category: 1, status: 1 });
storySchema.index({ status: 1, isFeatured: -1 });
storySchema.index({ 'stats.engagement': -1 });
storySchema.index({ 'stats.averageRating': -1 });
storySchema.index({ 'seo.slug': 1 });
// ADD: Index for page content search
storySchema.index({ 'pages.content': 'text' });

export default mongoose.model('Story', storySchema);

