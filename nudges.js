/* 🛒 SOCIAL PROOF NUDGES - TRANSFORMATION LIBRARY */
const NUDGE_LIBRARY = [
    { id: 1, text: "🔥 {N} people bought this today", icon: "🛒" },
    { id: 2, text: "⭐ Highly rated: {N} reviews this month", icon: "✨" },
    { id: 3, text: "👁️ {N} people are viewing this now", icon: "🔥" },
    { id: 4, text: "💎 Best seller in this category", icon: "🏆" },
    { id: 5, text: "✨ 98.7% Satisfaction rate", icon: "✅" },
    { id: 6, text: "{N} people saved this to favorites", icon: "❤️" }
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
