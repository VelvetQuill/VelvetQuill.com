// backend/models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        required: [true, 'Category slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    description: {
        type: String,
        required: [true, 'Category description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    color: {
        type: String,
        default: '#8B0000',
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color code']
    },
    icon: {
        type: String,
        default: 'book'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0,
        min: 0
    },
    metadata: {
        storyCount: {
            type: Number,
            default: 0
        },
        totalViews: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        popularTags: [{
            tag: String,
            count: Number
        }]
    },
    guidelines: {
        contentRules: {
            type: String,
            maxlength: [1000, 'Content rules cannot exceed 1000 characters']
        },
        allowedThemes: [String],
        restrictedContent: [String],
        minWordCount: {
            type: Number,
            default: 1000,
            min: 0
        },
        maxWordCount: {
            type: Number,
            default: 50000,
            min: 0
        }
    },
    seo: {
        metaTitle: String,
        metaDescription: {
            type: String,
            maxlength: [160, 'Meta description cannot exceed 160 characters']
        },
        keywords: [String]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, { 
    timestamps: true 
});

// Auto-generate slug from name before saving
categorySchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    next();
});

// Static method to get all active categories with story counts
categorySchema.statics.getActiveCategories = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $lookup: {
                from: 'stories',
                localField: '_id',
                foreignField: 'category',
                as: 'stories'
            }
        },
        {
            $project: {
                name: 1,
                slug: 1,
                description: 1,
                color: 1,
                icon: 1,
                displayOrder: 1,
                storyCount: { $size: '$stories' },
                totalViews: { $sum: '$stories.stats.views' },
                averageRating: { $avg: '$stories.stats.rating' },
                createdAt: 1
            }
        },
        { $sort: { displayOrder: 1, name: 1 } }
    ]);
};


// Instance method to update category statistics
categorySchema.methods.updateStatistics = async function() {
    const Story = mongoose.model('Story');
    
    const stats = await Story.aggregate([
        { $match: { category: this.name, status: 'published' } }, // ← Use this.name, not this._id
        {
            $group: {
                _id: null,
                storyCount: { $sum: 1 },
                totalViews: { $sum: '$stats.views' },
                averageRating: { $avg: '$stats.averageRating' }
            }
        }
    ]);

    if (stats.length > 0) {
        this.metadata.storyCount = stats[0].storyCount;
        this.metadata.totalViews = stats[0].totalViews;
        this.metadata.averageRating = stats[0].averageRating || 0;
    } else {
        this.metadata.storyCount = 0;
        this.metadata.totalViews = 0;
        this.metadata.averageRating = 0;
    }

    // Update popular tags
    const tagStats = await Story.aggregate([
        { $match: { category: this.name, status: 'published' } }, // ← Use this.name here too
        { $unwind: '$tags' },
        {
            $group: {
                _id: '$tags',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    this.metadata.popularTags = tagStats.map(tag => ({
        tag: tag._id,
        count: tag.count
    }));

    return this.save();
};



// Virtual for formatted display name
categorySchema.virtual('displayName').get(function() {
    return this.name.charAt(0).toUpperCase() + this.name.slice(1);
});

// Index for better query performance
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ 'metadata.storyCount': -1 });

export default mongoose.model('Category', categorySchema);

