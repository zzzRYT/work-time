# Backend 아키텍처 개편 설계 — DDD + Hexagonal + CQRS

**날짜**: 2026-05-05  
**범위**: `server/src/` 전체 재작성  
**브랜치**: `refactor/ddd-hexagonal`

---

## 1. 아키텍처 결정

### 패턴
- **DDD** (Domain-Driven Design): AggregateRoot, Entity, ValueObject, Domain Event
- **Hexagonal Architecture** (Ports & Adapters): Domain/Application 레이어는 인프라에 의존하지 않음
- **CQRS**: `@nestjs/cqrs` CommandBus / QueryBus로 읽기/쓰기 분리

### ORM
- **MikroORM** (Data Mapper + Unit of Work)
- TypeORM에서 교체 이유: Data Mapper 패턴 → ORM entity와 Domain entity 완전 분리 가능. Unit of Work → 단일 `em.flush()`로 트랜잭션 일관성 보장
- Option B 선택: ORM entity 클래스와 Domain entity 클래스를 완전히 분리, 명시적 Mapper 사용

### API
- **GraphQL** (NestJS code-first, Apollo): 기존 유지

### ID 전략
- **UUIDv7**: 시간 순서 보장, 애플리케이션 레이어에서 `uuidv7` npm 패키지로 생성 (ORM 생성 아님)
- 예외: `users.id`는 Supabase가 제공하는 UUID 그대로 사용

### Soft Delete
- **전체 엔티티 적용**: `deleted_at timestamptz nullable`
- MikroORM 글로벌 `@Filter({ name: 'notDeleted', cond: { deletedAt: null }, default: true })`
- **삭제는 도메인 책임**: `entity.delete()` → `_deletedAt = new Date()` 설정. Handler가 `repo.save(entity)` 호출
- soft-delete 레코드 재생성 시 INSERT가 아닌 **restore** 패턴: `entity.restore()` → `_deletedAt = undefined`

### Timestamps
- **모든 엔티티 공통**: `created_at`, `updated_at`, `deleted_at`
- **시간 관리는 전적으로 도메인 책임**:
  - 생성 시 `createdAt = updatedAt = new Date()`
  - 상태 변경 메서드는 `this.touch()` 호출 → `_updatedAt` 갱신
  - `delete()`/`restore()`도 `_deletedAt` 변경 + `touch()` 함께 호출
- Mapper가 `createdAt`/`updatedAt`/`deletedAt`을 도메인 → ORM 단방향 전달 (도메인이 진실의 원천)
- ORM `@Property({ onUpdate: () => new Date() })`는 fallback (도메인 우회 시 안전망)

### 외부 인증 추상화
- `IAuthPort` 인터페이스 (application layer) + `SupabaseAuthAdapter` (infrastructure)
- Application/Domain 레이어는 Supabase를 직접 알지 못함 → 추후 self-managed JWT로 교체 가능

---

## 2. DB 스키마

### 변경 사항 요약
- `workspace_members` + `members` → `members` 단일 테이블로 통합 (role 중복 제거)
- `sessions`, `daily_vacations`, `monthly_fees`에서 `workspace_id` 제거 (`member_id → members.workspace_id`로 접근)
- 전체 테이블에 `deleted_at timestamptz nullable` 추가
- UNIQUE 제약은 일반 제약으로 유지 (soft-delete 후 re-create 금지, restore 패턴 사용)

### DDL

