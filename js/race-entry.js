// Race Entry Form functionality
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'http://localhost:3000/api';
    const raceEntryForm = document.getElementById('raceEntryForm');
    const horseSelect = document.getElementById('horseSelect');
    const raceSelect = document.getElementById('raceSelect');
    const previewBtn = document.getElementById('previewBtn');
    const viewEntriesBtn = document.getElementById('viewEntriesBtn');

    // Load available horses and races
    async function loadFormData() {
        console.log('Loading horses and races...');
        
        try {
            // Load horses
            const horsesResponse = await fetch(`${API_BASE}/available-horses`);
            if (!horsesResponse.ok) {
                console.error('Failed to load horses:', horsesResponse.status);
                return;
            }
            const horses = await horsesResponse.json();
            
            console.log('Horses loaded:', horses.length);
            
            // Clear and populate horse dropdown
            horseSelect.innerHTML = '<option value="">Choose a horse...</option>';
            horses.forEach(horse => {
                const option = document.createElement('option');
                option.value = horse.id;
                option.textContent = horse.name;
                horseSelect.appendChild(option);
            });

            // Load races
            const racesResponse = await fetch(`${API_BASE}/available-races`);
            if (!racesResponse.ok) {
                console.error('Failed to load races:', racesResponse.status);
                return;
            }
            const races = await racesResponse.json();
            
            console.log('Races loaded:', races.length);
            
            // Clear and populate race dropdown
            raceSelect.innerHTML = '<option value="">Choose a race...</option>';
            races.forEach(race => {
                const option = document.createElement('option');
                option.value = race.id;
                option.textContent = race.name;
                raceSelect.appendChild(option);
            });

            console.log('Form data loaded successfully');
            
        } catch (error) {
            console.error('Error loading form data:', error);
            showNotification('Failed to load form data. Please refresh the page.', 'error');
        }
    }

    // Handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        
        console.log('Form submission started...');
        
        // Get form data
        const formData = {
            jockeyName: document.getElementById('jockeyName').value.trim(),
            licenseNumber: document.getElementById('licenseNumber').value.trim(),
            horseId: horseSelect.value,
            raceId: raceSelect.value,
            saddlecloth: document.getElementById('saddlecloth').value,
            barrier: document.getElementById('barrier').value,
            declaredWeight: document.getElementById('declaredWeight').value
        };

        console.log('Form data:', formData);

        // Basic validation
        if (!formData.horseId || formData.horseId === '') {
            showNotification('Please select a horse', 'error');
            horseSelect.focus();
            return;
        }
        
        if (!formData.raceId || formData.raceId === '') {
            showNotification('Please select a race', 'error');
            raceSelect.focus();
            return;
        }

        // Check if user is logged in and auto-fill if needed
        const authManager = window.authManager;
        if (authManager && authManager.currentUser) {
            const user = authManager.currentUser;
            if (!formData.jockeyName) formData.jockeyName = user.name;
            if (!formData.licenseNumber) formData.licenseNumber = user.license_number;
        }

        try {
            console.log('Submitting to API...');
            
            const response = await fetch(`${API_BASE}/race-entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log('API response:', result);

            if (result.success) {
                showNotification(`✅ Race entry submitted successfully! Entry ID: ${result.entryId}`, 'success');
                
                // Reset form after successful submission
                setTimeout(() => {
                    raceEntryForm.reset();
                    loadFormData(); // Reload dropdowns
                }, 2000);
                
            } else {
                showNotification(`❌ Error: ${result.message || 'Submission failed'}`, 'error');
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            showNotification('❌ Network error. Please check your connection and try again.', 'error');
        }
    }

    // Preview entry
    function previewEntry() {
        const selectedHorse = horseSelect.options[horseSelect.selectedIndex];
        const selectedRace = raceSelect.options[raceSelect.selectedIndex];
        
        if (!selectedHorse || selectedHorse.value === '') {
            showNotification('Please select a horse first', 'error');
            return;
        }
        
        if (!selectedRace || selectedRace.value === '') {
            showNotification('Please select a race first', 'error');
            return;
        }
        
        const previewText = `
            🏇 Preview Entry:
            Horse: ${selectedHorse.textContent}
            Race: ${selectedRace.textContent}
            Saddlecloth: ${document.getElementById('saddlecloth').value || 'Not set'}
            Barrier: ${document.getElementById('barrier').value || 'Not set'}
            Weight: ${document.getElementById('declaredWeight').value || 'Not set'} kg
        `;
        
        showNotification(previewText, 'success');
    }

    // Auto-fill user info if logged in
    function autoFillUserInfo() {
        const authManager = window.authManager;
        if (authManager && authManager.currentUser) {
            const user = authManager.currentUser;
            const jockeyNameInput = document.getElementById('jockeyName');
            const licenseInput = document.getElementById('licenseNumber');
            
            // Only fill if empty
            if (jockeyNameInput && !jockeyNameInput.value.trim()) {
                jockeyNameInput.value = user.name || '';
            }
            
            if (licenseInput && !licenseInput.value.trim()) {
                licenseInput.value = user.license_number || '';
            }
        }
    }

    // Show notification
    function showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        if (type === 'success') {
            notification.style.background = '#10B981';
        } else if (type === 'error') {
            notification.style.background = '#EF4444';
        }

        // Add animation styles if not already present
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
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Event listeners
    if (raceEntryForm) {
        raceEntryForm.addEventListener('submit', handleSubmit);
        console.log('Form submit listener attached');
    }

    if (previewBtn) {
        previewBtn.addEventListener('click', previewEntry);
        console.log('Preview button listener attached');
    }

    if (viewEntriesBtn) {
        // Already an <a> tag, so no need for click handler
        console.log('View entries button found');
    }

    // Initialize
    console.log('Race Entry JS initializing...');
    
    // Wait a bit for auth manager to be ready
    setTimeout(() => {
        autoFillUserInfo();
        loadFormData();
    }, 300);
    
    // Also try again after longer delay
    setTimeout(() => {
        autoFillUserInfo();
        loadFormData();
    }, 1000);
    
    console.log('Race Entry JS initialized');
});