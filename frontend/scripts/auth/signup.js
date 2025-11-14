
// signup.js - Sign Up page functionality (Refactored for Updated Backend)
class SignUpPage {
    constructor() {
        this.validation = window.authValidation;
        this.isSubmitting = false;
        this.failedAttempts = 0;
        this.maxAttempts = 5;
        
        this.clearVQData();
        
        this.initializePage();
        this.setupEventListeners();
    }

    initializePage() {
        // Initialize Materialize components
        M.updateTextFields();
        M.Modal.init(document.querySelectorAll('.modal'));
        
        // Set max date for age validation (18 years ago)
        this.setMaxBirthDate();
        
        // Check for existing failed attempts
        this.checkRateLimit();
    }

    setMaxBirthDate() {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        document.getElementById('date-of-birth').max = maxDate.toISOString().split('T')[0];
    }

    checkRateLimit() {
        const rateLimit = this.validation.setupRateLimit('signup_attempts', this.maxAttempts, 15 * 60 * 1000);
        if (!rateLimit.allowed) {
            this.showRateLimitWarning();
        }
    }

    setupEventListeners() {
        // Real-time validation
        document.getElementById('username').addEventListener('blur', (e) => {
            this.validateUsername(e.target.value);
        });

        document.getElementById('email').addEventListener('blur', (e) => {
            this.validateEmail(e.target.value);
        });

        document.getElementById('password').addEventListener('input', (e) => {
            this.validatePasswordStrength(e.target.value);
        });

        document.getElementById('confirm-password').addEventListener('blur', (e) => {
            this.validatePasswordMatch();
        });

        document.getElementById('date-of-birth').addEventListener('change', (e) => {
            this.validateAge(e.target.value);
        });

        // Form submission
        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });
    }

    validateUsername(username) {
        const result = this.validation.validateUsername(username);
        this.showValidationResult('username', result);
        return result.isValid;
    }

    validateEmail(email) {
        const isValid = this.validation.validateEmail(email);
        const result = {
            isValid: isValid,
            message: isValid ? '' : 'Please enter a valid email address'
        };
        this.showValidationResult('email', result);
        return isValid;
    }

    validatePasswordStrength(password) {
        const result = this.validation.validatePassword(password);
        this.showPasswordStrength(result);
        return result.isValid;
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!password) return true; // Don't validate if password is empty
        
        const result = this.validation.validatePasswordMatch(password, confirmPassword);
        this.showValidationResult('confirm-password', result);
        return result.isValid;
    }

    validateAge(dateString) {
        const result = this.validation.validateAge(dateString);
        this.showValidationResult('date-of-birth', result);
        return result.isValid;
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

    showPasswordStrength(result) {
        const strengthBar = document.querySelector('.strength-bar');
        if (!strengthBar) return;
        
        strengthBar.className = 'strength-bar';
        
        if (result.strength === 'weak') {
            strengthBar.classList.add('strength-weak');
        } else if (result.strength === 'medium') {
            strengthBar.classList.add('strength-medium');
        } else if (result.strength === 'strong') {
            strengthBar.classList.add('strength-strong');
        }
        
        // Show message if available
        const errorElement = document.getElementById('password-error');
        if (result.message) {
            errorElement.textContent = result.message;
            errorElement.classList.add('show');
        } else {
            errorElement.classList.remove('show');
        }
    }

    async handleSignUp() {
        if (this.isSubmitting) return;
        
        // Check rate limiting
        const rateLimit = this.validation.setupRateLimit('signup_attempts', this.maxAttempts, 15 * 60 * 1000);
        if (!rateLimit.allowed) {
            this.showRateLimitWarning();
            return;
        }

        // Validate all fields
        if (!this.validateAllFields()) {
            this.validation.recordAttempt('signup_attempts');
            this.failedAttempts++;
            return;
        }

        this.isSubmitting = true;
        this.setLoadingState(true);

        try {
            const formData = this.getFormData();
            const response = await this.submitSignUp(formData);
            
            if (response.success) {
                this.handleSignUpSuccess(response, formData.email);
                this.validation.clearAttempts('signup_attempts');
            } else {
                throw new Error(response.message || 'Sign up failed');
            }
            
        } catch (error) {
            console.error('Sign up error:', error);
            this.handleSignUpError(error.message);
            this.validation.recordAttempt('signup_attempts');
            this.failedAttempts++;
        } finally {
            this.isSubmitting = false;
            this.setLoadingState(false);
        }
    }

    validateAllFields() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const dateOfBirth = document.getElementById('date-of-birth').value;
        const agreeTerms = document.getElementById('agree-terms').checked;
        const ageVerify = document.getElementById('age-verify').checked;

        let isValid = true;

        // Validate each field
        if (!this.validateUsername(username)) isValid = false;
        if (!this.validateEmail(email)) isValid = false;
        if (!this.validatePasswordStrength(password)) isValid = false;
        if (!this.validatePasswordMatch()) isValid = false;
        if (!this.validateAge(dateOfBirth)) isValid = false;

        // Check agreements
        if (!agreeTerms) {
            document.getElementById('terms-error').textContent = 'You must agree to the terms and conditions';
            document.getElementById('terms-error').classList.add('show');
            isValid = false;
        } else {
            document.getElementById('terms-error').classList.remove('show');
        }

        if (!ageVerify) {
            document.getElementById('age-error').textContent = 'You must confirm you are 18+';
            document.getElementById('age-error').classList.add('show');
            isValid = false;
        } else {
            document.getElementById('age-error').classList.remove('show');
        }

        return isValid;
    }

    getFormData() {
        return {
            username: this.validation.sanitizeInput(document.getElementById('username').value),
            email: document.getElementById('email').value.toLowerCase(),
            password: document.getElementById('password').value,
            displayName: this.validation.sanitizeInput(document.getElementById('username').value),
            dateOfBirth: document.getElementById('date-of-birth').value,
            agree_terms: document.getElementById('agree-terms').checked,
            age_verified: document.getElementById('age-verify').checked,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }

    async submitSignUp(formData) {
        try {
            console.log(`Sending Form Data:`, formData);
            
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                displayName: formData.displayName,
                dateOfBirth: this.formatDate(formData.dateOfBirth)
            };
            
            console.log(`User Data Payload:`, payload);
            
            // Use API service to make the backend call
            const response = await window.apiService.signUp(payload);

            return response;
        } catch (error) {
            console.error('API Sign up error:', error);
            throw new Error(error.message || 'Sign up failed. Please try again.');
        }
    }

    handleSignUpSuccess(response, email) {
        // Store user session from backend response
        const userSession = {
            user_id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            displayName: response.user.displayName,
            is_author: response.user.isAuthor,
            role: response.user.role,
            signed_up: true,
            timestamp: new Date().toISOString(),
            token: response.token
        };
        
        localStorage.setItem('velvetquill_user_session', JSON.stringify(userSession));
        localStorage.setItem('velvetquill_user', JSON.stringify(response.user));
        localStorage.setItem('velvetquill_token', response.token);
        console.log("User registered and stored!");
        
        // Show success modal
        document.getElementById('user-email').textContent = email;
        const modal = M.Modal.getInstance(document.getElementById('success-modal'));
        modal.open();
        
        // Clear form
        document.getElementById('signup-form').reset();
        M.updateTextFields();
        
        this.redirectAfterSignup(response.user);
    }

    handleSignUpError(errorMessage) {
        // Handle specific backend error messages
        let userMessage = errorMessage;
        
        if (errorMessage.includes('User with this email or username already exists')) {
            userMessage = 'An account with this email or username already exists.';
        } else if (errorMessage.includes('Validation failed')) {
            userMessage = 'Please check your input and try again.';
        } else if (errorMessage.includes('Username must be at least 3 characters')) {
            userMessage = 'Username must be at least 3 characters long.';
        } else if (errorMessage.includes('Password must be at least 8 characters')) {
            userMessage = 'Password must be at least 8 characters long.';
        }
        
        M.toast({ 
            html: `Sign up failed: ${userMessage}`,
            classes: 'error-toast',
            displayLength: 5000
        });
    }
    
    redirectAfterSignup(user) {
        // Show success message
        M.toast({ 
            html: `Welcome to VelvetQuill, ${user.displayName || user.username}!`,
            classes: 'success-toast'
        });
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = './index.html';
        }, 2000);
    }
    
    clearVQData() {
        localStorage.removeItem('velvetquill_user_session');
        localStorage.removeItem('velvetquill_remember_me');
        localStorage.removeItem('velvetquill_last_identifier');
        localStorage.removeItem('velvetquill_user');
        localStorage.removeItem('velvetquill_token');
        localStorage.removeItem("signup_attempts");
        
        console.log("VQ Data Cleared!");
    }
    
    setLoadingState(loading) {
        const submitBtn = document.getElementById('signup-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            submitBtn.disabled = true;
            document.getElementById('signup-form').classList.add('loading');
        } else {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
            document.getElementById('signup-form').classList.remove('loading');
        }
    }

    showRateLimitWarning() {
        M.toast({ 
            html: 'Too many sign up attempts. Please try again in 15 minutes.',
            classes: 'warning-toast',
            displayLength: 5000
        });
    }

    // Format date for display
    formatDate(dateString) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            throw new Error("INVALID DATE FORMAT. EXPECTED YYYY-MM-DD");
        }

        console.log(`DATE STRING: ${dateString.split('-')}`);
        const [y, m, d] = dateString.split('-');

        console.log(`DATE INPUT: ${y}-${m}-${d}`);

        const monthNum = parseInt(m);
        const dayNum = parseInt(d);

        if (monthNum < 1 || monthNum > 12) {
            throw new Error('INVALID MONTH !');
        }
        if (dayNum < 1 || dayNum > 31) {
            throw new Error('INVALID DAY !');
        }

        return `${y}-${m}-${d}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.signUpPage = new SignUpPage();
});

