

/**
 * Profile Picture Upload Component
 * Reusable component for uploading profile pictures across the app
 */
class ProfilePictureUpload {
    constructor(options = {}) {
        // Required elements
        this.inputElement = options.inputElement;
        this.previewElement = options.previewElement;
        this.removeButton = options.removeButton;
        
        // Optional callbacks
        this.onUpload = options.onUpload || (() => {});
        this.onRemove = options.onRemove || (() => {});
        this.onError = options.onError || (() => {});
        
        // State
        this.currentImage = null;
        this.isUploading = false;
        
        this.init();
    }

    init() {
        if (!this.inputElement) {
            console.error('ProfilePictureUpload: inputElement is required');
            return;
        }

        // Set up event listeners
        this.inputElement.addEventListener('change', (e) => this.handleImageSelect(e));
        
        if (this.removeButton) {
            this.removeButton.addEventListener('click', () => this.removeImage());
        }

        // Load existing avatar if user has one
        this.loadExistingAvatar();
    }

    loadExistingAvatar() {
        const currentUser = AuthManager.getCurrentUser();
        if (currentUser && currentUser.profile && currentUser.profile.avatar) {
            this.currentImage = currentUser.profile.avatar;
            this.showPreview(this.currentImage);
        }
    }

    handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            this.showError('Please select a valid image file (JPEG, PNG, GIF)');
            this.resetInput();
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showError('Image size must be less than 2MB');
            this.resetInput();
            return;
        }

        this.showLoading(true);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            this.showPreview(this.currentImage);
            this.uploadToServer(this.currentImage);
        };
        
        reader.onerror = () => {
            this.showError('Error reading image file');
            this.resetInput();
            this.showLoading(false);
        };
        
        reader.readAsDataURL(file);
    }

    showPreview(imageData) {
        if (this.previewElement) {
            this.previewElement.src = imageData;
            this.previewElement.style.display = 'block';
        }
        
        // Show remove button if available
        if (this.removeButton) {
            this.removeButton.style.display = 'block';
        }
    }

    hidePreview() {
        if (this.previewElement) {
            this.previewElement.style.display = 'none';
            this.previewElement.src = '';
        }
        
        // Hide remove button if available
        if (this.removeButton) {
            this.removeButton.style.display = 'none';
        }
    }

    async uploadToServer(imageBase64) {
        if (this.isUploading) return;
        
        this.isUploading = true;
        
        try {
            const response = await apiService.uploadAvatar(imageBase64);
            
            // Update local user data
            const currentUser = AuthManager.getCurrentUser();
            if (currentUser && response.user) {
                currentUser.profile = response.user.profile;
                localStorage.setItem('velvetquill_user', JSON.stringify(currentUser));
            }
            
            this.showSuccess('Profile picture updated successfully');
            this.onUpload(response);
            
        } catch (error) {
            console.error('Profile picture upload error:', error);
            this.showError(error.message || 'Failed to upload profile picture');
            this.onError(error);
            this.removeImage(); // Remove the failed upload
        } finally {
            this.isUploading = false;
            this.showLoading(false);
        }
    }

    async removeImage() {
        if (this.isUploading) return;
        
        try {
            await apiService.removeAvatar();
            
            this.currentImage = null;
            this.resetInput();
            this.hidePreview();
            
            // Update local user data
            const currentUser = AuthManager.getCurrentUser();
            if (currentUser) {
                currentUser.profile.avatar = null;
                currentUser.profile.avatarType = null;
                localStorage.setItem('velvetquill_user', JSON.stringify(currentUser));
            }
            
            this.showSuccess('Profile picture removed');
            this.onRemove();
            
        } catch (error) {
            console.error('Remove avatar error:', error);
            this.showError('Failed to remove profile picture');
            this.onError(error);
        }
    }

    resetInput() {
        if (this.inputElement) {
            this.inputElement.value = '';
        }
    }

    showLoading(show) {
        // You can customize this based on your UI framework
        if (this.previewElement) {
            if (show) {
                this.previewElement.style.opacity = '0.5';
            } else {
                this.previewElement.style.opacity = '1';
            }
        }
    }

    showError(message) {
        M.toast({
            html: message,
            classes: 'red',
            displayLength: 4000
        });
    }

    showSuccess(message) {
        M.toast({
            html: message,
            classes: 'green',
            displayLength: 3000
        });
    }

    // Public method to manually set an image
    setImage(imageBase64) {
        this.currentImage = imageBase64;
        this.showPreview(imageBase64);
    }

    // Public method to get current image
    getCurrentImage() {
        return this.currentImage;
    }

    // Public method to check if has image
    hasImage() {
        return !!this.currentImage;
    }
}






