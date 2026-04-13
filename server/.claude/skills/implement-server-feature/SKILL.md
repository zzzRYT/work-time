---
name: implement-server-feature
description: Use when adding a new server module, GraphQL resolver, or CRUD operation in server/. Triggers on "서버 기능 추가", "모듈 생성", "리졸버 추가", 새 Query/Mutation, 새 API 엔드포인트. 단일 파일 수정이 아닌 다층(Entity/DTO/Service/Resolver) 변경에 사용.
---

# Implement Server Feature — NestJS + TypeORM Workflow

이 체크리스트를 복사해서 진행 상황을 추적하며 순서대로 따라가세요.

## Pre-flight

- [ ] **요구사항이 모호한가?**
  - YES → `plan-to-docs` 또는 `/office-hours` 로 먼저 명확화 후 복귀
  - NO → 진행
- [ ] **범위가 큰가?** (새 도메인 + 5개 이상 파일 예상)
  - YES → `superpowers:writing-plans` 또는 `/plan-eng-review` 먼저 실행
  - NO → 바로 체크리스트 시작
- [ ] **새 모듈인가, 기존 확장인가?**
  - 새 모듈 → Step 0~8 전부
  - 기존 확장 → 해당 Step으로 건너뛰고, **기존 모듈 패턴을 그대로 따를 것**
- [ ] **참고 모듈 선정.** 기본: **`src/modules/session/`** (가장 복잡, utils/ResolveField/guard 모두 포함). 간단 CRUD면 `src/modules/member/`. Auth 관련이면 `src/modules/auth/`.
- [ ] **Data 변경이 있으면** 먼저 `entity-first-development` 스킬을 참조해서 엔티티부터 고민.

## Step 0: Entity (스키마 변경 필요 시)

