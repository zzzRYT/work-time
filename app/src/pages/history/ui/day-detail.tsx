import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { StatusBadge } from "@shared/ui/status-badge";

type Session = {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  isLate: boolean;
  durationMinutes: number | null;
};

type DayDetailProps = {
  date: string;
  sessions: Session[];
  totalDurationMinutes: number;
  vacationHours: number | null;
  className?: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function DayDetail({
  date,
  sessions,
  totalDurationMinutes,
  vacationHours,
  className,
}: DayDetailProps) {
  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        {date}
      </Text>

      {vacationHours != null && vacationHours > 0 && (
        <View className="flex-row items-center mb-3 bg-vacation/10 rounded-lg px-3 py-2">
          <StatusBadge status="VACATION" />
          <Text className="text-vacation text-sm ml-2">
            {vacationHours}시간 휴가
          </Text>
        </View>
      )}

      {sessions.length === 0 ? (
        <Text className="text-gray-400 text-sm py-4">
          기록이 없습니다.
        </Text>
      ) : (
        sessions.map((s) => (
          <View
            key={s.id}
            className="flex-row items-center py-2 border-b border-gray-100"
          >
            <Text className="text-sm text-gray-700 flex-1">
              {formatTime(s.checkInTime)} →{" "}
              {s.checkOutTime ? formatTime(s.checkOutTime) : "진행중"}
            </Text>
            {s.durationMinutes != null && (
              <Text className="text-sm text-gray-500 mr-2">
                {Math.floor(s.durationMinutes / 60)}h {s.durationMinutes % 60}m
              </Text>
            )}
            {s.isLate && <StatusBadge status="LATE" />}
          </View>
        ))
      )}

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <Text className="text-sm font-medium text-gray-700">합계</Text>
        <Text className="text-sm font-bold text-primary">
          {Math.floor(totalDurationMinutes / 60)}시간{" "}
          {totalDurationMinutes % 60}분
        </Text>
      </View>
    </View>
  );
}
