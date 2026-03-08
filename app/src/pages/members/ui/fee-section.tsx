import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type FeeEntry = {
  member: { id: string; displayName: string; color: string };
  lateFee: number;
  monthlyFee: number;
  isPaid: boolean;
  lateCount: number;
};

type FeeSectionProps = {
  entries: FeeEntry[];
  onTogglePayment: (memberId: string) => void;
  className?: string;
};

export function FeeSection({
  entries,
  onTogglePayment,
  className,
}: FeeSectionProps) {
  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        회비 현황
      </Text>
      {entries.map((e) => (
        <View
          key={e.member.id}
          className="flex-row items-center py-3 border-b border-gray-100"
        >
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: e.member.color }}
          >
            <Text className="text-white text-xs font-bold">
              {e.member.displayName.charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-900">
              {e.member.displayName}
            </Text>
            <Text className="text-xs text-gray-500">
              지각 {e.lateCount}회 · 지각비 {e.lateFee.toLocaleString()}원
            </Text>
          </View>
          <Pressable
            className={cn(
              "rounded-full px-3 py-1",
              e.isPaid ? "bg-studying/20" : "bg-late/20"
            )}
            onPress={() => onTogglePayment(e.member.id)}
          >
            <Text
              className={cn(
                "text-xs font-semibold",
                e.isPaid ? "text-studying" : "text-late"
              )}
            >
              {e.isPaid ? "납부" : "미납"}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