```sql
-- users (Supabase auth.users mirror)
CREATE TABLE users (
  id          uuid PRIMARY KEY,
  email       text NOT NULL,
  name        text NOT NULL,
  avatar_url  text,
  provider    text NOT NULL,
  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL,
  deleted_at  timestamptz
);

-- workspaces
CREATE TABLE workspaces (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  slug        text NOT NULL,
  owner_id    uuid NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL,
  deleted_at  timestamptz,
  CONSTRAINT uq_workspaces_slug UNIQUE (slug)
);

-- members (workspace_members + members 통합)
CREATE TABLE members (
  id           uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  user_id      uuid NOT NULL REFERENCES users(id),
  name         text NOT NULL,
  display_name text,
  color        text NOT NULL,
  role         text NOT NULL,   -- OWNER | ADMIN | MEMBER
  joined_at    timestamptz NOT NULL,
  invited_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL,
  deleted_at   timestamptz,
  CONSTRAINT uq_members_workspace_user UNIQUE (workspace_id, user_id)
);

-- workspace_settings (1:1 with workspace)
CREATE TABLE workspace_settings (
  id                  uuid PRIMARY KEY,
  workspace_id        uuid NOT NULL REFERENCES workspaces(id),
  study_start_hour    int NOT NULL,
  study_start_minute  int NOT NULL,
  late_fee_amount     int NOT NULL,
  monthly_fee_amount  int NOT NULL,
  created_at          timestamptz NOT NULL,
  updated_at          timestamptz NOT NULL,
  deleted_at          timestamptz,
  CONSTRAINT uq_workspace_settings_workspace UNIQUE (workspace_id)
);

-- invites
CREATE TABLE invites (
  id           uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  token        varchar(64) NOT NULL,
  created_by   uuid NOT NULL REFERENCES users(id),
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL,
  deleted_at   timestamptz,
  CONSTRAINT uq_invites_token UNIQUE (token)
);

-- sessions
CREATE TABLE sessions (
  id             uuid PRIMARY KEY,
  member_id      uuid NOT NULL REFERENCES members(id),
  date           varchar(10) NOT NULL,   -- YYYY-MM-DD
  check_in_time  timestamptz NOT NULL,
  check_out_time timestamptz,
  is_late        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL,
  updated_at     timestamptz NOT NULL,
  deleted_at     timestamptz
);
CREATE INDEX idx_sessions_member_date ON sessions (member_id, date);
CREATE INDEX idx_sessions_date ON sessions (date);

-- daily_vacations
CREATE TABLE daily_vacations (
  id         uuid PRIMARY KEY,
  member_id  uuid NOT NULL REFERENCES members(id),
  date       varchar(10) NOT NULL,   -- YYYY-MM-DD
  hours      decimal NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz,
  CONSTRAINT uq_daily_vacations UNIQUE (member_id, date)
);

-- monthly_fees
CREATE TABLE monthly_fees (
  id                  uuid PRIMARY KEY,
  member_id           uuid NOT NULL REFERENCES members(id),
  month               varchar(7) NOT NULL,   -- YYYY-MM
  monthly_fee_status  text NOT NULL,   -- PAID | UNPAID | EXEMPT
  late_fee_status     text NOT NULL,   -- PAID | UNPAID | EXEMPT
  created_at          timestamptz NOT NULL,
  updated_at          timestamptz NOT NULL,
  deleted_at          timestamptz,
  CONSTRAINT uq_monthly_fees UNIQUE (member_id, month)
);
```

---

## 3. `libs/` 구조

```
src/libs/
├── ddd/
│   ├── aggregate-root.base.ts      # domainEvents 관리
│   ├── entity.base.ts              # id, createdAt, equals()
│   ├── value-object.base.ts        # 불변, 값 비교
│   ├── repository.port.ts          # abstract RepositoryPort<T>
│   ├── command.base.ts
│   ├── query.base.ts
│   ├── domain-event.base.ts
│   └── mapper.interface.ts         # IMapper<Domain, Orm, GraphQL>
├── orm/
│   ├── orm-entity.base.ts          # @Filter(notDeleted) + createdAt + deletedAt
│   ├── base.repository.ts          # findById, findByIdOrThrow, save, delete, findWithDeleted, restore
│   └── mikro-orm.config.ts
├── auth/
│   └── auth.port.ts                # IAuthPort, AUTH_PORT symbol, AuthUser
├── exceptions/
│   ├── app-exception.base.ts
│   ├── not-found.exception.ts
│   ├── forbidden.exception.ts
│   ├── conflict.exception.ts
│   ├── unauthorized.exception.ts
│   └── gql-exception.filter.ts
└── utils/
    └── uuid.util.ts                # generateUuidV7()
```

### 핵심 추상 클래스

**`repository.port.ts`**
```typescript
export abstract class RepositoryPort<T extends AggregateRoot<unknown>> {
  abstract findById(id: string): Promise<T | null>;
  abstract findByIdOrThrow(id: string): Promise<T>;
  abstract save(entity: T): Promise<void>;
  abstract findWithDeleted(filter: Record<string, unknown>): Promise<T | null>;
  abstract hardDelete(entity: T): Promise<void>;
}
```

> **삭제 책임 구분**:
> - **Soft delete** (도메인 상태 전이): Handler가 `entity.delete()` 호출 후 `repo.save(entity)`. Repository에는 메서드 없음 — 도메인이 상태 소유.
> - **Hard delete** (순수 영속성): `repo.hardDelete(entity)` — DB에서 row 제거. 도메인 상태와 무관 (GDPR, admin cleanup 등 인프라 관심사).

