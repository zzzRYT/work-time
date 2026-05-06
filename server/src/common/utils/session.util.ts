interface SessionShape {
  date: string;
  isLate: boolean;
}

/**
 * Count the number of late days from a list of sessions.
 * Sessions should already be sorted by checkInTime ASC so that
 * the first session encountered per date is the earliest.
 */
export function countLateDays(sessions: SessionShape[]): number {
  const dateFirstSession = new Map<string, SessionShape>();
  for (const s of sessions) {
    if (!dateFirstSession.has(s.date)) {
      dateFirstSession.set(s.date, s);
    }
  }
  return [...dateFirstSession.values()].filter((s) => s.isLate).length;
}
