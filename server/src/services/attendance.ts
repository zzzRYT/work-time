import type { Session, DailyVacation } from "@prisma/client";
import { FULL_DAY_VACATION_HOURS } from "../constants.js";
import { getStudyStartTimeToday } from "../utils/date.js";

export type AttendanceStatus =
  | "NOT_ATTENDED"
  | "STUDYING"
  | "COMPLETED"
  | "LATE"
  | "VACATION";

/** 하루의 세션 + 휴가 정보로 출석 상태 도출 */
export function deriveStatus(
  sessions: Session[],
  vacation: DailyVacation | null,
): AttendanceStatus {
  if (vacation && vacation.hours >= FULL_DAY_VACATION_HOURS) {
    return "VACATION";
  }

  if (sessions.length === 0) {
    return "NOT_ATTENDED";
  }

  const hasActiveSession = sessions.some((s) => s.checkOutTime === null);
  if (hasActiveSession) {
    return "STUDYING";
  }

  // 모든 세션 완료 — 첫 세션 기준 지각 여부
  const firstSession = sessions.sort(
    (a, b) => a.checkInTime.getTime() - b.checkInTime.getTime(),
  )[0];

  return firstSession.isLate ? "LATE" : "COMPLETED";
}

/** 당일 첫 체크인인지 확인하고 지각 여부 판정 */
export function isLateCheckIn(
  checkInTime: Date,
  existingSessionsToday: Session[],
  studyStartHour: number,
  studyStartMinute: number,
): boolean {
  // 재체크인(이미 세션이 있는 경우)은 지각 아님
  if (existingSessionsToday.length > 0) {
    return false;
  }

  const studyStart = getStudyStartTimeToday(studyStartHour, studyStartMinute);
  return checkInTime.getTime() >= studyStart.getTime();
}
