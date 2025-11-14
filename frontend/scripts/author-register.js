
/**
 * Author Registration Script for VelvetQuill
 * Handles the author application process
 */

class AuthorRegister {
    constructor() {
        this.form = document.getElementById('author-register-form');
        this.applicationText = document.getElementById('applicationText');
        this.wordCountElement = document.getElementById('word-count');
        this.profileImageInput = document.getElementById('profile-image');
        this.imagePreviewContainer = document.getElementById('image-preview');
        this.previewImage = document.getElementById('preview-img');
        this.removeImageButton = document.getElementById('remove-image');
        this.privacyCheckbox = document.getElementById('privacy-policy');
        this.submitButton = document.querySelector('.submit-btn');
        
        this.init();
    }

    init() {
        this.initializeMaterialize();
        this.setupEventListeners();
        this.checkAuthentication();
    }

    initializeMaterialize() {
        // Initialize Materialize components
        M.Modal.init(document.querySelectorAll('.modal'));
        M.CharacterCounter.init(document.querySelectorAll('textarea'));
        M.updateTextFields();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Bio word count
        this.applicationText.addEventListener('input', () => this.updateWordCount());
        
        // Profile image handling
        this.profileImageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.removeImageButton.addEventListener('click', () => this.removeImage());
        
        // Privacy policy checkbox
        this.privacyCheckbox.addEventListener('change', () => this.validateForm());
        
        // Real-time form validation
        this.form.addEventListener('input', () => this.validateForm());
    }

    checkAuthentication() {
        if (!AuthManager.isAuthenticated()) {
            M.toast({
                html: 'Please sign in to apply as an author',
                classes: 'red'
            });
            setTimeout(() => {
                window.location.href = '/signin.html';
            }, 2000);
            return;
        }

        const currentUser = AuthManager.getCurrentUser();
        if (currentUser && currentUser.isAuthor) {
            M.toast({
                html: 'You are already an author!',
                classes: 'green'
            });
            setTimeout(() => {
                window.location.href = '/author-dashboard.html';
            }, 2000);
        }

        // Check if user already has a pending application
        this.checkExistingApplication();
    }

    async checkExistingApplication() {
        try {
            const userProfile = await apiService.getUserProfile(currentUser.username);
            if (userProfile.user.authorApplication && userProfile.user.authorApplication.status === 'pending') {
                M.toast({
                    html: 'You already have a pending author application',
                    classes: 'orange'
                });
                this.disableForm();
            }
        } catch (error) {
            // User profile might not be accessible, continue normally
            console.log('Could not check existing application:', error);
        }
    }

    disableForm() {
        this.form.querySelectorAll('input, textarea, button').forEach(element => {
            element.disabled = true;
        });
        this.submitButton.innerHTML = '<i class="material-icons right">schedule</i>Application Pending';
    }

    updateWordCount() {
        const text = this.applicationText.value.trim();
        const words = text ? text.split(/\s+/).filter(word => word.length > 0) : [];
        const wordCount = words.length;
        
        this.wordCountElement.textContent = wordCount;
        
        if (wordCount > 200) {
            this.wordCountElement.classList.add('warning');
            this.applicationText.classList.add('invalid');
        } else {
            this.wordCountElement.classList.remove('warning');
            this.applicationText.classList.remove('invalid');
        }
        
        this.validateForm();
    }


        validateForm() {
            const applicationText = this.applicationText.value.trim();
            const words = applicationText ? applicationText.split(/\s+/).filter(word => word.length > 0) : [];
            const wordCount = words.length;
            
            // Check word count limit
            const isWordCountValid = wordCount > 0 && wordCount <= 200;
            
            // Check privacy policy agreement
            const isPrivacyAgreed = this.privacyCheckbox.checked;
            
            // Form is valid if both conditions are met
            const isValid = isWordCountValid && isPrivacyAgreed;
            
            // Update submit button state
            this.submitButton.disabled = !isValid;
            
            // Visual feedback
            if (isValid) {
                this.submitButton.classList.remove('disabled');
            } else {
                this.submitButton.classList.add('disabled');
            }
            
            return isValid;
        }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            M.toast({
                html: 'Please select a valid image file (JPEG, PNG, GIF)',
                classes: 'red'
            });
            this.profileImageInput.value = '';
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            M.toast({
                html: 'Image size must be less than 2MB',
                classes: 'red'
            });
            this.profileImageInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // Store the base64 data
            this.profileImageBase64 = e.target.result;
            
