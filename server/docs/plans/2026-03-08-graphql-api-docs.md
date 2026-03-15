# GraphQL API 시각적 문서화 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** SpectaQL을 사용하여 GraphQL API의 정적 HTML 문서를 자동 생성하고, 개발 서버에서 바로 확인할 수 있도록 구성한다.

**Architecture:** SpectaQL CLI로 현재 GraphQL 스키마에서 정적 HTML 문서를 생성한다. 설정 파일(spectaql.yml)로 문서 메타데이터와 스키마 소스를 지정하고, npm script로 생성/서빙을 자동화한다.

**Tech Stack:** SpectaQL (devDependency), 기존 Apollo Server 5 + graphql-tag 스키마

---

### Task 1: SpectaQL 설치 및 설정 파일 생성

**Files:**
- Modify: `package.json`
- Create: `spectaql.yml`

**Step 1: SpectaQL devDependency 설치**

Run: `npm install --save-dev spectaql`
Expected: package.json devDependencies에 spectaql 추가됨

**Step 2: SpectaQL 설정 파일 생성**

Create `spectaql.yml`:

```yaml
spectaql:
  logoFile: null
  faviconFile: null
  displayAllServers: true

introspection:
  url: "http://localhost:4000"

info:
  title: "Work Time App - GraphQL API"
  description: "스터디 그룹 출석/학습 시간 관리 API"
  version: "0.1.0"
  contact:
    name: "Work Time App"

servers:
  - url: "http://localhost:4000"
    description: "로컬 개발 서버"
    production: false
```

**Step 3: npm scripts 추가**

`package.json`에 다음 스크립트 추가:

```json
"docs:generate": "spectaql spectaql.yml -t docs/api",
"docs:serve": "spectaql spectaql.yml -t docs/api -D"
```

- `docs:generate`: 정적 HTML을 `docs/api/`에 생성
- `docs:serve`: 개발 모드로 브라우저에서 바로 확인 (live reload)

**Step 4: .gitignore에 생성된 docs 제외**

서버 루트의 `.gitignore`가 없다면 생성, 있으면 수정하여 추가:

```
docs/api/
```

**Step 5: 동작 확인**

1. 서버 실행: `npm run dev` (백그라운드)
2. 문서 생성: `npm run docs:serve`
3. 브라우저에서 확인 (기본 `http://localhost:4400`)

Expected: GraphQL 스키마의 모든 Type, Query, Mutation이 시각적으로 표시됨

**Step 6: Commit**

```bash
git add spectaql.yml package.json package-lock.json .gitignore
git commit -m "feat: add SpectaQL for visual GraphQL API documentation"
```

---

### Task 2: 스키마 설명(description) 추가로 문서 품질 향상

SpectaQL은 GraphQL 스키마의 description 필드를 문서에 표시한다. 현재 스키마에는 description이 없으므로 추가한다.

**Files:**
- Modify: `src/schema/member.ts`
- Modify: `src/schema/session.ts`
- Modify: `src/schema/vacation.ts`
- Modify: `src/schema/fee.ts`
- Modify: `src/schema/index.ts`

**Step 1: index.ts 스키마에 description 추가**

```graphql
"""출석 상태"""
enum AttendanceStatus {
  """미출석"""
  NOT_ATTENDED
  """학습 중"""
  STUDYING
  """학습 완료"""
  COMPLETED
  """지각"""
  LATE
  """휴가"""
  VACATION
}

"""랭킹 기간"""
enum RankingPeriod {
  """주간"""
  WEEKLY
  """월간"""
  MONTHLY
}
```

**Step 2: member.ts 스키마에 description 추가**

```graphql
"""스터디 멤버"""
type Member {
  id: ID!
  """실명"""
  name: String!
  """표시 이름"""
  displayName: String!
  """프로필 색상 (hex)"""
  color: String!
  """오늘의 출석 상태"""
  currentStatus: AttendanceStatus!
  """오늘 총 학습 시간(분)"""
  todayStudyMinutes: Int!
}

extend type Query {
  """전체 멤버 목록 조회"""
  members: [Member!]!
}
```

**Step 3: session.ts 스키마에 description 추가**

