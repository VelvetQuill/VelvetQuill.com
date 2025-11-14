

// categories-list.js - FULLY REFACTORED WITH BACKEND API INTEGRATION
$(document).ready(function(){
    // Initialize Materialize components
    $('.sidenav').sidenav();
    $('.modal').modal();
    $('select').formSelect();
    $('.dropdown-trigger').dropdown();
    
    // Fallback category data in case API fails
    const fallbackCategoryData = {
        'romance': {
            name: 'Romance',
            description: 'Heartwarming stories of love, connection, and emotional journeys that capture the magic of relationships.',
            color: '#8B0000',
            stories: 1247,
            icon: 'favorite',
            slug: 'romance'
        },
        'contemporary': {
            name: 'Contemporary Romance',
            description: 'Modern love stories set in today\'s world, exploring relationships in current times and settings.',
            color: '#B22222',
            stories: 856,
            icon: 'weekend',
            slug: 'contemporary'
        },
        'historical': {
            name: 'Historical Romance',
            description: 'Love stories from bygone eras, featuring period settings, customs, and timeless romance.',
            color: '#5D0000',
            stories: 623,
            icon: 'history',
            slug: 'historical'
        },
        'fantasy': {
            name: 'Fantasy Romance',
            description: 'Magical worlds where love transcends boundaries between mythical creatures and enchanted realms.',
            color: '#C71585',
            stories: 478,
            icon: 'auto_awesome',
            slug: 'fantasy'
        },
        'lgbtq': {
            name: 'LGBTQ+ Romance',
            description: 'Diverse love stories celebrating relationships across the spectrum of gender and sexuality.',
            color: '#FF6B95',
            stories: 392,
            icon: 'diversity_3',
            slug: 'lgbtq'
        }
    };

    // Initialize the categories page
    function initCategoriesPage() {
        initializePosterWall();
        loadCategoriesFromAPI();
    }

    // Load categories from backend API
    async function loadCategoriesFromAPI() {
        try {
            console.log('📚 Fetching categories from backend...');
            
            // Show loading state
            showLoadingState();
            
            const response = await window.apiService.request('/categories');
            
            if (response.success && response.categories) {
                console.log('✅ Categories loaded successfully:', response.categories.length);
                await processCategoriesData(response.categories);
            } else {
                throw new Error('Invalid response format from categories API');
            }
            
        } catch (error) {
            console.error('❌ Failed to load categories from API:', error);
            showError('Failed to load categories. Using fallback data.', error);
            loadFallbackCategories();
        }
    }

    // Show loading state
    function showLoadingState() {
        $('#categories-container').html(`
            <div class="col s12 center-align">
                <div class="preloader-wrapper big active">
                    <div class="spinner-layer spinner-red-only">
                        <div class="circle-clipper left">
                            <div class="circle"></div>
                        </div><div class="gap-patch">
                            <div class="circle"></div>
                        </div><div class="circle-clipper right">
                            <div class="circle"></div>
                        </div>
                    </div>
                </div>
                <p class="grey-text">Loading categories...</p>
            </div>
        `);
        
        $('#popular-categories-container').html(`
            <div class="col s12 center-align">
                <div class="preloader-wrapper medium active">
                    <div class="spinner-layer spinner-pink-only">
                        <div class="circle-clipper left">
                            <div class="circle"></div>
                        </div><div class="gap-patch">
                            <div class="circle"></div>
                        </div><div class="circle-clipper right">
                            <div class="circle"></div>
                        </div>
                    </div>
                </div>
                <p class="grey-text">Loading popular categories...</p>
            </div>
        `);
    }

    // Process categories data and load story counts
    async function processCategoriesData(categories) {
        try {
            const categoriesWithStats = [];
            let totalStories = 0; 
            
            // Get story counts for each category
            for (const category of categories) {
                try {
                    console.log(`CATEGORY: ${JSON.stringify(category)}`);
                    console.log(`SLUG: ${category.slug}`);
                    // Use the category stories endpoint to get count
                    const storiesResponse = await window.apiService.getCategoryStories(category.slug);
                    console.log(`CATEGORY RESPONSE: ${JSON.stringify(storiesResponse)} `);
                    const storyCount = storiesResponse.pagination ? storiesResponse.pagination.total : 0;

                    totalStories += storyCount;
                    
                    categoriesWithStats.push({
                        ...category,
                        stories: storyCount,
                        // Ensure we have all required fields
                        name: category.name || 'Unnamed Category',
                        description: category.description || 'Explore wonderful stories in this category.',
                        color: category.color || '#C71585',
                        icon: category.icon || 'book',
                        slug: category.slug
                    });
                    
                } catch (storyError) {
                    console.warn(`Could not load stories for category ${category.name}:`, storyError);
                    categoriesWithStats.push({
                        ...category,
                        stories: 0,
                        name: category.name || 'Unnamed Category',
                        description: category.description || 'Explore wonderful stories in this category.',
                        color: category.color || '#C71585',
                        icon: category.icon || 'book',
                        slug: category.slug
                    });
                }
            }

            // Load categories into UI
            loadAllCategories(categoriesWithStats);
            loadPopularCategories(categoriesWithStats);
            updateCategoriesCount(categoriesWithStats.length, totalStories);
            
        } catch (error) {
            console.error('Error processing categories data:', error);
            throw error;
        }
    }

    // Load all categories in the main grid
    function loadAllCategories(categoriesData) {
        const container = $('#categories-container');
        container.empty();

        if (categoriesData.length === 0) {
            container.html(`
                <div class="col s12 center-align">
                    <div class="card-panel grey lighten-4">
                        <i class="material-icons large grey-text">category</i>
                        <h5>No Categories Available</h5>
                        <p class="grey-text">No story categories have been created yet.</p>
                    </div>
                </div>
            `);
            return;
        }

        categoriesData.forEach(category => {
            const categoryCard = createCategoryCard(category);
            container.append(categoryCard);
        });

        setupCategoryInteractions();
    }

    // Create individual category card
    function createCategoryCard(category) {
        return `
            <div class="col s12 m6">
                <div class="category-card-large" style="border-left: 4px solid ${category.color};">
                    <div class="category-card-overlay"></div>
                    <div class="category-card-content">
                        <h3 class="category-card-title">${category.name}</h3>
                        <p class="category-card-description">${category.description}</p>
                        <div class="category-stats">
                            <div class="category-stat">
                                <i class="material-icons">book</i>
                                <span>${category.stories.toLocaleString()} stories</span>
                            </div>
                            <div class="category-stat">
                                <i class="material-icons">star</i>
                                <span>${getAverageRating(category)} avg rating</span>
                            </div>
                        </div>
                        <a href="category-stories.html?category=${encodeURIComponent(category.slug)}" 
                           class="category-action-btn waves-effect waves-light"
                           style="background-color: ${category.color}">
                            Explore ${category.name}
                            <i class="material-icons right">arrow_forward</i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Get average rating for category (from metadata if available)
    function getAverageRating(category) {
        if (category.metadata && category.metadata.averageRating) {
            return category.metadata.averageRating.toFixed(1) + '+';
        }
        return '4.5+';
    }

    // Load popular categories (top 4 by story count)
    function loadPopularCategories(categoriesData) {
        const container = $('#popular-categories-container');
        container.empty();

        const popularCategories = [...categoriesData]
            .sort((a, b) => b.stories - a.stories)
            .slice(0, 4);

        if (popularCategories.length === 0) {
            container.html(`
                <div class="col s12 center-align">
                    <p class="grey-text">No popular categories to display.</p>
                </div>
            `);
            return;
        }

        popularCategories.forEach(category => {
            const popularCard = createPopularCategoryCard(category);
            container.append(popularCard);
        });
    }

    // Create popular category card
    function createPopularCategoryCard(category) {
        return `
            <div class="col s12 m6 l3">
                <div class="popular-category-card" 
                     style="background: linear-gradient(135deg, ${category.color} 0%, ${adjustColor(category.color, -20)} 100%);">
                    <div class="popular-category-content">
                        <i class="material-icons popular-category-icon">${category.icon}</i>
                        <h4 class="popular-category-title">${category.name}</h4>
                        <div class="popular-category-stories">${category.stories.toLocaleString()} Stories</div>
                        <a href="category-stories.html?category=${encodeURIComponent(category.slug)}" 
                           class="waves-effect waves-light btn-flat white-text" 
                           style="margin-top: 15px; border: 1px solid rgba(255,255,255,0.5);">
                            Read Now
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Fallback to hardcoded data if API fails
    function loadFallbackCategories() {
        console.log('🔄 Loading fallback categories data...');
        const fallbackCategories = Object.keys(fallbackCategoryData).map(key => ({
            ...fallbackCategoryData[key]
        }));
        
        const totalStories = fallbackCategories.reduce((sum, cat) => sum + cat.stories, 0);
        
        loadAllCategories(fallbackCategories);
        loadPopularCategories(fallbackCategories);
        updateCategoriesCount(fallbackCategories.length, totalStories);
    }

    // Show error message
    function showError(message, error) {
        M.toast({
            html: `<i class="material-icons left">error</i> ${message}`,
            classes: 'red accent-2',
            displayLength: 4000
        });
        
        console.error('Categories Error:', error);
    }

    // Utility function to adjust color brightness
    function adjustColor(color, amount) {
        try {
            let useColor = color.startsWith('#') ? color.substring(1) : color;
            let num = parseInt(useColor, 16);
            let r = (num >> 16) + amount;
            let g = ((num >> 8) & 0x00FF) + amount;
            let b = (num & 0x0000FF) + amount;
            
            r = Math.max(Math.min(255, r), 0);
            g = Math.max(Math.min(255, g), 0);
            b = Math.max(Math.min(255, b), 0);
            
            return '#' + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
        } catch (e) {
            return color; // Return original color if adjustment fails
        }
    }
    
    // Initialize poster wall
    function initializePosterWall(){
        const posterWall = document.getElementById('poster-wall');
        const posters = ["poster1.jpg", "poster2.jpg", "poster3.jpg", "poster4.jpg", "poster6.jpg", "poster7.jpg", "poster8.jpg"];
        
        if (posterWall && posters.length > 0) {
            const randomIndex = Math.floor(Math.random() * posters.length);
            const randomPoster = `/assets/Posters/${posters[randomIndex]}`;
            
            const img = document.createElement('img');
            img.src = randomPoster;
            img.alt = "Featured Poster";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";

            posterWall.innerHTML = '';
            posterWall.appendChild(img);
        }
    }

    // Update categories count in header
    function updateCategoriesCount(totalCategories, totalStories) {
        $('#categories-count').text(`${totalCategories} categories • ${totalStories.toLocaleString()} stories available`);
    }

    // Add click handlers for category cards
    function setupCategoryInteractions() {
        // Remove existing handlers to prevent duplicates
        $('.category-card-large').off('mouseenter mouseleave');
        $('.popular-category-card').off('click');
        
        // Add hover effects to category cards
        $('.category-card-large').on('mouseenter', function() {
            $(this).addClass('hover');
        }).on('mouseleave', function() {
            $(this).removeClass('hover');
        });

        // Add click animation to popular category cards
        $('.popular-category-card').on('click', function() {
            $(this).addClass('pulse');
            setTimeout(() => {
                $(this).removeClass('pulse');
            }, 600);
        });

        // Add loading state to category links
        $('.category-action-btn, .popular-category-card a').on('click', function(e) {
            const $btn = $(this);
            const originalText = $btn.html();
            
            $btn.html(`
                <div class="preloader-wrapper small active">
                    <div class="spinner-layer">
                        <div class="circle-clipper left">
                            <div class="circle"></div>
                        </div><div class="gap-patch">
                            <div class="circle"></div>
                        </div><div class="circle-clipper right">
                            <div class="circle"></div>
                        </div>
                    </div>
                </div>
                Loading...
            `);
            
            // Restore button after navigation or timeout
            setTimeout(() => {
                if ($btn.closest(':visible').length) {
                    $btn.html(originalText);
                }
            }, 2000);
        });
    }

    // Initialize the page
    initCategoriesPage();

    // Update navigation active state
    $('nav li a').removeClass('active');
    $('nav li a[href="categories-list.html"]').addClass('active');

    // Add retry functionality for API failures
    $(document).on('click', '.retry-loading', function() {
        loadCategoriesFromAPI();
    });
});




