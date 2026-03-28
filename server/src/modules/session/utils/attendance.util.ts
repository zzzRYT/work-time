import type { SessionEntity } from '../../../entities/session.entity';
import type { DailyVacationEntity } from '../../../entities/daily-vacation.entity';
import { FULL_DAY_VACATION_HOURS } from '../../../common/constants';
import { AttendanceStatus } from '../../../common/enums';
import { getStudyStartTimeToday } from '../../../common/utils/date.util';

/** 하루의 세션 + 휴가 정보로 출석 상태 도출 */
export function deriveStatus(
  sessions: SessionEntity[],
  vacation: DailyVacationEntity | null,
): AttendanceStatus {
  if (vacation && vacation.hours >= FULL_DAY_VACATION_HOURS) {
    return AttendanceStatus.VACATION;
  }

  if (sessions.length === 0) {
    return AttendanceStatus.NOT_ATTENDED;
  }

  const hasActiveSession = sessions.some((s) => s.checkOutTime === null);
  if (hasActiveSession) {
    return AttendanceStatus.STUDYING;
  }

  const firstSession = sessions.sort(
    (a, b) => a.checkInTime.getTime() - b.checkInTime.getTime(),
  )[0];

  return firstSession.isLate ? AttendanceStatus.LATE : AttendanceStatus.COMPLETED;
}

/** 당일 첫 체크인인지 확인하고 지각 여부 판정 */
export function isLateCheckIn(
  checkInTime: Date,
  existingSessionsToday: SessionEntity[],
  studyStartHour: number,
  studyStartMinute: number,
): boolean {
  if (existingSessionsToday.length > 0) {
    return false;
  }

  const studyStart = getStudyStartTimeToday(studyStartHour, studyStartMinute);
  return checkInTime.getTime() > studyStart.getTime();
}
