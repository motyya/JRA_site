document.addEventListener('DOMContentLoaded', function() {
    if (!window.CONFIG) {
        window.CONFIG = {
            API_BASE: 'http://localhost:3000/api',
            DEBUG: true,
            TIMEOUTS: {
                AUTH_INIT: 100,
                PAGE_LOAD: 50
            }
        };
    }
    
    // Инициализация всего подряд
    initSidebar();
    initNavigation();
    initLazyLoading();
    initSmoothScrolling();
});

//Сайдбар (переключение active/hidden через листенер)
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', function() {
            sidebar.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
}

// Выделение текущей позиции (меняет класс кнопки на active если ссылка в url строке совпадает)
function initNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage === 'index' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// В текущей версии не требуется, но лучше, чем стандартная подгрузка
// Подгружает картинку только при появлении её на экране (класс active)
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    if (images.length === 0) return;
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('fade-in');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Перехватывает клики по ползункам и вызывает мини-анимацию на плавную допрокрутку на 0.3-0.5 секунды
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}