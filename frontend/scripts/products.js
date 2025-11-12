
// Products Page JavaScript
class ProductsPage {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentFilters = {
            category: 'all',
            sort: 'featured',
            search: ''
        };
        this.wishlist = new Set();
        
        this.init();
    }

    init() {
        this.initializeComponents();
        this.loadStaticProducts();
        this.setupEventListeners();
        this.checkUrlParameters();
    }

    initializeComponents() {
        // Initialize Materialize components
        M.Modal.init(document.querySelectorAll('.modal'));
        M.FormSelect.init(document.querySelectorAll('select'));
        M.Sidenav.init(document.querySelectorAll('.sidenav'));
    }

    setupEventListeners() {
        // Filter event listeners
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sort-filter').addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.applyFilters();
        });

        document.getElementById('product-search').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // Wishlist toggle (for demo purposes)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-wishlist')) {
                e.preventDefault();
                const productId = e.target.closest('.btn-wishlist').dataset.productId;
                this.toggleWishlist(productId);
            }
        });
    }

    checkUrlParameters() {
        // Check for URL parameters for initial filtering
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        if (category && ['books', 'writing', 'merchandise', 'digital'].includes(category)) {
            this.currentFilters.category = category;
            const select = document.getElementById('category-filter');
            if (select) {
                select.value = category;
                M.FormSelect.init(select);
            }
        }
    }

    // Data Management Methods
    loadStaticProducts() {
        // Static product data - easily replaceable with API calls later
        this.products = [
            {
                id: '1',
                title: 'Romance Writers Toolkit',
                description: 'A comprehensive guide for aspiring romance writers with plot templates, character development exercises, and publishing tips.',
                category: 'writing',
                price: 29.99,
                originalPrice: 39.99,
                image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                badge: 'sale',
                featured: true
            },
            {
                id: '2',
                title: 'VelvetQuill Premium Notebook',
                description: 'Luxurious leather-bound notebook perfect for capturing your romantic stories and creative ideas.',
                category: 'merchandise',
                price: 24.99,
                image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                badge: 'new',
                featured: false
            },
            {
                id: '3',
                title: 'Best Romance Stories Collection',
                description: 'Curated collection of the most beloved romance stories from our platform, available in beautiful hardcover edition.',
                category: 'books',
                price: 34.99,
                image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                badge: 'featured',
                featured: true
            },
            {
                id: '4',
                title: 'Digital Story Templates Pack',
                description: 'Professional story templates for various romance subgenres including contemporary, historical, and fantasy romance.',
                category: 'digital',
                price: 19.99,
                originalPrice: 24.99,
                image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                badge: 'sale',
                featured: false
            },
            {
                id: '5',
                title: 'Authors Inspiration Mug',
                description: 'Beautiful ceramic mug with inspirational quotes for writers. Perfect for your creative writing sessions.',
                category: 'merchandise',
                price: 16.99,
                image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                badge: null,
                featured: false
            }
        ];

        this.filteredProducts = [...this.products];
        this.renderProducts();
        this.hideLoadingState();
    }

    // Filtering and Sorting Methods
    applyFilters() {
        let filtered = [...this.products];

        // Apply category filter
        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(product => 
                product.category === this.currentFilters.category
            );
        }

        // Apply search filter
        if (this.currentFilters.search) {
            filtered = filtered.filter(product =>
                product.title.toLowerCase().includes(this.currentFilters.search) ||
                product.description.toLowerCase().includes(this.currentFilters.search)
            );
        }

        // Apply sorting
        filtered = this.sortProducts(filtered, this.currentFilters.sort);

        this.filteredProducts = filtered;
        this.renderProducts();
    }

    sortProducts(products, sortType) {
        switch (sortType) {
            case 'price-low':
                return [...products].sort((a, b) => a.price - b.price);
            case 'price-high':
                return [...products].sort((a, b) => b.price - a.price);
            case 'name':
                return [...products].sort((a, b) => a.title.localeCompare(b.title));
            case 'featured':
            default:
                return [...products].sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return 0;
                });
        }
    }

    clearFilters() {
        this.currentFilters = {
            category: 'all',
            sort: 'featured',
            search: ''
        };

        // Reset UI elements
        document.getElementById('category-filter').value = 'all';
        document.getElementById('sort-filter').value = 'featured';
        document.getElementById('product-search').value = '';
        
        // Re-initialize selects
        M.FormSelect.init(document.getElementById('category-filter'));
        M.FormSelect.init(document.getElementById('sort-filter'));

        this.applyFilters();
    }

    // Rendering Methods
    renderProducts() {
        const container = document.getElementById('products-container');
        
        if (this.filteredProducts.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        
        container.innerHTML = this.filteredProducts.map(product => 
            this.createProductCard(product)
        ).join('');
    }

    createProductCard(product) {
        const isOnSale = product.originalPrice && product.originalPrice > product.price;
        const isInWishlist = this.wishlist.has(product.id);
        
        return `
            <div class="product-card">
                <div class="product-image" style="background-image: url('${product.image}')">
                    ${product.badge ? `<div class="product-badge ${product.badge}">${this.getBadgeText(product.badge)}</div>` : ''}
                </div>
                <div class="product-content">
                    <div class="product-category">${this.getCategoryLabel(product.category)}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-meta">
                        <div class="product-price">
                            ${isOnSale ? `<span class="original">$${product.originalPrice}</span>` : ''}
                            $${product.price}
                        </div>
                        <div class="product-actions">
                            <button class="btn-wishlist ${isInWishlist ? 'active' : ''}" data-product-id="${product.id}">
                                <i class="material-icons">${isInWishlist ? 'favorite' : 'favorite_border'}</i>
                            </button>
                            <button class="btn-product waves-effect waves-light">
                                <i class="material-icons left">shopping_cart</i>Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility Methods
    getCategoryLabel(category) {
        const labels = {
            'books': 'Books & Collections',
            'writing': 'Writing Tools',
            'merchandise': 'Merchandise',
            'digital': 'Digital Products'
        };
        return labels[category] || category;
    }

    getBadgeText(badge) {
        const badgeTexts = {
            'featured': 'Featured',
            'new': 'New',
            'sale': 'Sale'
        };
        return badgeTexts[badge] || badge;
    }

    toggleWishlist(productId) {
        if (this.wishlist.has(productId)) {
            this.wishlist.delete(productId);
        } else {
            this.wishlist.add(productId);
        }
        
        // Update the specific product card
        const wishlistBtn = document.querySelector(`.btn-wishlist[data-product-id="${productId}"]`);
        if (wishlistBtn) {
            const icon = wishlistBtn.querySelector('i');
            if (this.wishlist.has(productId)) {
                wishlistBtn.classList.add('active');
                icon.textContent = 'favorite';
                M.toast({html: 'Added to wishlist!'});
            } else {
                wishlistBtn.classList.remove('active');
                icon.textContent = 'favorite_border';
                M.toast({html: 'Removed from wishlist'});
            }
        }
    }

    // State Management Methods
    hideLoadingState() {
        document.getElementById('loading-state').style.display = 'none';
    }

    showEmptyState() {
        document.getElementById('products-container').innerHTML = '';
        document.getElementById('empty-state').style.display = 'block';
    }

    hideEmptyState() {
        document.getElementById('empty-state').style.display = 'none';
    }

    // Future API Integration Methods (Placeholders)
    async loadProductsFromAPI() {
        // Placeholder for future API integration
        try {
            // const response = await apiService.getProducts();
            // this.products = response.data;
            // this.applyFilters();
        } catch (error) {
            console.error('Error loading products from API:', error);
            // Fallback to static data or show error
        }
    }

    async addToCart(productId) {
        // Placeholder for future cart integration
        try {
            // await apiService.addToCart(productId);
            M.toast({html: 'Product added to cart!'});
        } catch (error) {
            console.error('Error adding to cart:', error);
            M.toast({html: 'Failed to add product to cart'});
        }
    }
}

// Initialize the products page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.productsPage = new ProductsPage();
});
