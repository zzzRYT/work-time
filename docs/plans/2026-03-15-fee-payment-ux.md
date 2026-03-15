# Fee Payment UX Improvement (S-09-2 ~ S-09-5) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 역할/본인 기반 납부 인터랙션을 멤버 탭, 관리 탭, 대시보드 3곳에 구현한다.

**Architecture:** fee-section.tsx에 역할/본인 분기 로직 추가, 관리 탭에 PENDING 전용 납부 확인 섹션 신설, 대시보드에 납부 바로가기 컴포넌트 추가. `getCurrentMonth` 유틸을 공유 모듈로 추출하여 DRY.

**Tech Stack:** React Native, Apollo Client, gql.tada, NativeWind, Zustand

---

## Task 1: `getCurrentMonth` 유틸 추출

**Files:**
- Create: `app/src/shared/lib/date.ts`
- Modify: `app/src/pages/members/MembersPage.tsx:70-74` (함수 제거, import 변경)

**Step 1: 공유 유틸 생성**

```typescript
// app/src/shared/lib/date.ts
export function getCurrentMonth(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 7);
}

export function getTodayString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
```

**Step 2: MembersPage에서 로컬 함수 제거하고 import로 교체**

`MembersPage.tsx`에서:
- `getCurrentMonth` 로컬 함수(70-74행) 삭제
- `import { getCurrentMonth } from "@shared/lib/date";` 추가

**Step 3: DashboardPage에서도 `getTodayString` 로컬 함수를 공유 유틸로 교체**

`DashboardPage.tsx`에서:
- `getTodayString` 로컬 함수(72-76행) 삭제
- `import { getTodayString } from "@shared/lib/date";` 추가

**Step 4: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

---

## Task 2: fee-section.tsx — 역할 기반 버튼 분기 (S-09-2)

**Files:**
- Modify: `app/src/pages/members/ui/fee-section.tsx` (전체 리팩토링)
- Modify: `app/src/pages/members/MembersPage.tsx` (props 추가, mutation 추가)

**Step 1: fee-section.tsx props 확장 및 역할 기반 렌더링**

```tsx
// app/src/pages/members/ui/fee-section.tsx
import { Alert, Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type PaymentStatus = "UNPAID" | "PENDING" | "PAID";

type FeeEntry = {
  member: { id: string; displayName: string; color: string };
  lateFee: number;
  monthlyFee: number;
  paymentStatus: PaymentStatus;
  lateCount: number;
};

type FeeSectionProps = {
  entries: FeeEntry[];
  selectedMemberId: string | null;
  selectedMemberRole: "ADMIN" | "MEMBER";
  onRequestPayment: (memberId: string, lateFee: number, monthlyFee: number) => void;
  onConfirmPayment: (memberId: string) => void;
  onRejectPayment: (memberId: string) => void;
  className?: string;
};

const statusConfig: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  UNPAID: { label: "미납", bg: "bg-late/20", text: "text-late" },
  PENDING: { label: "대기", bg: "bg-yellow-100", text: "text-yellow-600" },
  PAID: { label: "납부", bg: "bg-studying/20", text: "text-studying" },
};

export function FeeSection({
  entries,
  selectedMemberId,
  selectedMemberRole,
  onRequestPayment,
  onConfirmPayment,
  onRejectPayment,
  className,
}: FeeSectionProps) {
  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        회비 현황
      </Text>
      {entries.map((e) => {
        const isMe = e.member.id === selectedMemberId;
        const isAdmin = selectedMemberRole === "ADMIN";

        return (
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
              <Text className="text-xs text-gray-500">
                지각 {e.lateCount}회 · 지각비 {e.lateFee.toLocaleString()}원
              </Text>
            </View>
            <FeeAction
              status={e.paymentStatus}
              isMe={isMe}
              isAdmin={isAdmin}
              onRequest={() => onRequestPayment(e.member.id, e.lateFee, e.monthlyFee)}
              onConfirm={() => onConfirmPayment(e.member.id)}
              onReject={() => onRejectPayment(e.member.id)}
            />
          </View>
        );
      })}
    </View>
  );
}

function FeeAction({
  status,
  isMe,
  isAdmin,
  onRequest,
  onConfirm,
  onReject,
}: {
  status: PaymentStatus;
  isMe: boolean;
  isAdmin: boolean;
  onRequest: () => void;
  onConfirm: () => void;
  onReject: () => void;
}) {
  // PAID → 항상 뱃지만
  if (status === "PAID") {
    return <Badge status="PAID" />;
  }

  // UNPAID + 본인 → 납부 신청 버튼
  if (status === "UNPAID" && isMe) {
    return (
      <Pressable
        className="rounded-full px-3 py-1 border border-primary"
        onPress={onRequest}
      >
        <Text className="text-xs font-semibold text-primary">납부 신청</Text>
      </Pressable>
    );
  }

  // PENDING + 관리자 → 확인/거절 버튼
  if (status === "PENDING" && isAdmin) {
    return (
      <View className="flex-row gap-1">
        <Pressable
          className="rounded-full px-2.5 py-1 bg-studying/20"
          onPress={onConfirm}
        >
          <Text className="text-xs font-semibold text-studying">확인</Text>
        </Pressable>
        <Pressable
          className="rounded-full px-2.5 py-1 bg-late/20"
          onPress={onReject}
        >
          <Text className="text-xs font-semibold text-late">거절</Text>
        </Pressable>
      </View>
    );
  }

  // 그 외 → 상태 뱃지만
  return <Badge status={status} />;
}

function Badge({ status }: { status: PaymentStatus }) {
  const config = statusConfig[status];
  return (
    <View className={cn("rounded-full px-3 py-1", config.bg)}>
      <Text className={cn("text-xs font-semibold", config.text)}>
        {config.label}
      </Text>
    </View>
  );
}
```