- [ ] `src/entities/{name}.entity.ts` 작성 — **반드시 `src/entities/` 중앙 위치** (Local Rule #1)
- [ ] 파일명·클래스명: `{name}.entity.ts` / `{Name}Entity`
- [ ] Workspace-scope 엔티티면 **`workspaceId` 컬럼 필수** (`@Column({ type: 'uuid', name: 'workspace_id' })`)
- [ ] DB 컬럼명은 `snake_case`, TS 필드는 `camelCase` — `@Column({ name: 'snake_case' })` 매핑
- [ ] Date 필드는 `timestamptz`, 문자열 날짜는 `varchar(10)` (YYYY-MM-DD)
- [ ] 자주 조회되는 조합은 `@Index(['fieldA', 'fieldB'])`
- [ ] `src/entities/index.ts` barrel에 export 추가
- [ ] **`src/app.module.ts` 의 `entities: [...]` 배열에 등록** — 누락 시 런타임 에러

참조 파일: `src/entities/session.entity.ts`

## Step 1: Module Skeleton

- [ ] `src/modules/{feature}/{feature}.module.ts` 생성
- [ ] `TypeOrmModule.forFeature([...사용할 엔티티들])` imports
- [ ] 다른 모듈 서비스 필요 시 해당 모듈 imports (예: `SettingsModule`)
- [ ] providers에 Service + Resolver 나란히

참조 파일: `src/modules/session/session.module.ts`

## Step 2: DTO (GraphQL ObjectType / InputType)

> 상세: [references/dto-patterns.md](references/dto-patterns.md)

- [ ] `src/modules/{feature}/dto/{name}.object.ts` — 응답 타입
- [ ] `src/modules/{feature}/dto/{name}.input.ts` — 입력 타입 (필요 시)
- [ ] **Entity를 DTO로 직접 노출하지 말 것** — Entity는 `Date`, DTO는 `string` (ISO 8601)
- [ ] `@Field(() => Type)` — 첫 인자에 화살표 함수로 타입 명시 (nullable / String도 포함)
- [ ] Nullable 필드는 `@Field(() => Type, { nullable: true })` + `field!: Type | null`
- [ ] `description`은 필수 — GraphQL schema 문서가 됨

참조 파일: `src/modules/session/dto/session.object.ts`

## Step 3: Errors

- [ ] `src/modules/{feature}/errors/{feature}.error.ts`
- [ ] `GraphQLError` 상속, `extensions.code`는 `UPPER_SNAKE_CASE`
- [ ] 에러 메시지는 **한국어** — 클라이언트 그대로 표시 가능
- [ ] `NestJS` 기본 exception (`ForbiddenException` 등)은 인프라 관심사(권한 등)에서만 사용

참조 파일: `src/modules/session/errors/session.error.ts`

## Step 4: Service

> 상세: [references/service-patterns.md](references/service-patterns.md)

- [ ] `{feature}.service.ts` — `@Injectable()`
- [ ] `@InjectRepository(Entity)` 로 Repository 주입 — **raw SQL / Supabase client 금지** (Local Rule #3)
- [ ] 다른 도메인 접근 필요 시 해당 Service 주입 (Repository 직접 주입 금지)
- [ ] Workspace 스코프 쿼리: `where: { workspaceId, ... }` 로 **반드시 필터**
- [ ] 환경변수 필요 시 `ConfigService` 경유 — **`process.env` 직접 금지** (Local Rule #4)
  - ⚠️ `app.module.ts`는 부트스트랩 단계라 예외적으로 `process.env` 직접 사용. 나머지 코드는 금지
- [ ] 도메인 에러는 throw, Repository 예외는 catch해서 도메인 에러로 변환
- [ ] 순수 계산은 `utils/` 로 분리 + `.spec.ts` 작성 권장

참조 파일: `src/modules/session/session.service.ts`

## Step 5: Resolver

> 상세: [references/resolver-patterns.md](references/resolver-patterns.md)

- [ ] `{feature}.resolver.ts` — `@Resolver(() => {Name})`
- [ ] 모든 Query/Mutation에 `@UseGuards(WorkspaceGuard)` (인증 + workspace membership 동시 검증)
- [ ] Workspace ID가 필요하면 `@CurrentWorkspace() workspaceId: string` 파라미터로 주입
- [ ] 현재 유저가 필요하면 `@CurrentUser() user: ...`
- [ ] 인자 타입:
  - 단일 primitive → `@Args('name', { type: () => ID | Int | String })`
  - 복합 입력 → `@Args('input') input: {Name}Input`
- [ ] Entity → DTO 변환 필드(예: Date → ISO string)는 `@ResolveField()`로 처리
- [ ] 파생 필드(예: `durationMinutes`)도 `@ResolveField()`

참조 파일: `src/modules/session/session.resolver.ts`

## Step 6: Utils (선택)

- [ ] 순수 함수만 — Repository/Service 의존 없음
- [ ] `modules/{feature}/utils/{name}.util.ts`
- [ ] **`.spec.ts` 동반** — Service/Resolver 테스트보다 여기에 우선 투자
- [ ] 도메인 경계 넘는 공용 유틸은 `src/common/utils/`로 승격

참조 파일: `src/modules/session/utils/attendance.util.ts` + `.spec.ts`

## Step 7: Module Registration

- [ ] 새 모듈이면 `src/app.module.ts` imports 배열 끝에 추가
- [ ] 새 엔티티가 있으면 `TypeOrmModule.forRoot({ entities: [...] })` 배열에도 추가 (Step 0에서 이미 했는지 확인)

## Step 8: 검증

- [ ] `cd server && npx tsc --noEmit` — 타입 에러 0
- [ ] `cd server && npm test` — 유닛 테스트 통과 (util 있을 때)
- [ ] Strict equality 확인 (`===`, `!==`) — Local Rule #5
- [ ] Import path alias `~/` 사용 확인 — Local Rule #6
  - 단, 기존 모듈들은 상대경로(`../../`) 사용 중이므로 **기존 모듈 수정 시에는 기존 스타일 유지**
- [ ] `process.env` 직접 참조 없음 (`grep -n "process\.env" modules/{feature}`)
- [ ] 커밋·푸시 **전 반드시 사용자 확인** (Golden Rule)

## Checkpoint Checklist (최종 감사)

제출 전 셀프 리뷰:

- [ ] Entity가 `src/entities/`에 있고 `app.module.ts`에 등록됨
- [ ] Workspace-scope 리소스는 모든 쿼리에 `workspaceId` 필터 있음
- [ ] 모든 resolver에 `@UseGuards(WorkspaceGuard)` 있음
- [ ] DTO의 Date 필드는 string으로 `@ResolveField` 변환
- [ ] 에러는 도메인 에러 클래스 사용, GraphQLError 상속
- [ ] `.spec.ts`가 동반된 순수 util이 있음 (로직이 복잡하면)

## Error Handling

| 상황 | 대응 |
|------|------|
| `EntityMetadataNotFoundError` | `app.module.ts` entities 배열 등록 누락 — Step 0 재확인 |
| Circular dependency | 모듈 간 순환 import → `forwardRef(() => X)` 또는 설계 재고 |
| `Cannot determine GraphQL output type` | `@Field(() => Type)` 화살표 함수 빠짐 |
| Workspace 데이터 다른 workspace에서 조회됨 | `where: { workspaceId }` 누락 — 반드시 필터 |

## References

- [dto-patterns.md](references/dto-patterns.md) — ObjectType/InputType, nullable, Date 변환
- [service-patterns.md](references/service-patterns.md) — Repository 주입, workspace 필터, 에러 변환
- [resolver-patterns.md](references/resolver-patterns.md) — Guard/decorator 조합, ResolveField
