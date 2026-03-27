/* 💖 FAVORITES & 🧠 HISTORY SYSTEM */
const FAV_KEY = 'easy_favorites';
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
    if (index === -1) {
        favs.push(String(id));
    } else {
        favs.splice(index, 1);
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    updateFavHeader();
    return index === -1; // returns true if added
}

function updateFavHeader() {
    const favCount = getFavorites().length;
    const badge = document.getElementById('fav-count-badge');
    if (badge) {
        badge.innerText = favCount;
        badge.style.display = favCount > 0 ? 'flex' : 'none';
    }
}

// 2. Manage History & Interests
function trackHistory(id, tag) {
    try {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
        // history = { "floral": 5, "men tshirt": 2 }
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
    trackHistory,
    getTopInterest
};

document.addEventListener('DOMContentLoaded', updateFavHeader);