**Step 2: MembersPage.tsx — 선택 멤버 role 쿼리 + confirm/reject mutation 추가**

변경사항:
- `import { useMemberStore } from "@shared/store/member";` 추가
- `MEMBERS_PAGE_QUERY`의 `members` 필드에 `role` 추가
- `CONFIRM_FEE_PAYMENT`, `REJECT_FEE_PAYMENT` mutation 추가
- `handleConfirmPayment`, `handleRejectPayment` 핸들러 추가
- `handleRequestPayment`에 `Alert.alert` 확인 다이얼로그 추가 (S-09-4 포함)
- `FeeSection`에 새 props 전달

```tsx
// MembersPage.tsx 주요 변경 부분

// 쿼리: members에 role 추가
const MEMBERS_PAGE_QUERY = graphql(`
  query MembersPage($month: String!) {
    members {
      id
      name
      displayName
      color
      role
      currentStatus
      todayStudyMinutes
    }
    ...
  }
`);

// mutation 추가
const CONFIRM_FEE_PAYMENT = graphql(`
  mutation ConfirmFeePayment($memberId: ID!, $month: String!) {
    confirmFeePayment(memberId: $memberId, month: $month) {
      id
      paymentStatus
    }
  }
`);

const REJECT_FEE_PAYMENT = graphql(`
  mutation RejectFeePayment($memberId: ID!, $month: String!) {
    rejectFeePayment(memberId: $memberId, month: $month) {
      id
      paymentStatus
    }
  }
`);

// 컴포넌트 내부:
const selectedMemberId = useMemberStore((s) => s.selectedMemberId);
const selectedMember = data?.members.find((m) => m.id === selectedMemberId);
const selectedMemberRole = (selectedMember?.role ?? "MEMBER") as "ADMIN" | "MEMBER";

// handleRequestPayment에 확인 다이얼로그 추가 (S-09-4)
const handleRequestPayment = (memberId: string, lateFee: number, monthlyFee: number) => {
  Alert.alert(
    "납부 신청",
    `지각비 ${lateFee.toLocaleString()}원 + 회비 ${monthlyFee.toLocaleString()}원을 납부 신청하시겠습니까?`,
    [
      { text: "취소", style: "cancel" },
      {
        text: "납부 신청",
        onPress: async () => {
          try {
            await requestFeePayment({ variables: { memberId, month: currentMonth } });
            refetch();
          } catch (e) {
            Alert.alert("오류", e instanceof Error ? e.message : "알 수 없는 오류");
          }
        },
      },
    ]
  );
};

// confirm/reject 핸들러
const handleConfirmPayment = async (memberId: string) => { ... refetch(); };
const handleRejectPayment = async (memberId: string) => { ... refetch(); };

// JSX:
<FeeSection
  entries={data?.feeStatus ?? []}
  selectedMemberId={selectedMemberId}
  selectedMemberRole={selectedMemberRole}
  onRequestPayment={handleRequestPayment}
  onConfirmPayment={handleConfirmPayment}
  onRejectPayment={handleRejectPayment}
  className="mb-4"
/>
```

