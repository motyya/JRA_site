// Enhanced Authentication functionality
class AuthManager {
    constructor() {
        this.currentUser = this.getStoredUser();
        this.init();
    }

    init() {
        console.log('AuthManager initializing...');
        
        // Check for stored user first
        this.currentUser = this.getStoredUser();
        console.log('Stored user:', this.currentUser);
        
        // Setup forms if they exist on this page
        this.setupLoginForm();
        this.setupRegistrationForm();
        
        // Update UI immediately
        this.updateUI();
        
        // Setup favorite buttons
        this.setupFavoriteButtons();
        
        // Add global logout handler
        this.addGlobalLogoutHandler();
        
        // Add storage sync for cross-page consistency
        this.setupStorageSync();
    }

    setupStorageSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser') {
                this.currentUser = e.newValue ? JSON.parse(e.newValue) : null;
                this.updateUI();
            }
        });
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });

            const username = document.getElementById('username');
            const password = document.getElementById('password');
            
            if (username) {
                username.addEventListener('input', () => {
                    this.clearError('usernameError');
                });
            }
            
            if (password) {
                password.addEventListener('input', () => {
                    this.clearError('passwordError');
                });
            }
        }
    }

    setupRegistrationForm() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });

            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            
            if (password) {
                password.addEventListener('input', () => {
                    this.clearError('passwordError');
                    this.validatePasswordMatch();
                });
            }
            
            if (confirmPassword) {
                confirmPassword.addEventListener('input', () => {
                    this.clearError('confirmPasswordError');
                    this.validatePasswordMatch();
                });
            }

            const username = document.getElementById('username');
            if (username) {
                username.addEventListener('input', () => {
                    this.clearError('usernameError');
                });
            }

            const fullName = document.getElementById('fullName');
            if (fullName) {
                fullName.addEventListener('input', () => {
                    this.clearError('nameError');
                });
            }

            const licenseNumber = document.getElementById('licenseNumber');
            if (licenseNumber) {
                licenseNumber.addEventListener('input', () => {
                    this.clearError('licenseError');
                });
            }
        }
    }

    clearError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('loginForm'));
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        if (!credentials.username || !credentials.password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                this.setCurrentUser(result.user);
                this.showNotification('Login successful! Redirecting to your profile...', 'success');
                
                // Redirect to user profile page after successful login
                setTimeout(() => {
                    window.location.href = 'user.html';
                }, 1500);
            } else {
                this.showNotification(result.message, 'error');
                this.setError('usernameError', 'Invalid credentials');
                this.setError('passwordError', 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    async handleRegistration() {
        const formData = new FormData(document.getElementById('registerForm'));
        const userData = {
            fullName: formData.get('fullName'),
            username: formData.get('username'),
            password: formData.get('password'),
            licenseNumber: formData.get('licenseNumber')
        };

        if (!this.validateRegistration(userData)) {
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                if (result.message.includes('Username already exists')) {
                    this.setError('usernameError', 'Username already taken');
                }
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
        }
    }

    validateRegistration(userData) {
        let isValid = true;

        if (!userData.fullName || userData.fullName.trim().length < 2) {
            this.setError('nameError', 'Full name is required (min 2 characters)');
            isValid = false;
        }

        if (!userData.username || userData.username.length < 3) {
            this.setError('usernameError', 'Username is required (min 3 characters)');
            isValid = false;
        }

        if (!userData.password || userData.password.length < 6) {
            this.setError('passwordError', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!userData.licenseNumber) {
            this.setError('licenseError', 'License number is required');
            isValid = false;
        }

        if (!this.validatePasswordMatch()) {
            isValid = false;
        }

        const agreeTerms = document.getElementById('agreeTerms');
        if (!agreeTerms || !agreeTerms.checked) {
            this.showNotification('You must agree to the terms and conditions', 'error');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordMatch() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const errorElement = document.getElementById('confirmPasswordError');

        if (password && confirmPassword && errorElement) {
            if (password.value !== confirmPassword.value) {
                errorElement.textContent = 'Passwords do not match';
                return false;
            } else {
                errorElement.textContent = '';
                return true;
            }
        }
        return true;
    }

    setError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log('User set:', user);
        this.updateUI();
    }

    getStoredUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
        this.showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    updateNavigationUserName() {
        if (this.currentUser) {
            const userNames = document.querySelectorAll('.user-name');
            userNames.forEach(span => {
                span.textContent = this.currentUser.name || this.currentUser.username || 'User';
            });
            
            // Update profile link
            const profileLinks = document.querySelectorAll('.user-profile-link');
            profileLinks.forEach(link => {
                link.href = 'user.html';
            });
        }
    }

    async loadExistingFavorites() {
        if (!this.currentUser) return;
        
        console.log('Loading existing favorites for user:', this.currentUser.id);
        
        try {
            // Load favorite horses
            const horseResponse = await fetch(`http://localhost:3000/api/user/favorites/horses/${this.currentUser.id}`);
            if (horseResponse.ok) {
                const favoriteHorses = await horseResponse.json();
                console.log('Found favorite horses:', favoriteHorses);
                this.markFavoriteHorses(favoriteHorses);
            } else {
                console.log('No favorite horses found or error:', horseResponse.status);
            }
            
            // Load favorite races
            const raceResponse = await fetch(`http://localhost:3000/api/user/favorites/races/${this.currentUser.id}`);
            if (raceResponse.ok) {
                const favoriteRaces = await raceResponse.json();
                console.log('Found favorite races:', favoriteRaces);
                this.markFavoriteRaces(favoriteRaces);
            }
            
            // Load favorite racecourses
            const racecourseResponse = await fetch(`http://localhost:3000/api/user/favorites/racecourses/${this.currentUser.id}`);
            if (racecourseResponse.ok) {
                const favoriteRacecourses = await racecourseResponse.json();
                console.log('Found favorite racecourses:', favoriteRacecourses);
                this.markFavoriteRacecourses(favoriteRacecourses);
            }
            
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }
    
    markFavoriteHorses(favoriteHorses) {
        console.log('Marking favorite horses on page:', favoriteHorses);
        favoriteHorses.forEach(horse => {
            const favButtons = document.querySelectorAll(`.favorite-btn[data-horse-id="${horse.id}"]`);
            console.log(`Looking for horse ${horse.id} buttons, found:`, favButtons.length);
            favButtons.forEach(button => {
                button.classList.add('favorited');
                button.innerHTML = '♥';
                console.log(`Marked horse ${horse.id} as favorited`);
            });
        });
    }
    
    markFavoriteRaces(favoriteRaces) {
        favoriteRaces.forEach(race => {
            // Use race ID instead of name
            const favButtons = document.querySelectorAll(`.favorite-btn[data-race-id="${race.id}"]`);
            favButtons.forEach(button => {
                button.classList.add('favorited');
                button.innerHTML = '♥';
            });
        });
    }
    
    markFavoriteRacecourses(favoriteRacecourses) {
        favoriteRacecourses.forEach(racecourse => {
            // Use racecourse ID instead of name
            const favButtons = document.querySelectorAll(`.favorite-btn[data-racecourse-id="${racecourse.id}"]`);
            favButtons.forEach(button => {
                button.classList.add('favorited');
                button.innerHTML = '♥';
            });
        });
    }

    updateUI() {
        const loginLinks = document.querySelectorAll('.login-link');
        const userLinks = document.querySelectorAll('.user-link');
        
        console.log('Updating UI - Current user:', this.currentUser);
        
        if (this.currentUser) {
            // User is logged in
            loginLinks.forEach(link => {
                if (link) link.style.display = 'none';
            });
            
            userLinks.forEach(link => {
                if (link) {
                    link.style.display = 'block';
                    // Update the user name
                    this.updateNavigationUserName();
                }
            });

            // Re-add logout listeners
            this.addLogoutListeners();
            
            // Add favorite buttons to current page
            setTimeout(() => {
                this.addFavoriteButtons();
                
                // LOAD EXISTING FAVORITES AFTER BUTTONS ARE ADDED
                setTimeout(() => {
                    this.loadExistingFavorites();
                }, 300);
                
            }, 500);
            
        } else {
            // User is not logged in
            loginLinks.forEach(link => {
                if (link) link.style.display = 'block';
            });
            
            userLinks.forEach(link => {
                if (link) link.style.display = 'none';
            });
            
            this.removeFavoriteButtons();
        }
    }

    addGlobalLogoutHandler() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logoutLink' || e.target.closest('#logoutLink')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    addLogoutListeners() {
        document.querySelectorAll('#logoutLink').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }

    addFavoriteButtons() {
        if (!this.currentUser) return;

        // Add to horses
        this.addFavoriteButtonsToHorses();
        // Add to races
        this.addFavoriteButtonsToRaces();
        // Add to racecourses
        this.addFavoriteButtonsToRacecourses();
    }

    addFavoriteButtonsToHorses() {
        const horseRows = document.querySelectorAll('#horses-list tr, .horses-list tr');
        horseRows.forEach(row => {
            if (!row.querySelector('.favorite-btn')) {
                const horseId = row.dataset.horseId;
                const horseName = row.querySelector('.horse-name')?.textContent.trim();
                
                if (horseId && horseName) {
                    const favBtn = document.createElement('button');
                    favBtn.className = 'favorite-btn';
                    favBtn.innerHTML = '♡';
                    favBtn.dataset.horseId = horseId;  // ADD THIS LINE
                    favBtn.dataset.horseName = horseName;
                    favBtn.title = 'Add to favorites';
                    
                    favBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleHorseFavorite(horseId, horseName, favBtn);
                    });
                    
                    const firstCell = row.querySelector('td:first-child');
                    if (firstCell) {
                        // Insert at the beginning of the cell
                        firstCell.insertBefore(favBtn, firstCell.firstChild);
                    }
                }
            }
        });
    }

    addFavoriteButtonsToRaces() {
        const raceRows = document.querySelectorAll('#races-list tr, .races-list tr');
        raceRows.forEach(row => {
            if (!row.querySelector('.favorite-btn')) {
                const raceId = row.dataset.raceId;  // Get race ID from row
                const raceName = row.querySelector('.race-name')?.textContent.trim();
                
                if (raceId && raceName) {
                    const favBtn = document.createElement('button');
                    favBtn.className = 'favorite-btn';
                    favBtn.innerHTML = '♡';
                    favBtn.dataset.raceId = raceId;  // Use actual race ID
                    favBtn.dataset.raceName = raceName;
                    favBtn.title = 'Add to favorites';
                    
                    favBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleRaceFavorite(raceId, raceName, favBtn);  // Pass actual ID
                    });
                    
                    const firstCell = row.querySelector('td:first-child');
                    if (firstCell) {
                        firstCell.insertBefore(favBtn, firstCell.firstChild);
                    }
                }
            }
        });
    }

    addFavoriteButtonsToRacecourses() {
        const racecourseRows = document.querySelectorAll('#racecourses-list tr, .racecourses-list tr');
        racecourseRows.forEach(row => {
            if (!row.querySelector('.favorite-btn')) {
                const racecourseId = row.dataset.racecourseId;  // Get racecourse ID from row
                const racecourseName = row.querySelector('.racecourse-name')?.textContent.trim();
                
                if (racecourseId && racecourseName) {
                    const favBtn = document.createElement('button');
                    favBtn.className = 'favorite-btn';
                    favBtn.innerHTML = '♡';
                    favBtn.dataset.racecourseId = racecourseId;  // Use actual racecourse ID
                    favBtn.dataset.racecourseName = racecourseName;
                    favBtn.title = 'Add to favorites';
                    
                    favBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleRacecourseFavorite(racecourseId, racecourseName, favBtn);  // Pass actual ID
                    });
                    
                    const firstCell = row.querySelector('td:first-child');
                    if (firstCell) {
                        firstCell.insertBefore(favBtn, firstCell.firstChild);
                    }
                }
            }
        });
    }

    removeFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => btn.remove());
    }

    async toggleHorseFavorite(horseId, horseName, button) {
        if (!this.currentUser) {
            this.showNotification('Please login to add favorites', 'error');
            return;
        }

        console.log('Toggling favorite for horse:', {
            horseId: horseId,
            horseName: horseName,
            userId: this.currentUser.id,
            currentUser: this.currentUser
        });

        try {
            const isCurrentlyFavorite = button.classList.contains('favorited');
            
            const endpoint = '/api/user/favorites/horses';
            const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
            
            console.log('Making API call:', {
                method: method,
                endpoint: endpoint,
                body: {
                    userId: this.currentUser.id,
                    horseId: parseInt(horseId)
                }
            });
            
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    horseId: parseInt(horseId)
                })
            });

            console.log('API response status:', response.status);
            
            const result = await response.json();
            console.log('API response data:', result);

            if (result.success) {
                if (isCurrentlyFavorite) {
                    button.classList.remove('favorited');
                    button.innerHTML = '♡';
                    this.showNotification(`${horseName} removed from favorites`, 'success');
                } else {
                    button.classList.add('favorited');
                    button.innerHTML = '♥';
                    this.showNotification(`${horseName} added to favorites!`, 'success');
                }
            } else {
                this.showNotification('Error updating favorites', 'error');
                console.error('API error:', result);
            }
        } catch (error) {
            console.error('Favorite error:', error);
            this.showNotification('Error updating favorites', 'error');
        }
    }

    async toggleRaceFavorite(raceId, raceName, button) {
        if (!this.currentUser) {
            this.showNotification('Please login to add favorites', 'error');
            return;
        }

        try {
            const isCurrentlyFavorite = button.classList.contains('favorited');
            
            const endpoint = '/api/user/favorites/races';
            const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
            
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    raceId: parseInt(raceId)  // Use actual race ID
                })
            });

            const result = await response.json();

            if (result.success) {
                if (isCurrentlyFavorite) {
                    button.classList.remove('favorited');
                    button.innerHTML = '♡';
                    this.showNotification(`${raceName} removed from favorites`, 'success');
                } else {
                    button.classList.add('favorited');
                    button.innerHTML = '♥';
                    this.showNotification(`${raceName} added to favorites!`, 'success');
                }
            } else {
                this.showNotification('Error updating favorites', 'error');
            }
        } catch (error) {
            console.error('Favorite error:', error);
            this.showNotification('Error updating favorites', 'error');
        }
    }

    async toggleRacecourseFavorite(racecourseId, racecourseName, button) {
        if (!this.currentUser) {
            this.showNotification('Please login to add favorites', 'error');
            return;
        }

        try {
            const isCurrentlyFavorite = button.classList.contains('favorited');
            
            const endpoint = '/api/user/favorites/racecourses';
            const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
            
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    racecourseId: parseInt(racecourseId)  // Use actual racecourse ID
                })
            });

            const result = await response.json();

            if (result.success) {
                if (isCurrentlyFavorite) {
                    button.classList.remove('favorited');
                    button.innerHTML = '♡';
                    this.showNotification(`${racecourseName} removed from favorites`, 'success');
                } else {
                    button.classList.add('favorited');
                    button.innerHTML = '♥';
                    this.showNotification(`${racecourseName} added to favorites!`, 'success');
                }
            } else {
                this.showNotification('Error updating favorites', 'error');
            }
        } catch (error) {
            console.error('Favorite error:', error);
            this.showNotification('Error updating favorites', 'error');
        }
    }

    generateIdFromName(name) {
        // Simple hash function to generate consistent IDs from names
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            const char = name.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    setupFavoriteButtons() {
        // Re-add favorite buttons when page changes dynamically
        setTimeout(() => {
            this.addFavoriteButtons();
            
            // Also load existing favorites
            if (this.currentUser) {
                setTimeout(() => {
                    this.loadExistingFavorites();
                }, 300);
            }
        }, 500);
    }

    showNotification(message, type) {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

        if (type === 'success') {
            notification.style.background = '#28a745';
        } else if (type === 'error') {
            notification.style.background = '#dc3545';
        } else {
            notification.style.background = '#17a2b8';
        }

        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    requireAuth(redirectUrl = '/login') {
        if (!this.isLoggedIn()) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `${redirectUrl}?redirect=${currentUrl}`;
            return false;
        }
        return true;
    }
}

// Initialize auth manager and make it globally available
const authManager = new AuthManager();
window.authManager = authManager;

// Debug logging
console.log('Auth.js loaded, current user:', authManager.getCurrentUser());

// Enhanced initialization to handle page navigation
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - initializing auth state');
    
    // Force UI update on every page load
    if (window.authManager) {
        window.authManager.updateUI();
    }
});

// Also handle back/forward navigation
window.addEventListener('popstate', function() {
    setTimeout(() => {
        if (window.authManager) {
            window.authManager.updateUI();
        }
    }, 100);
});