# Resolver Patterns (GraphQL + NestJS)

## 핵심 원칙

Resolver는 **얇아야** 한다. 역할은 세 가지:
1. Guard로 인증·권한 검사
2. Service에 위임
3. Entity → DTO 변환 (Date → string 등)

비즈니스 로직은 Service, 계산 로직은 utils. Resolver에 if/else가 많아지면 Service로 옮길 신호.

## Skeleton

```typescript
import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { SessionEntity } from '../../entities/session.entity';
import { Session } from './dto/session.object';
import { SessionService } from './session.service';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';

@Resolver(() => Session)
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => Session, { nullable: true, description: '...' })
  @UseGuards(WorkspaceGuard)
  async activeSession(
    @Args('memberId', { type: () => ID }) memberId: string,
  ): Promise<SessionEntity | null> {
    return this.sessionService.getActiveSession(memberId);
  }
}
```

## Guard 규칙

**모든 Query/Mutation에 `@UseGuards(WorkspaceGuard)`를 붙인다.**

- `WorkspaceGuard`는 내부적으로 `AuthGuard`를 상속 → JWT 검증 + workspace membership 검증을 한 번에 수행
- 예외: `login`, `signup`, `health` 같은 public endpoint는 `@Public()` 데코레이터 (프로젝트에 이미 있다면) 또는 Guard 없이

### Workspace 컨텍스트 주입

```typescript
@Mutation(() => Session)
@UseGuards(WorkspaceGuard)
async checkIn(
  @Args('memberId', { type: () => ID }) memberId: string,
  @CurrentWorkspace() workspaceId: string, // ← 요청 헤더의 x-workspace-id
): Promise<SessionEntity> {
  return this.sessionService.checkIn(memberId, workspaceId);
}
```

- `@CurrentWorkspace()` — WorkspaceGuard가 검증한 workspace ID를 주입
- `@CurrentUser()` — 인증된 Supabase user 정보 주입
- Guard 통과 후에만 사용 가능. Guard 없이 쓰면 undefined.

## Args 패턴

### 단일 primitive → `@Args` 직접

```typescript
@Args('memberId', { type: () => ID }) memberId: string
@Args('year', { type: () => Int }) year: number
@Args('date') date: string  // String은 기본 추론 가능
```

### 복합 입력 → InputType

```typescript
@Mutation(() => Session)
async updateSession(@Args('input') input: UpdateSessionInput) { ... }
```

2개 이상 관련 필드가 묶일 때만. 단순한 2~3개 인자는 `@Args` 여러 개로도 충분.

### Nullable Args

```typescript
@Args('memberId', { type: () => ID, nullable: true }) memberId: string | null
```

## ResolveField — 파생 & 변환

### Date → string 변환

Entity의 `Date` 필드를 DTO의 `string` 필드로 노출할 때:

```typescript
@ResolveField(() => String, { description: '체크인 시각 (ISO 8601)' })
checkInTime(@Parent() session: SessionEntity): string {
  return session.checkInTime.toISOString();
}

@ResolveField(() => String, { nullable: true })
checkOutTime(@Parent() session: SessionEntity): string | null {
  return session.checkOutTime?.toISOString() ?? null;
}
```

### 계산 필드

```typescript
@ResolveField(() => Int, { nullable: true, description: '학습 시간(분)' })
durationMinutes(@Parent() session: SessionEntity): number | null {
  if (!session.checkOutTime) return null;
  return calculateDurationMinutes(session.checkInTime, session.checkOutTime);
}
```

### Nested 관계

```typescript
@ResolveField(() => Member)
async member(@Parent() session: SessionEntity): Promise<MemberEntity> {
  return this.memberService.findById(session.memberId);
}
```

⚠️ **N+1 주의**: 여러 Session에 대해 member를 resolve하면 쿼리가 N번 실행됨. 아직 DataLoader 미도입. 현재 수준에서는 허용하되, 리스트 endpoint에 ResolveField 나열 시 주의. 필요 시 DataLoader 도입 논의.

## Resolver 리턴 타입

- 파라미터 타입은 DTO (`Session`)이지만 실제 반환은 Entity (`SessionEntity`)여도 된다 — shape이 호환되면 ResolveField가 변환
- 명시적 타입 선언 권장:
  ```typescript
  async checkIn(...): Promise<SessionEntity>
  ```
- **절대로 entity 안의 민감 필드(예: 토큰, 해시)를 그대로 반환하지 말 것** — DTO에 정의 안 된 필드는 자동으로 숨겨지지만, 안심하지 말고 명시적으로 통제

## 에러 처리

Resolver에서는 try/catch 하지 말 것. Service가 던진 도메인 에러가 GraphQL 응답으로 그대로 변환된다:

```json
{
  "errors": [{
    "message": "이미 체크인 상태입니다.",
    "extensions": { "code": "ALREADY_CHECKED_IN" }
  }]
}
```

## 체크리스트

- [ ] `@Resolver(() => DtoClass)` 선언
- [ ] 모든 Query/Mutation에 `@UseGuards(WorkspaceGuard)`
- [ ] Workspace 컨텍스트가 필요하면 `@CurrentWorkspace()` 파라미터
- [ ] 모든 `@Query`/`@Mutation` 에 `description`
- [ ] Date 필드는 `@ResolveField`로 string 변환
- [ ] 파생 필드(계산)는 `@ResolveField`
- [ ] Resolver 본문은 Service 호출 + 얕은 래핑만 (비즈니스 로직 없음)
- [ ] try/catch 없음 (에러는 자동 전파)
- [ ] Nested ResolveField는 N+1 가능성 검토
