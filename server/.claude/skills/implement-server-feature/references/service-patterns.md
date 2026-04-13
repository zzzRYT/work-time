# Service Patterns (NestJS + TypeORM)

## 핵심 원칙

Service는 **비즈니스 로직의 중심**이다. Resolver는 얇고, Repository는 데이터 접근만 한다. 도메인 규칙·예외·workspace 스코프 필터는 모두 Service에서.

## Skeleton

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SessionEntity } from '../../entities/session.entity';
import { SettingsService } from '../settings/settings.service';
import { AlreadyCheckedInError, NotCheckedInError } from './errors/session.error';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    private readonly settingsService: SettingsService,
  ) {}

  async checkIn(memberId: string, workspaceId: string) {
    // 1. 비즈니스 전제조건 검증 (→ 도메인 에러 throw)
    // 2. Repository로 데이터 접근
    // 3. 순수 계산은 utils 호출
    // 4. 저장 후 반환
  }
}
```

## Repository 주입 규칙

- `@InjectRepository(Entity)` **만** 사용 — raw SQL, `getRawOne()`, Supabase client 직접 호출 금지 (Local Rule #3)
- 필요한 Entity 각각에 대해 주입 (한 service가 여러 Repository 보유 OK)
- TypeORM 오퍼레이터: `IsNull()`, `Between(start, end)`, `In([...])`, `Not(...)` 사용

```typescript
// 좋음
await this.sessionRepo.findOne({
  where: { memberId, date: today, checkOutTime: IsNull() },
});

// 금지
await this.sessionRepo.query('SELECT * FROM sessions WHERE ...');
```

## Workspace 스코프 필터 (중요)

**모든** workspace-scope 데이터 조회는 `workspaceId` 필터 필수. 누락 시 **데이터 유출**.

```typescript
// 좋음
async getTodayAttendanceSummary(workspaceId: string) {
  const total = await this.memberRepo.count({ where: { workspaceId } });
  const sessions = await this.sessionRepo.find({
    where: { date: today, workspaceId },
  });
  ...
}

// 치명적 버그
async getTodayAttendanceSummary() {
  const sessions = await this.sessionRepo.find({ where: { date: today } });
  // 다른 workspace 데이터까지 합산됨!
}
```

간접 조회(`memberId`로 세션 조회 등)도 member가 해당 workspace에 속하는지 검증 필요.

## 다른 도메인 접근

다른 도메인 데이터가 필요하면 **해당 도메인의 Service**를 주입한다. Repository 직접 주입 금지.

```typescript
// 좋음
constructor(
  @InjectRepository(SessionEntity) private readonly sessionRepo: Repository<SessionEntity>,
  private readonly settingsService: SettingsService, // ← 다른 도메인
) {}

const settings = await this.settingsService.getSettings(workspaceId);
```

**이유**: Service 경유 시 그 도메인의 비즈니스 규칙(기본값 생성, 검증 등)이 함께 적용된다. Repository 직접 사용하면 규칙이 우회된다.

그리고 import 하려는 도메인 모듈이 **자기 Service를 `exports`**해야 한다:

```typescript
// settings.module.ts
@Module({
  providers: [SettingsService],
  exports: [SettingsService], // ← 다른 모듈이 주입하려면 필수
})
export class SettingsModule {}
```

사용자 모듈은 imports에 추가:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity, ...]),
    SettingsModule, // ← 추가
  ],
  providers: [SessionService, SessionResolver],
})
```

## 에러 throw 전략

```typescript
import {
  FullDayVacationError,
  AlreadyCheckedInError,
} from './errors/session.error';

async checkIn(memberId: string, workspaceId: string) {
  const vacation = await this.vacationRepo.findOne({ where: { memberId, date: today } });
  if (vacation && vacation.hours >= FULL_DAY_VACATION_HOURS) {
    throw new FullDayVacationError(); // ← 도메인 에러
  }

  const active = await this.sessionRepo.findOne({
    where: { memberId, date: today, checkOutTime: IsNull() },
  });
  if (active) {
    throw new AlreadyCheckedInError();
  }
  ...
}
```

- **도메인 에러** (비즈니스 규칙 위반): `GraphQLError` 상속 커스텀 에러 (`errors/*.error.ts`)
- **권한 에러** (인증/권한): NestJS `ForbiddenException`, `UnauthorizedException`
- **서버 에러** (예상 밖): throw 그대로 — GraphQL이 500으로 처리. Sentry가 자동 수집.

## 환경변수 접근

- **`process.env.XXX` 직접 참조 금지** (Local Rule #4)
- 반드시 `ConfigService` 경유

```typescript
import { ConfigService } from '@nestjs/config';

constructor(private readonly configService: ConfigService) {}

const dbUrl = this.configService.get<string>('DATABASE_URL');
```

**예외**: `src/app.module.ts` 자체는 부트스트랩 단계라 ConfigModule 초기화 전에 `process.env`를 읽는다. 이것만 예외. 새 코드에서는 절대 따라하지 말 것.

## 순수 계산은 Utils로

Service 메서드가 길어지면 (20줄 이상) 순수 함수는 `modules/{feature}/utils/`로 분리하고 `.spec.ts`로 테스트한다.

```typescript
// session/utils/attendance.util.ts
export function isLateCheckIn(
  now: Date,
  existingSessions: SessionEntity[],
  startHour: number,
  startMinute: number,
): boolean {
  // 순수 로직
}

// session.service.ts
const isLate = isLateCheckIn(now, existingSessions, settings.studyStartHour, settings.studyStartMinute);
```

**장점**: 테스트 용이, Service 가독성, 재사용.

도메인 경계를 넘는 유틸(예: 날짜·시간 변환)은 `src/common/utils/`에 둔다.

## Strict Equality

`==`, `!=` 금지. 항상 `===`, `!==` 사용 (Local Rule #5).

`null` 체크는 `=== null` 또는 `?? default`.

## 체크리스트

- [ ] `@InjectRepository`로만 데이터 접근
- [ ] 모든 workspace-scope 쿼리에 `workspaceId` 필터
- [ ] 다른 도메인 접근은 해당 Service 경유 (Repository 직접 주입 금지)
- [ ] 사용하는 다른 모듈은 `imports` + 그 모듈이 `exports` 했는지 확인
- [ ] 비즈니스 규칙 위반은 도메인 에러 throw
- [ ] `process.env` 직접 참조 없음 (app.module.ts 제외)
- [ ] 순수 계산은 utils로 분리 + `.spec.ts`
- [ ] `===`, `!==` 만 사용
