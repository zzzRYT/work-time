import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { cn } from "@shared/lib/cn";

type StudyTimeSectionProps = {
  currentHour: number;
  currentMinute: number;
  onSave: (hour: number, minute: number) => void;
  className?: string;
};

export function StudyTimeSection({
  currentHour,
  currentMinute,
  onSave,
  className,
}: StudyTimeSectionProps) {
  const [hour, setHour] = useState(String(currentHour));
  const [minute, setMinute] = useState(String(currentMinute));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);

    if (isNaN(h) || h < 0 || h > 23) {
      setError("0~23 사이 값을 입력하세요");
      return;
    }
    if (isNaN(m) || m < 0 || m > 59) {
      setError("0~59 사이 값을 입력하세요");
      return;
    }

    setError(null);
    onSave(h, m);
  };

  const hasChanged =
    parseInt(hour, 10) !== currentHour ||
    parseInt(minute, 10) !== currentMinute;

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-1">
        출근 시간 설정
      </Text>
      <Text className="text-sm text-gray-500 mb-3">
        현재: {String(currentHour).padStart(2, "0")}:
        {String(currentMinute).padStart(2, "0")}
      </Text>

      <View className="flex-row items-center mb-2">
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2 w-16 text-center text-base"
          keyboardType="number-pad"
          value={hour}
          onChangeText={(v) => {
            setHour(v);
            setError(null);
          }}
          maxLength={2}
          placeholder="시"
        />
        <Text className="text-lg font-bold mx-2">:</Text>
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2 w-16 text-center text-base"
          keyboardType="number-pad"
          value={minute}
          onChangeText={(v) => {
            setMinute(v);
            setError(null);
          }}
          maxLength={2}
          placeholder="분"
        />
      </View>

      {error && (
        <Text className="text-xs text-late mb-2">{error}</Text>
      )}

      <Pressable
        className={cn(
          "rounded-xl py-3 items-center",
          hasChanged ? "bg-primary" : "bg-gray-200"
        )}
        onPress={handleSave}
        disabled={!hasChanged}
      >
        <Text
          className={cn(
            "text-sm font-semibold",
            hasChanged ? "text-white" : "text-gray-400"
          )}
        >
          저장
        </Text>
      </Pressable>
    </View>
  );
}
