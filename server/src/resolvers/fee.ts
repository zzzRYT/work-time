import type { Context } from "../context.js";
import { LATE_FEE_AMOUNT, MONTHLY_FEE } from "../constants.js";
import {
  getMonthDateRange,
  getWeekDateRange,
  getKSTToday,
} from "../utils/date.js";
import { buildRanking } from "../services/ranking.js";
import type { Session } from "@prisma/client";

export const feeResolvers = {
  Query: {
    feeStatus: async (
      _: unknown,
      args: { month: string },
      { prisma }: Context,
    ) => {
      const [yearStr, monthStr] = args.month.split("-");
      const { start, end } = getMonthDateRange(
        Number(yearStr),
        Number(monthStr),
      );

      const members = await prisma.member.findMany({
        orderBy: { createdAt: "asc" },
      });

      const allSessions = await prisma.session.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { checkInTime: "asc" },
      });

      const allFees = await prisma.monthlyFee.findMany({
        where: { month: args.month },
      });
      const feeMap = new Map(allFees.map((f) => [f.memberId, f]));

      return members.map((member) => {
        const sessions = allSessions.filter(
          (s) => s.memberId === member.id,
        );

        // 날짜별 첫 세션으로 지각 카운트
        const dateFirst = new Map<string, Session>();
        for (const s of sessions) {
          if (!dateFirst.has(s.date)) dateFirst.set(s.date, s);
        }
        const lateCount = [...dateFirst.values()].filter(
          (s) => s.isLate,
        ).length;

        const fee = feeMap.get(member.id);

        return {
          member,
          lateFee: lateCount * LATE_FEE_AMOUNT,
          monthlyFee: MONTHLY_FEE,
          isPaid: fee?.isPaid ?? false,
          lateCount,
        };
      });
    },

    memberRanking: async (
      _: unknown,
      args: { period: "WEEKLY" | "MONTHLY" },
      { prisma }: Context,
    ) => {
      let start: string;
      let end: string;

      if (args.period === "WEEKLY") {
        const range = getWeekDateRange();
        start = range.start;
        end = range.end;
      } else {
        const today = getKSTToday();
        const [y, m] = today.split("-").map(Number);
        const range = getMonthDateRange(y, m);
        start = range.start;
        end = range.end;
      }

      const [members, sessions] = await Promise.all([
        prisma.member.findMany(),
        prisma.session.findMany({
          where: { date: { gte: start, lte: end } },
          orderBy: { checkInTime: "asc" },
        }),
      ]);

      return buildRanking(members, sessions);
    },
  },

  Mutation: {
    toggleFeePayment: async (
      _: unknown,
      args: { memberId: string; month: string },
      { prisma }: Context,
    ) => {
      const existing = await prisma.monthlyFee.findUnique({
        where: { memberId_month: { memberId: args.memberId, month: args.month } },
      });

      if (existing) {
        return prisma.monthlyFee.update({
          where: { id: existing.id },
          data: { isPaid: !existing.isPaid },
        });
      }

      return prisma.monthlyFee.create({
        data: {
          memberId: args.memberId,
          month: args.month,
          isPaid: true,
        },
      });
    },
  },
};
