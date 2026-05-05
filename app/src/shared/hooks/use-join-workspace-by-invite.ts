import { useCallback } from "react";
import { useMutation } from "@apollo/client";
import { router } from "expo-router";
import { graphql } from "@graphql";
import { apolloClient } from "@shared/lib/apollo";
import {
  extractInviteToken,
  getJoinWorkspaceErrorMessage,
} from "@shared/lib/invite";
import { clearPendingInviteToken } from "@shared/lib/pending-invite";
import { useAuthStore } from "@shared/store/auth";

const JOIN_WORKSPACE = graphql(`
  mutation JoinWorkspaceByInvite($token: String!) {
    joinWorkspace(token: $token) {
      workspaceId
      memberId
      role
    }
  }
`);

export function useJoinWorkspaceByInvite() {
  const setWorkspaceId = useAuthStore((s) => s.setWorkspaceId);
  const setMemberId = useAuthStore((s) => s.setMemberId);
  const [joinWorkspace, { loading }] = useMutation(JOIN_WORKSPACE);

  const joinByInvite = useCallback(
    async (input: string) => {
      const token = extractInviteToken(input);
      if (!token) {
        throw new Error("초대 링크가 올바르지 않습니다.");
      }

      let membership;
      try {
        const { data } = await joinWorkspace({ variables: { token } });
        membership = data?.joinWorkspace;
        if (!membership) {
          throw new Error("워크스페이스 참여에 실패했습니다.");
        }
      } catch (error) {
        throw new Error(getJoinWorkspaceErrorMessage(error));
      }

      setWorkspaceId(membership.workspaceId);
      setMemberId(membership.memberId);
      await clearPendingInviteToken().catch(() => {});
      try {
        await apolloClient.resetStore();
      } catch {
      } finally {
        router.replace("/(tabs)");
      }

      return membership;
    },
    [joinWorkspace, setMemberId, setWorkspaceId],
  );

  return { joinByInvite, loading };
}
