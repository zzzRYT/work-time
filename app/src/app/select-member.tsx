import { FlatList, Pressable, Text, View } from "react-native";
import { useApolloClient, useQuery } from "@apollo/client";
import { graphql } from "@graphql";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemberStore } from "@shared/store/member";
import { router } from "expo-router";

const MEMBERS_QUERY = graphql(`
  query SelectMembers {
    members {
      id
      displayName
      color
    }
  }
`);

export default function SelectMemberScreen() {
  const client = useApolloClient();
  const { data, loading } = useQuery(MEMBERS_QUERY);
  const setSelectedMemberId = useMemberStore((s) => s.setSelectedMemberId);

  const members = data?.members ?? [];

  const handleSelect = async (id: string) => {
    setSelectedMemberId(id);
    await client.resetStore();
    router.replace("/(tabs)");
  };

  if (loading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-gray-400">로딩중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-4 pt-12">
        <Text className="text-3xl font-bold text-gray-900 text-center mb-8">
          누구세요?
        </Text>

        <FlatList
          data={members}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12 }}
          keyExtractor={(m) => m.id}
          renderItem={({ item: m }) => (
            <Pressable
              className="flex-1 bg-white rounded-2xl p-5 items-center active:scale-95"
              onPress={() => handleSelect(m.id)}
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: m.color }}
              >
                <Text className="text-white text-xl font-bold">
                  {m.displayName.charAt(0)}
                </Text>
              </View>
              <Text className="text-base font-medium text-gray-900">
                {m.displayName}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
