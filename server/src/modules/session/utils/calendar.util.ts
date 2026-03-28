import type { SessionEntity } from '../../../entities/session.entity';
import type { DailyVacationEntity } from '../../../entities/daily-vacation.entity';
import { AttendanceStatus } from '../../../common/enums';
import { deriveStatus } from './attendance.util';

export interface CalendarDayData {
  date: string;
  status: AttendanceStatus;
}

/** 월별 캘린더 데이터 생성 */
export function buildCalendar(
  year: number,
  month: number,
  sessions: SessionEntity[],
  vacations: DailyVacationEntity[],
): CalendarDayData[] {
  const lastDay = new Date(year, month, 0).getDate();
  const result: CalendarDayData[] = [];

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const daySessions = sessions.filter((s) => s.date === dateStr);
    const dayVacation = vacations.find((v) => v.date === dateStr) ?? null;

    result.push({
      date: dateStr,
      status: deriveStatus(daySessions, dayVacation),
    });
  }

  return result;
}
