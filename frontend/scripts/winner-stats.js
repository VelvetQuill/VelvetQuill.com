
// Winner Statistics JavaScript
class WinnerStats {
    constructor() {
        this.selectedWinner = null;
        this.allWinners = [];
        this.init();
    }

    init() {
        this.initializeComponents();
        this.loadAllWinners();
        this.setupEventListeners();
        this.checkUrlParameters();
    }

    initializeComponents() {
        // Initialize Materialize components
        M.Modal.init(document.querySelectorAll('.modal'));
        M.FormSelect.init(document.querySelectorAll('select'));
        M.Sidenav.init(document.querySelectorAll('.sidenav'));
    }

    setupEventListeners() {
        // Winner selection change
        document.getElementById('winner-select').addEventListener('change', (e) => {
            const winnerId = e.target.value;
            if (winnerId) {
                this.selectWinner(winnerId);
            }
        });
    }

    checkUrlParameters() {
        // Check if winner ID is provided in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const winnerId = urlParams.get('winner');
        
        if (winnerId) {
            // Auto-select the winner from URL parameter
            setTimeout(() => {
                const select = document.getElementById('winner-select');
                if (select) {
                    select.value = winnerId;
                    M.FormSelect.init(select);
                    this.selectWinner(winnerId);
                }
            }, 1000);
        }
    }

    async loadAllWinners() {
        try {
            const contests = await apiService.getContests({ status: 'completed' });
            this.processAllWinners(contests.data || contests);
        } catch (error) {
            console.error('Error loading winners:', error);
            this.showError('Failed to load contest winners');
        }
    }

    processAllWinners(contests) {
        const winnersMap = new Map();
        
        contests.forEach(contest => {
            if (contest.winners && Array.isArray(contest.winners)) {
                contest.winners.forEach(winner => {
                    const userId = winner.user?._id || winner.user;
                    if (userId && !winnersMap.has(userId)) {
                        winnersMap.set(userId, {
                            user: winner.user,
                            wins: []
                        });
                    }
                    
                    const winnerData = winnersMap.get(userId);
                    winnerData.wins.push({
                        contestId: contest._id || contest.id,
                        contestName: contest.name,
                        position: winner.position,
                        prizeAwarded: winner.prizeAwarded,
                        winDate: contest.timeline?.endDate || contest.createdAt
                    });
                });
            }
        });

        this.allWinners = Array.from(winnersMap.values());
        this.populateWinnerSelect();
    }

    populateWinnerSelect() {
        const select = document.getElementById('winner-select');
        
        this.allWinners.forEach(winner => {
            const user = winner.user;
            const option = document.createElement('option');
            option.value = user._id || user.id || user;
            option.textContent = `${user.displayName || user.username} (${winner.wins.length} win${winner.wins.length !== 1 ? 's' : ''})`;
            select.appendChild(option);
        });

        // Re-initialize select
        M.FormSelect.init(select);
    }

    async selectWinner(winnerId) {
        try {
            const winnerData = this.allWinners.find(w => {
                const userId = w.user._id || w.user.id || w.user;
                return userId === winnerId;
            });
            
            if (!winnerData) {
                throw new Error('Winner not found');
            }

            this.selectedWinner = winnerData;
            
            // Load detailed user data
            try {
                const userDetails = await apiService.getUserProfile(winnerData.user.username || winnerData.user._id);
                this.selectedWinner.details = userDetails.data || userDetails;
            } catch (userError) {
                console.warn('Could not load detailed user data, using basic info:', userError);
                this.selectedWinner.details = this.selectedWinner.user;
            }
            
            this.displayWinnerProfile();
            this.loadWinnerStats();
            
        } catch (error) {
            console.error('Error selecting winner:', error);
            M.toast({html: 'Failed to load winner details'});
        }
    }

