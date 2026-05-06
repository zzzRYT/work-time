# Backend Foundation + Auth 구현 계획서 (Plan 1/8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** server/ 백엔드를 DDD + Hexagonal + CQRS로 재시작할 수 있도록 `libs/` 공통 추상화와 auth 모듈을 구축한다. 이 플랜이 끝나면 server는 빈 GraphQL 스키마(`me()` 쿼리만)로 부팅되며 후속 feature 플랜이 그 위에 모듈을 얹는다.

**Architecture:**
- `libs/`는 도메인 프리미티브(Entity/AggregateRoot/VO), ORM 헬퍼(MikroORM Filter/BaseRepository), 예외 계층, 유틸을 제공
- TypeORM 제거 → MikroORM(postgresql) 도입. 모든 ORM entity는 `OrmEntityBase`를 상속해 soft-delete `@Filter`와 timestamps를 자동 적용
- `features/auth/`는 `IAuthPort` 추상을 통해 Supabase를 캡슐화. 다른 feature는 이 포트만 알고 Supabase를 모름
- 공용 인프라/도메인 코드는 `libs/`, 기능별 코드는 `features/{name}/`. 8개 feature 모듈이 후속 플랜에서 채워진다

**Tech Stack:**
- NestJS 11 + `@nestjs/cqrs` + `@nestjs/graphql`(Apollo, code-first)
- MikroORM 6 (`@mikro-orm/postgresql`, `@mikro-orm/migrations`, `@mikro-orm/nestjs`)
- `@supabase/supabase-js` (verifyToken)
- `uuidv7` npm 패키지
- Jest (단위 테스트)

**전제:**
- 스펙: `docs/superpowers/specs/2026-05-05-backend-ddd-hexagonal-design.md`
- 현 server는 TypeORM 기반, `src/entities/` + `src/modules/{auth,workspace,member,session,vacation,fee,settings,invite}/` 존재 — 이 플랜에서 전부 제거
- `src/main.ts`, `src/sentry.ts`, `src/health/`는 유지
- `src/common/`은 검토 후 필요한 부분만 유지
- DB 스키마 변경은 이 플랜에서 다루지 않음 (auth는 DB 미사용). 이후 feature 플랜에서 마이그레이션 작성

---

## 파일 구조

생성:
```
server/src/libs/
├── ddd/
│   ├── entity.base.ts
│   ├── aggregate-root.base.ts
│   ├── value-object.base.ts
│   ├── domain-event.base.ts
│   ├── repository.port.ts
│   ├── mapper.interface.ts
│   ├── command.base.ts
│   └── query.base.ts
├── orm/
│   ├── orm-entity.base.ts
│   ├── base.repository.ts
│   └── mikro-orm.config.ts
├── auth/
│   └── auth.port.ts
├── exceptions/
│   ├── app-exception.base.ts
│   ├── not-found.exception.ts
│   ├── forbidden.exception.ts
│   ├── conflict.exception.ts
│   ├── unauthorized.exception.ts
│   └── gql-exception.filter.ts
└── utils/
    └── uuid.util.ts

server/src/features/auth/
├── infrastructure/
│   ├── supabase-auth.adapter.ts
│   └── jwt-auth.guard.ts
├── graphql/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── resolvers/
│   │   └── auth.queries.ts
│   └── schemas/
│       └── models/
│           └── auth-user.model.ts
└── auth.module.ts
```

수정:
- `server/package.json` — TypeORM 제거 + MikroORM/CQRS/uuidv7 설치
- `server/src/app.module.ts` — TypeOrmModule → MikroOrmModule, AuthModule만 등록 (나머지는 후속 플랜)
- `server/.env.example` — MikroORM 필요 변수 추가
- `server/CLAUDE.md` — Stack 항목 갱신

삭제:
- `server/src/entities/` (디렉터리 전체)
- `server/src/modules/` (디렉터리 전체 — 8개 모듈 모두)
- `server/prisma/` (사용되지 않음, 잔재)

테스트:
```
server/src/libs/ddd/__tests__/entity.base.spec.ts
server/src/libs/ddd/__tests__/aggregate-root.base.spec.ts
server/src/libs/ddd/__tests__/value-object.base.spec.ts
server/src/libs/utils/__tests__/uuid.util.spec.ts
server/src/libs/exceptions/__tests__/gql-exception.filter.spec.ts
server/src/features/auth/infrastructure/__tests__/supabase-auth.adapter.spec.ts
server/src/features/auth/infrastructure/__tests__/jwt-auth.guard.spec.ts
```

---

## Task 1: 브랜치 + 의존성 + 데모리션

**Files:**
- Modify: `server/package.json`
- Modify: `server/.env.example`
- Delete: `server/src/entities/`, `server/src/modules/`, `server/prisma/`

- [ ] **Step 1.1: 피처 브랜치 생성**

```bash
git checkout main
git pull
git checkout -b refactor/ddd-hexagonal
```

- [ ] **Step 1.2: TypeORM 제거 + MikroORM/CQRS/uuidv7 설치**

```bash
cd server
npm uninstall typeorm @nestjs/typeorm
npm install @mikro-orm/core @mikro-orm/postgresql @mikro-orm/migrations @mikro-orm/nestjs @nestjs/cqrs uuidv7
```

- [ ] **Step 1.3: 구 엔티티/모듈/prisma 디렉터리 제거**

```bash
rm -rf server/src/entities server/src/modules server/prisma
```

- [ ] **Step 1.4: package.json scripts에 MikroORM 마이그레이션 명령 추가**

`server/package.json`의 `scripts` 항목을 다음으로 교체 (typeorm 줄 삭제, mikro-orm 추가):

