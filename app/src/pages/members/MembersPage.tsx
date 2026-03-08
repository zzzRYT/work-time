import { Alert, ScrollView, Text } from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import { graphql } from "@graphql";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendanceSummary } from "./ui/attendance-summary";
import { MemberList } from "./ui/member-list";
import { FeeSection } from "./ui/fee-section";
import { Ranking } from "./ui/ranking";

const MEMBERS_PAGE_QUERY = graphql(`
  query MembersPage($month: String!) {
    members {
      id
      name
      displayName
      color
      currentStatus
      todayStudyMinutes
    }
    todayAttendanceSummary {
      total
      attended
      studying
      late
    }
    feeStatus(month: $month) {
      member {
        id
        displayName
        color
      }
      lateFee
      monthlyFee
      isPaid
      lateCount
    }
    weekly: memberRanking(period: WEEKLY) {
      member {
        id
        displayName
        color
      }
      totalStudyMinutes
      attendanceDays
      lateCount
    }
    monthly: memberRanking(period: MONTHLY) {
      member {
        id
        displayName
        color
      }
      totalStudyMinutes
      attendanceDays
      lateCount
    }
  }
`);

const TOGGLE_FEE = graphql(`
  mutation ToggleFee($memberId: ID!, $month: String!) {
    toggleFeePayment(memberId: $memberId, month: $month) {
      id
      isPaid
    }
  }
`);

function getCurrentMonth(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 7);
}

export function MembersPage() {
  const currentMonth = getCurrentMonth();
  const { data, loading, refetch } = useQuery(MEMBERS_PAGE_QUERY, {
    variables: { month: currentMonth },
    pollInterval: 30_000,
  });
  const [toggleFee] = useMutation(TOGGLE_FEE);

  const d = data as any;

  if (loading && !d) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-gray-400">로딩중...</Text>
      </SafeAreaView>
    );
  }

  const handleTogglePayment = async (memberId: string) => {
    try {
      await toggleFee({
        variables: { memberId, month: currentMonth },
      });
      refetch();
    } catch (e: any) {
      Alert.alert("오류", e.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          스터디원
        </Text>

        {d?.todayAttendanceSummary && (
          <AttendanceSummary {...d.todayAttendanceSummary} className="mb-4" />
        )}

        <MemberList members={d?.members ?? []} className="mb-4" />

        <FeeSection
          entries={d?.feeStatus ?? []}
          onTogglePayment={handleTogglePayment}
          className="mb-4"
        />

        <Ranking
          weeklyRanking={d?.weekly ?? []}
          monthlyRanking={d?.monthly ?? []}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
