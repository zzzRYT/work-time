import { buildRanking } from './ranking.util';
import type { SessionEntity } from '../../../entities/session.entity';
import type { MemberEntity } from '../../../entities/member.entity';

function makeMember(id: string, name: string): MemberEntity {
  return {
    id,
    name,
    displayName: name,
    color: '#000',
    role: 'MEMBER',
    createdAt: new Date(),
    workspaceId: 'ws-1',
    sessions: [],
    dailyVacations: [],
    monthlyFees: [],
  } as MemberEntity;
}

function makeSession(
  memberId: string,
  date: string,
  studyMinutes: number,
  isLate = false,
): SessionEntity {
  const checkIn = new Date(`${date}T01:00:00Z`);
  const checkOut = new Date(checkIn.getTime() + studyMinutes * 60_000);
  return {
    id: `session-${memberId}-${date}`,
    memberId,
    date,
    checkInTime: checkIn,
    checkOutTime: checkOut,
    isLate,
    workspaceId: 'ws-1',
    createdAt: new Date(),
    member: {} as any,
  };
}

describe('buildRanking', () => {
  it('should return empty array for no sessions', () => {
    const members = [makeMember('m1', 'Alice')];
    expect(buildRanking(members, [])).toEqual([]);
  });

  it('should rank members by total study minutes descending', () => {
    const members = [makeMember('m1', 'Alice'), makeMember('m2', 'Bob')];
    const sessions = [
      makeSession('m1', '2026-03-01', 60),  // 60 min
      makeSession('m2', '2026-03-01', 120), // 120 min
    ];
    const ranking = buildRanking(members, sessions);
    expect(ranking[0].member.name).toBe('Bob');
    expect(ranking[1].member.name).toBe('Alice');
  });

  it('should count attendance days correctly', () => {
    const members = [makeMember('m1', 'Alice')];
    const sessions = [
      makeSession('m1', '2026-03-01', 60),
      makeSession('m1', '2026-03-01', 30), // same day
      makeSession('m1', '2026-03-02', 60),
    ];
    const ranking = buildRanking(members, sessions);
    expect(ranking[0].attendanceDays).toBe(2);
  });

  it('should count late days correctly', () => {
    const members = [makeMember('m1', 'Alice')];
    const sessions = [
      makeSession('m1', '2026-03-01', 60, true),
      makeSession('m1', '2026-03-02', 60, false),
      makeSession('m1', '2026-03-03', 60, true),
    ];
    const ranking = buildRanking(members, sessions);
    expect(ranking[0].lateCount).toBe(2);
  });

  it('should skip sessions with no matching member', () => {
    const members = [makeMember('m1', 'Alice')];
    const sessions = [
      makeSession('m1', '2026-03-01', 60),
      makeSession('unknown', '2026-03-01', 120),
    ];
    const ranking = buildRanking(members, sessions);
    expect(ranking).toHaveLength(1);
  });

  it('should not count active sessions (null checkOut) in study time', () => {
    const members = [makeMember('m1', 'Alice')];
    const session = makeSession('m1', '2026-03-01', 60);
    session.checkOutTime = null;
    const ranking = buildRanking(members, [session]);
    expect(ranking[0].totalStudyMinutes).toBe(0);
  });
});
