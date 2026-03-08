import { Text, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@shared/lib/cn";

const badgeVariants = cva("rounded-full px-3 py-1", {
  variants: {
    status: {
      NOT_ATTENDED: "bg-gray-100",
      STUDYING: "bg-studying/20",
      COMPLETED: "bg-done/20",
      LATE: "bg-late/20",
      VACATION: "bg-vacation/20",
    },
  },
  defaultVariants: {
    status: "NOT_ATTENDED",
  },
});

const textVariants = cva("text-xs font-semibold", {
  variants: {
    status: {
      NOT_ATTENDED: "text-gray-500",
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
