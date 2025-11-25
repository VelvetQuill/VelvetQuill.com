


// admin-dashboard.js
class AdminDashboard {
    constructor() {
        this.currentTab = 'dashboard';
        this.adminData = {
            users: [],
            authors: [],
            stories: [],
            contests: [],
            announcements: [],
            badges: [],
            stats: {}
        };
        this.useMockData = false;
        this.visitorStats = null;
        this.reloadInterval = null;
        this.isLoading = false;
        
        // Check admin privileges
        if (!AuthManager.isAdmin()) {
            window.location.href = '/frontend/signin.html';
            return;
        }
        
        this.initializeDashboard();
    }

    async initializeDashboard() {
        this.initializeComponents();
        await this.loadAdminData();
        this.setupEventListeners();
        this.startAutoReload();
    }

    initializeComponents() {
        // Initialize Materialize components
        M.Modal.init(document.querySelectorAll('.modal'));
        M.FormSelect.init(document.querySelectorAll('select'));

        const tabElems = document.querySelectorAll('.tabs');
        if(tabElems.length > 0){
            try{
                M.Tabs.init(tabElems,{
                    swipeable: false,
                    responsiveThreshold: Infinity
                });
            }catch(error){
                this.switchToTab('dashboard');
            }
        }
    }

    // Auto-reload functionality
    startAutoReload() {
        // Clear any existing interval
        if (this.reloadInterval) {
            clearInterval(this.reloadInterval);
        }
        
        // Set up new interval for 30 seconds
        this.reloadInterval = setInterval(() => {
            this.autoReloadData();
        }, 30000); // 30 seconds
        
        //console.log('Auto-reload started: refreshing data every 30 seconds');
    }

    stopAutoReload() {
        if (this.reloadInterval) {
            clearInterval(this.reloadInterval);
            this.reloadInterval = null;
            //console.log('Auto-reload stopped');
        }
    }

    async autoReloadData() {
        // Don't reload if already loading or if modal is open
        if (this.isLoading || this.isModalOpen()) {
            return;
        }

        try {
            this.isLoading = true;
            
            // Show loading indicator
            this.showLoadingIndicator();
            
            // Reload the data
            await this.refreshData();
            
            // Update last reload time
            this.updateLastReloadTime();
            
        } catch (error) {
            console.error('Auto-reload failed:', error);
        } finally {
            this.isLoading = false;
            this.hideLoadingIndicator();
        }
    }

    isModalOpen() {
        // Check if any Materialize modal is open
        const modals = document.querySelectorAll('.modal');
        return Array.from(modals).some(modal => {
            return modal.classList.contains('open');
        });
    }

