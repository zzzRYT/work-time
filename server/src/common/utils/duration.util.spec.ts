import { calculateDurationMinutes } from './duration.util';

describe('calculateDurationMinutes', () => {
  it('should calculate duration between two times', () => {
    const checkIn = new Date('2026-03-28T10:00:00Z');
    const checkOut = new Date('2026-03-28T12:30:00Z');
    expect(calculateDurationMinutes(checkIn, checkOut)).toBe(150);
  });

  it('should return 0 for same time', () => {
    const time = new Date('2026-03-28T10:00:00Z');
    expect(calculateDurationMinutes(time, time)).toBe(0);
  });

  it('should floor fractional minutes', () => {
    const checkIn = new Date('2026-03-28T10:00:00Z');
    const checkOut = new Date('2026-03-28T10:01:30Z'); // 1.5 minutes
    expect(calculateDurationMinutes(checkIn, checkOut)).toBe(1);
  });

  it('should use current time when checkOutTime is null', () => {
    const checkIn = new Date(Date.now() - 60 * 60_000); // 1 hour ago
    const result = calculateDurationMinutes(checkIn, null);
    expect(result).toBeGreaterThanOrEqual(59);
    expect(result).toBeLessThanOrEqual(61);
  });
});
