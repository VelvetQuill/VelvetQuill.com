

// admin-users.js - Simplified User Management System
class AdminUsersManager {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.selectedUsers = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUsersData();
    }

    bindEvents() {
        // Search and filter
        document.getElementById('userSearch').addEventListener('input', 
            this.debounce(() => this.handleSearch(), 300));
        document.getElementById('userFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.applyFilters();
        });
        document.getElementById('refreshUsers').addEventListener('click', () => this.loadUsersData());

        // Bulk actions
        document.getElementById('selectAll').addEventListener('change', (e) => this.toggleSelectAll(e));
        document.getElementById('bulkSuspend').addEventListener('click', () => this.bulkAction('suspend'));
        document.getElementById('bulkActivate').addEventListener('click', () => this.bulkAction('activate'));
        document.getElementById('bulkDelete').addEventListener('click', () => this.bulkAction('delete'));
        document.getElementById('clearSelection').addEventListener('click', () => this.clearSelection());

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());

        // Modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Retry button
        document.getElementById('retryLoad').addEventListener('click', () => this.loadUsersData());
    }

    async loadUsersData() {
        this.showLoading();
        this.hideError();
        this.hideUsersTable();

        try {
            // Use existing admin/users endpoint
            const response = await fetch('/api/admin/users?limit=1000', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const data = await response.json();
            
            if (data.success) {
                this.users = data.users || [];
                this.updateStatistics();
                this.applyFilters();
                this.hideLoading();
                this.showUsersTable();
            } else {
                throw new Error(data.message || 'Failed to load users');
            }
            
        } catch (error) {
            console.error('Failed to load users:', error);
            this.hideLoading();
            this.showError();
        }
    }

    updateStatistics() {
        // Calculate stats from existing user data
        const visitorsCount = 0; // Would come from your analytics if available
        const registeredCount = this.users.length;
        const authorsCount = this.users.filter(u => u.isAuthor || u.role === 'author').length;
        const pendingCount = this.users.filter(u => u.authorApplication?.status === 'pending').length;

        document.getElementById('visitorsCount').textContent = visitorsCount;
        document.getElementById('registeredCount').textContent = registeredCount;
        document.getElementById('authorsCount').textContent = authorsCount;
        document.getElementById('pendingCount').textContent = pendingCount;
    }

    applyFilters() {
        let filtered = [...this.users];

        // Apply type filter using existing user properties
        switch (this.currentFilter) {
            case 'visitors':
                // Visitors would be handled separately via analytics
                filtered = [];
                break;
            case 'registered':
                filtered = filtered.filter(user => !user.isAuthor && user.role === 'user');
                break;
            case 'authors':
                filtered = filtered.filter(user => user.isAuthor || user.role === 'author');
                break;
            case 'pending-authors':
                filtered = filtered.filter(user => user.authorApplication?.status === 'pending');
                break;
            case 'suspended':
                filtered = filtered.filter(user => user.isSuspended);
                break;
        }

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(user => 
                user.username?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.displayName?.toLowerCase().includes(query)
            );
        }

        this.filteredUsers = filtered;
        this.currentPage = 1;
        this.renderUsersTable();
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedUsers = this.filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);

        tbody.innerHTML = paginatedUsers.map(user => this.createUserRow(user)).join('');

        this.updatePagination();
        this.updateBulkActions();
        this.setupUserRowEvents();
    }

    createUserRow(user) {
        const isSelected = this.selectedUsers.has(user._id);
        const userType = this.getUserType(user);
        const status = this.getUserStatus(user);
        const joinDate = new Date(user.createdAt).toLocaleDateString();
        const lastActive = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
        
        // Use existing stats from your user model
        const storyCount = user.stories?.length || 0;
        const followersCount = user.followers?.length || 0;
        const totalLikes = user.totalLikes || 0;

        return `
            <tr class="user-row ${isSelected ? 'selected' : ''} ${user.isSuspended ? 'suspended' : ''}">
                <td><input type="checkbox" class="user-checkbox" value="${user._id}" ${isSelected ? 'checked' : ''}></td>
                <td class="user-info">
                    <div class="user-avatar">
                        <img src="${user.profile?.avatar || '../assets/images/default-avatar.png'}" alt="${user.username}">
                    </div>
                    <div class="user-details">
                        <div class="user-name">${user.displayName || user.username}</div>
                        <div class="user-email">${user.email}</div>
                        <div class="user-username">@${user.username}</div>
                    </div>
                </td>
                <td><span class="user-type-badge ${userType}">${userType}</span></td>
                <td><span class="status-badge ${status}">${status}</span></td>
                <td>${joinDate}</td>
                <td>${lastActive}</td>
                <td>${storyCount}</td>
                <td>
                    <div class="engagement-stats">
                        <span title="Followers">👥 ${followersCount}</span>
                        <span title="Likes">❤️ ${totalLikes}</span>
                    </div>
                </td>
                <td class="user-actions">
                    <button class="btn-info view-user" data-userid="${user._id}">View</button>
                    ${user.authorApplication?.status === 'pending' ? 
                        `<button class="btn-warning review-application" data-userid="${user._id}">Review App</button>` : ''}
                    ${!user.isSuspended ? 
                        `<button class="btn-warning suspend-user" data-userid="${user._id}">Suspend</button>` :
                        `<button class="btn-success activate-user" data-userid="${user._id}">Activate</button>`}
                    <button class="btn-danger delete-user" data-userid="${user._id}">Delete</button>
                </td>
            </tr>
        `;
    }

    getUserType(user) {
        if (user.role === 'admin' || user.role === 'overallAdmin') return 'admin';
        if (user.isAuthor || user.role === 'author') return 'author';
        return 'user';
    }

    getUserStatus(user) {
        if (user.isSuspended) return 'suspended';
        if (user.authorApplication?.status === 'pending') return 'pending';
        return 'active';
    }

    // Event handlers for user actions
    setupUserRowEvents() {
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.toggleUserSelection(e.target.value, e.target.checked));
        });

        document.querySelectorAll('.view-user').forEach(btn => {
            btn.addEventListener('click', (e) => this.viewUserDetails(e.target.dataset.userid));
        });

        document.querySelectorAll('.review-application').forEach(btn => {
            btn.addEventListener('click', (e) => this.reviewAuthorApplication(e.target.dataset.userid));
        });

        document.querySelectorAll('.suspend-user').forEach(btn => {
            btn.addEventListener('click', (e) => this.suspendUser(e.target.dataset.userid));
        });

        document.querySelectorAll('.activate-user').forEach(btn => {
            btn.addEventListener('click', (e) => this.activateUser(e.target.dataset.userid));
        });

        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteUser(e.target.dataset.userid));
        });
    }

    // User action methods using existing endpoints
    async viewUserDetails(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch user details');
            
            const data = await response.json();
            
            if (data.success) {
                this.showUserDetailModal(data.user);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showError('Failed to load user details: ' + error.message);
        }
    }

    async reviewAuthorApplication(userId) {
        try {
            const user = this.users.find(u => u._id === userId);
            if (user && user.authorApplication?.status === 'pending') {
                this.showAuthorApplicationModal(user);
            } else {
                this.showError('No pending application found for this user');
            }
        } catch (error) {
            this.showError('Failed to load application');
        }
    }

    async suspendUser(userId) {
        if (confirm('Are you sure you want to suspend this user?')) {
            try {
                const response = await fetch(`/api/admin/users/${userId}/suspend`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ reason: 'Admin suspension' })
                });
                
                if (!response.ok) throw new Error('Failed to suspend user');
                
                const data = await response.json();
                
                if (data.success) {
                    this.showSuccess('User suspended successfully');
                    this.loadUsersData();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                this.showError('Failed to suspend user: ' + error.message);
            }
        }
    }

    async activateUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to activate user');
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('User activated successfully');
                this.loadUsersData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showError('Failed to activate user: ' + error.message);
        }
    }

    async deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) throw new Error('Failed to delete user');
                
                const data = await response.json();
                
                if (data.success) {
                    this.showSuccess('User deleted successfully');
                    this.loadUsersData();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                this.showError('Failed to delete user: ' + error.message);
            }
        }
    }

    // Bulk actions using individual API calls
    async bulkAction(action) {
        const userIds = Array.from(this.selectedUsers);
        if (userIds.length === 0) return;

        const actionText = {
            suspend: 'suspend',
            activate: 'activate', 
            delete: 'delete'
        }[action];

        if (confirm(`Are you sure you want to ${actionText} ${userIds.length} users?`)) {
            try {
                // Use individual API calls since bulk endpoint might not exist
                const promises = userIds.map(userId => {
                    switch (action) {
                        case 'suspend':
                            return fetch(`/api/admin/users/${userId}/suspend`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({ reason: 'Bulk action' })
                            });
                        case 'activate':
                            return fetch(`/api/admin/users/${userId}/activate`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            });
                        case 'delete':
                            return fetch(`/api/admin/users/${userId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            });
                    }
                });

                await Promise.all(promises);
                this.showSuccess(`Successfully ${actionText}ed ${userIds.length} users`);
                this.clearSelection();
                this.loadUsersData();
            } catch (error) {
                this.showError(`Failed to ${actionText} users: ${error.message}`);
            }
        }
    }

    // Selection management
    toggleSelectAll(e) {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
            this.toggleUserSelection(checkbox.value, e.target.checked);
        });
    }

    toggleUserSelection(userId, selected) {
        if (selected) {
            this.selectedUsers.add(userId);
        } else {
            this.selectedUsers.delete(userId);
            document.getElementById('selectAll').checked = false;
        }
        this.updateBulkActions();
    }

    clearSelection() {
        this.selectedUsers.clear();
        document.getElementById('selectAll').checked = false;
        document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
        this.updateBulkActions();
    }

    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');

        if (this.selectedUsers.size > 0) {
            bulkActions.classList.remove('hidden');
            selectedCount.textContent = this.selectedUsers.size;
        } else {
            bulkActions.classList.add('hidden');
        }
    }

    // Pagination
    updatePagination() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderUsersTable();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderUsersTable();
        }
    }

    // Search with debounce
    handleSearch() {
        this.searchQuery = document.getElementById('userSearch').value.trim();
        this.applyFilters();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Modal management
    showUserDetailModal(user) {
        const content = document.getElementById('userDetailContent');
        content.innerHTML = this.generateUserDetailHTML(user);
        document.getElementById('userDetailModal').classList.remove('hidden');
    }

    showAuthorApplicationModal(user) {
        const content = document.getElementById('applicationContent');
        content.innerHTML = this.generateApplicationHTML(user);
        
        // Set up approval/rejection handlers
        document.getElementById('approveApplication').onclick = () => this.approveAuthor(user._id);
        document.getElementById('rejectApplication').onclick = () => this.rejectAuthor(user._id);
        document.getElementById('closeApplication').onclick = () => this.closeModals();
        
        document.getElementById('authorApplicationModal').classList.remove('hidden');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
    }

    // Author application actions using existing endpoints
    async approveAuthor(userId) {
        try {
            const response = await fetch(`/api/admin/authors/${userId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to approve author');
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Author application approved');
                this.closeModals();
                this.loadUsersData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showError('Failed to approve author: ' + error.message);
        }
    }

    async rejectAuthor(userId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
            try {
                const response = await fetch(`/api/admin/authors/${userId}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ reason })
                });
                
                if (!response.ok) throw new Error('Failed to reject author');
                
                const data = await response.json();
                
                if (data.success) {
                    this.showSuccess('Author application rejected');
                    this.closeModals();
                    this.loadUsersData();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                this.showError('Failed to reject author: ' + error.message);
            }
        }
    }

    // HTML generators for modals
    generateUserDetailHTML(user) {
        return `
            <div class="user-detail-view">
                <div class="user-header">
                    <img src="${user.profile?.avatar || '../assets/images/default-avatar.png'}" 
                         alt="${user.username}" class="detail-avatar">
                    <div class="user-header-info">
                        <h4>${user.displayName || user.username}</h4>
                        <p>@${user.username} • ${user.email}</p>
                        <p>Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
                        <p>Role: ${user.role} ${user.isAuthor ? '(Author)' : ''}</p>
                        ${user.isSuspended ? `<p style="color: red;">SUSPENDED: ${user.suspensionReason || 'No reason provided'}</p>` : ''}
                    </div>
                </div>
                
                <div class="user-stats">
                    <div class="stat-item">
                        <strong>Stories:</strong> ${user.stories?.length || 0}
                    </div>
                    <div class="stat-item">
                        <strong>Followers:</strong> ${user.followers?.length || 0}
                    </div>
                    <div class="stat-item">
                        <strong>Following:</strong> ${user.following?.length || 0}
                    </div>
                </div>

                ${user.profile?.bio ? `<div class="user-bio"><strong>Bio:</strong> ${user.profile.bio}</div>` : ''}
                
                ${user.authorApplication ? `
                <div class="author-application-info">
                    <h5>Author Application</h5>
                    <p><strong>Status:</strong> ${user.authorApplication.status}</p>
                    <p><strong>Applied:</strong> ${new Date(user.authorApplication.appliedAt).toLocaleDateString()}</p>
                    ${user.authorApplication.rejectionReason ? `
                        <p><strong>Rejection Reason:</strong> ${user.authorApplication.rejectionReason}</p>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        `;
    }

    generateApplicationHTML(user) {
        const app = user.authorApplication;
        return `
            <div class="application-review">
                <div class="applicant-info">
                    <h4>${user.displayName || user.username} (@${user.username})</h4>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Applied:</strong> ${new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
                
                <div class="application-content">
                    ${user.profile?.bio ? `
                    <h5>User Bio:</h5>
                    <div class="writing-sample">
                        ${user.profile.bio}
                    </div>
                    ` : '<p>No bio provided.</p>'}
                </div>
            </div>
        `;
    }

    // UI State Management
    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showError(message = '') {
        if (message) alert(message);
        document.getElementById('errorState').classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorState').classList.add('hidden');
    }

    showUsersTable() {
        document.getElementById('usersTable').classList.remove('hidden');
    }

    hideUsersTable() {
        document.getElementById('usersTable').classList.add('hidden');
    }

    showSuccess(message) {
        // Simple alert for success messages
        alert(`✅ ${message}`);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Simple admin check - you can enhance this based on your auth system
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    window.adminUsersManager = new AdminUsersManager();
});


