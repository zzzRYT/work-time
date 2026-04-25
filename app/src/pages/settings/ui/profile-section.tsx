import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "@shared/store/auth";
import { apolloClient } from "@shared/lib/apollo";
import { router } from "expo-router";

type ProfileSectionProps = {
  memberName: string;
  memberColor: string;
  className?: string;
};

export function ProfileSection({ memberName, memberColor, className }: ProfileSectionProps) {
  const signOut = useAuthStore((s) => s.signOut);
  const clearWorkspace = useAuthStore((s) => s.clearWorkspace);

  const handleSwitchWorkspace = async () => {
    clearWorkspace();
    await apolloClient.clearStore();
    router.replace("/workspaces");
  };

  const handleSignOut = async () => {
    await signOut();
    await apolloClient.clearStore();
    router.replace("/login");
  };

  return (
    <View className={className}>
      <View
        className="bg-surface rounded-lg p-4 border border-border"
        style={{ shadowColor: "#2C1F14", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
      >
        <View className="flex-row items-center mb-4">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: memberColor }}
          >
            <Text className="text-white text-[17px] font-bold">
              {memberName.charAt(0)}
            </Text>
          </View>
          <Text className="text-[17px] font-bold text-text-primary">
            {memberName}
          </Text>
        </View>

        <Pressable
          className="border border-border rounded-lg py-3 items-center mb-2"
          onPress={handleSwitchWorkspace}
        >
          <Text className="text-text-muted text-[13px] font-medium">
            워크스페이스 전환
          </Text>
        </Pressable>

        <Pressable className="py-3 items-center" onPress={handleSignOut}>
          <Text className="text-text-subtle text-[13px]">로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}
