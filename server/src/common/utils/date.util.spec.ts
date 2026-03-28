import {
  formatDate,
  getMonthDateRange,
  getWeekDateRange,
  getKSTNow,
  getKSTToday,
  getStudyStartTimeToday,
} from './date.util';

describe('date.util', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const d = new Date(2026, 0, 5); // Jan 5, 2026
      expect(formatDate(d)).toBe('2026-01-05');
    });

    it('should pad single-digit months and days', () => {
      const d = new Date(2026, 2, 9); // Mar 9
      expect(formatDate(d)).toBe('2026-03-09');
    });

    it('should handle December', () => {
      const d = new Date(2026, 11, 31); // Dec 31
      expect(formatDate(d)).toBe('2026-12-31');
    });
  });

  describe('getMonthDateRange', () => {
    it('should return correct range for January', () => {
      const { start, end } = getMonthDateRange(2026, 1);
      expect(start).toBe('2026-01-01');
      expect(end).toBe('2026-01-31');
    });

    it('should handle February (non-leap year)', () => {
      const { start, end } = getMonthDateRange(2025, 2);
      expect(start).toBe('2025-02-01');
      expect(end).toBe('2025-02-28');
    });

    it('should handle February (leap year)', () => {
      const { start, end } = getMonthDateRange(2024, 2);
      expect(start).toBe('2024-02-01');
      expect(end).toBe('2024-02-29');
    });

    it('should handle December', () => {
      const { start, end } = getMonthDateRange(2026, 12);
      expect(start).toBe('2026-12-01');
      expect(end).toBe('2026-12-31');
    });

    it('should handle months with 30 days', () => {
      const { start, end } = getMonthDateRange(2026, 4);
      expect(start).toBe('2026-04-01');
      expect(end).toBe('2026-04-30');
    });
  });

  describe('getKSTNow', () => {
    it('should return a Date object', () => {
      expect(getKSTNow()).toBeInstanceOf(Date);
    });
  });

  describe('getKSTToday', () => {
    it('should return YYYY-MM-DD format string', () => {
      const today = getKSTToday();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getWeekDateRange', () => {
    it('should return start (Monday) and end (Sunday)', () => {
      const { start, end } = getWeekDateRange();
      expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // end should be 6 days after start
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffDays = (endDate.getTime() - startDate.getTime()) / (86400 * 1000);
      expect(diffDays).toBe(6);
    });

    it('should start on Monday (day 1)', () => {
      const { start } = getWeekDateRange();
      const startDate = new Date(start + 'T00:00:00');
      const day = startDate.getDay();
      expect(day).toBe(1); // Monday
    });
  });

  describe('getStudyStartTimeToday', () => {
    it('should return a Date for given hour and minute', () => {
      const result = getStudyStartTimeToday(10, 0);
      expect(result).toBeInstanceOf(Date);
    });

    it('should produce a time that when converted to KST matches the input', () => {
      const result = getStudyStartTimeToday(10, 30);
      // Convert UTC result to KST
      const kst = new Date(result.getTime() + 9 * 60 * 60_000);
      expect(kst.getHours()).toBe(10);
      expect(kst.getMinutes()).toBe(30);
    });
  });
});
