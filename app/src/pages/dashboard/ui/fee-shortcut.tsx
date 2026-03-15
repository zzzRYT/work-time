import { Alert, Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type PaymentStatus = "UNPAID" | "PENDING" | "PAID";

type FeeCardProps = {
  title: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  onRequest: () => void;
  className?: string;
};

function FeeCard({ title, description, amount, status, onRequest, className }: FeeCardProps) {
  if (status === "PAID") return null;

  const handlePress = () => {
    Alert.alert(
      `${title} 납부 신청`,
      `${amount.toLocaleString()}원을 납부 신청하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { text: "납부 신청", onPress: onRequest },
      ]
    );
  };

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-sm font-semibold text-gray-900 mb-1">{title}</Text>
      <Text className="text-xs text-gray-500 mb-3">{description}</Text>

      {status === "UNPAID" ? (
        <Pressable
          className="rounded-xl py-2.5 items-center border border-primary"
          onPress={handlePress}
        >
          <Text className="text-sm font-semibold text-primary">납부 신청</Text>
        </Pressable>
      ) : (
        <View className="rounded-xl py-2.5 items-center bg-yellow-100">
          <Text className="text-sm font-semibold text-yellow-600">확인 대기 중</Text>
        </View>
      )}
    </View>
  );
}

type FeeShortcutProps = {
  monthlyFee: number;
  monthlyFeeStatus: PaymentStatus;
  lateFee: number;
  lateFeeStatus: PaymentStatus;
  lateCount: number;
  onRequestMonthlyFee: () => void;
  onRequestLateFee: () => void;
  className?: string;
};

export function FeeShortcut({
  monthlyFee,
  monthlyFeeStatus,
  lateFee,
  lateFeeStatus,
  lateCount,
  onRequestMonthlyFee,
  onRequestLateFee,
  className,
}: FeeShortcutProps) {
  const showMonthly = monthlyFeeStatus !== "PAID";
  const showLate = lateCount > 0 && lateFeeStatus !== "PAID";

  if (!showMonthly && !showLate) return null;

  return (
    <View className={className}>
      {showMonthly && (
        <FeeCard
          title="월 회비"
          description={`${monthlyFee.toLocaleString()}원`}
          amount={monthlyFee}
          status={monthlyFeeStatus}
          onRequest={onRequestMonthlyFee}
          className={showLate ? "mb-3" : undefined}
        />
      )}
      {showLate && (
        <FeeCard
          title="지각비"
          description={`지각 ${lateCount}회 · ${lateFee.toLocaleString()}원`}
          amount={lateFee}
          status={lateFeeStatus}
          onRequest={onRequestLateFee}
        />
      )}
    </View>
  );
}
