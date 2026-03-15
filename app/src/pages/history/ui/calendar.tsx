import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type CalendarDay = {
  date: string;
  status: string;
};

type CalendarProps = {
  year: number;
  month: number;
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  className?: string;
};

const BLOCK_COLOR: Record<string, string> = {
  STUDYING: "bg-studying/60",
  COMPLETED: "bg-studying",
  LATE: "bg-late/70",
  VACATION: "bg-vacation/60",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getTodayStr(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function Calendar({
  year,
  month,
  days,
  selectedDate,
  onSelectDate,
  className,
}: CalendarProps) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = new Map(days.map((d) => [d.date, d.status]));
  const today = getTodayStr();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const hasRecords = days.some((d) => d.status !== "NOT_ATTENDED");

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <View className="flex-row mb-2">
        {WEEKDAYS.map((w, i) => (
          <View key={w} className="flex-1 items-center">
            <Text
              className={cn(
                "text-xs font-medium",
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
              )}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>

      {!hasRecords && days.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-gray-400 text-sm">기록이 없습니다</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap">
          {cells.map((day, i) => {
            if (day === null) {
              return <View key={`e-${i}`} className="w-[14.28%] aspect-square p-0.5" />;
            }
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const status = dayMap.get(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            const blockColor = status ? BLOCK_COLOR[status] : undefined;

            return (
              <Pressable
                key={dateStr}
                className="w-[14.28%] aspect-square p-0.5"
                onPress={() => onSelectDate(dateStr)}
              >
                <View
                  className={cn(
                    "flex-1 rounded-md items-center justify-center",
                    blockColor ?? "bg-gray-50",
                    isSelected && "ring-2 ring-primary border-2 border-primary",
                    isToday && !isSelected && "border-2 border-gray-800"
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs",
                      blockColor ? "text-white font-bold" : "text-gray-600",
                      isSelected && "text-primary font-bold",
                      isToday && !isSelected && "font-bold text-gray-900"
                    )}
                  >
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