```json
"scripts": {
  "dev": "NODE_ENV=local nest start --watch",
  "build": "nest build && tsc-alias",
  "start": "node dist/main.js",
  "start:prod": "node dist/main.js",
  "mikro-orm": "mikro-orm --config ./src/libs/orm/mikro-orm.config.ts",
  "migration:create": "npm run mikro-orm -- migration:create",
  "migration:up": "npm run mikro-orm -- migration:up",
  "migration:down": "npm run mikro-orm -- migration:down",
  "docs:generate": "spectaql spectaql.yml -t docs/api",
  "docs:serve": "spectaql spectaql.yml -t docs/api -D",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage"
}
```

또한 dependencies에서 `typeorm`, `@nestjs/typeorm`이 제거되고 위 4개 패키지가 추가됐는지 확인.

- [ ] **Step 1.5: .env.example 갱신**

`server/.env.example`에 아래 항목이 있는지 확인 (없으면 추가):

```
DATABASE_URL=postgres://user:pass@host:5432/db
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NODE_ENV=local
PORT=4000
CORS_ORIGINS=http://localhost:8081
```

- [ ] **Step 1.6: 임시로 app.module.ts/main.ts 컴파일 가능하게**

`server/src/app.module.ts`를 임시로 다음으로 교체 (Task 17에서 다시 채움):

```typescript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule],
})
export class AppModule {}
```

- [ ] **Step 1.7: 타입체크로 데모리션 검증**

```bash
cd server && npx tsc --noEmit
```

기대: 0 errors. 만약 `src/common/` 안에서 구 엔티티를 참조하는 코드가 있다면 그 부분도 함께 제거하거나 주석 처리(이 플랜이 끝날 때까지 사용 안 하는 코드).

- [ ] **Step 1.8: 커밋**

```bash
git add -A
git commit -m "chore(server): remove TypeORM stack, install MikroORM + CQRS

- Uninstall typeorm, @nestjs/typeorm
- Install @mikro-orm/{core,postgresql,migrations,nestjs}, @nestjs/cqrs, uuidv7
- Drop src/entities/, src/modules/, prisma/ ahead of DDD rewrite
- Reduce app.module.ts to HealthModule shell"
```

---

## Task 2: DDD - Entity base (TDD)

**Files:**
- Create: `server/src/libs/ddd/entity.base.ts`
- Test: `server/src/libs/ddd/__tests__/entity.base.spec.ts`

- [ ] **Step 2.1: 실패하는 테스트 작성**

`server/src/libs/ddd/__tests__/entity.base.spec.ts`:

```typescript
import { Entity } from '../entity.base';

class TestEntity extends Entity<TestEntity> {
  // 도메인 메서드 노출용 헬퍼
  public callTouch() { this.touch(); }
}

describe('Entity', () => {
  it('생성 시 createdAt과 updatedAt이 동일한 시점으로 설정된다', () => {
    const e = new TestEntity({ id: 'a' });
    expect(e.createdAt).toEqual(e.updatedAt);
  });

  it('주입된 createdAt/updatedAt을 그대로 사용한다', () => {
    const created = new Date('2025-01-01T00:00:00Z');
    const updated = new Date('2025-01-02T00:00:00Z');
    const e = new TestEntity({ id: 'a', createdAt: created, updatedAt: updated });
    expect(e.createdAt).toEqual(created);
    expect(e.updatedAt).toEqual(updated);
  });

  it('touch()는 updatedAt만 갱신한다', async () => {
    const e = new TestEntity({ id: 'a' });
    const created = e.createdAt;
    await new Promise(r => setTimeout(r, 5));
    e.callTouch();
    expect(e.createdAt).toEqual(created);
    expect(e.updatedAt.getTime()).toBeGreaterThan(created.getTime());
  });

  it('delete()는 deletedAt을 설정하고 isDeleted가 true가 된다', () => {
    const e = new TestEntity({ id: 'a' });
    expect(e.isDeleted).toBe(false);
    e.delete();
    expect(e.isDeleted).toBe(true);
    expect(e.deletedAt).toBeInstanceOf(Date);
  });

  it('delete()는 멱등이다', () => {
    const e = new TestEntity({ id: 'a' });
    e.delete();
    const firstDeletedAt = e.deletedAt;
    e.delete();
    expect(e.deletedAt).toEqual(firstDeletedAt);
  });

  it('restore()는 deletedAt을 비우고 updatedAt을 갱신한다', async () => {
    const e = new TestEntity({ id: 'a' });
    e.delete();
    expect(e.isDeleted).toBe(true);
    await new Promise(r => setTimeout(r, 5));
    e.restore();
    expect(e.isDeleted).toBe(false);
    expect(e.deletedAt).toBeUndefined();
  });

  it('equals는 id로만 비교한다', () => {
    const a1 = new TestEntity({ id: 'a' });
    const a2 = new TestEntity({ id: 'a' });
    const b = new TestEntity({ id: 'b' });
    expect(a1.equals(a2)).toBe(true);
    expect(a1.equals(b)).toBe(false);
  });
});
```

- [ ] **Step 2.2: 테스트 실패 확인**

```bash
cd server && npm test -- entity.base.spec
```

기대: FAIL — `Cannot find module '../entity.base'`.

- [ ] **Step 2.3: Entity base 구현**

