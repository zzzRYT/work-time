import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { MemberRow } from "@shared/ui/member-row";

type Member = {
  id: string;
  name: string;
  displayName: string;
  color: string;
  currentStatus: string;
  todayStudyMinutes: number;
};

type PresenceListProps = {
  members: Member[];
  className?: string;
};

export function PresenceList({ members, className }: PresenceListProps) {
  const studying = members.filter((m) => m.currentStatus === "STUDYING");
  const others = members.filter((m) => m.currentStatus !== "STUDYING");

  return (
    <View className={cn("bg-surface rounded-lg p-4 border border-border", className)}>
      <View className="flex-row items-center gap-2 mb-3 px-1">
        <Text className="text-[15px] font-semibold text-text-primary">
          지금 공부 중
        </Text>
        <View className="bg-primary-light rounded-full px-2.5 py-0.5">
          <Text className="text-primary text-[13px] font-bold">
            {studying.length}
          </Text>
        </View>
      </View>

      {studying.length === 0 ? (
        <View className="items-center py-6">
          <Text className="text-text-subtle text-[13px]">
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
            status={m.currentStatus as any}
            studyMinutes={m.todayStudyMinutes}
          />
        ))
      )}

      {others.length > 0 && (
        <>
          <View className="h-px bg-border my-3" />
          <Text className="text-[13px] text-text-muted mb-2 px-1">오프라인</Text>
          {others.map((m) => (
            <MemberRow
              key={m.id}
              name={m.name}
              displayName={m.displayName}
              color={m.color}
              status={m.currentStatus as any}
              studyMinutes={m.todayStudyMinutes}
            />
          ))}
        </>
      )}
    </View>
  );
}
