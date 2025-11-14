
// sponsors.js
$(document).ready(function(){
    // Initialize Materialize components
    $('.sidenav').sidenav();
    $('.modal').modal();
    $('select').formSelect();
    $('.collapsible').collapsible();
    
    // Sponsor benefits data
    const sponsorBenefits = {
        recognition: {
            website: "Permanent sponsor badge on homepage and sponsors page",
            social: "Featured in launch posts and monthly sponsor highlights",
            newsletter: "Sponsor spotlight in our monthly newsletter to 15k+ subscribers"
        },
        access: {
            platform: "Early access to new features and beta testing opportunities",
            community: "Founding member status with special recognition in our community"
        },
        marketing: {
            audience: "Direct access to our engaged audience of romance readers",
            content: "Feature in success stories and case studies on our platform"
        }
    };
    
    // Current sponsors data
    const currentSponsors = [
        { name: "Romance Reads Publishing", logo: "assets/sponsors/publisher1.png", tier: "gold" },
        { name: "Inkwell Writing Tools", logo: "assets/sponsors/inkwell.png", tier: "silver" },
        { name: "Bookish Candles Co.", logo: "assets/sponsors/candles.png", tier: "silver" },
        { name: "Literary Escape Tours", logo: "assets/sponsors/tours.png", tier: "bronze" },
        { name: "Page Turner Café", logo: "assets/sponsors/cafe.png", tier: "bronze" },
        { name: "Love Letter Stationery", logo: "assets/sponsors/stationery.png", tier: "bronze" }
    ];
    
    // Initialize the sponsors page
    function initSponsorsPage() {
        loadBenefits();
        loadSponsors();
        setupEventListeners();
    }
    
    // Load benefits into the page
    function loadBenefits() {
        $('#website-benefit').text(sponsorBenefits.recognition.website);
        $('#social-benefit').text(sponsorBenefits.recognition.social);
        $('#newsletter-benefit').text(sponsorBenefits.recognition.newsletter);
        $('#platform-benefit').text(sponsorBenefits.access.platform);
        $('#community-benefit').text(sponsorBenefits.access.community);
        $('#audience-benefit').text(sponsorBenefits.marketing.audience);
        $('#content-benefit').text(sponsorBenefits.marketing.content);
    }
    
    // Load current sponsors
    function loadSponsors() {
        const sponsorsGrid = $('#sponsors-grid');
        
        currentSponsors.forEach(sponsor => {
            const sponsorElement = `
                <div class="sponsor-logo ${sponsor.tier}-sponsor" title="${sponsor.name}">
                    <div class="sponsor-placeholder">${sponsor.name}</div>
                </div>
            `;
            sponsorsGrid.append(sponsorElement);
        });
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Tier selection buttons
        $('.bronze-btn, .silver-btn, .gold-btn').on('click', function(e) {
            e.preventDefault();
            const tier = $(this).hasClass('bronze-btn') ? 'bronze' : 
                         $(this).hasClass('silver-btn') ? 'silver' : 'gold';
            
            // Set the selected tier in the form
            $('#interest-tier').val(tier);
            $('#interest-tier').formSelect();
            
            // Scroll to contact form
            $('html, body').animate({
                scrollTop: $('#contact-form').offset().top - 100
            }, 500);
        });
        
        // Contact form submission
        $('#sponsor-contact-form').on('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: $('#contact-name').val(),
                company: $('#contact-company').val(),
                email: $('#contact-email').val(),
                phone: $('#contact-phone').val(),
                tier: $('#interest-tier').val(),
                message: $('#contact-message').val()
            };
            
            // Basic validation
            if (!formData.name || !formData.company || !formData.email || !formData.tier) {
                M.toast({html: 'Please fill in all required fields'});
                return;
            }
            
            // In a real application, you would send this data to a server
            // For now, we'll just show a success message
            M.toast({html: 'Thank you for your interest! Our team will contact you soon.'});
            
            // Reset form
            $('#sponsor-contact-form')[0].reset();
            $('#interest-tier').val('');
            $('#interest-tier').formSelect();
        });
        
        // Smooth scrolling for navigation
        $('a[href^="#"]').on('click', function(e) {
            if ($(this).attr('href') !== '#') {
                e.preventDefault();
                const target = $($(this).attr('href'));
                if (target.length) {
                    $('html, body').animate({
                        scrollTop: target.offset().top - 80
                    }, 500);
                }
            }
        });
    }
    
    // Initialize the sponsors page
    initSponsorsPage();
});


