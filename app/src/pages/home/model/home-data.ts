type PaymentStatus = "UNPAID" | "PENDING" | "PAID";

export interface HomeMember {
  id: string;
  name: string;
  displayName: string;
  color: string;
  currentStatus: string;
  todayStudyMinutes: number;
  todayVacationHours: number | null;
}

export interface AttendanceSummary {
  total: number;
  attended: number;
  studying: number;
  late: number;
}

export interface HomeFeeStatus {
  monthlyFee: number;
  monthlyFeeStatus: PaymentStatus;
  lateFee: number;
  lateFeeStatus: PaymentStatus;
  lateCount: number;
}

export interface HomeActiveSession {
  id: string;
  checkInTime: string;
  isLate: boolean;
}

export interface HomeData {
  members: HomeMember[];
  summary: AttendanceSummary;
  me: HomeMember | null;
  myFee: HomeFeeStatus | null;
  activeSession: HomeActiveSession | null;
}

interface RawHomeData {
  members: HomeMember[];
  todayAttendanceSummary: AttendanceSummary;
  feeStatus?: Array<{
    member: { id: string };
    lateFee: number;
    monthlyFee: number;
    monthlyFeeStatus: string;
    lateFeeStatus: string;
    lateCount: number;
  }> | null;
}

interface RawActiveSessionData {
  activeSession?: HomeActiveSession | null;
}

export function toHomeData(
  data: RawHomeData,
  sessionData: RawActiveSessionData | undefined,
  memberId: string | null,
): HomeData {
  const members = data.members.map((member) => ({
    id: member.id,
    name: member.name,
    displayName: member.displayName,
    color: member.color,
    currentStatus: member.currentStatus,
    todayStudyMinutes: member.todayStudyMinutes,
    todayVacationHours: member.todayVacationHours,
  }));

  const me = members.find((member) => member.id === memberId) ?? null;
  const rawFee = data.feeStatus?.find((fee) => fee.member.id === memberId);
  const myFee = rawFee
    ? {
        monthlyFee: rawFee.monthlyFee,
        monthlyFeeStatus: rawFee.monthlyFeeStatus as PaymentStatus,
        lateFee: rawFee.lateFee,
        lateFeeStatus: rawFee.lateFeeStatus as PaymentStatus,
        lateCount: rawFee.lateCount,
      }
    : null;

  return {
    members,
    summary: {
      total: data.todayAttendanceSummary.total,
      attended: data.todayAttendanceSummary.attended,
      studying: data.todayAttendanceSummary.studying,
      late: data.todayAttendanceSummary.late,
    },
    me,
    myFee,
    activeSession: sessionData?.activeSession ?? null,
  };
}
