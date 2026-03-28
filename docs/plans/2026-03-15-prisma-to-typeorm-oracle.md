# Prisma → TypeORM + Oracle DB Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prisma ORM + PostgreSQL을 TypeORM + Oracle Autonomous DB로 전환하여 Oracle Cloud Always Free 환경에서 운영

**Architecture:** NestJS의 `@nestjs/typeorm` 모듈을 사용하여 TypeORM Repository 패턴으로 전환. Oracle DB는 TLS 연결(Wallet 없음)로 `oracledb` thin 모드 사용. 기존 GraphQL API 동작은 100% 유지.

**Tech Stack:** NestJS, TypeORM, oracledb (thin mode), Oracle Autonomous DB 19c

---

### Task 1: 의존성 교체 (Prisma → TypeORM + oracledb)

**Files:**
- Modify: `server/package.json`

**Step 1: package.json 수정**

제거할 의존성:
- `@prisma/client` (dependencies)
- `prisma` (devDependencies)
- `prisma.seed` 설정 블록

추가할 의존성:
- `@nestjs/typeorm` (dependencies)
- `typeorm` (dependencies)
- `oracledb` (dependencies)

```json
{
  "dependencies": {
    "@nestjs/typeorm": "^11.0.0",
    "typeorm": "^0.3.21",
    "oracledb": "^6.8.0"
  }
}
```

scripts 변경:
- `"start:prod": "node dist/main.js"` (prisma migrate deploy 제거)
- `"db:migrate"`, `"db:seed"`, `"db:studio"`, `"db:reset"` 제거
- `"typeorm": "typeorm-ts-node-commonjs"` 추가

**Step 2: npm install 실행**

Run: `cd server && npm install`
Expected: 정상 설치 완료

**Step 3: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: replace prisma with typeorm and oracledb dependencies"
```

---

### Task 2: TypeORM Entity 생성

**Files:**
- Create: `server/src/entities/member.entity.ts`
- Create: `server/src/entities/session.entity.ts`
- Create: `server/src/entities/daily-vacation.entity.ts`
- Create: `server/src/entities/monthly-fee.entity.ts`
- Create: `server/src/entities/settings.entity.ts`
- Create: `server/src/entities/index.ts`

**Step 1: Member entity 생성**

```typescript
// server/src/entities/member.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { DailyVacationEntity } from './daily-vacation.entity';
import { MonthlyFeeEntity } from './monthly-fee.entity';

@Entity('members')
export class MemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar2', length: 100 })
  name!: string;

  @Column({ type: 'varchar2', length: 100, name: 'display_name' })
  displayName!: string;

  @Column({ type: 'varchar2', length: 20 })
  color!: string;

  @Column({ type: 'varchar2', length: 20, default: 'MEMBER' })
  role!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => SessionEntity, (session) => session.member)
  sessions!: SessionEntity[];

  @OneToMany(() => DailyVacationEntity, (vacation) => vacation.member)
  dailyVacations!: DailyVacationEntity[];

  @OneToMany(() => MonthlyFeeEntity, (fee) => fee.member)
  monthlyFees!: MonthlyFeeEntity[];
}
```

**Step 2: Session entity 생성**

```typescript
// server/src/entities/session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MemberEntity } from './member.entity';

@Entity('sessions')
@Index(['memberId', 'date'])
@Index(['date'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar2', length: 36, name: 'member_id' })
  memberId!: string;

  @Column({ type: 'varchar2', length: 10 })
  date!: string;

  @Column({ type: 'timestamp with time zone', name: 'check_in_time' })
  checkInTime!: Date;

  @Column({ type: 'timestamp with time zone', name: 'check_out_time', nullable: true })
  checkOutTime!: Date | null;

  @Column({ type: 'number', name: 'is_late', default: 0, transformer: {
    to: (value: boolean) => (value ? 1 : 0),
    from: (value: number) => value === 1,
  }})
  isLate!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => MemberEntity, (member) => member.sessions)
  @JoinColumn({ name: 'member_id' })
  member!: MemberEntity;
}
```

**Step 3: DailyVacation entity 생성**

```typescript
// server/src/entities/daily-vacation.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { MemberEntity } from './member.entity';

@Entity('daily_vacations')
@Unique(['memberId', 'date'])
export class DailyVacationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar2', length: 36, name: 'member_id' })
  memberId!: string;

  @Column({ type: 'varchar2', length: 10 })
  date!: string;

  @Column({ type: 'number' })
  hours!: number;

  @ManyToOne(() => MemberEntity, (member) => member.dailyVacations)
  @JoinColumn({ name: 'member_id' })
  member!: MemberEntity;
}
```

**Step 4: MonthlyFee entity 생성**

```typescript
// server/src/entities/monthly-fee.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { MemberEntity } from './member.entity';