`server/src/libs/ddd/entity.base.ts`:

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
    const now = new Date();
    this._id = props.id;
    this._createdAt = props.createdAt ?? now;
    this._updatedAt = props.updatedAt ?? this._createdAt;
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
    if (this._deletedAt) return;
    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
  }

  restore(): void {
    if (!this._deletedAt) return;
    this._deletedAt = undefined;
    this.touch();
  }

  equals(other: Entity<T>): boolean {
    return this._id === other._id;
  }
}
```

- [ ] **Step 2.4: 테스트 통과 확인**

```bash
cd server && npm test -- entity.base.spec
```

기대: 7 passing.

- [ ] **Step 2.5: 커밋**

```bash
git add server/src/libs/ddd/entity.base.ts server/src/libs/ddd/__tests__/entity.base.spec.ts
git commit -m "feat(libs): add Entity base with timestamps and soft-delete"
```

---

## Task 3: DDD - AggregateRoot (TDD)

**Files:**
- Create: `server/src/libs/ddd/domain-event.base.ts`
- Create: `server/src/libs/ddd/aggregate-root.base.ts`
- Test: `server/src/libs/ddd/__tests__/aggregate-root.base.spec.ts`

- [ ] **Step 3.1: 실패하는 테스트 작성**

`server/src/libs/ddd/__tests__/aggregate-root.base.spec.ts`:

```typescript
import { AggregateRoot } from '../aggregate-root.base';
import { DomainEvent } from '../domain-event.base';

class FooCreated implements DomainEvent {
  readonly occurredAt = new Date();
  constructor(readonly aggregateId: string) {}
}

class FooAggregate extends AggregateRoot<FooAggregate> {
  emitCreated() { this.addEvent(new FooCreated(this.id)); }
}

describe('AggregateRoot', () => {
  it('초기 domainEvents는 빈 배열', () => {
    const a = new FooAggregate({ id: 'a' });
    expect(a.domainEvents).toEqual([]);
  });

  it('addEvent로 이벤트가 누적된다', () => {
    const a = new FooAggregate({ id: 'a' });
    a.emitCreated();
    expect(a.domainEvents).toHaveLength(1);
    expect(a.domainEvents[0]).toBeInstanceOf(FooCreated);
  });

  it('domainEvents getter는 외부 변형으로부터 보호된다(복사본 반환)', () => {
    const a = new FooAggregate({ id: 'a' });
    a.emitCreated();
    a.domainEvents.pop();
    expect(a.domainEvents).toHaveLength(1);
  });

  it('clearEvents는 큐를 비운다', () => {
    const a = new FooAggregate({ id: 'a' });
    a.emitCreated();
    a.clearEvents();
    expect(a.domainEvents).toEqual([]);
  });
});
```

- [ ] **Step 3.2: 테스트 실패 확인**

```bash
cd server && npm test -- aggregate-root.base.spec
```

기대: FAIL.

- [ ] **Step 3.3: domain-event.base.ts 작성**

`server/src/libs/ddd/domain-event.base.ts`:

```typescript
export interface DomainEvent {
  readonly aggregateId: string;
  readonly occurredAt: Date;
}
```

- [ ] **Step 3.4: aggregate-root.base.ts 작성**

`server/src/libs/ddd/aggregate-root.base.ts`:

```typescript
import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
```

- [ ] **Step 3.5: 테스트 통과 확인**

```bash
cd server && npm test -- aggregate-root.base.spec
```

기대: 4 passing.

- [ ] **Step 3.6: 커밋**

```bash
git add server/src/libs/ddd/domain-event.base.ts server/src/libs/ddd/aggregate-root.base.ts server/src/libs/ddd/__tests__/aggregate-root.base.spec.ts
git commit -m "feat(libs): add AggregateRoot with DomainEvent queue"
```

---

## Task 4: DDD - ValueObject (TDD)

**Files:**
- Create: `server/src/libs/ddd/value-object.base.ts`
- Test: `server/src/libs/ddd/__tests__/value-object.base.spec.ts`

- [ ] **Step 4.1: 실패하는 테스트 작성**

`server/src/libs/ddd/__tests__/value-object.base.spec.ts`:

```typescript
import { ValueObject } from '../value-object.base';

interface Money { amount: number; currency: string; }

class MoneyVO extends ValueObject<Money> {
  static create(amount: number, currency: string): MoneyVO {
    return new MoneyVO({ amount, currency });
  }
  get amount() { return this.props.amount; }
  get currency() { return this.props.currency; }
}

describe('ValueObject', () => {
  it('동일 props면 equals가 true', () => {
    const a = MoneyVO.create(100, 'KRW');
    const b = MoneyVO.create(100, 'KRW');
    expect(a.equals(b)).toBe(true);
  });

  it('하나라도 다르면 equals가 false', () => {
    const a = MoneyVO.create(100, 'KRW');
    const b = MoneyVO.create(100, 'USD');
    expect(a.equals(b)).toBe(false);
  });

  it('null/undefined와의 비교는 false', () => {
    const a = MoneyVO.create(100, 'KRW');
    expect(a.equals(null as unknown as MoneyVO)).toBe(false);
    expect(a.equals(undefined as unknown as MoneyVO)).toBe(false);
  });

  it('props는 동결되어 변경 불가', () => {
    const a = MoneyVO.create(100, 'KRW');
    expect(() => { (a as unknown as { props: Money }).props.amount = 200; })
      .toThrow();
  });
});
```

- [ ] **Step 4.2: 테스트 실패 확인**

```bash
cd server && npm test -- value-object.base.spec
```

- [ ] **Step 4.3: value-object.base.ts 작성**

`server/src/libs/ddd/value-object.base.ts`:

```typescript
export abstract class ValueObject<T extends object> {
  protected readonly props: Readonly<T>;

  constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    const keys = Object.keys(this.props) as (keyof T)[];
    return keys.every((k) => this.props[k] === other.props[k]);
  }
}
```

- [ ] **Step 4.4: 테스트 통과 확인**

```bash
cd server && npm test -- value-object.base.spec
```

기대: 4 passing.

- [ ] **Step 4.5: 커밋**

```bash
git add server/src/libs/ddd/value-object.base.ts server/src/libs/ddd/__tests__/value-object.base.spec.ts
git commit -m "feat(libs): add ValueObject base with frozen props"
```

---

## Task 5: DDD - 나머지 프리미티브 (Repository/Mapper/Command/Query)

**Files:**
- Create: `server/src/libs/ddd/repository.port.ts`
- Create: `server/src/libs/ddd/mapper.interface.ts`
- Create: `server/src/libs/ddd/command.base.ts`
- Create: `server/src/libs/ddd/query.base.ts`

이 파일들은 인터페이스/추상이라 별도 단위 테스트 없이 컴파일 통과로 검증한다 (구체 사용처에서 간접 테스트됨).

- [ ] **Step 5.1: repository.port.ts**

`server/src/libs/ddd/repository.port.ts`:

```typescript
import { AggregateRoot } from './aggregate-root.base';

export abstract class RepositoryPort<T extends AggregateRoot<unknown>> {
  abstract findById(id: string): Promise<T | null>;
  abstract findByIdOrThrow(id: string): Promise<T>;
  abstract save(entity: T): Promise<void>;
  abstract findWithDeleted(filter: Record<string, unknown>): Promise<T | null>;
  abstract hardDelete(entity: T): Promise<void>;
}
```

- [ ] **Step 5.2: mapper.interface.ts**

`server/src/libs/ddd/mapper.interface.ts`:

```typescript
export interface IMapper<DomainEntity, OrmEntity, GraphQLModel = never> {
  toDomain(orm: OrmEntity): DomainEntity;
  toOrm(domain: DomainEntity): OrmEntity;
  toGraphQL?(domain: DomainEntity): GraphQLModel;
}
```

- [ ] **Step 5.3: command.base.ts**

`server/src/libs/ddd/command.base.ts`:

```typescript
export abstract class CommandBase {
  // CQRS Command 마커. 필요 시 공통 메타데이터 추가
}
```

- [ ] **Step 5.4: query.base.ts**

`server/src/libs/ddd/query.base.ts`:

```typescript
export abstract class QueryBase {
  // CQRS Query 마커. 필요 시 공통 메타데이터 추가
}
```

- [ ] **Step 5.5: 타입체크**

```bash
cd server && npx tsc --noEmit
```

기대: 0 errors.

- [ ] **Step 5.6: 커밋**

```bash
git add server/src/libs/ddd/repository.port.ts server/src/libs/ddd/mapper.interface.ts server/src/libs/ddd/command.base.ts server/src/libs/ddd/query.base.ts
git commit -m "feat(libs): add RepositoryPort, IMapper, Command/Query bases"
```

---

## Task 6: utils/uuid (TDD)

**Files:**
- Create: `server/src/libs/utils/uuid.util.ts`
- Test: `server/src/libs/utils/__tests__/uuid.util.spec.ts`

- [ ] **Step 6.1: 실패하는 테스트 작성**

`server/src/libs/utils/__tests__/uuid.util.spec.ts`:

```typescript
import { generateUuidV7 } from '../uuid.util';

