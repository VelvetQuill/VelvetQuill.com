
/**
 * Search Page Functionality for VelvetQuill
 * Handles story search by tags and categories
 */

$(document).ready(function() {
    // Initialize Materialize components
    $('.sidenav').sidenav();
    $('select').formSelect();
    
    // State management
    const searchState = {
        tags: [],
        category: '',
        currentPage: 1,
        totalPages: 1,
        totalResults: 0,
        loading: false,
        currentResults: []
    };
    
    // DOM Elements
    const elements = {
        tagInput: $('#tag-search'),
        categorySelect: $('#category-filter'),
        searchBtn: $('#search-btn'),
        clearBtn: $('#clear-btn'),
        resultsArea: $('#results-area'),
        loadingIndicator: $('#loading-indicator'),
        noResults: $('#no-results'),
        paginationArea: $('#pagination-area'),
        paginationList: $('.pagination')
    };
    
    // Initialize the page
    async function initializePage() {
        try {
            // Load categories for dropdown
            await loadCategories();
            
            // Set up event listeners
            setupEventListeners();
            
            // Check for URL parameters
            checkUrlParameters();
            
            // Show initial message
            showInitialMessage();
            
        } catch (error) {
            console.error('Failed to initialize search page:', error);
            showError('Failed to initialize search page. Please refresh.');
        }
    }
    
    // Load categories from API
    async function loadCategories() {
        try {
            if (!window.apiService) {
                console.error('API Service not available');
                return;
            }
            
            const response = await window.apiService.getCategories();
            
            if (response.success && response.categories) {
                populateCategoryDropdown(response.categories);
            } else {
                console.error('Failed to load categories:', response.message);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to default categories if API fails
            const fallbackCategories = [
                { name: 'Romance', slug: 'romance' },
                { name: 'Erotic', slug: 'erotic' },
                { name: 'Drama', slug: 'drama' },
                { name: 'Fantasy', slug: 'fantasy' },
                { name: 'Contemporary', slug: 'contemporary' }
            ];
            populateCategoryDropdown(fallbackCategories);
        }
    }
    
    // Populate category dropdown
    function populateCategoryDropdown(categories) {
        const select = elements.categorySelect;
        
        // Clear existing options (keep "All Categories")
        select.find('option:not(:first)').remove();
        
        // Add categories
        categories.forEach(category => {
            const option = $('<option></option>')
                .val(category.name)
                .text(category.name);
            select.append(option);
        });
        
        // Re-initialize Materialize select
        select.formSelect();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Search button click
        elements.searchBtn.on('click', performSearch);
        
        // Clear button click
        elements.clearBtn.on('click', clearSearch);
        
        // Enter key in tag input
        elements.tagInput.on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                performSearch();
            }
        });
        
        // Tag input change - parse tags
        elements.tagInput.on('input', function() {
            parseTagsFromInput();
        });
        
        // Category change
        // Track category changes
        elements.categorySelect.on('change', function() {
            searchState.category = $(this).val();
            updateUrlParameters();
            trackCategorySelect(searchState.category);
        });

        
        // Click on story cards (delegated event)
        elements.resultsArea.on('click', '.read-story', function(e) {
            e.preventDefault();
            const storyId = $(this).data('story-id');
            if (storyId) {
                window.location.href = `story-read.html?id=${storyId}`;
            }
        });
    }
    
    // Parse tags from input field
    function parseTagsFromInput() {
        const input = elements.tagInput.val().trim();
        
        if (!input) {
            searchState.tags = [];
            return;
        }
        
        // Split by commas and clean up
        searchState.tags = input.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => tag.toLowerCase());
            
        updateUrlParameters();
    }
    
    // Perform search
    async function performSearch() {
        // Parse tags from input
        parseTagsFromInput();
        
        // Validate search criteria
        if (searchState.tags.length === 0 && !searchState.category) {
            M.toast({
                html: 'Please enter tags or select a category to search',
                classes: 'red'
            });
            return;
        }
        
        // Reset pagination
        searchState.currentPage = 1;
        
        // Perform the search
        await executeSearch();
    }
    
    // Execute search with current criteria
    async function executeSearch() {
        try {
            // Show loading
            setLoading(true);
            
            // Build query parameters
            const queryParams = {
                page: searchState.currentPage,
                limit: 10,
                status: 'published'
            };
            
            // Add tags to query
            if (searchState.tags.length > 0) {
                // Join tags with spaces for the search query
                queryParams.q = searchState.tags.join(' ');
            }
            
            // Add category to query
            if (searchState.category) {
                queryParams.category = searchState.category;
            }
            
            // Call API
            let response;
            if (searchState.tags.length > 0) {
                // Use search endpoint for tags
                response = await window.apiService.getStoriesBySearch(
                    searchState.tags.join(' '),
                    queryParams
                );
            } else if (searchState.category) {
                // Use stories by category endpoint
                response = await window.apiService.getStoriesByCategory(
                    searchState.category,
                    queryParams
                );
            }
            
            // Process response
            if (response && response.success) {
                searchState.currentResults = response.stories || [];
                searchState.totalResults = response.pagination?.total || 0;
                searchState.totalPages = response.pagination?.pages || 1;
                
                // SEO Updates
                updatePageSEOTitle(searchState.tags, searchState.category, searchState.totalResults);
                updateStructuredData(searchState, searchState.currentResults);
                updateResultsSummary(
                searchState.totalResults,
                searchState.currentPage,
                searchState.totalPages,
                searchState.tags,
                searchState.category);
    
    // Analytics Tracking
    trackSearchEvent(searchState, searchState.totalResults);
    
                
                // Update UI
                updateSearchResults();
                updatePagination();
                updateUrlParameters();
                
                // Show/hide no results message
                if (searchState.currentResults.length === 0) {
                    showNoResults();
                } else {
                    hideNoResults();
                }
            } else {
                throw new Error(response?.message || 'Search failed');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            showError('Failed to search stories. Please try again.');
            showNoResults();
        } finally {
            setLoading(false);
        }
    }
    
    // Update search results in UI
    function updateSearchResults() {
        const resultsArea = elements.resultsArea;
        resultsArea.empty();
        
        if (searchState.currentResults.length === 0) {
            return;
        }
        
        // Create story cards
        searchState.currentResults.forEach(story => {
            const storyCard = createStoryCard(story);
            resultsArea.append(storyCard);
        });
    }
    
    // Create a story card element
    function createStoryCard(story) {
        const template = $('#story-template').html();
        const card = $(template).clone();
        
        // Set story data
        if (story.coverImage) {
            card.find('.story-cover').attr('src', story.coverImage);
        } else {
            // Default sensual gradient background
            card.find('.card-image').css('background', 'linear-gradient(45deg, #f8bbd0, #f48fb1)');
            card.find('.story-cover').remove();
        }
        
        card.find('.story-title').text(story.title);
        card.find('.story-excerpt').text(story.excerpt || 'A captivating tale of passion and desire...');
        card.find('.category-badge').text(story.category || 'Uncategorized');
        card.find('.views').text(story.stats?.views || 0);
        card.find('.likes').text(story.stats?.likesCount || 0);
        card.find('.rating').text(story.stats?.averageRating?.toFixed(1) || '0.0');
        
        // Format date
        const date = new Date(story.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        card.find('.story-date').text(formattedDate);
        
        // Set story link
        card.find('.read-story').attr('href', `story-read.html?id=${story._id}`);
        card.find('.read-story').data('story-id', story._id);
        
        card.find('.read-story').on('click', function(e) {
            trackStoryViewEvent(story._id, story.title);
        });
        
        return card;
    }
    
    // Update pagination UI
    function updatePagination() {
        const paginationList = elements.paginationList;
        paginationList.empty();
        
        if (searchState.totalPages <= 1) {
            elements.paginationArea.hide();
            return;
        }
        
        elements.paginationArea.show();
        
        // Previous button
        const prevLi = $('<li></li>')
            .addClass('waves-effect')
            .append($('<a></a>')
                .attr('href', '#!')
                .append($('<i></i>').addClass('material-icons').text('chevron_left'))
            );
            
        if (searchState.currentPage === 1) {
            prevLi.addClass('disabled');
        } else {
            prevLi.find('a').on('click', () => goToPage(searchState.currentPage - 1));
        }
        
        paginationList.append(prevLi);
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, searchState.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(searchState.totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = $('<li></li>');
            const pageLink = $('<a></a>')
                .attr('href', '#!')
                .text(i);
                
            if (i === searchState.currentPage) {
                pageLi.addClass('active');
            } else {
                pageLink.on('click', () => goToPage(i));
            }
            
            pageLi.append(pageLink);
            paginationList.append(pageLi);
        }
        
        // Next button
        const nextLi = $('<li></li>')
            .addClass('waves-effect')
            .append($('<a></a>')
                .attr('href', '#!')
                .append($('<i></i>').addClass('material-icons').text('chevron_right'))
            );
            
        if (searchState.currentPage === searchState.totalPages) {
            nextLi.addClass('disabled');
        } else {
            nextLi.find('a').on('click', () => goToPage(searchState.currentPage + 1));
        }
        
        paginationList.append(nextLi);
    }
    
    // Go to specific page
    function goToPage(page) {
        if (page < 1 || page > searchState.totalPages || page === searchState.currentPage) {
            return;
        }
        
        searchState.currentPage = page;
        
        trackPaginationEvent(page);
        
        executeSearch();
        
        // Scroll to results
        $('html, body').animate({
            scrollTop: $('.results-container').offset().top - 100
        }, 500);
    }
    
    // Clear search
    function clearSearch() {
        searchState.tags = [];
        searchState.category = '';
        searchState.currentPage = 1;
        searchState.currentResults = [];
        
        // Clear UI
        elements.tagInput.val('');
        elements.categorySelect.val('');
        elements.categorySelect.formSelect();
        elements.resultsArea.empty();
        elements.paginationArea.hide();
        
        // Clear URL parameters
        clearUrlParameters();
        
        // Show initial message
        showInitialMessage();
        
        M.toast({
            html: 'Search cleared',
            classes: 'green'
        });
    }
    
    // Set loading state
    function setLoading(isLoading) {
        searchState.loading = isLoading;
        
        if (isLoading) {
            elements.loadingIndicator.show();
            elements.resultsArea.hide();
            elements.paginationArea.hide();
        } else {
            elements.loadingIndicator.hide();
            elements.resultsArea.show();
        }
    }
    
    // Show no results message
    function showNoResults() {
        elements.noResults.show();
        elements.paginationArea.hide();
    }
    
    // Hide no results message
    function hideNoResults() {
        elements.noResults.hide();
    }
    
    // Show initial message
    function showInitialMessage() {
        elements.resultsArea.html(`
            <div class="col s12">
                <div class="card-panel grey lighten-4 center-align">
                    <i class="material-icons large grey-text">search</i>
                    <h5>Search for Stories</h5>
                    <p class="grey-text">Enter tags or select a category to begin your search</p>
                    <div class="divider" style="margin: 2rem 0;"></div>
                    <h6>Search Tips:</h6>
                    <ul class="left-align">
                        <li>• Enter multiple tags separated by commas (e.g., <span class="chip">romance</span>, <span class="chip">passion</span>)</li>
                        <li>• Combine tags and categories for more specific results</li>
                        <li>• Try popular tags: romance, erotic, passion, sensual, love</li>
                    </ul>
                </div>
            </div>
        `);
    }
    
    // Show error message
    function showError(message) {
        M.toast({
            html: message,
            classes: 'red',
            displayLength: 4000
        });
    }
    
    // URL Parameter Handling
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Get tags from URL
        const tagsParam = urlParams.get('tags');
        if (tagsParam) {
            searchState.tags = tagsParam.split(',').map(tag => tag.trim());
            elements.tagInput.val(tagsParam);
        }
        
        // Get category from URL
        const categoryParam = urlParams.get('category');
        if (categoryParam) {
            searchState.category = categoryParam;
            elements.categorySelect.val(categoryParam);
            elements.categorySelect.formSelect();
        }
        
        // Get page from URL
        const pageParam = urlParams.get('page');
        if (pageParam) {
            const page = parseInt(pageParam);
            if (!isNaN(page) && page > 0) {
                searchState.currentPage = page;
            }
        }
        
        // Perform search if we have parameters
        if (searchState.tags.length > 0 || searchState.category) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                executeSearch();
            }, 100);
        }
    }
    
    function updateUrlParameters() {
        const urlParams = new URLSearchParams();
        
        if (searchState.tags.length > 0) {
            urlParams.set('tags', searchState.tags.join(','));
        }
        
        if (searchState.category) {
            urlParams.set('category', searchState.category);
        }
        
        if (searchState.currentPage > 1) {
            urlParams.set('page', searchState.currentPage);
        }
        
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }
    
    function clearUrlParameters() {
        window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Initialize the page
    initializePage();
});




