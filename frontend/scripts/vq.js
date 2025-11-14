// vq.js - Refactored with proper backup stories integration
$(document).ready(function(){
    // Initialize Materialize components
    $('.sidenav').sidenav();
    $('.modal').modal();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();
    
    // Initialize slick carousel
    $('.featured-carousel').slick({
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: 3,
        slidesToScroll: 1,
        adaptiveHeight: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    infinite: true,
                    dots: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });
    
    var storiesRepo = [];

    // Load featured stories from backend with backup support
    async function loadFeaturedStories() {
        try {
            console.log('Loading featured stories from backend...');
            const response = await window.apiService.getStories({ 
                status: 'published',
                limit: 6,
                sortBy: 'stats.views',
                sortOrder: 'desc'
            });
            
            if (response.success && response.stories && response.stories.length > 0) {
                console.log('Backend stories loaded successfully:', response.stories.length);
                setRepo(response.stories);
                displayFeaturedStories(response.stories);
            } else {
                console.log('No stories from backend, using backup stories');
                setRepo(backupStories);
                loadBackupFeaturedStories();
            }
        } catch (error) {
            console.error('Error loading featured stories from backend:', error);
            console.log('Falling back to backup stories');
            setRepo(backupStories);
            loadBackupFeaturedStories();
        }
    }
    
    function setRepo(stories=[]){
        storiesRepo = stories;
        if(storiesRepo.length > 0){
            console.log(`STORIES REPO SET! SIZE: ${storiesRepo.length}\n`);
        }
    }
    
    // Load featured stories from backup data
    function loadBackupFeaturedStories() {
        try {
            console.log('Loading backup featured stories...');
            
            // Check if backupStories exists and has data
            if (typeof backupStories !== 'undefined' && backupStories && backupStories.length > 0) {
                console.log('Backup stories found:', backupStories.length);
                displayFeaturedStories(backupStories);
            } else {
                console.error('Backup stories not available');
                displayNoStoriesMessage();
            }
        } catch (error) {
            console.error('Error loading backup stories:', error);
            displayNoStoriesMessage();
        }
    }
    
    // Display "no stories" message
    function displayNoStoriesMessage() {
        const carousel = $('.featured-carousel');
        carousel.html(`
            <div class="col s12 center-align">
                <div class="card-panel teal lighten-2 white-text">
                    <i class="material-icons large">book</i>
                    <h5>No Featured Stories Available</h5>
                    <p>Check back later for new romantic stories!</p>
                </div>
            </div>
        `);
    }
    
    // Display featured stories in carousel - REFACTORED
    function displayFeaturedStories(stories) {
        const carousel = $('.featured-carousel');
        carousel.empty();
        
        //console.log('Displaying stories:', stories);
        
        // Filter stories to only show featured ones
        const featuredStories = stories.filter(story => {
            // Check if story has isFeatured property and it's true
            const isFeatured = story.isFeatured === true;
            //console.log(`Story: ${story.title}, isFeatured: ${story.isFeatured}, Included: ${isFeatured}`);
            return isFeatured;
        });
        
        //console.log('Featured stories after filtering:', featuredStories.length);
        
        if (featuredStories.length === 0) {
            //console.log('No featured stories found, showing all stories');
            // If no featured stories, show first 3 published stories
            const publishedStories = stories.filter(story => story.status === 'published').slice(0, 3);
            if (publishedStories.length > 0) {
                featuredStories.push(...publishedStories);
            } else {
                displayNoStoriesMessage();
                return;
            }
        }
        
        // Create slides for each featured story
        featuredStories.forEach(story => {
            const slide = createFeaturedStorySlide(story);
            carousel.append(slide);
        });
        
        // Reinitialize slick carousel with the new content
        reinitializeCarousel(featuredStories.length);
        
        console.log('Featured stories carousel updated successfully');
    }
    
    // Create individual featured story slide
    function createFeaturedStorySlide(story) {
        // Get author name safely
        const authorName = getAuthorName(story);
        
        console.log(`STORY EXCERPT: ${story.excerpt}`);
        // Get excerpt or create from content
        const excerpt = story.excerpt || (story.content ? story.content.substring(0, 100) + '...' : 'No description available');
        
        // Get rating safely
        const rating = story.stats && story.stats.rating ? story.stats.rating.toFixed(1) : '0.0';
        
        // Get cover image or use random
        const coverImage = randomCardImage();
        
        return `
            <div class="w3-container carousel-slide" style="padding:0%;margin:0%;">
                <div class="w3-container w3-card-4 card featured-story-card w3-margin" style="padding: 0%;">
                    <div class="card-image story-card-image" style="background-image: url('${coverImage}')">
                        ${story.isFeatured ? '<div class="featured-badge">Featured</div>' : ''}
                    </div>
                    <div class="card-content">
                        <span class="card-title">${escapeHtml(story.title)}</span>
                        <span class="category-chip">${story.category || 'Romance'}</span>
                        <p class="truncate">${escapeHtml(excerpt)}</p>
                        <div class="story-meta">
                            <span>By: ${escapeHtml(authorName)}</span>
                            <span class="right">${rating} <i class="material-icons rating">star</i></span>
                        </div>
                    </div>
                    <div class="card-action">
                        <a href="#story" data-id="${story._id || story.id}" class="read-featured-story">
                            Read Now
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Reinitialize carousel with new settings
    function reinitializeCarousel(storyCount) {
        const carousel = $('.featured-carousel');
        
        // Destroy existing slick instance
        if (carousel.hasClass('slick-initialized')) {
            carousel.slick('unslick');
        }
        
        // Calculate slides to show
        const slidesToShow = Math.min(3, storyCount);
        
        if (storyCount > 0) {
            carousel.slick({
                dots: true,
                infinite: storyCount > 1,
                speed: 300,
                slidesToShow: slidesToShow,
                slidesToScroll: 1,
                adaptiveHeight: true,
                responsive: [
                    {
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: Math.min(2, storyCount),
                            slidesToScroll: 1,
                            infinite: storyCount > 2
                        }
                    },
                    {
                        breakpoint: 600,
                        settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1
                        }
                    }
                ]
            });
        }
    }
    
    // Helper function to get author name safely
    function getAuthorName(story) {
        if (!story.author) return 'Unknown Author';
        
        if (typeof story.author === 'object') {
            return story.author.displayName || story.author.username || 'Unknown Author';
        }
        
        return story.author || 'Unknown Author';
    }
    
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Random card image function - FIXED syntax
    function randomCardImage() {
        const images = [
            'assets/VQ1.jpg',
            'assets/VQ2.jpg',
            'assets/VQ3.jpg'
        ];
        return images[Math.floor(Math.random() * images.length)];
    }
    
    // Load recent stories from backend
    async function loadRecentStories() {
        try {
            const response = await window.apiService.getStories({ 
                status: 'published',
                limit: 8,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });
            
            if (response.success) {
                displayRecentStories(response.stories);
            } else {
                // Fallback to backup stories for recent section
                displayRecentStories(backupStories || []);
            }
        } catch (error) {
            console.error('Error loading recent stories:', error);
            displayRecentStories(backupStories || []);
        }
    }
    
    // Display recent stories
    function displayRecentStories(stories) {
        const container = $('#stories-container');
        if (!container.length) {
            console.log('Recent stories container not found');
            return;
        }
        
        container.empty();
        
        if (!stories || stories.length === 0) {
            container.html('<p class="center-align">No stories available yet.</p>');
            return;
        }
        
        // Only show published stories
        const publishedStories = stories.filter(story => story.status === 'published').slice(0, 8);
        
        if (publishedStories.length === 0) {
            container.html('<p class="center-align">No published stories available.</p>');
            return;
        }
        
        publishedStories.forEach(story => {
            const storyCard = createStoryCard(story);
            container.append(storyCard);
        });
        
    }
    
    // Create story card HTML
    function createStoryCard(story) {
        const excerpt = story.excerpt || (story.content ? story.content.substring(0, 150) + '...' : 'No description available');
        const rating = story.stats && story.stats.rating ? story.stats.rating.toFixed(1) : '0.0';
        const authorName = getAuthorName(story);
        
        return `
            <div class="col s12 m6 l3">
                <div class="card story-card hoverable">
                    <div class="card-content">
                        <span class="card-title">${escapeHtml(story.title)}</span>
                        <span class="category-chip">${story.category || 'Romance'}</span>
                        <p class="truncate">${escapeHtml(excerpt)}</p>
                        <div class="story-meta">
                            <span>By: ${escapeHtml(authorName)}</span>
                            <span class="right">${rating} <i class="material-icons rating">star</i></span>
                        </div>
                    </div>
                    <div class="card-action">
                        <a href="#story" class="read-story" data-id="${story._id || story.id}">
                            Read Now
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    // In vq.js - REFACTORED setupReadEventHandler
function setupReadEventHandler() {
    // Story detail navigation
    $(document).on('click', '.read-story, .read-featured-story', async function(e) {
        e.preventDefault();
        const storyId = $(this).data('id');
        console.log(`STORY CLICKED ID: ${storyId}`);
        
        if (!storyId) {
            console.error('No story ID found');
            return;
        }

        try {
            // Try to get story from backend first
            console.log(`Fetching story ${storyId} from backend...`);
            const response = await window.apiService.getStory(storyId);
            
            let storyObj = null;
            
            if (response.success && response.story) {
                storyObj = response.story;
                console.log(`Story loaded from backend: ${storyObj.title}`);
            } else {
                // Fallback to local stories repo
                storyObj = storiesRepo.find(story => 
                    story._id === storyId || story.id === storyId
                );
                
                if (storyObj) {
                    console.log(`Story found in local repo: ${storyObj.title}`);
                } else {
                    console.error(`Story with ID ${storyId} not found`);
                    M.toast({html: 'Story not found'});
                    return;
                }
            }
            
            // Store in localStorage for story-read page
            localStorage.setItem("currentStory", JSON.stringify(storyObj));
            console.log(`Story stored in localStorage: ${storyObj.title}`);
            
            // Navigate to story read page
            window.location.href = `story-read.html?id=${storyId}`;
            
        } catch (error) {
            console.error('Error loading story:', error);
            
            // Final fallback to local repo
            const storyObj = storiesRepo.find(story => 
                story._id === storyId || story.id === storyId
            );
            
            if (storyObj) {
                localStorage.setItem("currentStory", JSON.stringify(storyObj));
                window.location.href = `story-read.html?id=${storyId}`;
            } else {
                M.toast({html: 'Error loading story. Please try again.'});
            }
        }
    });
    
    console.log("ALL READ STORY BUTTONS PREPPED !");   
}

   
    // Story detail navigation
    $(document).on('click', '.read-story, .read-featured-story', function(e) {
        e.preventDefault();
        const storyId = $(this).data('id');
        window.location.href = `story-read.html?id=${storyId}`;
    });

    // Logout functionality
    $('#logout-btn, #mobile-logout-btn').on('click', function(e) {
        e.preventDefault();
        
        // Close mobile sidenav if open
        if ($(this).attr('id') === 'mobile-logout-btn') {
            $('.sidenav').sidenav('close');
        }
        
        AuthManager.logout();
    });

    // Initialize page
    function initializePage() {
        // Check authentication status
        checkAuthStatus();
        
        // Load content
        loadFeaturedStories();
        loadRecentStories();
        
        // Update UI based on auth status
        updateUserUI(AuthManager.getCurrentUser());
        
        setupReadEventHandler();
    }
    
    // Check authentication status
    function checkAuthStatus() {
        const currentUser = AuthManager.getCurrentUser();
        if (currentUser) {
            console.log('User authenticated:', currentUser.username);
        } else {
            console.log('User not authenticated');
        }
    }
    
    // Enhanced updateUserUI function with backend integration
    function updateUserUI(user) {
        console.log("Updating UI for user:", user);
        
        if (user) {
            // User is logged in - show user menu, hide guest actions
            setElementVisibility('#guest-actions', false);
            setElementVisibility('#user-menu', true);
            setElementVisibility('#mobile-guest-actions', false);
            setElementVisibility('#mobile-user-actions', true);
            
            // Update user avatar
            const userAvatar = user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U';
            $('#user-avatar').text(userAvatar);
            $('#user-avatar-header').text(userAvatar);
            
            // Handle author-specific UI
            if(user.isAdmin || (user.role === 'admin' || user.role === 'overallAdmin')){
                setElementVisibility('#mobile-admin-actions', true);
                setElementVisibility('#mobile-author-actions', true);
                setElementVisibility('#mobile-user-actions', false);
                setElementVisibility('#desktop-author-actions', true);
                setElementVisibility('#desktop-admin-actions', true);
                setElementVisibility('#mobile-author-register-btn', false);
                
                $('#user-avatar-link').attr('href', './admin-dashboard.html');
            }
            else if (user.isAuthor || user.role === 'author') {
                console.log("User Is Author!");
                setElementVisibility('#mobile-author-actions', true);
                setElementVisibility('#mobile-user-actions', false);
                setElementVisibility('#desktop-author-actions', true);
                setElementVisibility('#mobile-author-register-btn', false);
                
                $('#user-avatar-link').attr('href', './author-room.html');
            } else {
                setElementVisibility('#mobile-author-register-btn', true);
                setElementVisibility('#desktop-author-actions', false);
                setElementVisibility('#mobile-author-actions', false);
                
                $('#user-avatar-link').attr('href', './index.html');
            }
            
            setElementVisibility('#mobile-logout', true);
            
            // Update user info in dropdown
            $('#user-displayname').text(user.displayName || user.username);
            $('#user-email').text(user.email || '');
            $('#user-role').text(user.role || 'user');
            
        } else {
            // User is logged out - show guest actions, hide user menu
            setElementVisibility('#guest-actions', true);
            setElementVisibility('#user-menu', false);
            setElementVisibility('#mobile-guest-actions', true);
            setElementVisibility('#mobile-user-actions', false);
            setElementVisibility('#mobile-author-actions', false);
            setElementVisibility('#desktop-author-actions', false);
        }
        
        // Re-initialize dropdown for the newly shown elements
        setTimeout(() => {
            $('.dropdown-trigger').dropdown();
        }, 100);
        
        console.log("UI update complete");
    }

    
    // Robust element visibility function
    function setElementVisibility(selector, isVisible) {
        const element = $(selector);
        if (element.length) {
            if (isVisible) {
                element.removeClass('hidden-state');
                element.addClass('visible-state');
                element.css({
                    'display': '',
                    'visibility': 'visible',
                    'opacity': '1'
                });
            } else {
                element.addClass('hidden-state');
                element.removeClass('visible-state');
                element.css({
                    'display': 'none !important',
                    'visibility': 'hidden',
                    'opacity': '0'
                });
            }
        } else {
            console.warn('Element not found:', selector);
        }
    }


    // Initialize the page
    initializePage();
});











