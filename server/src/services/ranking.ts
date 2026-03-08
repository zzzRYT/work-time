import type { Session, Member } from "@prisma/client";
import { calculateDurationMinutes } from "../utils/duration.js";

export interface RankingEntry {
  member: Member;
  totalStudyMinutes: number;
  attendanceDays: number;
  lateCount: number;
}

/** 기간 내 세션을 기반으로 멤버 랭킹 생성 */
export function buildRanking(
  members: Member[],
  sessions: Session[],
): RankingEntry[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const grouped = new Map<string, Session[]>();

  for (const s of sessions) {
    const arr = grouped.get(s.memberId) ?? [];
    arr.push(s);
    grouped.set(s.memberId, arr);
  }

  const entries: RankingEntry[] = [];

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

    // 날짜별 첫 세션 기준 지각 카운트
    const dateFirstSessions = new Map<string, Session>();
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

  // totalStudyMinutes 내림차순 정렬
  entries.sort((a, b) => b.totalStudyMinutes - a.totalStudyMinutes);

  return entries;
}
