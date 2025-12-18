document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = window.CONFIG.API_BASE;
    const raceEntryForm = document.getElementById('raceEntryForm');
    const horseSelect = document.getElementById('horseSelect');
    const raceSelect = document.getElementById('raceSelect');

    async function loadFormData() {
        try {
            const horsesResponse = await fetch(`${API_BASE}/available-horses`);
            if (!horsesResponse.ok) {
                console.error('Failed to load horses:', horsesResponse.status);
                return;
            }
            const horses = await horsesResponse.json();
            
            horseSelect.innerHTML = '<option value="">Choose a horse...</option>';
            horses.forEach(horse => {
                const option = document.createElement('option');
                option.value = horse.id;
                option.textContent = horse.name;
                horseSelect.appendChild(option);
            });

            const racesResponse = await fetch(`${API_BASE}/available-races`);
            if (!racesResponse.ok) {
                console.error('Failed to load races:', racesResponse.status);
                return;
            }
            const races = await racesResponse.json();
            
            raceSelect.innerHTML = '<option value="">Choose a race...</option>';
            races.forEach(race => {
                const option = document.createElement('option');
                option.value = race.id;
                option.textContent = race.name;
                raceSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading form data:', error);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        
        const formData = {
            jockeyName: document.getElementById('jockeyName').value.trim(),
            licenseNumber: document.getElementById('licenseNumber').value.trim(),
            horseId: horseSelect.value,
            raceId: raceSelect.value,
            saddlecloth: document.getElementById('saddlecloth').value,
            barrier: document.getElementById('barrier').value,
            declaredWeight: document.getElementById('declaredWeight').value
        };

        if (!formData.horseId) {
            alert('Please select a horse');
            horseSelect.focus();
            return;
        }
        
        if (!formData.raceId) {
            alert('Please select a race');
            raceSelect.focus();
            return;
        }

        const authManager = window.authManager;
        if (authManager && authManager.currentUser) {
            const user = authManager.currentUser;
            if (!formData.jockeyName) formData.jockeyName = user.name;
            if (!formData.licenseNumber) formData.licenseNumber = user.license_number;
        }

        try {
            const response = await fetch(`${API_BASE}/race-entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert(`Race entry submitted successfully! Entry ID: ${result.entryId}`);
                
                 setTimeout(() => {
                    raceEntryForm.reset();
                    loadFormData();
                }, 1000);
                
            } else {
                alert(`Error: ${result.message || 'Submission failed'}`);
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            alert('Network error. Please check your connection and try again.');
        }
    }

    function autoFillUserInfo() {
        const authManager = window.authManager;
        if (authManager && authManager.currentUser) {
            const user = authManager.currentUser;
            const jockeyNameInput = document.getElementById('jockeyName');
            const licenseInput = document.getElementById('licenseNumber');
            
            if (jockeyNameInput && !jockeyNameInput.value.trim()) {
                jockeyNameInput.value = user.name || '';
            }
            
            if (licenseInput && !licenseInput.value.trim()) {
                licenseInput.value = user.license_number || '';
            }
        }
    }

    if (raceEntryForm) {
        raceEntryForm.addEventListener('submit', handleSubmit);
    }

    autoFillUserInfo();
    loadFormData();
});