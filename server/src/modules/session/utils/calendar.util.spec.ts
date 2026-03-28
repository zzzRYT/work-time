import { buildCalendar } from './calendar.util';
import { AttendanceStatus } from '../../../common/enums';
import type { SessionEntity } from '../../../entities/session.entity';
import type { DailyVacationEntity } from '../../../entities/daily-vacation.entity';

function makeSession(overrides: Partial<SessionEntity> = {}): SessionEntity {
  return {
    id: 'test-id',
    memberId: 'member-1',
    date: '2026-03-01',
    checkInTime: new Date('2026-03-01T01:00:00Z'),
    checkOutTime: new Date('2026-03-01T03:00:00Z'),
    isLate: false,
    workspaceId: 'ws-1',
    createdAt: new Date(),
    member: {} as any,
    ...overrides,
  };
}

function makeVacation(date: string, hours: number): DailyVacationEntity {
  return {
    id: 'vac-id',
    memberId: 'member-1',
    date,
    hours,
    workspaceId: 'ws-1',
    member: {} as any,
  };
}

describe('buildCalendar', () => {
  it('should return correct number of days for a month', () => {
    const result = buildCalendar(2026, 3, [], []);
    expect(result).toHaveLength(31); // March has 31 days
  });

  it('should return 28 days for February (non-leap)', () => {
    const result = buildCalendar(2025, 2, [], []);
    expect(result).toHaveLength(28);
  });

  it('should return 29 days for February (leap year)', () => {
    const result = buildCalendar(2024, 2, [], []);
    expect(result).toHaveLength(29);
  });

  it('should mark days with sessions as COMPLETED', () => {
    const sessions = [makeSession({ date: '2026-03-01' })];
    const result = buildCalendar(2026, 3, sessions, []);
    const day1 = result.find((d) => d.date === '2026-03-01');
    expect(day1?.status).toBe(AttendanceStatus.COMPLETED);
  });

  it('should mark days without sessions as NOT_ATTENDED', () => {
    const result = buildCalendar(2026, 3, [], []);
    expect(result[0].status).toBe(AttendanceStatus.NOT_ATTENDED);
  });

  it('should mark full-day vacation', () => {
    const vacations = [makeVacation('2026-03-05', 8)];
    const result = buildCalendar(2026, 3, [], vacations);
    const day5 = result.find((d) => d.date === '2026-03-05');
    expect(day5?.status).toBe(AttendanceStatus.VACATION);
  });

  it('should handle mixed statuses across days', () => {
    const sessions = [
      makeSession({ date: '2026-03-01', isLate: true }),
      makeSession({ date: '2026-03-02', isLate: false }),
    ];
    const vacations = [makeVacation('2026-03-03', 8)];
    const result = buildCalendar(2026, 3, sessions, vacations);

    expect(result.find((d) => d.date === '2026-03-01')?.status).toBe(AttendanceStatus.LATE);
    expect(result.find((d) => d.date === '2026-03-02')?.status).toBe(AttendanceStatus.COMPLETED);
    expect(result.find((d) => d.date === '2026-03-03')?.status).toBe(AttendanceStatus.VACATION);
    expect(result.find((d) => d.date === '2026-03-04')?.status).toBe(AttendanceStatus.NOT_ATTENDED);
  });
});
