import type { SessionEntity } from '../../../entities/session.entity';
import type { MemberEntity } from '../../../entities/member.entity';
import { calculateDurationMinutes } from '../../../common/utils/duration.util';

export interface RankingEntryData {
  member: MemberEntity;
  totalStudyMinutes: number;
  attendanceDays: number;
  lateCount: number;
}

/** 기간 내 세션을 기반으로 멤버 랭킹 생성 */
export function buildRanking(
  members: MemberEntity[],
  sessions: SessionEntity[],
): RankingEntryData[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const grouped = new Map<string, SessionEntity[]>();

  for (const s of sessions) {
    const arr = grouped.get(s.memberId) ?? [];
    arr.push(s);
    grouped.set(s.memberId, arr);
  }

  const entries: RankingEntryData[] = [];

  for (const [memberId, memberSessions] of grouped) {
    const member = memberMap.get(memberId);
    if (!member) continue;

    const totalStudyMinutes = memberSessions.reduce(
      (sum, s) =>
        sum +
        (s.checkOutTime
          ? calculateDurationMinutes(s.checkInTime, s.checkOutTime)
          : 0),
      0,
    );

    const uniqueDates = new Set(memberSessions.map((s) => s.date));
    const attendanceDays = uniqueDates.size;

    const dateFirstSessions = new Map<string, SessionEntity>();
    for (const s of memberSessions.sort(
      (a, b) => a.checkInTime.getTime() - b.checkInTime.getTime(),
    )) {
      if (!dateFirstSessions.has(s.date)) {
        dateFirstSessions.set(s.date, s);
      }
    }
    const lateCount = [...dateFirstSessions.values()].filter(
      (s) => s.isLate,
    ).length;

    entries.push({ member, totalStudyMinutes, attendanceDays, lateCount });
  }

  entries.sort((a, b) => b.totalStudyMinutes - a.totalStudyMinutes);

  return entries;
}
