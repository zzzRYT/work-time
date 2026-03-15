import { Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type PaymentStatus = "UNPAID" | "PENDING" | "PAID";

type FeeEntry = {
  member: { id: string; displayName: string; color: string };
  lateFee: number;
  monthlyFee: number;
  monthlyFeeStatus: PaymentStatus;
  lateFeeStatus: PaymentStatus;
  lateCount: number;
};

type FeeSectionProps = {
  entries: FeeEntry[];
  className?: string;
};

const statusLabel: Record<PaymentStatus, string> = {
  UNPAID: "미납",
  PENDING: "대기",
  PAID: "납부",
};

const statusBg: Record<PaymentStatus, string> = {
  UNPAID: "bg-late/20",
  PENDING: "bg-yellow-100",
  PAID: "bg-studying/20",
};

const statusText: Record<PaymentStatus, string> = {
  UNPAID: "text-late",
  PENDING: "text-yellow-600",
  PAID: "text-studying",
};

function Badge({ status }: { status: PaymentStatus }) {
  return (
    <View className={cn("rounded-full px-2 py-0.5", statusBg[status])}>
      <Text className={cn("text-[10px] font-semibold", statusText[status])}>
        {statusLabel[status]}
      </Text>
    </View>
  );
}

export function FeeSection({ entries, className }: FeeSectionProps) {
  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        납부 현황
      </Text>
      {entries.map((e) => (
        <View
          key={e.member.id}
          className="flex-row items-center py-3 border-b border-gray-100"
        >
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: e.member.color }}
          >
            <Text className="text-white text-xs font-bold">
              {e.member.displayName.charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-900">
              {e.member.displayName}
            </Text>
            {e.lateCount > 0 && (
              <Text className="text-xs text-gray-500">
                지각 {e.lateCount}회 · {e.lateFee.toLocaleString()}원
              </Text>
            )}
          </View>
          <View className="flex-row items-center gap-1">
            <View className="items-center">
              <Text className="text-[9px] text-gray-400 mb-0.5">회비</Text>
              <Badge status={e.monthlyFeeStatus} />
            </View>
            {e.lateCount > 0 ? (
              <View className="items-center">
                <Text className="text-[9px] text-gray-400 mb-0.5">지각비</Text>
                <Badge status={e.lateFeeStatus} />
              </View>
            ) : (
              <View className="items-center">
                <Text className="text-[9px] text-gray-400 mb-0.5">지각비</Text>
                <View className="rounded-full px-2 py-0.5 bg-gray-50">
                  <Text className="text-[10px] font-semibold text-gray-300">—</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
