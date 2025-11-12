// create-contest.js - Refactored with API Service Integration
class CreateContestPage {
    constructor() {
        this.objectives = [];
        this.prizes = [];
        this.isSubmitting = false;
        this.currentDraftId = null;
        
        this.initializePage();
    }

    initializePage() {
        // Check admin permissions
        if (!AuthManager.isAdmin()) {
            M.toast({html: 'Admin access required to create contests'});
            window.location.href = '/frontend/signin.html';
            return;
        }

        this.initializeComponents();
        this.setupEventListeners();
        this.updatePreview();
        this.loadContestDrafts();
    }

    initializeComponents() {
        // Initialize Materialize components
        M.Modal.init(document.querySelectorAll('.modal'));
        M.FormSelect.init(document.querySelectorAll('select'));
        M.Datepicker.init(document.querySelectorAll('.datepicker'), {
            format: 'yyyy-mm-dd',
            autoClose: true
        });
        M.updateTextFields();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('contest-creation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createContest();
        });

        // Objectives management
        document.getElementById('add-objective').addEventListener('click', () => {
            this.addObjective();
        });

        // Prizes management
        document.getElementById('add-prize').addEventListener('click', () => {
            this.addPrize();
        });

        // Real-time preview updates
        document.getElementById('contest-name').addEventListener('input', () => {
            this.updatePreview();
        });

        document.getElementById('contest-description').addEventListener('input', () => {
            this.updatePreview();
        });

        document.getElementById('contest-theme').addEventListener('input', () => {
            this.updatePreview();
        });

        // Save draft
        document.getElementById('save-draft').addEventListener('click', () => {
            this.saveDraft();
        });

