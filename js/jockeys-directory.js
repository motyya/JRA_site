document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = window.CONFIG.API_BASE;
    
    async function loadJockeys() {
        try {
            const response = await fetch(`${API_BASE}/jockeys/stats`);
            const data = await response.json();
            
            document.getElementById('totalJockeys').textContent = data.stats.totalJockeys || 0;
            document.getElementById('totalEntries').textContent = data.stats.totalEntries || 0;
            
            displayJockeys(data.jockeys);
            
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('jockeysList').innerHTML = 
                '<div class="error-state"><p>Error loading jockeys</p></div>';
        }
    }

    function displayJockeys(jockeys) {
        const container = document.getElementById('jockeysList');
        
        if (!jockeys || jockeys.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No jockeys found</p></div>';
            return;
        }

        container.innerHTML = jockeys.map(jockey => `
            <div class="jockey-card">
                <div class="jockey-header">
                    <h3>${jockey.name || 'Unknown Jockey'}</h3>
                    <span class="license-badge">#${jockey.license_number || 'N/A'}</span>
                </div>
                
                <div class="jockey-stats">
                    <span class="stat-label">Total Entries:</span>
                    <span class="stat-value">${jockey.total_entries || 0}</span>
                </div>
                
                ${jockey.total_entries > 0 ? `
                    <div class="entries-dropdown">
                        <button class="dropdown-toggle" onclick="toggleDropdown('entries-${jockey.id}')">
                            Show/Hide Entries (${jockey.total_entries})
                            <span class="dropdown-arrow" id="arrow-${jockey.id}">▼</span>
                        </button>
                        <div class="dropdown-content" id="entries-${jockey.id}" style="display: none;">
                            <ul class="entries-list">
                                ${getEntriesList(jockey)}
                            </ul>
                        </div>
                    </div>
                ` : '<p class="no-entries">No entries yet</p>'}
                
                <div class="jockey-footer">
                    <small>Joined: ${new Date(jockey.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }

    function getEntriesList(jockey) {
        const raceNames = jockey.race_names || [];
        
        if (raceNames.length === 0) {
            return '<li class="entry-item">No detailed entry information available</li>';
        }
        
        let list = raceNames.slice(0, 5).map(raceName => 
            `<li class="entry-item">${raceName || 'Unknown Race'}</li>`
        ).join('');
        
        const totalEntries = jockey.total_entries || 0;
        if (totalEntries > raceNames.length) {
            list += `<li class="entry-item">... and ${totalEntries - raceNames.length} more entries</li>`;
        }
        
        return list;
    }

    window.toggleDropdown = function(id) {
        const dropdown = document.getElementById(id);
        const arrowId = 'arrow-' + id.split('-')[1];
        const arrow = document.getElementById(arrowId);
        
        if (dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
            arrow.textContent = '▼';
        } else {
            dropdown.style.display = 'block';
            arrow.textContent = '▲';
        }
    };

    const searchInput = document.getElementById('jockey-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const search = e.target.value.toLowerCase();
            document.querySelectorAll('.jockey-card').forEach(card => {
                const name = card.querySelector('h3').textContent.toLowerCase();
                const license = card.querySelector('.license-badge').textContent.toLowerCase();
                card.style.display = name.includes(search) || license.includes(search) ? 'block' : 'none';
            });
        });
    }

    loadJockeys();
});