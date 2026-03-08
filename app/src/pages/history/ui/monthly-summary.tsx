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
  return `${h}시간 ${m}분`;
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
    { label: "일 평균", value: formatMinutes(averageDailyMinutes), color: "text-gray-900" },
    { label: "지각", value: `${lateCount}회`, color: "text-late" },
    { label: "휴가", value: `${vacationDays}일`, color: "text-vacation" },
    { label: "지각비", value: `${totalLateFee.toLocaleString()}원`, color: "text-late" },
  ];

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        월간 요약
      </Text>
      <View className="flex-row flex-wrap gap-y-3">
        {items.map((item) => (
          <View key={item.label} className="w-1/3 items-center">
            <Text className="text-xs text-gray-500">{item.label}</Text>
            <Text className={cn("text-base font-bold", item.color)}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
