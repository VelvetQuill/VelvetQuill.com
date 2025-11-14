
// backend/models/Comment.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        minlength: [1, 'Comment cannot be empty'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Comment author is required']
    },
    story: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        required: [true, 'Story reference is required'],
        index: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'flagged', 'hidden', 'deleted'],
        default: 'active'
    },
    moderation: {
        flaggedBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            reason: {
                type: String,
                enum: ['spam', 'harassment', 'inappropriate', 'spoiler', 'other']
            },
            flaggedAt: {
                type: Date,
                default: Date.now
            }
        }],
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        moderationReason: String,
        moderatedAt: Date,
        autoFlagged: {
            type: Boolean,
            default: false
        }
    },
    engagement: {
        likes: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            likedAt: {
                type: Date,
                default: Date.now
            }
        }],
        likesCount: {
            type: Number,
            default: 0,
            min: 0
        },
        repliesCount: {
            type: Number,
            default: 0,
            min: 0
        },
        reportCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    metadata: {
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
        editHistory: [{
            content: String,
            editedAt: {
                type: Date,
                default: Date.now
            }
        }],
        userAgent: String,
        ipAddress: String
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pinnedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for reply comments
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment'
});

// Indexes for performance
commentSchema.index({ story: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ 'engagement.likesCount': -1 });
commentSchema.index({ createdAt: -1 });

// Middleware to update reply count
commentSchema.pre('save', async function(next) {
    if (this.isNew && this.parentComment) {
        await this.constructor.findByIdAndUpdate(
            this.parentComment,
            { $inc: { 'engagement.repliesCount': 1 } }
        );
    }
    next();
});

// Middleware to handle comment deletion
commentSchema.pre('findOneAndDelete', async function(next) {
    const comment = await this.model.findOne(this.getFilter());
    
    if (comment) {
        if (comment.parentComment) {
            await this.model.findByIdAndUpdate(
                comment.parentComment,
                { $inc: { 'engagement.repliesCount': -1 } }
            );
        }
        
        await this.model.deleteMany({ parentComment: comment._id });
        
        const Story = mongoose.model('Story');
        await Story.findByIdAndUpdate(
            comment.story,
            { $inc: { 'stats.commentCount': -1 } }
        );
    }
    next();
});

// Static Methods
// Replace the complex getStoryComments method with this simpler version
commentSchema.statics.getStoryComments = async function(storyId, options = {}) {
    return this.getStoryCommentsSimple(storyId, options);
};


commentSchema.statics.getCommentWithReplies = function(commentId) {
    return this.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(commentId), status: 'active' } },
        {
            $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'authorInfo'
            }
        },
        { $unwind: '$authorInfo' },
        {
            $lookup: {
                from: 'comments',
                let: { commentId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentComment', '$$commentId'] } } },
                    { $match: { status: 'active' } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'author',
                            foreignField: '_id',
                            as: 'authorInfo'
                        }
                    },
                    { $unwind: '$authorInfo' },
                    {
                        $project: {
                            content: 1,
                            'engagement.likesCount': 1,
                            createdAt: 1,
                            updatedAt: 1,
                            'authorInfo.username': 1,
                            'authorInfo.displayName': 1,
                            'authorInfo.profile.avatar': 1,
                            'authorInfo.role': 1
                        }
                    },
                    { $sort: { createdAt: 1 } }
                ],
                as: 'replies'
            }
        },
        {
            $project: {
                content: 1,
                status: 1,
                'engagement.likesCount': 1,
                'engagement.repliesCount': 1,
                isPinned: 1,
                createdAt: 1,
                updatedAt: 1,
                'authorInfo.username': 1,
                'authorInfo.displayName': 1,
                'authorInfo.profile.avatar': 1,
                'authorInfo.role': 1,
                'authorInfo.isAuthor': 1,
                replies: 1
            }
        }
    ]);
};

