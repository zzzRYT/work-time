import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { StatusBadge } from "./status-badge";

type MemberRowProps = {
  name: string;
  displayName: string;
  color: string;
  status: "NOT_ATTENDED" | "STUDYING" | "COMPLETED" | "LATE" | "VACATION";
  studyMinutes?: number;
  className?: string;
};

function formatStudyTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return `${h}h ${m}m`;
}

export function MemberRow({
  name,
  displayName,
  color,
  status,
  studyMinutes,
  className,
}: MemberRowProps) {
  const isNotAttended = status === "NOT_ATTENDED";

  return (
    <View
      className={cn(
        "flex-row items-center py-3 px-4",
        isNotAttended && "opacity-50",
        className
      )}
    >
      <View className="relative mr-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Text className="text-white font-bold text-sm">
            {displayName.charAt(0)}
          </Text>
        </View>
        {status === "STUDYING" && (
          <View className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-studying border-2 border-surface" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-text-primary">
          {displayName}
        </Text>
        {studyMinutes != null && studyMinutes > 0 && (
          <Text className="text-xs text-text-muted">
            {formatStudyTime(studyMinutes)}
          </Text>
        )}
      </View>
      <StatusBadge status={status} />
    </View>
  );
}