        // Auto-save draft every 30 seconds
        setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.saveDraft(true);
            }
        }, 30000);
    }

    addObjective() {
        const container = document.getElementById('objectives-container');
        const objectiveId = `objective-${Date.now()}`;
        
        const objectiveHtml = `
            <div class="objective-item" id="${objectiveId}">
                <div class="row">
                    <div class="input-field col s10">
                        <input type="text" class="objective-input" placeholder="e.g., Create 5 new short stories of at least 2000+ words each" required>
                        <label>Objective</label>
                    </div>
                    <div class="col s2">
                        <button type="button" class="btn-floating btn-small red remove-objective">
                            <i class="material-icons">remove</i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', objectiveHtml);
        
        // Add event listener to remove button
        document.querySelector(`#${objectiveId} .remove-objective`).addEventListener('click', () => {
            document.getElementById(objectiveId).remove();
            this.updatePreview();
        });
        
        M.updateTextFields();
    }

    addPrize() {
        const container = document.getElementById('prizes-container');
        const prizeId = `prize-${Date.now()}`;
        
        const prizeHtml = `
            <div class="prize-item" id="${prizeId}">
                <div class="row">
                    <div class="input-field col s5">
                        <select class="prize-type">
                            <option value="cash">Cash</option>
                            <option value="achievement">Achievement</option>
                            <option value="badge">Badge</option>
                            <option value="featured">Featured Placement</option>
                            <option value="other">Other</option>
                        </select>
                        <label>Prize Type</label>
                    </div>
                    <div class="input-field col s5">
                        <input type="text" class="prize-value" placeholder="e.g., $100 or Winter Quiller 2025" required>
                        <label>Prize Value</label>
                    </div>
                    <div class="col s2">
                        <button type="button" class="btn-floating btn-small red remove-prize">
                            <i class="material-icons">remove</i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', prizeHtml);
        
        // Initialize select
        M.FormSelect.init(document.querySelector(`#${prizeId} select`));
        
        // Add event listener to remove button
        document.querySelector(`#${prizeId} .remove-prize`).addEventListener('click', () => {
            document.getElementById(prizeId).remove();
            this.updatePreview();
        });
        
        M.updateTextFields();
    }

    collectFormData() {
        const objectives = Array.from(document.querySelectorAll('.objective-input'))
            .map(input => input.value.trim())
            .filter(value => value !== '');

        const prizes = Array.from(document.querySelectorAll('.prize-item')).map(item => {
            const type = item.querySelector('.prize-type').value;
            const value = item.querySelector('.prize-value').value.trim();
            return { type, value };
        }).filter(prize => prize.value !== '');

        const categories = Array.from(document.getElementById('contest-category').selectedOptions)
            .map(option => option.value);

        return {
            name: document.getElementById('contest-name').value,
            description: document.getElementById('contest-description').value,
            theme: document.getElementById('contest-theme').value,
            start_date: document.getElementById('contest-start-date').value,
            end_date: document.getElementById('contest-end-date').value,
            objectives: objectives,
            prizes: prizes,
            eligible_categories: categories,
            author_level: document.getElementById('author-level').value,
            rules: document.getElementById('contest-rules').value,
            status: 'upcoming'
        };
    }

    hasUnsavedChanges() {
        const formData = this.collectFormData();
        return !!formData.name || !!formData.description || !!formData.theme;
    }

    async createContest() {
        if (this.isSubmitting) return;

        const formData = this.collectFormData();
        
        // Validation
        if (!this.validateForm(formData)) {
            return;
        }

        this.isSubmitting = true;
        this.setLoadingState(true);

        try {
            const response = await apiService.createContest(formData);
            
            if (response.success) {
                M.Modal.getInstance(document.getElementById('success-modal')).open();
                this.clearForm();
                this.currentDraftId = null;
            } else {
                throw new Error(response.message || 'Failed to create contest');
            }
        } catch (error) {
            console.error('Contest creation error:', error);
            M.toast({html: `Contest creation failed: ${error.message}`});
        } finally {
            this.isSubmitting = false;
            this.setLoadingState(false);
        }
    }

    validateForm(formData) {
        if (!formData.name.trim()) {
            M.toast({html: 'Please enter a contest name'});
            return false;
        }

        if (!formData.description.trim()) {
            M.toast({html: 'Please enter a contest description'});
            return false;
        }

        if (!formData.theme.trim()) {
            M.toast({html: 'Please enter a contest theme'});
            return false;
        }

        if (!formData.start_date || !formData.end_date) {
            M.toast({html: 'Please select start and end dates'});
            return false;
        }

        if (new Date(formData.start_date) >= new Date(formData.end_date)) {
            M.toast({html: 'End date must be after start date'});
            return false;
        }

        if (formData.objectives.length === 0) {
            M.toast({html: 'Please add at least one objective'});
            return false;
        }

        if (formData.prizes.length === 0) {
            M.toast({html: 'Please add at least one prize'});
            return false;
        }

        return true;
    }

    setLoadingState(loading) {
        const submitBtn = document.getElementById('create-contest');
        const draftBtn = document.getElementById('save-draft');

        if (loading) {
            submitBtn.innerHTML = '<i class="material-icons left">hourglass_empty</i> Creating...';
            submitBtn.disabled = true;
            draftBtn.disabled = true;
        } else {
            submitBtn.innerHTML = 'Create Contest';
            submitBtn.disabled = false;
            draftBtn.disabled = false;
        }
    }

    async saveDraft(silent = false) {
        const formData = this.collectFormData();
        formData.status = 'draft';
        
        try {
            // For now, using localStorage for drafts - in production, use API
            const drafts = JSON.parse(localStorage.getItem('contest_drafts') || '[]');
            const draftData = {
                ...formData,
                id: this.currentDraftId || `draft-${Date.now()}`,
                saved_at: new Date().toISOString()
            };
            
            if (this.currentDraftId) {
                const index = drafts.findIndex(d => d.id === this.currentDraftId);
                if (index !== -1) {
                    drafts[index] = draftData;
                } else {
                    drafts.push(draftData);
                }
            } else {
                drafts.push(draftData);
                this.currentDraftId = draftData.id;
            }
            
            localStorage.setItem('contest_drafts', JSON.stringify(drafts));
            
            if (!silent) {
                M.toast({html: 'Contest saved as draft'});
            }
        } catch (error) {
            console.error('Failed to save draft:', error);
            if (!silent) {
                M.toast({html: 'Failed to save draft'});
            }
        }
    }

    async loadContestDrafts() {
        try {
            const drafts = JSON.parse(localStorage.getItem('contest_drafts') || '[]');
            if (drafts.length > 0) {
                // Show draft loading option
                this.showDraftLoader(drafts);
            }
        } catch (error) {
            console.error('Failed to load drafts:', error);
        }
    }

    showDraftLoader(drafts) {
        const draftList = document.getElementById('draft-list');
        if (draftList) {
            draftList.innerHTML = drafts.map(draft => `
                <li>
                    <a href="#" class="load-draft" data-draft-id="${draft.id}">
                        ${draft.name || 'Untitled Draft'} 
                        <span class="secondary-content">${new Date(draft.saved_at).toLocaleDateString()}</span>
                    </a>
                </li>
            `).join('');

            // Add event listeners
            document.querySelectorAll('.load-draft').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const draftId = e.target.dataset.draftId;
                    this.loadDraft(draftId);
                });
            });
        }
    }

    loadDraft(draftId) {
        try {
            const drafts = JSON.parse(localStorage.getItem('contest_drafts') || '[]');
            const draft = drafts.find(d => d.id === draftId);
            
            if (draft) {
                this.populateForm(draft);
                this.currentDraftId = draftId;
                M.toast({html: 'Draft loaded successfully'});
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
            M.toast({html: 'Failed to load draft'});
        }
    }

    populateForm(draft) {
        document.getElementById('contest-name').value = draft.name || '';
        document.getElementById('contest-description').value = draft.description || '';
        document.getElementById('contest-theme').value = draft.theme || '';
        document.getElementById('contest-start-date').value = draft.start_date || '';
        document.getElementById('contest-end-date').value = draft.end_date || '';
        document.getElementById('contest-rules').value = draft.rules || '';
        document.getElementById('author-level').value = draft.author_level || '';

        // Populate objectives
        const objectivesContainer = document.getElementById('objectives-container');
        objectivesContainer.innerHTML = '';
        if (draft.objectives && draft.objectives.length > 0) {
            draft.objectives.forEach(objective => {
                this.addObjective();
                const lastInput = objectivesContainer.lastElementChild.querySelector('.objective-input');
                if (lastInput) {
                    lastInput.value = objective;
                }
            });
        } else {
            this.addObjective(); // Add one empty objective
        }

        // Populate prizes
        const prizesContainer = document.getElementById('prizes-container');
        prizesContainer.innerHTML = '';
        if (draft.prizes && draft.prizes.length > 0) {
            draft.prizes.forEach(prize => {
                this.addPrize();
                const lastItem = prizesContainer.lastElementChild;
                const typeSelect = lastItem.querySelector('.prize-type');
                const valueInput = lastItem.querySelector('.prize-value');
                
                if (typeSelect && valueInput) {
                    typeSelect.value = prize.type;
                    valueInput.value = prize.value;
                }
            });
        } else {
            this.addPrize(); // Add one empty prize
        }

        // Update selects
        M.FormSelect.init(document.querySelectorAll('select'));
        M.updateTextFields();
        this.updatePreview();
    }

    updatePreview() {
        const formData = this.collectFormData();
        const preview = document.getElementById('contest-preview');

        if (!formData.name) {
            preview.innerHTML = `
                <div class="preview-placeholder">
                    <i class="material-icons large">emoji_events</i>
                    <p>Contest preview will appear here</p>
                </div>
            `;
            return;
        }

        preview.innerHTML = `
            <div class="contest-preview">
                <h4 class="preview-title">${formData.name}</h4>
                <p class="preview-theme"><strong>Theme:</strong> ${formData.theme || 'Not set'}</p>
                <p class="preview-description">${formData.description || 'No description provided'}</p>
                
                <div class="preview-timeline">
                    <p><strong>Timeline:</strong> ${formData.start_date ? new Date(formData.start_date).toLocaleDateString() : 'Not set'} 
                    - ${formData.end_date ? new Date(formData.end_date).toLocaleDateString() : 'Not set'}</p>
                </div>
                
                <div class="preview-objectives">
                    <h6>Objectives:</h6>
                    <ul>
                        ${formData.objectives.map(obj => `<li>${obj}</li>`).join('') || '<li>No objectives set</li>'}
                    </ul>
                </div>
                
                <div class="preview-prizes">
                    <h6>Prizes:</h6>
                    <ul>
                        ${formData.prizes.map(prize => `<li><strong>${prize.type}:</strong> ${prize.value}</li>`).join('') || '<li>No prizes set</li>'}
                    </ul>
                </div>
            </div>
        `;
    }

    clearForm() {
        document.getElementById('contest-creation-form').reset();
        document.getElementById('objectives-container').innerHTML = '';
        document.getElementById('prizes-container').innerHTML = '';
        
        // Add initial empty fields
        this.addObjective();
        this.addPrize();
        
        // Re-initialize components
        M.FormSelect.init(document.querySelectorAll('select'));
        M.updateTextFields();
        this.updatePreview();
    }
}

// Initialize the contest creation page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated and is admin
    if (!AuthManager.isAuthenticated()) {
        window.location.href = '/frontend/signin.html';
        return;
    }

    if (!AuthManager.isAdmin()) {
        M.toast({html: 'Admin access required'});
        window.location.href = '/frontend/index.html';
        return;
    }

    window.createContestPage = new CreateContestPage();
});






