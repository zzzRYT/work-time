import type { SessionEntity } from '../../entities/session.entity';

/**
 * Count the number of late days from a list of sessions.
 * Sessions should already be sorted by checkInTime ASC so that
 * the first session encountered per date is the earliest.
 */
export function countLateDays(sessions: SessionEntity[]): number {
  const dateFirstSession = new Map<string, SessionEntity>();
  for (const s of sessions) {
    if (!dateFirstSession.has(s.date)) {
      dateFirstSession.set(s.date, s);
    }
  }
  return [...dateFirstSession.values()].filter((s) => s.isLate).length;
}
