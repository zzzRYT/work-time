import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type CheckButtonProps = {
  state: "idle" | "studying" | "completed";
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

export function CheckButton({ state, onPress, loading, disabled, className }: CheckButtonProps) {
  const label = state === "idle" ? "체크인" : state === "studying" ? "체크아웃" : "다시 체크인";

  return (
    <Pressable
      className={cn(
        "rounded-lg py-4 items-center",
        state === "studying" ? "bg-white" : state === "idle" ? "bg-white" : "bg-white/20 border border-white/40",
        (loading || disabled) && "opacity-50",
        className
      )}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <View className="h-[22px] items-center justify-center">
        {loading ? (
          <ActivityIndicator color="#F07A5A" size={20} />
        ) : (
          <Text
            className={cn(
              "text-[17px] font-bold leading-[22px]",
              state === "completed" ? "text-white" : "text-primary"
            )}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
