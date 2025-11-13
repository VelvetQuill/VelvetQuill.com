
// index.js - Handles recent stories and "See All Stories" link for index page
class IndexStories {
    constructor() {
        this.storiesContainer = document.getElementById('recent-stories');
        this.paginationContainer = document.getElementById('pagination');
        this.maxStories = 20; // Maximum stories for index page
        this.setEventListeners();
    }

    // Initialize index page stories
    async init() {
        if (!this.isIndexPage()) return;
        
        await this.loadRecentStories();
        this.renderSeeAllLink();
    }

    // Check if current page is index page
    isIndexPage() {
        return window.location.pathname.endsWith('index.html') || 
               window.location.pathname === '/' || 
               window.location.pathname.endsWith('/');
    }

    // Load recent stories for index page (max 20)
    async loadRecentStories() {
        try {
            // Clear existing stories
            if (this.storiesContainer) {
                this.storiesContainer.innerHTML = '<p>Loading stories...</p>';
            }
            
            // Fetch recent stories using api-service
            const response = await window.apiService.getStories({
                limit: this.maxStories,
                status: 'published',
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });
            
            // Render stories (newest first - stack fashion)
            this.renderStories(response.stories || response.data || response);
            
        } catch (error) {
            console.error('Error loading recent stories:', error);
            if (this.storiesContainer) {
                this.storiesContainer.innerHTML = '<p>Error loading stories. Please try again later.</p>';
            }
        }
    }

    
setEventListeners() {
        $('.category-link').on('click', function () {
            $('.category-link').removeClass('active');
            $(this).addClass('active');
            const category = $(this).data('category');

            // Redirect after short delay
            setTimeout(() => {
                if (category === "home") {
                    window.location.href = "index.html";
                } else if (category === "all") {
                    window.location.href = "category-list.html";
                } else {
                    window.location.href = `./category-stories.html?category=${category}`;
                }
            }, 500);
        });
        console.log("INDEX LINKS LISTENERS SET !");
    }

    // Render stories to the container
    renderStories(stories) {
        if (!this.storiesContainer) return;
        
        if (!stories || stories.length === 0) {
            this.storiesContainer.innerHTML = '<p>No stories found.</p>';
            return;
        }

        const storiesHTML = stories.map(story => `
            <div class="story-card" data-story-id="${story.id}">
                <h3 class="story-title">${this.escapeHtml(story.title)}</h3>
                <p class="story-excerpt">${this.escapeHtml(story.excerpt || story.content?.substring(0, 200) || '')}...</p>
                <div class="story-meta">
                    <span class="story-author">By ${this.escapeHtml(story.author?.displayName || story.author?.username || 'Unknown')}</span>
                    <span class="story-category">${this.escapeHtml(story.category)}</span>
                    <span class="story-date">${new Date(story.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');

        this.storiesContainer.innerHTML = storiesHTML;
    }

    // Render "See All Stories" link for index page
    renderSeeAllLink() {
        if (this.paginationContainer) {
            this.paginationContainer.innerHTML = `
                <div class="see-all-stories">
                    <a href="category-stories.html?category=all" class="see-all-link">
                        See All Stories
                    </a>
                </div>
            `;
        }
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
    const indexStories = new IndexStories();
    indexStories.init();
});