describe('generateUuidV7', () => {
  it('형식이 유효한 UUID 문자열을 반환한다', () => {
    const id = generateUuidV7();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('연속 호출 시 시간 순서가 보장된다(문자열 비교)', () => {
    const a = generateUuidV7();
    const b = generateUuidV7();
    expect(b >= a).toBe(true);
  });
});
```

- [ ] **Step 6.2: 테스트 실패 확인**

```bash
cd server && npm test -- uuid.util.spec
```

- [ ] **Step 6.3: 구현**

`server/src/libs/utils/uuid.util.ts`:

```typescript
import { uuidv7 } from 'uuidv7';

export function generateUuidV7(): string {
  return uuidv7();
}
```

- [ ] **Step 6.4: 테스트 통과 확인**

```bash
cd server && npm test -- uuid.util.spec
```

기대: 2 passing.

- [ ] **Step 6.5: 커밋**

```bash
git add server/src/libs/utils/uuid.util.ts server/src/libs/utils/__tests__/uuid.util.spec.ts
git commit -m "feat(libs): add generateUuidV7 utility"
```

---

## Task 7: 예외 계층

**Files:**
- Create: `server/src/libs/exceptions/app-exception.base.ts`
- Create: `server/src/libs/exceptions/not-found.exception.ts`
- Create: `server/src/libs/exceptions/forbidden.exception.ts`
- Create: `server/src/libs/exceptions/conflict.exception.ts`
- Create: `server/src/libs/exceptions/unauthorized.exception.ts`

이 클래스들은 단순해서 단위 테스트 생략. GraphQL 필터에서 통합 검증.

- [ ] **Step 7.1: app-exception.base.ts**

`server/src/libs/exceptions/app-exception.base.ts`:

```typescript
export abstract class AppException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

- [ ] **Step 7.2: not-found.exception.ts**

`server/src/libs/exceptions/not-found.exception.ts`:

```typescript
import { AppException } from './app-exception.base';

export class NotFoundException extends AppException {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;

  constructor(resource: string, identifier?: string) {
    super(identifier ? `${resource} not found: ${identifier}` : `${resource} not found`);
  }
}
```

- [ ] **Step 7.3: forbidden.exception.ts**

`server/src/libs/exceptions/forbidden.exception.ts`:

```typescript
import { AppException } from './app-exception.base';

export class ForbiddenException extends AppException {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
}
```

- [ ] **Step 7.4: conflict.exception.ts**

`server/src/libs/exceptions/conflict.exception.ts`:

```typescript
import { AppException } from './app-exception.base';

export class ConflictException extends AppException {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;
}
```

- [ ] **Step 7.5: unauthorized.exception.ts**

`server/src/libs/exceptions/unauthorized.exception.ts`:

```typescript
import { AppException } from './app-exception.base';

export class UnauthorizedException extends AppException {
  readonly code = 'UNAUTHORIZED';
  readonly httpStatus = 401;
}
```

- [ ] **Step 7.6: 타입체크 + 커밋**

```bash
cd server && npx tsc --noEmit
```

```bash
git add server/src/libs/exceptions/
git commit -m "feat(libs): add AppException hierarchy (NotFound/Forbidden/Conflict/Unauthorized)"
```

---

## Task 8: GraphQL 예외 필터 (TDD)

**Files:**
- Create: `server/src/libs/exceptions/gql-exception.filter.ts`
- Test: `server/src/libs/exceptions/__tests__/gql-exception.filter.spec.ts`

- [ ] **Step 8.1: 실패하는 테스트 작성**

`server/src/libs/exceptions/__tests__/gql-exception.filter.spec.ts`:

```typescript
import { GqlExceptionFilter } from '../gql-exception.filter';
import { NotFoundException } from '../not-found.exception';
import { ForbiddenException } from '../forbidden.exception';

describe('GqlExceptionFilter', () => {
  const filter = new GqlExceptionFilter();

  it('AppException을 code/extensions를 가진 GraphQLError로 변환', () => {
    const result = filter.toGraphQLError(new NotFoundException('Workspace', 'abc'));
    expect(result.message).toContain('Workspace not found: abc');
    expect(result.extensions?.code).toBe('NOT_FOUND');
    expect(result.extensions?.httpStatus).toBe(404);
  });

  it('ForbiddenException 변환', () => {
    const result = filter.toGraphQLError(new ForbiddenException('no access'));
    expect(result.extensions?.code).toBe('FORBIDDEN');
    expect(result.extensions?.httpStatus).toBe(403);
  });

  it('일반 Error는 INTERNAL_ERROR 코드로 노출', () => {
    const result = filter.toGraphQLError(new Error('boom'));
    expect(result.extensions?.code).toBe('INTERNAL_ERROR');
    expect(result.extensions?.httpStatus).toBe(500);
  });
});
```

- [ ] **Step 8.2: 테스트 실패 확인**

```bash
cd server && npm test -- gql-exception.filter.spec
```

- [ ] **Step 8.3: 구현**

`server/src/libs/exceptions/gql-exception.filter.ts`:

```typescript
import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { AppException } from './app-exception.base';

@Catch()
export class GqlExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): GraphQLError {
    GqlArgumentsHost.create(host);
    return this.toGraphQLError(exception);
  }

  toGraphQLError(exception: unknown): GraphQLError {
    if (exception instanceof AppException) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          httpStatus: exception.httpStatus,
        },
      });
    }
    const message = exception instanceof Error ? exception.message : 'Internal error';
    return new GraphQLError(message, {
      extensions: { code: 'INTERNAL_ERROR', httpStatus: 500 },
    });
  }
}
```

- [ ] **Step 8.4: 테스트 통과 확인**

```bash
cd server && npm test -- gql-exception.filter.spec
```

기대: 3 passing.

- [ ] **Step 8.5: 커밋**

```bash
git add server/src/libs/exceptions/gql-exception.filter.ts server/src/libs/exceptions/__tests__/gql-exception.filter.spec.ts
git commit -m "feat(libs): add GqlExceptionFilter mapping AppException to GraphQLError"
```

---

## Task 9: ORM - OrmEntityBase

**Files:**
- Create: `server/src/libs/orm/orm-entity.base.ts`

테스트는 구체 ORM 엔티티가 추가되는 후속 플랜에서 통합으로 검증.

- [ ] **Step 9.1: orm-entity.base.ts 작성**

`server/src/libs/orm/orm-entity.base.ts`:

```typescript
import { Filter, PrimaryKey, Property } from '@mikro-orm/core';

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

- [ ] **Step 9.2: 타입체크 + 커밋**

```bash
cd server && npx tsc --noEmit
```

```bash
git add server/src/libs/orm/orm-entity.base.ts
git commit -m "feat(libs): add OrmEntityBase with notDeleted filter and timestamps"
```

---

## Task 10: ORM - BaseRepository

**Files:**
- Create: `server/src/libs/orm/base.repository.ts`

테스트는 구체 repository 추가 시 통합 테스트.

- [ ] **Step 10.1: base.repository.ts 작성**

`server/src/libs/orm/base.repository.ts`:

```typescript
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { AggregateRoot } from '../ddd/aggregate-root.base';
import { IMapper } from '../ddd/mapper.interface';
import { RepositoryPort } from '../ddd/repository.port';
import { NotFoundException } from '../exceptions/not-found.exception';
import { OrmEntityBase } from './orm-entity.base';

export abstract class BaseRepository<
  TDomain extends AggregateRoot<unknown>,
  TOrm extends OrmEntityBase,
> extends RepositoryPort<TDomain> {
  constructor(
    protected readonly repo: EntityRepository<TOrm>,
    protected readonly mapper: IMapper<TDomain, TOrm, unknown>,
    protected readonly em: EntityManager,
  ) {
    super();
  }

  async findById(id: string): Promise<TDomain | null> {
    const orm = await this.repo.findOne({ id } as FilterQuery<TOrm>);
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async findByIdOrThrow(id: string): Promise<TDomain> {
    const entity = await this.findById(id);
    if (!entity) throw new NotFoundException(this.entityName, id);
    return entity;
  }

  async save(entity: TDomain): Promise<void> {
    const orm = this.mapper.toOrm(entity);
    await this.em.upsert(orm);
  }

  async findWithDeleted(filter: FilterQuery<TOrm>): Promise<TDomain | null> {
    const orm = await this.repo.findOne(filter, { filters: { notDeleted: false } });
    return orm ? this.mapper.toDomain(orm) : null;
  }

  async hardDelete(entity: TDomain): Promise<void> {
    const orm = await this.repo.findOneOrFail(
      { id: entity.id } as FilterQuery<TOrm>,
      { filters: { notDeleted: false } },
    );
    await this.em.removeAndFlush(orm);
  }

  protected get entityName(): string {
    return this.constructor.name.replace(/Repository$/, '');
  }
}
```

- [ ] **Step 10.2: 타입체크 + 커밋**

```bash
cd server && npx tsc --noEmit
```

```bash
git add server/src/libs/orm/base.repository.ts
git commit -m "feat(libs): add BaseRepository (MikroORM Data Mapper + UoW + soft-delete)"
```

---

## Task 11: ORM - mikro-orm.config.ts

**Files:**
- Create: `server/src/libs/orm/mikro-orm.config.ts`

- [ ] **Step 11.1: mikro-orm.config.ts 작성**

`server/src/libs/orm/mikro-orm.config.ts`:

```typescript
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import * as path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  driverOptions: process.env.DATABASE_URL?.includes('supabase')
    ? { connection: { ssl: { rejectUnauthorized: false } } }
    : {},
  entities: [path.join(__dirname, '../../features/**/*.orm-entity.{ts,js}')],
  entitiesTs: [path.join(__dirname, '../../features/**/*.orm-entity.ts')],
  debug: !isProduction,
  extensions: [Migrator],
  migrations: {
    path: path.join(__dirname, '../../../migrations'),
    pathTs: path.join(__dirname, '../../../migrations'),
    glob: '!(*.d).{js,ts}',
    transactional: true,
    emit: 'ts',
  },
});
```

- [ ] **Step 11.2: migrations 디렉터리 placeholder 생성**

```bash
mkdir -p server/migrations && touch server/migrations/.gitkeep
```

- [ ] **Step 11.3: 타입체크 + 커밋**

```bash
cd server && npx tsc --noEmit
```

```bash
git add server/src/libs/orm/mikro-orm.config.ts server/migrations/.gitkeep
git commit -m "feat(libs): add MikroORM config with migrator and SSL for Supabase"
```

---

## Task 12: libs/auth - AuthPort

**Files:**
- Create: `server/src/libs/auth/auth.port.ts`

- [ ] **Step 12.1: auth.port.ts 작성**

`server/src/libs/auth/auth.port.ts`:

```typescript
export interface AuthUser {
  id: string;
  email: string;
}

export const AUTH_PORT = Symbol('AUTH_PORT');

export interface IAuthPort {
  verifyToken(token: string): Promise<AuthUser>;
}
```

- [ ] **Step 12.2: 타입체크 + 커밋**

```bash
cd server && npx tsc --noEmit
```

```bash
git add server/src/libs/auth/auth.port.ts
git commit -m "feat(libs): add IAuthPort abstraction (Supabase-agnostic)"
```

---

## Task 13: features/auth - SupabaseAuthAdapter (TDD)

**Files:**
- Create: `server/src/features/auth/infrastructure/supabase-auth.adapter.ts`
- Test: `server/src/features/auth/infrastructure/__tests__/supabase-auth.adapter.spec.ts`

- [ ] **Step 13.1: 실패하는 테스트 작성**

`server/src/features/auth/infrastructure/__tests__/supabase-auth.adapter.spec.ts`:

```typescript
import { SupabaseAuthAdapter } from '../supabase-auth.adapter';
import { UnauthorizedException } from '../../../../libs/exceptions/unauthorized.exception';

describe('SupabaseAuthAdapter', () => {
  function makeAdapter(getUser: jest.Mock) {
    const supabase = { auth: { getUser } } as never;
    return new SupabaseAuthAdapter(supabase);
  }

  it('유효 토큰이면 AuthUser를 반환', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'u1', email: 'x@y.com' } },
      error: null,
    });
    const adapter = makeAdapter(getUser);

    const user = await adapter.verifyToken('valid-token');

    expect(user).toEqual({ id: 'u1', email: 'x@y.com' });
    expect(getUser).toHaveBeenCalledWith('valid-token');
  });

  it('Supabase가 error를 반환하면 UnauthorizedException', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });
    const adapter = makeAdapter(getUser);

    await expect(adapter.verifyToken('bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Supabase가 user를 반환하지 않으면 UnauthorizedException', async () => {
    const getUser = jest.fn().mockResolvedValue({ data: { user: null }, error: null });
    const adapter = makeAdapter(getUser);

    await expect(adapter.verifyToken('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('user에 email이 없으면 UnauthorizedException', async () => {
    const getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'u1', email: null } },
      error: null,
    });
    const adapter = makeAdapter(getUser);

    await expect(adapter.verifyToken('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
```

- [ ] **Step 13.2: 테스트 실패 확인**

```bash
cd server && npm test -- supabase-auth.adapter.spec
```

- [ ] **Step 13.3: SupabaseAuthAdapter 구현**

`server/src/features/auth/infrastructure/supabase-auth.adapter.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthUser, IAuthPort } from '../../../libs/auth/auth.port';
import { UnauthorizedException } from '../../../libs/exceptions/unauthorized.exception';

@Injectable()
export class SupabaseAuthAdapter implements IAuthPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async verifyToken(token: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid auth token');
    }
    const { id, email } = data.user;
    if (!email) {
      throw new UnauthorizedException('Auth user missing email');
    }
    return { id, email };
  }
}
```

- [ ] **Step 13.4: 테스트 통과 확인**

```bash
cd server && npm test -- supabase-auth.adapter.spec
```

기대: 4 passing.

- [ ] **Step 13.5: 커밋**

```bash
git add server/src/features/auth/infrastructure/supabase-auth.adapter.ts server/src/features/auth/infrastructure/__tests__/supabase-auth.adapter.spec.ts
git commit -m "feat(auth): add SupabaseAuthAdapter implementing IAuthPort"
```

---

## Task 14: features/auth - JwtAuthGuard (TDD)

**Files:**
- Create: `server/src/features/auth/infrastructure/jwt-auth.guard.ts`
- Test: `server/src/features/auth/infrastructure/__tests__/jwt-auth.guard.spec.ts`

- [ ] **Step 14.1: 실패하는 테스트 작성**

`server/src/features/auth/infrastructure/__tests__/jwt-auth.guard.spec.ts`:

```typescript
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { UnauthorizedException } from '../../../../libs/exceptions/unauthorized.exception';
import { IAuthPort } from '../../../../libs/auth/auth.port';

