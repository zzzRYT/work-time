import { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import { graphql } from "@graphql";
import { SafeAreaView } from "react-native-safe-area-context";
import { Toast } from "@shared/ui/toast";
import { getCurrentMonth } from "@shared/lib/date";
import { RoleSection } from "./ui/role-section";
import { StudyTimeSection } from "./ui/study-time-section";
import { LateFeeSection } from "./ui/late-fee-section";
import { FeeConfirmSection, type PendingItem } from "./ui/fee-confirm-section";

const ADMIN_QUERY = graphql(`
  query AdminPage($month: String!) {
    members {
      id
      displayName
      color
      role
    }
    settings {
      id
      studyStartHour
      studyStartMinute
      lateFeeAmount
    }
    feeStatus(month: $month) {
      member {
        id
        displayName
        color
      }
      lateFee
      monthlyFee
      monthlyFeeStatus
      lateFeeStatus
      lateCount
    }
  }
`);

const UPDATE_MEMBER_ROLE = graphql(`
  mutation UpdateMemberRole($memberId: ID!, $role: MemberRole!) {
    updateMemberRole(memberId: $memberId, role: $role) {
      id
      role
    }
  }
`);

const UPDATE_STUDY_START_TIME = graphql(`
  mutation UpdateStudyStartTime($hour: Int!, $minute: Int!) {
    updateStudyStartTime(hour: $hour, minute: $minute) {
      id
      studyStartHour
      studyStartMinute
    }
  }
`);

const UPDATE_LATE_FEE_AMOUNT = graphql(`
  mutation UpdateLateFeeAmount($amount: Int!) {
    updateLateFeeAmount(amount: $amount) {
      id
      lateFeeAmount
    }
  }
`);

const CONFIRM_FEE_PAYMENT = graphql(`
  mutation AdminConfirmFeePayment($memberId: ID!, $month: String!, $type: FeeType!) {
    confirmFeePayment(memberId: $memberId, month: $month, type: $type) {
      id
      monthlyFeeStatus
      lateFeeStatus
    }
  }
`);

const REJECT_FEE_PAYMENT = graphql(`
  mutation AdminRejectFeePayment($memberId: ID!, $month: String!, $type: FeeType!) {
    rejectFeePayment(memberId: $memberId, month: $month, type: $type) {
      id
      monthlyFeeStatus
      lateFeeStatus
    }
  }
`);

export function AdminPage() {
  const currentMonth = getCurrentMonth();
  const { data, loading } = useQuery(ADMIN_QUERY, {
    variables: { month: currentMonth },
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

  if (loading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-gray-400">로딩중...</Text>
      </SafeAreaView>
    );
  }

  const members = data?.members ?? [];
  const settings = data?.settings;
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

  const handleRoleChange = async (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    const member = members.find((m) => m.id === memberId);
    try {
      await updateMemberRole({
        variables: { memberId, role: newRole },
        refetchQueries: [{ query: ADMIN_QUERY, variables: { month: currentMonth } }],
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

  const handleConfirmPayment = async (memberId: string, type: "MONTHLY" | "LATE") => {
    const entry = data?.feeStatus?.find((e) => e.member.id === memberId);
    try {
      await confirmFeePayment({
        variables: { memberId, month: currentMonth, type },
        refetchQueries: [{ query: ADMIN_QUERY, variables: { month: currentMonth } }],
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

  const handleRejectPayment = async (memberId: string, type: "MONTHLY" | "LATE") => {
    const entry = data?.feeStatus?.find((e) => e.member.id === memberId);
    try {
      await rejectFeePayment({
        variables: { memberId, month: currentMonth, type },
        refetchQueries: [{ query: ADMIN_QUERY, variables: { month: currentMonth } }],
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
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">관리</Text>

        <RoleSection
          members={members}
          onRoleChange={handleRoleChange}
          className="mb-4"
        />

        <FeeConfirmSection
          items={pendingItems}
          onConfirm={handleConfirmPayment}
          onReject={handleRejectPayment}
          className="mb-4"
        />

        {settings && (
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
