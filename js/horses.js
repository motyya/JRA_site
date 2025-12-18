document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = window.CONFIG.API_BASE;

    function loadHorses(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        
        fetch(`${API_BASE}/horses?${queryParams}`)
            .then(response => response.json())
            .then(horses => {
                displayHorses(horses);
                setTimeout(() => {
                    if (window.authManager) {
                        window.authManager.addFavoriteButtons();
                    }
                }, 100);
            })
            .catch(error => {
                console.error('Error loading horses:', error);
                displayHorses([]);
            });
    }

    function displayHorses(horses) {
        const tbody = document.getElementById('horses-list');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (horses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem;">
                        No horses found matching your filters.
                    </td>
                </tr>
            `;
            return;
        }

        horses.forEach(horse => {
            const row = document.createElement('tr');
            row.dataset.horseId = horse.id;
            
            const achievements = [];
            if (horse.triple_crown) achievements.push('Triple Crown');
            if (horse.tiara_crown) achievements.push('Tiara Crown');
            
            row.innerHTML = `
                <td>
                    <span class="horse-name">${horse.name}</span>
                </td>
                <td>${horse.birth_year}</td>
                <td>${horse.death_year || '-'}</td>
                <td>${horse.total_races}</td>
                <td>${horse.total_wins}</td>
                <td>${horse.total_losses}</td>
                <td>${achievements.join(', ') || '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    function getFilters() {
        return {
            search: document.getElementById('horse-search')?.value || '',
            birth_year_from: document.getElementById('birth-year-from')?.value || '',
            birth_year_to: document.getElementById('birth-year-to')?.value || '',
            death_year_from: document.getElementById('death-year-from')?.value || '',
            death_year_to: document.getElementById('death-year-to')?.value || '',
            races_from: document.getElementById('races-from')?.value || '',
            races_to: document.getElementById('races-to')?.value || '',
            wins_from: document.getElementById('wins-from')?.value || '',
            wins_to: document.getElementById('wins-to')?.value || '',
            losses_from: document.getElementById('losses-from')?.value || '',
            losses_to: document.getElementById('losses-to')?.value || '',
            triple_crown: document.getElementById('triple-crown')?.checked || false,
            tiara_crown: document.getElementById('tiara-crown')?.checked || false
        };
    }

    const searchInput = document.getElementById('horse-search');
    const filterInputs = document.querySelectorAll('.filter-group input, .filter-group select');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    if (searchInput) {
        searchInput.addEventListener('input', () => loadHorses(getFilters()));
    }

    filterInputs.forEach(input => {
        input.addEventListener('change', () => loadHorses(getFilters()));
        if (input.type === 'number') {
            input.addEventListener('input', () => loadHorses(getFilters()));
        }
    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => loadHorses(getFilters()));
    });

    loadHorses();
});