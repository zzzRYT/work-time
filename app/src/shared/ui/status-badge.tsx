import { Text, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@shared/lib/cn";

const badgeVariants = cva("rounded-full px-3 py-1", {
  variants: {
    status: {
      NOT_ATTENDED: "bg-done-bg",
      STUDYING: "bg-studying-bg",
      COMPLETED: "bg-done-bg",
      LATE: "bg-late-bg",
      VACATION: "bg-vacation-bg",
    },
  },
  defaultVariants: {
    status: "NOT_ATTENDED",
  },
});

const textVariants = cva("text-[12px] font-semibold", {
  variants: {
    status: {
      NOT_ATTENDED: "text-text-muted",
      STUDYING: "text-studying",
      COMPLETED: "text-done",
      LATE: "text-late",
      VACATION: "text-vacation",
    },
  },
  defaultVariants: {
    status: "NOT_ATTENDED",
  },
});

const STATUS_LABEL: Record<string, string> = {
  NOT_ATTENDED: "미출석",
  STUDYING: "공부중",
  COMPLETED: "완료",
  LATE: "지각",
  VACATION: "휴가",
};

type StatusBadgeProps = VariantProps<typeof badgeVariants> & {
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <View className={cn(badgeVariants({ status }), className)}>
      <Text className={textVariants({ status })}>
        {STATUS_LABEL[status ?? "NOT_ATTENDED"]}
      </Text>
    </View>
  );
}
