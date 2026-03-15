# gql.tada Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 서버의 GraphQL 스키마를 introspection으로 가져와서 gql.tada로 타입 안전한 쿼리/뮤테이션을 사용할 수 있도록 설정한다.

**Architecture:** gql.tada는 TypeScript 타입 시스템 내에서 GraphQL 결과/변수 타입을 추론한다. 서버(localhost:4000)에서 introspection으로 스키마를 SDL 파일로 추출하고, gql.tada의 TS 플러그인이 이를 읽어 타입을 제공한다. 기존 `graphql-tag`의 `gql` 템플릿 리터럴을 gql.tada의 `graphql()` 함수로 교체한다.

**Tech Stack:** gql.tada, @apollo/client, TypeScript plugin

---

### Task 1: gql.tada 패키지 설치

**Files:**
- Modify: `package.json`

**Step 1: gql.tada 설치**

```bash
cd /Users/leejaejin/coding/toy-project/work-time-app/app
npm install gql.tada
```

**Step 2: graphql-tag 제거**

gql.tada가 `graphql-tag`를 대체하므로 제거한다.

```bash
cd /Users/leejaejin/coding/toy-project/work-time-app/app
npm uninstall graphql-tag
```

참고: `graphql-tag`는 app의 직접 의존성이 아닐 수 있다 (server에서만 사용). 이 경우 uninstall은 no-op이므로 무시해도 된다.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install gql.tada, remove graphql-tag"
```

---

### Task 2: 서버 스키마 introspection으로 SDL 파일 생성

서버를 실행한 상태에서 gql.tada CLI로 스키마를 가져온다.

**Files:**
- Create: `src/graphql/schema.graphql` (introspection 결과)

**Step 1: 서버가 실행 중인지 확인**

```bash
curl -s http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}' | head -c 100
```

Expected: `{"data":{"__typename":"Query"}}` 형태의 응답

서버가 꺼져 있으면 별도 터미널에서 실행:
```bash
cd /Users/leejaejin/coding/toy-project/work-time-app/server
npm run dev
```

**Step 2: graphql 디렉토리 생성**

```bash
mkdir -p /Users/leejaejin/coding/toy-project/work-time-app/app/src/graphql
```

**Step 3: gql.tada CLI로 스키마 introspection**

```bash
cd /Users/leejaejin/coding/toy-project/work-time-app/app
npx gql-tada generate-schema http://localhost:4000/graphql --output ./src/graphql/schema.graphql
```

Expected: `src/graphql/schema.graphql` 파일이 생성되며, 서버의 전체 SDL이 포함된다.

**Step 4: 생성된 파일 확인**

```bash
head -30 /Users/leejaejin/coding/toy-project/work-time-app/app/src/graphql/schema.graphql
```

Expected: `type Query`, `type Member`, `type Session` 등 서버 스키마가 포함되어 있어야 한다.

**Step 5: Commit**

```bash
git add src/graphql/schema.graphql
git commit -m "feat: add GraphQL schema via server introspection"
```

---

### Task 3: tsconfig.json에 gql.tada 플러그인 설정

**Files:**
- Modify: `tsconfig.json`

**Step 1: tsconfig.json에 gql.tada 플러그인 추가**

현재 `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@shared/*": ["./src/shared/*"],
      "@pages/*": ["./src/pages/*"],
      "@app/*": ["./src/app/*"]
    },
    "plugins": []
  },
  "include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts"],
  "exclude": ["server", "node_modules"]
}
```

수정 후:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@shared/*": ["./src/shared/*"],
      "@pages/*": ["./src/pages/*"],
      "@app/*": ["./src/app/*"]
    },
    "plugins": [
      {
        "name": "gql.tada/ts-plugin",
        "schema": "./src/graphql/schema.graphql",
        "tadaOutputLocation": "./src/graphql/graphql-env.d.ts"
      }
    ]
  },
  "include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts"],
  "exclude": ["server", "node_modules"]
}
```

핵심 변경:
- `plugins` 배열에 `gql.tada/ts-plugin` 추가
- `schema`: Step 2에서 생성한 SDL 파일 경로
- `tadaOutputLocation`: 타입 정의 파일 출력 경로

**Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "feat: configure gql.tada TypeScript plugin in tsconfig"
```

---

### Task 4: gql.tada 타입 정의 파일 생성

**Files:**
- Create: `src/graphql/graphql-env.d.ts` (자동 생성)

**Step 1: generate-output 실행**

```bash
cd /Users/leejaejin/coding/toy-project/work-time-app/app
npx gql-tada generate-output
```

Expected: `src/graphql/graphql-env.d.ts` 파일이 생성된다. 이 파일은 gql.tada가 TypeScript 타입을 추론하는 데 사용하는 introspection 타입 정의를 담고 있다.

**Step 2: 생성된 파일 확인**

```bash
head -20 /Users/leejaejin/coding/toy-project/work-time-app/app/src/graphql/graphql-env.d.ts
```

Expected: `introspection` 타입 정의가 포함된 `.d.ts` 파일

**Step 3: tsconfig.json include에 graphql-env.d.ts 추가 확인**

현재 `include`에 `**/*.ts`가 있으므로 `.d.ts`도 자동 포함된다. 추가 작업 불필요.

**Step 4: Commit**

```bash
git add src/graphql/graphql-env.d.ts
git commit -m "feat: generate gql.tada type definitions"
```

---

### Task 5: graphql() 래퍼 유틸 생성

gql.tada에서 `graphql()` 함수를 re-export하는 유틸을 만든다.

**Files:**
- Create: `src/graphql/index.ts`

**Step 1: graphql 유틸 파일 작성**

```typescript
import { initGraphQLTada } from "gql.tada";
import type { introspection } from "./graphql-env";

