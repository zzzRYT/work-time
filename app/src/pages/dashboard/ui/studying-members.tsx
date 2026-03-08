import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { MemberRow } from "@shared/ui/member-row";

type Member = {
  id: string;
  name: string;
  displayName: string;
  color: string;
  currentStatus: "NOT_ATTENDED" | "STUDYING" | "COMPLETED" | "LATE" | "VACATION";
};

type StudyingMembersProps = {
  members: Member[];
  className?: string;
};

export function StudyingMembers({ members, className }: StudyingMembersProps) {
  const studying = members.filter((m) => m.currentStatus === "STUDYING");

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-2 px-2">
        공부중 ({studying.length})
      </Text>
      {studying.length === 0 ? (
        <Text className="text-gray-400 text-sm px-2 py-4">
          현재 공부중인 멤버가 없습니다.
        </Text>
      ) : (
        studying.map((m) => (
          <MemberRow
            key={m.id}
            name={m.name}
            displayName={m.displayName}
            color={m.color}
            status={m.currentStatus}
          />
        ))
      )}
    </View>
  );
}