// Add to the end of the search.js file, after the existing code

// SEO Optimization Functions

// Update page title and meta description dynamically
function updatePageSEOTitle(tags, category, resultsCount) {
    let title = 'Search Stories';
    let description = 'Discover passionate romance and erotic stories on VelvetQuill.';
    
    if (tags.length > 0 || category) {
        const tagString = tags.length > 0 ? tags.join(', ') : '';
        const categoryString = category || '';
        
        title = `Search ${categoryString}${categoryString && tagString ? ' ' : ''}${tagString} Stories | VelvetQuill`;
        
        description = `Browse our collection of ${categoryString.toLowerCase() || 'erotic'} stories ` +
                     `${tags.length > 0 ? `tagged with ${tagString}` : ''}. ` +
                     `Find passionate tales of romance, desire, and sensual adventures.`;
    }
    
    // Update meta tags
    document.title = title;
    document.querySelector('meta[name="description"]').setAttribute('content', description);
    document.querySelector('meta[property="og:title"]').setAttribute('content', title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', description);
    document.querySelector('meta[property="twitter:title"]').setAttribute('content', title);
    document.querySelector('meta[property="twitter:description"]').setAttribute('content', description);
    
    // Update canonical URL with search parameters
    const canonicalUrl = new URL('https://velvetquill.com/search.html');
    const params = new URLSearchParams();
    
    if (tags.length > 0) params.set('tags', tags.join(','));
    if (category) params.set('category', category);
    
    const queryString = params.toString();
    if (queryString) {
        canonicalUrl.search = queryString;
    }
    
    document.querySelector('link[rel="canonical"]').setAttribute('href', canonicalUrl.toString());
}

// Generate dynamic structured data for search results
function updateStructuredData(searchData, stories) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": stories.map((story, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "CreativeWork",
                "name": story.title,
                "description": story.excerpt,
                "url": `https://velvetquill.com/story-read.html?id=${story._id}`,
                "author": {
                    "@type": "Person",
                    "name": story.author?.displayName || 'Anonymous'
                },
                "datePublished": story.createdAt,
                "keywords": story.tags?.join(', ') || '',
                "genre": story.category,
                "interactionStatistic": {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/LikeAction",
                    "userInteractionCount": story.stats?.likesCount || 0
                },
                "contentRating": "R"
            }
        })),
        "numberOfItems": stories.length,
        "name": `Search Results: ${searchData.tags.join(', ')}${searchData.category ? ` in ${searchData.category}` : ''}`
    };
    
    // Update the dynamic structured data script tag
    document.getElementById('dynamic-structured-data').textContent = 
        JSON.stringify(structuredData, null, 2);
}

