import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type Member = {
  id: string;
  displayName: string;
  color: string;
  role: "ADMIN" | "MEMBER";
};

type RoleSectionProps = {
  members: readonly Member[];
  onRoleChange: (memberId: string, newRole: "ADMIN" | "MEMBER") => void;
  className?: string;
};

export function RoleSection({ members, onRoleChange, className }: RoleSectionProps) {
  const adminCount = members.filter((m) => m.role === "ADMIN").length;

  return (
    <View className={cn("bg-surface rounded-lg p-4 border border-border", className)}>
      <Text className="text-base font-semibold text-text-primary mb-3">
        관리자 지정
      </Text>
      {members.map((m) => {
        const isAdmin = m.role === "ADMIN";
        const isLastAdmin = isAdmin && adminCount <= 1;

        return (
          <View
            key={m.id}
            className="flex-row items-center py-3 border-b border-border"
          >
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: m.color }}
            >
              <Text className="text-white text-xs font-bold">
                {m.displayName.charAt(0)}
              </Text>
            </View>

            <Text className="flex-1 text-sm font-medium text-text-primary">
              {m.displayName}
            </Text>

            <View
              className={cn(
                "rounded-full px-2 py-0.5 mr-2",
                isAdmin ? "bg-primary/20" : "bg-surface"
              )}
            >
              <Text
                className={cn(
                  "text-xs font-semibold",
                  isAdmin ? "text-primary" : "text-text-muted"
                )}
              >
                {isAdmin ? "관리자" : "멤버"}
              </Text>
            </View>

            <Pressable
              className={cn(
                "rounded-full px-3 py-1 border",
                isAdmin
                  ? isLastAdmin
                    ? "border-border"
                    : "border-late"
                  : "border-studying"
              )}
              onPress={() =>
                onRoleChange(m.id, isAdmin ? "MEMBER" : "ADMIN")
              }
              disabled={isLastAdmin}
            >
              <Text
                className={cn(
                  "text-xs font-semibold",
                  isAdmin
                    ? isLastAdmin
                      ? "text-text-subtle"
                      : "text-late"
                    : "text-studying"
                )}
              >
                {isAdmin ? "해제" : "지정"}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
