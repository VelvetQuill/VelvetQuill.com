


/**
 * Main Application Script
 * Handles UI interactions and coordinates with services
 */
class TopStories{
    constructor() {
        this.storyService = new StoryService();
        this.selectors = {
            container: '#storiesContainer',
            count: '#featuredCount',
            loading: '.loading-spinner'
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        //console.log('🚀 Initializing Top Stories App...');
        document.addEventListener('DOMContentLoaded', () => {
            this.loadStories();
            this.setupEventListeners();
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add any global event listeners here
        //console.log('🔧 Setting up event listeners...');
    }

    /**
     * Load and display featured stories
     */
    async loadStories() {
        try {
            this.showLoadingState();
            
            const stories = await this.storyService.getFeaturedStories();
            
            if (stories.length === 0) {
                this.showEmptyState();
            } else {
                this.displayStories(stories);
            }
            
        } catch (error) {
            console.error('💥 App Error:', error);
            this.showErrorState(error.message);
        }
    }

    /**
     * Display stories in the UI
     * @param {Array} stories - Array of story objects
     */
    displayStories(stories) {
        const storiesHTML = stories.map(story => this.createStoryCard(story)).join('');
        
        $(this.selectors.count).html(this.createCountText(stories.length));
        $(this.selectors.container).html(`
            <div class="row">
                ${storiesHTML}
            </div>
        `);
        
        //console.log('✅ Stories displayed successfully');
    }

    /**
     * Create HTML for a single story card
     * @param {Object} story - Story object
     * @returns {string} HTML string
     */
    createStoryCard(story) {
        return `
            <div class="col s12 m8 offset-m2 l6 offset-l3">
                <div class="story-card">
                    <div class="featured-badge">
                        <i class="material-icons tiny">star</i>
                        FEATURED
                    </div>
                    <div class="card-content">
                        <h3 class="story-title">${story.title}</h3>
                        
                        ${story.safeExcerpt ? `
                            <p class="story-excerpt">${story.safeExcerpt}</p>
                        ` : ''}
                        
                        <div class="story-stats">
                            <div class="stat-item">
                                <i class="material-icons tiny">visibility</i>
                                <span>${story.displayStats.views} views</span>
                            </div>
                            <div class="stat-item">
                                <i class="material-icons tiny">favorite</i>
                                <span>${story.displayStats.likes} likes</span>
                            </div>
                            <div class="stat-item">
                                <i class="material-icons tiny">schedule</i>
                                <span>${story.displayStats.readingTime} min read</span>
                            </div>
                        </div>
                        
                        <div class="author-info">
                            <div class="author-avatar">
                                ${story.displayAuthor.initials}
                            </div>
                            <div>
                                <div class="author-name">${story.displayAuthor.name}</div>
                                ${story.displayAuthor.isAuthor ? `
                                    <div class="author-badge">
                                        <i class="material-icons tiny">edit</i>
                                        Author
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="story-actions">
                            <a href="story-read.html?id=${story._id}" class="btn btn-sensual waves-effect">
                                <i class="material-icons left">book</i>
                                Read Story
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create featured count text
     * @param {number} count - Number of featured stories
     * @returns {string} Count text HTML
     */
    createCountText(count) {
        return `
            <i class="material-icons tiny">star</i>
            ${count} Featured ${count === 1 ? 'Story' : 'Stories'}
        `;
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        $(this.selectors.container).html(`
            <div class="loading-spinner">
                <div class="preloader-wrapper big active">
                    <div class="spinner-layer spinner-red-only">
                        <div class="circle-clipper left">
                            <div class="circle"></div>
                        </div>
                        <div class="gap-patch">
                            <div class="circle"></div>
                        </div>
                        <div class="circle-clipper right">
                            <div class="circle"></div>
                        </div>
                    </div>
                </div>
                <p>Discovering the finest stories...</p>
            </div>
        `);
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        $(this.selectors.count).html('No featured stories available');
        $(this.selectors.container).html(`
            <div class="empty-state">
                <i class="material-icons">star_border</i>
                <h3>No Featured Stories Yet</h3>
                <p>Check back later for captivating featured stories</p>
                <a href="index.html" class="btn btn-sensual waves-effect">
                    <i class="material-icons left">home</i>
                    Return Home
                </a>
            </div>
        `);
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    showErrorState(message) {
        $(this.selectors.container).html(`
            <div class="error-state">
                <i class="material-icons">error</i>
                <h3>Unable to Load Stories</h3>
                <p>${message}</p>
                <button class="btn btn-sensual waves-effect" onclick="topStoriesApp.loadStories()">
                    <i class="material-icons left">refresh</i>
                    Try Again
                </button>
            </div>
        `);
    }
}

// Initialize the application
const topStories = new TopStories();

