import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { VACATION_UNITS } from "@shared/constants/cohort";

type VacationButtonProps = {
  onUseVacation: (hours: number) => void;
  disabled?: boolean;
  className?: string;
};

export function VacationButton({
  onUseVacation,
  disabled,
  className,
}: VacationButtonProps) {
  const [expanded, setExpanded] = useState(false);

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
      <View className="flex-row gap-2">
        {VACATION_UNITS.map((hours) => (
          <Pressable
            key={hours}
            className="flex-1 bg-vacation rounded-lg py-2 items-center"
            onPress={() => {
              onUseVacation(hours);
              setExpanded(false);
            }}
          >
            <Text className="text-white font-bold">{hours}h</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        className="mt-2 items-center py-2"
        onPress={() => setExpanded(false)}
      >
        <Text className="text-gray-500 text-sm">취소</Text>
      </Pressable>
    </View>
  );
}