**`base.repository.ts`** (MikroORM 구현체)
```typescript
export abstract class BaseRepository<
  TDomain extends AggregateRoot<unknown>,
  TOrm extends OrmEntityBase,
> extends RepositoryPort<TDomain> {
  constructor(
    protected readonly repo: EntityRepository<TOrm>,
    protected readonly mapper: IMapper<TDomain, TOrm, unknown>,
    protected readonly em: EntityManager,
  ) { super(); }

  async findById(id: string): Promise<TDomain | null> {
    const orm = await this.repo.findOne({ id } as FilterQuery<TOrm>);
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async findByIdOrThrow(id: string): Promise<TDomain> {
    const entity = await this.findById(id);
    if (!entity) throw new NotFoundException(id);
    return entity;
  }

  async save(entity: TDomain): Promise<void> {
    const orm = this.mapper.toOrm(entity);
    await this.em.upsert(orm);
  }

  // soft-delete된 레코드 조회 (restore 흐름용)
  async findWithDeleted(filter: FilterQuery<TOrm>): Promise<TDomain | null> {
    const orm = await this.repo.findOne(filter, { filters: { notDeleted: false } });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  // 하드 딜리트: DB에서 완전 제거 (GDPR, admin cleanup 등)
  async hardDelete(entity: TDomain): Promise<void> {
    const orm = await this.repo.findOneOrFail(
      { id: entity.id } as FilterQuery<TOrm>,
      { filters: { notDeleted: false } },   // soft-deleted도 대상
    );
    await this.em.removeAndFlush(orm);
  }
}
```

### 표준 Handler 패턴 (삭제/복원)

```typescript
// 삭제
const workspace = await this.repo.findByIdOrThrow(id);
workspace.delete();           // 도메인이 _deletedAt 설정
await this.repo.save(workspace);

// 복원 (예: 동일 slug로 재생성 요청 시)
const existing = await this.repo.findWithDeleted({ slug });
if (existing?.isDeleted) {
  existing.restore();
  await this.repo.save(existing);
} else if (!existing) {
  const fresh = Workspace.create({ slug, ... });
  await this.repo.save(fresh);
}
```

**`orm-entity.base.ts`**
```typescript
@Filter({ name: 'notDeleted', cond: { deletedAt: null }, default: true })
export abstract class OrmEntityBase {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ name: 'created_at' })
  createdAt: Date = new Date();

  @Property({ name: 'updated_at', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
```

**`entity.base.ts`** (도메인 엔티티)
```typescript
export abstract class Entity<T> {
  protected readonly _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _deletedAt?: Date;

  constructor(props: {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }) {
    this._id = props.id;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._deletedAt = props.deletedAt;
  }

  get id(): string { return this._id; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get deletedAt(): Date | undefined { return this._deletedAt; }
  get isDeleted(): boolean { return this._deletedAt !== undefined; }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  delete(): void {
    if (this._deletedAt) return;            // 멱등
    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
  }

  restore(): void {
    if (!this._deletedAt) return;
    this._deletedAt = undefined;
    this.touch();
  }

  equals(other: Entity<T>): boolean { return this._id === other._id; }
}
```

---

## 4. Feature 디렉터리 구조

```
src/features/{feature}/
├── domain/
│   ├── {feature}.aggregate.ts
│   ├── value-objects/
│   │   └── {name}.value-object.ts
│   └── events/
│       └── {feature}-created.event.ts
├── application/
│   ├── ports/
│   │   └── {feature}.repository.port.ts   # IXxxRepository + Symbol token
│   ├── commands/
│   │   └── {action}-{feature}/
│   │       ├── {action}-{feature}.command.ts
│   │       └── {action}-{feature}.handler.ts
│   ├── queries/
│   │   └── get-{feature}/
│   │       ├── get-{feature}.query.ts
│   │       └── get-{feature}.handler.ts
│   └── event-handlers/
│       └── {feature}-created.handler.ts
├── infrastructure/
│   ├── repositories/
│   │   └── {feature}.repository.ts        # extends BaseRepository, implements port
│   ├── orm-entities/
│   │   └── {feature}.orm-entity.ts        # extends OrmEntityBase
│   └── mappers/
│       └── {feature}.mapper.ts            # implements IMapper
├── graphql/
│   ├── resolvers/
│   │   ├── {feature}.mutations.ts
│   │   └── {feature}.queries.ts
│   └── schemas/
│       ├── inputs/                        # 인자 개수 무관하게 파일 필수
│       │   ├── get-{feature}.input.ts     # @ArgsType
│       │   ├── get-{feature}s.input.ts    # @ArgsType
│       │   └── create-{feature}.input.ts  # @InputType
│       ├── models/
│       │   └── {feature}.model.ts         # @ObjectType
│       └── enums/
│           └── {name}.enum.ts
└── {feature}.module.ts
```

