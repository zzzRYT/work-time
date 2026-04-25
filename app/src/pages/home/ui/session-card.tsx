import { View, Text } from "react-native";
import { cn } from "@shared/lib/cn";
import { Timer } from "./timer";
import { CheckButton } from "./check-button";

type SessionCardProps = {
  status: string;
  checkInTime: string | null;
  isLate: boolean;
  todayStudyMinutes: number;
  vacationHours: number | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
  loading: boolean;
  networkOffline: boolean;
  pendingAction?: "checkin" | "checkout" | null;
  optimisticCheckInTime?: string | null;
  className?: string;
};

function formatTotalStudy(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

function getButtonState(status: string): "idle" | "studying" | "completed" {
  if (status === "STUDYING") return "studying";
  if (status === "COMPLETED" || status === "LATE") return "completed";
  return "idle";
}

export function SessionCard({
  status,
  checkInTime,
  isLate,
  todayStudyMinutes,
  vacationHours,
  onCheckIn,
  onCheckOut,
  loading,
  networkOffline,
  pendingAction,
  optimisticCheckInTime,
  className,
}: SessionCardProps) {
  const effectiveStatus =
    pendingAction === "checkin" ? "STUDYING" :
    pendingAction === "checkout" ? "COMPLETED" :
    status;
  const effectiveCheckInTime =
    pendingAction === "checkin" ? (optimisticCheckInTime ?? null) :
    pendingAction === "checkout" ? null :
    checkInTime;
  const isStudying = effectiveStatus === "STUDYING";
  const isVacation = status === "VACATION" || (vacationHours != null && vacationHours >= 8);
  const buttonState = getButtonState(effectiveStatus);

  if (isVacation) {
    return (
      <View className={cn("bg-vacation rounded-lg p-6 items-center", className)}>
        <Text className="text-white text-[24px] font-bold mb-2">오늘은 휴가입니다</Text>
        {vacationHours != null && (
          <Text className="text-white/70 text-[13px]">{vacationHours}시간</Text>
        )}
      </View>
    );
  }

  return (
    <View
      className={cn(
        "rounded-lg p-6",
        isStudying ? "bg-primary" : "bg-surface border border-border",
        className
      )}
      style={
        !isStudying
          ? { shadowColor: "#2C1F14", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }
          : undefined
      }
    >
      {isLate && (
        <View className="bg-late-bg rounded-full px-3 py-1 mb-4 self-start">
          <Text className="text-late text-[11px] font-semibold">지각</Text>
        </View>
      )}

      <Timer checkInTime={isStudying ? effectiveCheckInTime : null} className="mb-2" />

      <Text
        className={cn(
          "text-[13px] text-center mb-6",
          isStudying ? "text-white/70" : "text-text-muted"
        )}
      >
        오늘 총 공부: {formatTotalStudy(todayStudyMinutes)}
      </Text>

      {networkOffline && (
        <View className="bg-late-bg rounded-lg px-3 py-2 mb-4">
          <Text className="text-late text-[11px] text-center">네트워크 연결을 확인하세요</Text>
        </View>
      )}

      <CheckButton
        state={buttonState}
        onPress={buttonState === "studying" ? onCheckOut : onCheckIn}
        loading={loading}
        disabled={networkOffline}
      />
    </View>
  );
}
