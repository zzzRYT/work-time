import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";
import { BottomSheet } from "@shared/ui/bottom-sheet";

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
  const [sheetVisible, setSheetVisible] = useState(false);

  if (status === "PAID") return null;

  return (
    <View className={cn("bg-surface rounded-lg p-4 border border-border", className)}>
      <Text className="text-sm font-semibold text-text-primary mb-1">{title}</Text>
      <Text className="text-xs text-text-muted mb-3">{description}</Text>

      {status === "UNPAID" ? (
        <Pressable
          className="rounded-lg py-2.5 items-center border border-primary"
          onPress={() => setSheetVisible(true)}
        >
          <Text className="text-sm font-semibold text-primary">납부 신청</Text>
        </Pressable>
      ) : (
        <View className="rounded-lg py-2.5 items-center bg-done-bg">
          <Text className="text-sm font-semibold text-done">확인 대기 중</Text>
        </View>
      )}

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={`${title} 납부 신청`}
      >
        <View className="bg-bg rounded-2xl p-4 mb-5">
          <Text className="text-[13px] text-text-muted mb-1">납부 금액</Text>
          <Text className="text-[22px] font-bold text-text-primary">
            {amount.toLocaleString()}원
          </Text>
        </View>

        <Pressable
          className="bg-primary rounded-2xl py-4 items-center mb-3"
          onPress={() => {
            setSheetVisible(false);
            onRequest();
          }}
        >
          <Text className="text-white text-[15px] font-semibold">납부 신청</Text>
        </Pressable>

        <Pressable
          className="py-3 items-center"
          onPress={() => setSheetVisible(false)}
        >
          <Text className="text-[15px] text-text-muted">취소</Text>
        </Pressable>
      </BottomSheet>
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
