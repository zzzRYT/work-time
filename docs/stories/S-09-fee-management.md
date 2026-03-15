# S-09. 회비/지각비 납부 상태 관리하기

> **관련 스펙**: REQ-1.3.1 ~ REQ-1.3.6
> **상태**: 🟡 재설계 중 (v2)

---

## 설계 원칙

| 탭 | 역할 | 설명 |
|----|------|------|
| **대시보드** | 내 액션 | 본인의 미납 항목을 조건부 표시하고 납부 신청 |
| **멤버** | 전체 조회 | 모든 멤버의 납부 현황을 읽기 전용으로 확인 |
| **관리** | 어드민 액션 | PENDING 항목을 확인/거절 |

**핵심 변경:** 월 회비와 지각비를 **별도 납부** 가능하도록 분리

---

## 유저 스토리

**AS** 스터디원
**I WANT TO** 월 회비와 지각비를 각각 납부 신청
**SO THAT** 부분 납부가 가능하고 어떤 항목을 냈는지 명확하다

**AS** 관리자
**I WANT TO** 회비/지각비 납부 요청을 각각 확인·거절
**SO THAT** 항목별로 정확한 납부 이력이 관리된다

---

## 데이터 모델 변경

### MonthlyFee (Prisma)

```diff
model MonthlyFee {
  id                    String @id @default(cuid())
  memberId              String
  month                 String
- paymentStatus         String @default("UNPAID")
+ monthlyFeeStatus      String @default("UNPAID")
+ lateFeeStatus         String @default("UNPAID")

  member Member @relation(fields: [memberId], references: [id])

  @@unique([memberId, month])
  @@map("monthly_fees")
}
```

### FeeStatusEntry (GraphQL)

```diff
type FeeStatusEntry {
  member: Member!
  lateFee: Int!
  monthlyFee: Int!
- paymentStatus: PaymentStatus!
+ monthlyFeeStatus: PaymentStatus!
+ lateFeeStatus: PaymentStatus!
  lateCount: Int!
}
```

### Mutation 변경

기존 mutation에 `type` 파라미터 추가:

```graphql
enum FeeType {
  MONTHLY
  LATE
}

"""멤버가 납부 완료 신청 (UNPAID → PENDING)"""
requestFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
"""어드민이 납부 확인 (PENDING → PAID)"""
confirmFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
"""어드민이 납부 거절 (PENDING → UNPAID)"""
rejectFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
```

---

## 플로우

### 플로우 1: 대시보드 — 본인 납부 카드 (조건부 표시)

```
[대시보드 진입] → [본인 feeStatus 조회]
  → 월 회비 UNPAID? → "월 회비 10,000원 — [납부 신청]" 카드 표시
  → 지각 있고 지각비 UNPAID? → "지각비 2,000원 — [납부 신청]" 카드 표시
  → 둘 다 PAID → 카드 숨김
```

| 단계 | 사용자 행동 | 시스템 반응 | UI 위치 |
|------|------------|-----------|---------|
| 1 | 대시보드 진입 | feeStatus 조회, 본인 항목 추출 | AttendanceCard 아래 |
| 2 | 월 회비 "납부 신청" 탭 | Alert 확인 → `requestFeePayment(type: MONTHLY)` | 월 회비 카드 |
| 3 | — | 상태: UNPAID → PENDING, 카드 → "확인 대기 중" | 월 회비 카드 |
| 4 | 지각비 "납부 신청" 탭 | Alert 확인 → `requestFeePayment(type: LATE)` | 지각비 카드 |
| 5 | — | 상태: UNPAID → PENDING, 카드 → "확인 대기 중" | 지각비 카드 |

### 플로우 2: 멤버 탭 — 전체 납부 현황 조회 (읽기 전용)

```
[멤버 탭] → [스크롤] → ["납부 현황" 섹션]
→ [멤버별 월 회비 상태 · 지각비 상태 뱃지 표시]
```

**버튼 없음.** 뱃지만 표시.

### 플로우 3: 관리 탭 — 납부 확인/거절

```
[관리 탭] → ["납부 확인" 섹션]
→ [PENDING 항목만 표시: 항목 종류(월 회비/지각비) + 멤버 이름]
→ [확인] or [거절] 탭
```

| 단계 | 사용자 행동 | 시스템 반응 |
|------|------------|-----------|
| 1 | "확인" 탭 | `confirmFeePayment(type: MONTHLY or LATE)` → PAID |
| 2 | "거절" 탭 | `rejectFeePayment(type: MONTHLY or LATE)` → UNPAID |

---

## UI 레이아웃

