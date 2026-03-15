import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useQuery } from "@apollo/client";
import { graphql } from "@graphql";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemberStore } from "@shared/store/member";
import { Calendar } from "./ui/calendar";
import { MonthlySummary } from "./ui/monthly-summary";
import { DayDetail } from "./ui/day-detail";

const CALENDAR_QUERY = graphql(`
  query Calendar($memberId: ID!, $year: Int!, $month: Int!) {
    calendar(memberId: $memberId, year: $year, month: $month) {
      date
      status
    }
    monthlySummary(memberId: $memberId, year: $year, month: $month) {
      attendanceDays
      totalStudyMinutes
      averageDailyMinutes
      lateCount
      vacationDays
      totalLateFee
    }
  }
`);

const DAY_DETAIL_QUERY = graphql(`
  query DayDetail($memberId: ID!, $date: String!) {
    dayDetail(memberId: $memberId, date: $date) {
      sessions {
        id
        checkInTime
        checkOutTime
        isLate
        durationMinutes
      }
      totalDurationMinutes
      vacationHours
    }
  }
`);

function getKSTNow() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

export function HistoryPage() {
  const kst = getKSTNow();
  const selectedMemberId = useMemberStore((s) => s.selectedMemberId);
  const [year, setYear] = useState(kst.getUTCFullYear());
  const [month, setMonth] = useState(kst.getUTCMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: calendarData } = useQuery(CALENDAR_QUERY, {
    variables: { memberId: selectedMemberId!, year, month },
    skip: !selectedMemberId,
  });
  const calData = calendarData;

  const { data: dayData } = useQuery(DAY_DETAIL_QUERY, {
    variables: { memberId: selectedMemberId!, date: selectedDate! },
    skip: !selectedMemberId || !selectedDate,
  });
  const detail = dayData?.dayDetail;

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

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">내 기록</Text>

        <View className="flex-row items-center justify-center gap-4 mb-4">
          <Pressable onPress={handlePrevMonth}>
            <Text className="text-primary text-lg font-bold">◀</Text>
          </Pressable>
          <Text className="text-base font-semibold">
            {year}년 {month}월
          </Text>
          <Pressable onPress={handleNextMonth}>
            <Text className="text-primary text-lg font-bold">▶</Text>
          </Pressable>
        </View>

        <Calendar
          year={year}
          month={month}
          days={calData?.calendar ?? []}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          className="mb-4"
        />

        {calData?.monthlySummary && (
          <MonthlySummary {...calData.monthlySummary} className="mb-4" />
        )}

        {selectedDate && detail && (
          <DayDetail
            date={selectedDate}
            sessions={detail.sessions}
            totalDurationMinutes={detail.totalDurationMinutes}
            vacationHours={detail.vacationHours}
            className="mb-8"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
