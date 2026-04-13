const KST_OFFSET = 9 * 60; // +09:00 in minutes

/** 현재 KST 시각의 Date 객체 반환 */
export function getKSTNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utc + KST_OFFSET * 60_000);
}

/** 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환 (KST) */
export function getKSTToday(): string {
  return formatDate(getKSTNow());
}

/** Date → "YYYY-MM-DD" */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 오늘의 스터디 시작 시각 (KST) — UTC Date로 반환 */
export function getStudyStartTimeToday(hour: number, minute: number): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const kstNow = new Date(utc + KST_OFFSET * 60_000);

  kstNow.setHours(hour, minute, 0, 0);

  // KST → UTC로 역변환
  return new Date(kstNow.getTime() - KST_OFFSET * 60_000);
}

/** 특정 월의 시작일~끝일 반환 */
export function getMonthDateRange(
  year: number,
  month: number,
): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

/** 이번 주 월~일 범위 반환 (KST) */
export function getWeekDateRange(): { start: string; end: string } {
  const now = getKSTNow();
  const day = now.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: formatDate(monday), end: formatDate(sunday) };
}