export const graphql = initGraphQLTada<{
  introspection: introspection;
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
```

**Step 2: tsconfig.json path alias 추가**

`tsconfig.json`의 `paths`에 추가:
```json
"@graphql": ["./src/graphql"]
```

`babel.config.js`의 module-resolver alias에도 추가:
```javascript
"@graphql": "./src/graphql"
```

**Step 3: Commit**

```bash
git add src/graphql/index.ts tsconfig.json babel.config.js
git commit -m "feat: create graphql() wrapper with gql.tada"
```

---

### Task 6: DashboardPage 쿼리 마이그레이션

기존 `graphql-tag`의 `gql` → gql.tada의 `graphql()`로 교체한다.

**Files:**
- Modify: `src/pages/dashboard/DashboardPage.tsx`

**Step 1: import 변경**

변경 전:
```typescript
import gql from "graphql-tag";
```

변경 후:
```typescript
import { graphql } from "@graphql";
```

**Step 2: 쿼리/뮤테이션 변경**

`gql` 템플릿 리터럴을 `graphql()` 함수 호출로 변경한다:

변경 전:
```typescript
const MEMBERS_QUERY = gql`
  query Members {
    members { ... }
  }
`;
```

변경 후:
```typescript
const MEMBERS_QUERY = graphql(`
  query Members {
    members { ... }
  }
`);
```

모든 쿼리/뮤테이션에 동일하게 적용:
- `MEMBERS_QUERY`: `gql\`` → `graphql(`
- `CHECK_IN`: `gql\`` → `graphql(`
- `CHECK_OUT`: `gql\`` → `graphql(`
- `USE_VACATION`: `gql\`` → `graphql(`

**주의:** 쿼리 내용(GraphQL 문자열)은 변경하지 않는다. 감싸는 함수만 변경한다.

**Step 3: 타입 확인**

gql.tada가 정상 동작하면 `useQuery(MEMBERS_QUERY)`의 `data`가 자동으로 타입 추론된다. 기존의 `any` 타입 캐스팅을 제거할 수 있다.

**Step 4: Commit**

```bash
git add src/pages/dashboard/DashboardPage.tsx
git commit -m "refactor: migrate Dashboard queries to gql.tada"
```

---

### Task 7: HistoryPage 쿼리 마이그레이션

**Files:**
- Modify: `src/pages/history/HistoryPage.tsx`

**Step 1: import 변경**

```typescript
// 변경 전
import gql from "graphql-tag";
// 변경 후
import { graphql } from "@graphql";
```

**Step 2: 모든 쿼리 변경**

`gql\`` → `graphql(` 로 변경:
- `MEMBERS_QUERY`
- `CALENDAR_QUERY`
- `DAY_DETAIL_QUERY`

쿼리 내용은 그대로 유지. 감싸는 함수만 변경.

**Step 3: Commit**

```bash
git add src/pages/history/HistoryPage.tsx
git commit -m "refactor: migrate History queries to gql.tada"
```

---

### Task 8: MembersPage 쿼리 마이그레이션

**Files:**
- Modify: `src/pages/members/MembersPage.tsx`

**Step 1: import 변경**

```typescript
// 변경 전
import gql from "graphql-tag";
// 변경 후
import { graphql } from "@graphql";
```

**Step 2: 모든 쿼리/뮤테이션 변경**

`gql\`` → `graphql(` 로 변경:
- `MEMBERS_PAGE_QUERY`
- `TOGGLE_FEE`

**Step 3: Commit**

```bash
git add src/pages/members/MembersPage.tsx
git commit -m "refactor: migrate Members queries to gql.tada"
```

---

### Task 9: npm script 추가 및 정리

스키마 갱신과 타입 재생성을 위한 npm script를 추가한다.

**Files:**
- Modify: `package.json`

**Step 1: scripts 추가**

`package.json`의 `scripts`에 추가:
```json
{
  "scripts": {
    "graphql:schema": "gql-tada generate-schema http://localhost:4000/graphql --output ./src/graphql/schema.graphql",
    "graphql:generate": "gql-tada generate-output",
    "graphql:sync": "npm run graphql:schema && npm run graphql:generate"
  }
}
```

- `graphql:schema`: 서버에서 최신 스키마를 가져온다
- `graphql:generate`: 타입 정의 파일을 재생성한다
- `graphql:sync`: 스키마 가져오기 + 타입 생성을 한 번에 실행

**Step 2: 동작 확인**

```bash
cd /Users/leejaejin/coding/toy-project/work-time-app/app
npm run graphql:sync
```

Expected: 에러 없이 schema.graphql과 graphql-env.d.ts가 갱신된다.

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add graphql:sync npm scripts for schema regeneration"
```

---

## 최종 구조

```
app/
  src/
    graphql/
      schema.graphql          ← 서버 introspection으로 생성된 SDL
      graphql-env.d.ts        ← gql.tada가 생성한 타입 정의
      index.ts                ← graphql() 함수 래퍼
    pages/
      dashboard/
        DashboardPage.tsx     ← graphql() 사용
      history/
        HistoryPage.tsx       ← graphql() 사용
      members/
        MembersPage.tsx       ← graphql() 사용
  tsconfig.json               ← gql.tada/ts-plugin 설정
  package.json                ← graphql:sync 스크립트
```

## 서버 스키마 변경 시 워크플로우

```bash
# 서버에서 스키마 변경 후:
cd app
npm run graphql:sync
# → schema.graphql 갱신 → graphql-env.d.ts 재생성
# → TypeScript가 자동으로 새 타입 반영
```
