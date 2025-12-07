// Racecourses page functionality with API and favorites
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'http://localhost:3000/api';

    // Load racecourses from API
    function loadRacecourses(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        
        fetch(`${API_BASE}/racecourses?${queryParams}`)
            .then(response => response.json())
            .then(racecourses => {
                displayRacecourses(racecourses);
                // Add favorite buttons after racecourses are loaded
                setTimeout(() => {
                    if (window.authManager) {
                        window.authManager.addFavoriteButtons();
                    }
                }, 100);
            })
            .catch(error => {
                console.error('Error loading racecourses:', error);
                // Fallback to empty state
                displayRacecourses([]);
            });
    }

    function displayRacecourses(racecourses) {
        const tbody = document.getElementById('racecourses-list');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (racecourses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        No racecourses found matching your filters.
                    </td>
                </tr>
            `;
            return;
        }

        racecourses.forEach(racecourse => {
            const row = document.createElement('tr');
            row.dataset.racecourseId = racecourse.id;  // Add racecourse ID to row
            
            row.innerHTML = `
                <td>
                    <span class="racecourse-name">${racecourse.name}</span>
                </td>
                <td>${racecourse.location}</td>
                <td>${racecourse.track_types}</td>
                <td>${racecourse.direction || '-'}</td>
                <td>${racecourse.main_distance || '-'}</td>
                <td>${racecourse.corners || '-'}</td>
            `;
            
            tbody.appendChild(row);
        });

        // AFTER RACECOURSES ARE DISPLAYED, TRIGGER FAVORITE BUTTONS
        setTimeout(() => {
            if (window.authManager) {
                window.authManager.addFavoriteButtonsToRacecourses();
                // Also load existing favorites
                if (window.authManager.currentUser) {
                    window.authManager.loadExistingFavorites();
                }
            }
        }, 100);
    }

    // Filter functionality
    function getFilters() {
        const filters = {
            search: document.getElementById('racecourse-search')?.value || '',
            track: document.getElementById('track')?.value || '',
            direction: document.getElementById('direction')?.value || '',
            corners: document.getElementById('corners')?.value || ''
        };

        // Add distance range filters
        const distanceFrom = document.getElementById('distance-from')?.value;
        const distanceTo = document.getElementById('distance-to')?.value;
        
        if (distanceFrom) filters.distance_from = distanceFrom;
        if (distanceTo) filters.distance_to = distanceTo;

        return filters;
    }

    // Event listeners
    const searchInput = document.getElementById('racecourse-search');
    const filterInputs = document.querySelectorAll('.filter-group select, .filter-group input');

    if (searchInput) {
        searchInput.addEventListener('input', () => loadRacecourses(getFilters()));
    }

    filterInputs.forEach(input => {
        input.addEventListener('change', () => loadRacecourses(getFilters()));
        if (input.type === 'number') {
            input.addEventListener('input', () => loadRacecourses(getFilters()));
        }
    });

    // Load initial racecourses
    loadRacecourses();
});