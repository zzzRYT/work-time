import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useQuery } from "@apollo/client";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@shared/store/auth";
import { HistoryContent } from "./ui/history-content";
import { CALENDAR_QUERY, DAY_DETAIL_QUERY } from "./api";

function getKSTNow() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

export function HistoryPage() {
  const kst = getKSTNow();
  const selectedMemberId = useAuthStore((s) => s.memberId);
  const [year, setYear] = useState(kst.getUTCFullYear());
  const [month, setMonth] = useState(kst.getUTCMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const {
    data: calendarData,
    loading: calendarLoading,
    error: calendarError,
  } = useQuery(CALENDAR_QUERY, {
    variables: { memberId: selectedMemberId!, year, month },
    skip: !selectedMemberId,
  });

  const {
    data: dayData,
    loading: dayLoading,
    error: dayError,
  } = useQuery(DAY_DETAIL_QUERY, {
    variables: { memberId: selectedMemberId!, date: selectedDate! },
    skip: !selectedMemberId || !selectedDate,
  });

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  };

  if (calendarLoading && !calendarData) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#F07A5A" />
      </SafeAreaView>
    );
  }

  if (calendarError) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-4">
        <Text className="text-late text-base text-center">
          기록을 불러올 수 없습니다
        </Text>
        <Text className="text-text-subtle text-sm mt-2 text-center">
          {calendarError.message}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <HistoryContent
      year={year}
      month={month}
      calendarDays={calendarData?.calendar ?? []}
      monthlySummary={calendarData?.monthlySummary ?? null}
      selectedDate={selectedDate}
      dayDetail={dayData?.dayDetail ?? null}
      onSelectDate={setSelectedDate}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
    />
  );
}
