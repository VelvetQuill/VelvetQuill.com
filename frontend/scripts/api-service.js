
// api-service.js 
class ApiService {
    
    constructor() {
        // Dynamic environment detection
        this.baseURL = this.determineBaseURL();
        this.token = localStorage.getItem('velvetquill_token');
        this.setupInterceptors();
        this.setupGlobalErrorHandling();
    }

    // Determine base URL based on environment
    determineBaseURL() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Development environments
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        
        // Netlify preview deployments
        if (hostname.includes('netlify.app') || hostname.includes('velvetquillstories.netlify.app')) {
            return 'https://velvetquill-com.onrender.com/api';
        }
        // Production - replace with your actual Render backend URL
        return 'https://velvetquill-com.onrender.com/api';
    }

    // Setup request/response interceptors
    setupInterceptors() {
        console.log(`🚀 API Service initialized in ${this.getEnvironment()} mode`);
        console.log(`🔗 Base URL: ${this.baseURL}`);
    }

    // Setup global error handling
    setupGlobalErrorHandling() {
        window.addEventListener('online', () => {
            this.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showToast('You are offline. Some features may not work.', 'warning');
        });
    }

    // Get current environment
    getEnvironment() {
        return this.baseURL.includes('localhost') ? 'development' : 'production';
    }

    // Enhanced request method with retry logic
    async request(endpoint, options = {}, retries = 3) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Show loading indicator for longer requests
        const loadingTimeout = setTimeout(() => {
            this.showLoading(true);
        }, 1000);

        try {
            const config = this.buildRequestConfig(options);
            const response = await this.executeRequest(url, config);
            
            clearTimeout(loadingTimeout);
            this.showLoading(false);
            
            return await this.handleResponse(response);
            
        } catch (error) {
            clearTimeout(loadingTimeout);
            this.showLoading(false);
            
            // Retry logic for network errors
            if (retries > 0 && this.shouldRetry(error)) {
                console.log(`Retrying request... ${retries} attempts left`);
                await this.delay(1000 * (4 - retries)); // Exponential backoff
                return this.request(endpoint, options, retries - 1);
            }
            
            throw this.normalizeError(error);
        }
    }

    // Build request configuration
    buildRequestConfig(options = {}) {
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            signal: AbortSignal.timeout(30000) // 30 second timeout
        };

        // Handle request body
        if (options.body) {
            config.body = this.processRequestBody(options.body, config.headers);
        }

        // Add auth token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        return config;
    }

    // Process request body based on content type
    processRequestBody(body, headers) {
        if (body instanceof FormData) {
            delete headers['Content-Type']; // Let browser set multipart/form-data
            return body;
        } else if (typeof body === 'object') {
            return JSON.stringify(body);
        }
        return body;
    }

    // Execute fetch request
    async executeRequest(url, config) {
        const response = await fetch(url, config);
        
        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || 1;
            await this.delay(retryAfter * 1000);
            return this.executeRequest(url, config);
        }
        
        return response;
    }

    // Handle response with proper error handling
    async handleResponse(response) {
        // Handle unauthorized (token expired)
        if (response.status === 401) {
            this.handleUnauthorized();
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            const errorData = await this.parseErrorResponse(response);
            throw this.createApiError(errorData, response.status);
        }

        return await response.json();
    }

    // Parse error response
    async parseErrorResponse(response) {
        try {
            return await response.json();
        } catch {
            return {
                message: `HTTP error! status: ${response.status}`,
                status: response.status
            };
        }
    }

    // Create standardized API error
    createApiError(errorData, status) {
        const error = new Error(errorData.message || `Request failed with status ${status}`);
        error.status = status;
        error.details = errorData;
        
        // Categorize error types
        if (status >= 400 && status < 500) {
            error.type = 'client_error';
        } else if (status >= 500) {
            error.type = 'server_error';
        }
        
        return error;
    }

    // Normalize different error types
    normalizeError(error) {
        // Network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return new Error('Unable to connect to server. Please check your internet connection.');
        }
        
        // Timeout errors
        if (error.name === 'TimeoutError') {
            return new Error('Request timeout. Please try again.');
        }
        
        // Abort errors
        if (error.name === 'AbortError') {
            return new Error('Request was cancelled.');
        }
        
        return error;
    }

    // Determine if request should be retried
    shouldRetry(error) {
        const retryableMessages = [
            'network',
            'timeout',
            'connection',
            'failed to fetch'
        ];
        
        return retryableMessages.some(msg => 
            error.message.toLowerCase().includes(msg)
        );
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // UI helpers
    showLoading(show = true) {
        // You can implement a global loading indicator here
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    showToast(message, type = 'info') {
        // You can implement a toast notification system here
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Simple browser notification
        if (type === 'error' && this.getEnvironment() === 'production') {
            // Only show critical errors to users in production
            alert(message);
        }
    }

    // ==================== TOKEN MANAGEMENT ====================

    setToken(token) {
        this.token = token;
        localStorage.setItem('velvetquill_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('velvetquill_token');
        localStorage.removeItem('velvetquill_user_session');
        localStorage.removeItem('velvetquill_user');
    }

    handleUnauthorized() {
        this.clearToken();
        // Only redirect if not already on login page
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('signin') || 
                          currentPath.includes('signup') || 
                          currentPath.includes('login');
        
        if (!isAuthPage) {
            // Store intended destination for post-login redirect
            sessionStorage.setItem('redirect_after_login', window.location.href);
            window.location.href = '/signin.html';
        }
    }

    // ==================== AUTHENTICATION & USER MANAGEMENT ====================

    async signUp(userData) {
        console.log("📝 Attempting user signup");
        
        const response = await this.request('/auth/signup', {
            method: 'POST',
            body: userData
        });
        
        if (response.token) {
            this.setToken(response.token);
            this.storeUserSession(response.user, response.token);
        }
        return response;
    }

    async signIn(credentials) {
        console.log("🔐 Attempting user signin");

        const response = await this.request('/auth/signin', {
            method: 'POST',
            body: credentials
        });
        
        if (response.token) {
            this.setToken(response.token);
            this.storeUserSession(response.user, response.token);
        }
        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.warn('Logout request failed, clearing local session anyway:', error);
        } finally {
            this.clearToken();
        }
    }

    async verifyToken() {
        return this.request('/auth/verify');
    }

    // Store user session data
    storeUserSession(user, token) {
        const sessionData = {
            user_id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            is_author: user.isAuthor,
            is_admin: user.isAdmin,
            role: user.role,
            last_login: new Date().toISOString(),
            token: token
        };
        
        localStorage.setItem('velvetquill_user_session', JSON.stringify(sessionData));
        localStorage.setItem('velvetquill_user', JSON.stringify(user));
    }

    // ==================== ENHANCED ERROR CATEGORIES ====================

    static ErrorTypes = {
        NETWORK: 'network_error',
        AUTH: 'authentication_error',
        VALIDATION: 'validation_error',
        SERVER: 'server_error',
        CLIENT: 'client_error',
        TIMEOUT: 'timeout_error'
    };




    // The rest of your existing methods remain the same, but will benefit from the enhanced error handling...
    // [Keep all your existing methods like getUserProfile, createStory, etc. - they'll work with the new error handling]

  // ==================== USER PROFILE & SOCIAL FEATURES ====================

    async getUserProfile(username) {
        return this.request(`/users/profile/${username}`);
    }
    
    async updateUserProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: profileData
        });
    }

    async updateAvatar(avatarData) {
        return this.request('/users/avatar', {
            method: 'PUT',
            body: avatarData
        });
    }

    async applyAuthor(applicationData) {
        return this.request('/users/apply-author', {
            method: 'POST',
            body: applicationData
        });
    }

    async toggleFollow(userId) {
        return this.request(`/users/${userId}/follow`, {
            method: 'POST'
        });
    }

    async getFollowStatus(userId) {
        return this.request(`/users/${userId}/follow-status`);
    }

    async getMutualFollowers(userId) {
        return this.request(`/users/${userId}/mutual-followers`);
    }

    async getFollowList(userId, type) {
        return this.request(`/users/${userId}/${type}`);
    }

    // Get stories by specific author (username)
    async getAuthorStories(authorUsername, page = 1, limit = 10) {
        const queryParams = new URLSearchParams({
            author: authorUsername,
            page,
            limit,
            status: 'published'
        }).toString();
        return this.request(`/stories?${queryParams}`);
    }

    // Follow/Unfollow user (toggle)
    async toggleFollow(userId) {
        return this.request(`/users/${userId}/follow`, {
            method: 'POST'
        });
    }

    // Get follow status between current user and target user
    async getFollowStatus(userId) {
        return this.request(`/users/${userId}/follow-status`);
    }

    // Check if story is in reading list
    async getStoryReadingStatus(storyId) {
        return this.request(`/stories/${storyId}/user-interactions`);
    }

    // ADD these methods to api-service.js
    async getAuthorStats() {
        return this.request('/users/stats/me');
    }

    async getAuthorEngagementStats() {
        return this.request('/users/engagement-stats');
    }

    async getAuthorRecentComments() {
        return this.request('/users/comments/recent');
    }

    async getAuthorFollowersStats() {
        return this.request('/users/followers/stats');
    }
    
    
    // ==================== CATEGORIES API ====================

