# Admin Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Member에 role(ADMIN/MEMBER) 필드를 추가하고, 관리자 전용 탭에서 관리자 지정, 출근 시간 설정, 지각비 설정을 할 수 있도록 한다.

**Architecture:** Member 모델에 `role` 필드 추가. 하드코딩된 상수(STUDY_START_HOUR, LATE_FEE_AMOUNT)를 DB 기반 `Setting` 모델로 전환. 관리자 탭은 role이 ADMIN인 멤버로 로그인했을 때만 표시. GraphQL mutation으로 설정 변경.

**Tech Stack:** GraphQL (Apollo Server/Client), Prisma (SQLite), React Native (Expo Router), TypeScript, NativeWind

---

### Task 1: Prisma - Member에 role 필드 추가

**Files:**
- Modify: `server/prisma/schema.prisma`

**Step 1: Member 모델에 role 필드 추가**

```prisma
model Member {
  id          String   @id @default(cuid())
  name        String
  displayName String
  color       String
  role        String   @default("MEMBER")  // "ADMIN" | "MEMBER"
  createdAt   DateTime @default(now())

  sessions       Session[]
  dailyVacations DailyVacation[]
  monthlyFees    MonthlyFee[]
}
```

**Step 2: Migration 실행**

Run: `cd server && npx prisma migrate dev --name add-member-role`

Expected: Migration 성공, role 필드 기본값 "MEMBER"로 추가

**Step 3: Commit**

```bash
git add server/prisma/
git commit -m "feat(server): add role field to Member model"
```

---

### Task 2: Prisma - Setting 모델 추가 (출근 시간, 지각비)

**Files:**
- Modify: `server/prisma/schema.prisma`

**Step 1: Setting 모델 추가**

```prisma
model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value String
}
```

이 모델은 key-value 형태로 설정을 저장:
- `studyStartHour`: "10"
- `studyStartMinute`: "0"
- `lateFeeAmount`: "1000"

**Step 2: Migration 실행**

Run: `cd server && npx prisma migrate dev --name add-setting-model`

**Step 3: seed에 기본 설정 추가**

`server/prisma/seed.ts`에 기본 설정 데이터 추가:

```typescript
await prisma.setting.upsert({
  where: { key: 'studyStartHour' },
  update: {},
  create: { key: 'studyStartHour', value: '10' },
});
await prisma.setting.upsert({
  where: { key: 'studyStartMinute' },
  update: {},
  create: { key: 'studyStartMinute', value: '0' },
});
await prisma.setting.upsert({
  where: { key: 'lateFeeAmount' },
  update: {},
  create: { key: 'lateFeeAmount', value: '1000' },
});
```

**Step 4: Seed 실행**

Run: `cd server && npx prisma db seed`

**Step 5: Commit**

```bash
git add server/prisma/
git commit -m "feat(server): add Setting model for configurable rules"
```

---

### Task 3: Server - 하드코딩 상수를 DB Setting으로 전환

**Files:**
- Modify: `server/src/constants.ts`
- Create: `server/src/services/settings.ts`
- Modify: `server/src/services/attendance.ts`
- Modify: `server/src/resolvers/session.ts`
- Modify: `server/src/resolvers/fee.ts`

**Step 1: settings 서비스 생성**

`server/src/services/settings.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

export async function getSetting(prisma: PrismaClient, key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

export async function getStudyStartTime(prisma: PrismaClient): Promise<{ hour: number; minute: number }> {
  const hour = await getSetting(prisma, 'studyStartHour');
  const minute = await getSetting(prisma, 'studyStartMinute');
  return {
    hour: hour ? parseInt(hour, 10) : 10,
    minute: minute ? parseInt(minute, 10) : 0,
  };
}

export async function getLateFeeAmount(prisma: PrismaClient): Promise<number> {
  const amount = await getSetting(prisma, 'lateFeeAmount');
  return amount ? parseInt(amount, 10) : 1000;
}
```

**Step 2: attendance.ts에서 isLateCheckIn을 async로 변경**

`isLateCheckIn` 함수가 현재 하드코딩된 `STUDY_START_HOUR`를 사용 중. DB에서 설정을 읽도록 변경:

```typescript
export async function isLateCheckIn(
  prisma: PrismaClient,
  checkInTime: Date,
  existingSessionsToday: Session[]
): Promise<boolean> {
  if (existingSessionsToday.length > 0) return false;
  const { hour, minute } = await getStudyStartTime(prisma);
  // checkInTime을 KST로 변환하여 hour/minute과 비교
  const kst = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
  const checkHour = kst.getUTCHours();
  const checkMinute = kst.getUTCMinutes();
  return checkHour > hour || (checkHour === hour && checkMinute > minute);
}
```

