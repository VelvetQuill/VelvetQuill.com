
// backend/models/Contest.js
import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    theme: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'], 
        default: 'draft' 
    },
    timeline: {
        startDate: { 
            type: Date, 
            required: true 
        },
        endDate: { 
            type: Date, 
            required: true 
        },
        submissionDeadline: Date,
        winnerAnnouncement: Date
    },
    objectives: [{
        description: String,
        type: { 
            type: String, 
            enum: ['story_count', 'word_count', 'views', 'rating'] 
        },
        target: Number,
        operator: { 
            type: String, 
            enum: ['min', 'max', 'exact'] 
        }
    }],
    prizes: [{
        type: { 
            type: String, 
            enum: ['cash', 'badge', 'achievement', 'featured', 'other'] 
        },
        value: String,
        description: String
    }],
    eligibility: {
        categories: [String],
        authorLevel: { 
            type: String, 
            enum: ['all', 'new', 'intermediate', 'experienced'] 
        },
        minStories: Number,
        minRating: Number
    },
    rules: String,
    participants: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        joinedAt: { 
            type: Date, 
            default: Date.now 
        },
        submissions: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Story' 
        }],
        progress: {
            storiesSubmitted: Number,
            totalWords: Number,
            totalViews: Number,
            averageRating: Number
        }
    }],
    winners: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        position: Number,
        prizeAwarded: String
    }],
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }
}, { 
    timestamps: true 
});


// ADD these methods to Contest.js model
contestSchema.methods.updateParticipantProgress = async function(userId) {
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    
    if (participant && participant.submissions.length > 0) {
        const Story = mongoose.model('Story');
        const stories = await Story.find({ _id: { $in: participant.submissions } });
        
        let totalWords = 0;
        let totalViews = 0;
        let totalRating = 0;
        
        stories.forEach(story => {
            totalWords += story.metadata.wordCount || 0;
            totalViews += story.stats.views || 0;
            totalRating += story.stats.averageRating || 0;
        });
        
        participant.progress = {
            storiesSubmitted: participant.submissions.length,
            totalWords,
            totalViews,
            averageRating: stories.length > 0 ? totalRating / stories.length : 0
        };
        
        await this.save();
    }
};

// Static method to get active contests
contestSchema.statics.getActiveContests = function() {
    const now = new Date();
    return this.find({
        status: 'active',
        'timeline.startDate': { $lte: now },
        'timeline.endDate': { $gte: now }
    }).populate('createdBy', 'username displayName profile.avatar');
};

export default mongoose.model('Contest', contestSchema);



