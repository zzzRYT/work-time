import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { MemberRow } from "@shared/ui/member-row";

type Member = {
  id: string;
  name: string;
  displayName: string;
  color: string;
  currentStatus: "NOT_ATTENDED" | "STUDYING" | "COMPLETED" | "LATE" | "VACATION";
  todayStudyMinutes: number;
};

type MemberListProps = {
  members: Member[];
  className?: string;
};

export function MemberList({ members, className }: MemberListProps) {
  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-2 px-2">
        스터디원 ({members.length})
      </Text>
      {members.map((m) => (
        <MemberRow
          key={m.id}
          name={m.name}
          displayName={m.displayName}
          color={m.color}
          status={m.currentStatus}
        />
      ))}
    </View>
  );
}
