

// category-stories.js - Refactored with Integrated Pagination

class CategoryStories {
    constructor() {
        this.storiesContainer = $('#stories-container');
        this.paginationContainer = $('#pagination-container');
        this.loadingIndicator = $('#loading-indicator');
        this.noStoriesMessage = $('#no-stories-message');
        
        this.storiesPerPage = 24; // Default from HTML select
        this.currentPage = 1;
        this.currentCategory = 'all';
        this.totalStories = 0;
        this.totalPages = 0;
        
        // Current category info
        this.currentCategoryData = {
            title: 'Loading...',
            description: 'Loading category information...',
            color: '#8B0000'
        };
    }

    // Initialize the category page
    async init() {
        await this.loadCategoryFromURL();
        await this.loadCategoryData();
        this.updateCategoryHeader();
        this.initializeCategoriesList();
        this.loadRelatedCategories();
        this.setupEventListeners();
        await this.loadCategoryStories();
    }

    // Load category from URL parameters
    loadCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentCategory = urlParams.get('category') || 'romance';
        this.currentPage = parseInt(urlParams.get('page')) || 1;
        
        console.log(`CATEGORY SLUG: ${this.currentCategory}, PAGE: ${this.currentPage}`);
    }

    // Load category data from backend
    async loadCategoryData() {
        try {
            console.log(`Loading category data for: ${this.currentCategory}`);
            
            // Fetch category object from database
            const response = await window.apiService.getCategory(this.currentCategory);
            
            if (response && response.success) {
                this.currentCategoryData = {
                    title: response.category.name,
                    description: response.category.description,
                    color: response.category.color || '#8B0000',
                    icon: response.category.icon,
                    slug: response.category.slug
                };
                console.log('Category data loaded:', this.currentCategoryData);
            } else {
                throw new Error('Failed to load category data');
            }
        } catch (error) {
            console.error('Error loading category data:', error);
            // Fallback to basic category info
            this.currentCategoryData = {
                title: this.currentCategory.charAt(0).toUpperCase() + this.currentCategory.slice(1),
                description: `Stories in the ${this.currentCategory} category`,
                color: '#8B0000'
            };
            M.toast({
                html: 'Failed to load category details',
                classes: 'warning-toast'
            });
        }
    }

    // Update category header with current category info
    updateCategoryHeader() {
        $('#category-title').text(this.currentCategoryData.title);
        $('#category-description').text(this.currentCategoryData.description);
        $('#current-category-breadcrumb').text(this.currentCategoryData.title);
        
        // Update header background with category color
        $('.category-header').css({
            'background': `linear-gradient(135deg, ${this.currentCategoryData.color}, var(--accent-color))`
        });

        // Update page title
        document.title = `${this.currentCategoryData.title} Stories - VelvetQuill`;
    }

    // Initialize categories list
    initializeCategoriesList() {
        $('.category-link').on('click', function(e) {
            e.preventDefault();
            $('.category-link').removeClass('active');
            $(this).addClass('active');
            const category = $(this).data('category');
            
            // Update URL without page parameter when changing categories
            const urlParams = new URLSearchParams({ category });
            window.location.href = `category-stories.html?${urlParams.toString()}`;
        });
    }

    // Load stories from backend API with pagination
    async loadCategoryStories() {
        try {
            this.showLoadingState(true);
            
            console.log(`Loading stories for category: ${this.currentCategoryData.title}, page: ${this.currentPage}`);
            
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
                response = await window.apiService.getStoriesByCategory(this.currentCategoryData.title, {
                    page: this.currentPage,
                    limit: this.storiesPerPage,
                    status: 'published',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                });
            }

            let stories = [];
            this.totalStories = 0;

            if (response && response.success) {
                stories = response.stories || [];
                this.totalStories = response.total || response.count || stories.length;
                console.log(`Loaded ${stories.length} stories for category (total: ${this.totalStories})`);
            } else {
                console.error('Invalid response format:', response);
                throw new Error('Invalid response from server');
            }
            
            this.displayStories(stories);
            this.updateStoriesCount(stories.length, this.totalStories);
            this.renderPagination();
            
        } catch (error) {
            console.error('Error loading category stories:', error);
            M.toast({
                html: 'Failed to load stories. Please try again.',
                classes: 'error-toast'
            });
            this.displayStories([]);
        } finally {
            this.showLoadingState(false);
        }
    }

    // Display stories in the container
    displayStories(stories) {
        this.storiesContainer.empty();
        
        if (!stories || stories.length === 0) {
            this.noStoriesMessage.show();
            this.storiesContainer.hide();
            return;
        }
        
        this.noStoriesMessage.hide();
        this.storiesContainer.show();
        
        stories.forEach(story => {
            const storyCard = this.createStoryCard(story);
            this.storiesContainer.append(storyCard);
        });
        
        // Add click handlers for story cards
        this.attachStoryEventHandlers();
    }

    // Create story card HTML
    createStoryCard(story) {
        const excerpt = story.excerpt || (story.content ? story.content.substring(0, 150) + '...' : 'No excerpt available');
        const rating = story.stats?.averageRating || story.rating || 0;
        const views = story.stats?.views || story.stats?.viewCount || 0;
        const likesCount = story.stats?.likesCount || story.stats?.likes || 0;
        const commentCount = story.stats?.commentCount || story.stats?.comments || 0;
        
        // Handle author display
        let authorName = 'Unknown Author';
        if (story.author) {
            authorName = story.author.displayName || story.author.username || 'Unknown Author';
        }

        const storyId = story._id || story.id;
        
        return `
            <div class="col s12 m6 l4">
                <div class="card story-card hoverable">
                    <div class="card-content">
                        <span class="card-title">${this.escapeHtml(story.title || 'Untitled Story')}</span>
                        <span class="category-chip">${this.escapeHtml(story.category || this.currentCategoryData.title)}</span>
                        <p class="truncate">${this.escapeHtml(excerpt)}</p>
                        <div class="story-meta">
                            <div class="author-info">
                                <i class="material-icons tiny">person</i>
                                <span>${this.escapeHtml(authorName)}</span>
                            </div>
                            <div class="story-stats">
                                <span><i class="material-icons tiny">star</i> ${rating.toFixed(1)}</span>
                                <span><i class="material-icons tiny">visibility</i> ${views}</span>
                                <span><i class="material-icons tiny">favorite</i> ${likesCount}</span>
                                <span><i class="material-icons tiny">comment</i> ${commentCount}</span>
                            </div>
                        </div>
                        <div class="story-date">
                            <i class="material-icons tiny">schedule</i>
                            ${story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Unknown date'}
                        </div>
                    </div>
                    <div class="card-action">
                        <a href="story-read.html?id=${storyId}" class="read-story waves-effect waves-light btn" data-id="${storyId}">
                            Read Story
                        </a>
                        ${AuthManager.isAuthenticated() ? `
                            <a href="#" class="btn-floating btn-small waves-effect waves-light red right like-story" data-id="${storyId}">
                                <i class="material-icons">favorite_border</i>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Attach event handlers to story elements
    attachStoryEventHandlers() {
        // Read story handlers
        $('.read-story').on('click', function(e) {
            e.preventDefault();
            const storyId = $(this).data('id');
            window.location.href = `story-read.html?id=${storyId}`;
        });
        
        // Like story handlers
        $('.like-story').on('click', this.handleLikeStory.bind(this));
    }

    // Handle like story functionality
    async handleLikeStory(e) {
        e.preventDefault();
        if (!AuthManager.isAuthenticated()) {
            M.toast({html: 'Please sign in to like stories', classes: 'warning-toast'});
            return;
        }
        
        const storyId = $(this).data('id');
        const $icon = $(this).find('i');
        const $button = $(this);
        
        try {
            const response = await window.apiService.likeStory(storyId);
            
            if (response.success) {
                if (response.isLiked) {
                    $icon.text('favorite');
                    $button.addClass('liked');
                    M.toast({html: 'Story liked!', classes: 'success-toast'});
                } else {
                    $icon.text('favorite_border');
                    $button.removeClass('liked');
                    M.toast({html: 'Like removed', classes: 'info-toast'});
                }
                
                // Update the likes count in the story card
                const $stats = $button.closest('.story-card').find('.story-stats');
                const $likesSpan = $stats.find('span:nth-child(3)');
                const currentLikes = parseInt($likesSpan.text().match(/\d+/)[0]) || 0;
                const newLikes = response.isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
                $likesSpan.html(`<i class="material-icons tiny">favorite</i> ${newLikes}`);
            }
        } catch (error) {
            console.error('Error liking story:', error);
            M.toast({html: 'Failed to like story', classes: 'error-toast'});
        }
    }

    // Update stories count display
    updateStoriesCount(currentCount, totalCount) {
        const countText = totalCount === 1 ? '1 story' : `${currentCount} of ${totalCount} stories`;
        $('#stories-count').text(countText);
    }

    // Render pagination buttons
    renderPagination() {
        this.paginationContainer.empty();
        
        if (this.totalPages <= 1) return;

        let paginationHTML = '<ul class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <li class="waves-effect">
                    <a href="${this.getPageURL(this.currentPage - 1)}">
                        <i class="material-icons">chevron_left</i>
                    </a>
                </li>
            `;
        } else {
            paginationHTML += `<li class="disabled"><a href="#!"><i class="material-icons">chevron_left</i></a></li>`;
        }

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<li class="active"><a href="#!">${i}</a></li>`;
            } else {
                paginationHTML += `
                    <li class="waves-effect">
                        <a href="${this.getPageURL(i)}">${i}</a>
                    </li>
                `;
            }
        }

        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `
                <li class="waves-effect">
                    <a href="${this.getPageURL(this.currentPage + 1)}">
                        <i class="material-icons">chevron_right</i>
                    </a>
                </li>
            `;
        } else {
            paginationHTML += `<li class="disabled"><a href="#!"><i class="material-icons">chevron_right</i></a></li>`;
        }

        paginationHTML += '</ul>';
        
        // Add results count
        const startItem = (this.currentPage - 1) * this.storiesPerPage + 1;
        const endItem = Math.min(this.currentPage * this.storiesPerPage, this.totalStories);
        
        paginationHTML += `
            <div class="pagination-info center-align">
                <p>Showing ${startItem}-${endItem} of ${this.totalStories} stories</p>
            </div>
        `;

        this.paginationContainer.html(paginationHTML);
    }

    // Get URL for specific page
    getPageURL(page) {
        const urlParams = new URLSearchParams({
            category: this.currentCategory,
            page: page
        });
        return `category-stories.html?${urlParams.toString()}`;
    }

    // Show/hide loading state
    showLoadingState(loading) {
        if (loading) {
            this.loadingIndicator.show();
            this.storiesContainer.hide();
            this.paginationContainer.hide();
        } else {
            this.loadingIndicator.hide();
            this.storiesContainer.show();
            this.paginationContainer.show();
        }
    }

    // Load related categories from backend
    async loadRelatedCategories() {
        try {
            const response = await window.apiService.getCategories();
            const relatedContainer = $('#related-categories');
            relatedContainer.empty();
            
            if (response && response.success && response.categories) {
                // Filter out current category and get 4 random categories
                const otherCategories = response.categories
                    .filter(cat => cat.slug !== this.currentCategory && cat.isActive)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 4);
                
                otherCategories.forEach(category => {
                    const categoryCard = `
                        <div class="col s12 m6 l3">
                            <div class="card category-card">
                                <div class="card-content center-align">
                                    <h5>${category.name}</h5>
                                    <p class="truncate">${category.description || 'Explore stories in this category'}</p>
                                    <a href="category-stories.html?category=${category.slug}" class="btn waves-effect waves-light">
                                        Explore Stories
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                    relatedContainer.append(categoryCard);
                });
            }
        } catch (error) {
            console.error('Error loading related categories:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // View options
        $('.view-option').on('click', function() {
            $('.view-option').removeClass('active');
            $(this).addClass('active');
            const viewType = $(this).data('view');
            this.toggleViewType(viewType);
        }.bind(this));
        
        // Sort stories
        $('#sort-stories').on('change', function() {
            const sortBy = $(this).val();
            // In production, this should trigger a new API call with sorting
            M.toast({html: `Sorting by ${sortBy} - would reload from server in production`, classes: 'info-toast'});
        });

        // Stories per page
        $('#stories-per-page').on('change', function() {
            this.storiesPerPage = parseInt($(this).val());
            this.currentPage = 1; // Reset to first page
            this.loadCategoryStories();
        }.bind(this));

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.loadCategoryFromURL();
            this.loadCategoryStories();
        });
    }

    // Toggle between grid and list view
    toggleViewType(viewType) {
        this.storiesContainer.removeClass('grid-view list-view').addClass(`${viewType}-view`);
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
$(document).ready(function(){
    // Initialize Materialize components
    $('.sidenav').sidenav();
    $('.modal').modal();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();

    const categoryStories = new CategoryStories();
    categoryStories.init();
});


