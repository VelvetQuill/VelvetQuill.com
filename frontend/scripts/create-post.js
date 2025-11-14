

// create-post.js - Refactored for Backend Compatibility
class CreatePostPage {
    constructor() {
        //this.currentDraftId = null;
        this.isSubmitting = false;
        this.tags = [];
        this.categories = [];
        this.pages = [];
        this.currentPageIndex = 0;
        
        this.initializePage();
    }

    // ==================== INITIALIZATION ====================
    async initializePage() {
        if (!AuthManager.requireAuthor()) {
            return;
        }

        this.initializeMaterializeComponents();
        await this.loadCategories();
        //await this.loadDrafts();
        this.setupEventListeners();
        this.initializeFirstPage();
    }

    initializeMaterializeComponents() {
        M.updateTextFields();
        M.FormSelect.init(document.querySelectorAll('select'));
        M.Modal.init(document.querySelectorAll('.modal'));
    }

    initializeFirstPage() {
        this.addNewPage();
        this.updatePageNavigation();
        this.updateGlobalStats();
    }

    // ==================== PAGE MANAGEMENT ====================
    addNewPage() {
        const newPage = {
            pageNumber: this.pages.length + 1,
            content: '',
            wordCount: 0,
            readingTime: 0,
            saved: false
        };
        
        this.pages.push(newPage);
        this.currentPageIndex = this.pages.length - 1;
        
        this.updateCurrentPageEditor();
        this.updatePageNavigation();
    }

    updateCurrentPageEditor() {
        const currentPage = this.pages[this.currentPageIndex];
        const pageContent = document.getElementById('page-content');
        const pageTitle = document.getElementById('current-page-title');
        const deleteBtn = document.getElementById('delete-page-btn');
        
        if (pageContent) {
            pageContent.value = currentPage.content;
            this.updatePageStats();
        }
        
        if (pageTitle) {
            pageTitle.textContent = `Page ${currentPage.pageNumber}`;
        }
        
        if (deleteBtn) {
            deleteBtn.style.display = this.pages.length > 1 ? 'inline-block' : 'none';
        }
        
        M.updateTextFields();
    }

