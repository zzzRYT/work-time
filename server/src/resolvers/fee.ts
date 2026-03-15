import { GraphQLError } from "graphql";
import type { Context } from "../context.js";
import { MONTHLY_FEE } from "../constants.js";
import { getSettings } from "../services/settings.js";
import {
  getMonthDateRange,
  getWeekDateRange,
  getKSTToday,
} from "../utils/date.js";
import { buildRanking } from "../services/ranking.js";
import type { Session } from "@prisma/client";

function validateMonthFormat(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new GraphQLError("월은 YYYY-MM 형식이어야 합니다.", {
      extensions: { code: "INVALID_MONTH_FORMAT" },
    });
  }
}

const VALID_FEE_TYPES = ["MONTHLY", "LATE"] as const;
type FeeType = (typeof VALID_FEE_TYPES)[number];

function getStatusField(type: FeeType): "monthlyFeeStatus" | "lateFeeStatus" {
  return type === "MONTHLY" ? "monthlyFeeStatus" : "lateFeeStatus";
}

async function getOrCreateMonthlyFee(
  prisma: Context["prisma"],
  memberId: string,
  month: string,
) {
  const existing = await prisma.monthlyFee.findUnique({
    where: { memberId_month: { memberId, month } },
  });
  if (existing) return existing;

  return prisma.monthlyFee.create({
    data: { memberId, month, monthlyFeeStatus: "UNPAID", lateFeeStatus: "UNPAID" },
  });
}

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

      const settings = await getSettings(prisma);

      return members.map((member) => {
        const sessions = allSessions.filter(
          (s) => s.memberId === member.id,
        );

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
          lateFee: lateCount * settings.lateFeeAmount,
          monthlyFee: MONTHLY_FEE,
          monthlyFeeStatus: fee?.monthlyFeeStatus ?? "UNPAID",
          lateFeeStatus: fee?.lateFeeStatus ?? "UNPAID",
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
    requestFeePayment: async (
      _: unknown,
      args: { memberId: string; month: string; type: string },
      { prisma }: Context,
    ) => {
      validateMonthFormat(args.month);
      const fee = await getOrCreateMonthlyFee(prisma, args.memberId, args.month);
      const field = getStatusField(args.type as FeeType);

      if (fee[field] !== "UNPAID") {
        throw new GraphQLError(
          `현재 상태(${fee[field]})에서는 납부 신청할 수 없습니다.`,
          { extensions: { code: "INVALID_STATUS_TRANSITION" } },
        );
      }

      return prisma.monthlyFee.update({
        where: { id: fee.id },
        data: { [field]: "PENDING" },
      });
    },

    confirmFeePayment: async (
      _: unknown,
      args: { memberId: string; month: string; type: string },
      { prisma }: Context,
    ) => {
      validateMonthFormat(args.month);
      const fee = await getOrCreateMonthlyFee(prisma, args.memberId, args.month);
      const field = getStatusField(args.type as FeeType);

      if (fee[field] !== "PENDING") {
        throw new GraphQLError(
          `확인 대기 상태가 아닙니다. 현재 상태: ${fee[field]}`,
          { extensions: { code: "INVALID_STATUS_TRANSITION" } },
        );
      }

      return prisma.monthlyFee.update({
        where: { id: fee.id },
        data: { [field]: "PAID" },
      });
    },

    rejectFeePayment: async (
      _: unknown,
      args: { memberId: string; month: string; type: string },
      { prisma }: Context,
    ) => {
      validateMonthFormat(args.month);
      const fee = await getOrCreateMonthlyFee(prisma, args.memberId, args.month);
      const field = getStatusField(args.type as FeeType);

      if (fee[field] !== "PENDING") {
        throw new GraphQLError(
          `확인 대기 상태가 아닙니다. 현재 상태: ${fee[field]}`,
          { extensions: { code: "INVALID_STATUS_TRANSITION" } },
        );
      }

      return prisma.monthlyFee.update({
        where: { id: fee.id },
        data: { [field]: "UNPAID" },
      });
    },
  },
};