            // Show preview
            this.previewImage.src = this.profileImageBase64;
            this.imagePreviewContainer.style.display = 'block';
            
            M.toast({
                html: 'Image selected successfully',
                classes: 'green'
            });
        };
        
        reader.onerror = () => {
            M.toast({
                html: 'Error reading image file',
                classes: 'red'
            });
            this.profileImageInput.value = '';
        };
        
        reader.readAsDataURL(file);
    }

    removeImage() {
        this.profileImageInput.value = '';
        this.profileImageBase64 = null;
        this.imagePreviewContainer.style.display = 'none';
        this.previewImage.src = '#';
        
        M.toast({
            html: 'Image removed',
            classes: 'orange'
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            M.toast({
                html: 'Please fill all required fields correctly',
                classes: 'red'
            });
            return;
        }

        // Show loading modal
        const loadingModal = M.Modal.getInstance(document.getElementById('loading-modal'));
        loadingModal.open();

        try {
            // First upload profile image if exists
            if (this.profileImageBase64) {
                await apiService.uploadAvatar(this.profileImageBase64);
            }

            // Then submit author application
            const formData = this.collectFormData();
            const response = await apiService.applyAuthor(formData);
            
            loadingModal.close();
            
            if (response.success) {
                this.showSuccessModal();
                
                // Update local user data
                const currentUser = AuthManager.getCurrentUser();
                if (currentUser) {
                    currentUser.authorApplication = { status: 'pending' };
                    localStorage.setItem('velvetquill_user', JSON.stringify(currentUser));
                }
            } else {
                throw new Error(response.message || 'Failed to submit application');
            }
            
        } catch (error) {
            loadingModal.close();
            console.error('Author application error:', error);
            
            M.toast({
                html: error.message || 'Failed to submit application. Please try again.',
                classes: 'red',
                displayLength: 4000
            });
        }
    }

    // Remove the standalone uploadProfileImage method - it's now handled by apiService

    collectFormData() {
        return {
            bio: this.applicationText.value.trim()
            // Note: Avatar is already uploaded separately via apiService
        };
    }


    showSuccessModal() {
        const successModal = M.Modal.getInstance(document.getElementById('success-modal'));
        successModal.open();
        
        // Reset form
        this.form.reset();
        this.imagePreviewContainer.style.display = 'none';
        this.updateWordCount();
        this.validateForm();
        
        // Re-initialize Materialize components
        M.updateTextFields();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!AuthManager.isAuthenticated()) {
        window.location.href = '/signin.html';
        return;
    }

    // Check if user is already an author
    const currentUser = AuthManager.getCurrentUser();
    if (currentUser && currentUser.isAuthor) {
        M.toast({
            html: 'You are already an author! Redirecting to dashboard...',
            classes: 'green'
        });
        setTimeout(() => {
            window.location.href = '/author-dashboard.html';
        }, 2000);
        return;
    }

            // Initialize profile picture upload
        const profileUpload = new ProfilePictureUpload({
            inputElement: document.getElementById('profile-image'),
            previewElement: document.getElementById('preview-img'),
            removeButton: document.getElementById('remove-image'),
            onUpload: (response) => {
                console.log('Profile picture ready for registration');
                // The image is now uploaded and linked to user account
            },
            onRemove: () => {
                console.log('Profile picture removed');
            },
            onError: (error) => {
                console.error('Upload error:', error);
            }
        });

    // Initialize author registration
    window.authorRegister = new AuthorRegister();
});
