import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "./calendar";
import { MonthlySummary } from "./monthly-summary";
import { DayDetail } from "./day-detail";

type Session = {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  isLate: boolean;
  durationMinutes: number | null;
};

type DayDetailData = {
  sessions: Session[];
  totalDurationMinutes: number;
  vacationHours: number | null;
};

type CalendarDay = {
  date: string;
  status: string;
};

type MonthlySummaryData = {
  attendanceDays: number;
  totalStudyMinutes: number;
  averageDailyMinutes: number;
  lateCount: number;
  vacationDays: number;
  totalLateFee: number;
};

type HistoryContentProps = {
  year: number;
  month: number;
  calendarDays: CalendarDay[];
  monthlySummary: MonthlySummaryData | null;
  selectedDate: string | null;
  dayDetail: DayDetailData | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function HistoryContent({
  year,
  month,
  calendarDays,
  monthlySummary,
  selectedDate,
  dayDetail,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: HistoryContentProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-text-primary mb-4">내 기록</Text>

        <View className="flex-row items-center justify-center gap-4 mb-4">
          <Pressable onPress={onPrevMonth}>
            <Text className="text-primary text-lg font-bold">◀</Text>
          </Pressable>
          <Text className="text-base font-semibold">
            {year}년 {month}월
          </Text>
          <Pressable onPress={onNextMonth}>
            <Text className="text-primary text-lg font-bold">▶</Text>
          </Pressable>
        </View>

        <Calendar
          year={year}
          month={month}
          days={calendarDays}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          className="mb-4"
        />

        {monthlySummary && (
          <MonthlySummary {...monthlySummary} className="mb-4" />
        )}

        {selectedDate && dayDetail && (
          <DayDetail
            date={selectedDate}
            sessions={dayDetail.sessions}
            totalDurationMinutes={dayDetail.totalDurationMinutes}
            vacationHours={dayDetail.vacationHours}
            className="mb-8"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