    showLoadingIndicator() {
        // Create or show a subtle loading indicator
        let indicator = document.getElementById('auto-reload-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'auto-reload-indicator';
            indicator.innerHTML = `
                <div class="auto-reload-indicator" style="
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #4CAF50;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    z-index: 10000;
                    display: none;
                ">
                    <i class="material-icons" style="font-size: 14px; vertical-align: middle;">refresh</i>
                    <span>Refreshing...</span>
                </div>
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('auto-reload-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    updateLastReloadTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        // Update last reload time display
        let timeDisplay = document.getElementById('last-reload-time');
        if (!timeDisplay) {
            timeDisplay = document.createElement('div');
            timeDisplay.id = 'last-reload-time';
            timeDisplay.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 11px;
                z-index: 9999;
            `;
            document.body.appendChild(timeDisplay);
        }
        timeDisplay.textContent = `Last updated: ${timeString}`;
        timeDisplay.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (timeDisplay) {
                timeDisplay.style.display = 'none';
            }
        }, 5000);
    }

    async getVisitorStats(){
        try{
            return await apiService.getVisitorStats();
        }catch(error){
            return {
                success: false,
                stats: {
                    totalVisitors: 0,
                    uniqueVisitors: 0,
                    returningVisitors: 0,
                    todayVisitors: 0,
                    weekVisitors: 0
                }
            };
        }
    }

    async loadAdminData() {
        try {
            if (!AuthManager.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            // Load all admin data in parallel with timeout
            const loadPromise = Promise.all([
                this.getAdminStats(),
                this.getUsers(),
                this.getAuthors(),
                this.getPendingStories(),
                this.getContests(),
                this.getAnnouncements(),
                this.getBadges(),
                this.getVisitorStats()
            ]);

            // Set timeout for API calls
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), 10000);
            });

            const [stats, users, authors, stories, contests, announcements, badges, visitorStats] = 
                await Promise.race([loadPromise, timeoutPromise]);

            this.visitorStats = visitorStats;
            this.adminData = {
                users: this.ensureArray(users.data || users.users),
                authors: this.ensureArray(authors.data || authors.authors),
                stories: this.ensureArray(stories.data || stories.stories),
                contests: this.ensureArray(contests.data || contests.contests),
                announcements: this.ensureArray(announcements.data || announcements.announcments),
                badges: this.ensureArray(badges.data || badges.data),
                stats: stats || {},
                visitorStats: visitorStats || {}
            };

            this.useMockData = false;
            this.loadStats();
            this.loadTables();

        } catch (error) {
            console.error('Error loading admin data:', error);
            M.toast({html: 'Failed to load admin data. Using backup data.'});
            await this.loadMockData();
        }
    }

    async refreshData() {
        try {
            // Use the same loading logic as initial load but without mock data fallback
            if (!AuthManager.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            // Load all admin data in parallel
            const [stats, users, authors, stories, contests, announcements, badges, visitorStats] = 
                await Promise.all([
                    this.getAdminStats(),
                    this.getUsers(),
                    this.getAuthors(),
                    this.getPendingStories(),
                    this.getContests(),
                    this.getAnnouncements(),
                    this.getBadges(),
                    this.getVisitorStats()
                ]);

            // Update the admin data
            this.visitorStats = visitorStats;
            this.adminData = {
                users: this.ensureArray(users.data || users.users),
                authors: this.ensureArray(authors.data || authors.authors),
                stories: this.ensureArray(stories.data || stories.stories),
                contests: this.ensureArray(contests.data || contests.contests),
                announcements: this.ensureArray(announcements.data || announcements.announcments),
                badges: this.ensureArray(badges.data || badges.data),
                stats: stats || {},
                visitorStats: visitorStats || {}
            };

            // Update the UI
            this.loadStats();
            this.loadTables();
            
        } catch (error) {
            console.error('Error refreshing admin data:', error);
            // Don't show toast for auto-reload to avoid annoyance
        }
    }

    // Add manual refresh method for button clicks
    async manualRefresh() {
        try {
            this.isLoading = true;
            M.toast({html: 'Refreshing data...'});
            await this.refreshData();
            this.updateLastReloadTime();
            M.toast({html: 'Data refreshed successfully!'});
        } catch (error) {
            M.toast({html: 'Refresh failed: ' + error.message});
        } finally {
            this.isLoading = false;
        }
    }

    ensureArray(data){
        if(Array.isArray(data)){
            return data;
        }
        if(data && typeof data === 'object'){
            if(data.results && Array.isArray(data.results)){
                return data.results;
            }
            if(data.stories && Array.isArray(data.stories)){
                return data.stories;
            }
            if(data.users && Array.isArray(data.users)){
                return data.users;
            }
            if(data.announcements && Array.isArray(data.announcementss)){
                return data.announcements;
            }
            return [data];
        }
        return [];
    }

    async loadMockData() {
        try {
            // Check if mock data is available
            if (typeof backupUsers === 'undefined' || typeof backupStories === 'undefined') {
                throw new Error('Backup data not available');
            }

            this.useMockData = true;
            
            // Filter mock data for admin purposes
            const adminUsers = backupUsers.filter(user => user.role === 'admin' || user.role === 'overallAdmin');
            const authorUsers = backupUsers.filter(user => user.role === 'author');
            const regularUsers = backupUsers.filter(user => user.role === 'user');
            
            // Calculate stats from mock data
            const totalStories = backupStories.length;
            const totalUsers = backupUsers.length;
            const totalAuthors = authorUsers.length;
            ///const pendingRequests = authorUsers.filter(author => author.status === 'pending').length;

            this.adminData = {
                users: regularUsers.slice(0, 50),
                authors: authorUsers.slice(0, 50),
                stories: backupStories.slice(0, 50),
                contests: [],
                announcements: [],
                badges: [],
                stats: {
                    totalStories,
                    totalUsers,
                    totalAuthors,
                    //pendingRequests
                }
            };

            this.loadStats();
            this.loadTables();
            
        } catch (mockError) {
            console.error('Error loading mock data:', mockError);
            this.showEmptyState();
        }
    }

    // Enhanced API methods with fallback
    async getAdminStats() {
        try {
            return await apiService.getAdminStats();
        } catch (error) {
            throw error;
        }
    }

    async getUsers(page = 1, limit = 50) {
        try {
            return await apiService.getUsers(page, limit);
        } catch (error) {
            throw error;
        }
    }

    async getAuthors(status='approved', page = 1, limit = 50) {
        try {
            return await apiService.getAuthors(status, page, limit);
        } catch (error) {
            throw error;
        }
    }

    async getPendingStories(page = 1, limit = 50) {
        try {
            return await apiService.getPendingStories(page, limit);
        } catch (error) {
            throw error;
        }
    }

    async getContests() {
        try {
            return await apiService.getContests();
        } catch (error) {
            return { data: [] };
        }
    }

    async getAnnouncements() {
        try {
            return await apiService.request('/admin/announcements');
        } catch (error) {
            return { data: [] };
        }
    }

    async getBadges() {
        try {
            return await apiService.request('/admin/badges');
        } catch (error) {
            return { data: [] };
        }
    }

    showEmptyState() {
        const containers = [
            'recent-stories-table', 'recent-users-table', 'user-management-table', 
            'author-management-table', 'content-management-table', 'contest-management-table',
            'announcement-management-table', 'badge-management-table'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const tbody = container.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="10" class="center-align grey-text">
                                <i class="material-icons large">error_outline</i>
                                <p>Unable to load data</p>
                                <button class="btn waves-effect waves-light" onclick="adminDashboard.retryLoading()">
                                    <i class="material-icons left">refresh</i>Retry
                                </button>
                            </td>
                        </tr>
                    `;
                }
            }
        });
    }

    async retryLoading() {
        await this.loadAdminData();
    }

    loadStats() {
        const stats = this.adminData.stats.stats;
        const vstats = this.visitorStats ? this.visitorStats.stats : null;

        document.getElementById('total-stories').textContent = stats.totalStories || 0;
        document.getElementById('total-users').textContent = stats.totalUsers || 0;
        document.getElementById('total-authors').textContent = this.adminData.authors.length || 0;
        document.getElementById('pending-requests').textContent = 0;
        document.getElementById('total-announcements').textContent = this.adminData.announcements.length || 0;
        document.getElementById('total-contests').textContent = this.adminData.contests.length || 0;

        // VISITORS STATS
        document.getElementById('total-visitors').textContent = vstats? vstats.totalVisitors : 0;   
        document.getElementById('unique-visitors').textContent = vstats? vstats.uniqueVisitorsVisitors : 0;
        document.getElementById('today-visitors').textContent = vstats? vstats.todayVisitors : 0; 
        document.getElementById('returning-visitors').textContent = vstats? vstats.returningVisitors : 0; 
    }

    loadTables() {
        this.loadRecentStories();
        //this.loadRecentUsers();
        this.loadUserManagementTable();
        this.loadAuthorManagementTable();
        this.loadContentManagementTable();
        this.loadContestManagementTable();
        this.loadAnnouncementManagementTable();
        this.loadBadgeManagementTable();
        this.loadVisitorAnalyticsTable();
    }

    loadRecentStories() {
        const tbody = document.querySelector('#recent-stories-table tbody');
        if (!tbody || !this.adminData.stories) return;
        
        tbody.innerHTML = '';
        
        this.adminData.stories.slice(0, 5).forEach(story => {
            const row = this.createStoryRow(story);
            tbody.appendChild(row);
        });
    }

    /*loadRecentUsers() {
        const tbody = document.querySelector('#pending-author-requests-table tbody');
        if (!tbody || !this.adminData.users) return;
        
        tbody.innerHTML = '';
        
        this.adminData.users.forEach(user => {
            if(!user.isAuthor && user.authorApplication.status === 'pending'){
                const row = this.createUserRow(user);
                tbody.appendChild(row);
            }
        });
    }*/

    loadUserManagementTable() {
        const tbody = document.querySelector('#user-management-table tbody');
        if (!tbody || !this.adminData.users) return;
        
        tbody.innerHTML = '';
        
        this.adminData.users.forEach(user => {
            const row = this.createUserManagementRow(user);
            tbody.appendChild(row);
        });
    }

    loadAuthorManagementTable() {
        const tbody = document.querySelector('#author-management-table tbody');
        if (!tbody || !this.adminData.authors) return;
        
        tbody.innerHTML = '';
        
        this.adminData.authors.forEach(author => {
            const row = this.createAuthorManagementRow(author);
            tbody.appendChild(row);
        });
    }

    loadContentManagementTable() {
        const tbody = document.querySelector('#content-management-table tbody');
        if (!tbody || !this.adminData.stories) return;
        
        tbody.innerHTML = '';
        
        this.adminData.stories.forEach(story => {
            const row = this.createContentManagementRow(story);
            tbody.appendChild(row);
        });
    }

    loadContestManagementTable() {
        const tbody = document.querySelector('#contest-management-table tbody');
        if (!tbody || !this.adminData.contests) return;
        
        tbody.innerHTML = '';
        
        this.adminData.contests.forEach(contest => {
            const row = this.createContestManagementRow(contest);
            tbody.appendChild(row);
        });
    }

    loadAnnouncementManagementTable() {
        const tbody = document.querySelector('#announcement-management-table tbody');
        if (!tbody || !this.adminData.announcements) return;
        
        tbody.innerHTML = '';
        
        this.adminData.announcements.forEach(announcement => {
            const row = this.createAnnouncementManagementRow(announcement);
            tbody.appendChild(row);
        });
    }

    loadBadgeManagementTable() {
        const tbody = document.querySelector('#badge-management-table tbody');
        if (!tbody || !this.adminData.badges) return;
        
        tbody.innerHTML = '';
        
        this.adminData.badges.forEach(badge => {
            const row = this.createBadgeManagementRow(badge);
            tbody.appendChild(row);
        });
    }

    loadVisitorAnalyticsTable() {
        const tbody = document.querySelector('#visitor-analytics-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="9" class="center-align">Visitor analytics data will be available soon</td></tr>';
    }

    // Enhanced row creation methods that handle both API and mock data structures
    createStoryRow(story) {
        const row = document.createElement('tr');
        
        const title = story.title || 'Untitled';
        const authorName = story.authorName || 
                          (story.author && story.author.displayName) || 
                          (story.author && story.author.username) || 
                          'Unknown';
        const category = story.category || story.genre || 'Uncategorized';
        const createdAt = story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Unknown';
        const status = story.status || 'published';
        const rating = story.rating || (story.stats && story.stats.rating) || '-';

        row.innerHTML = `
            <td>${title}</td>
            <td>${authorName}</td>
            <td>${category}</td>
            <td>${createdAt}</td>
            <td>${this.getStatusBadge(status)}</td>
            <td>${rating}</td>
            <td class="action-buttons">
                <button class="btn-admin" onclick="adminDashboard.editStory('${story._id || story.id}')">Edit</button>
                <button class="btn-admin-outline" onclick="adminDashboard.viewStory('${story._id || story.id}')">View</button>
            </td>
        `;
        return row;
    }

    createUserRow(user) {
        const row = document.createElement('tr');
        
        const username = user.username || 'Unknown';
        const email = user.email || 'No email';
        const status = user.authorApplication.status || 'pending';
        const role = user.role;

        row.innerHTML = `
            <td>${username}</td>
            <td>${email}</td>
            <td>${this.getStatusBadge(status)}</td>
            <td class="action-buttons">
                ${role === 'user' ? `<button class="btn-warning" onclick="adminDashboard.approveAuthorRequest('${user._id || user.id}')">Approve Author</button>` : ''}
             </td>
        `;
        return row;
    }

    createUserManagementRow(user) {
        const badgeElements = user.badges ? user.badges.map(badge => 
            `<span class="badge badge-${badge.name || badge}">${badge.name || badge}</span>`
        ).join('') : '';
        
        const username = user.username || 'Unknown';
        const email = user.email || 'No email';
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
        const role = user.role || 'user';
        const storiesCount = user.storiesCount || (user.stats && user.stats.storiesCount) || 0;
        const status = user.status || 'active';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${username} ${badgeElements}</td>
            <td>${email}</td>
            <td>${createdAt}</td>
            <td>${this.getRoleBadge(role)}</td>
            <td>${storiesCount}</td>
            <td>${this.getStatusBadge(status)}</td>
            <td class="action-buttons">
                ${role !== 'admin' ? `<button class="btn-success" onclick="adminDashboard.promoteToAdmin('${user._id || user.id}')">Make Admin</button>` : ''}
                ${role === 'user' ? `<button class="btn-warning" onclick="adminDashboard.approveAuthorRequest('${user._id || user.id}')">Approve Author</button>` : ''}
                <button class="btn-admin-outline" onclick="adminDashboard.viewUser('${user._id || user.id}')">View</button>
                ${status === 'active' ? `<button class="btn-danger" onclick="adminDashboard.suspendUser('${user._id || user.id}')">Suspend</button>` : ''}
                ${status === 'suspended' ? `<button class="btn-success" onclick="adminDashboard.activateUser('${user._id || user.id}')">Activate</button>` : ''}
            </td>
        `;
        return row;
    }

    createAuthorManagementRow(author) {
        const row = document.createElement('tr');
        
        const username = author.username || 'Unknown';
        const email = author.email || 'No email';
        const createdAt = author.createdAt ? new Date(author.createdAt).toLocaleDateString() : 'Unknown';
        const storiesCount = author.storiesCount || (author.stats && author.stats.storiesCount) || 0;
        const status = author.status || 'pending';

        row.innerHTML = `
            <td><input type="checkbox" class="author-checkbox" value="${author._id || author.id}"></td>
            <td>${username}</td>
            <td>${email}</td>
            <td>${createdAt}</td>
            <td>${storiesCount}</td>
            <td>${this.getStatusBadge(status)}</td>
            <td class="action-buttons">
                ${status === 'pending' ? `<button class="btn-success" onclick="adminDashboard.approveAuthor('${author._id || author.id}')">Approve</button>` : ''}
                ${status === 'pending' ? `<button class="btn-danger" onclick="adminDashboard.rejectAuthor('${author._id || author.id}')">Reject</button>` : ''}
                ${status === 'approved' ? `<button class="btn-admin" onclick="adminDashboard.featureAuthor('${author._id || author.id}')">Feature</button>` : ''}
                <button class="btn-admin-outline" onclick="adminDashboard.viewAuthor('${author._id || author.id}')">View</button>
            </td>
        `;
        return row;
    }
    
    // Additional row creation methods for other tables
    createContentManagementRow(story) {
        const row = document.createElement('tr');
        
        const title = story.title || 'Untitled';
        const authorName = story.authorName || 
                          (story.author && story.author.displayName) || 
                          (story.author && story.author.username) || 
                          'Unknown';
        const category = story.category || story.genre || 'Uncategorized';
        const createdAt = story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Unknown';
        const views = story.views || (story.stats && story.stats.views) || 0;
        const rating = story.rating || (story.stats && story.stats.rating) || '-';
        const status = story.status || 'published';

        row.innerHTML = `
            <td>${title}</td>
            <td>${authorName}</td>
            <td>${category}</td>
            <td>${createdAt}</td>
            <td>${views}</td>
            <td>${rating}</td>
            <td>${this.getStatusBadge(status)}</td>
            <td class="action-buttons">
                <button class="btn-admin" onclick="adminDashboard.editStory('${story._id || story.id}')">Edit</button>
                ${status === 'pending' ? `<button class="btn-success" onclick="adminDashboard.approveStory('${story._id || story.id}')">Approve</button>` : ''}
                ${status === 'pending' ? `<button class="btn-danger" onclick="adminDashboard.rejectStory('${story._id || story.id}')">Reject</button>` : ''}
            </td>
        `;
        return row;
    }

    createContestManagementRow(contest) {
        const row = document.createElement('tr');
        
        const name = contest.name || 'Unnamed Contest';
        const theme = contest.theme || 'No theme';
        const startDate = contest.startDate ? new Date(contest.startDate).toLocaleDateString() : 'TBD';
        const endDate = contest.endDate ? new Date(contest.endDate).toLocaleDateString() : 'TBD';
        const participants = contest.participants || contest.participantCount || 0;
        const status = contest.status || 'upcoming';

        row.innerHTML = `
            <td>${name}</td>
            <td>${theme}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${participants}</td>
            <td>${this.getStatusBadge(status)}</td>
            <td class="action-buttons">
                <button class="btn-admin" onclick="adminDashboard.editContest('${contest._id || contest.id}')">Edit</button>
                <button class="btn-admin-outline" onclick="adminDashboard.viewContest('${contest._id || contest.id}')">View</button>
            </td>
        `;
        return row;
    }

    createAnnouncementManagementRow(announcement) {
        const row = document.createElement('tr');
        
        const title = announcement.title || 'Untitled';
        const content = announcement.content ? announcement.content.substring(0, 50) + '...' : 'No content';
        const createdAt = announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Unknown';
        const status = announcement.status || 'active';

        row.innerHTML = `
            <td>${title}</td>
            <td>${content}</td>
            <td>${createdAt}</td>
            <td>${this.getStatusBadge(status)}</td>
            <td class="action-buttons">
                <button class="btn-admin" onclick="adminDashboard.editAnnouncement('${announcement._id || announcement.id}')">Edit</button>
                <button class="btn-danger" onclick="adminDashboard.deleteAnnouncement('${announcement._id || announcement.id}')">Delete</button>
            </td>
        `;
        return row;
    }

    createBadgeManagementRow(badge) {
        const row = document.createElement('tr');
        
        const name = badge.name || 'Unnamed Badge';
        const description = badge.description || 'No description';
        const type = badge.type || 'achievement';
        const recipients = badge.recipients || badge.recipientCount || 0;

        row.innerHTML = `
            <td>${name}</td>
            <td>${description}</td>
            <td>${type}</td>
            <td>${recipients}</td>
            <td class="action-buttons">
                <button class="btn-admin" onclick="adminDashboard.editBadge('${badge._id || badge.id}')">Edit</button>
                <button class="btn-admin-outline" onclick="adminDashboard.viewBadge('${badge._id || badge.id}')">View</button>
            </td>
        `;
        return row;
    }

    // Helper methods for badges and status
    getStatusBadge(status) {
        const statusMap = {
            'published': 'status-published',
            'active': 'status-published',
            'pending': 'status-pending',
            'rejected': 'status-rejected',
            'suspended': 'status-suspended',
            'approved': 'status-approved',
            'draft': 'status-pending',
            'expired': 'status-rejected',
            'completed': 'status-published',
            'upcoming': 'status-pending'
        };
        
        const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
        return `<span class="status-badge ${statusMap[status] || 'status-pending'}">${statusText}</span>`;
    }

    getRoleBadge(role) {
        const roleMap = {
            'user': '',
            'author': 'badge-author',
            'admin': 'badge-admin',
            'overallAdmin': 'badge-admin'
        };
        
        const roleText = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
        return roleMap[role] ? `<span class="badge ${roleMap[role]}">${roleText}</span>` : roleText;
    }

    setupEventListeners() {
        // Quick action cards
        const createAnnouncementBtn = document.getElementById('create-announcement');
        if (createAnnouncementBtn) {
            createAnnouncementBtn.addEventListener('click', () => {
                M.Modal.getInstance(document.getElementById('create-announcement-modal')).open();
            });
        }

        const manageContestBtn = document.getElementById('manage-contest');
        if (manageContestBtn) {
            manageContestBtn.addEventListener('click', () => {
                window.location.href = 'create-contest.html';
            });
        }

        const reviewRequestsBtn = document.getElementById('review-requests');
        if (reviewRequestsBtn) {
            reviewRequestsBtn.addEventListener('click', () => {
                this.switchToTab('author-management');
            });
        }

        const createBadgeBtn = document.getElementById('create-badge');
        if (createBadgeBtn) {
            createBadgeBtn.addEventListener('click', () => {
                M.Modal.getInstance(document.getElementById('create-badge-modal')).open();
            });
        }

        // Add refresh button listener
        const refreshDataBtn = document.getElementById('refresh-data-btn');
        if (refreshDataBtn) {
            refreshDataBtn.addEventListener('click', () => {
                this.manualRefresh();
            });
        }

        // Add auto-reload toggle button if exists
        const toggleAutoReloadBtn = document.getElementById('toggle-auto-reload');
        if (toggleAutoReloadBtn) {
            toggleAutoReloadBtn.addEventListener('click', () => {
                this.toggleAutoReload();
            });
        }

        // Tab navigation
        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.tab;
                this.switchToTab(tabId);
            });
        });

        // Sidebar Menu Items navigation
        document.querySelectorAll('.sidebar-menuitem').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.sideaction;
                this.switchToSideTab(tabId);
            });
        });

        // Form submissions
        const announcementForm = document.getElementById('announcement-form');
        if (announcementForm) {
            announcementForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAnnouncement();
            });
        }

        const contestForm = document.getElementById('contest-form');
        if (contestForm) {
            contestForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createContest();
            });
        }

        const badgeForm = document.getElementById('badge-form');
        if (badgeForm) {
            badgeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createBadge();
            });
        }

        // Author management
        const approveAuthorBtn = document.getElementById('approve-author-btn');
        if (approveAuthorBtn) {
            approveAuthorBtn.addEventListener('click', () => {
                this.approveSelectedAuthors();
            });
        }

        const selectAllAuthors = document.getElementById('select-all-authors');
        if (selectAllAuthors) {
            selectAllAuthors.addEventListener('change', (e) => {
                document.querySelectorAll('.author-checkbox').forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
        }

        // User promotion
        const promoteUserBtn = document.getElementById('promote-user-btn');
        if (promoteUserBtn) {
            promoteUserBtn.addEventListener('click', () => {
                this.populateUserPromotionSelect();
                M.Modal.getInstance(document.getElementById('promote-user-modal')).open();
            });
        }

        const confirmPromotionBtn = document.getElementById('confirm-promotion');
        if (confirmPromotionBtn) {
            confirmPromotionBtn.addEventListener('click', () => {
                this.confirmPromotion();
            });
        }

        // Visitor analytics refresh
        const refreshVisitorsBtn = document.getElementById('refresh-visitors-btn');
        if (refreshVisitorsBtn) {
            refreshVisitorsBtn.addEventListener('click', () => {
                this.refreshVisitorData();
            });
        }
    }

    switchToTab(tabId) {
        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(tabId);
        if (activeContent) activeContent.classList.add('active');

        this.currentTab = tabId;
    }

    switchToSideTab(tabId) {
        document.querySelectorAll('.sidebar-menuitem').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-sideaction="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(tabId);
        if (activeContent) activeContent.classList.add('active');

        this.currentTab = tabId;
    }

    // Toggle auto-reload on/off
    toggleAutoReload() {
        if (this.reloadInterval) {
            this.stopAutoReload();
            M.toast({html: 'Auto-reload disabled'});
        } else {
            this.startAutoReload();
            M.toast({html: 'Auto-reload enabled (30s)'});
        }
    }

    // Enhanced API Action Methods with mock data handling
    async approveAuthor(authorId) {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        try {
            await apiService.approveAuthor(authorId);
            M.toast({html: 'Author approved successfully!'});
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to approve author'});
        }
    }

    async rejectAuthor(authorId) {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        try {
            await apiService.rejectAuthor(authorId, 'Rejected by admin');
            M.toast({html: 'Author request rejected.'});
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to reject author'});
        }
    }

    async approveSelectedAuthors() {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        const selectedAuthors = document.querySelectorAll('.author-checkbox:checked');
        if (selectedAuthors.length === 0) {
            M.toast({html: 'Please select at least one author to approve.'});
            return;
        }

        try {
            for (const checkbox of selectedAuthors) {
                await apiService.approveAuthor(checkbox.value);
            }
            M.toast({html: `${selectedAuthors.length} authors approved successfully!`});
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to approve authors'});
        }
    }

    async promoteToAdmin(userId) {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        try {
            await apiService.updateUser(userId, {role: 'admin'}); 
            M.toast({html: 'User promoted to administrator!'});
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to promote user'});
        }
    }

    async createAnnouncement() {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        const formData = {
            title: document.getElementById('announcement-title').value,
            content: document.getElementById('announcement-content').value,
            type: document.getElementById('announcement-type').value,
            expiry: document.getElementById('announcement-expiry').value
        };

        try {
            await apiService.createAnnouncement(formData);
            M.toast({html: 'Announcement created successfully!'});
            M.Modal.getInstance(document.getElementById('create-announcement-modal')).close();
            document.getElementById('announcement-form').reset();
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to create announcement'});
        }
    }

    async createContest() {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        const formData = {
            name: document.getElementById('contest-name').value,
            description: document.getElementById('contest-description').value,
            theme: document.getElementById('contest-theme').value,
            startDate: document.getElementById('contest-start').value,
            endDate: document.getElementById('contest-end').value,
            prize: document.getElementById('contest-prize').value
        };

        try {
            await apiService.createContest(formData);
            M.toast({html: 'Contest created successfully!'});
            M.Modal.getInstance(document.getElementById('create-contest-modal')).close();
            document.getElementById('contest-form').reset();
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to create contest'});
        }
    }

    async createBadge() {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        const formData = {
            name: document.getElementById('badge-name').value,
            description: document.getElementById('badge-description').value,
            type: document.getElementById('badge-type').value,
            color: document.getElementById('badge-color').value,
            criteria: document.getElementById('badge-criteria').value
        };

        try {
            await apiService.createBadge(formData);
            M.toast({html: 'Badge created successfully!'});
            M.Modal.getInstance(document.getElementById('create-badge-modal')).close();
            document.getElementById('badgeform').reset();
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to create badge'});
        }
    }

    populateUserPromotionSelect() {
        const select = document.getElementById('user-to-promote');
        if (!select) return;
        
        select.innerHTML = '<option value="" disabled selected>Choose a user</option>';
        
        if (this.adminData.users) {
            this.adminData.users
                .filter(user => user.role !== 'admin' && user.role !== 'overallAdmin')
                .forEach(user => {
                    const option = document.createElement('option');
                    option.value = user._id || user.id;
                    option.textContent = `${user.username} (${user.email})`;
                    select.appendChild(option);
                });
            
            M.FormSelect.init(select);
        }
    }

    confirmPromotion() {
        const userId = document.getElementById('user-to-promote').value;
        if (userId) {
            this.promoteToAdmin(userId);
            M.Modal.getInstance(document.getElementById('promote-user-modal')).close();
        }
    }

    async refreshVisitorData() {
        try {
            const visitorStats = await this.getVisitorStats();
            this.adminData.visitorStats = visitorStats;
            this.loadStats();
            M.toast({html: 'Visitor data refreshed!'});
        } catch (error) {
            M.toast({html: 'Failed to refresh visitor data'});
        }
    }

    // Enhanced action methods with proper error handling
    async editStory(id) { 
        try {
            const story = await apiService.getStory(id);
            M.toast({html: `Editing story: ${story.title}`});
        } catch (error) {
            M.toast({html: `Failed to load story: ${error.message}`});
        }
    }
    
    async viewStory(id) { 
        try {
            const story = await apiService.getStory(id);
            window.location.href = `/frontend/story.html?id=${id}`;
        } catch (error) {
            M.toast({html: `Failed to load story: ${error.message}`});
        }
    }
    
    async viewUser(id) { 
        try {
            const user = await apiService.getUserProfile(id);
            M.toast({html: `Viewing user: ${user.username}`});
        } catch (error) {
            M.toast({html: `Failed to load user: ${error.message}`});
        }
    }
    
    async viewAuthor(id) { 
        try {
            const author = await apiService.getAuthorProfile(id);
            M.toast({html: `Viewing author: ${author.penName}`});
        } catch (error) {
            M.toast({html: `Failed to load author: ${error.message}`});
        }
    }
    
    async approveAuthorRequest(id) { 
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        try {
            await apiService.approveAuthor(id);
            M.toast({html: `Author request approved for user ${id}`});
            await this.refreshData();
        } catch (error) {
            M.toast({html: `Failed to approve author: ${error.message}`});
        }
    }
    
    async suspendUser(id) { 
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        try {
            await apiService.suspendUser(id, 'Suspended by admin');
            M.toast({html: `User ${id} suspended`});
            await this.refreshData();
        } catch (error) {
            M.toast({html: `Failed to suspend user: ${error.message}`});
        }
    }
    
    async activateUser(id) { 
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        try {
            await apiService.activateUser(id);
            M.toast({html: `User ${id} activated`});
            await this.refreshData();
        } catch (error) {
            M.toast({html: `Failed to activate user: ${error.message}`});
        }
    }
    
    async featureAuthor(id) { 
        M.toast({html: `Featuring author ${id}`});
    }

    // Additional action methods
    async approveStory(storyId) {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        try {
            await apiService.approveStory(storyId);
            M.toast({html: 'Story approved successfully!'});
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to approve story'});
        }
    }

    async rejectStory(storyId) {
        if (this.useMockData) {
            M.toast({html: 'Action not available in demo mode'});
            return;
        }

        try {
            await apiService.rejectStory(storyId, 'Rejected by admin');
            M.toast({html: 'Story rejected.'});
            await this.refreshData();
        } catch (error) {
            M.toast({html: error.message || 'Failed to reject story'});
        }
    }

    // Clean up when leaving the page
    destroy() {
        this.stopAutoReload();
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (AuthManager.isAdmin()) {
        window.adminDashboard = new AdminDashboard();
        
        // Clean up when leaving the page
        window.addEventListener('beforeunload', function() {
            if (window.adminDashboard) {
                window.adminDashboard.destroy();
            }
        });
    } else {
        window.location.href = '/frontend/signin.html';
    }
});

/*
## Auto-Refresh Features:

1. **30-Second Auto-Reload**: Data automatically refreshes every 30 seconds
2. **Smart Loading**: Prevents reloads when already loading or modals are open
3. **Visual Feedback**: 
   - Loading indicator during refresh
   - Last updated timestamp display
4. **Manual Control**: 
   - Manual refresh button support
   - Auto-reload toggle functionality
5. **Proper Cleanup**: Stops intervals when leaving the page

## Key Integration Points:

- Auto-reload starts automatically when dashboard initializes
- All stats cards and data tables are updated on each refresh
- Error handling prevents auto-reload from interrupting user experience
- Visual indicators show when data is being refreshed

The dashboard will now keep all data fresh and up-to-date automatically while maintaining all the existing functionality!

*/



