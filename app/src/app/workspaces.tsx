import { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@apollo/client";
import { graphql } from "@graphql";
import { router } from "expo-router";
import { apolloClient } from "@shared/lib/apollo";
import { useJoinWorkspaceByInvite } from "@shared/hooks/use-join-workspace-by-invite";
import { useAuthStore } from "@shared/store/auth";

const MY_WORKSPACES = graphql(`
  query MyWorkspaces {
    myWorkspaces {
      id
      workspaceId
      userId
      memberId
      role
      joinedAt
    }
  }
`);

const CREATE_WORKSPACE = graphql(`
  mutation CreateWorkspace($name: String!) {
    createWorkspace(name: $name) {
      id
      name
      slug
    }
  }
`);

export default function WorkspacesScreen() {
  const { data, loading, refetch } = useQuery(MY_WORKSPACES);
  const [createWorkspace] = useMutation(CREATE_WORKSPACE);
  const { joinByInvite, loading: joiningByInvite } = useJoinWorkspaceByInvite();
  const setWorkspaceId = useAuthStore((s) => s.setWorkspaceId);
  const setMemberId = useAuthStore((s) => s.setMemberId);
  const signOut = useAuthStore((s) => s.signOut);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [creating, setCreating] = useState(false);
  const actionInFlightRef = useRef(false);
  const [actionInFlight, setActionInFlight] = useState(false);

  const beginAction = () => {
    if (actionInFlightRef.current) return false;
    actionInFlightRef.current = true;
    setActionInFlight(true);
    return true;
  };

  const endAction = () => {
    actionInFlightRef.current = false;
    setActionInFlight(false);
  };

  const navigateToWorkspace = async (workspaceId: string, memberId: string) => {
    setWorkspaceId(workspaceId);
    setMemberId(memberId);
    await apolloClient.resetStore();
    router.replace("/(tabs)");
  };

  const handleSelect = async (workspaceId: string, memberId: string) => {
    if (!beginAction()) return;
    let navigated = false;
    try {
      await navigateToWorkspace(workspaceId, memberId);
      navigated = true;
    } finally {
      if (!navigated) {
        endAction();
      }
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (!beginAction()) return;
    setCreating(true);
    let navigated = false;
    try {
      const { data: result } = await createWorkspace({
        variables: { name: newName.trim() },
      });
      if (result?.createWorkspace) {
        const { data: refreshed } = await refetch();
        const newMembership = refreshed?.myWorkspaces?.find(
          (w) => w.workspaceId === result.createWorkspace.id,
        );
        if (newMembership) {
          await navigateToWorkspace(
            newMembership.workspaceId,
            newMembership.memberId,
          );
          navigated = true;
        }
      }
    } catch (e) {
      Alert.alert(
        "오류",
        e instanceof Error ? e.message : "워크스페이스 생성 실패",
      );
    } finally {
      if (!navigated) {
        setCreating(false);
        endAction();
      }
    }
  };

  const handleJoinByInvite = async () => {
    if (!inviteInput.trim()) return;
    if (!beginAction()) return;
    let navigated = false;
    try {
      await joinByInvite(inviteInput);
      navigated = true;
    } catch (e) {
      Alert.alert(
        "초대 참여 실패",
        e instanceof Error ? e.message : "워크스페이스 참여에 실패했습니다",
      );
    } finally {
      if (!navigated) {
        endAction();
      }
    }
  };

  const handleSignOut = async () => {
    if (!beginAction()) return;
    let signedOut = false;
    try {
      await signOut();
      await apolloClient.clearStore();
      signedOut = true;
    } finally {
      if (!signedOut) {
        endAction();
      }
    }
  };

  const workspaces = data?.myWorkspaces ?? [];
  const createDisabled = actionInFlight || creating || !newName.trim();
  const inviteDisabled =
    actionInFlight || joiningByInvite || !inviteInput.trim();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-5 pt-12">
        <Text className="text-[24px] font-bold text-text-primary mb-2">
          워크스페이스
        </Text>
        <Text className="text-[13px] text-text-muted mb-8">
          참여할 스터디 그룹을 선택하세요
        </Text>

        <View className="flex-1">
          {loading ? (
            <Text className="text-text-subtle text-center py-8">로딩중...</Text>
          ) : (
            <FlatList
              data={workspaces}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <Pressable
                  className="bg-surface rounded-lg p-4 border border-border active:bg-surface-hover"
                  onPress={() => handleSelect(item.workspaceId, item.memberId)}
                  disabled={actionInFlight}
                  style={{ opacity: actionInFlight ? 0.5 : 1 }}
                >
                  <Text className="text-[17px] font-medium text-text-primary">
                    워크스페이스
                  </Text>
                  <Text className="text-[13px] text-text-muted mt-1">
                    {item.role === "OWNER" ? "관리자" : "멤버"}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text className="text-text-subtle text-[15px]">
                    참여 중인 워크스페이스가 없습니다
                  </Text>
                </View>
              }
            />
          )}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={24}
        >
          {showCreate ? (
            <View className="mt-6 bg-surface rounded-lg p-4 border border-border">
              <Text className="text-[15px] font-medium text-text-primary mb-3">
                새 워크스페이스 만들기
              </Text>
              <TextInput
                className="border border-border rounded-sm bg-white px-4 py-3 text-[15px] text-text-primary mb-3"
                placeholder="이름 (예: 모던애자일)"
                placeholderTextColor="#B8A898"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <Pressable
                className="bg-primary rounded-lg py-3 items-center"
                onPress={handleCreate}
                disabled={createDisabled}
                style={{ opacity: createDisabled ? 0.5 : 1 }}
              >
                <Text className="text-white font-bold text-[15px]">
                  {creating ? "생성 중..." : "만들기"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              className="mt-6 border-2 border-dashed border-border rounded-lg py-5 items-center active:bg-surface"
              onPress={() => {
                if (!actionInFlightRef.current) {
                  setShowCreate(true);
                }
              }}
              disabled={actionInFlight}
              style={{ opacity: actionInFlight ? 0.5 : 1 }}
            >
              <Text className="text-text-muted font-medium text-[15px]">
                + 새 워크스페이스 만들기
              </Text>
            </Pressable>
          )}

          <View className="mt-3 bg-surface rounded-lg p-4 border border-border">
            <Text className="text-[15px] font-medium text-text-primary mb-3">
              초대 코드로 참여
            </Text>
            <TextInput
              className="border border-border rounded-sm bg-white px-4 py-3 text-[15px] text-text-primary mb-3"
              placeholder="초대 링크 또는 코드"
              placeholderTextColor="#B8A898"
              value={inviteInput}
              onChangeText={setInviteInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              className="bg-primary rounded-lg py-3 items-center"
              onPress={handleJoinByInvite}
              disabled={inviteDisabled}
              style={{ opacity: inviteDisabled ? 0.5 : 1 }}
            >
              <Text className="text-white font-bold text-[15px]">
                {joiningByInvite ? "참여 중..." : "참여하기"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            className="mb-4 py-3 items-center"
            onPress={handleSignOut}
            disabled={actionInFlight}
            style={{ opacity: actionInFlight ? 0.5 : 1 }}
          >
            <Text className="text-text-subtle text-[13px]">로그아웃</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