**Step 3: session resolver의 checkIn에서 isLateCheckIn 호출부 수정**

prisma를 인자로 전달하도록 변경.

**Step 4: fee resolver에서 LATE_FEE_AMOUNT를 DB에서 조회**

`feeStatus` resolver에서 `getLateFeeAmount(prisma)`를 사용.

**Step 5: constants.ts에서 STUDY_START_HOUR, LATE_FEE_AMOUNT를 폴백 기본값으로만 유지**

기존 상수는 삭제하지 않고 주석으로 "DB Setting의 기본값"으로 표기. 또는 settings 서비스의 폴백값으로만 사용.

**Step 6: Commit**

```bash
git add server/src/services/settings.ts server/src/services/attendance.ts server/src/resolvers/session.ts server/src/resolvers/fee.ts server/src/constants.ts
git commit -m "feat(server): use DB settings instead of hardcoded constants"
```

---

### Task 4: Server - 관리자 GraphQL API 추가

**Files:**
- Create: `server/src/schema/admin.ts`
- Create: `server/src/resolvers/admin.ts`
- Modify: `server/src/schema/index.ts`
- Modify: `server/src/resolvers/index.ts`

**Step 1: admin schema 정의**

`server/src/schema/admin.ts`:

```graphql
type Setting {
  key: String!
  value: String!
}

extend type Query {
  settings: [Setting!]!
}

extend type Mutation {
  setMemberRole(memberId: ID!, role: String!): Member!
  updateSetting(key: String!, value: String!): Setting!
}
```

**Step 2: admin resolver 구현**

`server/src/resolvers/admin.ts`:

```typescript
// settings query: 모든 설정 반환
// setMemberRole mutation: memberId의 role을 변경 (ADMIN/MEMBER)
// updateSetting mutation: key의 value를 업데이트 (upsert)
```

`setMemberRole`은 role이 "ADMIN" 또는 "MEMBER"인지 검증.
`updateSetting`은 key가 유효한 설정 키인지 검증 (studyStartHour, studyStartMinute, lateFeeAmount).

**Step 3: schema/index.ts와 resolvers/index.ts에 admin 등록**

**Step 4: Member GraphQL type에 role 필드 추가**

`server/src/schema/member.ts`의 Member type에 `role: String!` 추가.

**Step 5: Commit**

```bash
git add server/src/schema/ server/src/resolvers/
git commit -m "feat(server): add admin GraphQL API for settings and role management"
```

---

### Task 5: Client - 관리자 탭 라우트 추가

**Files:**
- Create: `app/src/app/(tabs)/admin.tsx`
- Modify: `app/src/app/(tabs)/_layout.tsx`

**Step 1: admin 탭 라우트 파일 생성**

`app/src/app/(tabs)/admin.tsx`:

```tsx
import { AdminPage } from '@pages/admin';

export default function AdminScreen() {
  return <AdminPage />;
}
```

**Step 2: _layout.tsx에 admin 탭 추가**

4번째 탭으로 "관리" 추가. `href` 속성을 조건부로 설정하여 ADMIN이 아닌 경우 탭을 숨길 수 있도록 준비 (이 태스크에서는 우선 항상 표시, Task 8에서 조건부 처리).

```tsx
<Tabs.Screen
  name="admin"
  options={{
    title: "관리",
    headerShown: false,
  }}
/>
```

**Step 3: Commit**

```bash
git add app/src/app/(tabs)/admin.tsx app/src/app/(tabs)/_layout.tsx
git commit -m "feat(client): add admin tab route"
```

---

### Task 6: Client - AdminPage 기본 구조 + 관리자 지정 기능

**Files:**
- Create: `app/src/pages/admin/AdminPage.tsx`
- Create: `app/src/pages/admin/index.ts`
- Create: `app/src/pages/admin/ui/role-manager.tsx`

**Step 1: AdminPage 기본 구조**

`app/src/pages/admin/AdminPage.tsx`:
- 모든 멤버 목록을 쿼리
- 설정값을 쿼리
- 세 가지 섹션을 렌더링: 관리자 지정, 출근 시간 설정, 지각비 설정

**Step 2: index.ts export**

```typescript
export { AdminPage } from './AdminPage';
```

**Step 3: role-manager.tsx 구현**

- 멤버 목록을 보여주고, 각 멤버 옆에 "관리자 지정/해제" 토글 버튼
- `setMemberRole` mutation 호출
- 현재 role이 ADMIN이면 버튼 텍스트 "해제", MEMBER면 "지정"

**Step 4: Commit**

```bash
git add app/src/pages/admin/
git commit -m "feat(client): add AdminPage with role manager"
```

---