@Entity('monthly_fees')
@Unique(['memberId', 'month'])
export class MonthlyFeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar2', length: 36, name: 'member_id' })
  memberId!: string;

  @Column({ type: 'varchar2', length: 7 })
  month!: string;

  @Column({ type: 'varchar2', length: 20, name: 'monthly_fee_status', default: 'UNPAID' })
  monthlyFeeStatus!: string;

  @Column({ type: 'varchar2', length: 20, name: 'late_fee_status', default: 'UNPAID' })
  lateFeeStatus!: string;

  @ManyToOne(() => MemberEntity, (member) => member.monthlyFees)
  @JoinColumn({ name: 'member_id' })
  member!: MemberEntity;
}
```

**Step 5: Settings entity 생성**

```typescript
// server/src/entities/settings.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('settings')
export class SettingsEntity {
  @PrimaryColumn({ type: 'varchar2', length: 20, default: 'default' })
  id!: string;

  @Column({ type: 'number', name: 'study_start_hour', default: 10 })
  studyStartHour!: number;

  @Column({ type: 'number', name: 'study_start_minute', default: 0 })
  studyStartMinute!: number;

  @Column({ type: 'number', name: 'late_fee_amount', default: 1000 })
  lateFeeAmount!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

**Step 6: index.ts로 barrel export**

```typescript
// server/src/entities/index.ts
export { MemberEntity } from './member.entity';
export { SessionEntity } from './session.entity';
export { DailyVacationEntity } from './daily-vacation.entity';
export { MonthlyFeeEntity } from './monthly-fee.entity';
export { SettingsEntity } from './settings.entity';
```

**Step 7: Commit**

```bash
git add server/src/entities/
git commit -m "feat: add TypeORM entities for Oracle DB"
```

---

### Task 3: TypeORM 모듈 설정 + PrismaModule 교체

**Files:**
- Modify: `server/src/app.module.ts`
- Modify: `server/.env` (template)
- Delete: `server/src/prisma/prisma.module.ts`
- Delete: `server/src/prisma/prisma.service.ts`
- Delete: `server/prisma/schema.prisma`

**Step 1: .env 파일 업데이트**

기존 `DATABASE_URL` 제거, Oracle 연결 정보 추가:

```env
ORACLE_USER=ADMIN
ORACLE_PASSWORD=<비밀번호>
ORACLE_CONNECTION_STRING=(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-chuncheon-1.oraclecloud.com))(connect_data=(service_name=g4a5310fc7d4625_worktimedb_tp.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))
TZ="Asia/Seoul"
PORT=4000
CORS_ORIGINS="http://localhost:8081"
```

**Step 2: app.module.ts에서 PrismaModule → TypeOrmModule로 교체**

```typescript
// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { MemberModule } from './modules/member/member.module';
import { SessionModule } from './modules/session/session.module';
import { VacationModule } from './modules/vacation/vacation.module';
import { FeeModule } from './modules/fee/fee.module';
import { SettingsModule } from './modules/settings/settings.module';
import {
  MemberEntity,
  SessionEntity,
  DailyVacationEntity,
  MonthlyFeeEntity,
  SettingsEntity,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'oracle',
      username: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING,
      entities: [
        MemberEntity,
        SessionEntity,
        DailyVacationEntity,
        MonthlyFeeEntity,
        SettingsEntity,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1000,
        limit: 1000,
      },
    ]),
    HealthModule,
    MemberModule,
    SessionModule,
    VacationModule,
    FeeModule,
    SettingsModule,
  ],
})
export class AppModule {}
```

**Step 3: Prisma 관련 파일 삭제**

```bash
rm server/src/prisma/prisma.module.ts
rm server/src/prisma/prisma.service.ts
rmdir server/src/prisma
rm server/prisma/schema.prisma
rmdir server/prisma
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: replace PrismaModule with TypeOrmModule for Oracle DB"
```

---

### Task 4: MemberModule 서비스 전환

**Files:**
- Modify: `server/src/modules/member/member.module.ts`
- Modify: `server/src/modules/member/member.service.ts`

**Step 1: member.module.ts에 TypeOrmModule.forFeature 추가**

```typescript
// server/src/modules/member/member.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { MemberService } from './member.service';
import { MemberResolver } from './member.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, SessionEntity, DailyVacationEntity]),
  ],
  providers: [MemberService, MemberResolver],
  exports: [MemberService],
})
export class MemberModule {}
```

**Step 2: member.service.ts를 TypeORM Repository 패턴으로 전환**

```typescript
// server/src/modules/member/member.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { deriveStatus } from '../session/utils/attendance.util';
import { getKSTToday } from '../../common/utils/date.util';
import { calculateDurationMinutes } from '../../common/utils/duration.util';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(DailyVacationEntity)
    private readonly vacationRepo: Repository<DailyVacationEntity>,
  ) {}

  async findAll() {
    return this.memberRepo.find({ order: { createdAt: 'ASC' } });
  }

  async getCurrentStatus(memberId: string) {
    const today = getKSTToday();
    const [sessions, vacation] = await Promise.all([
      this.sessionRepo.find({
        where: { memberId, date: today },
        order: { checkInTime: 'ASC' },
      }),
      this.vacationRepo.findOne({
        where: { memberId, date: today },
      }),
    ]);
    return deriveStatus(sessions, vacation);
  }

  async getTodayStudyMinutes(memberId: string): Promise<number> {
    const today = getKSTToday();
    const sessions = await this.sessionRepo.find({
      where: { memberId, date: today },
    });

    return sessions.reduce((sum, s) => {
      return sum + calculateDurationMinutes(s.checkInTime, s.checkOutTime);
    }, 0);
  }

  async getTodayVacationHours(memberId: string): Promise<number | null> {
    const today = getKSTToday();
    const vacation = await this.vacationRepo.findOne({
      where: { memberId, date: today },
    });
    return vacation?.hours ?? null;
  }
}
```

**Step 3: Commit**

```bash
git add server/src/modules/member/
git commit -m "refactor: convert MemberModule from Prisma to TypeORM"
```

---

### Task 5: SessionModule 서비스 전환

**Files:**
- Modify: `server/src/modules/session/session.module.ts`
- Modify: `server/src/modules/session/session.service.ts`

**Step 1: session.module.ts에 TypeOrmModule.forFeature 추가**

```typescript
// server/src/modules/session/session.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { SessionService } from './session.service';
import { SessionResolver } from './session.resolver';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, SessionEntity, DailyVacationEntity]),
    SettingsModule,
  ],
  providers: [SessionService, SessionResolver],
})
export class SessionModule {}
```

**Step 2: session.service.ts를 TypeORM Repository 패턴으로 전환**

핵심 변환 패턴:
- `prisma.session.findFirst(where)` → `sessionRepo.findOne({ where })`
- `prisma.session.findMany(where, orderBy)` → `sessionRepo.find({ where, order })`
- `prisma.member.count()` → `memberRepo.count()`
- `prisma.session.create({ data })` → `sessionRepo.save(sessionRepo.create(data))`
- `prisma.session.update({ where: { id }, data })` → `sessionRepo.update(id, data)` + `findOne`
- `date: { gte: start, lte: end }` → `Between(start, end)`

```typescript
// server/src/modules/session/session.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SessionEntity } from '../../entities/session.entity';
import { MemberEntity } from '../../entities/member.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { SettingsService } from '../settings/settings.service';
import { getKSTToday, getMonthDateRange } from '../../common/utils/date.util';
import { calculateDurationMinutes } from '../../common/utils/duration.util';
import { isLateCheckIn } from './utils/attendance.util';
import { buildCalendar } from './utils/calendar.util';
import { FULL_DAY_VACATION_HOURS } from '../../common/constants';
import {
  FullDayVacationError,
  AlreadyCheckedInError,
  NotCheckedInError,
} from './errors/session.error';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(DailyVacationEntity)
    private readonly vacationRepo: Repository<DailyVacationEntity>,
    private readonly settingsService: SettingsService,
  ) {}

  async getActiveSession(memberId: string) {
    const today = getKSTToday();
    return this.sessionRepo.findOne({
      where: { memberId, date: today, checkOutTime: undefined },
    });
  }

  async getTodayAttendanceSummary() {
    const today = getKSTToday();
    const total = await this.memberRepo.count();

    const todaySessions = await this.sessionRepo.find({
      where: { date: today },
    });

    const memberSessions = new Map<string, SessionEntity[]>();
    for (const s of todaySessions) {
      const arr = memberSessions.get(s.memberId) ?? [];
      arr.push(s);
      memberSessions.set(s.memberId, arr);
    }

    let attended = 0;
    let studying = 0;
    let late = 0;

    for (const [, sessions] of memberSessions) {
      attended++;
      if (sessions.some((s) => s.checkOutTime === null)) {
        studying++;
      }
      const first = sessions.sort(
        (a, b) => a.checkInTime.getTime() - b.checkInTime.getTime(),
      )[0];
      if (first.isLate) late++;
    }

    return { total, attended, studying, late };
  }

  async getDayDetail(memberId: string, date: string) {
    const sessions = await this.sessionRepo.find({
      where: { memberId, date },
      order: { checkInTime: 'ASC' },
    });

    const vacation = await this.vacationRepo.findOne({
      where: { memberId, date },
    });

    const totalDurationMinutes = sessions.reduce(
      (sum, s) =>
        sum + calculateDurationMinutes(s.checkInTime, s.checkOutTime),
      0,
    );

    return {
      sessions,
      totalDurationMinutes,
      vacationHours: vacation?.hours ?? null,
    };
  }

  async getCalendar(memberId: string, year: number, month: number) {
    const { start, end } = getMonthDateRange(year, month);

    const [sessions, vacations] = await Promise.all([
      this.sessionRepo.find({
        where: { memberId, date: Between(start, end) },
        order: { checkInTime: 'ASC' },
      }),
      this.vacationRepo.find({
        where: { memberId, date: Between(start, end) },
      }),
    ]);

    return buildCalendar(year, month, sessions, vacations);
  }

  async getMonthlySummary(memberId: string, year: number, month: number) {
    const { start, end } = getMonthDateRange(year, month);

    const [sessions, vacations] = await Promise.all([
      this.sessionRepo.find({
        where: { memberId, date: Between(start, end) },
        order: { checkInTime: 'ASC' },
      }),
      this.vacationRepo.find({
        where: { memberId, date: Between(start, end) },
      }),
    ]);

    const uniqueDates = new Set(sessions.map((s) => s.date));
    const attendanceDays = uniqueDates.size;

    const totalStudyMinutes = sessions.reduce(
      (sum, s) =>
        sum +
        (s.checkOutTime
          ? calculateDurationMinutes(s.checkInTime, s.checkOutTime)
          : 0),
      0,
    );

    const averageDailyMinutes =
      attendanceDays > 0
        ? Math.floor(totalStudyMinutes / attendanceDays)
        : 0;

    const dateFirstSession = new Map<string, SessionEntity>();
    for (const s of sessions) {
      if (!dateFirstSession.has(s.date)) {
        dateFirstSession.set(s.date, s);
      }
    }
    const lateCount = [...dateFirstSession.values()].filter(
      (s) => s.isLate,
    ).length;

    const vacationDays = vacations.length;
    const settings = await this.settingsService.getSettings();
    const totalLateFee = lateCount * settings.lateFeeAmount;

    return {
      attendanceDays,
      totalStudyMinutes,
      averageDailyMinutes,
      lateCount,
      vacationDays,
      totalLateFee,
    };
  }

  async checkIn(memberId: string) {
    const today = getKSTToday();

    const vacation = await this.vacationRepo.findOne({
      where: { memberId, date: today },
    });
    if (vacation && vacation.hours >= FULL_DAY_VACATION_HOURS) {
      throw new FullDayVacationError();
    }

    const activeSession = await this.sessionRepo.findOne({
      where: { memberId, date: today, checkOutTime: undefined },
    });
    if (activeSession) {
      throw new AlreadyCheckedInError();
    }

    const existingSessions = await this.sessionRepo.find({
      where: { memberId, date: today },
    });

    const now = new Date();
    const settings = await this.settingsService.getSettings();
    const isLate = isLateCheckIn(
      now,
      existingSessions,
      settings.studyStartHour,
      settings.studyStartMinute,
    );

    const session = this.sessionRepo.create({
      memberId,
      date: today,
      checkInTime: now,
      isLate,
    });
    return this.sessionRepo.save(session);
  }

  async checkOut(memberId: string) {
    const today = getKSTToday();

    const activeSession = await this.sessionRepo.findOne({
      where: { memberId, date: today, checkOutTime: undefined },
    });

    if (!activeSession) {
      throw new NotCheckedInError();
    }

    activeSession.checkOutTime = new Date();
    return this.sessionRepo.save(activeSession);
  }
}
```

> **Note:** Oracle DB에서 `NULL` 조건 쿼리: TypeORM의 `findOne({ where: { checkOutTime: undefined } })`는 `IS NULL` 쿼리를 생성. Oracle에서 정상 동작 확인 필요 — 만약 문제 발생 시 `IsNull()` operator를 사용: `where: { checkOutTime: IsNull() }`

**Step 3: Commit**

```bash
git add server/src/modules/session/
git commit -m "refactor: convert SessionModule from Prisma to TypeORM"
```

---

### Task 6: VacationModule 서비스 전환

**Files:**
- Modify: `server/src/modules/vacation/vacation.module.ts`
- Modify: `server/src/modules/vacation/vacation.service.ts`

**Step 1: vacation.module.ts에 TypeOrmModule.forFeature 추가**

```typescript
// server/src/modules/vacation/vacation.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { VacationService } from './vacation.service';
import { VacationResolver } from './vacation.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, SessionEntity, DailyVacationEntity]),
  ],
  providers: [VacationService, VacationResolver],
})
export class VacationModule {}
```

**Step 2: vacation.service.ts를 TypeORM Repository 패턴으로 전환**

핵심 변환:
- `prisma.member.findUnique({ where: { id } })` → `memberRepo.findOne({ where: { id } })`
- `prisma.dailyVacation.findFirst({ where })` → `vacationRepo.findOne({ where })`
- `prisma.dailyVacation.findMany({ where: { date: { in: dates } } })` → `vacationRepo.find({ where: { memberId, date: In(dates) } })`
- `prisma.dailyVacation.create({ data })` → `vacationRepo.save(vacationRepo.create(data))`
- `prisma.dailyVacation.deleteMany({ where })` → `vacationRepo.delete({ memberId, date })`

```typescript
// server/src/modules/vacation/vacation.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { DailyVacationEntity } from '../../entities/daily-vacation.entity';
import { FULL_DAY_VACATION_HOURS } from '../../common/constants';
import { VACATION_UNITS } from './vacation.constants';
import { MemberNotFoundError } from '../member/errors/member-not-found.error';
import { InvalidDateFormatError } from './errors/invalid-date-format.error';
import {
  InvalidVacationHoursError,
  VacationAlreadyExistsError,
  ActiveSessionExistsError,
  VacationNotFoundError,
} from './errors/vacation.error';

@Injectable()
export class VacationService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(DailyVacationEntity)
    private readonly vacationRepo: Repository<DailyVacationEntity>,
  ) {}

  private validateVacationHours(hours: number) {
    if (!VACATION_UNITS.includes(hours as (typeof VACATION_UNITS)[number])) {
      throw new InvalidVacationHoursError();
    }
  }

  private validateDateFormat(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new InvalidDateFormatError();
    }
  }

  private async ensureMemberExists(memberId: string) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
    });
    if (!member) {
      throw new MemberNotFoundError();
    }
  }

  async useVacation(memberId: string, date: string, hours: number) {
    this.validateVacationHours(hours);
    this.validateDateFormat(date);
    await this.ensureMemberExists(memberId);

    const existing = await this.vacationRepo.findOne({
      where: { memberId, date },
    });
    if (existing) {
      throw new VacationAlreadyExistsError();
    }

    if (hours >= FULL_DAY_VACATION_HOURS) {
      const activeSession = await this.sessionRepo.findOne({
        where: { memberId, date, checkOutTime: undefined },
      });
      if (activeSession) {
        throw new ActiveSessionExistsError();
      }
    }

    const vacation = this.vacationRepo.create({ memberId, date, hours });
    return this.vacationRepo.save(vacation);
  }

  async useVacations(memberId: string, dates: string[], hours: number) {
    this.validateVacationHours(hours);
    for (const date of dates) {
      this.validateDateFormat(date);
    }
    await this.ensureMemberExists(memberId);

    const existingVacations = await this.vacationRepo.find({
      where: { memberId, date: In(dates) },
    });
    const existingDates = new Set(existingVacations.map((v) => v.date));

    const succeeded: Array<{
      id: string;
      memberId: string;
      date: string;
      hours: number;
    }> = [];
    const failed: Array<{ date: string; reason: string }> = [];

    for (const date of dates) {
      if (existingDates.has(date)) {
        failed.push({
          date,
          reason: '이미 해당 날짜에 휴가가 등록되어 있습니다.',
        });
        continue;
      }

      try {
        if (hours >= FULL_DAY_VACATION_HOURS) {
          const activeSession = await this.sessionRepo.findOne({
            where: { memberId, date, checkOutTime: undefined },
          });
          if (activeSession) {
            failed.push({
              date,
              reason: '공부 중에는 전일 휴가를 사용할 수 없습니다.',
            });
            continue;
          }
        }

        const vacation = this.vacationRepo.create({ memberId, date, hours });
        const saved = await this.vacationRepo.save(vacation);
        succeeded.push(saved);
      } catch {
        failed.push({ date, reason: '휴가 등록에 실패했습니다.' });
      }
    }

    return { succeeded, failed };
  }

  async cancelVacation(memberId: string, date: string) {
    this.validateDateFormat(date);
    await this.ensureMemberExists(memberId);

    const result = await this.vacationRepo.delete({ memberId, date });
    if (result.affected === 0) {
      throw new VacationNotFoundError();
    }

    return true;
  }
}
```

**Step 3: Commit**

```bash
git add server/src/modules/vacation/
git commit -m "refactor: convert VacationModule from Prisma to TypeORM"
```

---

### Task 7: FeeModule 서비스 전환

**Files:**
- Modify: `server/src/modules/fee/fee.module.ts`
- Modify: `server/src/modules/fee/fee.service.ts`

**Step 1: fee.module.ts에 TypeOrmModule.forFeature 추가**

```typescript
// server/src/modules/fee/fee.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { MonthlyFeeEntity } from '../../entities/monthly-fee.entity';
import { FeeService } from './fee.service';
import { FeeResolver } from './fee.resolver';
import { SettingsModule } from '../settings/settings.module';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, SessionEntity, MonthlyFeeEntity]),
    SettingsModule,
    MemberModule,
  ],
  providers: [FeeService, FeeResolver],
})
export class FeeModule {}
```

**Step 2: fee.service.ts를 TypeORM Repository 패턴으로 전환**

핵심 변환:
- `prisma.monthlyFee.findUnique({ where: { memberId_month } })` → `feeRepo.findOne({ where: { memberId, month } })`
- `prisma.monthlyFee.update({ where: { id }, data })` → `feeRepo.save({ ...fee, [field]: value })`

```typescript
// server/src/modules/fee/fee.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SessionEntity } from '../../entities/session.entity';
import { MonthlyFeeEntity } from '../../entities/monthly-fee.entity';
import { SettingsService } from '../settings/settings.service';
import { MONTHLY_FEE } from './fee.constants';
import {
  getMonthDateRange,
  getWeekDateRange,
  getKSTToday,
} from '../../common/utils/date.util';
import { buildRanking } from './utils/ranking.util';
import { RankingPeriod } from './enums/ranking-period.enum';
import {
  InvalidMonthFormatError,
  InvalidStatusTransitionError,
} from './errors/fee.error';

type FeeType = 'MONTHLY' | 'LATE';

function getStatusField(type: FeeType): 'monthlyFeeStatus' | 'lateFeeStatus' {
  return type === 'MONTHLY' ? 'monthlyFeeStatus' : 'lateFeeStatus';
}

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(MonthlyFeeEntity)
    private readonly feeRepo: Repository<MonthlyFeeEntity>,
    private readonly settingsService: SettingsService,
  ) {}

  private validateMonthFormat(month: string) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new InvalidMonthFormatError();
    }
  }

  private async getOrCreateMonthlyFee(memberId: string, month: string) {
    const existing = await this.feeRepo.findOne({
      where: { memberId, month },
    });
    if (existing) return existing;

    const fee = this.feeRepo.create({
      memberId,
      month,
      monthlyFeeStatus: 'UNPAID',
      lateFeeStatus: 'UNPAID',
    });
    return this.feeRepo.save(fee);
  }

  async getFeeStatus(month: string) {
    const [yearStr, monthStr] = month.split('-');
    const { start, end } = getMonthDateRange(Number(yearStr), Number(monthStr));

    const members = await this.memberRepo.find({
      order: { createdAt: 'ASC' },
    });

    const allSessions = await this.sessionRepo.find({
      where: { date: Between(start, end) },
      order: { checkInTime: 'ASC' },
    });

    const allFees = await this.feeRepo.find({
      where: { month },
    });
    const feeMap = new Map(allFees.map((f) => [f.memberId, f]));

    const settings = await this.settingsService.getSettings();

    return members.map((member) => {
      const sessions = allSessions.filter((s) => s.memberId === member.id);

      const dateFirst = new Map<string, SessionEntity>();
      for (const s of sessions) {
        if (!dateFirst.has(s.date)) dateFirst.set(s.date, s);
      }
      const lateCount = [...dateFirst.values()].filter(
        (s) => s.isLate,
      ).length;

      const fee = feeMap.get(member.id);

      return {
        member,
        lateFee: lateCount * settings.lateFeeAmount,
        monthlyFee: MONTHLY_FEE,
        monthlyFeeStatus: fee?.monthlyFeeStatus ?? 'UNPAID',
        lateFeeStatus: fee?.lateFeeStatus ?? 'UNPAID',
        lateCount,
      };
    });
  }

  async getMemberRanking(period: RankingPeriod) {
    let start: string;
    let end: string;

    if (period === RankingPeriod.WEEKLY) {
      const range = getWeekDateRange();
      start = range.start;
      end = range.end;
    } else {
      const today = getKSTToday();
      const [y, m] = today.split('-').map(Number);
      const range = getMonthDateRange(y, m);
      start = range.start;
      end = range.end;
    }

    const [members, sessions] = await Promise.all([
      this.memberRepo.find(),
      this.sessionRepo.find({
        where: { date: Between(start, end) },
        order: { checkInTime: 'ASC' },
      }),
    ]);

    return buildRanking(members, sessions);
  }

  async requestFeePayment(memberId: string, month: string, type: string) {
    this.validateMonthFormat(month);
    const fee = await this.getOrCreateMonthlyFee(memberId, month);
    const field = getStatusField(type as FeeType);

    if (fee[field] !== 'UNPAID') {
      throw new InvalidStatusTransitionError(fee[field], 'request');
    }

    fee[field] = 'PENDING';
    return this.feeRepo.save(fee);
  }

  async confirmFeePayment(memberId: string, month: string, type: string) {
    this.validateMonthFormat(month);
    const fee = await this.getOrCreateMonthlyFee(memberId, month);
    const field = getStatusField(type as FeeType);

    if (fee[field] !== 'PENDING') {
      throw new InvalidStatusTransitionError(fee[field], 'confirm');
    }

    fee[field] = 'PAID';
    return this.feeRepo.save(fee);
  }

  async rejectFeePayment(memberId: string, month: string, type: string) {
    this.validateMonthFormat(month);
    const fee = await this.getOrCreateMonthlyFee(memberId, month);
    const field = getStatusField(type as FeeType);

    if (fee[field] !== 'PENDING') {
      throw new InvalidStatusTransitionError(fee[field], 'reject');
    }

    fee[field] = 'UNPAID';
    return this.feeRepo.save(fee);
  }
}
```

**Step 3: Commit**

```bash
git add server/src/modules/fee/
git commit -m "refactor: convert FeeModule from Prisma to TypeORM"
```

---

### Task 8: SettingsModule 서비스 전환

**Files:**
- Modify: `server/src/modules/settings/settings.module.ts`
- Modify: `server/src/modules/settings/settings.service.ts`

**Step 1: settings.module.ts에 TypeOrmModule.forFeature 추가**

```typescript
// server/src/modules/settings/settings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../../entities/member.entity';
import { SettingsEntity } from '../../entities/settings.entity';
import { SettingsService } from './settings.service';
import { SettingsResolver } from './settings.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([SettingsEntity, MemberEntity])],
  providers: [SettingsService, SettingsResolver],
  exports: [SettingsService],
})
export class SettingsModule {}
```

**Step 2: settings.service.ts를 TypeORM Repository 패턴으로 전환**

핵심 변환:
- `prisma.settings.upsert(...)` → `settingsRepo.findOne` + `save` (TypeORM에 upsert가 있지만 Oracle 호환성 위해 명시적 처리)
- `prisma.$transaction(...)` → `DataSource.transaction(...)` 또는 `queryRunner`

```typescript
// server/src/modules/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SettingsEntity } from '../../entities/settings.entity';
import { MemberEntity } from '../../entities/member.entity';
import { MemberNotFoundError } from '../member/errors/member-not-found.error';
import {
  InvalidRoleError,
  LastAdminError,
  InvalidHourError,
  InvalidMinuteError,
  InvalidAmountError,
} from './errors/settings.error';

const VALID_ROLES = ['ADMIN', 'MEMBER'] as const;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly settingsRepo: Repository<SettingsEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getSettings(): Promise<SettingsEntity> {
    let settings = await this.settingsRepo.findOne({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 'default',
        studyStartHour: 10,
        studyStartMinute: 0,
        lateFeeAmount: 1000,
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateMemberRole(memberId: string, role: string) {
    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      throw new InvalidRoleError();
    }

    return this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(MemberEntity);

      const member = await memberRepo.findOne({
        where: { id: memberId },
      });
      if (!member) {
        throw new MemberNotFoundError();
      }

      if (member.role === 'ADMIN' && role === 'MEMBER') {
        const adminCount = await memberRepo.count({
          where: { role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          throw new LastAdminError();
        }
      }

      member.role = role;
      return memberRepo.save(member);
    });
  }

  async updateStudyStartTime(hour: number, minute: number) {
    if (hour < 0 || hour > 23) {
      throw new InvalidHourError();
    }
    if (minute < 0 || minute > 59) {
      throw new InvalidMinuteError();
    }

    let settings = await this.settingsRepo.findOne({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 'default',
        studyStartHour: hour,
        studyStartMinute: minute,
        lateFeeAmount: 1000,
      });
    } else {
      settings.studyStartHour = hour;
      settings.studyStartMinute = minute;
    }
    return this.settingsRepo.save(settings);
  }

  async updateLateFeeAmount(amount: number) {
    if (amount < 0) {
      throw new InvalidAmountError();
    }

    let settings = await this.settingsRepo.findOne({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 'default',
        studyStartHour: 10,
        studyStartMinute: 0,
        lateFeeAmount: amount,
      });
    } else {
      settings.lateFeeAmount = amount;
    }
    return this.settingsRepo.save(settings);
  }
}
```

**Step 3: Commit**

```bash
git add server/src/modules/settings/
git commit -m "refactor: convert SettingsModule from Prisma to TypeORM"
```

---

### Task 9: Prisma import 제거 + 타입 참조 수정

**Files:**
- Modify: `server/src/modules/session/session.service.ts` — `import type { Session } from '@prisma/client'` 제거 (이미 Task 5에서 처리됨)
- Modify: `server/src/modules/fee/fee.service.ts` — `import type { Session } from '@prisma/client'` 제거 (이미 Task 7에서 처리됨)
- Modify: `server/src/modules/settings/settings.service.ts` — `import type { Settings } from '@prisma/client'` 제거 (이미 Task 8에서 처리됨)
- Check: 모든 `@prisma/client` import가 제거되었는지 프로젝트 전체 검색

**Step 1: 프로젝트 전체에서 prisma import 검색**

Run: `grep -r "@prisma" server/src/ --include="*.ts"`
Expected: 결과 없음

**Step 2: 프로젝트 전체에서 PrismaService 참조 검색**

Run: `grep -r "PrismaService\|prisma\." server/src/ --include="*.ts"`
Expected: 결과 없음

**Step 3: Commit (변경사항 있을 경우만)**

```bash
git add -A
git commit -m "chore: remove all remaining Prisma references"
```

---

### Task 10: Dockerfile 및 배포 설정 업데이트

**Files:**
- Modify: `server/Dockerfile`
- Modify: `server/.env.example`

**Step 1: Dockerfile 업데이트**

Oracle DB thin mode는 별도 native 라이브러리 불필요. Prisma 관련 명령 제거.

```dockerfile
FROM node:20-slim AS base

FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/nest-cli.json ./
RUN npm ci --omit=dev

EXPOSE ${PORT:-4000}
CMD ["node", "dist/main.js"]
```

**Step 2: .env.example 업데이트**

```env
ORACLE_USER="ADMIN"
ORACLE_PASSWORD="your-password"
ORACLE_CONNECTION_STRING="(description= (retry_count=20)...)"
TZ="Asia/Seoul"
PORT=4000
CORS_ORIGINS="http://localhost:8081"
NODE_ENV="production"
SENTRY_DSN=""
```

**Step 3: Commit**

```bash
git add server/Dockerfile server/.env.example
git commit -m "chore: update Dockerfile and env config for Oracle DB"
```

---

### Task 11: 빌드 검증 및 타입 체크

**Step 1: TypeScript 컴파일 확인**

Run: `cd server && npx tsc --noEmit`
Expected: 에러 없음

**Step 2: NestJS 빌드 확인**

Run: `cd server && npm run build`
Expected: 정상 빌드 완료

**Step 3: 에러 수정 (있을 경우)**

타입 에러가 발생하면 개별 파일 수정. 주요 예상 이슈:
- `Session` 타입 참조가 `SessionEntity`로 변경되어야 할 곳
- `Settings` 반환 타입이 `SettingsEntity`로 변경
- Boolean ↔ Number 변환 관련 타입 이슈

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: resolve TypeScript compilation errors after TypeORM migration"
```

---

### Task 12: Oracle DB 연결 테스트

**Step 1: .env에 실제 Oracle 연결 정보 입력**

사용자가 직접 `.env` 파일에 ORACLE_PASSWORD 입력

**Step 2: 서버 시작 테스트**

Run: `cd server && npm run dev`
Expected:
- `Server ready at http://localhost:4000/graphql` 출력
- Oracle DB 연결 성공 로그
- `synchronize: true`로 테이블 자동 생성

**Step 3: GraphQL Playground에서 기본 쿼리 테스트**

```graphql
query { members { id name displayName } }
query { getSettings { studyStartHour studyStartMinute lateFeeAmount } }
```

**Step 4: 에러 수정 (있을 경우)**

Oracle 특유의 이슈:
- `varchar2` 타입 관련 에러 → `varchar`로 변경 시도
- `timestamp with time zone` → `timestamp` 변경 시도
- Boolean transformer 동작 확인
- `IS NULL` 쿼리 동작 확인 (`IsNull()` operator 필요 여부)

**Step 5: Commit**

```bash
git add -A
git commit -m "fix: resolve Oracle DB compatibility issues"
```

---

## Summary — Key Conversion Patterns

| Prisma | TypeORM |
|--------|---------|
| `prisma.model.findMany({ where, orderBy })` | `repo.find({ where, order })` |
| `prisma.model.findFirst({ where })` | `repo.findOne({ where })` |
| `prisma.model.findUnique({ where: { id } })` | `repo.findOne({ where: { id } })` |
| `prisma.model.count({ where })` | `repo.count({ where })` |
| `prisma.model.create({ data })` | `repo.save(repo.create(data))` |
| `prisma.model.update({ where: { id }, data })` | entity 수정 후 `repo.save(entity)` |
| `prisma.model.upsert(...)` | `findOne` + 조건부 `create`/`save` |
| `prisma.model.deleteMany({ where })` | `repo.delete(where)` |
| `prisma.$transaction(fn)` | `dataSource.transaction(fn)` |
| `{ date: { gte, lte } }` | `Between(start, end)` |
| `{ date: { in: arr } }` | `In(arr)` |
| `{ checkOutTime: null }` | `{ checkOutTime: IsNull() }` 또는 `undefined` |
| `@default(cuid())` | `@PrimaryGeneratedColumn('uuid')` |
| `Boolean` column | `number` + value transformer |