describe('JwtAuthGuard', () => {
  function makeContext(headers: Record<string, string>): { ctx: ExecutionContext; gqlContext: { req: { headers: Record<string, string>; user?: unknown } } } {
    const gqlContext = { req: { headers } as { headers: Record<string, string>; user?: unknown } };
    const ctx = {} as ExecutionContext;
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => gqlContext,
    } as unknown as GqlExecutionContext);
    return { ctx, gqlContext };
  }

  it('Authorization 헤더가 없으면 UnauthorizedException', async () => {
    const port: IAuthPort = { verifyToken: jest.fn() };
    const guard = new JwtAuthGuard(port);
    const { ctx } = makeContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Bearer 접두사가 없으면 UnauthorizedException', async () => {
    const port: IAuthPort = { verifyToken: jest.fn() };
    const guard = new JwtAuthGuard(port);
    const { ctx } = makeContext({ authorization: 'sometoken' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('유효 토큰이면 req.user를 채우고 true를 반환', async () => {
    const port: IAuthPort = {
      verifyToken: jest.fn().mockResolvedValue({ id: 'u1', email: 'x@y.com' }),
    };
    const guard = new JwtAuthGuard(port);
    const { ctx, gqlContext } = makeContext({ authorization: 'Bearer good-token' });

    const ok = await guard.canActivate(ctx);

    expect(ok).toBe(true);
    expect(gqlContext.req.user).toEqual({ id: 'u1', email: 'x@y.com' });
    expect(port.verifyToken).toHaveBeenCalledWith('good-token');
  });
});
```

- [ ] **Step 14.2: 테스트 실패 확인**

```bash
cd server && npm test -- jwt-auth.guard.spec
```

- [ ] **Step 14.3: 구현**

`server/src/features/auth/infrastructure/jwt-auth.guard.ts`:

```typescript
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AUTH_PORT, IAuthPort } from '../../../libs/auth/auth.port';
import { UnauthorizedException } from '../../../libs/exceptions/unauthorized.exception';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_PORT) private readonly authPort: IAuthPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context).getContext<{
      req: { headers: Record<string, string | undefined>; user?: unknown };
    }>();
    const header = gqlCtx.req.headers.authorization;
    if (!header) throw new UnauthorizedException('Missing Authorization header');

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must use Bearer scheme');
    }

    gqlCtx.req.user = await this.authPort.verifyToken(token);
    return true;
  }
}
```

- [ ] **Step 14.4: 테스트 통과 확인**

```bash
cd server && npm test -- jwt-auth.guard.spec
```

기대: 3 passing.

- [ ] **Step 14.5: 커밋**

```bash
git add server/src/features/auth/infrastructure/jwt-auth.guard.ts server/src/features/auth/infrastructure/__tests__/jwt-auth.guard.spec.ts
git commit -m "feat(auth): add JwtAuthGuard delegating to IAuthPort"
```

---

## Task 15: @CurrentUser 데코레이터 + AuthUser GraphQL 모델

**Files:**
- Create: `server/src/features/auth/graphql/decorators/current-user.decorator.ts`
- Create: `server/src/features/auth/graphql/schemas/models/auth-user.model.ts`

- [ ] **Step 15.1: current-user.decorator.ts**

`server/src/features/auth/graphql/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser } from '../../../../libs/auth/auth.port';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    return GqlExecutionContext.create(context).getContext<{ req: { user: AuthUser } }>().req.user;
  },
);
```

- [ ] **Step 15.2: auth-user.model.ts (GraphQL ObjectType)**

`server/src/features/auth/graphql/schemas/models/auth-user.model.ts`:

```typescript
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthUserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;
}
```

- [ ] **Step 15.3: 타입체크 + 커밋**

```bash
cd server && npx tsc --noEmit
```

```bash
git add server/src/features/auth/graphql/
git commit -m "feat(auth): add @CurrentUser decorator and AuthUserModel"
```

---

## Task 16: features/auth - getMe() 쿼리 리졸버 + 모듈

**Files:**
- Create: `server/src/features/auth/graphql/resolvers/auth.queries.ts`
- Create: `server/src/features/auth/auth.module.ts`

> `getMe()` 쿼리는 GraphQL 스키마가 비어있지 않게 하는 동시에 JwtAuthGuard + @CurrentUser 통합을 검증한다. 스펙의 `get` 접두사 컨벤션 준수.

- [ ] **Step 16.1: auth.queries.ts**

`server/src/features/auth/graphql/resolvers/auth.queries.ts`:

```typescript
import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from '../../../../libs/auth/auth.port';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../../infrastructure/jwt-auth.guard';
import { AuthUserModel } from '../schemas/models/auth-user.model';