### 대시보드 — 납부 카드 (조건부)

```
┌─────────────────────────────────┐
│  월 회비                          │  ← monthlyFeeStatus !== PAID일 때만
│  10,000원                        │
│                                 │
│  [납부 신청]                      │  ← UNPAID일 때
│  ─── 또는 ───                    │
│  ◻ 확인 대기 중                    │  ← PENDING일 때
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  지각비                           │  ← lateCount > 0 && lateFeeStatus !== PAID일 때만
│  지각 2회 · 2,000원               │
│                                 │
│  [납부 신청]                      │  ← UNPAID일 때
│  ─── 또는 ───                    │
│  ◻ 확인 대기 중                    │  ← PENDING일 때
└─────────────────────────────────┘
```

### 멤버 탭 — 납부 현황 (읽기 전용)

```
┌──────────────────────────────────────────┐
│  납부 현황                                 │
│                                          │
│  🟣 홍길동   월 회비 ✅  지각비 🔴 (2회 2,000원) │
│  🔵 김철수   월 회비 🟠  지각비 ✅ (1회 1,000원) │
│  🟢 이영희   월 회비 ✅  지각비 —  (0회)        │  ← 지각 없으면 — 표시
│  🟠 박지민   월 회비 🔴  지각비 🔴 (3회 3,000원) │
└──────────────────────────────────────────┘
```

**뱃지 색상:**
| 상태 | 표시 |
|------|------|
| UNPAID | 🔴 미납 |
| PENDING | 🟠 대기 |
| PAID | ✅ 납부 |
| 지각 없음 | — (회색) |

### 관리 탭 — 납부 확인

```
┌─────────────────────────────────┐
│  납부 확인                        │
│                                 │
│  확인 대기 중인 항목이 없습니다      │  ← PENDING 없을 때
│                                 │
│  ─── 또는 ───                    │
│                                 │
│  🔵 김철수   월 회비               │
│              [확인]  [거절]       │
│  ─────────────────────────────  │
│  🟠 박지민   지각비 3,000원        │
│              [확인]  [거절]       │
└─────────────────────────────────┘
```

---

## 데이터 흐름

```
feeStatus(month: "2026-03")
    → [{ member, lateFee, monthlyFee, monthlyFeeStatus, lateFeeStatus, lateCount }]

[대시보드 — 납부 신청]
    requestFeePayment(memberId, month, type: MONTHLY)
    → MonthlyFee.monthlyFeeStatus = PENDING

    requestFeePayment(memberId, month, type: LATE)
    → MonthlyFee.lateFeeStatus = PENDING

[관리 탭 — 납부 확인]
    confirmFeePayment(memberId, month, type: MONTHLY)
    → MonthlyFee.monthlyFeeStatus = PAID

    confirmFeePayment(memberId, month, type: LATE)
    → MonthlyFee.lateFeeStatus = PAID

[관리 탭 — 납부 거절]
    rejectFeePayment(memberId, month, type: MONTHLY or LATE)
    → 해당 필드 = UNPAID

* lateFee = lateCount × settings.lateFeeAmount (서버 계산)
* monthlyFee = 10,000원 (상수 MONTHLY_FEE)
* month = 현재 년-월 (YYYY-MM)
```

---

## 서브 이슈

### S-09-1. 서버 — MonthlyFee 모델 분리 마이그레이션

> **우선순위**: 높음 | **상태**: 🔴 미구현

`paymentStatus` 단일 필드를 `monthlyFeeStatus` + `lateFeeStatus` 두 필드로 분리.

**작업:**
1. Prisma 스키마 변경: `paymentStatus` → `monthlyFeeStatus` + `lateFeeStatus`
2. 마이그레이션 실행: `npx prisma migrate dev`
3. seed.ts 업데이트 (필요 시)

**데이터 마이그레이션:**
- 기존 `paymentStatus` 값 → `monthlyFeeStatus`로 복사
- `lateFeeStatus` 기본값 `UNPAID`

---

### S-09-2. 서버 — FeeType enum + mutation 변경

> **우선순위**: 높음 | **상태**: 🔴 미구현

mutation에 `type: FeeType!` 파라미터 추가.

**GraphQL 스키마 변경:**
```graphql
enum FeeType { MONTHLY, LATE }

requestFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
confirmFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
rejectFeePayment(memberId: ID!, month: String!, type: FeeType!): MonthlyFee!
```

**FeeStatusEntry 변경:**
```graphql
type FeeStatusEntry {
  member: Member!
  lateFee: Int!
  monthlyFee: Int!
  monthlyFeeStatus: PaymentStatus!
  lateFeeStatus: PaymentStatus!
  lateCount: Int!
}
```

