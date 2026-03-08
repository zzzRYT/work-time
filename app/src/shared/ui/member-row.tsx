import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { StatusBadge } from "./status-badge";

type MemberRowProps = {
  name: string;
  displayName: string;
  color: string;
  status: "NOT_ATTENDED" | "STUDYING" | "COMPLETED" | "LATE" | "VACATION";
  className?: string;
};

export function MemberRow({
  name,
  displayName,
  color,
  status,
  className,
}: MemberRowProps) {
  return (
    <View className={cn("flex-row items-center py-3 px-4", className)}>
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: color }}
      >
        <Text className="text-white font-bold text-sm">
          {displayName.charAt(0)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">
          {displayName}
        </Text>
        <Text className="text-xs text-gray-500">{name}</Text>
      </View>
      <StatusBadge status={status} />
    </View>
  );
}
