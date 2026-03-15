# Session Timer Backend Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 백엔드에서 사용자별 활성 세션(checkInTime)을 조회할 수 있게 하고, 클라이언트에서 이를 받아 실시간 타이머를 표시한다.

**Architecture:** 서버에 `activeSession(memberId)` 쿼리를 추가하여 현재 활성 세션을 반환한다. 클라이언트는 이 쿼리로 받은 `checkInTime`을 Timer 컴포넌트에 전달하여, 앱 재진입 시에도 정확한 경과 시간을 계산한다. Timer는 이미 `checkInTime`을 받으면 실시간 계산하는 로직이 있으므로, 데이터 연결만 하면 된다.

**Tech Stack:** GraphQL (Apollo Server/Client), Prisma, React Native, TypeScript

---

### Task 1: Server - activeSession 쿼리 추가

**Files:**
- Modify: `server/src/schema/session.ts`
- Modify: `server/src/resolvers/session.ts`

**Step 1: session schema에 activeSession 쿼리 타입 추가**

`server/src/schema/session.ts`의 Query type에 추가:

```graphql
activeSession(memberId: ID!): Session
```

이 쿼리는 해당 멤버의 오늘 날짜 활성 세션(checkOutTime이 null인 세션)을 반환한다. 활성 세션이 없으면 null.

**Step 2: activeSession resolver 구현**

`server/src/resolvers/session.ts`에 Query resolver 추가:

```typescript
activeSession: async (_: unknown, { memberId }: { memberId: string }, { prisma }: Context) => {
  const today = getKSTToday();
  return prisma.session.findFirst({
    where: {
      memberId,
      date: today,
      checkOutTime: null,
    },
  });
},
```

**Step 3: 서버 실행 후 GraphQL Playground에서 테스트**

Run: `cd server && npx ts-node src/index.ts`

GraphQL Playground에서 테스트:
```graphql
query {
  activeSession(memberId: "<test-member-id>") {
    id
    checkInTime
    checkOutTime
  }
}
```

Expected: 활성 세션이 있으면 Session 객체, 없으면 null 반환

**Step 4: Commit**

```bash
git add server/src/schema/session.ts server/src/resolvers/session.ts
git commit -m "feat(server): add activeSession query for fetching current active session"
```

---

### Task 2: Client - DashboardPage에서 activeSession 쿼리 연동

**Files:**
- Modify: `app/src/pages/dashboard/DashboardPage.tsx`

**Step 1: ACTIVE_SESSION 쿼리 정의**

`DashboardPage.tsx`에 GraphQL 쿼리 추가:

```typescript
const ACTIVE_SESSION = gql`
  query ActiveSession($memberId: ID!) {
    activeSession(memberId: $memberId) {
      id
      checkInTime
    }
  }
`;
```

**Step 2: useQuery로 activeSession 데이터 가져오기**

`DashboardPage` 컴포넌트 내에서 selectedMemberId가 있을 때 activeSession을 쿼리:

```typescript
const { data: sessionData } = useQuery(ACTIVE_SESSION, {
  variables: { memberId: selectedMemberId! },
  skip: !selectedMemberId,
  pollInterval: 30_000,
});
```

**Step 3: AttendanceCard에 실제 checkInTime 전달**

기존 코드:
```tsx
checkInTime={null}
```

변경:
```tsx
checkInTime={sessionData?.activeSession?.checkInTime ?? null}
```

**Step 4: checkIn/checkOut 뮤테이션 후 activeSession 쿼리도 refetch**

checkIn, checkOut 핸들러에서 refetch 시 activeSession도 함께 갱신되도록 `refetchQueries`에 추가:

```typescript
// checkIn mutation 옵션
refetchQueries: [
  { query: MEMBERS_QUERY },
  { query: ACTIVE_SESSION, variables: { memberId: selectedMemberId } },
],

// checkOut mutation 옵션
refetchQueries: [
  { query: MEMBERS_QUERY },
  { query: ACTIVE_SESSION, variables: { memberId: selectedMemberId } },
],
```

**Step 5: 앱에서 동작 확인**

1. 앱 실행: `cd app && npx expo start`
2. 멤버 선택 → 체크인 → 타이머가 실시간으로 경과 시간 표시하는지 확인
3. 앱을 닫았다 다시 열기 → 타이머가 서버에서 받은 checkInTime 기준으로 정확한 경과 시간 표시하는지 확인
4. 체크아웃 → 타이머 정지 확인

Expected: 체크인 후 타이머가 "X시간 Y분" 형태로 매 분 업데이트됨. 앱 재진입 시에도 동일.

**Step 6: Commit**

