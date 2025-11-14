
// category-stories.js - Handles category stories with pagination
class CategoryStories {
    constructor() {
        this.storiesContainer = document.getElementById('recent-stories');
        this.paginationContainer = document.getElementById('pagination');
        this.storiesPerPage = 50; // Max 50 stories per page
        this.currentPage = 1;
        this.currentCategory = 'all';
        this.totalStories = 0;
        this.totalPages = 0;
    }

    // Initialize category stories page
    async init() {
        if (!this.isCategoryStoriesPage()) return;
        
        await this.loadCategoryFromURL();
        await this.loadCategoryStories();
        this.setupEventListeners();
    }

    // Check if current page is category-stories page
    isCategoryStoriesPage() {
        return window.location.pathname.includes('category-stories.html');
    }

    // Load category from URL parameters
    loadCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentCategory = urlParams.get('category') || 'all';
        this.currentPage = parseInt(urlParams.get('page')) || 1;
        
        // Update page title based on category
        this.updatePageTitle();
    }

    // Update page title based on category
    updatePageTitle() {
        const categoryTitle = this.currentCategory === 'all' ? 'All Stories' : 
                            this.currentCategory.charAt(0).toUpperCase() + this.currentCategory.slice(1) + ' Stories';
        
        document.title = `${categoryTitle} - VelvetQuill`;
        
        // Update any category title element if exists
        const categoryTitleElement = document.getElementById('category-title');
        if (categoryTitleElement) {
            categoryTitleElement.textContent = categoryTitle;
        }
    }

    // Load stories for current category and page
    async loadCategoryStories() {
        try {
            // Show loading state
            if (this.storiesContainer) {
                this.storiesContainer.innerHTML = '<p>Loading stories...</p>';
            }

            let response;
            
            if (this.currentCategory === 'all') {
                // Get all published stories
                response = await window.apiService.getStories({
                    page: this.currentPage,
                    limit: this.storiesPerPage,
                    status: 'published',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                });
            } else {
                // Get stories by specific category
                response = await window.apiService.getStoriesByCategory(this.currentCategory, {
                    page: this.currentPage,
                    limit: this.storiesPerPage,
                    status: 'published',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                });
            }

            const stories = response.stories || response.data || response;
            this.totalStories = response.total || response.count || stories.length;
            this.totalPages = Math.ceil(this.totalStories / this.storiesPerPage);

            // Render stories and pagination
            this.renderStories(stories);
            this.renderPagination();
            
        } catch (error) {
            console.error('Error loading category stories:', error);
            if (this.storiesContainer) {
                this.storiesContainer.innerHTML = '<p>Error loading stories. Please try again later.</p>';
            }
        }
    }

    // Render stories to the container
    renderStories(stories) {
        if (!this.storiesContainer) return;
        
        if (!stories || stories.length === 0) {
            this.storiesContainer.innerHTML = `
                <div class="no-stories">
                    <p>No stories found in this category.</p>
                    <a href="index.html" class="back-link">← Back to Home</a>
                </div>
            `;
            return;
        }

        const storiesHTML = stories.map(story => `
            <div class="story-card" data-story-id="${story.id}">
                <h3 class="story-title">${this.escapeHtml(story.title)}</h3>
                <p class="story-excerpt">${this.escapeHtml(story.excerpt || story.content?.substring(0, 300) || '')}...</p>
                <div class="story-meta">
                    <span class="story-author">By ${this.escapeHtml(story.author?.displayName || story.author?.username || 'Unknown')}</span>
                    <span class="story-category">${this.escapeHtml(story.category)}</span>
                    <span class="story-date">${new Date(story.createdAt).toLocaleDateString()}</span>
                    <span class="story-stats">
                        ${story.stats?.views || 0} views • 
                        ${story.stats?.likes || 0} likes • 
                        ${story.stats?.comments || 0} comments
                    </span>
                </div>
                <a href="story-reader.html?story=${story.id}" class="read-story-btn">Read Story</a>
            </div>
        `).join('');

        this.storiesContainer.innerHTML = storiesHTML;
    }

    // Render pagination buttons
    renderPagination() {
        if (!this.paginationContainer || this.totalPages <= 1) return;

        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <a href="${this.getPageURL(this.currentPage - 1)}" class="pagination-link prev">
                    ← Previous
                </a>
            `;
        }

        // Page numbers - show limited range around current page
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="pagination-current">${i}</span>`;
            } else {
                paginationHTML += `
                    <a href="${this.getPageURL(i)}" class="pagination-link">
                        ${i}
                    </a>
                `;
            }
        }

        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `
                <a href="${this.getPageURL(this.currentPage + 1)}" class="pagination-link next">
                    Next →
                </a>
            `;
        }

        paginationHTML += '</div>';
        
        // Add results count
        const startItem = (this.currentPage - 1) * this.storiesPerPage + 1;
        const endItem = Math.min(this.currentPage * this.storiesPerPage, this.totalStories);
        
        paginationHTML += `
            <div class="pagination-info">
                Showing ${startItem}-${endItem} of ${this.totalStories} stories
            </div>
        `;

        this.paginationContainer.innerHTML = paginationHTML;
    }

    // Get URL for specific page
    getPageURL(page) {
        const urlParams = new URLSearchParams({
            category: this.currentCategory,
            page: page
        });
        return `category-stories.html?${urlParams.toString()}`;
    }

    // Setup event listeners
    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.loadCategoryFromURL();
            this.loadCategoryStories();
        });
    }

    // Utility function to escape HTML
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const categoryStories = new CategoryStories();
    categoryStories.init();
});