---

## 5. CQRS + GraphQL 컨벤션

### Query 네이밍: `get` 접두사 필수
```typescript
getWorkspace, getWorkspaces, getSessions, getMembers, ...
```

### Input 파일 규칙
- 파일명: `{kebab-case-class-name}.input.ts` (예: `GetWorkspaceInput` → `get-workspace.input.ts`)
- 클래스명: 반드시 `{Action}{Feature}Input` 패턴 (`GetWorkspaceInput`, `CreateWorkspaceInput`)
- Query args: `@ArgsType()` 데코레이터, Resolver에서 `@Args()` 사용
- Mutation input: `@InputType()` 데코레이터, Resolver에서 `@Args('input')` 사용
- 인자가 1개여도 반드시 파일 생성
- GraphQL schema 타입명은 클래스명을 그대로 사용 (별도 name 오버라이드 금지)

### Command Flow
```
Mutation Resolver
  → CommandBus.execute(new XxxCommand(...))
    → CommandHandler: Domain 조작 → Repository.save() → em.flush()
      → returns id
  → QueryBus.execute(new GetXxxQuery(id))
    → GraphQL ObjectType 반환
```

### Query Flow
```
Query Resolver
  → QueryBus.execute(new GetXxxQuery(...))
    → QueryHandler: Repository.findXxx() → Mapper.toGraphQL()
      → GraphQL ObjectType 반환
```

### flush 전략
- `save()`: `em.upsert()` — DB 즉시 실행 (UoW 추적 밖). 새 엔티티 INSERT, 기존 UPDATE를 원자적으로 처리
- 추적된 ORM 엔티티 변경(예: `delete()` 내 `orm.deletedAt = new Date()`): UoW가 변경 감지 → flush 시 반영
- Command Handler: `em.transactional()` 또는 `em.flush()`로 단 한 번 트랜잭션 종료
  - 여러 repository 작업의 원자성을 보장하려면 `em.transactional(() => { ... })` 래핑 권장

### Repository DI 패턴
```typescript
// port 파일에 Symbol 함께 선언
export const WORKSPACE_REPOSITORY = Symbol('WORKSPACE_REPOSITORY');
export interface IWorkspaceRepository extends RepositoryPort<Workspace> { ... }

// module에서 바인딩
{ provide: WORKSPACE_REPOSITORY, useClass: WorkspaceRepository }

// handler에서 주입
@Inject(WORKSPACE_REPOSITORY) private readonly repo: IWorkspaceRepository
```

### Auth 통합
```typescript
// IAuthPort (libs/auth/auth.port.ts)
export const AUTH_PORT = Symbol('AUTH_PORT');
export interface IAuthPort {
  verifyToken(token: string): Promise<AuthUser>;
  // getUser()는 YAGNI — JwtAuthGuard에서 verifyToken()만 사용
}

// JwtAuthGuard: IAuthPort.verifyToken() → AuthUser를 GraphQL context에 주입
// @CurrentUser() 데코레이터로 Resolver에서 추출
```

---

## 6. 모듈 구현 순서

| # | 모듈 | Aggregates | Commands | Queries | 비고 |
|---|------|-----------|----------|---------|------|
| 1 | **auth** | — | — | — | IAuthPort + SupabaseAuthAdapter, JwtAuthGuard, @CurrentUser |
| 2 | **workspace** | Workspace | CreateWorkspace, DeleteWorkspace | GetWorkspace, GetWorkspaces | WorkspaceSlug, WorkspaceName VO |
| 3 | **member** | Member | CreateMember, UpdateMember, DeleteMember | GetMember, GetMembers | role enum |
| 4 | **session** | Session | CheckIn, CheckOut | GetSession, GetSessions | is_late 도메인 로직 |
| 5 | **vacation** | DailyVacation | CreateVacation, DeleteVacation | GetVacations | restore 패턴 적용 |
| 6 | **fee** | MonthlyFee | UpdateMonthlyFeeStatus, UpdateLateFeeStatus | GetMonthlyFees | status enum |
| 7 | **settings** | WorkspaceSettings | UpdateSettings | GetSettings | 1:1 workspace (UNIQUE workspace_id), upsert |
| 8 | **invite** | Invite | CreateInvite, UseInvite, RevokeInvite | GetInvite | token 생성, 만료 처리 |
