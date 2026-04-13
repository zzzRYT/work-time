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

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export function DayDetail({
  date,
  sessions,
  totalDurationMinutes,
  vacationHours,
  className,
}: DayDetailProps) {
  const hasActiveSession = sessions.some((s) => !s.checkOutTime);

  return (
    <View className={cn("bg-surface rounded-lg p-4", className)}>
      <Text className="text-base font-semibold text-text-primary mb-3">
        {date}
      </Text>

      {vacationHours != null && vacationHours > 0 && (
        <View className="flex-row items-center mb-3 bg-vacation/10 rounded-lg px-3 py-2">
          <StatusBadge status="VACATION" />
          <Text className="text-vacation text-sm ml-2">
            {vacationHours === 8 ? "전일 휴가" : `휴가 ${vacationHours}h`}
          </Text>
        </View>
      )}

      {sessions.length === 0 ? (
        <View className="items-center py-6">
          <Text className="text-text-subtle text-sm">기록이 없습니다</Text>
        </View>
      ) : (
        sessions.map((s) => {
          const isActive = !s.checkOutTime;
          return (
            <View
              key={s.id}
              className="flex-row items-center py-2.5 border-b border-border"
            >
              {s.isLate && (
                <StatusBadge status="LATE" className="mr-2" />
              )}
              <Text
                className={cn(
                  "text-sm flex-1",
                  isActive ? "text-studying font-medium" : "text-text-primary"
                )}
              >
                {formatTime(s.checkInTime)} →{" "}
                {isActive ? (
                  <Text className="text-studying font-medium">진행 중</Text>
                ) : (
                  formatTime(s.checkOutTime!)
                )}
              </Text>
              {s.durationMinutes != null && (
                <Text
                  className={cn(
                    "text-sm",
                    isActive ? "text-studying" : "text-text-muted"
                  )}
                >
                  {formatDuration(s.durationMinutes)}
                  {isActive && "~"}
                </Text>
              )}
            </View>
          );
        })
      )}

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
        <Text className="text-sm font-medium text-text-primary">합계</Text>
        <Text className="text-sm font-bold text-primary">
          {formatDuration(totalDurationMinutes)}
          {hasActiveSession && "~"}
        </Text>
      </View>
    </View>
  );
}
