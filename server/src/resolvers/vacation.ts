import { GraphQLError } from "graphql";
import type { Context } from "../context.js";
import { VACATION_UNITS, FULL_DAY_VACATION_HOURS } from "../constants.js";

export const vacationResolvers = {
  Mutation: {
    useVacation: async (
      _: unknown,
      args: { memberId: string; date: string; hours: number },
      { prisma }: Context,
    ) => {
      if (!VACATION_UNITS.includes(args.hours as (typeof VACATION_UNITS)[number])) {
        throw new GraphQLError(
          `휴가는 ${VACATION_UNITS.join(", ")}시간 단위만 가능합니다.`,
          { extensions: { code: "INVALID_VACATION_HOURS" } },
        );
      }

      // 이미 휴가 사용 확인
      const existing = await prisma.dailyVacation.findFirst({
        where: { memberId: args.memberId, date: args.date },
      });
      if (existing) {
        throw new GraphQLError("이미 해당 날짜에 휴가가 등록되어 있습니다.", {
          extensions: { code: "VACATION_ALREADY_EXISTS" },
        });
      }

      // 전일 휴가인데 활성 세션이 있는 경우
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
  },
};
