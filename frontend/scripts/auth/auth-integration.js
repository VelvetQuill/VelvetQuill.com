// frontend/scripts/auth/auth-integration.js
class AuthManager {
    static isAuthenticated() {
        const token = localStorage.getItem('velvetquill_token');
        const user = localStorage.getItem('velvetquill_user');
        return !!(token && user);
    }

    static getCurrentUser() {
        const userData = localStorage.getItem('velvetquill_user');
        try {
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.logout();
            return null;
        }
    }

    static getToken() {
        return localStorage.getItem('velvetquill_token');
    }

    static isAuthor() {
        const user = this.getCurrentUser();
        return user ? (user.isAuthor || user.role === 'author') : false;
    }

    static isAdmin() {
        const user = this.getCurrentUser();
        return user ? user.role === 'admin' : false;
    }

    static async logout() {
        try {
            // Call backend logout if API service is available
            if (window.apiService && window.apiService.token) {
                await window.apiService.logout();
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            // Clear all auth-related data
            this.clearAuthData();
            
            // Redirect to login page
            window.location.href = './signin.html';
        }
    }

    static clearAuthData() {
        const itemsToRemove = [
            'velvetquill_token',
            'velvetquill_user',
            'velvetquill_user_session',
            'velvetquill_remember_me',
            'velvetquill_last_identifier'
        ];
        
        itemsToRemove.forEach(item => localStorage.removeItem(item));
        
        // Clear API service token if exists
        if (window.apiService) {
            window.apiService.clearToken();
        }
    }

    static requireAuth(redirectUrl = './signin.html') {
        if (!this.isAuthenticated()) {
            // Store current page for redirect back after login
            sessionStorage.setItem('velvetquill_redirect_url', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    static requireAuthor(redirectUrl = './signin.html') {
        if (!this.isAuthenticated()) {
            this.requireAuth(redirectUrl);
            return false;
        }
        
        if (!this.isAuthor()) {
            window.location.href = './unauthorized.html'; // Create this page
            return false;
        }
        return true;
    }

    static requireAdmin(redirectUrl = './signin.html') {
        if (!this.isAuthenticated()) {
            this.requireAuth(redirectUrl);
            return false;
        }
        
        if (!this.isAdmin()) {
            window.location.href = './unauthorized.html';
            return false;
        }
        return true;
    }

    static getRedirectUrl() {
        const url = sessionStorage.getItem('velvetquill_redirect_url');
        sessionStorage.removeItem('velvetquill_redirect_url');
        return url || './index.html';
    }

    static async refreshToken() {
        if (!window.apiService) {
            console.warn('API service not available for token refresh');
            return false;
        }

        try {
            const response = await window.apiService.verifyToken();
            if (response.success) {
                // Update user data if needed
                localStorage.setItem('velvetquill_user', JSON.stringify(response.user));
                return true;
            }
        } catch (error) {
            console.warn('Token refresh failed:', error);
            this.logout();
        }
        return false;
    }

    static init() {
        // Check authentication status on page load
        if (this.isAuthenticated()) {
            // Set token in API service
            if (window.apiService) {
                window.apiService.setToken(this.getToken());
            }
            
            // Verify token is still valid
            this.refreshToken().catch(console.error);
        }
        
        // Add global logout handler (optional)
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-logout]')) {
                e.preventDefault();
                this.logout();
            }
        });
    }
}

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});

// Make it globally available
window.AuthManager = AuthManager;













