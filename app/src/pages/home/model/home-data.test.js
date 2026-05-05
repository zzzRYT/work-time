import { describe, expect, it } from "bun:test";
import { toHomeData } from "./home-data";

const members = [
  {
    id: "member-1",
    name: "Lee",
    displayName: "재진",
    color: "#111111",
    currentStatus: "STUDYING",
    todayStudyMinutes: 90,
    todayVacationHours: null,
  },
  {
    id: "member-2",
    name: "Kim",
    displayName: "민수",
    color: "#222222",
    currentStatus: "NOT_ATTENDED",
    todayStudyMinutes: 0,
    todayVacationHours: 2,
  },
];

describe("toHomeData", () => {
  it("selects the current member, fee status, and active session from raw query data", () => {
    const result = toHomeData(
      {
        members,
        todayAttendanceSummary: {
          total: 2,
          attended: 1,
          studying: 1,
          late: 0,
        },
        feeStatus: [
          {
            member: { id: "member-2" },
            lateFee: 0,
            monthlyFee: 10000,
            monthlyFeeStatus: "PAID",
            lateFeeStatus: "PAID",
            lateCount: 0,
          },
          {
            member: { id: "member-1" },
            lateFee: 2000,
            monthlyFee: 10000,
            monthlyFeeStatus: "UNPAID",
            lateFeeStatus: "PENDING",
            lateCount: 2,
          },
        ],
      },
      {
        activeSession: {
          id: "session-1",
          checkInTime: "2026-05-05T01:00:00.000Z",
          isLate: true,
        },
      },
      "member-1",
    );

    expect(result.me?.id).toBe("member-1");
    expect(result.summary.studying).toBe(1);
    expect(result.myFee).toEqual({
      monthlyFee: 10000,
      monthlyFeeStatus: "UNPAID",
      lateFee: 2000,
      lateFeeStatus: "PENDING",
      lateCount: 2,
    });
    expect(result.activeSession).toEqual({
      id: "session-1",
      checkInTime: "2026-05-05T01:00:00.000Z",
      isLate: true,
    });
  });

  it("returns null member-specific data when no member is selected", () => {
    const result = toHomeData(
      {
        members,
        todayAttendanceSummary: {
          total: 2,
          attended: 1,
          studying: 1,
          late: 0,
        },
        feeStatus: [],
      },
      undefined,
      null,
    );

    expect(result.me).toBeNull();
    expect(result.myFee).toBeNull();
    expect(result.activeSession).toBeNull();
  });
});