**Step 3: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

---

## Task 3: 관리 탭 — 납부 확인 섹션 (S-09-3)

**Files:**
- Create: `app/src/pages/admin/ui/fee-confirm-section.tsx`
- Modify: `app/src/pages/admin/AdminPage.tsx` (쿼리 확장, mutation 추가, 섹션 삽입)

**Step 1: fee-confirm-section.tsx 생성**

```tsx
// app/src/pages/admin/ui/fee-confirm-section.tsx
import { Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type PendingEntry = {
  member: { id: string; displayName: string; color: string };
  lateFee: number;
  lateCount: number;
};

type FeeConfirmSectionProps = {
  entries: PendingEntry[];
  onConfirm: (memberId: string) => void;
  onReject: (memberId: string) => void;
  className?: string;
};

export function FeeConfirmSection({
  entries,
  onConfirm,
  onReject,
  className,
}: FeeConfirmSectionProps) {
  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        납부 확인
      </Text>
      {entries.length === 0 ? (
        <Text className="text-sm text-gray-400 text-center py-4">
          확인 대기 중인 멤버가 없습니다
        </Text>
      ) : (
        entries.map((e) => (
          <View
            key={e.member.id}
            className="py-3 border-b border-gray-100"
          >
            <View className="flex-row items-center">
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
                <Text className="text-xs text-gray-500">
                  지각 {e.lateCount}회 · {e.lateFee.toLocaleString()}원
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2 mt-2 ml-11">
              <Pressable
                className="flex-1 rounded-xl py-2 items-center bg-studying/20"
                onPress={() => onConfirm(e.member.id)}
              >
                <Text className="text-sm font-semibold text-studying">확인</Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-xl py-2 items-center bg-late/20"
                onPress={() => onReject(e.member.id)}
              >
                <Text className="text-sm font-semibold text-late">거절</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
```

**Step 2: AdminPage.tsx 수정**

변경사항:
- `import { getCurrentMonth } from "@shared/lib/date";` 추가
- `import { FeeConfirmSection } from "./ui/fee-confirm-section";` 추가
- `ADMIN_QUERY`에 `feeStatus(month)` 추가
- `CONFIRM_FEE_PAYMENT`, `REJECT_FEE_PAYMENT` mutation 추가
- PENDING 항목 필터링 → `FeeConfirmSection`에 전달
- RoleSection 아래, StudyTimeSection 위에 `FeeConfirmSection` 삽입

```tsx
// ADMIN_QUERY 변경
const ADMIN_QUERY = graphql(`
  query AdminPage($month: String!) {
    members { id displayName color role }
    settings { id studyStartHour studyStartMinute lateFeeAmount }
    feeStatus(month: $month) {
      member { id displayName color }
      lateFee
      monthlyFee
      paymentStatus
      lateCount
    }
  }
`);

// 컴포넌트 내:
const currentMonth = getCurrentMonth();
const { data, loading } = useQuery(ADMIN_QUERY, { variables: { month: currentMonth } });

const pendingEntries = (data?.feeStatus ?? [])
  .filter((e) => e.paymentStatus === "PENDING");

// confirm/reject 핸들러 + 토스트

// JSX (RoleSection 아래):
<FeeConfirmSection
  entries={pendingEntries}
  onConfirm={handleConfirmPayment}
  onReject={handleRejectPayment}
  className="mb-4"
/>
```

**Step 3: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

---

## Task 4: 대시보드 — 납부 신청 바로가기 (S-09-5)

**Files:**
- Create: `app/src/pages/dashboard/ui/fee-shortcut.tsx`
- Modify: `app/src/pages/dashboard/DashboardPage.tsx` (쿼리 확장, 컴포넌트 삽입)

**Step 1: fee-shortcut.tsx 생성**

