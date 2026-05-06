# server/CLAUDE.md

> `server/` 작업 시 로드되는 지도.
> 루트 지도: `../CLAUDE.md`

## Stack

- NestJS 11 + MikroORM 6 (postgresql) + PostgreSQL (Supabase)
- DDD + Hexagonal Architecture + CQRS (`@nestjs/cqrs`)
- GraphQL (Apollo, code-first)
- 패키지 매니저: **npm**
- 테스트: Jest (ts-jest)
- 에러 트래킹: Sentry

## Directory Map

```
src/
  main.ts              부트스트랩 (+ /health 라우트 inline)
  app.module.ts        루트 모듈
  sentry.ts            Sentry 초기화
  libs/                재사용 추상화 (DDD/ORM/Auth/Exceptions/Utils)
    ddd/ orm/ auth/ exceptions/ utils/
  features/            기능 모듈 (DDD + Hexagonal)
    {name}/domain/ application/ infrastructure/ graphql/
migrations/            MikroORM 마이그레이션
```

## Module Convention

모듈은 얇게 시작. 레이어는 **필요할 때** 추가하고, 빈 폴더는 만들지 말 것.

```
modules/{feature}/
  {feature}.module.ts
  {feature}.service.ts
  {feature}.resolver.ts      # GraphQL 있을 때
  {feature}.controller.ts    # REST 있을 때
  dto/
  guards/, decorators/       # 필요할 때만
  utils/                     # 도메인 유틸 (필요할 때만)
```

## Local Rules

1. ORM 엔티티는 `features/{name}/infrastructure/orm-entities/` — 도메인 엔티티는 `features/{name}/domain/`
2. 새 기능 모듈은 `src/modules/{name}/` 하위, 평탄 구조 금지
3. DB 접근은 MikroORM `EntityRepository` 경유 — raw SQL·Supabase client 직접 사용 금지
4. 환경변수는 `ConfigService` 경유, `process.env` 직접 참조 금지
5. Strict equality만 사용 (`===`, `!==`)
6. Import는 path alias 사용 — 새 파일은 `~/libs`, `~/features` 사용
7. **Claude는 dev 서버/build/lint를 직접 실행하지 않는다.**
   - 허용: `npx tsc --noEmit` (타입체크), `npm test` (Jest)

## Commands

- `npm run dev` — watch 모드 (사용자가 실행)
- `npm run build` — 빌드 (사용자가 실행)
- `npm test` — Jest 전체
- `npm test -- {pattern}` — 특정 파일
- `npx tsc --noEmit` — 타입체크 (Claude 허용)

## Testing

- **단위 테스트만 존재** (`*.spec.ts`, `src/` 내 co-located)
- 순수 유틸·계산 함수 우선 테스트 (예: `common/utils/`, `modules/*/utils/`)
- Service·Resolver 테스트는 의존성 많아 E2E로 커버하는 것이 일반적 — 아직 E2E 미도입
- 새 util 추가 시 `.spec.ts` 동반 권장
- Mock은 필요할 때만, 과도한 mock 금지

## References

- 기획/스펙 문서 (진실): 루트 `docs/` — plan-to-docs 산출물
- API 문서 산출물: `server/docs/api/` (spectaql)
- 루트 지도: `../CLAUDE.md`

## What NOT to put here

- 특정 모듈 구현 세부 → 코드 자체가 진실
- NestJS/TypeORM/Apollo 일반 사용법 → context7로 조회
- 아직 존재하지 않는 패턴(DataLoader, soft-delete, UUIDv7, Dependency Direction 표 등) → 실제 도입 시점에 추가
- 긴 예시 코드 → skill로 분리
