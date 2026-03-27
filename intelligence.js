const FAV_KEY = 'easy_favorites';
const CART_KEY = 'easy_cart';
const HISTORY_KEY = 'easy_browsing_history';

// 1. Manage Favorites
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    } catch (e) { return []; }
}

function toggleFavorite(id) {
    let favs = getFavorites();
    const index = favs.indexOf(String(id));
    if (index === -1) favs.push(String(id));
    else favs.splice(index, 1);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    updateFavHeader();
    return index === -1;
}

function updateFavHeader() {
    const favCount = getFavorites().length;
    const badge = document.getElementById('fav-count-badge');
    if (badge) {
        badge.innerText = favCount;
        badge.style.display = favCount > 0 ? 'flex' : 'none';
    }
}

// 2. Manage Cart
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) { return []; }
}

function addToCart(product) {
    let cart = getCart();
    const existing = cart.find(item => String(item.id) === String(product.id));
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartHeader();
    showToast(`Added ${product.title} to cart`);
}

function removeFromCart(id) {
    let cart = getCart().filter(item => String(item.id) !== String(id));
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartHeader();
}

function updateCartHeader() {
    const cart = getCart();
    const count = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'easy-toast';
    toast.style = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:30px; z-index:10000; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.2); animation: fadeInUp 0.3s ease;";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "fadeOutDown 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 3. Manage History & Interests
function trackHistory(id, tag) {
    try {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
        if (tag) {
            history[tag] = (history[tag] || 0) + 1;
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }
    } catch (e) {}
}

function getTopInterest() {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
        const sorted = Object.entries(history).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? sorted[0][0] : null;
    } catch (e) { return null; }
}

// Export
window.EasyIntelligence = {
    getFavorites,
    toggleFavorite,
    updateFavHeader,
    getCart,
    addToCart,
    removeFromCart,
    updateCartHeader,
    trackHistory,
    getTopInterest
};

document.addEventListener('DOMContentLoaded', () => {
    updateFavHeader();
    updateCartHeader();
});
