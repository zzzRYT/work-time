import { useEffect, useState } from "react";
import { AppState, ScrollView, Text, View } from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import { useNetInfo } from "@react-native-community/netinfo";
import { graphql } from "@graphql";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@shared/store/auth";
import { getTodayString, getCurrentMonth } from "@shared/lib/date";
import { Toast } from "@shared/ui/toast";
import { ScreenLoader } from "@shared/ui/screen-loader";
import { SessionCard } from "./ui/session-card";
import { VacationButton } from "./ui/vacation-button";
import { PresenceList } from "./ui/presence-list";
import { FeeShortcut } from "./ui/fee-shortcut";

const HOME_QUERY = graphql(`
  query HomePageData($month: String!) {
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

const ACTIVE_SESSION = graphql(`
  query HomeActiveSession($memberId: ID!) {
    activeSession(memberId: $memberId) {
      id
      checkInTime
      isLate
    }
  }
`);

const CHECK_IN = graphql(`
  mutation HomeCheckIn($memberId: ID!) {
    checkIn(memberId: $memberId) { id checkInTime isLate }
  }
`);

const CHECK_OUT = graphql(`
  mutation HomeCheckOut($memberId: ID!) {
    checkOut(memberId: $memberId) { id checkOutTime }
  }
`);

const USE_VACATION = graphql(`
  mutation HomeUseVacation($memberId: ID!, $date: String!, $hours: Int!) {
    useVacation(memberId: $memberId, date: $date, hours: $hours) { id hours }
  }
`);

const REQUEST_FEE = graphql(`
  mutation HomeRequestFee($memberId: ID!, $month: String!, $type: FeeType!) {
    requestFeePayment(memberId: $memberId, month: $month, type: $type) {
      id monthlyFeeStatus lateFeeStatus
    }
  }
`);

export function HomePage() {
  const memberId = useAuthStore((s) => s.memberId);
  const currentMonth = getCurrentMonth();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;
  const [toast, setToast] = useState<{ message: string; variant: "error" | "success" } | null>(null);
  const [optimisticState, setOptimisticState] = useState<
    { action: "checkin"; checkInTime: string } | { action: "checkout" } | null
  >(null);

  const { data, loading, refetch } = useQuery(HOME_QUERY, {
    variables: { month: currentMonth },
    fetchPolicy: "cache-and-network",
    pollInterval: 15_000,
  });

  const { data: sessionData, refetch: refetchSession } = useQuery(ACTIVE_SESSION, {
    variables: { memberId: memberId! },
    skip: !memberId,
    fetchPolicy: "cache-and-network",
    pollInterval: 15_000,
  });

  const [checkIn, { loading: checkInLoading }] = useMutation(CHECK_IN);
  const [checkOut, { loading: checkOutLoading }] = useMutation(CHECK_OUT);
  const [useVacation] = useMutation(USE_VACATION);
  const [requestFee] = useMutation(REQUEST_FEE);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refetch();
        if (memberId) refetchSession();
      }
    });
    return () => sub.remove();
  }, [memberId]);

  if (loading && !data) {
    return <ScreenLoader />;
  }

  const members = data?.members ?? [];
  const summary = data?.todayAttendanceSummary;
  const me = members.find((m) => m.id === memberId);
  const myFee = data?.feeStatus?.find((f) => f.member.id === memberId);

  const refetchAll = [
    { query: HOME_QUERY, variables: { month: currentMonth } },
    ...(memberId ? [{ query: ACTIVE_SESSION, variables: { memberId } }] : []),
  ];

  const handleCheckIn = async () => {
    if (!memberId) return;
    setOptimisticState({ action: "checkin", checkInTime: new Date().toISOString() });
    try {
      await checkIn({ variables: { memberId }, refetchQueries: refetchAll, awaitRefetchQueries: true });
    } catch {
      setToast({ message: "체크인에 실패했습니다", variant: "error" });
    } finally {
      setOptimisticState(null);
    }
  };

  const handleCheckOut = async () => {
    if (!memberId) return;
    setOptimisticState({ action: "checkout" });
    try {
      await checkOut({ variables: { memberId }, refetchQueries: refetchAll, awaitRefetchQueries: true });
    } catch {
      setToast({ message: "체크아웃에 실패했습니다", variant: "error" });
    } finally {
      setOptimisticState(null);
    }
  };

  const handleVacation = async (hours: number) => {
    if (!memberId) return;
    try {
      await useVacation({
        variables: { memberId, date: getTodayString(), hours },
        refetchQueries: refetchAll,
      });
      setToast({ message: "휴가가 등록되었습니다", variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "휴가 등록 실패", variant: "error" });
    }
  };

  const handleRequestMonthlyFee = async () => {
    if (!memberId) return;
    try {
      await requestFee({
        variables: { memberId, month: currentMonth, type: "MONTHLY" as const },
        refetchQueries: refetchAll,
      });
      setToast({ message: "월 회비 납부 요청 완료", variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "요청 실패", variant: "error" });
    }
  };

  const handleRequestLateFee = async () => {
    if (!memberId) return;
    try {
      await requestFee({
        variables: { memberId, month: currentMonth, type: "LATE" as const },
        refetchQueries: refetchAll,
      });
      setToast({ message: "지각비 납부 요청 완료", variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "요청 실패", variant: "error" });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-5 pt-4">
        <View className="mb-6">
          <Text className="text-[13px] text-text-muted mb-1">안녕하세요</Text>
          <Text className="text-[24px] font-bold text-text-primary">
            {me?.displayName ?? ""}
          </Text>
        </View>

        {summary && (
          <View
            className="flex-row bg-surface rounded-lg p-3 mb-4 border border-border"
            style={{ shadowColor: "#2C1F14", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
          >
            {[
              { label: "전체", value: summary.total, color: "text-text-primary" },
              { label: "출석", value: summary.attended, color: "text-studying" },
              { label: "공부중", value: summary.studying, color: "text-primary" },
              { label: "지각", value: summary.late, color: "text-late" },
            ].map((item) => (
              <View key={item.label} className="flex-1 items-center">
                <Text className="text-[11px] text-text-muted">{item.label}</Text>
                <Text className={`text-[17px] font-bold ${item.color}`}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        <SessionCard
          status={me?.currentStatus ?? "NOT_ATTENDED"}
          checkInTime={sessionData?.activeSession?.checkInTime ?? null}
          isLate={me?.currentStatus === "LATE" || sessionData?.activeSession?.isLate === true}
          todayStudyMinutes={me?.todayStudyMinutes ?? 0}
          vacationHours={(me?.todayVacationHours as number | null) ?? null}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          loading={checkInLoading || checkOutLoading}
          networkOffline={isOffline}
          pendingAction={optimisticState?.action ?? null}
          optimisticCheckInTime={optimisticState?.action === "checkin" ? optimisticState.checkInTime : null}
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

        <PresenceList members={members as any} className="mb-8" />
      </ScrollView>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}
