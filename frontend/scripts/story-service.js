
/**
 * Story Service - Handles all API interactions for stories
 * Separated service layer for clean architecture
 */
class StoryService {
    constructor() {
        this.baseService = window.apiService;
    }

    /**
     * Get featured stories from API
     * @returns {Promise<Array>} Array of featured stories
     */
    async getFeaturedStories() {
        try {
            console.log('📚 Fetching featured stories from API...');
            const response = await this.baseService.getFeaturedStories();
            
            if (!response.success) {
                throw new Error('Failed to fetch featured stories');
            }

            return this.processFeaturedStories(response.stories);
        } catch (error) {
            console.error('❌ StoryService Error:', error);
            throw new Error(`Unable to load featured stories: ${error.message}`);
        }
    }

    /**
     * Process and filter featured stories
     * @param {Array} stories - Raw stories from API
     * @returns {Array} Processed featured stories
     */
    processFeaturedStories(stories) {
        if (!stories || !Array.isArray(stories)) {
            return [];
        }

        // Filter only featured stories and limit to 10
        const featuredStories = stories
            .filter(story => story.isFeatured === true)
            .slice(0, 10)
            .map(story => this.enrichStoryData(story));

        console.log(`⭐ Found ${featuredStories.length} featured stories`);
        return featuredStories;
    }

    /**
     * Enrich story data with computed properties
     * @param {Object} story - Raw story data
     * @returns {Object} Enriched story data
     */
    enrichStoryData(story) {
        const stats = story.stats || {};
        const metadata = story.metadata || {};
        const author = story.author || {};

        return {
            ...story,
            displayStats: {
                views: stats.views || 0,
                likes: stats.likesCount || 0,
                readingTime: metadata.totalReadingTime || 0,
                rating: stats.averageRating || 0
            },
            displayAuthor: {
                name: author.displayName || author.username || 'Anonymous Author',
                initials: this.getAuthorInitials(author),
                isAuthor: author.isAuthor || false
            },
            safeExcerpt: this.truncateExcerpt(story.excerpt, 150)
        };
    }

    /**
     * Get author initials for avatar
     * @param {Object} author - Author object
     * @returns {string} Author initials
     */
    getAuthorInitials(author) {
        const name = author.displayName || author.username || 'A';
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    /**
     * Truncate excerpt for display
     * @param {string} excerpt - Story excerpt
     * @param {number} length - Max length
     * @returns {string} Truncated excerpt
     */
    truncateExcerpt(excerpt, length = 150) {
        if (!excerpt) return '';
        
        const cleanExcerpt = this.escapeHtml(excerpt);
        return cleanExcerpt.length > length 
            ? cleanExcerpt.substring(0, length) + '...' 
            : cleanExcerpt;
    }

    /**
     * Escape HTML for safe display
     * @param {string} unsafe - Unsafe text
     * @returns {string} Safe HTML
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        const div = document.createElement('div');
        div.textContent = unsafe;
        return div.innerHTML;
    }
}