    updatePageNavigation() {
        const navigation = document.getElementById('page-navigation');
        if (!navigation) return;
        
        navigation.innerHTML = this.pages.map((page, index) => `
            <div class="page-tab ${index === this.currentPageIndex ? 'active' : ''} ${page.saved ? 'saved' : ''}" 
                 data-page-index="${index}">
                <span class="page-number">${page.pageNumber}</span>
                <span class="word-count">${page.wordCount}w</span>
            </div>
        `).join('');
        
        navigation.querySelectorAll('.page-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const pageIndex = parseInt(e.currentTarget.dataset.pageIndex);
                this.switchToPage(pageIndex);
            });
        });
    }

    switchToPage(pageIndex) {
        this.saveCurrentPageContent();
        this.currentPageIndex = pageIndex;
        this.updateCurrentPageEditor();
        this.updatePageNavigation();
    }

    saveCurrentPageContent() {
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            //const excerpt = document.getElementById('story-excerpt')?.value || '';
            const content = pageContent.value;
            this.pages[this.currentPageIndex].content = content;
            this.pages[this.currentPageIndex].wordCount = this.countWords(content);
            this.pages[this.currentPageIndex].readingTime = Math.ceil(this.countWords(content) / 200);
        }
    }

    deleteCurrentPage() {
        if (this.pages.length <= 1) {
            M.toast({html: 'Cannot delete the only page'});
            return;
        }
        
        if (confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
            this.pages.splice(this.currentPageIndex, 1);
            
            // Re-number pages
            this.pages.forEach((page, index) => {
                page.pageNumber = index + 1;
            });
            
            this.currentPageIndex = Math.max(0, this.currentPageIndex - 1);
            
            this.updateCurrentPageEditor();
            this.updatePageNavigation();
            this.updateGlobalStats();
            
            M.toast({html: 'Page deleted successfully'});
        }
    }

    // ==================== SECONDARY EDITOR MANAGEMENT ====================
    showSecondaryEditor() {
        const currentPage = this.pages[this.currentPageIndex];
        const secondaryTextarea = document.getElementById('secondary-textarea');
        const pageNumber = document.getElementById('secondary-page-number');
        
        if (secondaryTextarea) {
            secondaryTextarea.value = currentPage.content;
            secondaryTextarea.focus();
        }
        
        if (pageNumber) {
            pageNumber.textContent = currentPage.pageNumber;
        }
        
        document.getElementById('secondary-editor-page').style.display = 'block';
        document.querySelector('.create-post-container').style.display = 'none';
        document.querySelector('nav').style.display = 'none';
        
        this.updateSecondaryEditorStats();
    }

    pushContentToMainEditor() {
        const secondaryTextarea = document.getElementById('secondary-textarea');
        const pageContent = document.getElementById('page-content');
        
        if (secondaryTextarea && pageContent) {
            const content = secondaryTextarea.value;
            pageContent.value = content;
            
            // Update the current page data
            this.pages[this.currentPageIndex].content = content;
            this.pages[this.currentPageIndex].wordCount = this.countWords(content);
            this.pages[this.currentPageIndex].readingTime = Math.ceil(this.countWords(content) / 200);
            
            this.updatePageStats();
            this.validatePageContent();
        }
        
        this.closeSecondaryEditor();
    }

    closeSecondaryEditor() {
        document.getElementById('secondary-editor-page').style.display = 'none';
        document.querySelector('.create-post-container').style.display = 'block';
        document.querySelector('nav').style.display = 'block';
    }

    updateSecondaryEditorStats() {
        const content = document.getElementById('secondary-textarea')?.value || '';
        const words = this.countWords(content);
        const characters = content.length;
        
        const wordCountElem = document.getElementById('secondary-word-count');
        const charCountElem = document.getElementById('secondary-char-count');
        
        if (wordCountElem) wordCountElem.textContent = words;
        if (charCountElem) charCountElem.textContent = characters;
        
        if (wordCountElem) {
            wordCountElem.className = '';
            if (words < 1000) {
                wordCountElem.classList.add('word-count-invalid');
            } else if (words > 2000) {
                wordCountElem.classList.add('word-count-warning');
            } else {
                wordCountElem.classList.add('word-count-valid');
            }
        }
    }

    // ==================== EVENT HANDLERS ====================
    setupEventListeners() {
        this.setupPageEventListeners();
        this.setupSecondaryEditorEventListeners();
        this.setupFormEventListeners();
        this.setupAutoSave();
    }

    setupPageEventListeners() {
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.addEventListener('input', (e) => {
                this.updatePageStats();
                this.validatePageContent();
            });
            pageContent.addEventListener('focus', (e) => {
                this.showSecondaryEditor();
            });
        }

        document.getElementById('save-page-btn')?.addEventListener('click', () => {
            this.saveCurrentPage();
        });

        document.getElementById('add-page-btn')?.addEventListener('click', () => {
            this.addNewPage();
        });

        document.getElementById('delete-page-btn')?.addEventListener('click', () => {
            this.deleteCurrentPage();
        });
    }

    setupSecondaryEditorEventListeners() {
        document.getElementById('push-content-btn')?.addEventListener('click', () => {
            this.pushContentToMainEditor();
        });

        document.getElementById('close-secondary-editor')?.addEventListener('click', () => {
            this.closeSecondaryEditor();
        });

        const secondaryTextarea = document.getElementById('secondary-textarea');
        if (secondaryTextarea) {
            secondaryTextarea.addEventListener('input', (e) => {
                this.updateSecondaryEditorStats();
            });
        }
    }

    setupFormEventListeners() {
        const tagsInput = document.getElementById('story-tags');
        if (tagsInput) {
            tagsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    this.addTag(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        document.getElementById('story-title')?.addEventListener('input', (e) => {
            this.checkCharacterLimit(e.target, 200);
        });

        document.getElementById('story-excerpt')?.addEventListener('input', (e) => {
            this.checkCharacterLimit(e.target, 300);
        });

        document.getElementById('preview-btn')?.addEventListener('click', () => {
            this.showPreview();
        });

        document.getElementById('story-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitStory();
        });

        /*document.getElementById('save-draft-btn')?.addEventListener('click', () => {
            this.saveDraft();
        });*/
    }

    setupAutoSave() {
        setInterval(() => {
            this.saveCurrentPageContent();
        }, 10000);
    }

    // ==================== STATS AND VALIDATION ====================
    updatePageStats() {
        const content = document.getElementById('page-content')?.value || '';
        const words = this.countWords(content);
        const characters = content.length;
        
        const wordCountElem = document.getElementById('page-word-count');
        const charCountElem = document.getElementById('page-char-count');
        const currentPageWordsElem = document.getElementById('current-page-words');
        
        if (wordCountElem) wordCountElem.textContent = `${words} words`;
        if (charCountElem) charCountElem.textContent = `${characters} characters`;
        if (currentPageWordsElem) currentPageWordsElem.textContent = `${words} words`;
        
        this.updateGlobalStats();
    }

    updateGlobalStats() {
        const totalWords = this.pages.reduce((sum, page) => sum + page.wordCount, 0);
        const totalPages = this.pages.length;
        
        const totalPagesElem = document.getElementById('total-pages');
        const totalWordsElem = document.getElementById('total-words');
        
        if (totalPagesElem) totalPagesElem.textContent = `Pages: ${totalPages}`;
        if (totalWordsElem) totalWordsElem.textContent = `Total Words: ${totalWords}`;
    }

    
validatePageContent() {
        const content = document.getElementById('page-content')?.value || '';
        const words = this.countWords(content);
        const charCount = this.countChars(content);
        
        const savePageBtn = document.getElementById('save-page-btn');
        const addPageBtn = document.getElementById('add-page-btn');
        
        const isValid = charCount >= 3500 && charCount <= 25000;
        const canAddNewPage = words >= 1000;
        
        if (savePageBtn) {
            savePageBtn.disabled = !isValid;
        }
        
        if (addPageBtn) {
            addPageBtn.disabled = !canAddNewPage;
        }
        
        const wordCountElem = document.getElementById('page-word-count');
        if (wordCountElem) {
            wordCountElem.className = '';
            if (words > 0 && charCount < 3500) {
                wordCountElem.classList.add('word-count-invalid');
            } else if (words > 0 && charCount > 25000) {
                wordCountElem.classList.add('word-count-warning');
            } else {
                wordCountElem.classList.add('word-count-valid');
            }
        }
        
        return isValid;
    }

    
    saveCurrentPage() {
        this.saveCurrentPageContent();
        const currentPage = this.pages[this.currentPageIndex];
        
        if (this.validatePageContent()) {
            currentPage.saved = true;
            this.updatePageNavigation();
            M.toast({html: `Page ${currentPage.pageNumber} saved successfully`});
        } else {
            M.toast({html: 'Page must have between 1000-2000 words to save'});
        }
    }

    countWords(text) {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }
    
    countChars(text){
        return text.trim() ? text.trim().split('').length : 0;
    }

    // ==================== CATEGORY MANAGEMENT ====================
    async loadCategories() {
        try {
            const response = await window.apiService.getCategories();
            if (response.success) {
                this.categories = response.data || response.categories || [];
                this.populateCategorySelect();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            M.toast({html: 'Failed to load categories'});
        }
    }

    populateCategorySelect() {
        const categorySelect = document.getElementById('story-category');
        if (!categorySelect) return;

        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }

        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        M.FormSelect.init(categorySelect);
    }

    // ==================== TAG MANAGEMENT ====================
    addTag(tagText) {
        if (!tagText) return;
        
        const cleanTag = tagText.replace(/,/g, '').trim();
        if (cleanTag && !this.tags.includes(cleanTag)) {
            this.tags.push(cleanTag);
            this.updateTagsDisplay();
        }
    }

    removeTag(tagToRemove) {
        this.tags = this.tags.filter(tag => tag !== tagToRemove);
        this.updateTagsDisplay();
    }

    updateTagsDisplay() {
        const tagsContainer = document.getElementById('tags-container');
        if (!tagsContainer) return;

        tagsContainer.innerHTML = this.tags.map(tag => `
            <div class="tag">
                <span>${tag}</span>
                <i class="material-icons" onclick="createPostPage.removeTag('${tag}')">close</i>
            </div>
        `).join('');
    }

    // ==================== DRAFT MANAGEMENT ====================
    /*async loadDrafts() {
        try {
            const response = await window.apiService.getDrafts();
            if (response.success && response.data && response.data.length > 0) {
                this.showDraftsModal(response.data);
            }
        } catch (error) {
            console.error('Failed to load drafts:', error);
        }
    }

    showDraftsModal(drafts) {
        console.log('Available drafts:', drafts);
    }

    async saveDraft() {
        if (!this.validateForm()) {
            M.toast({html: 'Please fix form errors before saving draft'});
            return;
        }

        this.setLoadingState(true, 'Saving draft...');
        
        try {
            const formData = this.getFormData();
            const response = await window.apiService.saveDraft({
                ...formData,
                status: 'draft'
            });

            if (response.success) {
                this.currentDraftId = response.data?._id || response.data?.id;
                M.toast({html: 'Draft saved successfully!'});
            } else {
                throw new Error(response.message || 'Failed to save draft');
            }
        } catch (error) {
            console.error('Draft save error:', error);
            M.toast({html: `Failed to save draft: ${error.message}`});
        } finally {
            this.setLoadingState(false);
        }
    }*/

    // ==================== FORM SUBMISSION ====================
    getFormData() {
        // Save all page content first
        this.saveCurrentPageContent();
        
        // Calculate total statistics
        const totalWordCount = this.pages.reduce((sum, page) => sum + page.wordCount, 0);
        const totalReadingTime = this.pages.reduce((sum, page) => sum + page.readingTime, 0);
        
        // Map pages to the expected backend structure
        const formattedPages = this.pages.map(page => ({
            pageNumber: page.pageNumber,
            content: page.content,
            wordCount: page.wordCount,
            readingTime: page.readingTime
        }));

        // Map content rating to backend format
        const contentRatingMap = {
            'general': 'G',
            'mature': 'PG-13', 
            'explicit': 'R'
        };

        return {
            title: document.getElementById('story-title')?.value || '',
            excerpt: document.getElementById('story-excerpt')?.value || '',
            category: document.getElementById('story-category')?.value || '',
            pages: formattedPages,//.map(page => page.content), // Send just content array for createStory
            tags: this.tags,
            content_warnings: document.getElementById('content-warnings')?.value || '',
            metadata: {
                totalWordCount: totalWordCount,
                totalReadingTime: totalReadingTime,
                pageCount: this.pages.length,
                contentRating: contentRatingMap[document.getElementById('content-rating')?.value] || 'PG-13',
                contentWarnings: document.getElementById('content-warnings')?.value ? 
                    [document.getElementById('content-warnings')?.value] : []
            },
            allow_comments: document.getElementById('allow-comments')?.checked || true,
            status: 'pending'
        };
    }

    getCategoryName(categorySlug) {
        const category = this.categories.find(cat => 
            cat.slug === categorySlug || cat._id === categorySlug
        );
        return category ? category.name : categorySlug;
    }

    showPreview() {
        const formData = this.getFormData();
        const previewContent = document.getElementById('story-preview-content');
        
        if (previewContent) {
            let previewHTML = `
                <h2>${formData.title || 'Untitled Story'}</h2>
                <div class="story-meta">
                    <p><strong>Category:</strong> ${this.getCategoryName(formData.category) || 'Not specified'}</p>
                    <p><strong>Content Rating:</strong> ${formData.metadata.contentRating || 'Not specified'}</p>
                    <p><strong>Pages:</strong> ${this.pages.length}</p>
                    <p><strong>Total Words:</strong> ${formData.metadata.totalWordCount}</p>
                    ${formData.tags.length ? `<p><strong>Tags:</strong> ${formData.tags.join(', ')}</p>` : ''}
                    ${formData.content_warnings ? `<p><strong>Content Warnings:</strong> ${formData.content_warnings}</p>` : ''}
                </div>
                <hr>
                <div class="preview-excerpt">
                    <h5>Excerpt:</h5>
                    <p>${formData.excerpt || 'No excerpt provided.'}</p>
                </div>
                <hr>
            `;
            
            // Add each page to preview
            this.pages.forEach((page, index) => {
                previewHTML += `
                    <div class="preview-page">
                        <div class="preview-page-header">
                            <h5>Page ${page.pageNumber}</h5>
                            <small>${page.wordCount} words</small>
                        </div>
                        <div class="preview-page-content">
                            ${page.content ? page.content.replace(/\n/g, '<br>') : '<p>No content yet.</p>'}
                        </div>
                        ${index < this.pages.length - 1 ? '<hr>' : ''}
                    </div>
                `;
            });
            
            previewContent.innerHTML = previewHTML;
            
            const modal = M.Modal.getInstance(document.getElementById('preview-modal'));
            modal.open();
        }
    }

    validateForm() {
        const title = document.getElementById('story-title')?.value.trim();
        const category = document.getElementById('story-category')?.value;
        const contentRating = document.getElementById('content-rating')?.value;
        const guidelines = document.getElementById('agree-guidelines')?.checked;
        
        // Check if all pages are valid
        const allPagesValid = this.pages.every(page => {
            const words = this.countChars(page.content);
            return words >= 3500 && words <= 25000;
        });
        
        if (!title) {
            M.toast({html: 'Please enter a story title'});
            return false;
        }
        
        if (title.length < 5) {
            M.toast({html: 'Title must be at least 5 characters long'});
            return false;
        }
        
        if (!category) {
            M.toast({html: 'Please select a category'});
            return false;
        }
        
        if (!contentRating) {
            M.toast({html: 'Please select a content rating'});
            return false;
        }
        
        if (!guidelines) {
            M.toast({html: 'Please agree to the content guidelines'});
            return false;
        }
        
        if (!allPagesValid) {
            M.toast({html: 'All pages must have between 1000-2000 words'});
            return false;
        }
        
        if (this.pages.length === 0) {
            M.toast({html: 'Please add at least one page to your story'});
            return false;
        }
        
        const totalWords = this.pages.reduce((sum, page) => sum + page.wordCount, 0);
        if (totalWords < 1000) {
            M.toast({html: 'Story must have at least 1000 total words'});
            return false;
        }
        
        return true;
    }

    async submitStory() {
        if (this.isSubmitting) return;
        
        if (!this.validateForm()) {
            return;
        }

        this.setLoadingState(true, 'Submitting story...');
        this.isSubmitting = true;

        try {
            const formData = this.getFormData();
            //console.log('Submitting story data:', JSON.stringify(formData)); // Debug log
            
            const response = await window.apiService.createStory(formData);

            if (response.success) {
                this.showSuccessModal();
                this.clearForm();
            } else {
                throw new Error(response.message || 'Failed to submit story');
            }
        } catch (error) {
            //console.error('Story submission error:', error);
            M.toast({html: `Submission failed: ${error.message}`});
        } finally {
            this.setLoadingState(false);
            this.isSubmitting = false;
        }
    }

    showSuccessModal() {
        const modal = M.Modal.getInstance(document.getElementById('success-modal'));
        modal.open();
    }

    clearForm() {
        document.getElementById('story-form').reset();
        this.tags = [];
        this.pages = [];
        this.currentPageIndex = 0;
        this.currentDraftId = null;
        
        this.updateTagsDisplay();
        this.initializeFirstPage();
        
        M.updateTextFields();
        M.FormSelect.init(document.querySelectorAll('select'));
    }

    setLoadingState(isLoading, message = '') {
        const submitBtn = document.getElementById('submit-story-btn');
        //const draftBtn = document.getElementById('save-draft-btn');
        const previewBtn = document.getElementById('preview-btn');
        
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.innerHTML = isLoading 
                ? `<i class="material-icons left">hourglass_empty</i>${message}` 
                : `<i class="material-icons left">send</i>Submit for Review`;
        }
        
//if (draftBtn) draftBtn.disabled = isLoading;
        if (previewBtn) previewBtn.disabled = isLoading;
    }

    checkCharacterLimit(input, maxLength) {
        const currentLength = input.value.length;
        const helperText = input.parentNode.querySelector('.helper-text');
        
        if (helperText) {
            helperText.textContent = `${currentLength}/${maxLength} characters`;
            
            if (currentLength > maxLength * 0.9) {
                helperText.style.color = '#ff4444';
            } else {
                helperText.style.color = '#9e9e9e';
            }
        }
        
        if (currentLength > maxLength) {
            input.value = input.value.substring(0, maxLength);
        }
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.createPostPage = new CreatePostPage();
});