// Update results summary for screen readers and SEO
function updateResultsSummary(resultsCount, page, totalPages, tags, category) {
    const summaryElement = document.getElementById('results-summary');
    
    let summary = '';
    if (resultsCount === 0) {
        summary = 'No stories found.';
    } else {
        const start = ((page - 1) * 10) + 1;
        const end = Math.min(page * 10, resultsCount);
        
        summary = `Showing ${start}-${end} of ${resultsCount} stories`;
        
        if (tags.length > 0) {
            summary += ` tagged with ${tags.join(', ')}`;
        }
        
        if (category) {
            summary += ` in ${category}`;
        }
        
        if (totalPages > 1) {
            summary += ` (Page ${page} of ${totalPages})`;
        }
    }
    
    summaryElement.textContent = summary;
    summaryElement.setAttribute('aria-live', 'polite');
}

// Google Analytics Tracking Functions

function trackSearchEvent(searchData, resultsCount) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'search', {
            'search_term': searchData.tags.join(', ') || '(none)',
            'category': searchData.category || 'all',
            'results_count': resultsCount
        });
        
        // Also track as a pageview for better analytics
        gtag('event', 'page_view', {
            'page_title': `Search: ${searchData.tags.join(', ')}${searchData.category ? ` in ${searchData.category}` : ''}`,
            'page_location': window.location.href,
            'page_path': `/search.html${window.location.search}`
        });
    }
}

