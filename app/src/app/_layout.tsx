import "../../global.css";
import { initSentry } from "@shared/lib/sentry";
initSentry();

import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { Providers } from "@app/providers";
import { useMemberStore } from "@shared/store/member";
import { Text, View } from "react-native";

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { selectedMemberId, isLoaded } = useMemberStore();

  useEffect(() => {
    if (!isLoaded) return;

    const onSelectScreen = segments[0] === "select-member";

    if (!selectedMemberId && !onSelectScreen) {
      router.replace("/select-member");
    }
  }, [selectedMemberId, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-gray-400">로딩중...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const hydrate = useMemberStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
