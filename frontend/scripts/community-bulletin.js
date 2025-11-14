
// community-bulletin.js - Refactored with proper API methods and error handling
class CommunityBulletin {
    constructor() {
        this.allWinnersMap = new Map(); // Store winners for linking
        this.init();
    }

    init() {
        this.loadActiveContests();
        this.loadTopStories();
        this.loadTopAuthors();
        this.loadContestWinners();
        this.initializeComponents();
    }

    initializeComponents() {
        // Initialize Materialize components
        M.Modal.init(document.querySelectorAll('.modal'));
        M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'));
        M.Sidenav.init(document.querySelectorAll('.sidenav'));
        
        // Setup search functionality if on community page
        this.setupSearchFunctionality();
    }

    setupSearchFunctionality() {
        const searchForm = document.getElementById('author-search-form');
        const searchInput = document.getElementById('author-search-input');
        
        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.searchAuthors(searchInput.value.trim());
            });
            
            // Real-time search as user types (optional)
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.searchAuthors(query);
                } else if (query.length === 0) {
                    this.loadTopAuthors(); // Reset to top authors when search is cleared
                }
            });
        }
    }

    // Data Loading Methods
    async loadActiveContests() {
        try {
            const contests = await apiService.getContests({ status: 'active' });
            this.renderActiveContests(contests.data || contests);
        } catch (error) {
            console.error('Error loading active contests:', error);
            this.showError('active-contests-container', 'Failed to load active contests');
        }
    }

    async loadTopStories() {
        try {
            // Using existing getStories method with engagement sorting
            const stories = await apiService.getStories({ 
                status: 'published',
                sortBy: 'stats.engagement',
                sortOrder: 'desc',
                limit: 20
            });
            this.renderTopStories(stories.data || stories);
        } catch (error) {
            console.error('Error loading top stories:', error);
            this.showError('top-stories-container', 'Failed to load top stories');
        }
    }

    async loadTopAuthors() {
        try {
            // Since getTopRatedAuthors doesn't exist, we'll use user search or get stories by author
            // For now, we'll simulate this by getting stories and extracting authors
            const stories = await apiService.getStories({ 
                status: 'published',
                limit: 50 // Get more stories to find diverse authors
            });
            
            const authorsMap = new Map();
            const storiesData = stories.data || stories;
            
            // Extract unique authors from stories
            storiesData.forEach(story => {
                if (story.author && story.author._id) {
                    const authorId = story.author._id;
                    if (!authorsMap.has(authorId)) {
                        authorsMap.set(authorId, {
                            ...story.author,
                            stats: {
                                storiesCount: 0,
                                followersCount: story.author.followersCount || 0,
                                totalLikes: 0,
                                averageRating: 0
                            }
                        });
                    }
                    
                    const author = authorsMap.get(authorId);
                    author.stats.storiesCount++;
                    author.stats.totalLikes += story.stats?.likesCount || 0;
                }
            });
            
            // Convert to array and sort by story count
            const authors = Array.from(authorsMap.values())
                .sort((a, b) => b.stats.storiesCount - a.stats.storiesCount)
                .slice(0, 20);
                
            this.renderTopAuthors(authors);
        } catch (error) {
            console.error('Error loading top authors:', error);
            this.showError('top-authors-container', 'Failed to load top authors');
        }
    }

    async searchAuthors(query) {
        if (!query) {
            this.loadTopAuthors();
            return;
        }

        try {
            const searchResults = await apiService.getStoriesBySearch(query, {
                limit: 50
            });
            
            const authorsMap = new Map();
            const storiesData = searchResults.data || searchResults;
            
            // Extract unique authors from search results
            storiesData.forEach(story => {
                if (story.author && story.author._id) {
                    const authorId = story.author._id;
                    if (!authorsMap.has(authorId)) {
                        authorsMap.set(authorId, {
                            ...story.author,
                            stats: {
                                storiesCount: 0,
                                followersCount: story.author.followersCount || 0,
                                totalLikes: 0,
                                averageRating: 0
                            }
                        });
                    }
                    
                    const author = authorsMap.get(authorId);
                    author.stats.storiesCount++;
                    author.stats.totalLikes += story.stats?.likesCount || 0;
                }
            });
            
            const authors = Array.from(authorsMap.values())
                .sort((a, b) => b.stats.storiesCount - a.stats.storiesCount);
                
            this.renderTopAuthors(authors, `Search Results for "${query}"`);
        } catch (error) {
            console.error('Error searching authors:', error);
            M.toast({html: `Search failed: ${error.message}`});
        }
    }

    async loadContestWinners() {
        try {
            const contests = await apiService.getContests({ status: 'completed' });
            this.processContestWinners(contests.data || contests);
        } catch (error) {
            console.error('Error loading contest winners:', error);
            this.showError('contest-winners-container', 'Failed to load contest winners');
        }
    }

    // Data Processing Methods
    processContestWinners(contests) {
        const completedContests = contests?.filter(contest => 
            contest.status === 'completed' && contest.winners && contest.winners.length > 0
        ) || [];
        
        // Build winners map for linking
        completedContests.forEach(contest => {
            contest.winners.forEach(winner => {
                const userId = winner.user?._id || winner.user;
                if (userId && !this.allWinnersMap.has(userId)) {
                    this.allWinnersMap.set(userId, {
                        user: winner.user,
                        wins: []
                    });
                }
                
                const winnerData = this.allWinnersMap.get(userId);
                winnerData.wins.push({
                    contestId: contest._id || contest.id,
                    contestName: contest.name,
                    position: winner.position,
                    prizeAwarded: winner.prizeAwarded,
                    winDate: contest.timeline?.endDate || contest.createdAt
                });
            });
        });

        this.renderContestWinners(completedContests);
    }

    // Rendering Methods
    renderActiveContests(contests) {
        const container = document.getElementById('active-contests-container');
        
        if (!contests || contests.length === 0) {
            container.innerHTML = this.createEmptyState(
                'event_busy',
                'No active contests at the moment',
                'Check back later for new writing challenges!'
            );
            return;
        }

        container.innerHTML = contests.map(contest => this.createContestCard(contest)).join('');

        // Add view all button if there are contests
        if (contests.length > 2) {
            container.innerHTML += this.createViewAllButton('contests.html', 'View All Contests');
        }
    }

    renderTopStories(stories) {
        const container = document.getElementById('top-stories-container');
        
        if (!stories || stories.length === 0) {
            container.innerHTML = this.createEmptyState(
                'auto_stories',
                'No stories available'
            );
            return;
        }

        container.innerHTML = stories.slice(0, 20).map((story, index) => 
            this.createStoryItem(story, index)
        ).join('');
    }

    renderTopAuthors(authors, title = 'Top 20 Authors') {
        const container = document.getElementById('top-authors-container');
        
        // Update section title if provided
        if (title) {
            const titleElement = container.closest('.section-card').querySelector('.section-title');
            if (titleElement) {
                titleElement.innerHTML = `<i class="material-icons">people</i>${title}`;
            }
        }
        
        if (!authors || authors.length === 0) {
            container.innerHTML = this.createEmptyState(
                'person_off',
                'No authors found'
            );
            return;
        }

        container.innerHTML = authors.slice(0, 20).map((author, index) => 
            this.createAuthorItem(author, index)
        ).join('');
    }

    renderContestWinners(contests) {
        const container = document.getElementById('contest-winners-container');
        const completedContests = contests?.filter(contest => 
            contest.status === 'completed' && contest.winners && contest.winners.length > 0
        ) || [];
        
        if (completedContests.length === 0) {
            container.innerHTML = this.createEmptyState(
                'celebration',
                'No contest winners yet',
                'Be the first to win a writing contest!'
            );
            return;
        }

        // Flatten all winners from all completed contests
        const allWinners = [];
        completedContests.forEach(contest => {
            contest.winners.forEach(winner => {
                allWinners.push({
                    ...winner,
                    contestName: contest.name,
                    contestId: contest._id || contest.id
                });
            });
        });

        container.innerHTML = allWinners.slice(0, 10).map(winner => 
            this.createWinnerItem(winner)
        ).join('');

        if (completedContests.length > 5) {
            container.innerHTML += this.createViewAllButton('winner-stats.html', 'View All Winners Stats');
        }
    }

    // Component Creation Methods (keep the same as before)
    createContestCard(contest) {
        return `
            <div class="contest-card">
                <div class="contest-title">${contest.name}</div>
                <div class="contest-theme">Theme: ${contest.theme}</div>
                <div class="contest-meta">
                    <div class="contest-timeline">
                        <i class="material-icons tiny">schedule</i>
                        Ends: ${new Date(contest.timeline.endDate).toLocaleDateString()}
                    </div>
                    <div class="contest-prizes">
                        <i class="material-icons tiny">card_giftcard</i>
                        ${contest.prizes.length} Prize${contest.prizes.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <div class="contest-description">${contest.description}</div>
                <div class="contest-actions">
                    <button class="btn btn-join waves-effect waves-light" onclick="communityBulletin.joinContest('${contest._id || contest.id}')">
                        <i class="material-icons left">how_to_reg</i>Join Contest
                    </button>
                    <a href="contest.html?id=${contest._id || contest.id}" class="btn btn-flat waves-effect">
                        <i class="material-icons left">info</i>Details
                    </a>
                </div>
            </div>
        `;
    }

    createStoryItem(story, index) {
        return `
            <div class="story-item">
                <div class="rank-badge ${index < 3 ? `rank-${index + 1}` : ''}">
                    ${index + 1}
                </div>
                <div class="item-content">
                    <div class="item-title">${story.title}</div>
                    <div class="item-meta">
                        <span>By ${story.author?.displayName || story.author?.username || 'Unknown Author'}</span>
                        <span>${story.category}</span>
                    </div>
                    <div class="item-stats">
                        <div class="stat">
                            <i class="material-icons tiny">favorite</i>
                            ${story.stats?.likesCount || 0} likes
                        </div>
                        <div class="stat">
                            <i class="material-icons tiny">visibility</i>
                            ${story.stats?.views || 0} views
                        </div>
                        <div class="stat">
                            <i class="material-icons tiny">star</i>
                            ${(story.stats?.rating || 0).toFixed(1)} rating
                        </div>
                        <div class="stat">
                            <i class="material-icons tiny">comment</i>
                            ${story.stats?.commentCount || 0} comments
                        </div>
                    </div>
                </div>
                <a href="story.html?id=${story._id || story.id}" class="btn btn-flat waves-effect">
                    <i class="material-icons">book</i> Read
                </a>
            </div>
        `;
    }

    createAuthorItem(author, index) {
        return `
            <div class="author-item">
                <div class="rank-badge ${index < 3 ? `rank-${index + 1}` : ''}">
                    ${index + 1}
                </div>
                <div class="user-avatar" style="margin-right: 1rem;">
                    ${author.displayName?.charAt(0) || author.username?.charAt(0) || 'U'}
                </div>
                <div class="item-content">
                    <div class="item-title">${author.displayName || author.username}</div>
                    <div class="item-meta">
                        <span>${author.stats?.storiesCount || 0} stories</span>
                        <span>${author.stats?.followersCount || 0} followers</span>
                    </div>
                    <div class="item-stats">
                        <div class="stat">
                            <i class="material-icons tiny">favorite</i>
                            ${author.stats?.totalLikes || 0} total likes
                        </div>
                        <div class="stat">
                            <i class="material-icons tiny">star</i>
                            ${(author.stats?.averageRating || 0).toFixed(1)} avg rating
                        </div>
                    </div>
                </div>
                <a href="author.html?id=${author._id || author.id}" class="btn btn-flat waves-effect">
                    <i class="material-icons">person</i> Profile
                </a>
            </div>
        `;
    }

    createWinnerItem(winner) {
        const userId = winner.user?._id || winner.user;
        const isWinnerInMap = this.allWinnersMap.has(userId);
        
        return `
            <div class="winner-item">
                <div class="item-content">
                    <div class="item-title">
                        ${isWinnerInMap ? 
                            `<a href="winner-stats.html?winner=${userId}" class="winner-link" data-winner-id="${userId}">
                                ${winner.user?.displayName || winner.user?.username || 'Unknown Author'}
                            </a>` :
                            `${winner.user?.displayName || winner.user?.username || 'Unknown Author'}`
                        }
                    </div>
                    <div class="item-meta">
                        <span>Won: ${winner.contestName}</span>
                        <span>Position: ${this.getPositionText(winner.position)}</span>
                    </div>
                    ${winner.prizeAwarded ? `
                        <div class="item-stats">
                            <div class="stat">
                                <i class="material-icons tiny">card_giftcard</i>
                                ${winner.prizeAwarded}
                            </div>
                        </div>
                    ` : ''}
                </div>
                ${isWinnerInMap ? 
                    `<a href="winner-stats.html?winner=${userId}" class="btn btn-flat waves-effect winner-stats-link" data-winner-id="${userId}">
                        <i class="material-icons">trending_up</i> Stats
                    </a>` :
                    `<a href="contest.html?id=${winner.contestId}" class="btn btn-flat waves-effect">
                        <i class="material-icons">emoji_events</i> Contest
                    </a>`
                }
            </div>
        `;
    }

    createEmptyState(icon, message, subMessage = '') {
        return `
            <div class="empty-state">
                <i class="material-icons">${icon}</i>
                <p>${message}</p>
                ${subMessage ? `<p class="grey-text">${subMessage}</p>` : ''}
            </div>
        `;
    }

    createViewAllButton(href, text) {
        return `
            <div class="view-all-btn">
                <a href="${href}" class="btn waves-effect waves-light">
                    ${text}
                </a>
            </div>
        `;
    }

    // Utility Methods (keep the same as before)
    getPositionText(position) {
        if (position === 1) return '1st Place';
        if (position === 2) return '2nd Place';
        if (position === 3) return '3rd Place';
        return `${position}th Place`;
    }

    async joinContest(contestId) {
        if (!AuthManager.isAuthenticated()) {
            M.toast({html: 'Please login to join contests'});
            window.location.href = 'signin.html';
            return;
        }

        if (!AuthManager.isAuthor()) {
            M.toast({html: 'You need to be an author to join contests'});
            window.location.href = 'author-register.html';
            return;
        }

        try {
            await apiService.joinContest(contestId);
            M.toast({html: 'Successfully joined the contest!'});
            this.loadActiveContests(); // Refresh the list
        } catch (error) {
            M.toast({html: `Failed to join contest: ${error.message}`});
        }
    }

    showError(containerId, message) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="empty-state">
                <i class="material-icons">error</i>
                <p>${message}</p>
                <button class="btn waves-effect waves-light" onclick="communityBulletin.retryLoading()">
                    <i class="material-icons left">refresh</i>Retry
                </button>
            </div>
        `;
    }

    retryLoading() {
        this.loadActiveContests();
        this.loadTopStories();
        this.loadTopAuthors();
        this.loadContestWinners();
    }
}

// Initialize the community bulletin when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.communityBulletin = new CommunityBulletin();
});


