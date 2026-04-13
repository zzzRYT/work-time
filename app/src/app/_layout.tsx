import "../../global.css";
import { initSentry } from "@shared/lib/sentry";
initSentry();

import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { Providers } from "@app/providers";
import { useAuthStore } from "@shared/store/auth";
import { Text, View } from "react-native";

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { session, workspaceId, isLoaded } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;

    const inTabs = segments[0] === "(tabs)";
    const onLogin = segments[0] === "login";
    const onWorkspaces = segments[0] === "workspaces";

    if (!session && !onLogin) {
      router.replace("/login");
    } else if (session && !workspaceId && !onWorkspaces) {
      router.replace("/workspaces");
    } else if (session && workspaceId && !inTabs) {
      router.replace("/(tabs)");
    }
  }, [session, workspaceId, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-subtle">로딩중...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
