import { Pressable, Text, View, Share } from "react-native";
import { useMutation } from "@apollo/client";
import { graphql } from "@graphql";
import { INVITE_EXPIRES_IN_HOURS, buildInviteLink } from "@shared/lib/invite";

const CREATE_INVITE = graphql(`
  mutation SettingsCreateInvite($expiresInHours: Int) {
    createInvite(expiresInHours: $expiresInHours) {
      id
      token
    }
  }
`);

type InviteSectionProps = {
  className?: string;
  onShared?: () => void;
  onError?: (message: string) => void;
};

export function InviteSection({ className, onShared, onError }: InviteSectionProps) {
  const [createInvite, { loading }] = useMutation(CREATE_INVITE);

  const handleShareInvite = async () => {
    try {
      const { data } = await createInvite({
        variables: { expiresInHours: INVITE_EXPIRES_IN_HOURS },
      });
      const token = data?.createInvite.token;
      if (!token) {
        onError?.("초대 링크 생성에 실패했습니다");
        return;
      }

      const link = buildInviteLink(token);
      const result = await Share.share({
        message:
          "WorkTime 워크스페이스 초대입니다.\n\n" +
          "아래 링크를 열거나 초대 코드를 앱에 입력하세요.\n\n" +
          `링크: ${link}\n` +
          `초대 코드: ${token}`,
      });
      if (result.action !== Share.dismissedAction) {
        onShared?.();
      }
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "초대 링크 공유에 실패했습니다",
      );
    }
  };

  return (
    <View className={className}>
      <View
        className="bg-surface rounded-lg p-4 border border-border"
        style={{ shadowColor: "#2C1F14", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
      >
        <Text className="text-[15px] font-semibold text-text-primary mb-3">
          워크스페이스 초대
        </Text>
        <Text className="text-[13px] text-text-muted mb-3">
          7일 동안 사용할 수 있는 초대 링크와 코드를 공유합니다
        </Text>
        <Pressable
          className="border border-primary rounded-lg py-3 items-center"
          onPress={handleShareInvite}
          disabled={loading}
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          <Text className="text-primary font-bold text-[15px]">
            {loading ? "생성 중..." : "초대 링크 공유"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
