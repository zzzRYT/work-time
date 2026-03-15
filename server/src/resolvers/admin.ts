import { GraphQLError } from "graphql";
import type { Context } from "../context.js";
import type { Settings } from "@prisma/client";
import { getSettings } from "../services/settings.js";

const VALID_ROLES = ["ADMIN", "MEMBER"] as const;

export const adminResolvers = {
  Query: {
    settings: (_: unknown, __: unknown, { prisma }: Context) => {
      return getSettings(prisma);
    },
  },

  Mutation: {
    updateMemberRole: async (
      _: unknown,
      args: { memberId: string; role: string },
      { prisma }: Context,
    ) => {
      if (!VALID_ROLES.includes(args.role as (typeof VALID_ROLES)[number])) {
        throw new GraphQLError("role은 ADMIN 또는 MEMBER여야 합니다.", {
          extensions: { code: "INVALID_ROLE" },
        });
      }

      return prisma.$transaction(async (tx) => {
        const member = await tx.member.findUnique({
          where: { id: args.memberId },
        });
        if (!member) {
          throw new GraphQLError("멤버를 찾을 수 없습니다.", {
            extensions: { code: "MEMBER_NOT_FOUND" },
          });
        }

        // 마지막 관리자 해제 방지
        if (member.role === "ADMIN" && args.role === "MEMBER") {
          const adminCount = await tx.member.count({
            where: { role: "ADMIN" },
          });
          if (adminCount <= 1) {
            throw new GraphQLError("관리자가 최소 1명은 필요합니다.", {
              extensions: { code: "LAST_ADMIN" },
            });
          }
        }

        return tx.member.update({
          where: { id: args.memberId },
          data: { role: args.role },
        });
      });
    },

    updateStudyStartTime: async (
      _: unknown,
      args: { hour: number; minute: number },
      { prisma }: Context,
    ) => {
      if (args.hour < 0 || args.hour > 23) {
        throw new GraphQLError("시간은 0~23 범위여야 합니다.", {
          extensions: { code: "INVALID_HOUR" },
        });
      }
      if (args.minute < 0 || args.minute > 59) {
        throw new GraphQLError("분은 0~59 범위여야 합니다.", {
          extensions: { code: "INVALID_MINUTE" },
        });
      }

      return prisma.settings.upsert({
        where: { id: "default" },
        update: {
          studyStartHour: args.hour,
          studyStartMinute: args.minute,
        },
        create: {
          id: "default",
          studyStartHour: args.hour,
          studyStartMinute: args.minute,
          lateFeeAmount: 1000,
        },
      });
    },

    updateLateFeeAmount: async (
      _: unknown,
      args: { amount: number },
      { prisma }: Context,
    ) => {
      if (args.amount < 0) {
        throw new GraphQLError("금액은 0 이상이어야 합니다.", {
          extensions: { code: "INVALID_AMOUNT" },
        });
      }

      return prisma.settings.upsert({
        where: { id: "default" },
        update: { lateFeeAmount: args.amount },
        create: {
          id: "default",
          studyStartHour: 10,
          studyStartMinute: 0,
          lateFeeAmount: args.amount,
        },
      });
    },
  },

  Settings: {
    updatedAt: (parent: Settings) => parent.updatedAt.toISOString(),
  },
};
