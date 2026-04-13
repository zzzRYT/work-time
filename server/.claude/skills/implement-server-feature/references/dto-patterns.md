# DTO Patterns (GraphQL Code-First)

## 핵심 원칙

**Entity와 DTO는 별도 타입이다.** Entity는 TypeORM 영속 모델, DTO는 GraphQL wire format. 직렬화에 약한 타입(`Date`)은 Entity에만 두고 DTO는 문자열로 노출한다.

## ObjectType — 응답 타입

위치: `src/modules/{feature}/dto/{name}.object.ts`

```typescript
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType({ description: '출석 세션 (체크인~체크아웃)' })
export class Session {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  memberId!: string;

  @Field({ description: '날짜 (YYYY-MM-DD)' })
  date!: string;

  @Field({ description: '체크인 시각 (ISO 8601)' })
  checkInTime!: string;

  @Field(() => String, {
    nullable: true,
    description: '체크아웃 시각 (ISO 8601, 학습 중이면 null)',
  })
  checkOutTime!: string | null;

  @Field({ description: '지각 여부' })
  isLate!: boolean;

  @Field(() => Int, {
    nullable: true,
    description: '학습 시간(분), 체크아웃 전이면 현재까지 경과 시간',
  })
  durationMinutes!: number | null;
}
```

### 규칙

1. **`@Field(() => Type)` 첫 인자는 arrow function** — GraphQL 타입을 런타임에 알려주기 위함
   - `String`, `Int`, `ID`, `Boolean` 등 모두 명시 권장
   - 단순 `string`/`number`/`boolean` 추론은 `@Field()` (빈 인자)도 동작하지만, nullable일 때는 반드시 명시
2. **Nullable 필드**
   - `@Field(() => String, { nullable: true })` + `field!: string | null`
   - TypeScript에서 `?:` 대신 `!: Type | null` 사용 (명시적 null)
3. **`description`은 필수** — GraphQL 스키마 문서 = 클라이언트 개발자의 첫 접점
4. **Date 처리** — Entity의 `Date`는 DTO에서 `string` (ISO 8601). Resolver의 `@ResolveField`로 변환
5. **파생 필드** — Entity에 없지만 계산되는 필드(`durationMinutes` 등)는 DTO에만 정의하고 `@ResolveField`로 계산
6. **Nested Object** — `@Field(() => OtherType)` — OtherType도 `@ObjectType` 이어야 함
7. **배열** — `@Field(() => [Type])` (대괄호 주의)

## InputType — 입력 타입

위치: `src/modules/{feature}/dto/{name}.input.ts`

```typescript
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType({ description: '체크인 입력' })
export class CheckInInput {
  @Field(() => ID)
  memberId!: string;

  @Field(() => Int, { nullable: true, description: '수동 지각 여부 override' })
  forceLate?: boolean;
}
```

### 규칙

- 단일 primitive 인자는 `@Args('name', { type: () => ID })`로 충분 — InputType 만들지 말 것
- 2개 이상 필드를 묶어야 할 때만 InputType 사용
- 검증(`class-validator`)은 아직 도입 안 됨 — 필요해지면 일괄 추가 (지금은 서비스에서 검증)

## Enum

```typescript
import { registerEnumType } from '@nestjs/graphql';

export enum RankingPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

registerEnumType(RankingPeriod, {
  name: 'RankingPeriod',
  description: '랭킹 기간 단위',
});
```

- **값은 string이어야 GraphQL로 노출됨** — 숫자 enum은 노출 실패
- `registerEnumType`은 enum 정의와 같은 파일에서 호출
- DB에도 enum 쓰면 `src/common/enums/`에 두고 entity와 DTO가 공유

## Entity → DTO 매핑 선택지

NestJS + TypeORM 환경에서 세 가지 패턴 중 하나:

### A. **Shape 호환 + ResolveField 보정** (현재 프로젝트 기본)

Entity와 DTO가 필드명이 같으면 resolver가 Entity 그대로 반환하고, 변환이 필요한 필드만 `@ResolveField`로 덮어쓴다.

```typescript
@Query(() => Session)
async activeSession(...): Promise<SessionEntity | null> { ... }

@ResolveField(() => String)
checkInTime(@Parent() s: SessionEntity): string {
  return s.checkInTime.toISOString();
}
```

**장점**: 매퍼 없이 가볍다.
**단점**: Entity 필드가 의도치 않게 노출될 수 있음.

### B. 명시적 매퍼 함수

```typescript
function toSessionDto(e: SessionEntity): Session {
  return {
    id: e.id,
    checkInTime: e.checkInTime.toISOString(),
    ...
  };
}
```

복잡한 변환이나 일부 필드 숨김이 필요할 때만 도입.

### C. 상속/implements

지금은 사용 안 함. 필요해지면 한꺼번에 전환.

**현재 프로젝트 컨벤션: A**. 새 기능도 A를 따른다.

## 체크리스트

- [ ] `@Field(() => Type)` 첫 인자 arrow function
- [ ] Nullable은 `{ nullable: true }` + `!: Type | null`
- [ ] 모든 Field에 `description`
- [ ] Date 필드는 string으로 노출하고 `@ResolveField`로 변환
- [ ] 단일 primitive 인자는 InputType 만들지 말 것
- [ ] Enum은 string enum, `registerEnumType` 호출
