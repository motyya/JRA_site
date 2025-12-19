class AuthManager {
    constructor() {
        this.currentUser = this.getStoredUser();
        this.init();
    }

    async init() {
        // if (window.CONFIG && window.CONFIG.DEBUG) {
        //     console.log('AuthManager initializing...');
        // }
        
        // Проверка на логин ранее
        this.currentUser = this.getStoredUser();
        
        // Настройка вида сайта
        this.setupLoginForm();
        this.setupRegistrationForm();
        
        //
        this.updateUI();
        
        // Добавление в избранное
        this.setupFavoriteButtons();
        
        // Логаут
        this.addGlobalLogoutHandler();
        
        // Синк для всех страниц
        this.setupStorageSync();
    }

    // Синк для всех страниц
    setupStorageSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser') {
                this.currentUser = e.newValue ? JSON.parse(e.newValue) : null;
                this.updateUI();
            }
        });
    }

    // Настройка вида сайта
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    setupRegistrationForm() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }
    }

    //Отправка данных в api/auth/login
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
            const response = await fetch(`${window.CONFIG.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                this.setCurrentUser(result.user);
                this.showNotification('Login successful!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'user.html';
                }, 1000);
            } else {
                this.showNotification(result.message || 'Invalid credentials', 'error');
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
            const response = await fetch(`${window.CONFIG.API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Registration successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                this.showNotification(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
        }
    }

    //Простая проверка регистрации на стороне клиента
    validateRegistration(userData) {
        let isValid = true;

        if (!userData.fullName || userData.fullName.trim().length < 2) {
            this.showNotification('Full name is required (min 2 characters)', 'error');
            isValid = false;
        }

        if (!userData.username || userData.username.length < 3) {
            this.showNotification('Username is required (min 3 characters)', 'error');
            isValid = false;
        }

        if (!userData.password || userData.password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            isValid = false;
        }

        if (!userData.licenseNumber) {
            this.showNotification('License number is required', 'error');
            isValid = false;
        }

        return isValid;
    }

    setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
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
        }, 500);
    }

    updateUI() {
        const loginLinks = document.querySelectorAll('.login-link');
        const userLinks = document.querySelectorAll('.user-link');
        
        if (this.currentUser) {
            // Пользователь зашел
            loginLinks.forEach(link => {
                if (link) link.style.display = 'none';
            });
            
            userLinks.forEach(link => {
                if (link) {
                    link.style.display = 'block';
                    this.updateNavigationUserName();
                }
            });

            // Кнопки избранного
            setTimeout(() => {
                this.addFavoriteButtons();
                this.loadExistingFavorites();
            }, window.CONFIG.TIMEOUTS.AUTH_INIT);
            
        } else {
            // Пользовател не зашел
            loginLinks.forEach(link => {
                if (link) link.style.display = 'block';
            });
            
            userLinks.forEach(link => {
                if (link) link.style.display = 'none';
            });
        }
    }

    // Замена кнопки в правом верхнем меню в зависимости от залогиненности 
    updateNavigationUserName() {
        if (this.currentUser) {
            const userNames = document.querySelectorAll('.user-name');
            userNames.forEach(span => {
                span.textContent = this.currentUser.name || this.currentUser.username || 'User';
            });
        }
    }

    //Парсинг избранных из датабаз
    async loadExistingFavorites() {
        if (!this.currentUser) return;
        
        try {
            // Лошади
            const horseResponse = await fetch(`${window.CONFIG.API_BASE}/user/favorites/horses/${this.currentUser.id}`);
            if (horseResponse.ok) {
                const favoriteHorses = await horseResponse.json();
                this.markFavoriteHorses(favoriteHorses);
            }
            
            // Забеги
            const raceResponse = await fetch(`${window.CONFIG.API_BASE}/user/favorites/races/${this.currentUser.id}`);
            if (raceResponse.ok) {
                const favoriteRaces = await raceResponse.json();
                this.markFavoriteRaces(favoriteRaces);
            }
            
            // Ипподромы
            const racecourseResponse = await fetch(`${window.CONFIG.API_BASE}/user/favorites/racecourses/${this.currentUser.id}`);
            if (racecourseResponse.ok) {
                const favoriteRacecourses = await racecourseResponse.json();
                this.markFavoriteRacecourses(favoriteRacecourses);
            }
            
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }
    
    // Отметки избранных 
    markFavoriteHorses(favoriteHorses) {
        favoriteHorses.forEach(horse => {
            const favButtons = document.querySelectorAll(`.favorite-btn[data-horse-id="${horse.id}"]`);
            favButtons.forEach(button => {
                button.classList.add('favorited');
                button.innerHTML = '♥';
            });
        });
    }
    
    markFavoriteRaces(favoriteRaces) {
        favoriteRaces.forEach(race => {
            const favButtons = document.querySelectorAll(`.favorite-btn[data-race-id="${race.id}"]`);
            favButtons.forEach(button => {
                button.classList.add('favorited');
                button.innerHTML = '♥';
            });
        });
    }
    
    markFavoriteRacecourses(favoriteRacecourses) {
        favoriteRacecourses.forEach(racecourse => {
            const favButtons = document.querySelectorAll(`.favorite-btn[data-racecourse-id="${racecourse.id}"]`);
            favButtons.forEach(button => {
                button.classList.add('favorited');
                button.innerHTML = '♥';
            });
        });
    }

    //Логаут 
    addGlobalLogoutHandler() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logoutLink' || e.target.closest('#logoutLink')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    addFavoriteButtons() {
        if (!this.currentUser) return;

        this.addFavoriteButtonsToHorses();
        this.addFavoriteButtonsToRaces();
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
                    favBtn.dataset.horseId = horseId;
                    favBtn.dataset.horseName = horseName;
                    favBtn.title = 'Add to favorites';
                    
                    favBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleHorseFavorite(horseId, horseName, favBtn);
                    });
                    
                    const firstCell = row.querySelector('td:first-child');
                    if (firstCell) {
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
                const raceId = row.dataset.raceId;
                const raceName = row.querySelector('.race-name')?.textContent.trim();
                
                if (raceId && raceName) {
                    const favBtn = document.createElement('button');
                    favBtn.className = 'favorite-btn';
                    favBtn.innerHTML = '♡';
                    favBtn.dataset.raceId = raceId;
                    favBtn.dataset.raceName = raceName;
                    favBtn.title = 'Add to favorites';
                    
                    favBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleRaceFavorite(raceId, raceName, favBtn);
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
                const racecourseId = row.dataset.racecourseId;
                const racecourseName = row.querySelector('.racecourse-name')?.textContent.trim();
                
                if (racecourseId && racecourseName) {
                    const favBtn = document.createElement('button');
                    favBtn.className = 'favorite-btn';
                    favBtn.innerHTML = '♡';
                    favBtn.dataset.racecourseId = racecourseId;
                    favBtn.dataset.racecourseName = racecourseName;
                    favBtn.title = 'Add to favorites';
                    
                    favBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleRacecourseFavorite(racecourseId, racecourseName, favBtn);
                    });
                    
                    const firstCell = row.querySelector('td:first-child');
                    if (firstCell) {
                        firstCell.insertBefore(favBtn, firstCell.firstChild);
                    }
                }
            }
        });
    }

    async toggleHorseFavorite(horseId, horseName, button) {
        if (!this.currentUser) {
            this.showNotification('Please login to add favorites', 'error');
            return;
        }

        try {
            const isCurrentlyFavorite = button.classList.contains('favorited');
            const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
            
            const response = await fetch(`${window.CONFIG.API_BASE}/user/favorites/horses`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    horseId: parseInt(horseId)
                })
            });

            const result = await response.json();

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
            }
        } catch (error) {
            console.error('Favorite error:', error);
        }
    }

    async toggleRaceFavorite(raceId, raceName, button) {
        if (!this.currentUser) {
            this.showNotification('Please login to add favorites', 'error');
            return;
        }

        try {
            const isCurrentlyFavorite = button.classList.contains('favorited');
            const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
            
            const response = await fetch(`${window.CONFIG.API_BASE}/user/favorites/races`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    raceId: parseInt(raceId)
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
            }
        } catch (error) {
            console.error('Favorite error:', error);
        }
    }

    async toggleRacecourseFavorite(racecourseId, racecourseName, button) {
        if (!this.currentUser) {
            this.showNotification('Please login to add favorites', 'error');
            return;
        }

        try {
            const isCurrentlyFavorite = button.classList.contains('favorited');
            const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
            
            const response = await fetch(`${window.CONFIG.API_BASE}/user/favorites/racecourses`, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    racecourseId: parseInt(racecourseId)
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
            }
        } catch (error) {
            console.error('Favorite error:', error);
        }
    }

    setupFavoriteButtons() {
        if (!this.currentUser) return;
        this.addFavoriteButtons();
        this.loadExistingFavorites();
    }

    showNotification(message, type) {
        if (!window.CONFIG.DEBUG && type === 'success') return; // Hide success notifications in production
        
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
        }

        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

const authManager = new AuthManager();
window.authManager = authManager;