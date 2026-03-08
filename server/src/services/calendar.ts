import type { Session, DailyVacation } from "@prisma/client";
import { deriveStatus, type AttendanceStatus } from "./attendance.js";

export interface CalendarDay {
  date: string;
  status: AttendanceStatus;
}

/** 월별 캘린더 데이터 생성 */
export function buildCalendar(
  year: number,
  month: number,
  sessions: Session[],
  vacations: DailyVacation[],
): CalendarDay[] {
  const lastDay = new Date(year, month, 0).getDate();
  const result: CalendarDay[] = [];

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const daySessions = sessions.filter((s) => s.date === dateStr);
    const dayVacation = vacations.find((v) => v.date === dateStr) ?? null;

    result.push({
      date: dateStr,
      status: deriveStatus(daySessions, dayVacation),
    });
  }

  return result;
}
