import { useEffect, useState } from "react";
import { AppState, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import { useNetInfo } from "@react-native-community/netinfo";
import { graphql } from "@graphql";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemberStore } from "@shared/store/member";
import { getTodayString, getCurrentMonth } from "@shared/lib/date";
import { Toast } from "@shared/ui/toast";
import { AttendanceCard } from "./ui/attendance-card";
import { VacationButton } from "./ui/vacation-button";
import { StudyingMembers } from "./ui/studying-members";
import { FeeShortcut } from "./ui/fee-shortcut";
import { router } from "expo-router";

const MEMBERS_QUERY = graphql(`
  query Members($month: String!) {
    members {
      id
      name
      displayName
      color
      currentStatus
      todayStudyMinutes
      todayVacationHours
    }
    todayAttendanceSummary {
      total
      attended
      studying
      late
    }
    feeStatus(month: $month) {
      member { id }
      lateFee
      monthlyFee
      monthlyFeeStatus
      lateFeeStatus
      lateCount
    }
  }
`);

const CHECK_IN = graphql(`
  mutation CheckIn($memberId: ID!) {
    checkIn(memberId: $memberId) {
      id
      checkInTime
      isLate
    }
  }
`);

const CHECK_OUT = graphql(`
  mutation CheckOut($memberId: ID!) {
    checkOut(memberId: $memberId) {
      id
      checkOutTime
    }
  }
`);

const ACTIVE_SESSION = graphql(`
  query ActiveSession($memberId: ID!) {
    activeSession(memberId: $memberId) {
      id
      checkInTime
      isLate
    }
  }
`);

const USE_VACATION = graphql(`
  mutation UseVacation($memberId: ID!, $date: String!, $hours: Int!) {
    useVacation(memberId: $memberId, date: $date, hours: $hours) {
      id
      hours
    }
  }
`);

const REQUEST_FEE_PAYMENT = graphql(`
  mutation DashboardRequestFeePayment($memberId: ID!, $month: String!, $type: FeeType!) {
    requestFeePayment(memberId: $memberId, month: $month, type: $type) {
      id
      monthlyFeeStatus
      lateFeeStatus
    }
  }
`);

