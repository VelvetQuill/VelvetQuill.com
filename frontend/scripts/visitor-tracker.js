
class VisitorTracker {
    constructor() {
        this.sessionId = this.getSessionId();
        this.apiService = window.apiService;
        this.trackInitialVisit();
    }

    // Generate or retrieve session ID
    getSessionId() {
        let sessionId = localStorage.getItem('velvetquill_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('velvetquill_session_id', sessionId);
        }
        return sessionId;
    }

    // Get device and browser info
    getDeviceInfo() {
        const userAgent = navigator.userAgent;
        let deviceType = 'desktop';
        let browser = 'Unknown';
        let operatingSystem = 'Unknown';

        // Device detection
        if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
            deviceType = /iPad/i.test(userAgent) ? 'tablet' : 'mobile';
        }

        // Browser detection
        if (/Edg/i.test(userAgent)) browser = 'Edge';
        else if (/Chrome/i.test(userAgent)) browser = 'Chrome';
        else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
        else if (/Safari/i.test(userAgent)) browser = 'Safari';

        // OS detection
        if (/Windows/i.test(userAgent)) operatingSystem = 'Windows';
        else if (/Mac OS/i.test(userAgent)) operatingSystem = 'Mac OS';
        else if (/Linux/i.test(userAgent)) operatingSystem = 'Linux';
        else if (/Android/i.test(userAgent)) operatingSystem = 'Android';
        else if (/iOS|iPhone|iPad|iPod/i.test(userAgent)) operatingSystem = 'iOS';

        return {
            userAgent,
            deviceType,
            browser,
            operatingSystem,
            referrer: document.referrer || 'direct'
        };
    }

    // Track initial visit
    async trackInitialVisit() {
        try {
            const deviceInfo = this.getDeviceInfo();
            
            await this.apiService.request('/analytics/track-visitor', {
                method: 'POST',
                body: {
                    sessionId: this.sessionId,
                    ...deviceInfo
                }
            });

            console.log('✅ Visitor tracked successfully');
            
            // Track the homepage view
            this.trackPageView('homepage');
            
        } catch (error) {
            console.warn('Visitor tracking failed:', error);
        }
    }

    // Track specific page views
    async trackPageView(pageName) {
        try {
            await this.apiService.request('/analytics/track-pageview', {
                method: 'POST',
                body: {
                    sessionId: this.sessionId,
                    page: pageName
                }
            });
        } catch (error) {
            console.warn('Page view tracking failed:', error);
        }
    }

    // Track time spent on site (call this when user leaves)
    trackTimeSpent() {
        const visitStart = parseInt(localStorage.getItem('velvetquill_visit_start') || Date.now());
        const timeSpent = Math.floor((Date.now() - visitStart) / 1000); // in seconds
        
        // You can send this to your backend or store locally
        localStorage.setItem('velvetquill_last_visit_duration', timeSpent);
        localStorage.setItem('velvetquill_visit_start', Date.now().toString());
    }
}

// Initialize visitor tracking
function initializeVisitorTracking() {
    if (typeof window !== 'undefined') {
        window.visitorTracker = new VisitorTracker();
        
        // Track time when page is loaded
        window.visitorTracker.trackTimeSpent();
        
        // Track time when user leaves the page
        window.addEventListener('beforeunload', () => {
            window.visitorTracker.trackTimeSpent();
        });
        
        console.log('✅ Visitor tracking initialized');
    }
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVisitorTracking);
} else {
    initializeVisitorTracking();
}