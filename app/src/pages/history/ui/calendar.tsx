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

const DOT_COLOR: Record<string, string> = {
  STUDYING: "bg-studying",
  COMPLETED: "bg-studying",
  LATE: "bg-late",
  VACATION: "bg-vacation",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-lg font-bold text-gray-900 mb-3">
        {year}년 {month}월
      </Text>
      <View className="flex-row mb-2">
        {WEEKDAYS.map((w) => (
          <View key={w} className="flex-1 items-center">
            <Text className="text-xs text-gray-400">{w}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day === null) {
            return <View key={`e-${i}`} className="w-[14.28%] h-10" />;
          }
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = dayMap.get(dateStr);
          const isSelected = dateStr === selectedDate;

          return (
            <Pressable
              key={dateStr}
              className={cn(
                "w-[14.28%] h-10 items-center justify-center",
                isSelected && "bg-primary/10 rounded-lg"
              )}
              onPress={() => onSelectDate(dateStr)}
            >
              <Text
                className={cn(
                  "text-sm",
                  isSelected ? "text-primary font-bold" : "text-gray-700"
                )}
              >
                {day}
              </Text>
              {status && status !== "NOT_ATTENDED" && (
                <View
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mt-0.5",
                    DOT_COLOR[status] ?? "bg-gray-300"
                  )}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