export function DashboardPage() {
  const selectedMemberId = useMemberStore((s) => s.selectedMemberId);
  const clearSelectedMemberId = useMemberStore((s) => s.clearSelectedMemberId);
  const currentMonth = getCurrentMonth();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;
  const [toast, setToast] = useState<{
    message: string;
    variant: "error" | "success";
  } | null>(null);

  const { data, loading, refetch: refetchMembers } = useQuery(MEMBERS_QUERY, {
    variables: { month: currentMonth },
    pollInterval: 30_000,
  });
  const { data: sessionData, refetch: refetchSession } = useQuery(
    ACTIVE_SESSION,
    {
      variables: { memberId: selectedMemberId! },
      skip: !selectedMemberId,
      pollInterval: 30_000,
    }
  );
  const [checkIn, { loading: checkInLoading }] = useMutation(CHECK_IN);
  const [checkOut, { loading: checkOutLoading }] = useMutation(CHECK_OUT);
  const [useVacation] = useMutation(USE_VACATION);
  const [requestFeePayment] = useMutation(REQUEST_FEE_PAYMENT);

  // S-01-4: AppState 복귀 시 refetch
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && selectedMemberId) {
        refetchMembers();
        refetchSession();
      }
    });
    return () => sub.remove();
  }, [selectedMemberId]);

  if (loading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-gray-400">로딩중...</Text>
      </SafeAreaView>
    );
  }

  const members = data?.members ?? [];
  const summary = data?.todayAttendanceSummary;
  const me = members.find((m) => m.id === selectedMemberId);
  const myFee = data?.feeStatus?.find((f) => f.member.id === selectedMemberId);

  if (selectedMemberId && members.length > 0 && !me) {
    clearSelectedMemberId();
    return null;
  }

  const refetchAll = [
    { query: MEMBERS_QUERY, variables: { month: currentMonth } },
    { query: ACTIVE_SESSION, variables: { memberId: selectedMemberId! } },
  ];

  const handleCheckIn = async () => {
    try {
      await checkIn({
        variables: { memberId: selectedMemberId! },
        optimisticResponse: {
          checkIn: {
            id: `temp-${Date.now()}`,
            checkInTime: new Date().toISOString(),
            isLate: false,
          },
        },
        refetchQueries: refetchAll,
      });
    } catch {
      setToast({ message: "체크인에 실패했습니다", variant: "error" });
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut({
        variables: { memberId: selectedMemberId! },
        optimisticResponse: {
          checkOut: {
            id: sessionData?.activeSession?.id ?? `temp-${Date.now()}`,
            checkOutTime: new Date().toISOString(),
          },
        },
        refetchQueries: refetchAll,
      });
    } catch {
      setToast({ message: "체크아웃에 실패했습니다", variant: "error" });
    }
  };

  const handleRequestMonthlyFee = async () => {
    try {
      await requestFeePayment({
        variables: { memberId: selectedMemberId!, month: currentMonth, type: "MONTHLY" as const },
        refetchQueries: [{ query: MEMBERS_QUERY, variables: { month: currentMonth } }],
      });
      setToast({ message: "월 회비 납부 요청을 보냈습니다", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "납부 신청에 실패했습니다";
      setToast({ message: msg, variant: "error" });
    }
  };

  const handleRequestLateFee = async () => {
    try {
      await requestFeePayment({
        variables: { memberId: selectedMemberId!, month: currentMonth, type: "LATE" as const },
        refetchQueries: [{ query: MEMBERS_QUERY, variables: { month: currentMonth } }],
      });
      setToast({ message: "지각비 납부 요청을 보냈습니다", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "납부 신청에 실패했습니다";
      setToast({ message: msg, variant: "error" });
    }
  };

  const handleVacation = async (hours: number) => {
    try {
      await useVacation({
        variables: {
          memberId: selectedMemberId!,
          date: getTodayString(),
          hours,
        },
        refetchQueries: refetchAll,
      });
      setToast({ message: "휴가가 등록되었습니다", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "휴가 등록에 실패했습니다";
      setToast({ message: msg, variant: "error" });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 pt-4">
        <Pressable
          className="flex-row items-center mb-4"
          onPress={() => router.push("/select-member")}
        >
          {me && (
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: me.color }}
            >
              <Text className="text-white text-sm font-bold">
                {me.displayName.charAt(0)}
              </Text>
            </View>
          )}
          <Text className="text-2xl font-bold text-gray-900">
            {me?.displayName ?? ""}
          </Text>
          <Text className="text-gray-400 ml-1 text-lg">▼</Text>
        </Pressable>

        {summary && (
          <View className="flex-row bg-white rounded-xl p-3 mb-4 gap-2">
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500">전체</Text>
              <Text className="text-lg font-bold">{summary.total}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500">출석</Text>
              <Text className="text-lg font-bold text-studying">
                {summary.attended}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500">공부중</Text>
              <Text className="text-lg font-bold text-primary">
                {summary.studying}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs text-gray-500">지각</Text>
              <Text className="text-lg font-bold text-late">
                {summary.late}
              </Text>
            </View>
          </View>
        )}

        <AttendanceCard
          date={getTodayString()}
          status={me?.currentStatus ?? "NOT_ATTENDED"}
          checkInTime={sessionData?.activeSession?.checkInTime ?? null}
          isLate={me?.currentStatus === "LATE" || sessionData?.activeSession?.isLate === true}
          todayStudyMinutes={me?.todayStudyMinutes ?? 0}
          vacationHours={(me?.todayVacationHours as number | null) ?? null}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          checkInLoading={checkInLoading}
          checkOutLoading={checkOutLoading}
          networkOffline={isOffline}
          className="mb-4"
        />

        {myFee && (
          <FeeShortcut
            monthlyFee={myFee.monthlyFee}
            monthlyFeeStatus={myFee.monthlyFeeStatus}
            lateFee={myFee.lateFee}
            lateFeeStatus={myFee.lateFeeStatus}
            lateCount={myFee.lateCount}
            onRequestMonthlyFee={handleRequestMonthlyFee}
            onRequestLateFee={handleRequestLateFee}
            className="mb-4"
          />
        )}

        {me?.currentStatus !== "VACATION" && (
          <VacationButton
            onUseVacation={handleVacation}
            disabled={
              me?.currentStatus === "STUDYING" ||
              (me?.todayVacationHours != null && (me.todayVacationHours as number) > 0)
            }
            className="mb-4"
          />
        )}

        <StudyingMembers members={members} className="mb-8" />
      </ScrollView>

      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </SafeAreaView>
  );
}
