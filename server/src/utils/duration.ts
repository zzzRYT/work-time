/** 두 시각 사이의 분(minutes) 계산. checkOutTime이 null이면 현재 시각 기준 */
export function calculateDurationMinutes(
  checkInTime: Date,
  checkOutTime: Date | null,
): number {
  const end = checkOutTime ?? new Date();
  return Math.floor((end.getTime() - checkInTime.getTime()) / 60_000);
}
