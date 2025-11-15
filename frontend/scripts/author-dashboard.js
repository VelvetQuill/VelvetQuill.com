


// author-dashboard.js - FULLY API INTEGRATED VERSION
class AuthorDashboard {
    constructor() {
        this.currentPage = 1;
        this.statsPerPage = 10;
        this.currentPeriod = 'all-time';
        this.currentSort = 'views';
        this.charts = {};
        
        // Check author privileges
        if (!AuthManager.isAuthor() && !AuthManager.isAdmin()) {
            window.location.href = '/signin.html';
            return;
        }
        
        this.init();
    }

    async init() {
        // Initialize Materialize components
        M.AutoInit();
        
        updateUserUI(AuthManager.getCurrentUser());
        
        try {
            // Load dashboard data
            await this.loadDashboardStats();
            await this.loadPublishedStoriesStats();
            await this.loadEngagementChart();
            await this.loadRecentComments();
            await this.loadTopStories();
            await this.loadFollowersData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update author info
            this.updateAuthorInfo();
            
            //console.log("Author dashboard initialized successfully");
        } catch (error) {
            console.error("Failed to initialize dashboard:", error);
            M.toast({html: 'Failed to load dashboard data. Please refresh the page.'});
        }
    }

    setupEventListeners() {
        // Published stories stats filters
        const periodFilter = document.getElementById('stats-period-filter');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.loadPublishedStoriesStats();
            });
        }

        const statsSort = document.getElementById('stats-sort');
        if (statsSort) {
            statsSort.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadPublishedStoriesStats();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.init();
            });
        }

        // Window resize handler for charts
        window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => {
                if (chart && chart.resize) {
                    chart.resize();
                }
            });
        });
    }

    updateAuthorInfo() {
        const user = AuthManager.getCurrentUser();
        if (user) {
            const authorName = document.getElementById('author-name');
            const userAvatar = document.getElementById('user-avatar');
            const userAvatarHeader = document.getElementById('user-avatar-header');
            
            if (authorName) authorName.textContent = user.displayName || user.username;
            if (userAvatar) userAvatar.textContent = user.username.charAt(0).toUpperCase();
            if (userAvatarHeader) userAvatarHeader.textContent = user.username.charAt(0).toUpperCase();
        }
    }

async loadDashboardStats() {
    const loader = document.getElementById('stats-loader');
    const statsContainer = document.getElementById('dashboard-stats');
    
    if (loader) loader.style.display = 'block';
    if (statsContainer) statsContainer.style.display = 'none';

    try {
        // Use existing endpoint that we know works
        const currentUser = AuthManager.getCurrentUser();
        const profileResponse = await apiService.getUserProfile(currentUser.username);
        
        if (!profileResponse.success) {
            throw new Error(profileResponse.message || 'Failed to load user profile');
        }

        // Get stories separately
        const storiesResponse = await apiService.getUserStories('published');
        
        // Calculate stats manually
        const stats = this.calculateStats(profileResponse.user, storiesResponse.stories || []);
        this.renderDashboardStats(stats);
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        this.showError('dashboard-stats', `Failed to load statistics: ${error.message}`);
    } finally {
        if (loader) loader.style.display = 'none';
        if (statsContainer) statsContainer.style.display = 'grid';
    }
}

