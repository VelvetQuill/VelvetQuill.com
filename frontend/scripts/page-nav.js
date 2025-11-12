
// Enhanced updateUserUI// Logout functionality
    $('#logout-btn, #mobile-logout-btn').on('click', function(e) {
        e.preventDefault();
        
        // Close mobile sidenav if open
        if ($(this).attr('id') === 'mobile-logout-btn') {
            $('.sidenav').sidenav('close');
        }
        
        AuthManager.logout();
    });


// function with backend integration
    function updateUserUI(user) {
        console.log("Updating UI for user:", user);
        
        if (user) {
            // User is logged in - show user menu, hide guest actions
            setElementVisibility('#guest-actions', false);
            setElementVisibility('#user-menu', true);
            setElementVisibility('#mobile-guest-actions', false);
            setElementVisibility('#mobile-user-actions', true);


            // Call this whenever avatar changes
            updateNavigationAvatar(user);
            
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
    

// Function to update navigation avatar
function updateNavigationAvatar(currentUser) {
    //const currentUser = AuthManager.getCurrentUser();
    
    if (currentUser && currentUser.profile && currentUser.profile.avatar) {
        const img_str = ` <img id="nav-avatar" 
         src="${currentUser.profile.avatar}" 
         alt="${currentUser.displayName?.charAt(0).toUpperCase()}" 
         class="user-avatar">`;

         document.getElementById('user-avatar').innerHTML = img_str;
    }else{
          const userAvatar = currentUser.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U';
            $('#user-avatar').text(userAvatar);
            $('#user-avatar-header').text(userAvatar);
    } 
}

  updateUserUI(AuthManager.getCurrentUser());


