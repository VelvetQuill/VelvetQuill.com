
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: { 
        type: String, 
        required: true,
        minlength: [8, 'Password must be at least 8 characters']
    },
    displayName: { 
        type: String, 
        required: true,
        minlength: [2, 'Display name must be at least 2 characters'],
        maxlength: [50, 'Display name cannot exceed 50 characters']
    },
    role: { 
        type: String, 
        enum: ['user', 'author', 'admin', 'overallAdmin'], 
        default: 'user' 
    },
    isAuthor: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'deactivated'],
        default: 'active'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    authorApplication: {
        status: { 
            type: String, 
            enum: ['pending', 'approved', 'rejected', null], 
            default: null 
        },
        autoApproved: { 
            type: Boolean, 
            default: false 
        }
    },
    profile: {
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        avatar: {
            type: String,
            default: null
        },
        avatarType: {
            type: String,
            default: null
        }
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    stats: {
        storiesCount: { 
            type: Number, 
            default: 0
        },
        followersCount: { 
            type: Number, 
            default: 0
        },
        followingCount: { 
            type: Number, 
            default: 0
        },
        totalViews: { 
            type: Number, 
            default: 0
        },
        engagementRate: {
            type: Number,
            default: 0
        },
        commentsCount: {
            type: Number,
            default: 0
        }
    }
}, { 
    timestamps: true 
});

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1, status: 1 });
userSchema.index({ 'stats.followersCount': -1 });
userSchema.index({ 'stats.engagementRate': -1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

// Middleware to update follower/following counts automatically
userSchema.pre('save', function(next) {
    if (this.isModified('followers')) {
        this.stats.followersCount = this.followers.length;
    }
    if (this.isModified('following')) {
        this.stats.followingCount = this.following.length;
    }
    
    // Calculate engagement rate based on followers and interactions
    if (this.stats.followersCount > 0) {
        this.stats.engagementRate = (this.stats.totalViews / this.stats.followersCount) * 100;
    }
    
    next();
});

// We can add a static method to update comments count
userSchema.statics.updateCommentsCount = async function(userId) {
    const commentsCount = await mongoose.model('Comment').countDocuments({ 
        author: userId, 
        status: 'active' 
    });
    
    await this.findByIdAndUpdate(userId, {
        'stats.commentsCount': commentsCount
    });
    
    return commentsCount;
};


// Instance methods
userSchema.methods.canPublish = function() {
    return this.isActive && this.status === 'active' && 
           (this.role === 'author' || this.role === 'admin' || this.role === 'overallAdmin');
};

userSchema.methods.suspend = function(reason) {
    this.status = 'suspended';
    this.suspensionReason = reason;
    this.suspendedAt = new Date();
    return this.save();
};

userSchema.methods.activate = function() {
    this.status = 'active';
    this.suspensionReason = undefined;
    this.suspendedAt = undefined;
    return this.save();
};

// Follow/Unfollow methods
userSchema.methods.follow = function(userId) {
    if (!this.following.includes(userId)) {
        this.following.push(userId);
    }
    return this.save();
};

userSchema.methods.unfollow = function(userId) {
    this.following = this.following.filter(id => !id.equals(userId));
    return this.save();
};

userSchema.methods.addFollower = function(userId) {
    if (!this.followers.includes(userId)) {
        this.followers.push(userId);
    }
    return this.save();
};

userSchema.methods.removeFollower = function(userId) {
    this.followers = this.followers.filter(id => !id.equals(userId));
    return this.save();
};

// Check relationship methods
userSchema.methods.isFollowing = function(userId) {
    return this.following.some(id => id.equals(userId));
};

userSchema.methods.isFollowedBy = function(userId) {
    return this.followers.some(id => id.equals(userId));
};

userSchema.methods.getMutualFollowers = function(userId) {
    return this.followers.filter(followerId => 
        this.following.some(followingId => followingId.equals(followerId))
    );
};

// Static methods for user queries
userSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true, status: 'active' });
};

userSchema.statics.findTopAuthors = function(limit = 10) {
    return this.find({ 
        role: 'author', 
        isActive: true, 
        status: 'active' 
    })
    .sort({ 'stats.followersCount': -1, 'stats.engagementRate': -1 })
    .limit(limit);
};

userSchema.methods.becomeAuthor = function(bio = '') {
    this.role = 'author';
    this.isAuthor = true;
    this.authorApplication = {
        status: 'approved',
        autoApproved: true,
        approvedAt: new Date()
    };
    
    if (bio) {
        this.profile.bio = bio;
    }
    
    return this.save();
};


export default mongoose.model('User', userSchema);