```bash
git add app/src/pages/dashboard/DashboardPage.tsx
git commit -m "feat(client): connect activeSession query to display real-time timer"
```

---

### Task 3: Timer 컴포넌트 개선 - 초 단위 업데이트 (선택사항)

**Files:**
- Modify: `app/src/pages/dashboard/ui/timer.tsx`

> 현재 Timer는 분 단위(60초마다)로 업데이트된다. 더 실시간 느낌을 주려면 초 단위로 변경할 수 있다.

**Step 1: Timer를 초 단위로 변경**

`timer.tsx`에서:

```typescript
// 기존: 분 단위
setElapsed(Math.floor((now - start) / 60_000));
const id = setInterval(tick, 60_000);

// 변경: 초 단위
const [elapsed, setElapsed] = useState(0); // seconds

useEffect(() => {
  if (!checkInTime) {
    setElapsed(0);
    return;
  }

  const start = new Date(checkInTime).getTime();

  function tick() {
    setElapsed(Math.floor((Date.now() - start) / 1_000));
  }

  tick();
  const id = setInterval(tick, 1_000);
  return () => clearInterval(id);
}, [checkInTime]);

// 표시 형식 변경
const hours = Math.floor(elapsed / 3600);
const minutes = Math.floor((elapsed % 3600) / 60);
const seconds = elapsed % 60;
// "X시간 Y분 Z초" 또는 "HH:MM:SS" 형태로 표시
```

**Step 2: 표시 포맷 업데이트**

기존 "X시간 Y분" → "X시간 Y분 Z초" 또는 "HH:MM:SS" 중 선택하여 렌더링 변경.

**Step 3: 앱에서 동작 확인**

1. 체크인 후 타이머가 매초 업데이트되는지 확인
2. 시간 표시가 정확한지 확인 (예: 1시간 23분 45초)

**Step 4: Commit**

```bash
git add app/src/pages/dashboard/ui/timer.tsx
git commit -m "feat(client): update timer to show seconds for real-time feel"
```

---

### Task 4: todayStudyMinutes를 서버 데이터 기반으로 표시

**Files:**
- Modify: `app/src/pages/dashboard/DashboardPage.tsx`
- Modify: `app/src/pages/dashboard/ui/attendance-card.tsx` (필요 시)

**Step 1: todayStudyMinutes 데이터 활용 확인**

현재 `members` 쿼리에서 `todayStudyMinutes`를 이미 가져오고 있다. 이 값은 완료된 세션들의 총 공부 시간(분)이다. 활성 세션의 시간은 포함되지 않을 수 있으므로, 클라이언트에서 활성 세션의 경과 시간을 더해서 표시해야 한다.

AttendanceCard 또는 DashboardPage에서:

```typescript
// 완료된 세션 누적 시간 + 현재 활성 세션 경과 시간
const completedMinutes = me?.todayStudyMinutes ?? 0;
// Timer 컴포넌트가 활성 세션의 경과 시간을 별도로 표시하므로,
// 총 공부 시간 = completedMinutes + (타이머 경과 시간)
// 이를 별도 표시하거나, Timer에 completedMinutes를 prop으로 전달
```

**Step 2: attendance-card에 누적 시간 표시 추가 (필요 시)**

완료된 세션의 누적 시간을 별도로 보여주고 싶다면, attendance-card에 `totalStudyMinutes` prop을 추가:

```tsx
<Text className="text-sm text-gray-500">
  오늘 총 공부: {formatMinutes(completedMinutes + activeElapsed)}
</Text>
```

**Step 3: 동작 확인**

1. 여러 번 체크인/체크아웃 후 누적 시간이 정확히 합산되는지 확인
2. 활성 세션 중에도 총 시간이 실시간으로 증가하는지 확인

**Step 4: Commit**

```bash
git add app/src/pages/dashboard/DashboardPage.tsx app/src/pages/dashboard/ui/attendance-card.tsx
git commit -m "feat(client): show accumulated study time including active session"
```

---

## 구현 순서 요약

| Task | 내용 | 핵심 변경 |
|------|------|-----------|
| 1 | Server: `activeSession` 쿼리 추가 | schema + resolver |
| 2 | Client: activeSession 쿼리 연동 → Timer에 실제 checkInTime 전달 | DashboardPage |
| 3 | Timer 초 단위 업데이트 (선택) | timer.tsx |
| 4 | 누적 공부 시간 표시 | attendance-card |

**핵심 포인트:** 현재 Timer 컴포넌트와 AttendanceCard는 이미 checkInTime을 받아 동작하도록 구현되어 있다. 문제는 DashboardPage에서 `checkInTime={null}`을 하드코딩하고 있다는 것. Task 1-2만 완료하면 기본 기능이 동작한다.