    displayWinnerProfile() {
        const user = this.selectedWinner.details || this.selectedWinner.user;
        const container = document.getElementById('winner-profile-container');
        const noSelection = document.getElementById('no-selection-container');

        // Show profile, hide no-selection message
        container.style.display = 'block';
        noSelection.style.display = 'none';

        // Update profile information
        document.getElementById('winner-avatar').textContent = 
            (user.displayName || user.username || 'U').charAt(0).toUpperCase();
        document.getElementById('winner-name').textContent = user.displayName || user.username || 'Unknown Author';
        document.getElementById('winner-username').textContent = user.username ? `@${user.username}` : '';
        document.getElementById('winner-bio').textContent = user.profile?.bio || 'No biography available.';
        
        // Update quick stats
        document.getElementById('stats-followers').textContent = user.stats?.followersCount || 0;
        document.getElementById('stats-stories').textContent = user.stats?.storiesCount || 0;
        document.getElementById('stats-wins').textContent = this.selectedWinner.wins.length;
    }

    async loadWinnerStats() {
        this.displayContestWins();
        this.displayBadgesAndAchievements();
        await this.loadWritingStatistics();
        await this.loadTopStories();
    }

    displayContestWins() {
        const container = document.getElementById('contest-wins-container');
        const wins = this.selectedWinner.wins;

        if (!wins || wins.length === 0) {
            container.innerHTML = this.createEmptyState('celebration', 'No contest victories found');
            return;
        }

        // Sort wins by date (most recent first)
        wins.sort((a, b) => new Date(b.winDate) - new Date(a.winDate));

        container.innerHTML = wins.map(win => this.createContestWinItem(win)).join('');
    }

    displayBadgesAndAchievements() {
        const container = document.getElementById('badges-container');
        const user = this.selectedWinner.details || this.selectedWinner.user;
        const badges = user.badges || [];
        const achievements = user.achievements || [];

        if (badges.length === 0 && achievements.length === 0) {
            container.innerHTML = this.createEmptyState('workspace_premium', 'No badges or achievements yet');
            return;
        }

        // Combine badges and achievements
        const allItems = [
            ...badges.map(badge => ({ ...badge, type: 'badge' })),
            ...achievements.map(achievement => ({ ...achievement, type: 'achievement' }))
        ];

        container.innerHTML = allItems.map(item => this.createBadgeItem(item)).join('');
    }

    async loadWritingStatistics() {
        const container = document.getElementById('writing-stats-container');
        const user = this.selectedWinner.details || this.selectedWinner.user;

        try {
            // Get user's stories for detailed stats
            const stories = await apiService.getAuthorStories(user.username || user._id);
            const userStories = stories.data || stories;

            const stats = this.calculateWritingStats(userStories, user);
            container.innerHTML = this.createWritingStats(stats);

        } catch (error) {
            console.error('Error loading writing statistics:', error);
            container.innerHTML = this.createEmptyState('error', 'Failed to load writing statistics');
        }
    }

    async loadTopStories() {
        const container = document.getElementById('top-stories-container');
        const user = this.selectedWinner.details || this.selectedWinner.user;

        try {
            const stories = await apiService.getAuthorStories(user.username || user._id);
            const userStories = stories.data || stories;

            if (!userStories || userStories.length === 0) {
                container.innerHTML = this.createEmptyState('auto_stories', 'No stories published yet');
                return;
            }

            // Sort stories by engagement
            const topStories = userStories
                .sort((a, b) => (b.stats?.engagement || 0) - (a.stats?.engagement || 0))
                .slice(0, 5);

            container.innerHTML = topStories.map((story, index) => 
                this.createTopStoryItem(story, index)
            ).join('');

        } catch (error) {
            console.error('Error loading top stories:', error);
            container.innerHTML = this.createEmptyState('error', 'Failed to load top stories');
        }
    }

