import { countLateDays } from './session.util';

interface SessionShape {
  date: string;
  isLate: boolean;
}

function makeSession(overrides: Partial<SessionShape>): SessionShape {
  return {
    date: '2026-03-28',
    isLate: false,
    ...overrides,
  };
}

describe('countLateDays', () => {
  it('should return 0 for empty sessions', () => {
    expect(countLateDays([])).toBe(0);
  });

  it('should return 0 when no sessions are late', () => {
    const sessions = [
      makeSession({ date: '2026-03-01', isLate: false }),
      makeSession({ date: '2026-03-02', isLate: false }),
    ];
    expect(countLateDays(sessions)).toBe(0);
  });

  it('should count late days correctly', () => {
    const sessions = [
      makeSession({ date: '2026-03-01', isLate: true }),
      makeSession({ date: '2026-03-02', isLate: false }),
      makeSession({ date: '2026-03-03', isLate: true }),
    ];
    expect(countLateDays(sessions)).toBe(2);
  });

  it('should only count the first session per date', () => {
    const sessions = [
      makeSession({ date: '2026-03-01', isLate: false }), // first session, not late
      makeSession({ date: '2026-03-01', isLate: true }),  // second session, late (should be ignored)
    ];
    expect(countLateDays(sessions)).toBe(0);
  });

  it('should handle multiple sessions across multiple dates', () => {
    const sessions = [
      makeSession({ date: '2026-03-01', isLate: true }),
      makeSession({ date: '2026-03-01', isLate: false }),
      makeSession({ date: '2026-03-02', isLate: false }),
      makeSession({ date: '2026-03-02', isLate: true }),
      makeSession({ date: '2026-03-03', isLate: true }),
    ];
    expect(countLateDays(sessions)).toBe(2); // Mar 1 + Mar 3
  });
});