@Resolver(() => AuthUserModel)
export class AuthQueriesResolver {
  @Query(() => AuthUserModel)
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthUser): AuthUserModel {
    return { id: user.id, email: user.email };
  }
}
```

- [ ] **Step 16.2: auth.module.ts**

`server/src/features/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { AUTH_PORT } from '../../libs/auth/auth.port';
import { SupabaseAuthAdapter } from './infrastructure/supabase-auth.adapter';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { AuthQueriesResolver } from './graphql/resolvers/auth.queries';

@Module({
  providers: [
    {
      provide: AUTH_PORT,
      useFactory: () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_ANON_KEY;
        if (!url || !key) {
          throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
        }
        const supabase = createClient(url, key);
        return new SupabaseAuthAdapter(supabase);
      },
    },
    JwtAuthGuard,
    AuthQueriesResolver,
  ],
  exports: [AUTH_PORT, JwtAuthGuard],
})
export class AuthModule {}
```

- [ ] **Step 16.3: 타입체크 + 커밋**

```bash
cd server && npx tsc --noEmit
```

```bash
git add server/src/features/auth/graphql/resolvers/ server/src/features/auth/auth.module.ts
git commit -m "feat(auth): add me() query resolver and AuthModule wiring"
```

---

## Task 17: app.module.ts 통합

**Files:**
- Modify: `server/src/app.module.ts`

- [ ] **Step 17.1: app.module.ts 교체**

`server/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';
import mikroOrmConfig from './libs/orm/mikro-orm.config';
import { GqlExceptionFilter } from './libs/exceptions/gql-exception.filter';
import { HealthModule } from './health/health.module';
import { AuthModule } from './features/auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      context: ({ req }) => ({ req }),
    }),
    ThrottlerModule.forRoot([{ ttl: 15 * 60 * 1000, limit: 1000 }]),
    CqrsModule.forRoot(),
    HealthModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GqlExceptionFilter },
  ],
})
export class AppModule {}
```

- [ ] **Step 17.2: 전체 타입체크**

```bash
cd server && npx tsc --noEmit
```

기대: 0 errors.

- [ ] **Step 17.3: 전체 단위 테스트**

```bash
cd server && npm test
```

기대: 모든 spec passing.

- [ ] **Step 17.4: 커밋**

```bash
git add server/src/app.module.ts
git commit -m "feat(app): wire MikroORM + GraphQL + CQRS + Auth in AppModule"
```

---

## Task 18: Smoke test 및 CLAUDE.md 갱신

**Files:**
- Modify: `server/CLAUDE.md`

- [ ] **Step 18.1: server/CLAUDE.md Stack 항목 갱신**

`server/CLAUDE.md`의 `## Stack` 항목을 다음으로 교체:

