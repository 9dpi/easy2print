
document.addEventListener('DOMContentLoaded', () => {
    // --- Phase 2: Dynamic Product Loading ---
    const API_URL = 'https://script.google.com/macros/s/AKfycbwBQdvEMfs43bA-tiHzKALERxhrPFIUK-IXkWOio3vLCe8QUXfyziGliwIkckFtt5mFLw/exec';
    const PREF_KEY = 'easy_user_preference';

    function formatPrice(val) {
        if (!val) return '';
        const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
        if (isNaN(num)) return val;
        return '$' + num.toFixed(2);
    }

    async function loadProducts() {
        const grid = document.getElementById('product-grid');
        const secondaryGrid = document.getElementById('secondary-product-grid');
        if (!grid) return;

        // Show loading state with skeletons
        const skeletonHtml = Array(5).fill('<div class="skeleton-card"></div>').join('');
        grid.innerHTML = skeletonHtml;
        if (secondaryGrid) secondaryGrid.innerHTML = skeletonHtml;

        try {
            const response = await fetch(API_URL);
            const products = await response.json();
            console.log('Fetching latest from API (Cache Disabled)');
            renderProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            grid.innerHTML = '<div class="error-msg">Failed to load products. Please refresh.</div>';
        }
    }

    function renderProducts(products) {
        const grid = document.getElementById('product-grid');
        const secondaryGrid = document.getElementById('secondary-product-grid');
        
        if (!grid) return;
        grid.innerHTML = '';
        if (secondaryGrid) secondaryGrid.innerHTML = '';

        // --- NEW: Generate Trending Categories (Hashtags) ---
        generateTrendingCategories(products);

        // Clone and Personalized Shuffle
        let masterList = [...products];
        const topTag = window.EasyIntelligence ? window.EasyIntelligence.getTopInterest() : null;
        
        if (topTag) {
            console.log("Personalizing view for interest:", topTag);
            masterList.sort((a, b) => {
                const aHas = a.tags && a.tags.toLowerCase().includes(topTag.toLowerCase());
                const bHas = b.tags && b.tags.toLowerCase().includes(topTag.toLowerCase());
                return (aHas === bHas) ? 0 : aHas ? -1 : 1;
            });
        }

        const suggested = masterList.slice(0, 5);
        const others = masterList.slice(5);
        const currentFavs = window.EasyIntelligence ? window.EasyIntelligence.getFavorites() : [];

        const createCard = (product) => {
            const tags = product.tags ? product.tags.split(',').map(t => t.trim()) : [];
            const tagsDataAttr = tags.join(' ');
            const hashtagsHtml = tags.map(t => `<span class="hashtag">#${t}</span>`).join('');
            const priceFormatted = formatPrice(product.price);
            const origFormatted = product.original_price ? formatPrice(product.original_price) : '';
            const isFav = currentFavs.includes(String(product.id));
            
            // Get Social Proof Nudge
            const nudgeHtml = typeof window.getRandomNudge === 'function' ? `<div class="social-nudge-badge">${window.getRandomNudge()}</div>` : '';
            
            return `
                <div class="product-card" data-tags="${tagsDataAttr}">
                    <div class="product-image-container">
                        ${nudgeHtml}
                        <img src="${product.image_url || product.image_path}" alt="${product.title}" loading="lazy" onclick="window.location.href='digital-product-detail.html?id=${product.id}'">
                        <div class="favorite-icon ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); handleFavClick(this, '${product.id}')">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        </div>
                        <span class="stock-status">EMBROIDERY</span>
                    </div>
                    <div class="product-info" onclick="window.location.href='digital-product-detail.html?id=${product.id}'">
                        <h3>${product.title}</h3>
                        <div class="product-price">${priceFormatted} <span class="original-price">${origFormatted}</span></div>
                        <div class="hashtags">${hashtagsHtml}</div>
                    </div>
                </div>
            `;
        };

        suggested.forEach(p => grid.innerHTML += createCard(p));
        if (secondaryGrid) {
            others.forEach(p => secondaryGrid.innerHTML += createCard(p));
        }
    }

    window.handleFavClick = function(el, id) {
        if (window.EasyIntelligence) {
            const isNowFav = window.EasyIntelligence.toggleFavorite(id);
            el.classList.toggle('active', isNowFav);
            const svg = el.querySelector('svg');
            svg.setAttribute('fill', isNowFav ? 'currentColor' : 'none');
        }
    };

    function generateTrendingCategories(products) {
        const tagCounts = {};
        products.forEach(p => {
            if (p.tags) {
                p.tags.split(',').forEach(tag => {
                    const t = tag.trim();
                    if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
                });
            }
        });

        const trendingTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(entry => entry[0]);

        const mainNav = document.getElementById('main-nav');
        const mobileNav = document.getElementById('mobile-nav');

        let navHtml = `<a href="#" class="active" onclick="filterCategory(event, 'all')">All Categories</a>`;
        trendingTags.forEach(tag => {
            navHtml += `<a href="#${tag}" onclick="filterCategory(event, '${tag}')">${tag}</a>`;
        });
        if (mainNav) mainNav.innerHTML = navHtml;
        if (mobileNav) {
            let mobileHtml = `<a href="#" onclick="filterCategory(event, 'all')">🌟 All Categories</a>`;
            trendingTags.forEach(tag => {
                mobileHtml += `<a href="#${tag}" onclick="filterCategory(event, '${tag}')">${tag}</a>`;
            });
            mobileNav.innerHTML = mobileHtml;
        }
    }

    // --- Personalized Category Circles Logic ---
    const allCategories = [
        { id: 'men', label: 'Men\'s Style', icon: 'assets/men_tshirt.png', tag: 'men tshirt', gender: 'men' },
        { id: 'women', label: 'Floral & Decor', icon: 'assets/women_accessories.png', tag: 'floral', gender: 'women' },
        { id: 'baby', label: 'Kid & Babies', icon: 'assets/mug-poster.png', tag: 'baby', gender: 'women' },
        { id: 'home', label: 'Home & Living', icon: 'assets/floral-door-hanger.png', tag: 'home', gender: 'both' },
        { id: 'acc', label: 'Accessories', icon: 'assets/accessories_mockup.png', tag: 'accessories', gender: 'both' },
        { id: 'gift', label: 'Anniversary', icon: 'assets/gift_anniversary_mockup.png', tag: 'gift', gender: 'both' }
    ];

    function renderPersonalizedCircles() {
        const container = document.getElementById('dynamic-circles');
        if (!container) return;

        const pref = localStorage.getItem(PREF_KEY) || 'neutral';
        let sorted = [...allCategories];

        if (pref === 'men') {
            sorted = sorted.sort((a, b) => (a.gender === 'men' ? -1 : (b.gender === 'men' ? 1 : 0)));
        } else if (pref === 'women') {
            sorted = sorted.sort((a, b) => (a.gender === 'women' ? -1 : (b.gender === 'women' ? 1 : 0)));
        }

        container.innerHTML = sorted.map(cat => `
            <div class="circle-item" onclick="trackPreference('${cat.gender}'); filterCategory(event, '${cat.tag}')">
                <div class="circle-img">
                    <img src="${cat.icon}" alt="${cat.label}">
                </div>
                <span>${cat.label}</span>
            </div>
        `).join('');
    }

    window.trackPreference = function(gender) {
        if (gender !== 'both') {
            localStorage.setItem(PREF_KEY, gender);
            renderPersonalizedCircles();
        }
    };

    window.filterCategory = function(e, tag) {
        if (e) e.preventDefault();
        const cards = document.querySelectorAll('.product-card');
        document.querySelectorAll('#main-nav a').forEach(a => a.classList.remove('active'));
        if (e && e.target) e.target.classList.add('active');

        cards.forEach(card => {
            const productTags = card.dataset.tags || '';
            if (tag === 'all' || productTags.toLowerCase().includes(tag.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        const firstGrid = document.querySelector('.product-grid');
        if (firstGrid) firstGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // --- Execution ---
    renderPersonalizedCircles();
    loadProducts();

    // --- Original Interactions ---
    const searchForm = document.getElementById('search_form');
    const searchInput = searchForm ? searchForm.querySelector('input') : null;

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim().toLowerCase();
            const cards = document.querySelectorAll('.product-card');
            const grid = document.querySelector('.product-grid');
            
            if (query) {
                cards.forEach(card => {
                    const title = card.querySelector('h3').innerText.toLowerCase();
                    card.style.display = title.includes(query) ? 'block' : 'none';
                });
                if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                cards.forEach(card => card.style.display = 'block');
            }
        });
    }

    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (header) {
            header.style.boxShadow = window.scrollY > 50 ? '0 2px 10px rgba(0,0,0,0.1)' : 'none';
        }
    });

    const heroBtn = document.querySelector('.hero-btn');
    if (heroBtn) {
        heroBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector('#suggested-section');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input').value;
            if (email) {
                alert(`Thank you! We've sent a small gift to ${email}.`);
                newsletterForm.reset();
            }
        });
    }
});

// Modal Logic
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function(event, modalId) {
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

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.universal-modal').forEach(m => {
            m.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
});
