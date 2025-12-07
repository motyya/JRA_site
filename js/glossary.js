// Glossary page functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('glossary-search');
    const terms = document.querySelectorAll('.glossary-term');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            terms.forEach(term => {
                const title = term.querySelector('.term-title').textContent.toLowerCase();
                const definition = term.querySelector('.term-definition').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || definition.includes(searchTerm)) {
                    term.style.display = 'block';
                } else {
                    term.style.display = 'none';
                }
            });
        });
    }
});