/**
 * Get all active categories
 * @returns {Promise<Object>} Response with categories array
 */
async getCategories() {
    return this.request('/categories');
}

/**
 * Get category by slug
 * @param {string} slug - Category slug
 * @returns {Promise<Object>} Response with category data
 */
async getCategory(slug) {
    return this.request(`/categories/${slug}`);
}

/**
 * Get stories for a specific category
 * @param {string} slug - Category slug
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.status - Story status filter
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort direction ('asc' or 'desc')
 * @returns {Promise<Object>} Response with category stories
 */
async getCategoryStories(slug, options = {}) {
    const { 
        page = 1, 
        limit = 20, 
        status = 'published', 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
    } = options;
    
    const queryParams = new URLSearchParams({
        page,
        limit,
        status,
        sortBy,
        sortOrder
    }).toString();
    
    return this.request(`/categories/${slug}/stories?${queryParams}`);
} 

/**
 * Get category statistics and guidelines
 * @param {string} slug - Category slug
 * @returns {Promise<Object>} Response with category stats and guidelines
 */
async getCategoryStats(slug) {
    return this.request(`/categories/${slug}/stats`);
}

/**
 * Create a new category (Admin only)
 * @param {Object} categoryData - Category data including name, description, etc.
 * @returns {Promise<Object>} Response with created category
 */
