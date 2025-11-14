
// auth-validation.js - Shared validation utilities
class AuthValidation {
    constructor() {
        this.minPasswordLength = 8;
        this.maxUsernameLength = 50;
        this.minAge = 18;
    }

    // Email validation
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Username validation
    validateUsername(username) {
        if (username.length < 3) {
            return { isValid: false, message: 'Username must be at least 3 characters' };
        }
        
        if (username.length > this.maxUsernameLength) {
            return { isValid: false, message: `Username must be less than ${this.maxUsernameLength} characters` };
        }
        
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            return { isValid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
        }
        
        return { isValid: true };
    }

    // Password strength validation
    validatePassword(password) {
        if (password.length < this.minPasswordLength) {
            return { 
                isValid: false, 
                strength: 'weak',
                message: `Password must be at least ${this.minPasswordLength} characters` 
            };
        }

        // Check for common patterns
        const commonPasswords = ['password', '12345678', 'qwerty', 'letmein'];
        if (commonPasswords.includes(password.toLowerCase())) {
            return { 
                isValid: false, 
                strength: 'weak',
                message: 'Password is too common' 
            };
        }

        // Calculate strength
        let strength = 0;
        
        // Length check
        if (password.length >= 12) strength += 2;
        else if (password.length >= 8) strength += 1;

        // Character variety checks
        if (/[a-z]/.test(password)) strength += 1; // lowercase
        if (/[A-Z]/.test(password)) strength += 1; // uppercase
        if (/[0-9]/.test(password)) strength += 1; // numbers
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1; // special chars

        let strengthLevel, message;
        if (strength >= 5) {
            strengthLevel = 'strong';
            message = 'Strong password';
        } else if (strength >= 3) {
            strengthLevel = 'medium';
            message = 'Medium strength password';
        } else {
            strengthLevel = 'weak';
            message = 'Weak password - consider adding more character types';
        }

        return {
            isValid: strength >= 3, // Require at least medium strength
            strength: strengthLevel,
            message: message
        };
    }

    // Age validation
    validateAge(dateString) {
        const birthDate = new Date(dateString);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < this.minAge) {
            return { 
                isValid: false, 
                message: `You must be at least ${this.minAge} years old to join` 
            };
        }
        
        if (age > 120) {
            return { 
                isValid: false, 
                message: 'Please enter a valid date of birth' 
            };
        }
        
        return { isValid: true, age: age };
    }

    // Confirm password match
    validatePasswordMatch(password, confirmPassword) {
        if (password !== confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }
        return { isValid: true };
    }

    // XSS prevention - sanitize input
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Hash password using CryptoJS
    hashPassword(password) {
        try {
            // In production, you should use a proper backend for hashing
            // This is just for demonstration
            const salt = CryptoJS.lib.WordArray.random(128/8);
            const key = CryptoJS.PBKDF2(password, salt, {
                keySize: 256/32,
                iterations: 1000
            });
            return {
                hash: key.toString(),
                salt: salt.toString()
            };
        } catch (error) {
            console.error('Password hashing error:', error);
            throw new Error('Password encryption failed');
        }
    }

    // Generate secure token
    generateSecureToken(length = 32) {
        return CryptoJS.lib.WordArray.random(length).toString();
    }

    // Validate token (basic structure check)
    validateToken(token) {
        if (!token || typeof token !== 'string') return false;
        if (token.length < 16) return false; // Minimum token length
        return true;
    }

    // Rate limiting helper
    setupRateLimit(key, maxAttempts, windowMs) {
        const now = Date.now();
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Remove expired attempts
        const validAttempts = attempts.filter(time => now - time < windowMs);
        
        if (validAttempts.length >= maxAttempts) {
            return { allowed: false, remaining: 0 };
        }
        
        return { 
            allowed: true, 
            remaining: maxAttempts - validAttempts.length 
        };
    }

    // Record attempt for rate limiting
    recordAttempt(key) {
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        attempts.push(Date.now());
        localStorage.setItem(key, JSON.stringify(attempts));
    }

    // Clear rate limiting attempts
    clearAttempts(key) {
        localStorage.removeItem(key);
    }
}

// Create global instance
window.authValidation = new AuthValidation();
