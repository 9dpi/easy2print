/* 🛒 SOCIAL PROOF NUDGES - TRANSFORMATION LIBRARY */
const NUDGE_LIBRARY = [
    { id: 1, text: "🔥 {N} sold today", icon: "" },
    { id: 2, text: "⭐ {N} happy reviews", icon: "" },
    { id: 3, text: "👁️ {N} viewing now", icon: "" },
    { id: 4, text: "🏆 Best seller", icon: "" },
    { id: 5, text: "✅ Satisfaction: 99%", icon: "" },
    { id: 6, text: "❤️ {N} favorites", icon: "" }
];

function getRandomNudge() {
    const nudge = NUDGE_LIBRARY[Math.floor(Math.random() * NUDGE_LIBRARY.length)];
    const n = Math.floor(Math.random() * (95 - 12 + 1) + 12); // Random 12 - 95
    return `${nudge.icon} ${nudge.text.replace('{N}', n)}`;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.getRandomNudge = getRandomNudge;
}
