---
name: graphql-apollo
description: Use when writing API calls, GraphQL queries/mutations, managing Apollo cache, or creating fetcher functions. Triggers on "API 호출", "쿼리 작성", "캐시", "fetcher", or when working with server data.
---

# GraphQL + Apollo Client + gql.tada

## Overview

GraphQL API 통신은 fetcher 계층을 통해 파일 단위로 분리 관리한다. gql.tada로 타입 안전한 쿼리를 작성하고, Apollo Client의 정규화 캐시를 활용한다.

## Fetcher 계층 패턴

API 호출을 페이지/기능 코드에 직접 쓰지 않고, **fetcher 파일로 분리**한다.

```
pages/some-page/
  api/
    use-get-soldiers.ts      # 쿼리 fetcher
    use-create-soldier.ts    # 뮤테이션 fetcher
    use-delete-soldier.ts    # 뮤테이션 fetcher
    index.ts                 # barrel export
  SomePage.tsx               # fetcher를 import하여 사용
```

**Fetcher 파일 구조:**
```tsx
// api/use-get-soldiers.ts
import { graphql } from 'gql.tada';
import { useQuery } from '@apollo/client';

const GET_SOLDIERS = graphql(`
  query GetSoldiers {
    getSoldierList {
      id
      name
      rank
    }
  }
`);

export const useGetSoldiers = () => {
  return useQuery(GET_SOLDIERS, {
    fetchPolicy: 'cache-and-network',
  });
};
```

**뮤테이션 Fetcher + 캐시 처리:**
```tsx
// api/use-create-soldier.ts
const CREATE_SOLDIER = graphql(`...`);

export const useCreateSoldier = () => {
  return useMutation(CREATE_SOLDIER, {
    update(cache) {
      cache.evict({ fieldName: 'getSoldierList' });
      cache.gc();
    },
  });
};
```

**원칙:**
- 하나의 fetcher 파일 = 하나의 쿼리/뮤테이션
- 쿼리 정의 + hook + 캐시 전략이 한 파일에 응집
- 페이지/컴포넌트는 fetcher를 import해서 사용만

## gql.tada 타입 활용

```tsx
import { graphql, ResultOf, VariablesOf, FragmentOf, readFragment } from 'gql.tada';

// 타입 추출
type SoldierData = ResultOf<typeof GET_SOLDIERS>;
type SoldierVars = VariablesOf<typeof GET_SOLDIERS>;

// Fragment 사용 — 컴포넌트 데이터 의존성 명시
const SOLDIER_FRAGMENT = graphql(`
  fragment SoldierInfo on Soldier {
    id
    name
    rank
  }
`);

// Fragment를 쿼리에 포함
const GET_SOLDIERS = graphql(`
  query GetSoldiers {
    getSoldierList {
      ...SoldierInfo
    }
  }
`, [SOLDIER_FRAGMENT]);

// 컴포넌트에서 readFragment로 언마스킹
const soldier = readFragment(SOLDIER_FRAGMENT, data);
```

## Apollo 캐시 전략

| Mutation | 캐시 처리 |
|----------|----------|
| **CREATE** | `cache.evict({ fieldName })` + `cache.gc()` |
| **DELETE** | `cache.modify` → 리스트에서 ref 필터링 |
| **UPDATE** | 자동 — 응답에 변경 필드 모두 포함하면 정규화 캐시가 처리 |
| **Toggle** | `optimisticResponse` → 즉시 UI 반영, 실패 시 롤백 |

## fetchPolicy 선택

| 상황 | Policy |
|------|--------|
| 기본 (캐시 + 최신 동기화) | `cache-and-network` |
| 자주 안 바뀌는 데이터 | `cache-first` |
| 반드시 최신이어야 함 | `network-only` |
| presigned URL 등 부수효과 | `no-cache` |

## Fetcher Container 패턴

페이지 단위 데이터 로딩은 Fetcher Container로 경계를 나눈다.

```
pages/{page}/
├── index.tsx                 진입점 → <FetchXxx />
├── api/
│   ├── queries.ts            공유 쿼리만 (GET)
│   └── index.ts
├── model/
│   ├── {page}.ts             타입 + 변환 함수 (toDashboardData 등)
│   └── index.ts
└── ui/
    ├── fetch-{page}.tsx      Fetcher Container (쿼리, loading/error/null 분기, 변환)
    ├── {page}-content.tsx    Content (순수 UI, Apollo import 없음)
    ├── some-card.tsx         하위 컴포넌트 (자체 mutation co-locate 가능)
    └── ...
```

**Fetcher Container 역할:**
1. `api/queries.ts`에서 공유 쿼리 실행
2. loading → 로딩 UI / null → 에러 UI + refetch
3. `model/`의 변환 함수로 raw → 도메인 데이터
4. Content에 깨끗한 데이터만 props 전달

**Mutation은 중앙화하지 않는다:**
- GET 쿼리 → `api/queries.ts` (여러 컴포넌트가 공유)
- DELETE/UPDATE mutation → 해당 ui 컴포넌트에 co-locate (그 컴포넌트에서만 사용)

```tsx
// ui/fetch-dashboard.tsx — Fetcher Container
export function FetchDashboard() {
  const { data, loading } = useQuery(DASHBOARD_QUERY, { ... });

  if (loading && !data) return <Loading />;
  if (data == null) return <Error onRetry={refetch} />;

  const dashboardData = toDashboardData(data, ...);
  return <DashboardContent data={dashboardData} />;
}

// ui/dashboard-content.tsx — Content (Apollo 의존 없음)
export function DashboardContent({ data }: { data: DashboardData }) {
  return (
    <>
      <AttendanceCard memberId={data.me?.id} ... />  {/* 자체 mutation */}
      <VacationButton memberId={data.me?.id} ... />  {/* 자체 mutation */}
      <StudyingMembers members={data.members} />      {/* mutation 없음 */}
    </>
  );
}
```

## Fetcher 위치 결정

```
이 API를 어디에 둘까?
  ├─ 한 페이지에서만 사용 → pages/some-page/api/
  ├─ 여러 페이지에서 사용 → features/some-feature/api/ 또는 entities/some-entity/api/
  └─ 앱 전역 (인증 등) → shared/api/
```