async createCategory(categoryData) {
    return this.request('/categories', {
        method: 'POST',
        body: categoryData
    });
}

/**
 * Update a category (Admin only)
 * @param {string} id - Category ID
 * @param {Object} categoryData - Updated category data
 * @returns {Promise<Object>} Response with updated category
 */
async updateCategory(id, categoryData) {
    return this.request(`/categories/${id}`, {
        method: 'PUT',
        body: categoryData
    });
}

/**
 * Delete a category (Admin only)
 * @param {string} id - Category ID
 * @returns {Promise<Object>} Response with success message
 */
async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
        method: 'DELETE'
    });
}


    // ==================== STORY MANAGEMENT (MULTI-PAGE SUPPORT) ====================

    async createStory(storyData) {
        return this.request('/stories', {
            method: 'POST',
            body: storyData
        });
    }

    async getStories(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.request(`/stories?${queryParams}`);
    }

    async getStory(storyId) {
        return this.request(`/stories/${storyId}`);
    }

    async updateStory(storyId, storyData) {
        return this.request(`/stories/${storyId}`, {
            method: 'PUT',
            body: storyData
        });
    }

    async deleteStory(storyId) {
        return this.request(`/stories/${storyId}`, {
            method: 'DELETE'
        });
    }

    async getUserStories(status = null) {
        const query = status ? `?status=${status}` : '';
        return this.request(`/users/stories/me${query}`);
    }
    
    
    // ==================== STORY SEARCH & FILTERING ====================

/**
 * Get stories by category
 * @param {string} category - Category name
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.status - Story status
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort direction
 * @returns {Promise<Object>} Response with stories
 */
