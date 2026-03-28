import { countLateDays } from './session.util';
import type { SessionEntity } from '../../entities/session.entity';

function makeSession(overrides: Partial<SessionEntity>): SessionEntity {
  return {
    id: 'test-id',
    memberId: 'member-1',
    date: '2026-03-28',
    checkInTime: new Date('2026-03-28T01:00:00Z'),
    checkOutTime: new Date('2026-03-28T03:00:00Z'),
    isLate: false,
    workspaceId: 'ws-1',
    createdAt: new Date(),
    member: {} as any,
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