function trackPaginationEvent(pageNumber) {
    if (typeof trackPageView !== 'undefined') {
        trackPageView(pageNumber);
    }
}

function trackStoryViewEvent(storyId, storyTitle) {
    if (typeof trackStoryClick !== 'undefined') {
        trackStoryClick(storyId, storyTitle);
    }
}

function trackCategorySelect(category) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'select_content', {
            'content_type': 'category',
            'content_id': category || 'all'
        });
    }
}


// Add performance tracking
function trackPageLoadPerformance() {
    if (typeof gtag !== 'undefined' && 'performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        gtag('event', 'timing_complete', {
            'name': 'page_load',
            'value': pageLoadTime,
            'event_category': 'Performance'
        });
    }
}

// Call performance tracking on page load
$(window).on('load', function() {
    trackPageLoadPerformance();
});


/*
 <a href="search.html?tags=valentines" class="btn red waves-effect waves-light">
    <i class="material-icons left">favorite</i>
    <span>Valentine's Stories</span>
    <i class="material-icons right">arrow_forward</i>
</a>

<a href="search.html?tags=valentines&category=Romance&page=2">
    Valentine's Stories - Page 2
</a>

<a href="search.html?tags=valentines&category=Romance">
    Valentine's in Romance Category
</a>

<a href="search.html?tags=valentines,romance,passion,love">
    Valentine's Romance Collection
</a>
 */
