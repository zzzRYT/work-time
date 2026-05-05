# App Structure Convention

## FSD Pages-First

```
app/src/
  app/               Expo Router — 라우팅만. 로직·스타일 금지
  pages/             화면 단위 — 여기서 시작, 여기서 완결
  shared/            2개 이상 페이지에서 사용되는 공용 코드
  graphql/           gql.tada 생성물 (schema.graphql, graphql-env.d.ts)
```

### 아직 생기지 않은 레이어

FSD Pages-First 원칙에 따라, 아래 레이어는 **중복이 실제 발생할 때만** 생성:

| 레이어 | 추출 조건 | 현재 |
|--------|----------|------|
| `widgets/` | 2+ 페이지에서 동일 UI 블록 반복 | 없음 |
| `features/` | 2+ 페이지에서 동일 기능 로직 반복 | 없음 |
| `entities/` | 도메인 모델이 여러 곳에서 공유 | 없음 |

## 페이지 내부 구조

```
pages/{page-name}/
  {PageName}Page.tsx     메인 컴포넌트 — 렌더링·이벤트 핸들러만
  ui/                    이 페이지 전용 하위 컴포넌트
  api/                   GraphQL 문서(query·mutation) 정의
    index.ts             — 모든 문서를 named export
  index.ts               barrel export
```

- `ui/` 파일은 kebab-case: `check-button.tsx`, `fee-shortcut.tsx`
- 페이지 컴포넌트는 PascalCase: `HomePage.tsx`
- **서버 데이터 접근이 있는 페이지는 `api/` 필수** — `{PageName}Page.tsx`에 `graphql()` 태그 직접 작성 금지
- `api/index.ts`는 `graphql()` 문서 상수만. `useQuery`/`useMutation` 호출은 Page 컴포넌트에서

## shared/ 내부 구조

```
shared/
  lib/          유틸리티 함수 — cn.ts, date.ts, apollo.ts, supabase.ts
  store/        전역 Zustand 스토어 — auth.ts
  ui/           공용 UI 프리미티브 — status-badge.tsx, member-row.tsx, toast.tsx
  constants/    상수 — cohort.ts
```

## app/ (Expo Router)

```
app/
  _layout.tsx        Root layout + auth guard
  login.tsx          로그인 (pre-auth, pages/ 미경유)
  workspaces.tsx     워크스페이스 선택 (pre-auth, pages/ 미경유)
  (tabs)/
    _layout.tsx      Tab navigator 설정
    index.tsx        → pages/home re-export
    calendar.tsx     → pages/history re-export
    ranking.tsx      → pages/ranking re-export
    settings.tsx     → pages/settings re-export
```

**규칙**: `(tabs)/*.tsx` 파일은 `pages/`의 re-export만. 로직 금지.
**예외**: `login.tsx`, `workspaces.tsx`는 인증 전 화면이라 `app/`에 직접 위치.

## Path Aliases

| alias | 대상 | 설정 위치 |
|-------|------|----------|
| `@shared/*` | `src/shared/*` | tsconfig.json + babel.config.js |
| `@pages/*` | `src/pages/*` | tsconfig.json + babel.config.js |
| `@app/*` | `src/app/*` | tsconfig.json + babel.config.js |
| `@graphql` | `src/graphql` | tsconfig.json + babel.config.js |

- 상대경로(`../../shared/`) 대신 alias 사용
- **alias 추가/변경 시 tsconfig.json + babel.config.js 둘 다 수정 필수**

## Import 방향

상위 → 하위만 허용. 역방향 금지.

```
app/ → pages/ → shared/
              → graphql/
```

`shared/` 간 하위 폴더끼리는 자유 (`lib/` → `store/` OK)
