
// admin-stories.js - Simplified Admin Stories Manager
class AdminStoriesManager {
    constructor() {
        this.stories = [];
        this.categories = [];
        this.init();
    }

    async init() {
        try {
            // Wait for API service to be ready
            await this.waitForApiService();
            
            // Verify admin access
            if (!window.AuthManager || !window.AuthManager.isAdmin()) {
                window.location.href = 'admin-login.html';
                return;
            }

            this.bindEvents();
            await this.loadData();
            
        } catch (error) {
            console.error('Failed to initialize admin stories:', error);
            this.showError('Failed to load admin panel: ' + error.message);
        }
    }

    async waitForApiService() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkApi = () => {
                if (window.apiService && window.AuthManager) {
                    resolve();
                } else if (attempts > 50) { // 5 second timeout
                    reject(new Error('API service not available'));
                } else {
                    attempts++;
                    setTimeout(checkApi, 100);
                }
            };
            checkApi();
        });
    }

    bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshStories');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }

        // Retry button
        const retryBtn = document.getElementById('retryLoad');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.loadData());
        }
    }

    async loadData() {
        this.showLoading();
        this.hideError();

        try {
            // Load stories and categories in parallel
            const [storiesData, categoriesData] = await Promise.all([
                this.loadStories(),
                this.loadCategories()
            ]);

            this.stories = storiesData.stories || [];
            this.categories = categoriesData.categories || [];

            this.updateStatistics();
            this.renderStories();
            this.hideLoading();

        } catch (error) {
            console.error('Failed to load data:', error);
            this.hideLoading();
            this.showError('Failed to load data: ' + error.message);
        }
    }

    async loadStories() {
        try {
            // Try to get all stories using existing method
            return await window.apiService.getStories({ limit: 1000 });
        } catch (error) {
            console.error('Failed to load stories:', error);
            throw new Error('Could not load stories');
        }
    }

    async loadCategories() {
        try {
            // Use existing categories method
            return await window.apiService.getCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
            throw new Error('Could not load categories');
        }
    }

    updateStatistics() {
        // Update basic statistics
        const totalStories = this.stories.length;
        const publishedStories = this.stories.filter(s => s.status === 'published').length;
        const pendingStories = this.stories.filter(s => s.status === 'pending').length;
        const draftStories = this.stories.filter(s => s.status === 'draft').length;

        // Update DOM elements if they exist
        this.updateElementText('totalStories', totalStories);
        this.updateElementText('publishedStories', publishedStories);
        this.updateElementText('pendingStories', pendingStories);
        this.updateElementText('draftStories', draftStories);

        // Update category statistics
        this.updateCategoryStats();
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    updateCategoryStats() {
        const categoryStats = {};
        
        // Count stories per category
        this.stories.forEach(story => {
            const category = story.category || 'Uncategorized';
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        // Update category stats display
        const statsContainer = document.getElementById('categoryStats');
        if (statsContainer) {
            let statsHTML = '<h4>Stories by Category</h4>';
            
            Object.entries(categoryStats).forEach(([category, count]) => {
                statsHTML += `
                    <div class="category-stat">
                        <span class="category-name">${category}</span>
                        <span class="category-count">${count} stories</span>
                    </div>
                `;
            });

            statsContainer.innerHTML = statsHTML;
        }
    }

    renderStories() {
        const container = document.getElementById('storiesList');
        if (!container) return;

        if (this.stories.length === 0) {
            container.innerHTML = '<div class="no-stories">No stories found</div>';
            return;
        }

        let storiesHTML = '';
        
        this.stories.forEach(story => {
            const statusClass = `status-${story.status}`;
            const date = story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Unknown date';
            
            storiesHTML += `
                <div class="story-item ${statusClass}">
                    <div class="story-header">
                        <h4 class="story-title">${story.title || 'Untitled'}</h4>
                        <span class="story-status ${story.status}">${story.status}</span>
                    </div>
                    
                    <div class="story-meta">
                        <span class="author">By: ${story.author?.displayName || story.author?.username || 'Unknown'}</span>
                        <span class="category">Category: ${story.category || 'Uncategorized'}</span>
                        <span class="date">Created: ${date}</span>
                    </div>

                    <div class="story-stats">
                        <span class="stat">👁️ ${story.views || 0}</span>
                        <span class="stat">❤️ ${story.likes || 0}</span>
                        <span class="stat">💬 ${story.commentCount || 0}</span>
                    </div>

                    <div class="story-actions">
                        ${story.status === 'pending' ? 
                            `<button class="btn-success" onclick="adminStoriesManager.approveStory('${story._id}')">Approve</button>
                             <button class="btn-danger" onclick="adminStoriesManager.rejectStory('${story._id}')">Reject</button>` : ''}
                        
                        <button class="btn-info" onclick="adminStoriesManager.viewStory('${story._id}')">View</button>
                        <button class="btn-danger" onclick="adminStoriesManager.deleteStory('${story._id}')">Delete</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = storiesHTML;
    }

    // Story actions
    async approveStory(storyId) {
        if (confirm('Approve this story?')) {
            try {
                await window.apiService.approveStory(storyId);
                this.showSuccess('Story approved');
                this.loadData();
            } catch (error) {
                this.showError('Failed to approve story: ' + error.message);
            }
        }
    }

    async rejectStory(storyId) {
        const reason = prompt('Reason for rejection:');
        if (reason) {
            try {
                await window.apiService.rejectStory(storyId, reason);
                this.showSuccess('Story rejected');
                this.loadData();
            } catch (error) {
                this.showError('Failed to reject story: ' + error.message);
            }
        }
    }

    async viewStory(storyId) {
        try {
            const story = await window.apiService.getStory(storyId);
            this.showStoryModal(story);
        } catch (error) {
            this.showError('Failed to load story: ' + error.message);
        }
    }

    async deleteStory(storyId) {
        if (confirm('Delete this story? This cannot be undone.')) {
            try {
                await window.apiService.deleteStory(storyId);
                this.showSuccess('Story deleted');
                this.loadData();
            } catch (error) {
                this.showError('Failed to delete story: ' + error.message);
            }
        }
    }

    // Modal functions
    showStoryModal(story) {
        const modal = document.getElementById('storyDetailModal');
        const content = document.getElementById('storyDetailContent');
        
        if (!modal || !content) return;

        const date = story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Unknown';
        
        content.innerHTML = `
            <div class="story-detail">
                <h3>${story.title || 'Untitled'}</h3>
                
                <div class="detail-section">
                    <strong>Author:</strong> ${story.author?.displayName || story.author?.username || 'Unknown'}
                </div>
                
                <div class="detail-section">
                    <strong>Category:</strong> ${story.category || 'Uncategorized'}
                </div>
                
                <div class="detail-section">
                    <strong>Status:</strong> <span class="status-badge ${story.status}">${story.status}</span>
                </div>
                
                <div class="detail-section">
                    <strong>Created:</strong> ${date}
                </div>
                
                <div class="detail-section">
                    <strong>Excerpt:</strong>
                    <p>${story.excerpt || 'No excerpt available'}</p>
                </div>
                
                <div class="detail-section">
                    <strong>Stats:</strong>
                    <div class="stats-grid">
                        <span>Views: ${story.views || 0}</span>
                        <span>Likes: ${story.likes || 0}</span>
                        <span>Comments: ${story.commentCount || 0}</span>
                    </div>
                </div>
                
                ${story.tags && story.tags.length > 0 ? `
                <div class="detail-section">
                    <strong>Tags:</strong>
                    <div class="tags">${story.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
                </div>
                ` : ''}
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
    }

    // UI State Management
    showLoading() {
        const loading = document.getElementById('loadingState');
        const content = document.getElementById('contentArea');
        
        if (loading) loading.classList.remove('hidden');
        if (content) content.classList.add('hidden');
    }

    hideLoading() {
        const loading = document.getElementById('loadingState');
        const content = document.getElementById('contentArea');
        
        if (loading) loading.classList.add('hidden');
        if (content) content.classList.remove('hidden');
    }

    showError(message) {
        const errorElement = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorElement) {
            if (errorMessage) errorMessage.textContent = message;
            errorElement.classList.remove('hidden');
        } else {
            alert('Error: ' + message);
        }
    }

    hideError() {
        const errorElement = document.getElementById('errorState');
        if (errorElement) errorElement.classList.add('hidden');
    }

    showSuccess(message) {
        // Simple success notification
        alert('✅ ' + message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminStoriesManager = new AdminStoriesManager();
});


