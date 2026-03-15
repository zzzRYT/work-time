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
      <View className="flex-row items-center gap-2 mb-2 px-2">
        <Text className="text-base font-semibold text-gray-900">
          지금 공부 중
        </Text>
        <View className="bg-primary/10 rounded-full px-2.5 py-0.5">
          <Text className="text-primary text-sm font-bold">
            {studying.length}명
          </Text>
        </View>
      </View>
      {studying.length === 0 ? (
        <View className="items-center py-6">
          <Text className="text-gray-400 text-sm">
            아직 아무도 시작 안 했어요
          </Text>
        </View>
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
