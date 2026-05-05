import { useEffect } from "react";
import { AppState, Text } from "react-native";
import { useQuery } from "@apollo/client";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentMonth } from "@shared/lib/date";
import { useAuthStore } from "@shared/store/auth";
import { ScreenLoader } from "@shared/ui/screen-loader";
import { ACTIVE_SESSION, HOME_QUERY } from "../api";
import { toHomeData } from "../model";
import { HomeContent } from "./home-content";

export function FetchHome() {
  const memberId = useAuthStore((state) => state.memberId);
  const currentMonth = getCurrentMonth();

  const {
    data: rawData,
    loading,
    refetch: refetchHome,
  } = useQuery(HOME_QUERY, {
    variables: { month: currentMonth },
    fetchPolicy: "cache-and-network",
    pollInterval: 15_000,
  });

  const { data: rawSessionData, refetch: refetchSession } = useQuery(
    ACTIVE_SESSION,
    {
      variables: { memberId: memberId ?? "" },
      skip: !memberId,
      fetchPolicy: "cache-and-network",
      pollInterval: 15_000,
    },
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;

      refetchHome();
      if (memberId) {
        refetchSession();
      }
    });

    return () => sub.remove();
  }, [memberId, refetchHome, refetchSession]);

  if (loading && !rawData) {
    return <ScreenLoader />;
  }

  if (!rawData) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-5">
        <Text className="text-[14px] text-text-muted mb-3">
          데이터를 불러올 수 없습니다
        </Text>
        <Text
          className="text-[15px] font-semibold text-primary"
          onPress={() => refetchHome()}
        >
          다시 시도
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <HomeContent
      currentMonth={currentMonth}
      data={toHomeData(rawData, rawSessionData, memberId)}
      memberId={memberId}
    />
  );
}
