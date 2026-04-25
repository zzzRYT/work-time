import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import { SafeAreaView } from "react-native-safe-area-context";
import { Toast } from "@shared/ui/toast";
import { getCurrentMonth } from "@shared/lib/date";
import { useAuthStore } from "@shared/store/auth";
import { ProfileSection } from "./ui/profile-section";
import { InviteSection } from "./ui/invite-section";
import { RoleSection } from "./ui/role-section";
import { StudyTimeSection } from "./ui/study-time-section";
import { LateFeeSection } from "./ui/late-fee-section";
import { FeeConfirmSection, type PendingItem } from "./ui/fee-confirm-section";
import {
  SETTINGS_QUERY,
  UPDATE_MEMBER_ROLE,
  UPDATE_STUDY_START_TIME,
  UPDATE_LATE_FEE_AMOUNT,
  CONFIRM_FEE_PAYMENT,
  REJECT_FEE_PAYMENT,
} from "./api";

export function SettingsPage() {
  const currentMonth = getCurrentMonth();
  const memberId = useAuthStore((s) => s.memberId);
  const session = useAuthStore((s) => s.session);
  const { data, loading, error } = useQuery(SETTINGS_QUERY, {
    variables: { month: currentMonth },
    fetchPolicy: "cache-and-network",
  });
  const [updateMemberRole] = useMutation(UPDATE_MEMBER_ROLE);
  const [updateStudyStartTime] = useMutation(UPDATE_STUDY_START_TIME);
  const [updateLateFeeAmount] = useMutation(UPDATE_LATE_FEE_AMOUNT);
  const [confirmFeePayment] = useMutation(CONFIRM_FEE_PAYMENT);
  const [rejectFeePayment] = useMutation(REJECT_FEE_PAYMENT);
  const [toast, setToast] = useState<{
    message: string;
    variant: "error" | "success";
  } | null>(null);

  const members = data?.members ?? [];
  const settings = data?.settings;
  const currentMember = members.find((m) => m.id === memberId);
  const isAdmin = currentMember?.role === "ADMIN";

  const fallbackName = session?.user?.email?.split("@")[0] ?? "사용자";

  const pendingItems: PendingItem[] = [];
  for (const e of data?.feeStatus ?? []) {
    if (e.monthlyFeeStatus === "PENDING") {
      pendingItems.push({
        memberId: e.member.id,
        memberName: e.member.displayName,
        memberColor: e.member.color,
        type: "MONTHLY",
        label: "월 회비",
        amount: e.monthlyFee,
      });
    }
    if (e.lateFeeStatus === "PENDING") {
      pendingItems.push({
        memberId: e.member.id,
        memberName: e.member.displayName,
        memberColor: e.member.color,
        type: "LATE",
        label: "지각비",
        amount: e.lateFee,
      });
    }
  }

  const handleRoleChange = async (targetMemberId: string, newRole: "ADMIN" | "MEMBER") => {
    const member = members.find((m) => m.id === targetMemberId);
    try {
      await updateMemberRole({
        variables: { memberId: targetMemberId, role: newRole },
        refetchQueries: [{ query: SETTINGS_QUERY, variables: { month: currentMonth } }],
      });
      const name = member?.displayName ?? "";
      setToast({
        message:
          newRole === "ADMIN"
            ? `${name}님을 관리자로 지정했습니다`
            : `${name}님의 관리자 권한을 해제했습니다`,
        variant: "success",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "역할 변경에 실패했습니다";
      setToast({ message: msg, variant: "error" });
    }
  };

  const handleStudyTimeChange = async (hour: number, minute: number) => {
    try {
      await updateStudyStartTime({
        variables: { hour, minute },
      });
      setToast({ message: "출근 시간이 변경되었습니다", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "설정 변경에 실패했습니다";
      setToast({ message: msg, variant: "error" });
    }
  };

  const handleLateFeeChange = async (amount: number) => {
    try {
      await updateLateFeeAmount({
        variables: { amount },
      });
      setToast({ message: "지각비가 변경되었습니다", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "설정 변경에 실패했습니다";
      setToast({ message: msg, variant: "error" });
    }
  };

  const handleConfirmPayment = async (targetMemberId: string, type: "MONTHLY" | "LATE") => {
    const entry = data?.feeStatus?.find((e) => e.member.id === targetMemberId);
    try {
      await confirmFeePayment({
        variables: { memberId: targetMemberId, month: currentMonth, type },
        refetchQueries: [{ query: SETTINGS_QUERY, variables: { month: currentMonth } }],
      });
      const label = type === "MONTHLY" ? "월 회비" : "지각비";
      setToast({
        message: `${entry?.member.displayName ?? ""}님 ${label} 납부 확인 완료`,
        variant: "success",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "납부 확인에 실패했습니다";
      setToast({ message: msg, variant: "error" });
    }
  };

  const handleRejectPayment = async (targetMemberId: string, type: "MONTHLY" | "LATE") => {
    const entry = data?.feeStatus?.find((e) => e.member.id === targetMemberId);
    try {
      await rejectFeePayment({
        variables: { memberId: targetMemberId, month: currentMonth, type },
        refetchQueries: [{ query: SETTINGS_QUERY, variables: { month: currentMonth } }],
      });
      const label = type === "MONTHLY" ? "월 회비" : "지각비";
      setToast({
        message: `${entry?.member.displayName ?? ""}님 ${label} 납부 거절`,
        variant: "success",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "납부 거절에 실패했습니다";
      setToast({ message: msg, variant: "error" });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-text-primary mb-4">설정</Text>

        <ProfileSection
          memberName={currentMember?.displayName ?? fallbackName}
          memberColor={currentMember?.color ?? "#B8A898"}
          className="mb-4"
        />

        {loading && !data && (
          <View className="bg-surface rounded-lg p-6 border border-border items-center mb-4">
            <ActivityIndicator size="large" color="#F07A5A" />
          </View>
        )}

        {error && !data && (
          <View className="bg-surface rounded-lg p-6 border border-border items-center mb-4">
            <Text className="text-text-subtle text-sm">
              설정을 불러올 수 없습니다
            </Text>
          </View>
        )}

        {isAdmin && <InviteSection className="mb-4" />}

        {isAdmin && pendingItems.length > 0 && (
          <FeeConfirmSection
            items={pendingItems}
            onConfirm={handleConfirmPayment}
            onReject={handleRejectPayment}
            className="mb-4"
          />
        )}

        {isAdmin && (
          <RoleSection
            members={members}
            onRoleChange={handleRoleChange}
            className="mb-4"
          />
        )}

        {isAdmin && settings && (
          <>
            <StudyTimeSection
              currentHour={settings.studyStartHour}
              currentMinute={settings.studyStartMinute}
              onSave={handleStudyTimeChange}
              className="mb-4"
            />

            <LateFeeSection
              currentAmount={settings.lateFeeAmount}
              onSave={handleLateFeeChange}
              className="mb-8"
            />
          </>
        )}
      </ScrollView>

      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </SafeAreaView>
  );
}
