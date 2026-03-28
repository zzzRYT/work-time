import { deriveStatus, isLateCheckIn } from './attendance.util';
import { AttendanceStatus } from '../../../common/enums';
import type { SessionEntity } from '../../../entities/session.entity';
import type { DailyVacationEntity } from '../../../entities/daily-vacation.entity';

function makeSession(overrides: Partial<SessionEntity> = {}): SessionEntity {
  return {
    id: 'test-id',
    memberId: 'member-1',
    date: '2026-03-28',
    checkInTime: new Date('2026-03-28T01:00:00Z'),
    checkOutTime: new Date('2026-03-28T03:00:00Z'),
    isLate: false,
    createdAt: new Date(),
    member: {} as any,
    ...overrides,
  };
}

function makeVacation(hours: number): DailyVacationEntity {
  return {
    id: 'vac-id',
    memberId: 'member-1',
    date: '2026-03-28',
    hours,
    member: {} as any,
  };
}

describe('deriveStatus', () => {
  it('should return VACATION for full-day vacation', () => {
    expect(deriveStatus([], makeVacation(8))).toBe(AttendanceStatus.VACATION);
  });

  it('should return NOT_ATTENDED when no sessions and no vacation', () => {
    expect(deriveStatus([], null)).toBe(AttendanceStatus.NOT_ATTENDED);
  });

  it('should return NOT_ATTENDED with partial vacation but no sessions', () => {
    expect(deriveStatus([], makeVacation(4))).toBe(AttendanceStatus.NOT_ATTENDED);
  });

  it('should return STUDYING when there is an active session', () => {
    const sessions = [makeSession({ checkOutTime: null })];
    expect(deriveStatus(sessions, null)).toBe(AttendanceStatus.STUDYING);
  });

  it('should return LATE when first session is late', () => {
    const sessions = [makeSession({ isLate: true })];
    expect(deriveStatus(sessions, null)).toBe(AttendanceStatus.LATE);
  });

  it('should return COMPLETED when first session is not late', () => {
    const sessions = [makeSession({ isLate: false })];
    expect(deriveStatus(sessions, null)).toBe(AttendanceStatus.COMPLETED);
  });

  it('should prioritize STUDYING over LATE for active sessions', () => {
    const sessions = [
      makeSession({ isLate: true, checkOutTime: new Date() }),
      makeSession({ checkOutTime: null }),
    ];
    expect(deriveStatus(sessions, null)).toBe(AttendanceStatus.STUDYING);
  });
});

describe('isLateCheckIn', () => {
  // Use getStudyStartTimeToday to get the actual study start for today,
  // then test relative to that.
  const studyStartHour = 10;
  const studyStartMinute = 0;

  it('should return false for subsequent sessions (not first of day)', () => {
    const existingSessions = [makeSession()];
    const checkInTime = new Date(); // any time
    expect(
      isLateCheckIn(checkInTime, existingSessions, studyStartHour, studyStartMinute),
    ).toBe(false);
  });

  it('should return false when checking in before study start', () => {
    const { getStudyStartTimeToday } = require('../../../common/utils/date.util');
    const studyStart = getStudyStartTimeToday(studyStartHour, studyStartMinute) as Date;
    const beforeStart = new Date(studyStart.getTime() - 30 * 60_000); // 30 min before
    expect(
      isLateCheckIn(beforeStart, [], studyStartHour, studyStartMinute),
    ).toBe(false);
  });

  it('should return false when checking in exactly at study start', () => {
    // This is the boundary fix: exactly on time should NOT be late
    const { getStudyStartTimeToday } = require('../../../common/utils/date.util');
    const studyStart = getStudyStartTimeToday(studyStartHour, studyStartMinute) as Date;
    expect(
      isLateCheckIn(studyStart, [], studyStartHour, studyStartMinute),
    ).toBe(false);
  });

  it('should return true when checking in after study start', () => {
    const { getStudyStartTimeToday } = require('../../../common/utils/date.util');
    const studyStart = getStudyStartTimeToday(studyStartHour, studyStartMinute) as Date;
    const afterStart = new Date(studyStart.getTime() + 60_000); // 1 min after
    expect(
      isLateCheckIn(afterStart, [], studyStartHour, studyStartMinute),
    ).toBe(true);
  });
});
