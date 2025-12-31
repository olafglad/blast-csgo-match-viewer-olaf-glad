"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
exports.calculateAvgRoundLength = calculateAvgRoundLength;
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
function calculateAvgRoundLength(rounds) {
    if (rounds.length === 0)
        return '0:00';
    const total = rounds.reduce((sum, r) => sum + r.duration, 0);
    return formatDuration(total / rounds.length);
}
