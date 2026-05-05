import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenLoader } from "@shared/ui/screen-loader";
import { extractInviteToken } from "@shared/lib/invite";
import { storePendingInviteToken } from "@shared/lib/pending-invite";
import { useJoinWorkspaceByInvite } from "@shared/hooks/use-join-workspace-by-invite";
import { useAuthStore } from "@shared/store/auth";

export default function JoinInviteScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const session = useAuthStore((s) => s.session);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const { joinByInvite } = useJoinWorkspaceByInvite();
  const tokenValue = Array.isArray(token) ? token[0] : token;
  const processingRef = useRef<{ token: string; cancelled: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!isLoaded) return;

    const inviteToken = extractInviteToken(tokenValue ?? "");
    if (!inviteToken) {
      Alert.alert("초대 참여 실패", "초대 링크가 올바르지 않습니다.");
      router.replace(session ? "/workspaces" : "/login");
      return;
    }

    if (
      processingRef.current?.token === inviteToken &&
      !processingRef.current.cancelled
    ) {
      return;
    }

    const operation = { token: inviteToken, cancelled: false };
    processingRef.current = operation;
    const isCurrentOperation = () =>
      processingRef.current === operation && !operation.cancelled;

    if (!session) {
      storePendingInviteToken(inviteToken)
        .then(() => {
          if (isCurrentOperation()) {
            router.replace("/login");
          }
        })
        .catch(() => {
          if (isCurrentOperation()) {
            Alert.alert("초대 참여 실패", "초대 정보를 저장할 수 없습니다.");
            processingRef.current = null;
          }
        });

      return () => {
        operation.cancelled = true;
        if (processingRef.current === operation) {
          processingRef.current = null;
        }
      };
    }

    joinByInvite(inviteToken).catch((error) => {
      if (!isCurrentOperation()) return;

      Alert.alert(
        "초대 참여 실패",
        error instanceof Error ? error.message : "워크스페이스 참여에 실패했습니다.",
      );
      processingRef.current = null;
      router.replace("/workspaces");
    });

    return () => {
      operation.cancelled = true;
      if (processingRef.current === operation) {
        processingRef.current = null;
      }
    };
  }, [isLoaded, joinByInvite, session, tokenValue]);

  return <ScreenLoader />;
}
