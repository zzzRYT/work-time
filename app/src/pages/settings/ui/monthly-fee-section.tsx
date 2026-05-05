import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { cn } from "@shared/lib/cn";

type MonthlyFeeSectionProps = {
  currentAmount: number;
  onSave: (amount: number) => void;
  className?: string;
};

export function MonthlyFeeSection({
  currentAmount,
  onSave,
  className,
}: MonthlyFeeSectionProps) {
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
    <View className={cn("bg-surface rounded-lg p-4 border border-border", className)}>
      <Text className="text-base font-semibold text-text-primary mb-1">
        월 회비 설정
      </Text>
      <Text className="text-sm text-text-muted mb-3">
        현재: {currentAmount.toLocaleString()}원
      </Text>

      <View className="flex-row items-center mb-2">
        <TextInput
          className="border border-border rounded-lg px-3 py-2 flex-1 text-base"
          keyboardType="number-pad"
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            setError(null);
          }}
          placeholder="금액"
        />
        <Text className="text-base text-text-muted ml-2">원</Text>
      </View>

      {error && (
        <Text className="text-xs text-late mb-2">{error}</Text>
      )}

      <Pressable
        className={cn(
          "rounded-xl py-3 items-center",
          hasChanged ? "bg-primary" : "bg-surface"
        )}
        onPress={handleSave}
        disabled={!hasChanged}
      >
        <Text
          className={cn(
            "text-sm font-semibold",
            hasChanged ? "text-white" : "text-text-subtle"
          )}
        >
          저장
        </Text>
      </Pressable>
    </View>
  );
}
