import { ActivityIndicator, Pressable, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@shared/lib/cn";

const buttonVariants = cva("rounded-2xl py-4 px-8 items-center justify-center", {
  variants: {
    state: {
      idle: "bg-primary",
      studying: "bg-red-500",
      completed: "border-2 border-gray-300 bg-white",
    },
  },
  defaultVariants: {
    state: "idle",
  },
});

const LABEL: Record<string, string> = {
  idle: "체크인",
  studying: "체크아웃",
  completed: "다시 체크인",
};

type CheckButtonProps = VariantProps<typeof buttonVariants> & {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

export function CheckButton({
  state,
  onPress,
  loading = false,
  disabled = false,
  className,
}: CheckButtonProps) {
  const s = state ?? "idle";
  const isCompleted = s === "completed";
  const isDisabled = loading || disabled;
  const textColor = isCompleted ? "text-gray-600" : "text-white";

  return (
    <Pressable
      className={cn(buttonVariants({ state }), isDisabled && "opacity-60", className)}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={isCompleted ? "#6B7280" : "#fff"} />
      ) : (
        <Text className={cn("text-lg font-bold", textColor)}>
          {LABEL[s]}
        </Text>
      )}
    </Pressable>
  );
}
