---
name: rn-project-setup
description: Use when setting up a new React Native/Expo project from an onboarding document. Triggers on "프로젝트 셋업", "project setup", "초기 설정", or when creating a new project based on a tech stack specification file.
---

# React Native Project Setup from Onboarding

## Overview

onboarding 문서(e.g. `docs/onboarding.md`)를 읽고, 명시된 기술 스택에 맞춰 Expo React Native 프로젝트를 체계적으로 셋업한다.

## When to Use

- 새 React Native / Expo 프로젝트를 onboarding 문서 기반으로 생성할 때
- 기존 프로젝트에 기능 추가가 아닌, 초기 셋업이 목적일 때

## Setup Flow

### Phase 1: Read & Plan

1. onboarding 파일 경로를 확인 (기본: `docs/onboarding.md`)
2. 기술 스택을 카테고리별로 분류:
   - **필수**: 즉시 설치 및 설정
   - **권장**: 즉시 설치, 설정은 필요 시
   - **필수이나 나중에**: 설치만, 설정은 별도
   - **권장이나 나중에**: 스킵 (사용자 확인 후 결정)
3. 아키텍처 패턴 식별 (FSD, 모노레포 등)
4. 폴더 구조 계획

### Phase 2: Create & Install

```bash
# 1. Expo 프로젝트 생성
npx create-expo-app@latest <project-name>

# 2. 필수 의존성 (onboarding "필수" 섹션 기반)
# 각 라이브러리의 최신 Expo 호환 버전 사용
npx expo install <packages>

# 3. dev 의존성
npm install -D <dev-packages>
```

**의존성 설치 순서가 중요한 경우:**
- NativeWind → tailwindcss, nativewind, tailwind-merge, clsx 순서
- Apollo → @apollo/client, graphql 함께
- gql.tada → gql.tada, @0no-co/graphqlsp 함께

### Phase 3: Configure

각 도구의 설정 파일을 생성/수정. onboarding 문서의 코드 예시를 참고하되, 최신 공식 문서를 Context7로 확인.

**설정 우선순위:**
1. `tsconfig.json` — strict mode, path aliases
2. `babel.config.js` — path alias (module-resolver), NativeWind
3. `metro.config.js` — NativeWind, 기타 Metro 플러그인
4. `tailwind.config.js` — 디자인 토큰, 테마
5. `app.config.js` / `app.json` — Expo 설정, scheme, plugins
6. `jest.config.js` — 테스트 설정, path alias
7. `.graphqlrc.yml` — gql.tada schema 설정 (GraphQL 사용 시)

**Path Alias 설정 시 3곳 모두 업데이트:**
- `tsconfig.json` (paths)
- `babel.config.js` (module-resolver)
- `jest.config.js` (moduleNameMapper)

### Phase 4: Scaffold Architecture

onboarding에 명시된 아키텍처에 따라 디렉토리 구조 생성.

**FSD 구조 예시:**
```
src/ (또는 fsd/)
  shared/       # 공용 유틸, UI, 상수, 타입
    ui/
    lib/
    config/
    constants/
  entities/     # 도메인 엔티티
  features/     # 사용자 기능 단위
  widgets/      # 조합된 UI 블록
  pages/        # 화면 단위
app/            # Expo Router (라우팅만)
```

**각 레이어에 생성할 것:**
- `index.ts` barrel export
- 필요 시 `ui/`, `model/`, `api/`, `lib/` 서브 디렉토리

**공용 유틸리티 생성:**
- `cn()` — `clsx` + `tailwind-merge` 조합 (NativeWind 사용 시)
- 기타 onboarding에 명시된 공용 패턴

### Phase 5: Verify

```bash
# 1. TypeScript 컴파일 체크
npx tsc --noEmit

# 2. Metro 번들러 시작
npx expo start

# 3. 테스트 실행
npm test (또는 bun run test)
```

## Common Mistakes

| 실수 | 해결 |
|------|------|
| Path alias를 tsconfig만 설정 | babel, jest에도 동일하게 추가 |
| `npm install` 대신 `npx expo install` 미사용 | Expo 호환 버전을 위해 `npx expo install` 사용 |
| NativeWind v4 설정을 v2 방식으로 | Context7로 최신 설정 방식 확인 |
| 필수/권장 구분 없이 전부 설치 | onboarding 카테고리 순서 준수 |

## Key Principle

onboarding 문서가 "무엇을" 가르쳐주고, 이 skill은 "어떤 순서로" 셋업할지를 가이드한다. 각 라이브러리의 구체적 설정은 반드시 Context7 등으로 최신 공식 문서를 확인한다.
