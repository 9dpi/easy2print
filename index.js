
document.addEventListener('DOMContentLoaded', () => {
    // Search form interaction
    const searchForm = document.getElementById('search_form');
    const searchInput = searchForm.querySelector('input');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            console.log(`Searching for: ${query}`);
            alert(`You are searching for: ${query}\nThis feature is currently under development!`);
        }
    });

    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // Newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input').value;
        if (email) {
            alert(`Thank you! We've sent a small gift to ${email}.`);
            newsletterForm.reset();
        }
    });

    // Product card hover micro-animations (handled via CSS Mostly)
    // Adding some simple JS scale for extra "premium" feel if needed
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Logic for hover if needed beyond CSS
        });
    });
});
