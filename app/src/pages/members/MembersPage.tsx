import { useState, useCallback } from 'react';
import { RefreshControl, ScrollView, Text } from 'react-native';
import { useQuery } from '@apollo/client';
import { graphql } from '@graphql';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentMonth } from '@shared/lib/date';
import { AttendanceSummary } from './ui/attendance-summary';
import { MemberList } from './ui/member-list';
import { FeeSection } from './ui/fee-section';
import { Ranking } from './ui/ranking';

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
      monthlyFeeStatus
      lateFeeStatus
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

export function MembersPage() {
  const currentMonth = getCurrentMonth();
  const { data, loading, refetch } = useQuery(MEMBERS_PAGE_QUERY, {
    variables: { month: currentMonth },
    pollInterval: 30_000,
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (loading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-gray-400">로딩중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text className="text-2xl font-bold text-gray-900 mb-4">스터디원</Text>

        {data?.todayAttendanceSummary && (
          <AttendanceSummary
            {...data.todayAttendanceSummary}
            className="mb-4"
          />
        )}

        <MemberList members={data?.members ?? []} className="mb-4" />

        <FeeSection
          entries={data?.feeStatus ?? []}
          className="mb-4"
        />

        <Ranking
          weeklyRanking={data?.weekly ?? []}
          monthlyRanking={data?.monthly ?? []}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
