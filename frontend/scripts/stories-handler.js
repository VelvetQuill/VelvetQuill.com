
// admin-stories.js - jQuery Version
$(document).ready(function() {
    const AdminStoriesManager = {
        stories: [],
        currentSort: { field: 'title', direction: 'asc' },

        init: function() {
            if (!this.checkAdminAccess()) return;

            this.setupEventListeners();
            this.loadStories();
        },

        checkAdminAccess: function() {
            if (!AuthManager.isAuthenticated()) {
                window.location.href = 'signin.html';
                return false;
            }

            if (!AuthManager.isAdmin()) {
                this.showToast('Access denied. Admin privileges required.', 'error');
                setTimeout(() => window.location.href = 'index.html', 2000);
                return false;
            }

            return true;
        },

        setupEventListeners: function() {
            // Refresh button
            $('#refresh-btn').on('click', () => this.loadStories());

            // Retry button
            $('#retry-btn').on('click', () => this.loadStories());

            // Search functionality
            /*$('#search-input').on('input', () => {
                clearTimeout(this.searchTimeou)
                this.filterStories(), 300)});*/

            // Sort functionality
            $('.sortable').on('click', (e) => {
                const field = $(e.currentTarget).data('sort');
                this.handleSort(field);
            });
        },

        async loadStories() {
            try {
                this.showLoadingState();
                this.hideErrorState();
                this.hideEmptyState();

                const response = await apiService.getStories({
                    status: 'published',
                    sortBy: this.currentSort.field,
                    sortOrder: this.currentSort.direction
                });

                if (response.success) {
                    this.stories = response.stories;
                    this.renderStories();
                    this.updateStats();
                    this.showToast('Stories loaded successfully', 'success');
                } else {
                    throw new Error('Failed to load stories');
                }
            } catch (error) {
                console.error('Error loading stories:', error);
                this.showErrorState('Failed to load stories. Please check your connection and try again.');
            }
        },

        renderStories: function() {
            const tbody = $('#stories-tbody');
            const filteredStories = this.getFilteredStories();

            if (filteredStories.length === 0) {
                this.showEmptyState();
                return;
            }

            tbody.empty();

            filteredStories.forEach(story => {
                const row = this.createStoryRow(story);
                tbody.append(row);
            });

            this.hideEmptyState();
            this.hideLoadingState();
        },

        createStoryRow: function(story) {
            const featuredStatus = story.isFeatured ? 
                '<span class="status-badge status-featured">Featured</span>' :
                '<span class="status-badge status-not-featured">Not Featured</span>';

            const actionButton = story.isFeatured ?
                `<button class="btn btn-outline unfeature-btn" data-id="${story._id}">
                    <i class="material-icons">star_border</i>
                    UnFeature
                </button>` :
                `<button class="btn btn-primary feature-btn" data-id="${story._id}">
                    <i class="material-icons">star</i>
                    Feature
                </button>`;

            return `
                <tr data-story-id="${story._id}">
                    <td>
                        <div class="story-title">
                            <strong>${this.escapeHtml(story.title)}</strong>
                            ${story.coverImage ? 
                                '<small><i class="material-icons">image</i> Has cover</small>' : 
                                ''
                            }
                        </div>
                    </td>
                    <td>
                        <div class="author-info">
                            <strong>${story.author.displayName || story.author.username}</strong>
                            <small>@${story.author.username}</small>
                        </div>
                    </td>
                    <td>${featuredStatus}</td>
                    <td>${actionButton}</td>
                </tr>
            `;
        },

        getFilteredStories: function() {
            const searchTerm = $('#search-input').val().toLowerCase();
            
            if (!searchTerm) return this.stories;

            return this.stories.filter(story => 
                story.title.toLowerCase().includes(searchTerm) ||
                (story.author.displayName && story.author.displayName.toLowerCase().includes(searchTerm)) ||
                story.author.username.toLowerCase().includes(searchTerm)
            );
        },

        filterStories: function() {
            this.renderStories();
        },

        handleSort: function(field) {
            // Update sort direction
            if (this.currentSort.field === field) {
                this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.currentSort.field = field;
                this.currentSort.direction = 'asc';
            }

            // Update sort icons
            $('.sort-icon').text('unfold_more');
            $(`[data-sort="${field}"] .sort-icon`).text(
                this.currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'
            );

            // Reload stories with new sort
            this.loadStories();
        },

        async toggleFeatureStatus(storyId, featured) {
            if (!this.checkAdminAccess()) return;

            const button = $(`.feature-btn[data-id="${storyId}"], .unfeature-btn[data-id="${storyId}"]`);
            const originalHtml = button.html();

            try {
                button.prop('disabled', true).html(`
                    <i class="material-icons">autorenew</i>
                    Updating...
                `);

                console.log(`FEATURE: ${featured}`);

                const response = await apiService.updateStoryFeaturedStatus(storyId, featured);

                if (response.success) {
                    // Update local data
                    const storyIndex = this.stories.findIndex(s => s._id === storyId);
                    if (storyIndex !== -1) {
                        this.stories[storyIndex].isFeatured = featured;
                        this.renderStories();
                        this.updateStats();
                    }
                    
                    this.showToast(
                        `Story ${featured ? 'featured' : 'unfeatured'} successfully!`,
                        'success'
                    );
                } else {
                    throw new Error('Failed to update story');
                }
            } catch (error) {
                console.error('Error updating story feature status:', error);
                this.showToast('Failed to update story. Please try again.', 'error');
                button.html(originalHtml).prop('disabled', false);
            }
        },

        updateStats: function() {
            const totalStories = this.stories.length;
            const featuredStories = this.stories.filter(story => story.isFeatured).length;

            $('#totalStories').text(totalStories);
            $('#featuredStories').text(featuredStories);
        },

        // State Management
        showLoadingState: function() {
            $('#loading-state').removeClass('hidden');
            $('.table-container').addClass('hidden');
            this.hideErrorState();
            this.hideEmptyState();
        },

        hideLoadingState: function() {
            $('#loading-state').addClass('hidden');
            $('.table-container').removeClass('hidden');
        },

        showEmptyState: function() {
            $('#empty-state').removeClass('hidden');
            $('.table-container').addClass('hidden');
            this.hideLoadingState();
            this.hideErrorState();
        },

        hideEmptyState: function() {
            $('#empty-state').addClass('hidden');
        },

        showErrorState: function(message) {
            $('#error-message').text(message);
            $('#error-state').removeClass('hidden');
            $('.table-container').addClass('hidden');
            this.hideLoadingState();
            this.hideEmptyState();
        },

        hideErrorState: function() {
            $('#error-state').addClass('hidden');
        },

        // Utility Methods
        showToast: function(message, type = 'info') {
            const toast = $('#toast');
            const icon = toast.find('.toast-icon');
            const messageEl = toast.find('.toast-message');

            // Set icon based on type
            const icons = {
                success: 'check_circle',
                error: 'error',
                info: 'info'
            };

            icon.text(icons[type] || 'info');
            messageEl.text(message);

            toast.removeClass('hidden success error').addClass(type);
            
            setTimeout(() => {
                toast.addClass('hidden');
            }, 4000);
        },

        escapeHtml: function(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    };

    // Initialize the manager
    AdminStoriesManager.init();

    // Delegate events for dynamically created buttons
    $(document).on('click', '.feature-btn', function() {
        const storyId = $(this).data('id');
        AdminStoriesManager.toggleFeatureStatus(storyId, true);
    });

    $(document).on('click', '.unfeature-btn', function() {
        const storyId = $(this).data('id');
        AdminStoriesManager.toggleFeatureStatus(storyId, false);
    });

    // Make manager globally available
    window.adminStoriesManager = AdminStoriesManager;
});




