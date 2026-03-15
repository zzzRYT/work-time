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
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        관리자 지정
      </Text>
      {members.map((m) => {
        const isAdmin = m.role === "ADMIN";
        const isLastAdmin = isAdmin && adminCount <= 1;

        return (
          <View
            key={m.id}
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: m.color }}
            >
              <Text className="text-white text-xs font-bold">
                {m.displayName.charAt(0)}
              </Text>
            </View>

            <Text className="flex-1 text-sm font-medium text-gray-900">
              {m.displayName}
            </Text>

            <View
              className={cn(
                "rounded-full px-2 py-0.5 mr-2",
                isAdmin ? "bg-primary/20" : "bg-gray-100"
              )}
            >
              <Text
                className={cn(
                  "text-xs font-semibold",
                  isAdmin ? "text-primary" : "text-gray-500"
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
                    ? "border-gray-200"
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
                      ? "text-gray-300"
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
