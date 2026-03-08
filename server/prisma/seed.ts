import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MEMBERS = [
  { name: "김철수", displayName: "철수", color: "indigo" },
  { name: "이영희", displayName: "영희", color: "pink" },
  { name: "박지민", displayName: "지민", color: "emerald" },
  { name: "최수진", displayName: "수진", color: "gray" },
  { name: "정민호", displayName: "민호", color: "orange" },
  { name: "한지은", displayName: "지은", color: "blue" },
  { name: "강동현", displayName: "동현", color: "gray" },
  { name: "윤서연", displayName: "서연", color: "gray" },
];

async function main() {
  console.log("Seeding members...");

  for (const m of MEMBERS) {
    await prisma.member.upsert({
      where: { id: m.name },
      update: {},
      create: {
        id: m.name, // 편의상 이름을 id로
        ...m,
      },
    });
  }

  console.log(`Seeded ${MEMBERS.length} members`);

  // 샘플 세션 데이터 (오늘 기준)
  const today = new Date()
    .toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
    .replace(/\. /g, "-")
    .replace(".", "");

  // ISO format으로 변환
  const kstNow = new Date();
  const y = kstNow.getFullYear();
  const mo = String(kstNow.getMonth() + 1).padStart(2, "0");
  const d = String(kstNow.getDate()).padStart(2, "0");
  const todayStr = `${y}-${mo}-${d}`;
  const currentMonth = `${y}-${mo}`;

  // 김철수: 공부 중 (09:30 체크인)
  const csCheckIn = new Date(`${todayStr}T00:30:00.000Z`); // 09:30 KST
  await prisma.session.upsert({
    where: { id: "session-cs-1" },
    update: {},
    create: {
      id: "session-cs-1",
      memberId: "김철수",
      date: todayStr,
      checkInTime: csCheckIn,
      isLate: false,
    },
  });

  // 이영희: 공부 중 (09:50 체크인)
  const yhCheckIn = new Date(`${todayStr}T00:50:00.000Z`); // 09:50 KST
  await prisma.session.upsert({
    where: { id: "session-yh-1" },
    update: {},
    create: {
      id: "session-yh-1",
      memberId: "이영희",
      date: todayStr,
      checkInTime: yhCheckIn,
      isLate: false,
    },
  });

  // 박지민: 공부 중 (08:30 체크인)
  const jmCheckIn = new Date(`${todayStr}T23:30:00.000Z`); // 전날 23:30 UTC = 08:30 KST
  const prevDay = new Date(kstNow);
  prevDay.setDate(prevDay.getDate() - 1);
  const jmCheckInActual = new Date(`${todayStr}T00:00:00.000Z`);
  jmCheckInActual.setHours(-1, 30, 0, 0); // 전날 23:30 UTC
  await prisma.session.upsert({
    where: { id: "session-jm-1" },
    update: {},
    create: {
      id: "session-jm-1",
      memberId: "박지민",
      date: todayStr,
      checkInTime: new Date(`${todayStr}T00:00:00.000Z`), // ~09:00 KST
      isLate: false,
    },
  });

  // 최수진: 완료 (09:00-13:30)
  await prisma.session.upsert({
    where: { id: "session-sj-1" },
    update: {},
    create: {
      id: "session-sj-1",
      memberId: "최수진",
      date: todayStr,
      checkInTime: new Date(`${todayStr}T00:00:00.000Z`),
      checkOutTime: new Date(`${todayStr}T04:30:00.000Z`),
      isLate: false,
    },
  });

  // 정민호: 지각 (10:30 체크인)
  await prisma.session.upsert({
    where: { id: "session-mh-1" },
    update: {},
    create: {
      id: "session-mh-1",
      memberId: "정민호",
      date: todayStr,
      checkInTime: new Date(`${todayStr}T01:30:00.000Z`), // 10:30 KST
      isLate: true,
    },
  });

  // 한지은: 휴가 4h
  await prisma.dailyVacation.upsert({
    where: { memberId_date: { memberId: "한지은", date: todayStr } },
    update: {},
    create: {
      memberId: "한지은",
      date: todayStr,
      hours: 4,
    },
  });

  // 월별 회비 데이터
  const feeData = [
    { memberId: "김철수", isPaid: true },
    { memberId: "이영희", isPaid: false },
    { memberId: "박지민", isPaid: true },
    { memberId: "정민호", isPaid: true },
  ];

  for (const f of feeData) {
    await prisma.monthlyFee.upsert({
      where: {
        memberId_month: { memberId: f.memberId, month: currentMonth },
      },
      update: {},
      create: { ...f, month: currentMonth },
    });
  }

  console.log("Seeded sample sessions, vacations, and fees");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
