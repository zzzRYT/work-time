import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type PendingItem = {
  memberId: string;
  memberName: string;
  memberColor: string;
  type: "MONTHLY" | "LATE";
  label: string;
  amount: number;
};

type FeeConfirmSectionProps = {
  items: PendingItem[];
  onConfirm: (memberId: string, type: "MONTHLY" | "LATE") => void;
  onReject: (memberId: string, type: "MONTHLY" | "LATE") => void;
  className?: string;
};

export type { PendingItem };

export function FeeConfirmSection({
  items,
  onConfirm,
  onReject,
  className,
}: FeeConfirmSectionProps) {
  return (
    <View className={cn("bg-surface rounded-lg p-4 border border-border", className)}>
      <Text className="text-base font-semibold text-text-primary mb-3">
        납부 확인
      </Text>
      {items.length === 0 ? (
        <Text className="text-sm text-text-subtle text-center py-4">
          확인 대기 중인 항목이 없습니다
        </Text>
      ) : (
        items.map((item) => (
          <View
            key={`${item.memberId}-${item.type}`}
            className="py-3 border-b border-border"
          >
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: item.memberColor }}
              >
                <Text className="text-white text-xs font-bold">
                  {item.memberName.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-text-primary">
                  {item.memberName}
                </Text>
                <Text className="text-xs text-text-muted">
                  {item.label} · {item.amount.toLocaleString()}원
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2 mt-2 ml-11">
              <Pressable
                className="flex-1 rounded-xl py-2 items-center bg-studying/20"
                onPress={() => onConfirm(item.memberId, item.type)}
              >
                <Text className="text-sm font-semibold text-studying">확인</Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-xl py-2 items-center bg-late/20"
                onPress={() => onReject(item.memberId, item.type)}
              >
                <Text className="text-sm font-semibold text-late">거절</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
