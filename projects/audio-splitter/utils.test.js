const { formatTime } = require('./utils');

describe('formatTime', () => {
    it('formats 0 seconds correctly', () => {
        expect(formatTime(0)).toBe('00:00');
    });
    it('formats 59 seconds correctly', () => {
        expect(formatTime(59)).toBe('00:59');
    });
    it('formats 60 seconds correctly', () => {
        expect(formatTime(60)).toBe('01:00');
    });
    it('formats 65 seconds correctly', () => {
        expect(formatTime(65)).toBe('01:05');
    });
    it('formats 3599 seconds correctly', () => {
        expect(formatTime(3599)).toBe('59:59');
    });
    it('handles float values correctly', () => {
        expect(formatTime(60.5)).toBe('01:00');
    });
    it('handles negative numbers (returns NaN formatting as per current behavior)', () => {
        // -1 / 60 = -0.0166, Math.floor is -1 => '-1'
        // -1 % 60 = -1, Math.floor is -1 => '-1'
        expect(formatTime(-1)).toBe('-1:-1');
    });
    it('handles undefined or NaN (returns NaN formatting as per current behavior)', () => {
        expect(formatTime(NaN)).toBe('NaN:NaN');
    });
});