### Task 7: Client - 출근 시간 설정 + 지각비 설정 UI

**Files:**
- Create: `app/src/pages/admin/ui/study-time-setting.tsx`
- Create: `app/src/pages/admin/ui/late-fee-setting.tsx`
- Modify: `app/src/pages/admin/AdminPage.tsx`

**Step 1: study-time-setting.tsx**

- 현재 출근 시간(studyStartHour:studyStartMinute) 표시
- 시간/분 입력 필드 (TextInput 또는 Picker)
- "저장" 버튼 → `updateSetting` mutation 2회 호출 (hour, minute)

**Step 2: late-fee-setting.tsx**

- 현재 지각비(lateFeeAmount) 표시
- 금액 입력 필드 (TextInput, numeric keyboard)
- "저장" 버튼 → `updateSetting` mutation 호출

**Step 3: AdminPage에 두 컴포넌트 배치**

ScrollView 안에 세 섹션을 순서대로:
1. 관리자 지정 (RoleManager)
2. 출근 시간 설정 (StudyTimeSetting)
3. 지각비 설정 (LateFeeSetting)

**Step 4: Commit**

```bash
git add app/src/pages/admin/
git commit -m "feat(client): add study time and late fee settings UI"
```

---

### Task 8: Client - 관리자 탭 조건부 표시

**Files:**
- Modify: `app/src/app/(tabs)/_layout.tsx`
- Modify: `app/src/pages/dashboard/DashboardPage.tsx`

**Step 1: 선택된 멤버의 role 정보를 전역으로 공유**

DashboardPage에서 멤버 선택 시 해당 멤버의 role 정보를 알 수 있도록 MEMBERS_QUERY에 `role` 필드 추가.

현재 멤버 선택은 DashboardPage의 로컬 state. 관리자 탭 표시 여부를 _layout.tsx에서 판단하려면 선택된 멤버의 role 정보가 필요. 간단한 방법:
- AsyncStorage 또는 간단한 전역 상태로 selectedMemberId와 role 공유
- 또는 _layout.tsx에서도 members를 쿼리하여 판단

가장 간단한 접근: _layout.tsx에서 `href: null`로 탭을 숨기되, admin 탭 내부에서 멤버 선택을 별도로 처리. 또는 Zustand/Context로 selectedMember 공유.

**Step 2: _layout.tsx에서 admin 탭 조건부 표시**

ADMIN role 멤버가 선택되었을 때만 admin 탭이 보이도록:

```tsx
<Tabs.Screen
  name="admin"
  options={{
    title: "관리",
    headerShown: false,
    href: isAdmin ? "/admin" : null,  // null이면 탭 숨김
  }}
/>
```

**Step 3: Commit**

```bash
git add app/src/app/(tabs)/_layout.tsx app/src/pages/dashboard/DashboardPage.tsx
git commit -m "feat(client): conditionally show admin tab for admin members"
```

---

### Task 9: Client - 클라이언트 상수 동기화 제거

**Files:**
- Modify: `app/src/shared/constants/cohort.ts`

**Step 1: STUDY_START_HOUR, LATE_FEE_AMOUNT 제거**

이제 이 값들은 서버 DB에서 관리되므로 클라이언트 상수에서 제거. 클라이언트에서 필요한 경우 GraphQL settings 쿼리를 통해 가져오도록 변경.

남길 상수: `CURRENT_COHORT`, `MONTHLY_FEE`, `VACATION_UNITS`, `FULL_DAY_VACATION_HOURS` (아직 DB 설정으로 전환하지 않은 값들)

**Step 2: Commit**

```bash
git add app/src/shared/constants/cohort.ts
git commit -m "refactor(client): remove hardcoded constants now managed by server settings"
```

---

## 구현 순서 요약

| Task | 내용 | 핵심 변경 |
|------|------|-----------|
| 1 | Member에 role 필드 추가 | Prisma migration |
| 2 | Setting 모델 추가 | Prisma migration + seed |
| 3 | 하드코딩 상수 → DB Setting 전환 | services/settings.ts |
| 4 | 관리자 GraphQL API | schema + resolver |
| 5 | 관리자 탭 라우트 | Expo Router 탭 추가 |
| 6 | AdminPage + 관리자 지정 UI | role-manager.tsx |
| 7 | 출근 시간/지각비 설정 UI | setting components |
| 8 | 관리자 탭 조건부 표시 | role 기반 탭 숨김 |
| 9 | 클라이언트 상수 정리 | 중복 상수 제거 |

**의존성:** Task 1-2 (DB) → Task 3 (서버 로직) → Task 4 (API) → Task 5-7 (클라이언트 UI) → Task 8 (조건부 표시) → Task 9 (정리)