async getStoriesByCategory(category, options = {}) {
    const { 
        page = 1, 
        limit = 20, 
        status = 'published',
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;
    
    const queryParams = new URLSearchParams({
        category,
        page,
        limit,
        status,
        sortBy,
        sortOrder
    }).toString();
    
    return this.request(`/stories?${queryParams}`);
}

/**
 * Search stories by title, excerpt, or tags
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.category - Filter by category
 * @param {string} options.status - Story status
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort direction
 * @returns {Promise<Object>} Response with stories
 */
async getStoriesBySearch(query, options = {}) {
    const { 
        page = 1, 
        limit = 20,
        category,
        status = 'published',
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;
    
    const queryParams = new URLSearchParams({
        q: query,
        page,
        limit,
        status,
        sortBy,
        sortOrder
    });
    
    if (category) {
        queryParams.append('category', category);
    }
    
    return this.request(`/stories/search?${queryParams.toString()}`);
}

/**
 * Get stories by author (username or ID)
 * @param {string} author - Author username (with or without @) or ID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.status - Story status
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort direction
 * @returns {Promise<Object>} Response with stories and author info
 */
async getStoriesByAuthor(author, options = {}) {
    const { 
        page = 1, 
        limit = 20,
        status = 'published',
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;
    
    const queryParams = new URLSearchParams({
        author,
        page,
        limit,
        status,
        sortBy,
        sortOrder
    }).toString();
    
    return this.request(`/stories?${queryParams}`);
}

    // ==================== PAGE MANAGEMENT ====================

    async getStoryPage(storyId, pageNumber = 1) {
        return this.request(`/stories/${storyId}/pages/${pageNumber}`);
    }

    async addPage(storyId, content, pageNumber = null) {
        const body = { content };
        if (pageNumber) body.pageNumber = pageNumber;
        
        return this.request(`/stories/${storyId}/pages`, {
            method: 'POST',
            body: body
        });
    }

    async updatePage(storyId, pageNumber, content) {
        return this.request(`/stories/${storyId}/pages/${pageNumber}`, {
            method: 'PUT',
            body: { content }
        });
    }

    async deletePage(storyId, pageNumber) {
        return this.request(`/stories/${storyId}/pages/${pageNumber}`, {
            method: 'DELETE'
        });
    }

    // ==================== READING PROGRESS & ENGAGEMENT ====================

    async updateReadingProgress(storyId, currentPage, timeSpent = 0) {
        return this.request(`/stories/${storyId}/reading-progress`, {
            method: 'POST',
            body: { currentPage, timeSpent }
        });
    }

    async getReadingProgress(storyId) {
        return this.request(`/stories/${storyId}/reading-progress`);
    }

    async trackPageView(storyId, pageNumber = 1) {
        return this.request(`/stories/${storyId}/track-view`, {
            method: 'POST',
            body: { pageNumber }
        });
    }


async likeStory(storyId) {
        return this.request(`/stories/${storyId}/like`, {
            method: 'POST'
        });
    }

    async rateStory(storyId, rating) {
        return this.request(`/stories/${storyId}/rate`, {
            method: 'POST',
            body: { rating }
        });
    }

    async addToReadingList(storyId) {
        return this.request(`/stories/${storyId}/reading-list`, {
            method: 'POST'
        });
    }

    async removeFromReadingList(storyId) {
        return this.request(`/stories/${storyId}/reading-list`, {
            method: 'DELETE'
        });
    }

    async getReadingList() {
        return this.request('/users/reading-list/me');
    }

    // ==================== COMMENTS & INTERACTIONS ====================

    async addComment(commentData) {
        return this.request('/comments', {
            method: 'POST',
            body: commentData
        });
    }

    async getStoryComments(storyId, options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.request(`/comments/story/${storyId}?${queryParams}`);
    }

    async updateComment(commentId, commentData) {
        return this.request(`/comments/${commentId}`, {
            method: 'PUT',
            body: commentData
        });
    }

    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, {
            method: 'DELETE'
        });
    }
 
    async getUserComments() {
        return this.request('/users/comments/me');
    }

    // ==================== ADMIN DASHBOARD ====================

    async getAdminStats() {
        return this.request('/admin/dashboard-stats');
    }

    async getPlatformAnalytics() {
        return this.request('/admin/analytics');
    }

    async getUsers(page = 1, limit = 10, search = '') {
        const queryParams = new URLSearchParams({ page, limit, search }).toString();
        return this.request(`/admin/users?${queryParams}`);
    }

    async updateUser(userId, userData) {
        return this.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: userData
        });
    }

    async getAnnouncements(){
        return this.request('/admin/announcements');
    }

    async createAnnouncement(announcementData){
        return this.request('/admin/announcements', {
            method: 'POST',
            body: announcementData
        });
    }

    async deleteAnnouncement(id){
        return this.request(`/admin/announcements/${id}`,{
            method: 'DELETE'
        });
    }

    async getBadges(){
        return this.request('/admin/badges');
    }

    async createBadge(badgeData){
        return this.request('/admin/badges', {
            method: 'POST',
            body: badgeData
        });
    }

    async updateBadge(id, badgeData){
        return this.request(`/admin/badges/${id}`, {
            method: 'PUT',
            body: badgeData
        });
    }  

    async deleteBadge(id){
        return (`/admin/badges/${id}`, {
            method: 'DELETE'
        });
    }

    async suspendUser(userId, reason) {
        return this.request(`/admin/users/${userId}/suspend`, {
            method: 'POST',
            body: { reason }
        });
    }

    async activateUser(userId) {
        return this.request(`/admin/users/${userId}/activate`, {
            method: 'POST'
        });
    }

    async getAuthors(status = 'approved') {
        const query = status ? `?${status}` : '?pending';
        return this.request(`/admin/authors${query}`);
    }

    async approveAuthor(userId) {
        return this.request(`/admin/authors/${userId}/approve`, {
            method: 'POST'
        });
    }

    async rejectAuthor(userId, reason) {
        return this.request(`/admin/authors/${userId}/reject`, {
            method: 'POST',
            body: { reason }
        });
    }

    async getPendingStories() {
        return this.request('/admin/stories/pending');
    }

    async approveStory(storyId) {
        return this.request(`/admin/stories/${storyId}/approve`, {
            method: 'POST'
        });
    }

    async rejectStory(storyId, reason) {
        return this.request(`/admin/stories/${storyId}/reject`, {
            method: 'POST',
            body: { reason } 
        });
    }

    async getFlaggedComments() {
        return this.request('/admin/comments/flagged');
    }

    async moderateComment(commentId, action, reason) {
        return this.request(`/admin/comments/${commentId}/moderate`, {
            method: 'POST',
            body: { action, reason }
        });
    }

    // ==================== CONTEST MANAGEMENT ====================

    async getContests(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.request(`/contests?${queryParams}`);
    }

    async getContest(contestId) {
        return this.request(`/contests/${contestId}`);
    }

    async joinContest(contestId) {
        return this.request(`/contests/${contestId}/join`, {
            method: 'POST'
        });
    }

    async submitToContest(contestId, storyId) {
        return this.request(`/contests/${contestId}/submit`, {
            method: 'POST',
            body: { storyId }
        });
    }



