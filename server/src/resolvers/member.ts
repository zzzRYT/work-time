import type { Member } from "@prisma/client";
import type { Context } from "../context.js";
import { deriveStatus } from "../services/attendance.js";
import { getKSTToday } from "../utils/date.js";
import { calculateDurationMinutes } from "../utils/duration.js";

export const memberResolvers = {
  Query: {
    members: (_: unknown, __: unknown, { prisma }: Context) => {
      return prisma.member.findMany({ orderBy: { createdAt: "asc" } });
    },
  },

  Member: {
    currentStatus: async (parent: Member, _: unknown, { prisma }: Context) => {
      const today = getKSTToday();
      const [sessions, vacation] = await Promise.all([
        prisma.session.findMany({
          where: { memberId: parent.id, date: today },
          orderBy: { checkInTime: "asc" },
        }),
        prisma.dailyVacation.findFirst({
          where: { memberId: parent.id, date: today },
        }),
      ]);
      return deriveStatus(sessions, vacation);
    },

    todayStudyMinutes: async (
      parent: Member,
      _: unknown,
      { prisma }: Context,
    ) => {
      const today = getKSTToday();
      const sessions = await prisma.session.findMany({
        where: { memberId: parent.id, date: today },
      });

      return sessions.reduce((sum, s) => {
        return sum + calculateDurationMinutes(s.checkInTime, s.checkOutTime);
      }, 0);
    },

    todayVacationHours: async (
      parent: Member,
      _: unknown,
      { prisma }: Context,
    ) => {
      const today = getKSTToday();
      const vacation = await prisma.dailyVacation.findFirst({
        where: { memberId: parent.id, date: today },
      });
      return vacation?.hours ?? null;
    },
  },
};
