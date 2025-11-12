


// author-room.js - FULLY API INTEGRATED VERSION
$(document).ready(function(){
    console.log("AUTHOR ROOM INITIALIZING");
    
    // Check if we're on the author-room page
    if (!window.location.pathname.includes('author-room')) {
        console.log("NOT on author-room page, current page:", window.location.pathname);
        return;
    }

    // Initialize Materialize components
    $('.sidenav').sidenav();
    $('.modal').modal();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();

    // Get author ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let authorId = urlParams.get('id');
    const currentUser = AuthManager.getCurrentUser();

    // If no author ID specified and user is author, show their own room
    if (!authorId && currentUser && AuthManager.isAuthor()) {
        authorId = currentUser.username;
    }

    if (!authorId) {
        console.error("No author ID specified");
        M.toast({html: 'Author not found. Redirecting...'});
        setTimeout(() => window.location.href = '/index.html', 2000);
        return;
    }

    console.log("AUTHOR ID:", authorId);
    
    // Current author data
    let currentAuthor = null;
    let authorStories = [];
    let isFollowing = false; 
    
    // Pagination settings
    let currentPage = 1;
    const storiesPerPage = 6;

    // Initialize author room
    async function initAuthorRoom() {
        try {
            // Verify session first
            const isValid = await AuthManager.verifySession();
            if (!isValid) {
                await AuthManager.logout();
                return;
            }
            
            await loadAuthorData();
            await loadFollowStatus();
            await loadAuthorStories();
            setupEventListeners();
            
            console.log("Author room initialized successfully");
        } catch (error) {
            console.error("Failed to initialize author room:", error);
            M.toast({html: 'Failed to load author room. Please try again.'});
        }
    }


    // Function to update navigation avatar
    function setAuthorAvatar() { 
        //const currentUser = AuthManager.getCurrentUser();

        if (currentUser && currentUser.profile && currentUser.profile.avatar) {
            const img_str = ` <img id="nav-avatar" 
            src="${currentUser.profile.avatar}" 
            alt="${currentUser.displayName?.charAt(0).toUpperCase()}" 
            class="user-avatar circlr responsive-img">`;

            document.getElementById('author-avatar').innerHTML = img_str;
        } 
    }

    // Load author data from API
    async function loadAuthorData() {
        $('#loading-indicator').show();
        
        console.log(`Author Name: ${authorId}`);

        try {
            const authorData = await apiService.getUserProfile(authorId);
            
            if (!authorData.success) {
                throw new Error(authorData.message || 'Failed to load author profile');
            }

            console.log(`Author Data: ${JSON.stringify(authorData)}`);

            currentAuthor = {
                id: authorData.user.id || authorData.user._id,
                username: authorData.user.username,
                displayName: authorData.user.displayName || authorData.user.username,
                bio: authorData.user.profile?.bio || 'No bio available',
                avatar: authorData.user.profile?.avatar || 'assets/default-avatar.jpg',
                isAuthor: authorData.user.isAuthor,
                stats: {
                    stories: authorData.user.stats?.storiesCount || 0,
                    followers: authorData.user.stats?.followers || 0,
                    totalViews: authorData.user.stats?.totalViews || 0,
                    avgRating: authorData.user.stats?.avgRating || 0
                }
            };

            updateAuthorUI();
            
        } catch (error) {
            console.error('Error loading author data from API:', error);
            M.toast({html: `Failed to load author profile: ${error.message}`});
            // Redirect to home page after error
            setTimeout(() => window.location.href = '/index.html', 3000);
        } finally {
            $('#loading-indicator').hide();
        }
    }

    // Load follow status for current user
    async function loadFollowStatus() {
        if (!AuthManager.isAuthenticated() || !currentAuthor) return;
        
        try {
            const response = await apiService.getFollowStatus(currentAuthor.id);
            if (response.success) {
                isFollowing = response.isFollowing;
                updateFollowButton();
            }
        } catch (error) {
            console.error('Error loading follow status:', error);
            // Don't show error toast for follow status as it's non-critical
        }
    }

    // Update author UI with current data
    function updateAuthorUI() {
        if (!currentAuthor) return;


        $('#author-display-name').text(currentAuthor.displayName);
        $('#author-username').text(`@${currentAuthor.username}`);
        $('#author-bio').text(currentAuthor.bio);
        $('#author-avatar-img').attr('src', currentAuthor.avatar);
        $('#author-name-stories').text(currentAuthor.displayName);
        
        // Update stats
        $('#stories-count').text(currentAuthor.stats.stories);
        $('#followers-count').text(currentAuthor.stats.followers.toLocaleString());
        $('#total-views').text(currentAuthor.stats.totalViews.toLocaleString());
        $('#avg-rating').text(currentAuthor.stats.avgRating.toFixed(1));
    }

    // Load author stories from API
    async function loadAuthorStories() {
        $('#loading-indicator').show();
        $('#no-stories-message').hide();
        
        try {
            // Use the stories API with author filter
            const response = await apiService.getStories({
                author: currentAuthor.id,
                status: 'published',
                page: currentPage,
                limit: storiesPerPage
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to load stories');
            }

            authorStories = response.stories || [];
            
            // Transform API response to match expected format
            authorStories = authorStories.map(story => ({
                id: story._id,
                title: story.title,
                excerpt: story.excerpt,
                category: story.category,
                coverImage: story.coverImage,
                content: story.content || story.excerpt || 'No content available',
                rating: story.stats?.averageRating || 0,
                date: story.createdAt ? new Date(story.createdAt).toISOString().split('T')[0] : '2024-01-01',
                stats: story.stats || {},
                author: story.author
            }));
            

            // Display stories or no stories message
            if (authorStories.length > 0) {
                displayStories();
                setupPagination(response?.pagination);
            } else {
                $('#no-stories-message').show();
                $('#author-stories-grid').empty();
                $('#author-pagination').empty();
            }

        } catch (error) {
            console.error('Error loading stories from API:', error);
            authorStories = [];
            M.toast({html: `Failed to load stories: ${error.message}`});
        } finally {
            $('#loading-indicator').hide();
        }
       
    }

    // Display stories in the grid
    function displayStories() {
        const grid = $('#author-stories-grid');
        grid.empty();
        
        authorStories.forEach(story => {
            const storyCard = createStoryCard(story);
            grid.append(storyCard);
        });
        
        // Reinitialize Materialize components for new elements
        $('.modal').modal();
    }

    // Create HTML for a story card
    function createStoryCard(story) {
        const coverImage = story.coverImage || `assets/VQ${(story.id.charCodeAt(0) % 3) + 1}.jpg`;
        const rating = story.rating || story.stats?.averageRating || 0;
        
        return `
            <div class="col s12 m6 l4">
                <div class="card story-card hoverable">
                    <div class="card-image story-card-image" style="background-image: url('${coverImage}')">
                        <span class="card-title">${story.title}</span>
                    </div>
                    <div class="card-content">
                        <span class="category-chip">${story.category?.charAt(0).toUpperCase() + story.category?.slice(1) || 'Uncategorized'}</span>
                        <p class="truncate">${story.excerpt || 'No description available'}</p>
                        <div class="story-meta">
                            <span>${new Date(story.date).toLocaleDateString()}</span>
                            <span class="right">${rating.toFixed(1)} <i class="material-icons rating">star</i></span>
                        </div>
                        <div class="story-stats">
                            <small>👁️ ${story.stats?.views || 0} • ❤️ ${story.stats?.likesCount || 0}</small>
                        </div>
                    </div>
                    <div class="card-action">
                        <a href="story-read.html?id=${story.id}" class="read-story" data-id="${story.id}">Read Now</a>
                        <a href="#" class="save-story" data-id="${story.id}"><i class="material-icons">bookmark_border</i></a>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup pagination based on API response
    function setupPagination(paginationData) {
        const pagination = $('#author-pagination');
        pagination.empty();
        
        if (!paginationData || paginationData.pages <= 1) return;
        
        let paginationHTML = '<ul class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<li class="waves-effect"><a href="#!" data-page="${currentPage - 1}"><i class="material-icons">chevron_left</i></a></li>`;
        } else {
            paginationHTML += '<li class="disabled"><a href="#!"><i class="material-icons">chevron_left</i></a></li>';
        }
        
        // Page numbers
        for (let i = 1; i <= paginationData.pages; i++) {
            if (i === currentPage) {
                paginationHTML += `<li class="active"><a href="#!">${i}</a></li>`;
            } else {
                paginationHTML += `<li class="waves-effect"><a href="#!" data-page="${i}">${i}</a></li>`;
            }
        }
        
        // Next button
        if (currentPage < paginationData.pages) {
            paginationHTML += `<li class="waves-effect"><a href="#!" data-page="${currentPage + 1}"><i class="material-icons">chevron_right</i></a></li>`;
        } else {
            paginationHTML += '<li class="disabled"><a href="#!"><i class="material-icons">chevron_right</i></a></li>';
        }
        
        paginationHTML += '</ul>';
        pagination.html(paginationHTML);
    }

    // Update follow button state
    function updateFollowButton() {
        if (!currentAuthor || !AuthManager.isAuthenticated()) {
            $('#follow-btn').hide();
            $('#unfollow-btn').hide();
            return;
        }

        // Don't show follow buttons for own profile
        if (currentUser && currentUser.username === currentAuthor.username) {
            $('#follow-btn').hide();
            $('#unfollow-btn').hide();
            return;
        }

        if (isFollowing) {
            $('#follow-btn').hide();
            $('#unfollow-btn').show();
        } else {
            $('#follow-btn').show();
            $('#unfollow-btn').hide();
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Follow button
        $('#follow-btn').on('click', async function() {
            if (!AuthManager.isAuthenticated()) {
                M.toast({html: 'Please login to follow authors'});
                window.location.href = '/signin.html';
                return;
            }

            try {
                const response = await apiService.toggleFollow(currentAuthor.id);
                if (response.success) {
                    isFollowing = true;
                    currentAuthor.stats.followers++;
                    updateFollowButton();
                    $('#followers-count').text(currentAuthor.stats.followers.toLocaleString());
                    M.toast({html: `You're now following ${currentAuthor.displayName}`});
                }
            } catch (error) {
                console.error('Follow error:', error);
                M.toast({html: `Failed to follow ${currentAuthor.displayName}: ${error.message}`});
            }
        });

        // Unfollow button
        $('#unfollow-btn').on('click', async function() {
            try {
                const response = await apiService.toggleFollow(currentAuthor.id);
                if (response.success) {
                    isFollowing = false;
                    currentAuthor.stats.followers--;
                    updateFollowButton();
                    $('#followers-count').text(currentAuthor.stats.followers.toLocaleString());
                    M.toast({html: `You've unfollowed ${currentAuthor.displayName}`});
                }
            } catch (error) {
                console.error('Unfollow error:', error);
                M.toast({html: `Failed to unfollow ${currentAuthor.displayName}: ${error.message}`});
            }
        });

        // Message button
        $('#message-btn').on('click', function() {
            M.toast({html: 'Message feature coming soon!'});
        });

        // Story sorting
        $('#stories-sort').on('change', function() {
            const sortBy = $(this).val();
            sortStories(sortBy);
            currentPage = 1;
            displayStories();
            // Note: For full API integration, we would reload from server with sort parameter
        });

        // Story search
        let searchTimeout;
        $('#stories-search').on('input', function() {
            clearTimeout(searchTimeout);
            const searchTerm = $(this).val();
            
            searchTimeout = setTimeout(() => {
                if (searchTerm.length >= 2 || searchTerm.length === 0) {
                    filterStories(searchTerm);
                }
            }, 500);
        });

        // Pagination
        $(document).on('click', '#author-pagination a[data-page]', function(e) {
            e.preventDefault();
            currentPage = parseInt($(this).data('page'));
            loadAuthorStories(); // Reload from API with new page
            // Scroll to top of stories section
            $('html, body').animate({
                scrollTop: $('#author-stories-grid').offset().top - 100
            }, 500);
        });

        // Read story (using event delegation for dynamically added elements)
        $(document).on('click', '.read-story', function(e) {
            // Link already handles navigation to story-read.html
            console.log("Reading story:", $(this).data('id'));
        });

        // Save story to reading list
        $(document).on('click', '.save-story', async function(e) {
            e.preventDefault();
            const storyId = $(this).data('id');
            
            if (!AuthManager.isAuthenticated()) {
                M.toast({html: 'Please login to save stories'});
                window.location.href = '/signin.html';
                return;
            }

            try {
                await apiService.addToReadingList(storyId);
                M.toast({html: 'Story saved to your reading list!'});
                $(this).find('i').text('bookmark'); // Change icon to filled bookmark
            } catch (error) {
                console.error('Save story error:', error);
                M.toast({html: 'Failed to save story: ' + error.message});
            }
        });
    }

    // Sort stories (client-side sorting)
    function sortStories(sortBy) {
        switch(sortBy) {
            case 'newest':
                authorStories.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                authorStories.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'popular':
                authorStories.sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0));
                break;
            case 'rating':
                authorStories.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
        }
    }

    // Filter stories by search term (client-side filtering)
    function filterStories(searchTerm) {
        if (searchTerm === '') {
            // Reset to all stories
            loadAuthorStories();
            return;
        }
        
        const filteredStories = authorStories.filter(story => 
            story.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (story.excerpt && story.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
            story.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Update display with filtered results
        const grid = $('#author-stories-grid');
        grid.empty();
        
        if (filteredStories.length === 0) {
            grid.html('<div class="col s12 center-align"><p>No stories match your search.</p></div>');
        } else {
            filteredStories.forEach(story => {
                const storyCard = createStoryCard(story);
                grid.append(storyCard);
            });
        }
        
        // Reinitialize Materialize components
        $('.modal').modal();
    }

    // Initialize the author room
    initAuthorRoom();
});



