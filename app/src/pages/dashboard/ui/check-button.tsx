import { Pressable, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@shared/lib/cn";

const buttonVariants = cva(
  "rounded-2xl py-4 px-8 items-center justify-center",
  {
    variants: {
      state: {
        idle: "bg-primary",
        studying: "bg-red-500",
        completed: "bg-done opacity-50",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
);

const LABEL: Record<string, string> = {
  idle: "체크인",
  studying: "체크아웃",
  completed: "완료",
};

type CheckButtonProps = VariantProps<typeof buttonVariants> & {
  onPress: () => void;
  className?: string;
};

export function CheckButton({ state, onPress, className }: CheckButtonProps) {
  const disabled = state === "completed";

  return (
    <Pressable
      className={cn(buttonVariants({ state }), className)}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text-white text-lg font-bold">
        {LABEL[state ?? "idle"]}
      </Text>
    </Pressable>
  );
}
