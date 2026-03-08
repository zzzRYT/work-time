/** 기수별 규칙 — 기수 변경 시 여기만 수정 */

/** 현재 기수 */
export const CURRENT_COHORT = 5;

/** 스터디 시작 시간 (24h, KST) */
export const STUDY_START_HOUR = 10;
export const STUDY_START_MINUTE = 0;

/** 지각비 (원) */
export const LATE_FEE_AMOUNT = 1_000;

/** 월 회비 (원) */
export const MONTHLY_FEE = 10_000;

/** 허용 휴가 단위 (시간) */
export const VACATION_UNITS = [2, 4, 6, 8] as const;

/** 전일 휴가 시간 */
export const FULL_DAY_VACATION_HOURS = 8;
