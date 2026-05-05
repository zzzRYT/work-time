import "../../global.css";
import { initSentry } from "@shared/lib/sentry";
initSentry();

import { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { Slot, useRouter, useSegments } from "expo-router";
import { Providers } from "@shared/providers";
import { graphql } from "@graphql";
import { useAuthStore } from "@shared/store/auth";
import { Alert, Text, View } from "react-native";
import {
  clearPendingInviteToken,
  getPendingInviteToken,
} from "@shared/lib/pending-invite";
import { useJoinWorkspaceByInvite } from "@shared/hooks/use-join-workspace-by-invite";

const TERMINAL_INVITE_FAILURE_MESSAGES = [
  "초대 링크가 올바르지 않습니다.",
  "만료된 초대입니다.",
  "이미 참여 중인 워크스페이스입니다.",
];

function isTerminalInviteFailure(error: unknown) {
  if (!(error instanceof Error)) return false;

  return TERMINAL_INVITE_FAILURE_MESSAGES.includes(error.message);
}

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
  const { session, workspaceId, memberId, isLoaded, clearWorkspace } =
    useAuthStore();
  const { joinByInvite, loading: inviteJoinLoading } = useJoinWorkspaceByInvite();
  const hasPartialWorkspaceState = !!session && (!!workspaceId !== !!memberId);
  const shouldValidateWorkspace =
    isLoaded && !!session && !!workspaceId && !!memberId;
  const { data } = useQuery(MY_WORKSPACES, {
    skip: !shouldValidateWorkspace,
    fetchPolicy: "network-only",
  });
  const savedWorkspaceIsInvalid =
    shouldValidateWorkspace &&
    !!data &&
    !data.myWorkspaces.some(
      (membership) =>
        membership.workspaceId === workspaceId &&
        membership.memberId === memberId,
    );

  useEffect(() => {
    if (isLoaded && (hasPartialWorkspaceState || savedWorkspaceIsInvalid)) {
      clearWorkspace();
    }
  }, [
    isLoaded,
    hasPartialWorkspaceState,
    savedWorkspaceIsInvalid,
    clearWorkspace,
  ]);

  useEffect(() => {
    if (!isLoaded || !session) return;

    let cancelled = false;

    async function resumePendingInvite() {
      let pendingToken: string | null;
      try {
        pendingToken = await getPendingInviteToken();
      } catch {
        if (!cancelled) {
          Alert.alert("초대 참여 실패", "초대 정보를 불러올 수 없습니다.");
        }
        return;
      }

      if (!pendingToken || cancelled) return;

      try {
        await joinByInvite(pendingToken);
      } catch (error) {
        if (isTerminalInviteFailure(error)) {
          await clearPendingInviteToken().catch(() => {});
        }

        if (!cancelled) {
          Alert.alert(
            "초대 참여 실패",
            error instanceof Error
              ? error.message
              : "워크스페이스 참여에 실패했습니다.",
          );
        }
      }
    }

    resumePendingInvite();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, joinByInvite, session]);

  useEffect(() => {
    if (!isLoaded) return;
    if (inviteJoinLoading) return;
    if (shouldValidateWorkspace && !data) return;
    if (hasPartialWorkspaceState) return;
    if (savedWorkspaceIsInvalid) return;

    const inTabs = segments[0] === "(tabs)";
    const onLogin = segments[0] === "login";
    const onWorkspaces = segments[0] === "workspaces";
    const onJoin = segments[0] === "join";

    if (!session && !onLogin && !onJoin) {
      router.replace("/login");
    } else if (session && !workspaceId && !onWorkspaces && !onJoin) {
      router.replace("/workspaces");
    } else if (session && workspaceId && memberId && !inTabs && !onJoin) {
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
    inviteJoinLoading,
    data,
    savedWorkspaceIsInvalid,
  ]);

  if (
    inviteJoinLoading ||
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
