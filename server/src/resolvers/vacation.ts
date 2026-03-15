import { GraphQLError } from "graphql";
import type { Context } from "../context.js";
import { VACATION_UNITS, FULL_DAY_VACATION_HOURS } from "../constants.js";

function validateVacationHours(hours: number) {
  if (!VACATION_UNITS.includes(hours as (typeof VACATION_UNITS)[number])) {
    throw new GraphQLError(
      `휴가는 ${VACATION_UNITS.join(", ")}시간 단위만 가능합니다.`,
      { extensions: { code: "INVALID_VACATION_HOURS" } },
    );
  }
}

function validateDateFormat(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new GraphQLError("날짜는 YYYY-MM-DD 형식이어야 합니다.", {
      extensions: { code: "INVALID_DATE_FORMAT" },
    });
  }
}

async function ensureMemberExists(prisma: Context["prisma"], memberId: string) {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    throw new GraphQLError("멤버를 찾을 수 없습니다.", {
      extensions: { code: "MEMBER_NOT_FOUND" },
    });
  }
}

export const vacationResolvers = {
  Mutation: {
    useVacation: async (
      _: unknown,
      args: { memberId: string; date: string; hours: number },
      { prisma }: Context,
    ) => {
      validateVacationHours(args.hours);
      validateDateFormat(args.date);
      await ensureMemberExists(prisma, args.memberId);

      const existing = await prisma.dailyVacation.findFirst({
        where: { memberId: args.memberId, date: args.date },
      });
      if (existing) {
        throw new GraphQLError("이미 해당 날짜에 휴가가 등록되어 있습니다.", {
          extensions: { code: "VACATION_ALREADY_EXISTS" },
        });
      }

      if (args.hours >= FULL_DAY_VACATION_HOURS) {
        const activeSession = await prisma.session.findFirst({
          where: {
            memberId: args.memberId,
            date: args.date,
            checkOutTime: null,
          },
        });
        if (activeSession) {
          throw new GraphQLError(
            "공부 중에는 전일 휴가를 사용할 수 없습니다. 먼저 체크아웃해주세요.",
            { extensions: { code: "ACTIVE_SESSION_EXISTS" } },
          );
        }
      }

      return prisma.dailyVacation.create({
        data: {
          memberId: args.memberId,
          date: args.date,
          hours: args.hours,
        },
      });
    },

    useVacations: async (
      _: unknown,
      args: { memberId: string; dates: string[]; hours: number },
      { prisma }: Context,
    ) => {
      validateVacationHours(args.hours);
      for (const date of args.dates) {
        validateDateFormat(date);
      }
      await ensureMemberExists(prisma, args.memberId);

      // 기존 휴가 일괄 조회로 N+1 방지
      const existingVacations = await prisma.dailyVacation.findMany({
        where: { memberId: args.memberId, date: { in: args.dates } },
      });
      const existingDates = new Set(existingVacations.map((v) => v.date));

      const succeeded: Array<{
        id: string;
        memberId: string;
        date: string;
        hours: number;
      }> = [];
      const failed: Array<{ date: string; reason: string }> = [];

      for (const date of args.dates) {
        if (existingDates.has(date)) {
          failed.push({ date, reason: "이미 해당 날짜에 휴가가 등록되어 있습니다." });
          continue;
        }

        try {
          if (args.hours >= FULL_DAY_VACATION_HOURS) {
            const activeSession = await prisma.session.findFirst({
              where: { memberId: args.memberId, date, checkOutTime: null },
            });
            if (activeSession) {
              failed.push({ date, reason: "공부 중에는 전일 휴가를 사용할 수 없습니다." });
              continue;
            }
          }

          const vacation = await prisma.dailyVacation.create({
            data: {
              memberId: args.memberId,
              date,
              hours: args.hours,
            },
          });
          succeeded.push(vacation);
        } catch {
          failed.push({ date, reason: "휴가 등록에 실패했습니다." });
        }
      }

      return { succeeded, failed };
    },

    cancelVacation: async (
      _: unknown,
      args: { memberId: string; date: string },
      { prisma }: Context,
    ) => {
      validateDateFormat(args.date);
      await ensureMemberExists(prisma, args.memberId);

      const result = await prisma.dailyVacation.deleteMany({
        where: { memberId: args.memberId, date: args.date },
      });
      if (result.count === 0) {
        throw new GraphQLError("해당 날짜에 등록된 휴가가 없습니다.", {
          extensions: { code: "VACATION_NOT_FOUND" },
        });
      }

      return true;
    },
  },
};
