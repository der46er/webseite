function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { formatTime };
}
