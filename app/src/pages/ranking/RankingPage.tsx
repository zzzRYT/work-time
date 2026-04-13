import { useState, useCallback } from "react";
import { RefreshControl, ScrollView, Text } from "react-native";
import { useQuery } from "@apollo/client";
import { graphql } from "@graphql";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentMonth } from "@shared/lib/date";
import { RankingList } from "./ui/ranking-list";
import { FeeSection } from "./ui/fee-section";

const RANKING_QUERY = graphql(`
  query RankingPage($month: String!) {
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

export function RankingPage() {
  const currentMonth = getCurrentMonth();
  const { data, loading, refetch } = useQuery(RANKING_QUERY, {
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
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-subtle">로딩중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1 px-5 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text className="text-[24px] font-bold text-text-primary mb-4">랭킹</Text>

        <RankingList
          weeklyRanking={data?.weekly ?? []}
          monthlyRanking={data?.monthly ?? []}
          className="mb-4"
        />

        <FeeSection
          entries={data?.feeStatus ?? []}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
