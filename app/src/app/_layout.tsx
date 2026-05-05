import "../../global.css";
import { initSentry } from "@shared/lib/sentry";
initSentry();

import { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { Slot, useRouter, useSegments } from "expo-router";
import { Providers } from "@shared/providers";
import { graphql } from "@graphql";
import { useAuthStore } from "@shared/store/auth";
import { Text, View } from "react-native";

const MY_WORKSPACES = graphql(`
  query RootMyWorkspaces {
    myWorkspaces {
      workspaceId
      memberId
    }
  }
`);

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { session, workspaceId, memberId, isLoaded, clearWorkspace } = useAuthStore();
  const hasPartialWorkspaceState =
    !!session && (!!workspaceId !== !!memberId);
  const shouldValidateWorkspace =
    isLoaded && !!session && !!workspaceId && !!memberId;
  const { data, loading } = useQuery(MY_WORKSPACES, {
    skip: !shouldValidateWorkspace,
    fetchPolicy: "network-only",
  });
  const savedWorkspaceIsInvalid =
    shouldValidateWorkspace &&
    !!data &&
    !data.myWorkspaces.some(
      (membership) =>
        membership.workspaceId === workspaceId && membership.memberId === memberId
    );

  useEffect(() => {
    if (isLoaded && (hasPartialWorkspaceState || savedWorkspaceIsInvalid)) {
      clearWorkspace();
    }
  }, [isLoaded, hasPartialWorkspaceState, savedWorkspaceIsInvalid, clearWorkspace]);

  useEffect(() => {
    if (!isLoaded) return;
    if (shouldValidateWorkspace && !data) return;
    if (hasPartialWorkspaceState) return;
    if (savedWorkspaceIsInvalid) return;

    const inTabs = segments[0] === "(tabs)";
    const onLogin = segments[0] === "login";
    const onWorkspaces = segments[0] === "workspaces";

    if (!session && !onLogin) {
      router.replace("/login");
    } else if (session && !workspaceId && !onWorkspaces) {
      router.replace("/workspaces");
    } else if (session && workspaceId && memberId && !inTabs) {
      router.replace("/(tabs)");
    }
  }, [
    session,
    workspaceId,
    memberId,
    isLoaded,
    segments,
    hasPartialWorkspaceState,
    shouldValidateWorkspace,
    loading,
    data,
    savedWorkspaceIsInvalid,
  ]);

  if (
    !isLoaded ||
    hasPartialWorkspaceState ||
    (shouldValidateWorkspace && !data) ||
    savedWorkspaceIsInvalid
  ) {
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
