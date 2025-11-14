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
        
        // Check admin privileges
        if (!AuthManager.isAdmin()) {
            window.location.href = '/frontend/signin.html';
            return;
        }
        

        console.log("INITIALIZING ADMIN DASHBOARD");
        this.initializeDashboard();
    }

    async initializeDashboard() {
        console.log("INITIALIZING COMPONENTS");
        this.initializeComponents();
        console.log("LOADING ADMIN DATA");
        await this.loadAdminData();
        console.log("SETTING UP EVENT LISTENERS");
        this.setupEventListeners();
        console.log("INITIALIZING CHARTS");
        this.initializeCharts();
        this.loadVisitorStats();
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
               console.warn('TABS INITIALIZATION FAILED!');
               this.switchToTab('dashboard');
            }
        }
    }

    async loadVisitorStats(){
        try{

            return await apiService.getVisitorStats();
            console.log('Total visitors:', visitorStats.stats.totalVisitors);

        }catch(error){
            console.warn('Could not load visitor stats: ', error);

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
                this.getAdminStats(), //totalStories,totalUsers,totalAuthors,pendingStories,pendingAuthors,recentStories,recentUsers
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

                console.log('DASHBOARD AUTHORS: ', authors.authors[0]);
                console.log('DASHBOARD USERS: ', users);
                console.log('DASHBOARD STORIES: ', stories);
                console.log('DASHBOARD ANNONCEMENTS: ', announcements);
                console.log('DASHBOARD BADGES: ', badges);

                
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

            console.log('ADMIN DATA LOADED: ',{
                users: this.adminData.users.length,
                authors: this.adminData.authors.length,
                stories: this.adminData.stories.length,
                contests: this.adminData.contests.length,
                announcements: this.adminData.announcements.length,
                badges: this.adminData.badges.length,
                visitorStats: this.adminData.visitorStats
            });

            this.useMockData = false;
            this.loadStats();
            this.loadTables();

        } catch (error) {
            console.error('Error loading admin data:', error);
            M.toast({html: 'Failed to load admin data. Using backup data.'});
            await this.loadMockData();
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
            const pendingRequests = authorUsers.filter(author => author.status === 'pending').length;

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
                    pendingRequests
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
            // Stats will be calculated from mock data in loadMockData
            throw error;
        }
    }

    async getUsers(page = 1, limit = 50) {
        try {
            return await apiService.getUsers(page, limit);
        } catch (error) {
            // Users will be provided from mock data
            throw error;
        }
    }

    async getAuthors(status='approved', page = 1, limit = 50) {
        try {
            return await apiService.getAuthors(status, page, limit);
        } catch (error) {
            // Authors will be provided from mock data
            throw error;
        }
    }

    async getPendingStories(page = 1, limit = 50) {
        try {
            return await apiService.getPendingStories(page, limit);
        } catch (error) {
            // Stories will be provided from mock data
            throw error;
        }
    }

    async getContests() {
        try {
            return await apiService.getContests();
        } catch (error) {
            // Return empty array for contests if API fails
            console.warn('Could not load contests:', error);
            return { data: [] };
        }
    }

    async getAnnouncements() {
        try {
            return await apiService.request('/admin/announcements');
        } catch (error) {
            // Return empty array for announcements if API fails
            console.warn('Could not load announcements:', error);
            return { data: [] };
        }
    }

    async getBadges() {
        try {
            return await apiService.request('/admin/badges');
        } catch (error) {
            // Return empty array for badges if API fails
            console.warn('Could not load badges:', error);
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
        console.log("ATTEMPTING TO LOAD STATS...");
        const stats = this.adminData.stats.stats;

        console.log('STATS: ',stats);
        console.lohg('VISITOR STATS: ',this.visitorStats);

        document.getElementById('total-stories').textContent = stats.totalStories || 0;
        document.getElementById('total-users').textContent = stats.totalUsers || 0;

        document.getElementById('total-authors').textContent = this.adminData.authors.length || 0;
        document.getElementById('pending-requests').textContent = stats.pendingAuthors || 0;

        document.getElementById('total-announcements').textContent = this.adminData.announcements.length || 0;
        document.getElementById('total-contests').textContent = this.adminData.contests.length || 0;

        //VISITORS STATS

        document.getElementById('total-visitors').textContent = this.visitorStats? this.visitorStats.totalVisitors || 0 : 0;   
        document.getElementById('unique-visitors').textContent = this.visitorStats? this.visitorStats.uniqueVisitors || 0 : 0;
        document.getElementById('today-visitors').textContent = this.visitorStats? this.visitorStats.todayVisitors || 0 : 0;
        document.getElementById('returning-visitors').textContent = this.visitorStats? this.visitorStats.returningVisitors || 0 : 0;

        console.log("STATS LOADED !");
    }

    loadTables() {
        console.log("ATTEMPTING TO LOAD TABLES....");
        this.loadRecentStories();
        this.loadRecentUsers();
        this.loadUserManagementTable();
        this.loadAuthorManagementTable();
        this.loadContentManagementTable();
        this.loadContestManagementTable();
        this.loadAnnouncementManagementTable();
        this.loadBadgeManagementTable();
        this.loadVisitorAnalyticsTable();
        
        console.log("TABLES LOADED !");
    }

    loadRecentStories() {
        console.log("ATTEMPTING TO LOAD RECENT STORIES...");
        const tbody = document.querySelector('#recent-stories-table tbody');
        if (!tbody || !this.adminData.stories) return;
        
        tbody.innerHTML = '';
        
        this.adminData.stories.slice(0, 5).forEach(story => {
            const row = this.createStoryRow(story);
            tbody.appendChild(row);
        });
        console.log("RECENT STORIES LOADED");
    }

    loadRecentUsers() {
        console.log("ATTEMPTING TO LOAD RECENT USERS....");
        const tbody = document.querySelector('#pending-author-requests-table tbody');
        if (!tbody || !this.adminData.users) return;
        
        tbody.innerHTML = '';
        
        this.adminData.users.forEach(user => {
            if(!user.isAuthor && user.authorApplication.status === 'pending'){
                const row = this.createUserRow(user);
                tbody.appendChild(row);
            }
        });
        console.log("Pending Author Requests LOADED !");
    }

    loadUserManagementTable() {
        console.log("ATTEMPTING TO LOAD USER MANAGEMENT TABLE....");
        const tbody = document.querySelector('#user-management-table tbody');
        if (!tbody || !this.adminData.users) return;
        
        tbody.innerHTML = '';
        
        this.adminData.users.forEach(user => {
            const row = this.createUserManagementRow(user);
            tbody.appendChild(row);
        });
        console.log("USER MANAGEMENT TABLE LOADED !");
    }

    loadAuthorManagementTable() {
        console.log("ATTEMPTING TO LOAD AUTHOR MANAGEMENT TABLE....");
        const tbody = document.querySelector('#author-management-table tbody');
        if (!tbody || !this.adminData.authors) return;
        
        tbody.innerHTML = '';
        
        this.adminData.authors.forEach(author => {
                const row = this.createAuthorManagementRow(author);
                tbody.appendChild(row);
        });
        console.log("AUTHOR MANAGEMENT TABLE LOADED");
    }

    loadContentManagementTable() {
        console.log("ATTEMPTING TO LOAD CONTEST MANAGEMENT TABLE....");
        const tbody = document.querySelector('#content-management-table tbody');
        if (!tbody || !this.adminData.stories) return;
        
        tbody.innerHTML = '';
        
        this.adminData.stories.forEach(story => {
            const row = this.createContentManagementRow(story);
            tbody.appendChild(row);
        });
        console.log("CONTENT MANAGEMENT TABLE LOADED ");
    }

    loadContestManagementTable() {
        console.log("ATTEMPTING TO LOAD CONTEST MGNT. TABLE....");
        const tbody = document.querySelector('#contest-management-table tbody');
        if (!tbody || !this.adminData.contests) return;
        
        tbody.innerHTML = '';
        
        this.adminData.contests.forEach(contest => {
            const row = this.createContestManagementRow(contest);
            tbody.appendChild(row);
        });
        console.log("CONTEST MGNT. TABLE LOADED");
    }

    loadAnnouncementManagementTable() {
        console.log("ATTEMPTING TO LOAD ANNOUNCEMENT MGNT. TABLE...");
        const tbody = document.querySelector('#announcement-management-table tbody');
        if (!tbody || !this.adminData.announcements) return;
        
        tbody.innerHTML = '';
        
        this.adminData.announcements.forEach(announcement => {
            const row = this.createAnnouncementManagementRow(announcement);
            tbody.appendChild(row);
        });
        console.log("ANNOUNCEMENT MGNT TABLE LOADED");
    }

    loadBadgeManagementTable() {
        console.log("ATTEMPTING TO LOAD BADGE MANAGEMENT TABLE....");
        const tbody = document.querySelector('#badge-management-table tbody');
        if (!tbody || !this.adminData.badges) return;
        
        tbody.innerHTML = '';
        
        this.adminData.badges.forEach(badge => {
            const row = this.createBadgeManagementRow(badge);
            tbody.appendChild(row);
        });
        console.log("BADGE MGNT. TABLE LOADED");
    }

    // Add visitor analytics table method
    loadVisitorAnalyticsTable() {
        console.log("ATTEMPTING TO LOAD VISITOR ANALYTICS TABLE....");
        const tbody = document.querySelector('#visitor-analytics-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="9" class="center-align">Visitor analytics data will be available soon</td></tr>';
        
        // Note: You'll need to implement an API endpoint to get detailed visitor data
        // For now, we're showing a placeholder
        console.log("VISITOR ANALYTICS TABLE LOADED");
    }

    // Enhanced row creation methods that handle both API and mock data structures
    createStoryRow(story) {
        const row = document.createElement('tr');
        
        // Handle both API response structure and mock data structure
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
        // Update active tab
        console.log("SWITCHING ACTIVE TAG TO: "+tabId);
        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Show active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(tabId);
        if (activeContent) activeContent.classList.add('active');

        this.currentTab = tabId;
    }

    
    switchToSideTab(tabId) {
        // Update active tab
        console.log("SWITCHING ACTIVE TAG TO: "+tabId);
        document.querySelectorAll('.sidebar-menuitem').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-sideaction="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Show active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(tabId);
        if (activeContent) activeContent.classList.add('active');

        this.currentTab = tabId;
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

    async refreshData() {
        await this.loadAdminData();
    }

    // Chart initialization
    initializeCharts() {
        this.initializeCategoryChart();
        //this.initializeUserTrendChart();
        this.initializeStatusChart();
        //this.initializeTopRatedChart();
        //this.initializeVisitorCharts();
    }

    initializeCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        // Use real data from stories for chart
        const categoryCounts = {};
        if (this.adminData.stories) {
            this.adminData.stories.forEach(story => {
                const category = story.category || 'Uncategorized';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
        }

        new Chart(ctx,{
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryCounts),
                datasets: [{
                    data: Object.values(categoryCounts),
                    backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0', '9966FF','#FF9F40','#FF6384','#C9CBCF']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: 'bottom'
                },
                title: {
                    display: true,
                    text: 'STORIES BY CATEGORY'
                }
            }
        });
        
    }

    
initializeStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    // Quick calculation directly in the chart method
    let totalUsers = 0, totalAuthors = 0, totalAdmins = 0, pendingRequests = 0;
    
    if (this.adminData.users && Array.isArray(this.adminData.users)) {
        this.adminData.users.forEach(user => {
            if (user.isActive !== false && user.status === 'active') {
                totalUsers++;
                
                if (user.role === 'author' || user.isAuthor === true) {
                    totalAuthors++;
                }
                
                if (user.role === 'admin' || user.role === 'overallAdmin') {
                    totalAdmins++;
                }
                
                if (user.authorApplication && user.authorApplication.status === 'pending') {
                    pendingRequests++;
                }
            }
        });
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Users', 'Authors', 'Admins', 'Pending Requests'],
            datasets: [{
                data: [totalUsers, totalAuthors, totalAdmins, pendingRequests],
                backgroundColor: ['#2196F3', '#4CAF50', '#FF9800', '#F44336'],
                borderColor: ['#0b7dda', '#45a049', '#e68900', '#d32f2f'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'User Statistics'
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

    // Other chart methods remain the same...

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
            // Implement actual edit functionality
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
            // Implement user view modal
        } catch (error) {
            M.toast({html: `Failed to load user: ${error.message}`});
        }
    }
    
    async viewAuthor(id) { 
        try {
            const author = await apiService.getAuthorProfile(id);
            M.toast({html: `Viewing author: ${author.penName}`});
            // Implement author view modal
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
        // Implement feature author functionality
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
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (AuthManager.isAdmin()) {
        window.adminDashboard = new AdminDashboard();
    } else {
        window.location.href = '/frontend/signin.html';
    }
});


