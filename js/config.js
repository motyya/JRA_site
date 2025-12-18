const CONFIG = {
    API_BASE: 'http://localhost:3000/api',
    DEBUG: true, // логи ошибок 
    TIMEOUTS: {
        AUTH_INIT: 100,
        PAGE_LOAD: 50
    },
    VALIDATION: {
        HORSE_WEIGHT_MIN: 300,
        HORSE_WEIGHT_MAX: 600,
        SADDLE_CLOTH_MIN: 1,
        SADDLE_CLOTH_MAX: 24,
        BARRIER_MIN: 1,
        BARRIER_MAX: 24
    }
};

// глобал
window.CONFIG = CONFIG;