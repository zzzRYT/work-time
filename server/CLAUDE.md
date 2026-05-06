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

각 feature는 `features/{name}/` 하위에 DDD + Hexagonal 레이어로 구성:

```
features/{name}/
  domain/                  # AggregateRoot, ValueObject, DomainEvent
  application/             # Commands/Queries/Handlers, Ports
  infrastructure/          # ORM entities, Repositories, Adapters
  graphql/
    resolvers/             # {feature}.queries.ts, {feature}.mutations.ts (복수형 클래스명)
    schemas/inputs/, models/, enums/
  {feature}.module.ts
```

레이어는 **필요할 때** 추가, 빈 폴더 금지.

### Resolver 네이밍

- 클래스명은 항상 **복수형**: `AuthQueriesResolver`, `WorkspaceMutationsResolver`
- 메서드 1개여도 복수형 유지 — Plan 2+에서 추가될 때 일관성 유지
- 파일명도 동일: `auth.queries.ts`, `workspace.mutations.ts`

## Local Rules

1. ORM 엔티티는 `features/{name}/infrastructure/orm-entities/` — 도메인 엔티티는 `features/{name}/domain/`
2. 새 기능 모듈은 `src/modules/{name}/` 하위, 평탄 구조 금지
3. DB 접근은 MikroORM `EntityRepository` 경유 — raw SQL·Supabase client 직접 사용 금지
4. 환경변수는 `ConfigService` 경유, `process.env` 직접 참조 금지
5. Strict equality만 사용 (`===`, `!==`)
6. Import는 path alias 사용 — 새 파일은 `~/libs`, `~/features` 사용
7. **제어문(`if`, `else`, `for`, `while`)은 절대 한 줄로 끝내지 말 것** — 항상 `{}` 블록을 다음 줄로 개행. 예: `if (!x) return;` 금지, `if (!x) { return; }`도 금지. 본문은 반드시 별도 줄.
8. **주제가 바뀌면 빈 줄을 둔다** — 같은 파일/함수 안에서 의도가 달라지는 지점마다 1줄 공백.
   - 함수 본문: 입력 추출 → 검증 → 비즈니스 로직 → 반환 등 단계 사이 빈 줄
   - 클래스 멤버: 필드/생성자/getter/mutator/comparator 그룹 사이 빈 줄
   - 무의미한 빈 줄 남발 금지 — 같은 주제 안에선 붙여 쓴다
   - **import는 예외**: 한 덩어리로 둔다 (외부/내부 분리 안 함)
9. **Claude는 dev 서버/build/lint를 직접 실행하지 않는다.**
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