    // Helper Methods
    calculateWritingStats(stories, user) {
        const totalWords = stories.reduce((sum, story) => sum + (story.metadata?.wordCount || 0), 0);
        const totalViews = stories.reduce((sum, story) => sum + (story.stats?.views || 0), 0);
        const totalLikes = stories.reduce((sum, story) => sum + (story.stats?.likesCount || 0), 0);
        const totalComments = stories.reduce((sum, story) => sum + (story.stats?.commentCount || 0), 0);
        
        const avgRating = stories.length > 0 
            ? stories.reduce((sum, story) => sum + (story.stats?.rating || 0), 0) / stories.length 
            : 0;

        return {
            totalStories: stories.length,
            totalWords,
            totalViews,
            totalLikes,
            totalComments,
            avgRating: avgRating.toFixed(1),
            followers: user.stats?.followersCount || 0,
            readingTime: Math.round(totalWords / 200) // Assuming 200 words per minute
        };
    }

    createContestWinItem(win) {
        return `
            <div class="contest-win-item">
                <div class="win-position ${win.position <= 3 ? `win-position-${win.position}` : ''}">
                    ${win.position}
                </div>
                <div class="win-content">
                    <div class="win-contest-name">${win.contestName}</div>
                    ${win.prizeAwarded ? `<div class="win-prize">🏆 ${win.prizeAwarded}</div>` : ''}
                    <div class="win-date">Won on ${new Date(win.winDate).toLocaleDateString()}</div>
                </div>
            </div>
        `;
    }

    createBadgeItem(item) {
        const icon = item.type === 'badge' ? 'workspace_premium' : 'military_tech';
        return `
            <div class="badge-item">
                <div class="badge-icon">
                    <i class="material-icons">${icon}</i>
                </div>
                <div class="badge-name">${item.name || item.type}</div>
                <div class="badge-description">${item.description || 'Achievement unlocked!'}</div>
            </div>
        `;
    }

    createWritingStats(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${stats.totalStories}</div>
                    <div class="stat-card-label">Stories Published</div>
                    <div class="stat-card-description">Total works created</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.totalWords.toLocaleString()}</div>
                    <div class="stat-card-label">Total Words</div>
                    <div class="stat-card-description">Words written across all stories</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.totalViews.toLocaleString()}</div>
                    <div class="stat-card-label">Total Views</div>
                    <div class="stat-card-description">Reader engagement</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.avgRating}</div>
                    <div class="stat-card-label">Average Rating</div>
                    <div class="stat-card-description">Out of 5 stars</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.totalLikes.toLocaleString()}</div>
                    <div class="stat-card-label">Total Likes</div>
                    <div class="stat-card-description">Reader appreciation</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.followers.toLocaleString()}</div>
                    <div class="stat-card-label">Followers</div>
                    <div class="stat-card-description">Dedicated readers</div>
                </div>
            </div>
        `;
    }

    createTopStoryItem(story, index) {
        return `
            <div class="top-story-item">
                <div class="story-rank">${index + 1}</div>
                <div class="story-content">
                    <div class="story-title">${story.title}</div>
                    <div class="story-meta">
                        <span>${story.category}</span>
                        <span>${story.metadata?.wordCount?.toLocaleString() || 0} words</span>
                    </div>
                    <div class="story-stats">
                        <div class="story-stat">
                            <i class="material-icons tiny">visibility</i>
                            ${story.stats?.views || 0} views
                        </div>
                        <div class="story-stat">
                            <i class="material-icons tiny">favorite</i>
                            ${story.stats?.likesCount || 0} likes
                        </div>
                        <div class="story-stat">
                            <i class="material-icons tiny">star</i>
                            ${(story.stats?.rating || 0).toFixed(1)} rating
                        </div>
                    </div>
                </div>
                <a href="story.html?id=${story._id || story.id}" class="btn btn-flat waves-effect">
                    <i class="material-icons">book</i> Read
                </a>
            </div>
        `;
    }

    createEmptyState(icon, message) {
        return `
            <div class="empty-state">
                <i class="material-icons">${icon}</i>
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        M.toast({html: message});
    }
}

// Initialize the winner stats page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.winnerStats = new WinnerStats();
});
