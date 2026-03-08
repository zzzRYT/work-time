import { View, Text } from "react-native";
import { cn } from "@shared/lib/cn";
import { StatusBadge } from "@shared/ui/status-badge";
import { Timer } from "./timer";
import { CheckButton } from "./check-button";
import { LateAlert } from "./late-alert";

type AttendanceCardProps = {
  date: string;
  status: "NOT_ATTENDED" | "STUDYING" | "COMPLETED" | "LATE" | "VACATION";
  checkInTime: string | null;
  isLate: boolean;
  todayStudyMinutes: number;
  onCheckIn: () => void;
  onCheckOut: () => void;
  className?: string;
};

function getButtonState(
  status: string
): "idle" | "studying" | "completed" {
  if (status === "STUDYING") return "studying";
  if (status === "COMPLETED" || status === "LATE") return "completed";
  return "idle";
}

export function AttendanceCard({
  date,
  status,
  checkInTime,
  isLate,
  todayStudyMinutes,
  onCheckIn,
  onCheckOut,
  className,
}: AttendanceCardProps) {
  const buttonState = getButtonState(status);

  return (
    <View
      className={cn("bg-white rounded-2xl p-6 shadow-sm", className)}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">{date}</Text>
        <StatusBadge status={status} />
      </View>

      <Timer checkInTime={status === "STUDYING" ? checkInTime : null} />

      {todayStudyMinutes > 0 && (
        <Text className="text-sm text-gray-500 text-center mb-2">
          오늘 총 공부: {Math.floor(todayStudyMinutes / 60)}시간 {todayStudyMinutes % 60}분
        </Text>
      )}

      <LateAlert isLate={isLate} className="mb-4" />

      <CheckButton
        state={buttonState}
        onPress={buttonState === "studying" ? onCheckOut : onCheckIn}
      />
    </View>
  );
}
