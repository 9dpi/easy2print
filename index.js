
document.addEventListener('DOMContentLoaded', () => {
    // Search form interaction
    const searchForm = document.getElementById('search_form');
    const searchInput = searchForm.querySelector('input');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        
        const cards = document.querySelectorAll('.product-card');
        const grid = document.querySelector('.product-grid');
        
        if (query) {
            cards.forEach(card => {
                const title = card.querySelector('h3').innerText.toLowerCase();
                if (title.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            if (grid) {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // If empty, show all
            cards.forEach(card => card.style.display = 'block');
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

// Category filtering function
window.filterCategory = function(e, category) {
    if (e) e.preventDefault();
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const tags = card.getAttribute('data-tags');
        if (!tags) return;
        
        if (category === 'all' || tags.includes(category)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // Optional: Smooth scroll down to products
    const grid = document.querySelector('.product-grid');
    if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Modal Functions
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
};

window.closeModal = function(event, modalId) {
    // If the click is on the background overlay (the modal itself)
    if (event.target.id === modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

window.closeModalDirect = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// Also handle close on Esc key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.universal-modal[style*="display: flex"]');
        activeModals.forEach(modal => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
});