// ADD this helper method
calculateStats(user, stories) {
    const totalViews = stories.reduce((sum, story) => sum + (story.stats?.views || 0), 0);
    const totalLikes = stories.reduce((sum, story) => sum + (story.stats?.likesCount || 0), 0);
    const totalComments = stories.reduce((sum, story) => sum + (story.stats?.commentCount || 0), 0);
    const averageRating = stories.length > 0 ? 
        stories.reduce((sum, story) => sum + (story.stats?.averageRating || 0), 0) / stories.length : 0;

    return {
        totalStories: stories.length,
        totalViews,
        totalLikes, 
        totalComments,
        averageRating,
        followersCount: user.stats?.followersCount || user.followers?.length || 0
    };
}


    renderDashboardStats(stats) {
        const statsContainer = document.getElementById('dashboard-stats');
        if (!statsContainer) return;
        
        const statsData = [
            { 
                number: stats.stories || stats.totalStories || 0, 
                label: 'Published Stories', 
                icon: 'library_books', 
                color: '#667eea' 
            },
            { 
                number: stats.totalViews || 0, 
                label: 'Total Views', 
                icon: 'visibility', 
                color: '#4facfe' 
            },
            { 
                number: stats.totalLikes || 0, 
                label: 'Total Likes', 
                icon: 'favorite', 
                color: '#f093fb' 
            },
            { 
                number: stats.comments || stats.totalComments || 0, 
                label: 'Total Comments', 
                icon: 'comment', 
                color: '#43e97b' 
            },
            { 
                number: stats.averageRating || stats.avgRating || 0, 
                label: 'Avg Rating', 
                icon: 'star', 
                color: '#ff9a9e',
                isRating: true 
            },
            { 
                number: stats.followersCount || 0, 
                label: 'Followers', 
                icon: 'people', 
                color: '#a8edea' 
            }
        ];

        statsContainer.innerHTML = statsData.map(stat => `
            <div class="stat-card" style="border-left-color: ${stat.color}">
                <i class="material-icons" style="color: ${stat.color}">${stat.icon}</i>
                <span class="stat-number">
                    ${stat.isRating ? stat.number.toFixed(1) : this.formatNumber(stat.number)}
                </span>
                <span class="stat-label">${stat.label}</span>
            </div>
        `).join('');
    }

    async loadPublishedStoriesStats() {
        const loader = document.getElementById('stories-loader');
        const container = document.getElementById('published-stats-body');
        
        if (loader) loader.style.display = 'block';
        if (container) container.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

        try {
            const currentUser = AuthManager.getCurrentUser();
            const response = await apiService.getUserStories('published');
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load stories');
            }

            this.renderPublishedStoriesStats(response);
            
        } catch (error) {
            console.error('Error loading published stories stats:', error);
            this.showError('published-stats-body', `Failed to load stories: ${error.message}`);
        } finally {
            if (loader) loader.style.display = 'none';
        }
    }

    renderPublishedStoriesStats(response) {
        const container = document.getElementById('published-stats-body');
        const paginationContainer = document.getElementById('stats-pagination');
        
        if (!container) return;
        
        const stories = response.stories || [];
        const pagination = response.pagination || { current: 1, pages: 1, total: stories.length };

        if (stories.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="center-align" style="padding: 2rem;">
                        <i class="material-icons large grey-text">library_books</i>
                        <p class="grey-text">No published stories found</p>
                        <a href="create-story.html" class="btn waves-effect waves-light">
                            <i class="material-icons left">add</i>Create Your First Story
                        </a>
                    </td>
                </tr>
            `;
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Apply sorting
        let sortedStories = [...stories];
        switch(this.currentSort) {
            case 'likes':
                sortedStories.sort((a, b) => (b.stats?.likesCount || 0) - (a.stats?.likesCount || 0));
                break;
            case 'comments':
                sortedStories.sort((a, b) => (b.stats?.commentCount || 0) - (a.stats?.commentCount || 0));
                break;
            case 'views':
                sortedStories.sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0));
                break;
            case 'rating':
                sortedStories.sort((a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0));
                break;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.statsPerPage;
        const paginatedStories = sortedStories.slice(startIndex, startIndex + this.statsPerPage);

        container.innerHTML = paginatedStories.map(story => `
            <tr>
                <td>
                    <a href="story-read.html?id=${story._id || story.id}" class="story-title truncate">
                        ${story.title}
                    </a>
                </td>
                <td>
                    <strong>${this.formatNumber(story.stats?.likesCount || 0)}</strong>
                    <br><small class="grey-text">likes</small>
                </td>
                <td>
                    <strong>${this.formatNumber(story.stats?.commentCount || 0)}</strong>
                    <br><small class="grey-text">comments</small>
                </td>
                <td>
                    <strong>${this.formatNumber(story.stats?.views || 0)}</strong>
                    <br><small class="grey-text">views</small>
                </td>
                <td>
                    <strong>${(story.stats?.averageRating || 0).toFixed(1)}</strong>
                    <br><small class="grey-text">rating</small>
                </td>
            </tr>
        `).join('');

        // Render pagination
        if (paginationContainer) {
            this.renderPagination(paginationContainer, pagination.pages, this.currentPage);
        }
    }

    async loadEngagementChart() {
        const chartContainer = document.getElementById('engagement-chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="center-align" style="padding: 2rem;">Loading engagement data...</div>';
        }

        try {
            // Use existing stories data for engagement metrics
            const response = await apiService.getUserStories('published');
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load engagement data');
            }

            const engagementData = this.processEngagementData(response.stories || []);
            this.renderEngagementChart(engagementData);
            
        } catch (error) {
            console.error('Error loading engagement chart:', error);
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="center-align red-text" style="padding: 2rem;">
                        <i class="material-icons">error_outline</i>
                        <p>Failed to load engagement data</p>
                    </div>
                `;
            }
        }
    }

    processEngagementData(stories) {
        // Group by month for the last 6 months
        const months = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(date.toLocaleDateString('en', { month: 'short', year: '2-digit' }));
        }

        // Initialize data arrays
        const views = Array(6).fill(0);
        const likes = Array(6).fill(0);
        const comments = Array(6).fill(0);

        // Aggregate data by month
        stories.forEach(story => {
            if (story.createdAt) {
                const storyDate = new Date(story.createdAt);
                const monthDiff = (now.getMonth() - storyDate.getMonth()) + 
                                 (12 * (now.getFullYear() - storyDate.getFullYear()));
                
                if (monthDiff >= 0 && monthDiff < 6) {
                    const index = 5 - monthDiff;
                    views[index] += story.stats?.views || 0;
                    likes[index] += story.stats?.likesCount || 0;
                    comments[index] += story.stats?.commentCount || 0;
                }
            }
        });

        return {
            labels: months,
            views,
            likes,
            comments
        };
    }

    renderEngagementChart(data) {
        const ctx = document.getElementById('engagement-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.engagement) {
            this.charts.engagement.destroy();
        }

        this.charts.engagement = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Views',
                        data: data.views,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Likes',
                        data: data.likes,
                        borderColor: '#f093fb',
                        backgroundColor: 'rgba(240, 147, 251, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Comments',
                        data: data.comments,
                        borderColor: '#43e97b',
                        backgroundColor: 'rgba(67, 233, 123, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    async loadRecentComments() {
        const container = document.getElementById('recent-comments');
        if (container) {
            container.innerHTML = '<div class="center-align">Loading comments...</div>';
        }

        try {
            const response = await apiService.getUserComments();
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load comments');
            }

            this.renderRecentComments(response.comments || []);
            
        } catch (error) {
            console.error('Error loading recent comments:', error);
            this.renderRecentComments([]);
        }
    }

    renderRecentComments(comments) {
        const container = document.getElementById('recent-comments');
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="center-align" style="padding: 2rem;">
                    <i class="material-icons large grey-text">comment</i>
                    <p class="grey-text">No comments yet</p>
                    <small class="grey-text">Comments on your stories will appear here</small>
                </div>
            `;
            return;
        }

        // Take only the 5 most recent comments
        const recentComments = comments
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        container.innerHTML = recentComments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <strong>${comment.author?.username || 'Anonymous'}</strong>
                    <span class="grey-text">on ${comment.story?.title || 'Unknown Story'}</span>
                </div>
                <p class="comment-text truncate">${comment.content}</p>
                <div class="comment-footer">
                    <span class="grey-text">${new Date(comment.createdAt).toLocaleDateString()}</span>
                    <span class="comment-likes">
                        <i class="material-icons tiny">favorite</i>
                        ${comment.engagement?.likesCount || 0}
                    </span>
                </div>
            </div>
        `).join('');
    }

    async loadTopStories() {
        const container = document.getElementById('top-stories');
        if (container) {
            container.innerHTML = '<div class="center-align">Loading top stories...</div>';
        }

        try {
            const response = await apiService.getUserStories('published');
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load top stories');
            }

            const topStories = (response.stories || [])
                .sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0))
                .slice(0, 5);

            this.renderTopStories(topStories);
            
        } catch (error) {
            console.error('Error loading top stories:', error);
            this.renderTopStories([]);
        }
    }

    renderTopStories(stories) {
        const container = document.getElementById('top-stories');
        if (!container) return;

        if (stories.length === 0) {
            container.innerHTML = `
                <div class="center-align" style="padding: 2rem;">
                    <i class="material-icons large grey-text">trending_up</i>
                    <p class="grey-text">No stories available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = stories.map((story, index) => `
            <div class="top-story-item">
                <div class="story-rank">${index + 1}</div>
                <div class="story-info">
                    <a href="story-read.html?id=${story._id || story.id}" class="story-title truncate">
                        ${story.title}
                    </a>
                    <div class="story-stats">
                        <span class="stat">
                            <i class="material-icons tiny">visibility</i>
                            ${this.formatNumber(story.stats?.views || 0)}
                        </span>
                        <span class="stat">
                            <i class="material-icons tiny">favorite</i>
                            ${this.formatNumber(story.stats?.likesCount || 0)}
                        </span>
                        <span class="stat">
                            <i class="material-icons tiny">star</i>
                            ${(story.stats?.averageRating || 0).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadFollowersData() {
        const chartContainer = document.getElementById('followers-chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="center-align" style="padding: 2rem;">Loading followers data...</div>';
        }

        try {
            // For now, we'll use a simple implementation since we don't have historical follower data
            const currentUser = AuthManager.getCurrentUser();
            const response = await apiService.getUserProfile(currentUser.username);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load followers data');
            }

            const followersData = this.generateFollowersData(response.user?.stats?.followersCount || 0);
            this.renderFollowersChart(followersData);
            
        } catch (error) {
            console.error('Error loading followers data:', error);
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="center-align red-text" style="padding: 2rem;">
                        <i class="material-icons">error_outline</i>
                        <p>Failed to load followers data</p>
                    </div>
                `;
            }
        }
    }

    generateFollowersData(currentFollowers) {
        // Generate simulated growth data for the chart
        const months = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(date.toLocaleDateString('en', { month: 'short' }));
        }

        // Simulate growth from 0 to current followers
        const growthRate = currentFollowers / 6;
        const followers = months.map((_, index) => Math.round(growthRate * (index + 1)));

        return {
            labels: months,
            followers
        };
    }

    renderFollowersChart(data) {
        const ctx = document.getElementById('followers-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.followers) {
            this.charts.followers.destroy();
        }

        this.charts.followers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Followers',
                    data: data.followers,
                    backgroundColor: '#4facfe',
                    borderColor: '#4facfe',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    renderPagination(container, totalPages, currentPage) {
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<li class="waves-effect"><a href="#!" data-page="${currentPage - 1}"><i class="material-icons">chevron_left</i></a></li>`;
        } else {
            paginationHTML += `<li class="disabled"><a href="#!"><i class="material-icons">chevron_left</i></a></li>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `<li class="active"><a href="#!">${i}</a></li>`;
            } else {
                paginationHTML += `<li class="waves-effect"><a href="#!" data-page="${i}">${i}</a></li>`;
            }
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `<li class="waves-effect"><a href="#!" data-page="${currentPage + 1}"><i class="material-icons">chevron_right</i></a></li>`;
        } else {
            paginationHTML += `<li class="disabled"><a href="#!"><i class="material-icons">chevron_right</i></a></li>`;
        }

        container.innerHTML = paginationHTML;

        // Add event listeners to pagination links
        container.querySelectorAll('a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.getAttribute('data-page'));
                this.changePage(page);
            });
        });
    }

    changePage(page) {
        this.currentPage = page;
        this.loadPublishedStoriesStats();
        
        // Scroll to stats section
        const statsSection = document.getElementById('published-stats');
        if (statsSection) {
            statsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="center-align red-text" style="padding: 2rem;">
                    <i class="material-icons large">error_outline</i>
                    <p>${message}</p>
                    <button class="btn waves-effect waves-light" onclick="authorDashboard.retryLoading()">
                        <i class="material-icons left">refresh</i>Retry
                    </button>
                </div>
            `;
        }
    }

    async retryLoading() {
        await this.init();
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (AuthManager.isAuthor() || AuthManager.isAdmin()) {
        window.authorDashboard = new AuthorDashboard();
    } else {
        window.location.href = '/signin.html';
    }
});
