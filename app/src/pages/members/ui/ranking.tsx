import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { useMemberStore } from "@shared/store/member";

type RankingEntry = {
  member: { id: string; displayName: string; color: string };
  totalStudyMinutes: number;
  attendanceDays: number;
  lateCount: number;
};

type RankingProps = {
  weeklyRanking: RankingEntry[];
  monthlyRanking: RankingEntry[];
  className?: string;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export function Ranking({
  weeklyRanking,
  monthlyRanking,
  className,
}: RankingProps) {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const ranking = tab === "weekly" ? weeklyRanking : monthlyRanking;
  const selectedMemberId = useMemberStore((s) => s.selectedMemberId);

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        랭킹
      </Text>
      <View className="flex-row mb-3 bg-gray-100 rounded-lg p-1">
        <Pressable
          className={cn(
            "flex-1 py-2 rounded-md items-center",
            tab === "weekly" && "bg-white shadow-sm"
          )}
          onPress={() => setTab("weekly")}
        >
          <Text
            className={cn(
              "text-sm font-medium",
              tab === "weekly" ? "text-primary" : "text-gray-500"
            )}
          >
            주간
          </Text>
        </Pressable>
        <Pressable
          className={cn(
            "flex-1 py-2 rounded-md items-center",
            tab === "monthly" && "bg-white shadow-sm"
          )}
          onPress={() => setTab("monthly")}
        >
          <Text
            className={cn(
              "text-sm font-medium",
              tab === "monthly" ? "text-primary" : "text-gray-500"
            )}
          >
            월간
          </Text>
        </Pressable>
      </View>

      {ranking.length === 0 ? (
        <View className="items-center py-6">
          <Text className="text-gray-400 text-sm">
            {tab === "weekly" ? "이번 주" : "이번 달"} 기록이 없습니다
          </Text>
        </View>
      ) : (
        ranking.map((entry, i) => {
          const isMe = entry.member.id === selectedMemberId;
          const medal = MEDALS[i];

          return (
            <View
              key={entry.member.id}
              className={cn(
                "flex-row items-center py-3 border-b border-gray-100",
                isMe && "bg-primary/5 -mx-2 px-2 rounded-lg border-l-2 border-l-primary"
              )}
            >
              <Text className="w-8 text-center text-lg">
                {medal ?? `${i + 1}`}
              </Text>
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: entry.member.color }}
              >
                <Text className="text-white text-xs font-bold">
                  {entry.member.displayName.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-medium text-gray-900">
                    {entry.member.displayName}
                  </Text>
                  {isMe && (
                    <Text className="text-xs text-primary font-medium">(나)</Text>
                  )}
                </View>
                <Text className="text-xs text-gray-500">
                  {entry.attendanceDays}일 · 지각 {entry.lateCount}회
                </Text>
              </View>
              <Text className="text-sm font-bold text-primary">
                {formatMinutes(entry.totalStudyMinutes)}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}
