// User Profile functionality
class UserProfile {
    constructor() {
        this.init();
    }

    async init() {
        // Wait for auth manager to be fully ready
        await this.waitForAuthManager();
        
        if (this.currentUser) {
            console.log('User profile loading for:', this.currentUser.name);
            await this.loadUserProfile();
            await this.loadFavorites();
            this.setupTabs();
        } else {
            console.log('No user found, redirecting to login');
            window.location.href = '/login';
        }
    }

    waitForAuthManager() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (window.authManager && window.authManager.getCurrentUser()) {
                    this.currentUser = window.authManager.getCurrentUser();
                    resolve();
                } else if (window.authManager && !window.authManager.getCurrentUser()) {
                    // Auth manager is ready but no user - redirect immediately
                    window.location.href = '/login';
                    return;
                } else {
                    // Auth manager not ready yet, check again
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    async loadUserProfile() {
        try {
            console.log('Loading profile for user ID:', this.currentUser.id);
            const response = await fetch(`http://localhost:3000/api/user/profile/${this.currentUser.id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const profile = await response.json();
            console.log('Profile data:', profile);
            
            const profileInfo = document.getElementById('profileInfo');
            if (profileInfo) {
                profileInfo.innerHTML = `
                    <div class="profile-details">
                        <p><strong>Name:</strong> ${profile.name}</p>
                        <p><strong>Username:</strong> ${profile.username}</p>
                        <p><strong>License Number:</strong> ${profile.license_number}</p>
                        <p><strong>Member since:</strong> ${new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            const profileInfo = document.getElementById('profileInfo');
            if (profileInfo) {
                profileInfo.innerHTML = '<p>Error loading profile data</p>';
            }
        }
    }

    async loadFavorites() {
        try {
            await this.loadFavoriteHorses();
            await this.loadFavoriteRaces();
            await this.loadFavoriteRacecourses();
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    async loadFavoriteHorses() {
        try {
            const response = await fetch(`http://localhost:3000/api/user/favorites/horses/${this.currentUser.id}`);
            
            if (!response.ok) {
                console.log('No favorite horses found or error loading');
                const container = document.getElementById('favoriteHorses');
                if (container) {
                    container.innerHTML = '<p>No favorite horses yet. Add some from the horses page!</p>';
                }
                return;
            }
            
            const horses = await response.json();
            console.log('Favorite horses:', horses);
            
            const container = document.getElementById('favoriteHorses');
            if (container) {
                if (horses.length === 0) {
                    container.innerHTML = '<p>No favorite horses yet. Add some from the horses page!</p>';
                    return;
                }

                container.innerHTML = `
                    <div class="favorites-grid">
                        ${horses.map(horse => `
                            <div class="favorite-item">
                                <h4>${horse.name}</h4>
                                <p>Birth Year: ${horse.birth_year}</p>
                                <p>Races: ${horse.total_races} | Wins: ${horse.total_wins}</p>
                                ${horse.triple_crown ? '<span class="achievement-badge">Triple Crown</span>' : ''}
                                ${horse.tiara_crown ? '<span class="achievement-badge">Tiara Crown</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading favorite horses:', error);
            const container = document.getElementById('favoriteHorses');
            if (container) {
                container.innerHTML = '<p>Error loading favorite horses</p>';
            }
        }
    }

    async loadFavoriteRaces() {
        try {
            const response = await fetch(`http://localhost:3000/api/user/favorites/races/${this.currentUser.id}`);
            
            if (!response.ok) {
                console.log('No favorite races found or error loading');
                const container = document.getElementById('favoriteRaces');
                if (container) {
                    container.innerHTML = '<p>No favorite races yet. Add some from the races page!</p>';
                }
                return;
            }
            
            const races = await response.json();
            
            const container = document.getElementById('favoriteRaces');
            if (container) {
                if (races.length === 0) {
                    container.innerHTML = '<p>No favorite races yet. Add some from the races page!</p>';
                    return;
                }

                container.innerHTML = `
                    <div class="favorites-grid">
                        ${races.map(race => `
                            <div class="favorite-item">
                                <h4>${race.name}</h4>
                                <p>Distance: ${race.distance}m</p>
                                <p>Track: ${race.track_type} | Rang: ${race.rang}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading favorite races:', error);
            const container = document.getElementById('favoriteRaces');
            if (container) {
                container.innerHTML = '<p>Error loading favorite races</p>';
            }
        }
    }

    async loadFavoriteRacecourses() {
        try {
            const response = await fetch(`http://localhost:3000/api/user/favorites/racecourses/${this.currentUser.id}`);
            
            if (!response.ok) {
                console.log('No favorite racecourses found or error loading');
                const container = document.getElementById('favoriteRacecourses');
                if (container) {
                    container.innerHTML = '<p>No favorite racecourses yet. Add some from the racecourses page!</p>';
                }
                return;
            }
            
            const racecourses = await response.json();
            
            const container = document.getElementById('favoriteRacecourses');
            if (container) {
                if (racecourses.length === 0) {
                    container.innerHTML = '<p>No favorite racecourses yet. Add some from the racecourses page!</p>';
                    return;
                }

                container.innerHTML = `
                    <div class="favorites-grid">
                        ${racecourses.map(racecourse => `
                            <div class="favorite-item">
                                <h4>${racecourse.name}</h4>
                                <p>Location: ${racecourse.location}</p>
                                <p>Track: ${racecourse.track_types}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading favorite racecourses:', error);
            const container = document.getElementById('favoriteRacecourses');
            if (container) {
                container.innerHTML = '<p>Error loading favorite racecourses</p>';
            }
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked button and corresponding pane
                button.classList.add('active');
                const targetPane = document.getElementById(`${tabName}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });

        // Set first tab as active by default if none is active
        if (!document.querySelector('.tab-button.active')) {
            const firstButton = document.querySelector('.tab-button');
            const firstPane = document.querySelector('.tab-pane');
            if (firstButton && firstPane) {
                firstButton.classList.add('active');
                firstPane.classList.add('active');
            }
        }
    }
}

// Initialize with delay to ensure auth manager is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing user profile...');
    setTimeout(() => {
        new UserProfile();
    }, 500);
});