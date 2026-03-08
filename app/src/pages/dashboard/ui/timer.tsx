import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type TimerProps = {
  checkInTime: string | null;
  className?: string;
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}시간 ${m}분 ${s}초`;
}

export function Timer({ checkInTime, className }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!checkInTime) {
      setElapsed(0);
      return;
    }

    const start = new Date(checkInTime).getTime();

    function tick() {
      setElapsed(Math.floor((Date.now() - start) / 1_000));
    }

    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [checkInTime]);

  if (!checkInTime) {
    return (
      <View className={cn("items-center py-4", className)}>
        <Text className="text-4xl font-bold text-gray-300">0시간 0분 0초</Text>
      </View>
    );
  }

  return (
    <View className={cn("items-center py-4", className)}>
      <Text className="text-4xl font-bold text-studying">
        {formatDuration(elapsed)}
      </Text>
      <Text className="text-xs text-gray-400 mt-1">공부중</Text>
    </View>
  );
}
