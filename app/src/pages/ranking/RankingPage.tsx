import { useState, useCallback } from "react";
import { RefreshControl, ScrollView, Text } from "react-native";
import { useQuery } from "@apollo/client";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentMonth } from "@shared/lib/date";
import { ScreenLoader } from "@shared/ui/screen-loader";
import { RankingList } from "./ui/ranking-list";
import { FeeSection } from "./ui/fee-section";
import { RANKING_QUERY } from "./api";

export function RankingPage() {
  const currentMonth = getCurrentMonth();
  const { data, loading, refetch } = useQuery(RANKING_QUERY, {
    variables: { month: currentMonth },
    fetchPolicy: "cache-and-network",
    pollInterval: 30_000,
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (loading && !data) {
    return <ScreenLoader />;
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
