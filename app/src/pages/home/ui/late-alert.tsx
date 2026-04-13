import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import {
  LATE_FEE_AMOUNT,
  STUDY_START_HOUR,
  STUDY_START_MINUTE,
} from "@shared/constants/cohort";

type LateAlertProps = {
  isLate: boolean;
  className?: string;
};

export function LateAlert({ isLate, className }: LateAlertProps) {
  if (!isLate) return null;

  const startTime = `${String(STUDY_START_HOUR).padStart(2, "0")}:${String(STUDY_START_MINUTE).padStart(2, "0")}`;

  return (
    <View
      className={cn(
        "bg-late/10 border border-late/30 rounded-lg px-4 py-3",
        className
      )}
    >
      <Text className="text-late text-sm font-medium">
        지각비 {LATE_FEE_AMOUNT.toLocaleString()}원 (기준: {startTime})
      </Text>
    </View>
  );
}
