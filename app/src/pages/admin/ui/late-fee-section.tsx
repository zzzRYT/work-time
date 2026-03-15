import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { cn } from "@shared/lib/cn";

type LateFeeSectionProps = {
  currentAmount: number;
  onSave: (amount: number) => void;
  className?: string;
};

export function LateFeeSection({
  currentAmount,
  onSave,
  className,
}: LateFeeSectionProps) {
  const [amount, setAmount] = useState(String(currentAmount));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const num = parseInt(amount.replace(/,/g, ""), 10);

    if (isNaN(num) || num < 0) {
      setError("0 이상의 금액을 입력하세요");
      return;
    }

    setError(null);
    onSave(num);
  };

  const parsedAmount = parseInt(amount.replace(/,/g, ""), 10);
  const hasChanged = !isNaN(parsedAmount) && parsedAmount !== currentAmount;

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-1">
        지각비 설정
      </Text>
      <Text className="text-sm text-gray-500 mb-3">
        현재: {currentAmount.toLocaleString()}원
      </Text>

      <View className="flex-row items-center mb-2">
        <TextInput
          className="border border-gray-200 rounded-lg px-3 py-2 flex-1 text-base"
          keyboardType="number-pad"
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            setError(null);
          }}
          placeholder="금액"
        />
        <Text className="text-base text-gray-500 ml-2">원</Text>
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
