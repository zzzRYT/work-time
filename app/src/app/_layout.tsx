import "../../global.css";
import { initSentry } from "@shared/lib/sentry";
initSentry();

import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { Providers } from "@app/providers";
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

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { session, workspaceId, isLoaded } = useAuthStore();
  const { joinByInvite, loading: inviteJoinLoading } = useJoinWorkspaceByInvite();

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

    const inTabs = segments[0] === "(tabs)";
    const onLogin = segments[0] === "login";
    const onWorkspaces = segments[0] === "workspaces";
    const onJoin = segments[0] === "join";

    if (!session && !onLogin && !onJoin) {
      router.replace("/login");
    } else if (session && !workspaceId && !onWorkspaces && !onJoin) {
      router.replace("/workspaces");
    } else if (session && workspaceId && !inTabs && !onJoin) {
      router.replace("/(tabs)");
    }
  }, [session, workspaceId, isLoaded, segments]);

  if (inviteJoinLoading || !isLoaded) {
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
