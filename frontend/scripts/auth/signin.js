

// signin.js - Sign In page functionality (Refactored for Updated Backend)
class SignInPage {
    constructor() {
        this.validation = window.authValidation;
        this.isSubmitting = false;
        this.failedAttempts = 0;
        this.maxAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        // Development mode flag - can be set via URL parameter ?dev=true
        this.isDevMode = this.checkDevMode();
        this.useMockData = this.shouldUseMockData();
        
        this.initializePage();
        this.setupEventListeners();
    }

    checkDevMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('dev') === 'true' || 
               window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }

    shouldUseMockData() {
        // Use mock data if in dev mode or if backend health check fails
        return this.isDevMode || localStorage.getItem('use_mock_data') === 'true';
    }

    initializePage() {
        // Initialize Materialize components
        M.updateTextFields();
        M.Modal.init(document.querySelectorAll('.modal'));
        
        // Check for existing session
        this.checkExistingSession();
        
        // Check for failed attempts
        this.checkSecurityStatus();

        // Show dev mode indicator if applicable
        if (this.isDevMode) {
            this.showDevModeIndicator();
        }

        // Test backend connection on load
        this.testBackendConnection();
    }

    showDevModeIndicator() {
        const devBadge = document.createElement('div');
        devBadge.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: #ff9800; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; z-index: 1000;">
                🔧 Development Mode ${this.useMockData ? '(Mock Data)' : ''}
            </div>
        `;
        document.body.appendChild(devBadge);
    }

    async testBackendConnection() {
        try {
            if (window.apiService && typeof window.apiService.healthCheck === 'function') {
                const isBackendAlive = await window.apiService.healthCheck();
                
                if (!isBackendAlive) {
                    console.warn('Backend connection failed, falling back to mock data');
                    this.useMockData = true;
                    localStorage.setItem('use_mock_data', 'true');
                    this.showBackendWarning();
                } else {
                    this.useMockData = false;
                    localStorage.removeItem('use_mock_data');
                }
            }
        } catch (error) {
            console.warn('Backend health check failed:', error);
            this.useMockData = true;
            localStorage.setItem('use_mock_data', 'true');
            this.showBackendWarning();
        }
    }

    showBackendWarning() {
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="position: fixed; top: 50px; right: 10px; background: #f44336; color: white; padding: 10px; border-radius: 4px; font-size: 12px; z-index: 1000; max-width: 300px;">
                ⚠️ Backend unavailable. Using mock data for demonstration.
            </div>
        `;
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 5000);
    }

    checkExistingSession() {
        const session = localStorage.getItem('velvetquill_user_session');
        if (session) {
            try {
                const userSession = JSON.parse(session);
                if (userSession.user_id && userSession.last_login) {
                    this.prefillLoginFields(userSession);
                }
            } catch (error) {
                console.warn('Invalid session data:', error);
                localStorage.removeItem('velvetquill_user_session');
            }
        }
    }

    prefillLoginFields(session) {
        const rememberMe = localStorage.getItem('velvetquill_remember_me');
        if (rememberMe === 'true') {
            const savedIdentifier = localStorage.getItem('velvetquill_last_identifier');
            if (savedIdentifier) {
                document.getElementById('login-identifier').value = savedIdentifier;
                M.updateTextFields();
            }
        }
    }

    checkSecurityStatus() {
        const rateLimit = this.validation.setupRateLimit('login_attempts', this.maxAttempts, this.lockoutTime);
        if (!rateLimit.allowed) {
            this.showSecurityWarning();
        }
        
        this.failedAttempts = rateLimit.maxAttempts - rateLimit.remaining;
    }

    setupEventListeners() {
        // Real-time validation
        document.getElementById('login-identifier').addEventListener('blur', (e) => {
            this.validateIdentifier(e.target.value);
        });

        document.getElementById('login-password').addEventListener('blur', (e) => {
            this.validatePassword(e.target.value);
        });

        // Form submission
        document.getElementById('signin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignIn();
        });

        // Remember me functionality
        document.getElementById('remember-me').addEventListener('change', (e) => {
            this.handleRememberMe(e.target.checked);
        });

        // Dev mode toggle (hidden by default, can be enabled via console)
        this.setupDevModeToggle();
    }

    setupDevModeToggle() {
        // Add a hidden dev panel that can be shown via console
        const devPanel = document.createElement('div');
        devPanel.id = 'dev-panel';
        devPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: #333;
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            display: none;
        `;
        devPanel.innerHTML = `
            <div>🔧 Dev Controls</div>
            <button onclick="window.signInPage.toggleMockData()" style="margin: 5px; padding: 5px;">
                ${this.useMockData ? 'Use Real API' : 'Use Mock Data'}
            </button>
            <button onclick="window.signInPage.showMockUsers()" style="margin: 5px; padding: 5px;">
                Show Mock Users
            </button>
        `;
        document.body.appendChild(devPanel);

        // Expose dev controls to console
        window.toggleDevPanel = () => {
            devPanel.style.display = devPanel.style.display === 'none' ? 'block' : 'none';
        };
    }

    toggleMockData() {
        this.useMockData = !this.useMockData;
        localStorage.setItem('use_mock_data', this.useMockData.toString());
        location.reload();
    }

    showMockUsers() {
        const mockUsers = this.getAllMockUsers();
        const userList = mockUsers.map(user => 
            `${user.username} (${user.email}) - Password: "password123"`
        ).join('\n');
        
        alert(`Available Mock Users:\n\n${userList}`);
    }

    validateIdentifier(identifier) {
        const isValid = identifier.length >= 3;
        const result = {
            isValid: isValid,
            message: isValid ? '' : 'Please enter your email or username'
        };
        this.showValidationResult('login-identifier', result);
        return isValid;
    }

    validatePassword(password) {
        const isValid = password.length >= 1;
        const result = {
            isValid: isValid,
            message: isValid ? '' : 'Please enter your password'
        };
        this.showValidationResult('login-password', result);
        return isValid;
    }

    showValidationResult(field, result) {
        const errorElement = document.getElementById(`${field}-error`);
        const inputElement = document.getElementById(field);
        
        if (result.isValid) {
            errorElement.classList.remove('show');
            inputElement.style.borderColor = '';
        } else {
            errorElement.textContent = result.message;
            errorElement.classList.add('show');
            inputElement.style.borderColor = 'var(--error-color)';
        }
    }

    async handleSignIn() {
        if (this.isSubmitting) return;
        
        const rateLimit = this.validation.setupRateLimit('login_attempts', this.maxAttempts, this.lockoutTime);
        if (!rateLimit.allowed) {
            this.showSecurityWarning();
            return;
        }

        if (!this.validateAllFields()) {
            this.recordFailedAttempt();
            return;
        }

        this.isSubmitting = true;
        this.setLoadingState(true);

        try {
            const formData = this.getFormData();
            let response;

            if (this.useMockData) {
                //console.log('Using mock data for signin');
                response = await this.mockSignIn(formData);
            } else {
                //console.log('Using real API for signin');
                response = await this.realSignIn(formData);
            }
            
            if (response.success) {
                this.handleSignInSuccess(response, formData);
                this.validation.clearAttempts('login_attempts');
                this.failedAttempts = 0;
            } else {
                throw new Error(response.message || 'Sign in failed');
            }
            
        } catch (error) {
            console.error('Sign in error:', error);
            this.handleSignInError(error.message);
            this.recordFailedAttempt();
        } finally {
            this.isSubmitting = false;
            this.setLoadingState(false);
        }
    }

    validateAllFields() {
        const identifier = document.getElementById('login-identifier').value;
        const password = document.getElementById('login-password').value;

        let isValid = true;

        if (!this.validateIdentifier(identifier)) isValid = false;
        if (!this.validatePassword(password)) isValid = false;

        return isValid;
    }

    getFormData() {
        const identifier = document.getElementById('login-identifier').value;
        const isEmail = this.validation.validateEmail(identifier);
        
        return {
            identifier: identifier,
            is_email: isEmail,
            password: document.getElementById('login-password').value,
            remember_me: document.getElementById('remember-me').checked,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            security_token: this.validation.generateSecureToken()
        };
    }

    async realSignIn(formData) {
        try {
            const payload = {
                identifier: formData.identifier,
                password: formData.password
            };
            //console.log(`SIGNIN PAYLOAD:`, payload);
            
            const response = await window.apiService.signIn(payload);
            return response;
        } catch (error) {
            console.error('Real API Sign in error:', error);
            
            // If real API fails and we're in dev mode, fall back to mock data
            if (this.isDevMode) {
                //console.log('Falling back to mock data due to API failure');
                this.useMockData = true;
                localStorage.setItem('use_mock_data', 'true');
                return await this.mockSignIn(formData);
            }
            
            throw new Error(error.message || 'Sign in failed. Please try again.');
        }
    }

    async mockSignIn(formData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const user = this.findMockUser(formData.identifier, formData.password);
                    
                    if (user) {
                        // Simulate successful API response
                        const mockResponse = {
                            success: true,
                            message: 'Login successful',
                            token: this.generateMockToken(user),
                            user: this.prepareUserData(user)
                        };
                        resolve(mockResponse);
                    } else {
                        reject(new Error('Invalid credentials. Please try again.'));
                    }
                } catch (error) {
                    reject(error);
                }
            }, 500); // Simulate network delay
        });
    }

    getAllMockUsers() {
        // Return mock users array (backupUsers should be defined elsewhere)
        return window.backupUsers || [];
    }

    findMockUser(identifier, password) {
        const allUsers = this.getAllMockUsers();
        
        // For mock purposes, accept any password that's not empty
        if (!password || password.trim() === '') {
            return null;
        }

        // Find user by email or username
        const user = allUsers.find(u => 
            u.email === identifier || u.username === identifier
        );

        if (user) {
            //console.log(`Mock login: Found user ${user.username} with password length: ${password.length}`);
            // For demo purposes, accept any non-empty password
            return user;
        }

        return null;
    }

    generateMockToken(user) {
        // Generate a mock JWT-like token
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            userId: user._id,
            username: user.username,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));
        const signature = btoa('mock-signature-for-development');
        
        return `${header}.${payload}.${signature}`;
    }

    prepareUserData(user) {
        // Transform mock user data to match expected API response format
        return {
            id: user._id || user.username,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            isAuthor: user.isAuthor || false,
            isAdmin: user.isAdmin || false,
            role: user.role || 'user',
            profile: user.profile || {},
            stats: user.stats || {},
            preferences: user.preferences || {},
            badges: user.badges || [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    handleSignInSuccess(response, formData) {
        const userSession = {
            user_id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            displayName: response.user.displayName,
            is_author: response.user.isAuthor,
            is_admin: response.user.isAdmin,
            role: response.user.role,
            last_login: new Date().toISOString(),
            token: response.token,
            using_mock_data: this.useMockData
        };
        
        //console.log("User authenticated and stored!", {
            username: response.user.username,
            role: response.user.role,
            usingMockData: this.useMockData
        });
        
        // Store session data
        localStorage.setItem('velvetquill_user_session', JSON.stringify(userSession));
        localStorage.setItem('velvetquill_user', JSON.stringify(response.user));
        localStorage.setItem('velvetquill_token', response.token);
        
        // Handle remember me
        if (formData.remember_me) {
            localStorage.setItem('velvetquill_remember_me', 'true');
            localStorage.setItem('velvetquill_last_identifier', formData.identifier);
        } else {
            localStorage.removeItem('velvetquill_remember_me');
            localStorage.removeItem('velvetquill_last_identifier');
        }
        
        // Show success message with mode info
        const modeInfo = this.useMockData ? ' (Mock Data Mode)' : '';
        M.toast({ 
            html: `Welcome back, ${response.user.displayName || response.user.username}!${modeInfo}`,
            classes: 'success-toast'
        });
        
        // Redirect after short delay
        setTimeout(() => {
            this.redirectAfterLogin(response.user);
        }, 1000);
    }

    handleSignInError(errorMessage) {
        M.toast({ 
            html: `Sign in failed: ${errorMessage}`,
            classes: 'error-toast',
            displayLength: 4000
        });
    }

    recordFailedAttempt() {
        this.validation.recordAttempt('login_attempts');
        this.failedAttempts++;
        
        if (this.failedAttempts >= 3) {
            this.showSecurityWarning();
        }
    }

    showSecurityWarning() {
        const modal = M.Modal.getInstance(document.getElementById('security-warning'));
        modal.open();
    }

    setLoadingState(loading) {
        const submitBtn = document.getElementById('signin-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            submitBtn.disabled = true;
            document.getElementById('signin-form').classList.add('loading');
        } else {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
            document.getElementById('signin-form').classList.remove('loading');
        }
    }

    handleRememberMe(remember) {
        //console.log('Remember me:', remember);
    }

    redirectAfterLogin(user) {
        if (user.role === 'admin' || user.role === 'overallAdmin') {
            //console.log('ADMIN DASHBOARD REDIRECT:');
            window.location.href = './admin-dashboard.html';
        } else if (user.role === 'author' || user.isAuthor) {
            //console.log('AUTHOR ROOM REDIRECT:');
            window.location.href = './author-room.html';
        } else {
            //console.log('HOMEPAGE REDIRECT');
            window.location.href = 'index.html';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.signInPage = new SignInPage();
    
    // Expose helper function to test mock users
    window.testMockLogin = (identifier = 'alexandra_admin', password = 'anypassword') => {
        document.getElementById('login-identifier').value = identifier;
        document.getElementById('login-password').value = password;
        M.updateTextFields();
        //console.log(`Prefilled credentials for testing: ${identifier} / ${password}`);
    };
});
