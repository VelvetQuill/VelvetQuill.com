import express from 'express';
import Visitor from '../models/Visitor.js';

const router = express.Router();

// Track a new visitor
router.post('/track-visitor', async (req, res) => {
    try {
        const { sessionId, userAgent, referrer, country, city, deviceType, browser, operatingSystem } = req.body;
        
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        // Check if this is a returning visitor
        const existingVisitor = await Visitor.findOne({ sessionId });
        
        if (existingVisitor) {
            // Update existing visitor
            existingVisitor.isReturning = true;
            existingVisitor.visitDuration += 30; // Increment duration
            await existingVisitor.save();
            
            return res.json({
                success: true,
                message: 'Returning visitor tracked',
                visitor: existingVisitor
            });
        }
        
        // Create new visitor
        const visitor = new Visitor({
            sessionId,
            ipAddress,
            userAgent,
            referrer,
            country,
            city,
            deviceType,
            browser,
            operatingSystem
        });
        
        await visitor.save();
        
        res.json({
            success: true,
            message: 'New visitor tracked',
            visitor
        });
        
    } catch (error) {
        console.error('Visitor tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track visitor'
        });
    }
});

// Track page view
router.post('/track-pageview', async (req, res) => {
    try {
        const { sessionId, page } = req.body;
        
        await Visitor.findOneAndUpdate(
            { sessionId },
            { 
                $push: { 
                    pagesVisited: { 
                        page,
                        timestamp: new Date()
                    } 
                } 
            }
        );
        
        res.json({ success: true, message: 'Page view tracked' });
        
    } catch (error) {
        console.error('Page view tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track page view'
        });
    }
});

// Get visitor statistics (Admin only)
router.get('/stats', async (req, res) => {
    try {
        const totalVisitors = await Visitor.countDocuments();
        const uniqueVisitors = await Visitor.distinct('ipAddress').then(ips => ips.length);
        const returningVisitors = await Visitor.countDocuments({ isReturning: true });
        
        // Today's visitors
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayVisitors = await Visitor.countDocuments({
            createdAt: { $gte: today }
        });
        
        // This week's visitors
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekVisitors = await Visitor.countDocuments({
            createdAt: { $gte: weekAgo }
        });
        
        res.json({
            success: true,
            stats: {
                totalVisitors,
                uniqueVisitors,
                returningVisitors,
                todayVisitors,
                weekVisitors
            }
        });
        
    } catch (error) {
        console.error('Visitor stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get visitor statistics'
        });
    }
});

export default router;