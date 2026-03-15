import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { cn } from "@shared/lib/cn";
import { StatusBadge } from "@shared/ui/status-badge";
import { FULL_DAY_VACATION_HOURS } from "@shared/constants/cohort";
import { Timer } from "./timer";
import { CheckButton } from "./check-button";
import { LateAlert } from "./late-alert";

type AttendanceCardProps = {
  date: string;
  status: "NOT_ATTENDED" | "STUDYING" | "COMPLETED" | "LATE" | "VACATION";
  checkInTime: string | null;
  isLate: boolean;
  todayStudyMinutes: number;
  vacationHours: number | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
  checkInLoading?: boolean;
  checkOutLoading?: boolean;
  networkOffline?: boolean;
  className?: string;
};

function getButtonState(
  status: string
): "idle" | "studying" | "completed" {
  if (status === "STUDYING") return "studying";
  if (status === "COMPLETED" || status === "LATE") return "completed";
  return "idle";
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = DAY_NAMES[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${day})`;
}

function formatTotalStudy(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

function useRealtimeTotal(
  todayStudyMinutes: number,
  checkInTime: string | null,
  isStudying: boolean
): string {
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    if (!isStudying || !checkInTime) {
      setExtra(0);
      return;
    }
    const start = new Date(checkInTime).getTime();
    function tick() {
      setExtra(Math.floor((Date.now() - start) / 60_000));
    }
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [checkInTime, isStudying]);

  return formatTotalStudy(todayStudyMinutes + extra);
}

export function AttendanceCard({
  date,
  status,
  checkInTime,
  isLate,
  todayStudyMinutes,
  vacationHours,
  onCheckIn,
  onCheckOut,
  checkInLoading = false,
  checkOutLoading = false,
  networkOffline = false,
  className,
}: AttendanceCardProps) {
  const isVacation = status === "VACATION";
  const isFullDayVacation = vacationHours === FULL_DAY_VACATION_HOURS;
  const buttonState = getButtonState(status);
  const isStudying = status === "STUDYING";
  const totalDisplay = useRealtimeTotal(todayStudyMinutes, checkInTime, isStudying);
  const loading = checkInLoading || checkOutLoading;

  return (
    <View
      className={cn(
        "bg-white rounded-2xl p-6 shadow-sm border",
        isLate ? "border-red-300 bg-red-50/30" : "border-transparent",
        className
      )}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">{formatDate(date)}</Text>
        <View className="flex-row items-center gap-2">
          <StatusBadge status={status} />
          {isLate && status !== "LATE" && <StatusBadge status="LATE" />}
        </View>
      </View>

      {networkOffline && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 mb-3">
          <Text className="text-yellow-700 text-xs text-center">
            네트워크 연결을 확인하세요
          </Text>
        </View>
      )}

      {/* S-03-5: 반차 휴가 정보 */}
      {vacationHours != null && vacationHours > 0 && !isFullDayVacation && (
        <View className="bg-vacation/10 rounded-lg px-3 py-2 mb-3">
          <Text className="text-vacation text-sm font-medium text-center">
            휴가 {vacationHours}h 사용
          </Text>
        </View>
      )}

      {/* S-03-6: 전일 휴가 */}
      {isFullDayVacation || isVacation ? (
        <View className="items-center py-8">
          <Text className="text-2xl text-vacation font-bold mb-2">
            오늘은 휴가입니다
          </Text>
        </View>
      ) : (
        <>
          <Timer checkInTime={isStudying ? checkInTime : null} isLate={isLate} />

          <Text className="text-sm text-gray-500 text-center mb-2">
            오늘 총 공부: {totalDisplay}
          </Text>

          <LateAlert isLate={isLate} className="mb-4" />

          <CheckButton
            state={buttonState}
            onPress={buttonState === "studying" ? onCheckOut : onCheckIn}
            loading={loading}
            disabled={networkOffline}
          />
        </>
      )}
    </View>
  );
}
