import type { PrismaClient, Settings } from "@prisma/client";

/** Settings 싱글턴 조회 (없으면 기본값으로 생성) */
export async function getSettings(prisma: PrismaClient): Promise<Settings> {
  return prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      studyStartHour: 10,
      studyStartMinute: 0,
      lateFeeAmount: 1000,
    },
  });
}
