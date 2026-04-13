import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type MonthlySummaryProps = {
  attendanceDays: number;
  totalStudyMinutes: number;
  averageDailyMinutes: number;
  lateCount: number;
  vacationDays: number;
  totalLateFee: number;
  className?: string;
};

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return `${h}h ${m}m`;
}

export function MonthlySummary({
  attendanceDays,
  totalStudyMinutes,
  averageDailyMinutes,
  lateCount,
  vacationDays,
  totalLateFee,
  className,
}: MonthlySummaryProps) {
  const items = [
    { label: "출석일", value: `${attendanceDays}일`, color: "text-studying" },
    { label: "총 공부", value: formatMinutes(totalStudyMinutes), color: "text-primary" },
    { label: "일 평균", value: formatMinutes(averageDailyMinutes), color: "text-text-primary" },
    { label: "지각", value: `${lateCount}회`, color: "text-late" },
    { label: "휴가", value: `${vacationDays}일`, color: "text-vacation" },
    { label: "지각비", value: `${totalLateFee.toLocaleString()}원`, color: "text-late" },
  ];

  const allZero =
    attendanceDays === 0 &&
    totalStudyMinutes === 0 &&
    lateCount === 0 &&
    vacationDays === 0;

  return (
    <View className={cn("bg-surface rounded-lg p-4", className)}>
      <Text className="text-base font-semibold text-text-primary mb-3">
        월간 요약
      </Text>
      {allZero ? (
        <View className="items-center py-4">
          <Text className="text-text-subtle text-sm">이 달의 기록이 없습니다</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-y-3">
          {items.map((item) => (
            <View key={item.label} className="w-1/3 items-center">
              <Text className="text-xs text-text-muted">{item.label}</Text>
              <Text className={cn("text-base font-bold", item.color)}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
