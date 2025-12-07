// Races page functionality with API and favorites
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'http://localhost:3000/api';

    // Load races from API
    function loadRaces(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        
        fetch(`${API_BASE}/races?${queryParams}`)
            .then(response => response.json())
            .then(races => {
                displayRaces(races);
                // Add favorite buttons after races are loaded
                setTimeout(() => {
                    if (window.authManager) {
                        window.authManager.addFavoriteButtons();
                    }
                }, 100);
            })
            .catch(error => {
                console.error('Error loading races:', error);
                // Fallback to empty state
                displayRaces([]);
            });
    }

    function displayRaces(races) {
        const tbody = document.getElementById('races-list');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (races.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        No races found matching your filters.
                    </td>
                </tr>
            `;
            return;
        }

        races.forEach(race => {
            const row = document.createElement('tr');
            row.dataset.raceId = race.id;
            
            row.innerHTML = `
                <td>
                    <span class="race-name">${race.name}</span>
                </td>
                <td>${race.racecourse_name || 'Unknown'}</td>
                <td>${race.distance}</td>
                <td>${race.rang}</td>
                <td>${race.track_type}</td>
                <td>${race.direction}</td>
                <td>${race.season || '-'}</td>
                <td><span class="status-badge ${race.status}">${race.status}</span></td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Filter functionality
    function getFilters() {
        const activeStatusBtn = document.querySelector('.status-btn.active');
        const status = activeStatusBtn ? activeStatusBtn.dataset.status : 'all';
        
        const filters = {
            search: document.getElementById('race-search')?.value || '',
            racecourse: document.getElementById('racecourse')?.value || '',
            direction: document.getElementById('direction')?.value || '',
            season: document.getElementById('season')?.value || '',
            track: document.getElementById('track')?.value || '',
            distance_type: document.getElementById('distance-type')?.value || '',
            rang: document.getElementById('rang')?.value || ''
        };

        // Add distance range filters
        const distanceFrom = document.getElementById('distance-from')?.value;
        const distanceTo = document.getElementById('distance-to')?.value;
        
        if (distanceFrom) filters.distance_from = distanceFrom;
        if (distanceTo) filters.distance_to = distanceTo;

        // Add status filter only if not "all"
        if (status !== 'all') {
            filters.status = status;
        }

        return filters;
    }

    // Event listeners
    const searchInput = document.getElementById('race-search');
    const filterInputs = document.querySelectorAll('.filter-group select, .filter-group input');
    const statusButtons = document.querySelectorAll('.status-btn');

    if (searchInput) {
        searchInput.addEventListener('input', () => loadRaces(getFilters()));
    }

    filterInputs.forEach(input => {
        input.addEventListener('change', () => loadRaces(getFilters()));
        if (input.type === 'number') {
            input.addEventListener('input', () => loadRaces(getFilters()));
        }
    });

    // Status buttons
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            statusButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            loadRaces(getFilters());
        });
    });

    // Load initial races
    loadRaces();
});