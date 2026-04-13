# app/CLAUDE.md

> `app/` 작업 시 로드되는 지도.
> 루트 지도: `../CLAUDE.md`
> 50줄 이하 유지. 세부 컨벤션은 skill / `../docs/` 로 위임.

## Stack

Expo 52 · RN 0.76 · Expo Router 4 · NativeWind 4 · Apollo + gql.tada · Zustand · Supabase Auth · Sentry

## Golden Rules (app-specific)

1. 패키지 매니저는 **Bun** — npm/pnpm/yarn 혼용 금지
2. 경로 별칭 우선: `@shared` · `@pages` · `@app` · `@graphql` — 상대경로 지양
3. 스타일은 NativeWind `className` — `StyleSheet.create` 지양
4. 화면 추가 시 **FSD Pages-First**: 중복이 실제로 발생했을 때만 하위 레이어로 추출
5. Claude는 dev·빌드·네이티브 실행 직접 금지. 허용: `npx tsc --noEmit`

## Workspace Routing

| 작업 | 참조 |
|------|------|
| 화면·라우트·딥링크 | `expo-routing` skill + `../docs/conventions/route-design.md` |
| 폴더·컴포넌트 위치 판단 | `fsd-architecture` skill |
| 스타일링·variant·CVA | `nativewind-styling` skill |
| GraphQL 쿼리·캐시·fetcher | `graphql-apollo` skill |
| Zustand 스토어 | `zustand-state` skill |
| 폼·입력 검증 | `form-validation` skill |
| 새 기능 기획 시작 | 루트 `plan-to-docs` skill |
| 기획/스펙 조회 | `../docs/specs/{feature}/` |
| 디자인 시스템·토큰 | `../DESIGN.md` |

## Commands

- `bun install` — 의존성
- `bun run start` / `ios` / `android` — dev 서버·실행 (사용자가 실행)
- `bun run graphql:sync` — 스키마 pull + 타입 재생성
- `npx tsc --noEmit` — 타입체크 (Claude 허용)

## What NOT to put here

- 컴포넌트·hook 구현 예시 → 코드가 진실
- Tailwind·NativeWind 레시피 → `nativewind-styling` skill
- Apollo 캐시 전략 상세 → `graphql-apollo` skill
- FSD 레이어 세부 규칙 → `fsd-architecture` skill
- 프로젝트 구조·FSD·path alias → `../docs/conventions/app-structure.md`
- 컴포넌트·DESIGN.md 토큰 매핑 → `../docs/conventions/app-component.md`
- Supabase 인증 플로우 → `../docs/conventions/app-auth.md`
- 길이가 늘어나면 skill 또는 `../docs/conventions/` 로 추출