// Instance Methods
commentSchema.methods.likeComment = async function(userId) {
    const hasLiked = this.engagement.likes.some(like => 
        like.user.toString() === userId.toString()
    );

    if (hasLiked) {
        this.engagement.likes = this.engagement.likes.filter(like =>
            like.user.toString() !== userId.toString()
        );
        this.engagement.likesCount = Math.max(0, this.engagement.likesCount - 1);
    } else {
        this.engagement.likes.push({
            user: userId,
            likedAt: new Date()
        });
        this.engagement.likesCount += 1;
    }

    return this.save();
};

commentSchema.methods.flagComment = async function(userId, reason) {
    const alreadyFlagged = this.moderation.flaggedBy.some(flag =>
        flag.user.toString() === userId.toString()
    );

    if (!alreadyFlagged) {
        this.moderation.flaggedBy.push({
            user: userId,
            reason,
            flaggedAt: new Date()
        });
        this.engagement.reportCount += 1;

        if (this.engagement.reportCount >= 3) {
            this.status = 'flagged';
            this.moderation.autoFlagged = true;
        }

        return this.save();
    }

    return this;
};

commentSchema.methods.editComment = async function(newContent) {
    if (!this.metadata.editHistory) {
        this.metadata.editHistory = [];
    }

    this.metadata.editHistory.push({
        content: this.content,
        editedAt: new Date()
    });

    this.content = newContent;
    this.metadata.isEdited = true;
    this.metadata.editedAt = new Date();

    return this.save();
};

commentSchema.methods.pinComment = async function(userId) {
    const Story = mongoose.model('Story');
    const story = await Story.findById(this.story);
    
    if (!story) {
        throw new Error('Story not found');
    }

    const User = mongoose.model('User');
    const user = await User.findById(userId);

    if (
        story.author.toString() !== userId.toString() && 
        user.role !== 'admin'
    ) {
        throw new Error('Only story author or admin can pin comments');
    }

    this.isPinned = true;
    this.pinnedBy = userId;
    this.pinnedAt = new Date();

    return this.save();
};

commentSchema.methods.unpinComment = async function(userId) {
    const Story = mongoose.model('Story');
    const story = await Story.findById(this.story);
    
    if (!story) {
        throw new Error('Story not found');
    }

    const User = mongoose.model('User');
    const user = await User.findById(userId);

    if (
        story.author.toString() !== userId.toString() && 
        user.role !== 'admin'
    ) {
        throw new Error('Only story author or admin can unpin comments');
    }

    this.isPinned = false;
    this.pinnedBy = undefined;
    this.pinnedAt = undefined;

    return this.save();
};

// Query Helpers
commentSchema.query.byStory = function(storyId) {
    return this.where({ story: storyId });
};

commentSchema.query.byAuthor = function(authorId) {
    return this.where({ author: authorId });
};

commentSchema.query.active = function() {
    return this.where({ status: 'active' });
};

commentSchema.query.flagged = function() {
    return this.where({ status: 'flagged' });
};

commentSchema.query.topLevel = function() {
    return this.where({ parentComment: null });
};

// Virtual for formatted date
commentSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual for time ago
commentSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return this.formattedDate;
});


// ADD this method to Comment.js model to replace complex aggregation with simpler query
commentSchema.statics.getStoryCommentsSimple = async function(storyId, options = {}) {
    const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeReplies = true
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get top-level comments
    const comments = await this.find({
        story: storyId,
        parentComment: null,
        status: 'active'
    })
    .populate('author', 'username displayName profile.avatar role isAuthor')
    .sort({ isPinned: -1, ...sort })
    .limit(limit)
    .skip(skip);

    // If replies are requested, populate them
    if (includeReplies) {
        const commentIds = comments.map(comment => comment._id);
        const replies = await this.find({
            parentComment: { $in: commentIds },
            status: 'active'
        })
        .populate('author', 'username displayName profile.avatar role isAuthor')
        .sort({ createdAt: 1 });

        // Attach replies to their parent comments
        const repliesByParent = {};
        replies.forEach(reply => {
            if (!repliesByParent[reply.parentComment]) {
                repliesByParent[reply.parentComment] = [];
            }
            repliesByParent[reply.parentComment].push(reply);
        });

        comments.forEach(comment => {
            comment.replies = repliesByParent[comment._id] || [];
        });
    }

    return comments;
};



export default mongoose.model('Comment', commentSchema);
    
    
