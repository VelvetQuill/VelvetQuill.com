

// story-read.js - COMPLETE REFACTORED VERSION
$(document).ready(function(){
    // Initialize Materialize components
    $('.sidenav').sidenav();
    $('.modal').modal();
    $('select').formSelect();

    // Get story ID and page number from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');
    const pageNumber = parseInt(urlParams.get('page')) || 1;
    
    let currentStory = null;
    let currentComments = [];
    let currentPage = pageNumber;
    let totalPages = 1;
    let userReadingProgress = null;
    let userInteractions = {};

    // Initialize the story read page
    async function initStoryRead() {
        await loadStory();
        await setAuthorAvatarHeader();
        await loadCurrentPage();
        setupEventListeners();
        updateReadingProgress();
        checkUserAuth();
        await loadUserReadingProgress();
        await loadUserInteractions();
    }


// Function to update navigation avatar with author stats
async function setAuthorAvatarHeader() {
    if (!currentStory || !currentStory.author) return;
    
    try {
        // Get author username from current story
        const authorUsername = typeof currentStory.author === 'object' 
            ? currentStory.author.username 
            : currentStory.author;
        
        if (!authorUsername) return;

        // Get author profile and stats from backend
        const response = await window.apiService.getUserProfile(authorUsername);
        
        if (response.success && response.user) {
            const author = response.user;
            
            // Update author avatar
            const authorAvatar = author.profile?.avatar;
            const displayName = author.displayName || author.username;
            const initials = displayName.charAt(0).toUpperCase();
            
            let avatarHTML = '';
            if (authorAvatar) {
                avatarHTML = `
                    <img id="nav-avatar" 
                         src="${authorAvatar}" 
                         alt="${displayName}" 
                         class="user-avatar circle responsive-img">
                `;
            } else {
                // Fallback to initials if no avatar
                avatarHTML = `
                    <div id="nav-avatar"
                         style="margin:0;" 
                         class="w3-center user-avatar circle avatar-fallback teal lighten-2 white-text">
                        ${initials}
                    </div>
                `;
            }
            
            document.getElementById('author-name2').innerHTML = displayName;
            document.getElementById('author-avatar').innerHTML = avatarHTML;
            document.getElementById('author-avatar2').innerHTML = avatarHTML;
            
            // Update author stats if elements exist
            if (document.getElementById('author-followers-count')) {
                const count = author.stats?.followersCount?.toLocaleString() || '0';
                document.getElementById('author-followers-count').textContent = count;
                document.getElementById('author-followers-count2').textContent = count;   
            }
            /*
            if (document.getElementById('author-following-count')) {
                document.getElementById('author-following-count').textContent = 
                    author.stats?.followingCount?.toLocaleString() || '0';
            }*/
            
            if (document.getElementById('author-stories-count')) {
                const count = author.stats?.storiesCount?.toLocaleString() || '0';
                document.getElementById('author-stories-count').textContent = count;
                document.getElementById('author-stories-count2').textContent = count;    
            }
            
            console.log('Author avatar and stats updated for:', displayName);
        }
    } catch (error) {
        console.error('Error setting author avatar header:', error);
        // Fallback to initials on error
        const fallbackInitials = 'A';
        document.getElementById('author-avatar').innerHTML = `
            <div id="nav-avatar" 
                 class="user-avatar circle avatar-fallback grey lighten-2 white-text">
                ${fallbackInitials}
            </div>
        `;
    }
}



    // Load story metadata from backend
    async function loadStory() {
        if (!storyId) {
            console.error('No story ID provided');
            window.location.href = 'category-list.html';
            return;
        }

        try {
            console.log(`Loading story ${storyId} from backend...`);
            
            const response = await window.apiService.getStory(storyId);
            
            if (response.success && response.story) {
                currentStory = response.story;
                totalPages = currentStory.pages ? currentStory.pages.length : 1;
                userInteractions = response.userInteractions || {};
                console.log('Story loaded from backend:', currentStory.title, `(${totalPages} pages)`);
            } else {
                await loadStoryFromFallback(storyId);
            }
        } catch (error) {
            console.error('Error loading story from backend:', error);
            await loadStoryFromFallback(storyId);
        }

        if (!currentStory) {
            console.error('Story not found');
            window.location.href = 'category-list.html';
            return;
        }

        await loadComments();
        updateStoryDisplay();
        loadSimilarStories();
        updateCommentForm();
        updatePageNavigation();
        populatePageSelector();
        updateReactionsDisplay();
    }

    // Load specific page content
    async function loadCurrentPage() {
        if (!currentStory || !storyId) return;

        try {
            showPageLoadingState(true);

            const response = await window.apiService.getStoryPage(storyId, currentPage);
            
            if (response.success) {
                displayPageContent(response.page, response.story);
                updateURLWithCurrentPage();
            } else {
                loadPageFromLocalData();
            }
        } catch (error) {
            console.error('Error loading page from backend:', error);
            loadPageFromLocalData();
        } finally {
            showPageLoadingState(false);
        }
    }

    // Show/hide page loading state
    function showPageLoadingState(loading) {
        if (loading) {
            $('#story-content').html(`
                <div class="page-loading">
                    <div class="progress">
                        <div class="indeterminate"></div>
                    </div>
                    <p class="center-align">Loading page ${currentPage}...</p>
                </div>
            `);
        }
    }

    // Display page content
    function displayPageContent(page, storyInfo = null) {
        if (!page) {
            $('#story-content').html(`
                <div class="page-error center-align">
                    <i class="material-icons large">error_outline</i>
                    <h4>Page Not Found</h4>
                    <p>The requested page could not be loaded.</p>
                    <button class="btn waves-effect waves-light" onclick="loadPage(1)">
                        Go to First Page
                    </button>
                </div>
            `);
            return;
        }

        const pageHTML = `
            <div class="page-content">
                <div class="page-header">
                    <h2 class="page-title">${storyInfo?.title || currentStory.title}</h2>
                    <div class="page-meta">
                        <span class="page-number">Page ${page.pageNumber}</span>
                        <span class="word-count">${page.wordCount || 0} words</span>
                        <span class="reading-time">${page.readingTime || 5} min read</span>
                    </div>
                </div>
                <div class="page-text">
                    ${formatPageContent(page.content)}
                </div>
                <div class="page-footer">
                    <div class="page-stats">
                        <span>Page ${page.pageNumber} of ${totalPages}</span>
                    </div>
                </div>
            </div>
        `;
        
        $('#story-content').html(pageHTML);
        updatePageNavigation();
        updateMultiPageProgress();
    }

    // Load page from local story data (fallback)
    function loadPageFromLocalData() {
        if (!currentStory.pages || currentStory.pages.length === 0) {
            displayPageContent(null);
            return;
        }

        const page = currentStory.pages.find(p => p.pageNumber === currentPage);
        if (page) {
            displayPageContent(page);
        } else if (currentPage === 1 && currentStory.content) {
            // Fallback for single-page stories
            displayPageContent({
                pageNumber: 1,
                content: currentStory.content,
                wordCount: currentStory.metadata?.wordCount || 0,
                readingTime: currentStory.metadata?.readingTime || 5
            });
        } else {
            displayPageContent(null);
        }
    }

    // Format page content with proper line breaks and paragraphs
    function formatPageContent(content) {
        if (!content) return '<p>No content available for this page.</p>';
        
        return content.split('\n\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0)
            .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    // Update page navigation controls
    function updatePageNavigation() {
        const hasPrevious = currentPage > 1;
        const hasNext = currentPage < totalPages;
        
        $('#prev-page-btn').prop('disabled', !hasPrevious);
        $('#prev-page-bottom').prop('disabled', !hasPrevious);
        $('#next-page-btn').prop('disabled', !hasNext);
        $('#next-page-bottom').prop('disabled', !hasNext);
        
        $('#current-page').text(`Page ${currentPage}`);
        $('#total-pages').text(totalPages);
        
        $('#page-selector').val(currentPage);
        $('#page-selector').formSelect();
    }

    // Populate page selector dropdown
    function populatePageSelector() {
        const selector = $('#page-selector');
        selector.empty();
        
        selector.append('<option value="" disabled selected>Jump to page...</option>');
        
        for (let i = 1; i <= totalPages; i++) {
            selector.append(`<option value="${i}">Page ${i}</option>`);
        }
        
        selector.formSelect();
    }

    // Update multi-page progress bar
    function updateMultiPageProgress() {
        const progress = totalPages > 0 ? ((currentPage - 1) / totalPages) * 100 : 0;
        $('#multi-page-progress-bar').css('width', `${progress}%`);
        $('#progress-percentage').text(`${Math.round(progress)}%`);
    }

    // Load user reading progress
    async function loadUserReadingProgress() {
        if (!AuthManager.isAuthenticated() || !storyId) return;
        
        try {
            const response = await window.apiService.getReadingProgress(storyId);
            if (response.success) {
                userReadingProgress = response.progress;
                if (userReadingProgress && userReadingProgress.currentPage > currentPage) {
                    showContinueReadingPrompt();
                }
            }
        } catch (error) {
            console.error('Error loading reading progress:', error);
        }
    }

    // Load user interactions (likes, reading list status)
    async function loadUserInteractions() {
        if (!AuthManager.isAuthenticated() || !storyId) return;
        
        try {
            const response = await window.apiService.getStoryReadingStatus(storyId);
            if (response.success) {
                userInteractions = response.interactions || {};
                updateReactionsDisplay();
            }
        } catch (error) {
            console.error('Error loading user interactions:', error);
        }
    }

    // Show continue reading prompt
    function showContinueReadingPrompt() {
        if (userReadingProgress && userReadingProgress.currentPage > currentPage) {
            const continueBtn = $(`
                <div class="continue-reading-prompt card-panel teal lighten-5">
                    <p>You were reading page ${userReadingProgress.currentPage}. 
                    <a href="#" id="continue-reading-btn" class="teal-text text-darken-2">Continue from there?</a></p>
                </div>
            `);
            
            $('#story-content').before(continueBtn);
            
            $('#continue-reading-btn').on('click', function(e) {
                e.preventDefault();
                loadPage(userReadingProgress.currentPage);
            });
        }
    }

    // Update story display with multi-page info
    function updateStoryDisplay() {
        if (!currentStory) return;

        const storyData = mapStoryData(currentStory);
        
        $('#story-title').text(storyData.title);
        $('#story-title-breadcrumb').text(storyData.title);
        $('#author-name1').text(storyData.author);
        $('#author-name2').text(storyData.author);
        $('#story-category').text(storyData.category);
        $('#category-breadcrumb').text(storyData.category.charAt(0).toUpperCase() + storyData.category.slice(1));
        $('#story-date').text(formatDate(storyData.date));
        $('#story-views').text(storyData.views.toLocaleString());
        $('#story-rating').text(`${storyData.rating}/5.0 (${storyData.ratingCount} ratings)`);
        $('#reading-time').text(`${storyData.readingTime} min read`);
        $('#page-count').text(`${totalPages} page${totalPages !== 1 ? 's' : ''}`);
        
        const authorId = currentStory.author?.username || currentStory.authorId;

        //console.log(`AUTHOR ID: ${authorId}`);
        if(authorId){
            $('#author-name1').attr('href',`author-room.html?id=${authorId}`);
            $('#author-name2').attr('href',`author-room.html?id=${authorId}`);
        }
        
        updateReactionsDisplay();
    }

    // Map backend story data to frontend structure
    function mapStoryData(story) {
        const totalWordCount = story.metadata?.wordCount || 
                             (story.pages ? story.pages.reduce((sum, page) => sum + (page.wordCount || 0), 0) : 0);
        
        const totalReadingTime = story.metadata?.readingTime || 
                               Math.ceil(totalWordCount / 200);

        return {
            title: story.title || 'Untitled',
            author: typeof story.author === 'object' ? 
                   (story.author.displayName || story.author.username || 'Unknown Author') : 
                   (story.author || 'Unknown Author'),
            category: story.category || 'Romance',
            date: story.createdAt || story.date || new Date().toISOString(),
            views: story.stats?.views || story.views || 0,
            rating: story.stats?.averageRating || story.stats?.rating || story.rating || 0,
            ratingCount: story.stats?.ratingCount || story.ratingCount || 0,
            readingTime: totalReadingTime,
            content: story.content || '<p>No content available.</p>',
            likesCount: story.stats?.likesCount || 0,
            readingListCount: story.stats?.readingListCount || 0
        };
    }

    // Update reactions display based on user interactions
    function updateReactionsDisplay() {
        if (!currentStory) return;

        const isLiked = userInteractions.isLiked || false;
        const inReadingList = userInteractions.inReadingList || false;

        // Update like button
        const likeIcon = isLiked ? 'favorite' : 'favorite_border';
        $('.like-story i').text(likeIcon);
        $('.like-story').toggleClass('liked', isLiked);

        // Update reading list button
        const readingListIcon = inReadingList ? 'bookmark' : 'bookmark_border';
        $('.reading-list-btn i').text(readingListIcon);
        $('.reading-list-btn').toggleClass('added', inReadingList);

        // Update counts
        $('#likes-count').text(currentStory.stats?.likesCount || 0);
        $('#reading-list-count').text(currentStory.stats?.readingListCount || 0);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Page navigation
        $('#prev-page-btn, #prev-page-bottom').on('click', () => loadPage(currentPage - 1));
        $('#next-page-btn, #next-page-bottom').on('click', () => loadPage(currentPage + 1));
        
        // Page selector
        $('#page-selector').on('change', function() {
            const selectedPage = parseInt($(this).val());
            if (selectedPage && selectedPage !== currentPage) {
                loadPage(selectedPage);
            }
        });
        
        // Keyboard navigation
        $(document).on('keydown', function(e) {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    if (currentPage > 1) {
                        e.preventDefault();
                        loadPage(currentPage - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (currentPage < totalPages) {
                        e.preventDefault();
                        loadPage(currentPage + 1);
                    }
                    break;
            }
        });

        // Reactions
        $('.like-story').on('click', handleLike);
        $('.reading-list-btn').on('click', handleReadingList);
        
        // Rating
        $('.star').on('click', function() {
            if (!AuthManager.isAuthenticated()) {
                $('#login-modal').modal('open');
                return;
            }
            const rating = $(this).data('rating');
            handleRating(rating);
        });
        
        // Comments
        $('#comment-form').on('submit', function (e) {
            e.preventDefault();
            handleCommentSubmit();
        });

        // Comment actions (delegated for dynamic content)
        $('#comments-container').on('click', '.like-comment-btn', handleLikeComment);
        $('#comments-container').on('click', '.reply-comment-btn', handleReplyComment);
        $('#comments-container').on('click', '.edit-comment-btn', handleEditComment);
        $('#comments-container').on('click', '.delete-comment-btn', handleDeleteComment);

        
        // Scroll progress
        $(window).on('scroll', updateReadingProgress);
    }

    // Handle like/unlike
    async function handleLike(e) {
        e.preventDefault();
        if (!AuthManager.isAuthenticated()) {
            $('#login-modal').modal('open');
            return;
        }
        
        try {
            const response = await window.apiService.likeStory(storyId);
            if (response.success) {
                userInteractions.isLiked = response.isLiked;
                if (currentStory.stats) {
                    currentStory.stats.likesCount = response.likesCount;
                }
                updateReactionsDisplay();
                M.toast({
                    html: response.isLiked ? 'Story liked!' : 'Like removed',
                    classes: response.isLiked ? 'success-toast' : 'info-toast'
                });
            }
        } catch (error) {
            console.error('Error liking story:', error);
            M.toast({html: 'Failed to like story', classes: 'error-toast'});
        }
    }

    // Handle reading list
    async function handleReadingList(e) {
        e.preventDefault();
        if (!AuthManager.isAuthenticated()) {
            $('#login-modal').modal('open');
            return;
        }
        
        try {
            const response = await window.apiService.addToReadingList(storyId);
            if (response.success) {
                userInteractions.inReadingList = response.inReadingList;
                if (currentStory.stats) {
                    currentStory.stats.readingListCount = response.readingListCount;
                }
                updateReactionsDisplay();
                M.toast({
                    html: response.inReadingList ? 'Added to reading list!' : 'Removed from reading list',
                    classes: response.inReadingList ? 'success-toast' : 'info-toast'
                });
            }
        } catch (error) {
            console.error('Error updating reading list:', error);
            M.toast({html: 'Failed to update reading list', classes: 'error-toast'});
        }
    }

    // Handle rating
    async function handleRating(rating) {
        try {
            const response = await window.apiService.rateStory(storyId, rating);
            if (response.success) {
                if (currentStory.stats) {
                    currentStory.stats.averageRating = response.averageRating;
                    currentStory.stats.ratingCount = response.ratingCount;
                }
                updateStoryDisplay();
                M.toast({html: 'Rating submitted!', classes: 'success-toast'});
            }
        } catch (error) {
            console.error('Error rating story:', error);
            M.toast({html: 'Failed to submit rating', classes: 'error-toast'});
        }
    }

    // Load a specific page
    async function loadPage(pageNum) {
        if (pageNum < 1 || pageNum > totalPages) return;
        
        // Update reading progress
        if (AuthManager.isAuthenticated() && storyId) {
            try {
                await window.apiService.updateReadingProgress(storyId, pageNum);
            } catch (error) {
                console.error('Error updating reading progress:', error);
            }
        }
        
        currentPage = pageNum;
        await loadCurrentPage();
    }

    // Update URL with current page
    function updateURLWithCurrentPage() {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('page', currentPage);
        window.history.replaceState({}, '', newUrl);
    }


    // Load comments for the story
    async function loadComments() {
        if (!storyId) return;

        try {
            //console.log(`Loading comments for story: ${storyId}`);

            const response = await window.apiService.getStoryComments(storyId, {
                page: 1,
                limit: 50,
                sortBy: 'createdAt',
                sortOrder: 'desc',
                includeReplies: true
            });

            if (response.success) {
                currentComments = response.comments || [];
                console.log(`Loaded ${currentComments.length} comments`);
                updateCommentsDisplay();
            } else {
                console.error('Failed to load comments:', response.message);
                currentComments = [];
                updateCommentsDisplay();
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            currentComments = [];
            updateCommentsDisplay();

            // Show error to user
            M.toast({ html: 'Failed to load comments', classes: 'error-toast' });
        }
    }

    // Update comments display
    function updateCommentsDisplay() {
        const container = $('#comments-list');
        container.empty();

        if (!currentComments || currentComments.length === 0) {
            container.html(`
            <div class="center-align no-comments">
                <i class="material-icons large">chat_bubble_outline</i>
                <h5>No comments yet</h5>
                <p>Be the first to share your thoughts!</p>
            </div>
        `);
            return;
        }

        // Sort comments: pinned first, then by date
        const sortedComments = [...currentComments].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        sortedComments.forEach(comment => {
            const commentHTML = createCommentHTML(comment);
            container.append(commentHTML);
        });

        //console.log(`Displayed ${sortedComments.length} comments`);
    }

    // Create comment HTML
    function createCommentHTML(comment) {
    const isPinned = comment.isPinned || false;
    const replies = comment.replies || [];
    const likesCount = comment.engagement?.likesCount || 0;
    const repliesCount = comment.engagement?.repliesCount || 0;
    
    return `
        <div class="comment card-panel ${isPinned ? 'pinned-comment teal lighten-5' : ''}" data-comment-id="${comment._id || comment.id}">
            ${isPinned ? `
                <div class="pinned-badge">
                    <i class="material-icons tiny">push_pin</i>
                    Pinned by author
                </div>
            ` : ''}
            
            <div class="comment-header">
                <div class="comment-author-info">
                    <img src="${comment.author?.profile?.avatar || ''}" 
                         alt="${comment.author?.displayName || 'User'}" 
                         class="comment-avatar circle"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0Y2EwN2IiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJ3aGl0ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDBDNC40OCAwIDAgNC40OCAwIDEwQzAgMTUuNTIgNC40OCAyMCAxMCAyMEMxNS41MiAyMCAyMCAxNS41MiAyMCAxMEMyMCA0LjQ4IDE1LjUyIDAgMTAgMFpMNS4wNyAxNS4yOEM2LjUgMTMuOTQgOS4xMSAxMyAxMiAxM0MxNC44NyAxMyAxNy41IDEzLjk0IDE4LjkyIDE1LjI4QzE3LjU1IDE3LjM2IDE1IDE5IDEyIDE5QzkgMTkgNi40NSAxNy4zNiA1LjA3IDE1LjI4Wk0xMiA0QzEzLjY1IDQgMTUgNS4zNSAxNSA3QzE1IDguNjUgMTMuNjUgMTAgMTIgMTBDMTAuMzUgMTAgOSA4LjY1IDkgN0M5IDUuMzUgMTAuMzUgNCAxMiA0WiIvPgo8L3N2Zz4KPC9zdmc+'">
                    <div class="comment-author-details">
                        <span class="comment-author-name">${comment.author?.displayName || comment.author?.username || 'Anonymous'}</span>
                        ${comment.author?.isAuthor ? '<span class="author-badge">Author</span>' : ''}
                    </div>
                </div>
                <div class="comment-meta">
                    <span class="comment-date">${formatDate(comment.createdAt)}</span>
                    ${comment.metadata?.isEdited ? '<span class="edited-badge">(edited)</span>' : ''}
                </div>
            </div>
            
            <div class="comment-content">
                <p>${comment.content}</p>
            </div>
            
            <div class="comment-actions">
                <button class="btn-flat like-comment-btn ${comment.userLiked ? 'liked' : ''}" 
                        data-comment-id="${comment._id || comment.id}">
                    <i class="material-icons left">thumb_up</i>
                    <span class="likes-count">${likesCount}</span>
                </button>
                
                <button class="btn-flat reply-comment-btn" 
                        data-comment-id="${comment._id || comment.id}">
                    <i class="material-icons left">reply</i>
                    Reply
                </button>
                
                ${AuthManager.isAuthenticated() && (comment.author?._id === AuthManager.getCurrentUser()?.id || AuthManager.isAdmin()) ? `
                    <button class="btn-flat edit-comment-btn" 
                            data-comment-id="${comment._id || comment.id}">
                        <i class="material-icons left">edit</i>
                        Edit
                    </button>
                    
                    <button class="btn-flat delete-comment-btn red-text" 
                            data-comment-id="${comment._id || comment.id}">
                        <i class="material-icons left">delete</i>
                        Delete
                    </button>
                ` : ''}
            </div>
            
            ${replies.length > 0 ? `
                <div class="comment-replies">
                    <div class="replies-header">
                        <i class="material-icons tiny">subdirectory_arrow_right</i>
                        ${repliesCount} ${repliesCount === 1 ? 'reply' : 'replies'}
                    </div>
                    ${replies.map(reply => createReplyHTML(reply)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

    async function handleCommentSubmit() {
        if (!AuthManager.isAuthenticated()) {
            $('#login-modal').modal('open');
            return;
        }

        const commentText = $('#comment-text').val().trim();
        if (!commentText) {
            M.toast({ html: 'Please enter a comment', classes: 'warning-toast' });
            return;
        }

        // Show loading state
        const submitBtn = $('#submit-comment');
        const originalText = submitBtn.html();
        submitBtn.prop('disabled', true).html('<i class="material-icons left">hourglass_empty</i>Posting...');

        try {
            const response = await window.apiService.addComment({
                storyId: storyId,
                content: commentText
            });

            if (response.success) {
                $('#comment-text').val('');
                await loadComments(); // Reload comments
                M.toast({ html: 'Comment added successfully!', classes: 'success-toast' });
            } else {
                M.toast({ html: 'Failed to add comment: ' + (response.message || 'Unknown error'), classes: 'error-toast' });
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            M.toast({ html: 'Failed to add comment. Please try again.', classes: 'error-toast' });
        } finally {
            // Restore button state
            submitBtn.prop('disabled', false).html(originalText);
        }
    }

    // Load similar stories
    async function loadSimilarStories() {
        if (!currentStory) return;
        
        try {
            const response = await window.apiService.getStoriesByCategory(currentStory.category, {
                limit: 4,
                exclude: storyId
            });
            
            if (response.success) {
                displaySimilarStories(response.stories || []);
            }
        } catch (error) {
            console.error('Error loading similar stories:', error);
        }
    }

    // Display similar stories
    function displaySimilarStories(stories) {
        const container = $('#similar-stories');
        container.empty();
        
        if (!stories || stories.length === 0) return;
        
        stories.forEach(story => {
            const storyHTML = `
                <div class="similar-story card">
                    <div class="card-content">
                        <span class="card-title">${story.title}</span>
                        <p class="truncate">${story.excerpt || 'No excerpt available'}</p>
                    </div>
                    <div class="card-action">
                        <a href="story-read.html?id=${story._id || story.id}">Read</a>
                    </div>
                </div>
            `;
            container.append(storyHTML);
        });
    }


    // Handle like/unlike comment
    async function handleLikeComment(e) {
        e.preventDefault();

        if (!AuthManager.isAuthenticated()) {
            $('#login-modal').modal('open');
            return;
        }

        const commentId = $(this).data('comment-id');
        const likeBtn = $(this);
        const likesCountEl = likeBtn.find('.likes-count');

        try {
            const response = await window.apiService.likeComment(commentId);

            if (response.success) {
                const newLikesCount = response.likesCount;
                likesCountEl.text(newLikesCount);

                // Toggle liked state
                likeBtn.toggleClass('liked', !likeBtn.hasClass('liked'));

                M.toast({
                    html: likeBtn.hasClass('liked') ? 'Comment liked!' : 'Like removed',
                    classes: 'success-toast'
                });
            }
        } catch (error) {
            console.error('Error liking comment:', error);
            M.toast({ html: 'Failed to like comment', classes: 'error-toast' });
        }
    }

    // Handle reply to comment
    function handleReplyComment(e) {
        e.preventDefault();

        if (!AuthManager.isAuthenticated()) {
            $('#login-modal').modal('open');
            return;
        }

        const commentId = $(this).data('comment-id');
        // Implement reply functionality
        M.toast({ html: 'Reply functionality coming soon!', classes: 'info-toast' });
    }

    // Handle edit comment
    function handleEditComment(e) {
        e.preventDefault();

        const commentId = $(this).data('comment-id');
        const commentEl = $(this).closest('.comment, .comment-reply');
        const contentEl = commentEl.find('.comment-content p');
        const currentContent = contentEl.text();

        // Simple inline edit implementation
        const newContent = prompt('Edit your comment:', currentContent);

        if (newContent && newContent !== currentContent) {
            updateComment(commentId, newContent, commentEl);
        }
    }

    // Update comment content
    async function updateComment(commentId, newContent, commentEl) {
        try {
            const response = await window.apiService.updateComment(commentId, {
                content: newContent
            });

            if (response.success) {
                commentEl.find('.comment-content p').text(newContent);
                commentEl.find('.comment-meta').append('<span class="edited-badge">(edited)</span>');
                M.toast({ html: 'Comment updated!', classes: 'success-toast' });
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            M.toast({ html: 'Failed to update comment', classes: 'error-toast' });
        }
    }

    // Handle delete comment
    async function handleDeleteComment(e) {
        e.preventDefault();

        const commentId = $(this).data('comment-id');
        const commentEl = $(this).closest('.comment, .comment-reply');

        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const response = await window.apiService.deleteComment(commentId);

            if (response.success) {
                commentEl.slideUp(300, function () {
                    $(this).remove();
                    M.toast({ html: 'Comment deleted!', classes: 'success-toast' });
                });
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            M.toast({ html: 'Failed to delete comment', classes: 'error-toast' });
        }
    }

    // Load story from fallback sources
    async function loadStoryFromFallback(storyId) {
        //console.log('Trying fallback sources for story:', storyId);
        
        // Try localStorage
        const localStorageStory = localStorage.getItem("currentStory");
        if (localStorageStory) {
            try {
                const parsedStory = JSON.parse(localStorageStory);
                if (parsedStory._id === storyId || parsedStory.id === storyId) {
                    currentStory = parsedStory;
                    totalPages = currentStory.pages ? currentStory.pages.length : 1;
                    //console.log('Story loaded from localStorage:', currentStory.title);
                    localStorage.removeItem("currentStory");
                    return;
                }
            } catch (e) {
                console.error('Error parsing localStorage story:', e);
            }
        }

        // Try backup stories (if available)
        if (typeof backupStories !== 'undefined') {
            const backupStory = backupStories.find(story => 
                story._id === storyId || story.id === storyId
            );
            if (backupStory) {
                currentStory = backupStory;
                totalPages = currentStory.pages ? currentStory.pages.length : 1;
                //console.log('Story loaded from backup data:', currentStory.title);
                return;
            }
        }

        console.error('Story not found in any fallback source');
    }

    // Update reading progress bar (scroll-based)
    function updateReadingProgress() {
        const winHeight = $(window).height();
        const docHeight = $(document).height();
        const scrollTop = $(window).scrollTop();
        const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
        
        $('#reading-progress').css('width', scrollPercent + '%');
    }

    // Check user authentication status
    function checkUserAuth() {
        if (AuthManager.isAuthenticated()) {
            updateCommentForm();
        }
    }

    // Update comment form based on auth status
    function updateCommentForm() {
        const isAuthenticated = AuthManager.isAuthenticated();
        $('#comment-login-prompt').toggle(!isAuthenticated);
        $('#submit-comment').prop('disabled', !isAuthenticated);
        
        if (!isAuthenticated) {
            $('#comment-text').prop('disabled', true)
                .attr('placeholder', 'Please log in to comment...');
        } else {
            $('#comment-text').prop('disabled', false)
                .attr('placeholder', 'Share your thoughts...');
        }
    }

    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Initialize the story read page
    initStoryRead();
});