```markdown
## Stack

- NestJS 11 + MikroORM 6 (postgresql) + PostgreSQL (Supabase)
- DDD + Hexagonal Architecture + CQRS (`@nestjs/cqrs`)
- GraphQL (Apollo, code-first)
- 패키지 매니저: **npm**
- 테스트: Jest (ts-jest)
- 에러 트래킹: Sentry
```

`## Directory Map` 항목을 다음으로 교체:

```markdown
## Directory Map

```
src/
  main.ts              부트스트랩
  app.module.ts        루트 모듈
  sentry.ts            Sentry 초기화
  libs/                재사용 추상화 (DDD/ORM/Auth/Exceptions/Utils)
    ddd/ orm/ auth/ exceptions/ utils/
  features/            기능 모듈 (DDD + Hexagonal)
    {name}/domain/ application/ infrastructure/ graphql/
  health/              헬스체크
migrations/            MikroORM 마이그레이션
```
```

`## Local Rules` 항목 1, 3, 6을 다음으로 교체 (나머지 유지):

```markdown
1. ORM 엔티티는 `features/{name}/infrastructure/orm-entities/` — 도메인 엔티티는 `features/{name}/domain/`
3. DB 접근은 MikroORM `EntityRepository` 경유 — raw SQL·Supabase client 직접 사용 금지
6. Import는 path alias 사용 — 새 파일은 `~/libs`, `~/features` 사용
```

- [ ] **Step 18.2: 사용자에게 dev 서버 부팅 요청**

> 이 단계는 Claude가 직접 실행하지 않는다. 사용자에게 다음을 요청:
>
> 1. `.env.local`에 `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` 설정
> 2. `cd server && npm run dev`
> 3. 브라우저/Apollo Sandbox에서 `http://localhost:4000/graphql` 접속
> 4. 다음 쿼리 실행 (Authorization 헤더에 Supabase JWT 첨부):
>    ```graphql
>    query { getMe { id email } }
>    ```
> 5. 헤더 없이 같은 쿼리 → `UNAUTHORIZED` 코드의 GraphQLError 반환 확인
> 6. 헬스 엔드포인트 `http://localhost:4000/health` 200 응답 확인

- [ ] **Step 18.3: 사용자 검증 확인 후 커밋**

```bash
git add server/CLAUDE.md
git commit -m "docs(server): update CLAUDE.md for DDD + Hexagonal stack"
```

- [ ] **Step 18.4: PR 준비 (사용자 승인 후)**

사용자가 명시적으로 승인하면:

```bash
git push -u origin refactor/ddd-hexagonal
```

PR 생성은 사용자가 직접하거나, 별도 요청 시 `gh pr create`.

---

## 완료 기준

이 플랜이 끝나면:
- ✅ `refactor/ddd-hexagonal` 브랜치 위에 모든 변경사항 존재
- ✅ TypeORM 완전 제거, MikroORM 도입
- ✅ `libs/` 전체 (ddd/orm/auth/exceptions/utils) 구축, 단위 테스트 통과
- ✅ `features/auth/` 모듈 구축, `me()` GraphQL 쿼리로 인증 흐름 end-to-end 검증
- ✅ `app.module.ts`가 새 구조로 부팅, GraphQL Sandbox 동작
- ✅ 모든 Jest 테스트 통과, `npx tsc --noEmit` 0 errors
- ✅ DB 스키마 변경 없음 (auth는 DB 미사용 — 후속 플랜에서 마이그레이션)

다음 플랜: **Plan 2 — workspace 모듈** (CreateWorkspace 패턴 정립, 첫 번째 도메인 + ORM 엔티티 + 마이그레이션)
