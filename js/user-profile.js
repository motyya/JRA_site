class UserProfile {
    constructor() {
        this.init();
    }

    async init() {
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
                    window.location.href = '/login';
                    return;
                } else {
                    setTimeout(checkAuth, 50);
                }
            };
            checkAuth();
        });
    }

    async loadUserProfile() {
        try {
            const response = await fetch(`${window.CONFIG.API_BASE}/user/profile/${this.currentUser.id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const profile = await response.json();
            
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
            await this.loadRaceEntries();
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    async loadFavoriteHorses() {
        try {
            const response = await fetch(`${window.CONFIG.API_BASE}/user/favorites/horses/${this.currentUser.id}`);
            
            if (!response.ok) {
                const container = document.getElementById('favoriteHorses');
                if (container) {
                    container.innerHTML = '<p>No favorite horses yet. Add some from the horses page!</p>';
                }
                return;
            }
            
            const horses = await response.json();
            
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
            const response = await fetch(`${window.CONFIG.API_BASE}/user/favorites/races/${this.currentUser.id}`);
            
            if (!response.ok) {
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
            const response = await fetch(`${window.CONFIG.API_BASE}/user/favorites/racecourses/${this.currentUser.id}`);
            
            if (!response.ok) {
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

    async loadRaceEntries() {
        try {
            const response = await fetch(`${window.CONFIG.API_BASE}/user/entries/${this.currentUser.id}`);
            
            if (!response.ok) {
                const container = document.getElementById('myRaceEntries');
                if (container) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <h3>No Race Entries Yet</h3>
                            <p>You haven't submitted any race entries.</p>
                            <a href="race-entry.html" class="btn-primary" style="margin-top: 1rem;">Submit Your First Entry</a>
                        </div>
                    `;
                }
                return;
            }
            
            const data = await response.json();
            
            const container = document.getElementById('myRaceEntries');
            if (container) {
                if (!data.entries || data.entries.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <h3>No Race Entries Yet</h3>
                            <p>You haven't submitted any race entries.</p>
                            <a href="race-entry.html" class="btn-primary" style="margin-top: 1rem;">Submit Your First Entry</a>
                        </div>
                    `;
                    return;
                }

                const entries = data.entries;
                const pendingCount = entries.filter(e => e.status === 'pending').length;
                const approvedCount = entries.filter(e => e.status === 'approved').length;
                const rejectedCount = entries.filter(e => e.status === 'rejected').length;

                container.innerHTML = `
                    <div class="entries-stats">
                        <div class="stat-card">
                            <h4>Total Entries</h4>
                            <p class="stat-number">${entries.length}</p>
                        </div>
                        <div class="stat-card">
                            <h4>Pending</h4>
                            <p class="stat-number pending">${pendingCount}</p>
                        </div>
                        <div class="stat-card">
                            <h4>Approved</h4>
                            <p class="stat-number approved">${approvedCount}</p>
                        </div>
                        ${rejectedCount > 0 ? `
                        <div class="stat-card">
                            <h4>Rejected</h4>
                            <p class="stat-number rejected">${rejectedCount}</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="entries-table-container">
                        <table class="entries-table">
                            <thead>
                                <tr>
                                    <th>Race</th>
                                    <th>Horse</th>
                                    <th>Racecourse</th>
                                    <th>Saddlecloth</th>
                                    <th>Barrier</th>
                                    <th>Weight</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${entries.map(entry => {
                                    const submittedDate = entry.created_at 
                                        ? new Date(entry.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : 'Unknown';
                                    
                                    return `
                                    <tr>
                                        <td><strong>${entry.race_name || 'Unknown Race'}</strong></td>
                                        <td>${entry.horse_name || 'Unknown Horse'}</td>
                                        <td>${entry.racecourse_name || '-'}</td>
                                        <td>${entry.saddlecloth || '-'}</td>
                                        <td>${entry.barrier || '-'}</td>
                                        <td>${entry.declared_weight ? entry.declared_weight + 'kg' : '-'}</td>
                                        <td><span class="status-badge ${entry.status || 'pending'}">${entry.status || 'pending'}</span></td>
                                        <td>${submittedDate}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading race entries:', error);
            const container = document.getElementById('myRaceEntries');
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <h3>Error Loading Race Entries</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem;">Try Again</button>
                    </div>
                `;
            }
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                button.classList.add('active');
                const targetPane = document.getElementById(`${tabName}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });

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

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        new UserProfile();
    }, window.CONFIG.TIMEOUTS.PAGE_LOAD);
});