```graphql
"""출석 세션 (체크인~체크아웃)"""
type Session {
  id: ID!
  memberId: ID!
  """날짜 (YYYY-MM-DD)"""
  date: String!
  """체크인 시각 (ISO 8601)"""
  checkInTime: String!
  """체크아웃 시각 (ISO 8601, 학습 중이면 null)"""
  checkOutTime: String
  """지각 여부"""
  isLate: Boolean!
  """학습 시간(분), 체크아웃 전이면 현재까지 경과 시간"""
  durationMinutes: Int
}

"""출석 요약 통계"""
type AttendanceSummary {
  """전체 멤버 수"""
  total: Int!
  """출석한 멤버 수"""
  attended: Int!
  """현재 학습 중인 멤버 수"""
  studying: Int!
  """지각한 멤버 수"""
  late: Int!
}

"""특정 날짜의 상세 출석 정보"""
type DayDetailResult {
  sessions: [Session!]!
  """총 학습 시간(분)"""
  totalDurationMinutes: Int!
  """휴가 사용 시간"""
  vacationHours: Int
}

"""캘린더 날짜별 출석 상태"""
type CalendarDay {
  """날짜 (YYYY-MM-DD)"""
  date: String!
  """해당 날짜의 출석 상태"""
  status: AttendanceStatus!
}

"""월간 요약 통계"""
type MonthlySummaryResult {
  """출석 일수"""
  attendanceDays: Int!
  """총 학습 시간(분)"""
  totalStudyMinutes: Int!
  """일 평균 학습 시간(분)"""
  averageDailyMinutes: Int!
  """지각 횟수"""
  lateCount: Int!
  """휴가 일수"""
  vacationDays: Int!
  """총 지각 벌금(원)"""
  totalLateFee: Int!
}

extend type Query {
  """오늘의 출석 요약"""
  todayAttendanceSummary: AttendanceSummary!
  """특정 멤버의 특정 날짜 상세 조회"""
  dayDetail(memberId: ID!, date: String!): DayDetailResult!
  """특정 멤버의 월간 캘린더"""
  calendar(memberId: ID!, year: Int!, month: Int!): [CalendarDay!]!
  """특정 멤버의 월간 요약"""
  monthlySummary(memberId: ID!, year: Int!, month: Int!): MonthlySummaryResult!
}

extend type Mutation {
  """체크인 (지각 자동 감지)"""
  checkIn(memberId: ID!): Session!
  """체크아웃"""
  checkOut(memberId: ID!): Session!
}
```

**Step 4: vacation.ts 스키마에 description 추가**

```graphql
"""일일 휴가 기록"""
type DailyVacation {
  id: ID!
  memberId: ID!
  """날짜 (YYYY-MM-DD)"""
  date: String!
  """휴가 시간 (2, 4, 6, 8시간 단위)"""
  hours: Int!
}

extend type Mutation {
  """휴가 사용 등록"""
  useVacation(memberId: ID!, date: String!, hours: Int!): DailyVacation!
}
```

**Step 5: fee.ts 스키마에 description 추가**

```graphql
"""월별 회비 납부 기록"""
type MonthlyFee {
  id: ID!
  memberId: ID!
  """월 (YYYY-MM)"""
  month: String!
  """납부 여부"""
  isPaid: Boolean!
}

"""회비 상태 항목"""
type FeeStatusEntry {
  member: Member!
  """지각 벌금(원)"""
  lateFee: Int!
  """월 회비(원)"""
  monthlyFee: Int!
  """납부 여부"""
  isPaid: Boolean!
  """지각 횟수"""
  lateCount: Int!
}

"""랭킹 항목"""
type RankingEntry {
  member: Member!
  """총 학습 시간(분)"""
  totalStudyMinutes: Int!
  """출석 일수"""
  attendanceDays: Int!
  """지각 횟수"""
  lateCount: Int!
}

extend type Query {
  """월별 회비 상태 조회"""
  feeStatus(month: String!): [FeeStatusEntry!]!
  """멤버 랭킹 (주간/월간)"""
  memberRanking(period: RankingPeriod!): [RankingEntry!]!
}

extend type Mutation {
  """회비 납부 상태 토글"""
  toggleFeePayment(memberId: ID!, month: String!): MonthlyFee!
}
```

**Step 6: 문서 재생성 및 확인**

Run: `npm run docs:generate`
Expected: 모든 타입/쿼리/뮤테이션에 한글 설명이 표시됨

**Step 7: Commit**

```bash
git add src/schema/
git commit -m "docs: add GraphQL schema descriptions for API documentation"
```
