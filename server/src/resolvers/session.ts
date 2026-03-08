import type { Session } from "@prisma/client";
import { GraphQLError } from "graphql";
import type { Context } from "../context.js";
import { isLateCheckIn } from "../services/attendance.js";
import { buildCalendar } from "../services/calendar.js";
import { getKSTToday, getMonthDateRange } from "../utils/date.js";
import { calculateDurationMinutes } from "../utils/duration.js";
import { LATE_FEE_AMOUNT, FULL_DAY_VACATION_HOURS } from "../constants.js";

export const sessionResolvers = {
  Query: {
    activeSession: async (
      _: unknown,
      { memberId }: { memberId: string },
      { prisma }: Context,
    ) => {
      const today = getKSTToday();
      return prisma.session.findFirst({
        where: {
          memberId,
          date: today,
          checkOutTime: null,
        },
      });
    },

    todayAttendanceSummary: async (
      _: unknown,
      __: unknown,
      { prisma }: Context,
    ) => {
      const today = getKSTToday();
      const total = await prisma.member.count();

      const todaySessions = await prisma.session.findMany({
        where: { date: today },
      });

      const memberSessions = new Map<string, Session[]>();
      for (const s of todaySessions) {
        const arr = memberSessions.get(s.memberId) ?? [];
        arr.push(s);
        memberSessions.set(s.memberId, arr);
      }

      let attended = 0;
      let studying = 0;
      let late = 0;

      for (const [, sessions] of memberSessions) {
        attended++;
        if (sessions.some((s) => s.checkOutTime === null)) {
          studying++;
        }
        const first = sessions.sort(
          (a, b) => a.checkInTime.getTime() - b.checkInTime.getTime(),
        )[0];
        if (first.isLate) late++;
      }

      return { total, attended, studying, late };
    },

    dayDetail: async (
      _: unknown,
      args: { memberId: string; date: string },
      { prisma }: Context,
    ) => {
      const sessions = await prisma.session.findMany({
        where: { memberId: args.memberId, date: args.date },
        orderBy: { checkInTime: "asc" },
      });

      const vacation = await prisma.dailyVacation.findFirst({
        where: { memberId: args.memberId, date: args.date },
      });

      const totalDurationMinutes = sessions.reduce(
        (sum, s) =>
          sum + calculateDurationMinutes(s.checkInTime, s.checkOutTime),
        0,
      );

      return {
        sessions,
        totalDurationMinutes,
        vacationHours: vacation?.hours ?? null,
      };
    },

    calendar: async (
      _: unknown,
      args: { memberId: string; year: number; month: number },
      { prisma }: Context,
    ) => {
      const { start, end } = getMonthDateRange(args.year, args.month);

      const [sessions, vacations] = await Promise.all([
        prisma.session.findMany({
          where: {
            memberId: args.memberId,
            date: { gte: start, lte: end },
          },
          orderBy: { checkInTime: "asc" },
        }),
        prisma.dailyVacation.findMany({
          where: {
            memberId: args.memberId,
            date: { gte: start, lte: end },
          },
        }),
      ]);

      return buildCalendar(args.year, args.month, sessions, vacations);
    },

    monthlySummary: async (
      _: unknown,
      args: { memberId: string; year: number; month: number },
      { prisma }: Context,
    ) => {
      const { start, end } = getMonthDateRange(args.year, args.month);

      const [sessions, vacations] = await Promise.all([
        prisma.session.findMany({
          where: {
            memberId: args.memberId,
            date: { gte: start, lte: end },
          },
          orderBy: { checkInTime: "asc" },
        }),
        prisma.dailyVacation.findMany({
          where: {
            memberId: args.memberId,
            date: { gte: start, lte: end },
          },
        }),
      ]);

      const uniqueDates = new Set(sessions.map((s) => s.date));
      const attendanceDays = uniqueDates.size;

      const totalStudyMinutes = sessions.reduce(
        (sum, s) =>
          sum +
          (s.checkOutTime
            ? calculateDurationMinutes(s.checkInTime, s.checkOutTime)
            : 0),
        0,
      );

      const averageDailyMinutes =
        attendanceDays > 0
          ? Math.floor(totalStudyMinutes / attendanceDays)
          : 0;

      // 날짜별 첫 세션 기준 지각 카운트
      const dateFirstSession = new Map<string, Session>();
      for (const s of sessions) {
        if (!dateFirstSession.has(s.date)) {
          dateFirstSession.set(s.date, s);
        }
      }
      const lateCount = [...dateFirstSession.values()].filter(
        (s) => s.isLate,
      ).length;

      const vacationDays = vacations.length;
      const totalLateFee = lateCount * LATE_FEE_AMOUNT;

      return {
        attendanceDays,
        totalStudyMinutes,
        averageDailyMinutes,
        lateCount,
        vacationDays,
        totalLateFee,
      };
    },
  },

  Mutation: {
    checkIn: async (
      _: unknown,
      args: { memberId: string },
      { prisma }: Context,
    ) => {
      const today = getKSTToday();

      // 8h 휴가 확인
      const vacation = await prisma.dailyVacation.findFirst({
        where: { memberId: args.memberId, date: today },
      });
      if (vacation && vacation.hours >= FULL_DAY_VACATION_HOURS) {
        throw new GraphQLError("전일 휴가 중에는 체크인할 수 없습니다.", {
          extensions: { code: "FULL_DAY_VACATION" },
        });
      }

      // 이미 활성 세션 확인
      const activeSession = await prisma.session.findFirst({
        where: {
          memberId: args.memberId,
          date: today,
          checkOutTime: null,
        },
      });
      if (activeSession) {
        throw new GraphQLError("이미 체크인 상태입니다.", {
          extensions: { code: "ALREADY_CHECKED_IN" },
        });
      }

      const existingSessions = await prisma.session.findMany({
        where: { memberId: args.memberId, date: today },
      });

      const now = new Date();
      const isLate = isLateCheckIn(now, existingSessions);

      return prisma.session.create({
        data: {
          memberId: args.memberId,
          date: today,
          checkInTime: now,
          isLate,
        },
      });
    },

    checkOut: async (
      _: unknown,
      args: { memberId: string },
      { prisma }: Context,
    ) => {
      const today = getKSTToday();

      const activeSession = await prisma.session.findFirst({
        where: {
          memberId: args.memberId,
          date: today,
          checkOutTime: null,
        },
      });

      if (!activeSession) {
        throw new GraphQLError("체크인 상태가 아닙니다.", {
          extensions: { code: "NOT_CHECKED_IN" },
        });
      }

      return prisma.session.update({
        where: { id: activeSession.id },
        data: { checkOutTime: new Date() },
      });
    },
  },

  Session: {
    durationMinutes: (parent: Session) => {
      if (!parent.checkOutTime) return null;
      return calculateDurationMinutes(parent.checkInTime, parent.checkOutTime);
    },
    checkInTime: (parent: Session) => parent.checkInTime.toISOString(),
    checkOutTime: (parent: Session) =>
      parent.checkOutTime?.toISOString() ?? null,
  },
};
