import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { VACATION_UNITS, FULL_DAY_VACATION_HOURS } from "@shared/constants/cohort";

type VacationButtonProps = {
  onUseVacation: (hours: number) => Promise<void>;
  disabled?: boolean;
  className?: string;
};

export function VacationButton({
  onUseVacation,
  disabled,
  className,
}: VacationButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await onUseVacation(selected);
    } finally {
      setLoading(false);
      setExpanded(false);
      setSelected(null);
    }
  };

  if (!expanded) {
    return (
      <Pressable
        className={cn(
          "bg-vacation/10 border border-vacation/30 rounded-xl py-3 px-4 items-center",
          disabled && "opacity-50",
          className
        )}
        onPress={() => setExpanded(true)}
        disabled={disabled}
      >
        <Text className="text-vacation font-semibold">휴가 사용</Text>
      </Pressable>
    );
  }

  return (
    <View className={cn("bg-vacation/10 rounded-xl p-4", className)}>
      <Text className="text-vacation font-semibold mb-3">휴가 시간 선택</Text>
      <View className="flex-row gap-2 mb-3">
        {VACATION_UNITS.map((hours) => (
          <Pressable
            key={hours}
            className={cn(
              "flex-1 rounded-lg py-2.5 items-center border",
              selected === hours
                ? "bg-vacation border-vacation"
                : "bg-white border-vacation/30"
            )}
            onPress={() => setSelected(hours)}
          >
            <Text
              className={cn(
                "font-bold",
                selected === hours ? "text-white" : "text-vacation"
              )}
            >
              {hours}h
            </Text>
          </Pressable>
        ))}
      </View>

      {selected === FULL_DAY_VACATION_HOURS && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3">
          <Text className="text-yellow-700 text-xs">
            전일 휴가로 처리되며, 오늘 체크인이 불가합니다
          </Text>
        </View>
      )}

      <Pressable
        className={cn(
          "bg-vacation rounded-xl py-3 items-center",
          (!selected || loading) && "opacity-50"
        )}
        onPress={handleConfirm}
        disabled={!selected || loading}
      >
        <Text className="text-white font-bold">
          {loading ? "등록 중..." : "확인"}
        </Text>
      </Pressable>

      <Pressable
        className="mt-2 items-center py-2"
        onPress={() => {
          setExpanded(false);
          setSelected(null);
        }}
      >
        <Text className="text-gray-500 text-sm">취소</Text>
      </Pressable>
    </View>
  );
}
