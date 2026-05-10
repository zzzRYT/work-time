# Work Time

> 출결 관리 앱 — 팀원의 출근/퇴근을 기록하고 워크스페이스 단위로 관리한다.

[![Server CI](https://github.com/zzzRYT/work-time/actions/workflows/server-ci.yml/badge.svg)](https://github.com/zzzRYT/work-time/actions/workflows/server-ci.yml)
[![App Build](https://github.com/zzzRYT/work-time/actions/workflows/app-build.yml/badge.svg)](https://github.com/zzzRYT/work-time/actions/workflows/app-build.yml)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **앱** | Expo (React Native), NativeWind, Apollo Client, gql-tada |
| **서버** | NestJS, MikroORM, GraphQL (Apollo Server) |
| **DB / Auth** | Supabase (PostgreSQL + Auth) |
| **패키지 관리** | app → Bun / server → npm |
| **CI** | GitHub Actions |

---

## 아키텍처

```
work-time/
├── app/        # Expo React Native 앱
│   └── src/
│       ├── app/          # expo-router 페이지
│       ├── modules/      # 기능별 모듈
│       └── shared/       # 공통 컴포넌트·훅·유틸
└── server/     # NestJS GraphQL API
    └── src/
        ├── modules/      # 기능별 모듈 (auth, workspace, session …)
        └── libs/         # 공통 인프라 (orm, ddd, exceptions …)
```

GraphQL API를 중심으로 앱과 서버가 통신한다. 인증은 Supabase Auth를 사용하며, 서버는 JWT를 검증해 요청자를 식별한다.

---

## 로컬 세팅

### Prerequisites

- Node.js 20+
- Bun 1.x
- npm 10+
- Expo CLI (`npm install -g eas-cli`)

### 1. 저장소 클론

```bash
git clone https://github.com/zzzRYT/work-time.git
cd work-time
```

### 2. 서버 세팅

```bash
cd server
cp .env.example .env   # 환경변수 채우기
npm install
npm run migration:up
npm run dev
```

서버는 기본적으로 `http://localhost:4000`에서 실행된다.

### 3. 앱 세팅

```bash
cd app
cp .env.example .env   # EXPO_PUBLIC_API_URL 등 채우기
bun install
bun run graphql:sync   # GraphQL 스키마 동기화
bun run start
```

---

## 개발 참여

### 브랜치 전략

자세한 내용은 [docs/conventions/git-workflow.md](docs/conventions/git-workflow.md)를 참고.

요약:
- 작업 브랜치는 `dev`에서 분기: `<area>/feature/<name>` 또는 `<area>/fix/<name>`
- `dev` → `main`은 검증 후 fast-forward merge
- 임시 브랜치는 머지 후 삭제

### 커밋 메시지

```
<type>(<area>): <설명>

feat(app): 워크스페이스 초대 플로우 추가
fix(server): 세션 스코프를 워크스페이스 멤버로 제한
docs: git workflow 컨벤션 추가
refactor(app): 설정 권한 네이밍 통일
```

| type | 의미 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `docs` | 문서 |
| `chore` | 빌드·설정·의존성 |
| `test` | 테스트 |

### PR 열기

1. `dev`를 최신으로 당긴다
2. 작업 브랜치를 만든다
3. 작업 후 PR을 `dev`로 열고 **Squash and merge**
