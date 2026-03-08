import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type LateAlertProps = {
  isLate: boolean;
  className?: string;
};

export function LateAlert({ isLate, className }: LateAlertProps) {
  if (!isLate) return null;

  return (
    <View
      className={cn(
        "bg-late/10 border border-late/30 rounded-xl px-4 py-3",
        className
      )}
    >
      <Text className="text-late text-sm font-medium">
        지각입니다. 지각비 1,000원이 부과됩니다.
      </Text>
    </View>
  );
}
