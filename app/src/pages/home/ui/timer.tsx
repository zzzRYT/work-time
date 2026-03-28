import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type TimerProps = {
  checkInTime: string | null;
  className?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
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
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1_000)));
    }
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [checkInTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return (
    <View className={cn("items-center", className)}>
      <Text
        className={cn(
          "font-mono text-[48px] font-bold tracking-tight",
          checkInTime ? "text-white" : "text-text-subtle"
        )}
      >
        {pad(h)}:{pad(m)}:{pad(s)}
      </Text>
    </View>
  );
}
