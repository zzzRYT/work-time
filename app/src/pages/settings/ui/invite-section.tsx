import { useState } from "react";
import { Pressable, Text, View, Share } from "react-native";
import { useMutation } from "@apollo/client";
import { graphql } from "@graphql";

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
};

export function InviteSection({ className }: InviteSectionProps) {
  const [createInvite, { loading }] = useMutation(CREATE_INVITE);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      const { data } = await createInvite({ variables: { expiresInHours: 72 } });
      if (data?.createInvite.token) {
        setInviteToken(data.createInvite.token);
      }
    } catch {
      // silently fail
    }
  };

  const handleShare = async () => {
    if (!inviteToken) return;
    await Share.share({
      message: `WorkTime에 참여하세요!\nwork-time://invite/${inviteToken}`,
    });
  };

  return (
    <View className={className}>
      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-[15px] font-semibold text-text-primary mb-3">
          멤버 초대
        </Text>

        {inviteToken ? (
          <>
            <View className="bg-bg rounded-lg px-3 py-2 mb-3">
              <Text className="text-[11px] text-text-muted font-mono" numberOfLines={1}>
                work-time://invite/{inviteToken}
              </Text>
            </View>
            <Pressable
              className="bg-primary rounded-lg py-3 items-center"
              onPress={handleShare}
            >
              <Text className="text-white font-bold text-[15px]">공유하기</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            className="border border-primary rounded-lg py-3 items-center"
            onPress={handleCreate}
            disabled={loading}
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <Text className="text-primary font-bold text-[15px]">
              {loading ? "생성 중..." : "초대 링크 만들기"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