// ==================== PROFILE PICTURE UPLOAD ====================

async uploadAvatar(imageBase64) {
    return this.request('/upload/avatar', {
        method: 'POST',
        body: { imageBase64 }
    });
}

async removeAvatar() {
    return this.request('/upload/avatar', {
        method: 'DELETE'
    });
}

// ==================== ENHANCED FILE UPLOAD ====================

    async uploadFile(file, endpoint = '/upload') {
        // For base64 images, use the dedicated avatar endpoint
        if (typeof file === 'string' && file.startsWith('data:image/')) {
            return this.uploadAvatar(file);
        }

        // For FormData files (if you add later)
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('File upload failed');
        }

        return response.json();
    }




    // ==================== HEALTH CHECK & MONITORING ====================

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`, { 
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) return false;
            
            const data = await response.json();
            return data.success === true;
            
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    // Get API status with detailed information
    async getApiStatus() {
        try {
            const response = await this.request('/health');
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: this.getEnvironment(),
                ...response
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                environment: this.getEnvironment(),
                error: error.message
            };
        }
    }
}




//////////////////////////////////////////////////////////////////////////




// Enhanced Auth Manager with production improvements
class AuthManager {
    static isAuthenticated() {
        const token = localStorage.getItem('velvetquill_token');
        if (!token) return false;

        // Basic token validation (check expiry if JWT)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp && Date.now() >= payload.exp * 1000;
            return !isExpired;
        } catch {
            // If token is not a JWT, assume it's valid
            return true;
        }
    }

    static getCurrentUser() {
        const userData = localStorage.getItem('velvetquill_user');
        return userData ? JSON.parse(userData) : null;
    }

    static getToken() {
        return localStorage.getItem('velvetquill_token');
    }

    static isAuthor() {
        const user = this.getCurrentUser();
        return user ? (user.isAuthor || user.role === 'author' || user.role === 'overallAdmin') : false;
    }

    static isAdmin() {
        const user = this.getCurrentUser();
        return user ? (user.role === 'admin' || user.role === 'overallAdmin') : false;
    }

    static async logout() {
        const apiService = window.apiService;
        
        try {
            if (apiService) {
                await apiService.logout();
            }
        } catch (error) {
            console.warn('Backend logout failed, clearing local session:', error);
        } finally {
            // Clear all auth-related data
            localStorage.removeItem('velvetquill_token');
            localStorage.removeItem('velvetquill_user');
            localStorage.removeItem('velvetquill_user_session');
            localStorage.removeItem('velvetquill_remember_me');
            localStorage.removeItem('velvetquill_last_identifier');
            
            // Redirect to home page
            window.location.href = '/index.html';
        }
    }

    static requireAuth(redirectUrl = '/signin.html') {
        if (!this.isAuthenticated()) {
            // Store current URL for post-login redirect
            sessionStorage.setItem('redirect_after_login', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    static requireAuthor(redirectUrl = '/signin.html') {
        if (!this.isAuthenticated()) {
            sessionStorage.setItem('redirect_after_login', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        
        if (!this.isAuthor()) {
            alert('Author access required');
            window.location.href = '/index.html';
            return false;
        }
        
        return true;
    }

    static requireAdmin(redirectUrl = '/signin.html') {
        if (!this.isAuthenticated()) {
            sessionStorage.setItem('redirect_after_login', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        
        if (!this.isAdmin()) {
            alert('Admin access required');
            window.location.href = '/index.html';
            return false;
        }
        
        return true;
    }

    // Enhanced session verification
    static async verifySession() {
        try {
            const apiService = window.apiService;
            if (!apiService || !this.isAuthenticated()) {
                return false;
            }
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Verification timeout')), 8000)
            );
            
            const verificationPromise = apiService.verifyToken();
            const response = await Promise.race([verificationPromise, timeoutPromise]);
            
            return response.success === true;
            
        } catch (error) {
            console.error('Session verification failed:', error);
            
            // Only logout for specific auth errors
            const shouldLogout = error.message.includes('Session expired') || 
                               error.message.includes('Unauthorized') ||
                               error.message.includes('401') ||
                               error.message.includes('Invalid token') ||
                               error.message.includes('jwt');
            
            if (shouldLogout) {
                return false;
            } else {
                // For network errors, maintain session but log warning
                console.warn('Maintaining session despite verification error');
                return true;
            }
        }
    }

    // Handle post-login redirect
    static handlePostLoginRedirect() {
        const redirectUrl = sessionStorage.getItem('redirect_after_login');
        if (redirectUrl && redirectUrl !== window.location.href) {
            sessionStorage.removeItem('redirect_after_login');
            window.location.href = redirectUrl;
        }
    }
}

// Initialize API service with error protection
function initializeApiService() {
    try {
        window.apiService = new ApiService();
        window.AuthManager = AuthManager;
        
        console.log('✅ API Service initialized successfully');
        
        // Auto-verify session on page load
        document.addEventListener('DOMContentLoaded', async () => {
            if (AuthManager.isAuthenticated()) {
                const isValid = await AuthManager.verifySession();
                if (!isValid) {
                    console.warn('Session invalid, logging out...');
                    await AuthManager.logout();
                } else {
                    console.log('✅ Session verified');
                }
            }
            
            // Handle post-login redirects
            AuthManager.handlePostLoginRedirect();
        });
        
    } catch (error) {
        console.error('❌ Failed to initialize API Service:', error);
        // Fallback: create basic service without enhanced features
        window.apiService = {
            baseURL: 'https://velvetquill-backend.onrender.com/api',
            request: async () => { throw new Error('API Service not properly initialized'); }
        };
    }
}

// Initialize the service
initializeApiService();





