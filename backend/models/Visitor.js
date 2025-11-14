import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String
    },
    referrer: {
        type: String
    },
    country: {
        type: String
    },
    city: {
        type: String
    },
    deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
        default: 'desktop'
    },
    browser: {
        type: String
    },
    operatingSystem: {
        type: String
    },
    isReturning: {
        type: Boolean,
        default: false
    },
    pagesVisited: [{
        page: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    visitDuration: {
        type: Number, // in seconds
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ sessionId: 1 });

export default mongoose.model('Visitor', visitorSchema);