**Resolver 변경:**
- `type` 파라미터에 따라 `monthlyFeeStatus` 또는 `lateFeeStatus` 필드 업데이트
- `feeStatus` query: 두 상태 모두 반환

---

### S-09-3. 클라이언트 — graphql-env.d.ts 재생성

> **우선순위**: 높음 | **상태**: 🔴 미구현

서버 스키마 변경 후 `npm run graphql:sync` 실행.

---

### S-09-4. 클라이언트 — 대시보드 납부 카드 (조건부)

> **우선순위**: 높음 | **상태**: 🟡 리팩토링 필요

기존 `fee-shortcut.tsx`를 리팩토링하여 월 회비/지각비 각각 별도 카드로 표시.

**표시 조건:**
| 항목 | 표시 조건 |
|------|----------|
| 월 회비 카드 | `monthlyFeeStatus !== 'PAID'` |
| 지각비 카드 | `lateCount > 0 && lateFeeStatus !== 'PAID'` |

**DashboardPage.tsx:**
- `requestFeePayment` mutation에 `type` 파라미터 추가
- `FeeShortcut` → 두 개의 개별 카드로 분리 또는 `type` prop 추가

---

### S-09-5. 클라이언트 — 멤버 탭 읽기 전용 납부 현황

> **우선순위**: 높음 | **상태**: 🟡 리팩토링 필요

기존 `fee-section.tsx`에서 모든 액션 버튼 제거. 뱃지만 표시.

**fee-section.tsx 변경:**
- `onRequestPayment`, `onConfirmPayment`, `onRejectPayment` props 제거
- `selectedMemberId`, `selectedMemberRole` props 제거
- 행별로 월 회비 뱃지 + 지각비 뱃지 (+ 지각 정보) 표시
- 지각 없는 멤버는 지각비 영역에 "—" 표시

**MembersPage.tsx:**
- confirm/reject mutation 코드 제거
- FeeSection에 단순 `entries` props만 전달

---

### S-09-6. 클라이언트 — 관리 탭 납부 확인 (항목별)

> **우선순위**: 높음 | **상태**: 🟡 리팩토링 필요

기존 `fee-confirm-section.tsx`를 수정하여 항목 종류(월 회비/지각비)를 구분 표시.

**fee-confirm-section.tsx 변경:**
- PENDING 항목을 `{ member, type: 'MONTHLY' | 'LATE', amount }` 형태로 변환
- 월 회비 PENDING + 지각비 PENDING을 각각 별도 행으로 표시
- 확인/거절 시 `type` 파라미터 전달

**AdminPage.tsx:**
- mutation에 `type` 파라미터 추가

---

### S-09-7. 납부 신청 확인 다이얼로그

> **우선순위**: 중간 | **상태**: ✅ 구현됨 (리팩토링 필요)

대시보드에서 납부 신청 시 `Alert.alert`로 확인. 항목별 금액 표시.

```
┌─────────────────────────┐
│  월 회비 납부 신청         │
│                         │
│  10,000원을 납부          │
│  신청하시겠습니까?         │
│                         │
│  [취소]      [납부 신청]   │
└─────────────────────────┘
```

---

## 구현 현황

### 완료 (서버 — v2)
- [x] `MonthlyFee` 모델 — `monthlyFeeStatus` + `lateFeeStatus` 분리
- [x] `FeeType` enum — `MONTHLY | LATE`
- [x] `feeStatus` query — 두 상태 반환
- [x] mutation 3종 — `type: FeeType!` 파라미터 추가

### 완료 (클라이언트 — v2)
- [x] graphql-env.d.ts — 스키마 동기화 완료
- [x] fee-shortcut.tsx — 월 회비/지각비 별도 카드 (조건부 표시)
- [x] fee-section.tsx — 읽기 전용 (뱃지만 표시)
- [x] fee-confirm-section.tsx — 항목 종류별 확인/거절
- [x] date.ts — 공유 유틸

### 서브 이슈
- [x] S-09-1: 서버 — MonthlyFee 모델 분리 마이그레이션
- [x] S-09-2: 서버 — FeeType enum + mutation 변경
- [x] S-09-3: 클라이언트 — graphql-env.d.ts 재생성
- [x] S-09-4: 클라이언트 — 대시보드 납부 카드 (조건부)
- [x] S-09-5: 클라이언트 — 멤버 탭 읽기 전용 납부 현황
- [x] S-09-6: 클라이언트 — 관리 탭 납부 확인 (항목별)
- [x] S-09-7: 납부 신청 확인 다이얼로그
