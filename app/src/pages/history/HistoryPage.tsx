import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "./ui/calendar";
import { MonthlySummary } from "./ui/monthly-summary";
import { DayDetail } from "./ui/day-detail";

const MEMBERS_QUERY = gql`
  query Members {
    members {
      id
      displayName
      color
    }
  }
`;

const CALENDAR_QUERY = gql`
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
`;

const DAY_DETAIL_QUERY = gql`
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
`;

function getKSTNow() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

export function HistoryPage() {
  const kst = getKSTNow();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [year, setYear] = useState(kst.getUTCFullYear());
  const [month, setMonth] = useState(kst.getUTCMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: membersData } = useQuery(MEMBERS_QUERY);
  const members = (membersData as any)?.members ?? [];

  const { data: calendarData } = useQuery(CALENDAR_QUERY, {
    variables: { memberId: selectedMemberId, year, month },
    skip: !selectedMemberId,
  });
  const calData = calendarData as any;

  const { data: dayData } = useQuery(DAY_DETAIL_QUERY, {
    variables: { memberId: selectedMemberId, date: selectedDate },
    skip: !selectedMemberId || !selectedDate,
  });
  const detail = (dayData as any)?.dayDetail;

  if (!selectedMemberId) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="px-4 pt-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            누구의 기록?
          </Text>
          {members.map((m: any) => (
            <Pressable
              key={m.id}
              className="bg-white rounded-xl p-4 mb-3 flex-row items-center"
              onPress={() => setSelectedMemberId(m.id)}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: m.color }}
              >
                <Text className="text-white font-bold">
                  {m.displayName.charAt(0)}
                </Text>
              </View>
              <Text className="text-base font-medium">{m.displayName}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    );
  }

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
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">내 기록</Text>
          <Pressable onPress={() => setSelectedMemberId(null)}>
            <Text className="text-primary text-sm">멤버 변경</Text>
          </Pressable>
        </View>

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