```tsx
// app/src/pages/dashboard/ui/fee-shortcut.tsx
import { Alert, Pressable, Text, View } from "react-native";
import { cn } from "@shared/lib/cn";

type PaymentStatus = "UNPAID" | "PENDING" | "PAID";

type FeeShortcutProps = {
  paymentStatus: PaymentStatus;
  lateFee: number;
  monthlyFee: number;
  lateCount: number;
  onRequestPayment: () => void;
  className?: string;
};

export function FeeShortcut({
  paymentStatus,
  lateFee,
  monthlyFee,
  lateCount,
  onRequestPayment,
  className,
}: FeeShortcutProps) {
  // PAID → 숨김
  if (paymentStatus === "PAID") return null;

  const handlePress = () => {
    Alert.alert(
      "납부 신청",
      `지각비 ${lateFee.toLocaleString()}원 + 회비 ${monthlyFee.toLocaleString()}원을 납부 신청하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { text: "납부 신청", onPress: onRequestPayment },
      ]
    );
  };

  return (
    <View className={cn("bg-white rounded-2xl p-4", className)}>
      <Text className="text-sm font-semibold text-gray-900 mb-1">
        이번 달 지각비
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        지각 {lateCount}회 · {lateFee.toLocaleString()}원
      </Text>

      {paymentStatus === "UNPAID" ? (
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
```

**Step 2: DashboardPage.tsx 수정**

변경사항:
- `import { getCurrentMonth } from "@shared/lib/date";` 추가 (Task 1에서 추출한 유틸)
- `import { FeeShortcut } from "./ui/fee-shortcut";` 추가
- `MEMBERS_QUERY`에 `feeStatus(month: $month)` 추가 + 쿼리에 `$month` 변수 추가
- `REQUEST_FEE_PAYMENT` mutation 추가 (MembersPage와 동일)
- 선택된 멤버의 feeStatus 항목 추출
- `AttendanceCard` 아래, `VacationButton` 위에 `FeeShortcut` 삽입

```tsx
// 쿼리 변경
const MEMBERS_QUERY = graphql(`
  query Members($month: String!) {
    members { ... }
    todayAttendanceSummary { ... }
    feeStatus(month: $month) {
      member { id }
      lateFee
      monthlyFee
      paymentStatus
      lateCount
    }
  }
`);

// 쿼리 호출
const currentMonth = getCurrentMonth();
const { data, loading, refetch: refetchMembers } = useQuery(MEMBERS_QUERY, {
  variables: { month: currentMonth },
  pollInterval: 30_000,
});

// 본인 feeStatus 추출
const myFee = data?.feeStatus?.find((f) => f.member.id === selectedMemberId);

// REQUEST_FEE_PAYMENT mutation 추가
const REQUEST_FEE_PAYMENT = graphql(`
  mutation DashboardRequestFeePayment($memberId: ID!, $month: String!) {
    requestFeePayment(memberId: $memberId, month: $month) {
      id
      paymentStatus
    }
  }
`);

// 핸들러
const handleRequestFeePayment = async () => {
  try {
    await requestFeePayment({
      variables: { memberId: selectedMemberId!, month: currentMonth },
    });
    refetchMembers();
    setToast({ message: "납부 확인 요청을 보냈습니다", variant: "success" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "납부 신청에 실패했습니다";
    setToast({ message: msg, variant: "error" });
  }
};

// JSX: AttendanceCard 아래, VacationButton 위
{myFee && (
  <FeeShortcut
    paymentStatus={myFee.paymentStatus}
    lateFee={myFee.lateFee}
    monthlyFee={myFee.monthlyFee}
    lateCount={myFee.lateCount}
    onRequestPayment={handleRequestFeePayment}
    className="mb-4"
  />
)}
```

**Step 3: refetchAll 배열 업데이트**

`MEMBERS_QUERY`에 `month` 변수가 추가되었으므로 `refetchAll`도 수정:
```tsx
const refetchAll = [
  { query: MEMBERS_QUERY, variables: { month: currentMonth } },
  { query: ACTIVE_SESSION, variables: { memberId: selectedMemberId! } },
];
```

**Step 4: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

---

## Task 5: 최종 검증

**Step 1: 전체 tsc 확인**

Run: `npx tsc --noEmit`

**Step 2: 스토리 구현 현황 업데이트**

`docs/stories/S-09-fee-management.md`의 서브 이슈 체크리스트 업데이트:
```markdown
- [x] S-09-2: 멤버 탭 — 역할 기반 납부 인터랙션
- [x] S-09-3: 관리 탭 — 납부 확인 섹션
- [x] S-09-4: 납부 신청 확인 다이얼로그
- [x] S-09-5: 대시보드 — 납부 신청 바로가기
```
