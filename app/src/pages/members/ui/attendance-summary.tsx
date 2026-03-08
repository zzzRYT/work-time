import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type AttendanceSummaryProps = {
  total: number;
  attended: number;
  studying: number;
  late: number;
  className?: string;
};

export function AttendanceSummary({
  total,
  attended,
  studying,
  late,
  className,
}: AttendanceSummaryProps) {
  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        오늘 출석 현황
      </Text>
      <View className="flex-row">
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-500">전체</Text>
          <Text className="text-2xl font-bold text-gray-900">{total}</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-500">출석</Text>
          <Text className="text-2xl font-bold text-studying">{attended}</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-500">공부중</Text>
          <Text className="text-2xl font-bold text-primary">{studying}</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-500">지각</Text>
          <Text className="text-2xl font-bold text-late">{late}</Text>
        </View>
      </View>
    </View>
  );
}
