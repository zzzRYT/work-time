# Workspace Authorization Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close workspace/member authorization gaps so users can only read or mutate members, sessions, vacations, fees, and settings inside their authorized workspace.

**Architecture:** Server resolvers must pass the current `workspaceId` and, where needed, `workspaceRole` into services. Services own the data boundary by checking `memberId + workspaceId` before querying or mutating member-scoped rows. The app only improves stale local state handling; it must not be trusted as an authorization layer.

**Tech Stack:** NestJS 11, GraphQL, TypeORM, Jest/ts-jest, Expo Router, Apollo Client, Zustand.

---

## File Structure

- Create `server/src/modules/auth/admin.guard.ts`
  - Guard for workspace-level admin mutations.
  - Extends existing `WorkspaceGuard` so auth, workspace membership, and role extraction remain centralized.
- Create `server/src/modules/member/errors/member-access-denied.error.ts`
  - Explicit forbidden error for cross-workspace member access.
- Modify `server/src/modules/member/member.service.ts`
  - Add `ensureMemberInWorkspace(memberId, workspaceId)` and export it through `MemberModule`.
- Modify `server/src/modules/session/session.resolver.ts`
  - Pass `workspaceId` to every member-scoped query/mutation.
- Modify `server/src/modules/session/session.service.ts`
  - Verify member/workspace scope before all member-scoped session reads and writes.
- Modify `server/src/modules/vacation/vacation.resolver.ts`
  - Pass `workspaceId` to vacation mutations.
- Modify `server/src/modules/vacation/vacation.service.ts`
  - Verify member/workspace scope and persist `workspaceId` on vacation rows.
- Modify `server/src/modules/fee/fee.resolver.ts`
  - Pass `workspaceId`; protect confirm/reject with admin guard.
- Modify `server/src/modules/fee/fee.service.ts`
  - Verify member/workspace scope and persist/query `workspaceId` on fee rows.
- Modify `server/src/modules/settings/settings.resolver.ts`
  - Protect settings mutations with admin guard.
- Modify `server/src/app.module.ts`
  - Make TypeORM synchronize opt-in.
- Modify `app/src/shared/store/auth.ts`
  - Add a store helper that clears stale workspace/member state.
- Modify `app/src/app/_layout.tsx`
  - Verify persisted workspace membership before routing into tabs.
- Test files:
  - Create `server/src/modules/member/member.service.spec.ts`
  - Create `server/src/modules/session/session.service.spec.ts`
  - Create `server/src/modules/vacation/vacation.service.spec.ts`
  - Create `server/src/modules/fee/fee.service.spec.ts`

---

### Task 1: Add Shared Member Workspace Verification

**Files:**
- Create: `server/src/modules/member/errors/member-access-denied.error.ts`
- Create: `server/src/modules/member/member.service.spec.ts`
- Modify: `server/src/modules/member/member.service.ts`

- [ ] **Step 1: Write the failing member scope tests**

Create `server/src/modules/member/member.service.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';
import { MemberService } from './member.service';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    ...overrides,
  };
}

describe('MemberService.ensureMemberInWorkspace', () => {
  it('returns the member when it belongs to the workspace', async () => {
    const memberRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue({
        id: 'member-1',
        workspaceId: 'workspace-1',
      }),
    });
    const service = new MemberService(
      memberRepo as any,
      makeRepo() as any,
      makeRepo() as any,
      makeRepo() as any,
    );

    await expect(
      service.ensureMemberInWorkspace('member-1', 'workspace-1'),
    ).resolves.toEqual({ id: 'member-1', workspaceId: 'workspace-1' });

    expect(memberRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'member-1', workspaceId: 'workspace-1' },
    });
  });

  it('throws ForbiddenException when the member is outside the workspace', async () => {
    const memberRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const service = new MemberService(
      memberRepo as any,
      makeRepo() as any,
      makeRepo() as any,
      makeRepo() as any,
    );

    await expect(
      service.ensureMemberInWorkspace('member-1', 'workspace-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd server
npm test -- member.service.spec.ts
```

Expected: FAIL because `ensureMemberInWorkspace` does not exist.

- [ ] **Step 3: Add the explicit error class**

Create `server/src/modules/member/errors/member-access-denied.error.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';

export class MemberAccessDeniedError extends ForbiddenException {
  constructor() {
    super('Member does not belong to this workspace');
  }
}
```

- [ ] **Step 4: Implement the service helper**

In `server/src/modules/member/member.service.ts`, add the import:

```ts
import { MemberAccessDeniedError } from './errors/member-access-denied.error';
```

Add this method inside `MemberService`:

```ts
async ensureMemberInWorkspace(
  memberId: string,
  workspaceId: string,
): Promise<MemberEntity> {
  const member = await this.memberRepo.findOne({
    where: { id: memberId, workspaceId },
  });

  if (!member) {
    throw new MemberAccessDeniedError();
  }

  return member;
}
```

- [ ] **Step 5: Run the focused test**

Run:

```bash
cd server
npm test -- member.service.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/member/member.service.ts server/src/modules/member/member.service.spec.ts server/src/modules/member/errors/member-access-denied.error.ts
git commit -m "test: add workspace member scope guard"
```

---

### Task 2: Lock Session APIs To Current Workspace

**Files:**
- Create: `server/src/modules/session/session.service.spec.ts`
- Modify: `server/src/modules/session/session.resolver.ts`
- Modify: `server/src/modules/session/session.service.ts`
- Modify: `server/src/modules/session/session.module.ts`

- [ ] **Step 1: Write failing session service tests**

Create `server/src/modules/session/session.service.spec.ts`:

```ts
import { SessionService } from './session.service';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
    count: jest.fn(),
    ...overrides,
  };
}

describe('SessionService workspace scope', () => {
  it('checks member workspace before reading an active session', async () => {
    const memberService = {
      ensureMemberInWorkspace: jest.fn().mockResolvedValue({
        id: 'member-1',
        workspaceId: 'workspace-1',
      }),
    };
    const sessionRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(null) });
    const service = new SessionService(
      sessionRepo as any,
      makeRepo() as any,
      makeRepo() as any,
      { getSettings: jest.fn() } as any,
      memberService as any,
    );

    await service.getActiveSession('member-1', 'workspace-1');

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(sessionRepo.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({
        memberId: 'member-1',
        workspaceId: 'workspace-1',
      }),
    });
  });

  it('persists check-ins with the current workspace after scope validation', async () => {
    const memberService = {
      ensureMemberInWorkspace: jest.fn().mockResolvedValue({
        id: 'member-1',
        workspaceId: 'workspace-1',
      }),
    };
    const sessionRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (value) => value),
    });
    const service = new SessionService(
      sessionRepo as any,
      makeRepo() as any,
      makeRepo({ findOne: jest.fn().mockResolvedValue(null) }) as any,
      { getSettings: jest.fn().mockResolvedValue({ studyStartHour: 10, studyStartMinute: 0 }) } as any,
      memberService as any,
    );

    const result = await service.checkIn('member-1', 'workspace-1');

    expect(result.workspaceId).toBe('workspace-1');
    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd server
npm test -- session.service.spec.ts
```

Expected: FAIL because `SessionService` does not inject `MemberService` and methods do not accept `workspaceId`.

- [ ] **Step 3: Import `MemberModule` into `SessionModule`**

In `server/src/modules/session/session.module.ts`, add:

```ts
import { MemberModule } from '../member/member.module';
```

Then include it in imports:

```ts
imports: [
  TypeOrmModule.forFeature([MemberEntity, SessionEntity, DailyVacationEntity]),
  SettingsModule,
  MemberModule,
],
```

- [ ] **Step 4: Update session resolver signatures**

In `server/src/modules/session/session.resolver.ts`, pass `workspaceId` to every member-scoped operation:

```ts
async activeSession(
  @Args('memberId', { type: () => ID }) memberId: string,
  @CurrentWorkspace() workspaceId: string,
): Promise<SessionEntity | null> {
  return this.sessionService.getActiveSession(memberId, workspaceId);
}

async dayDetail(
  @Args('memberId', { type: () => ID }) memberId: string,
  @Args('date') date: string,
  @CurrentWorkspace() workspaceId: string,
) {
  return this.sessionService.getDayDetail(memberId, date, workspaceId);
}

async calendar(
  @Args('memberId', { type: () => ID }) memberId: string,
  @Args('year', { type: () => Int }) year: number,
  @Args('month', { type: () => Int }) month: number,
  @CurrentWorkspace() workspaceId: string,
) {
  return this.sessionService.getCalendar(memberId, year, month, workspaceId);
}

return this.sessionService.getMonthlySummary(memberId, year, month, workspaceId);
return this.sessionService.checkIn(memberId, workspaceId);
return this.sessionService.checkOut(memberId, workspaceId);
```

- [ ] **Step 5: Update `SessionService` constructor and method bodies**

In `server/src/modules/session/session.service.ts`, import and inject `MemberService`:

```ts
import { MemberService } from '../member/member.service';
```

Constructor tail:

```ts
private readonly settingsService: SettingsService,
private readonly memberService: MemberService,
```

Apply these signature and query changes:

```ts
async getActiveSession(memberId: string, workspaceId: string) {
  await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);
  const today = getKSTToday();
  return this.sessionRepo.findOne({
    where: { memberId, workspaceId, date: today, checkOutTime: IsNull() },
  });
}

async getDayDetail(memberId: string, date: string, workspaceId: string) {
  await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);
  const sessions = await this.sessionRepo.find({
    where: { memberId, workspaceId, date },
    order: { checkInTime: 'ASC' },
  });
  const vacation = await this.vacationRepo.findOne({
    where: { memberId, workspaceId, date },
  });
  const totalDurationMinutes = sessions.reduce(
    (sum, s) => sum + calculateDurationMinutes(s.checkInTime, s.checkOutTime),
    0,
  );
  return { sessions, totalDurationMinutes, vacationHours: vacation?.hours ?? null };
}

async getCalendar(memberId: string, year: number, month: number, workspaceId: string) {
  await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);
  const { start, end } = getMonthDateRange(year, month);
  const [sessions, vacations] = await Promise.all([
    this.sessionRepo.find({
      where: { memberId, workspaceId, date: Between(start, end) },
      order: { checkInTime: 'ASC' },
    }),
    this.vacationRepo.find({
      where: { memberId, workspaceId, date: Between(start, end) },
    }),
  ]);
  return buildCalendar(year, month, sessions, vacations);
}
```

Also add `workspaceId` to the existing `getMonthlySummary`, `checkIn`, and `checkOut` member-scoped repository filters. `checkOut` must become:

```ts
async checkOut(memberId: string, workspaceId: string) {
  await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);
  const today = getKSTToday();
  const activeSession = await this.sessionRepo.findOne({
    where: { memberId, workspaceId, date: today, checkOutTime: IsNull() },
  });
  if (!activeSession) throw new NotCheckedInError();
  activeSession.checkOutTime = new Date();
  return this.sessionRepo.save(activeSession);
}
```

- [ ] **Step 6: Run focused and full server checks**

Run:

```bash
cd server
npm test -- session.service.spec.ts
npx tsc --noEmit
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/session/session.module.ts server/src/modules/session/session.resolver.ts server/src/modules/session/session.service.ts server/src/modules/session/session.service.spec.ts
git commit -m "fix: scope session APIs to workspace members"
```

---

### Task 3: Lock Vacation APIs To Current Workspace

**Files:**
- Create: `server/src/modules/vacation/vacation.service.spec.ts`
- Modify: `server/src/modules/vacation/vacation.resolver.ts`
- Modify: `server/src/modules/vacation/vacation.service.ts`
- Modify: `server/src/modules/vacation/vacation.module.ts`

- [ ] **Step 1: Write failing vacation scope tests**

Create `server/src/modules/vacation/vacation.service.spec.ts`:

```ts
import { VacationService } from './vacation.service';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => value),
    delete: jest.fn(),
    ...overrides,
  };
}

describe('VacationService workspace scope', () => {
  it('validates member workspace and saves workspaceId for a vacation', async () => {
    const memberService = {
      ensureMemberInWorkspace: jest.fn().mockResolvedValue({
        id: 'member-1',
        workspaceId: 'workspace-1',
      }),
    };
    const vacationRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(null) });
    const service = new VacationService(
      makeRepo() as any,
      makeRepo() as any,
      vacationRepo as any,
      memberService as any,
    );

    const result = await service.useVacation(
      'member-1',
      'workspace-1',
      '2026-04-25',
      4,
    );

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(result.workspaceId).toBe('workspace-1');
  });

  it('deletes vacations only within the current workspace', async () => {
    const service = new VacationService(
      makeRepo() as any,
      makeRepo() as any,
      makeRepo({ delete: jest.fn().mockResolvedValue({ affected: 1 }) }) as any,
      { ensureMemberInWorkspace: jest.fn().mockResolvedValue({ id: 'member-1' }) } as any,
    );

    await expect(
      service.cancelVacation('member-1', 'workspace-1', '2026-04-25'),
    ).resolves.toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd server
npm test -- vacation.service.spec.ts
```

Expected: FAIL because method signatures do not include `workspaceId`.

- [ ] **Step 3: Import `MemberModule` into `VacationModule`**

In `server/src/modules/vacation/vacation.module.ts`:

```ts
import { MemberModule } from '../member/member.module';

imports: [
  TypeOrmModule.forFeature([MemberEntity, SessionEntity, DailyVacationEntity]),
  MemberModule,
],
```

- [ ] **Step 4: Update resolver to pass current workspace**

In `server/src/modules/vacation/vacation.resolver.ts`, import `CurrentWorkspace`:

```ts
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
```

Then pass it:

```ts
async useVacation(
  @Args('memberId', { type: () => ID }) memberId: string,
  @Args('date') date: string,
  @Args('hours', { type: () => Int }) hours: number,
  @CurrentWorkspace() workspaceId: string,
) {
  return this.vacationService.useVacation(memberId, workspaceId, date, hours);
}
```

Apply the same pattern to `useVacations` and `cancelVacation`.

- [ ] **Step 5: Update service signatures and repository filters**

In `server/src/modules/vacation/vacation.service.ts`, import and inject `MemberService`:

```ts
import { MemberService } from '../member/member.service';
```

Constructor tail:

```ts
private readonly vacationRepo: Repository<DailyVacationEntity>,
private readonly memberService: MemberService,
```

Update method signatures and filters:

```ts
async useVacation(memberId: string, workspaceId: string, date: string, hours: number) {
  this.validateVacationHours(hours);
  this.validateDateFormat(date);
  await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);

  const existing = await this.vacationRepo.findOne({
    where: { memberId, workspaceId, date },
  });
  if (existing) throw new VacationAlreadyExistsError();

  if (hours >= FULL_DAY_VACATION_HOURS) {
    const activeSession = await this.sessionRepo.findOne({
      where: { memberId, workspaceId, date, checkOutTime: IsNull() },
    });
    if (activeSession) throw new ActiveSessionExistsError();
  }

  const vacation = this.vacationRepo.create({ memberId, workspaceId, date, hours });
  return this.vacationRepo.save(vacation);
}
```

For bulk creation, query existing vacations with:

```ts
where: { memberId, workspaceId, date: In(dates) },
```

and create rows with:

```ts
this.vacationRepo.create({ memberId, workspaceId, date, hours });
```

For cancellation:

```ts
const result = await this.vacationRepo.delete({ memberId, workspaceId, date });
```

- [ ] **Step 6: Run focused and full server checks**

Run:

```bash
cd server
npm test -- vacation.service.spec.ts
npx tsc --noEmit
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/vacation/vacation.module.ts server/src/modules/vacation/vacation.resolver.ts server/src/modules/vacation/vacation.service.ts server/src/modules/vacation/vacation.service.spec.ts
git commit -m "fix: scope vacation APIs to workspace members"
```

---

### Task 4: Lock Fee APIs And Admin Payment Actions

**Files:**
- Create: `server/src/modules/fee/fee.service.spec.ts`
- Modify: `server/src/modules/fee/fee.resolver.ts`
- Modify: `server/src/modules/fee/fee.service.ts`

- [ ] **Step 1: Write failing fee scope tests**

Create `server/src/modules/fee/fee.service.spec.ts`:

```ts
import { FeeService } from './fee.service';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => value),
    ...overrides,
  };
}

describe('FeeService workspace scope', () => {
  it('creates monthly fee rows with workspaceId after member validation', async () => {
    const feeRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue(null),
    });
    const memberService = {
      ensureMemberInWorkspace: jest.fn().mockResolvedValue({
        id: 'member-1',
        workspaceId: 'workspace-1',
      }),
    };
    const service = new FeeService(
      makeRepo() as any,
      makeRepo() as any,
      feeRepo as any,
      { getSettings: jest.fn() } as any,
      memberService as any,
    );

    const result = await service.requestFeePayment(
      'member-1',
      'workspace-1',
      '2026-04',
      'MONTHLY' as any,
    );

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(result.workspaceId).toBe('workspace-1');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd server
npm test -- fee.service.spec.ts
```

Expected: FAIL because fee methods do not accept `workspaceId`.

- [ ] **Step 3: Update fee resolver mutation calls**

In `server/src/modules/fee/fee.resolver.ts`, pass current workspace:

```ts
async requestFeePayment(
  @Args('memberId', { type: () => ID }) memberId: string,
  @Args('month') month: string,
  @Args('type', { type: () => FeeType }) type: FeeType,
  @CurrentWorkspace() workspaceId: string,
) {
  return this.feeService.requestFeePayment(memberId, workspaceId, month, type);
}
```

Apply the same `workspaceId` argument to `confirmFeePayment` and `rejectFeePayment`.

- [ ] **Step 4: Update fee service constructor and helpers**

In `server/src/modules/fee/fee.service.ts`, import and inject `MemberService`:

```ts
import { MemberService } from '../member/member.service';
```

Constructor tail:

```ts
private readonly settingsService: SettingsService,
private readonly memberService: MemberService,
```

Change `getOrCreateMonthlyFee`:

```ts
private async getOrCreateMonthlyFee(
  memberId: string,
  workspaceId: string,
  month: string,
) {
  const existing = await this.feeRepo.findOne({
    where: { memberId, workspaceId, month },
  });
  if (existing) return existing;

  const fee = this.feeRepo.create({
    memberId,
    workspaceId,
    month,
    monthlyFeeStatus: 'UNPAID',
    lateFeeStatus: 'UNPAID',
  });
  return this.feeRepo.save(fee);
}
```

Change mutation methods:

```ts
async requestFeePayment(
  memberId: string,
  workspaceId: string,
  month: string,
  type: FeeType,
) {
  this.validateMonthFormat(month);
  await this.memberService.ensureMemberInWorkspace(memberId, workspaceId);
  const fee = await this.getOrCreateMonthlyFee(memberId, workspaceId, month);
  const field = getStatusField(type);
  if (fee[field] !== 'UNPAID') throw new InvalidStatusTransitionError(fee[field], 'request');
  fee[field] = 'PENDING';
  return this.feeRepo.save(fee);
}
```

Apply the same pattern to `confirmFeePayment` and `rejectFeePayment`, with actions `confirm` and `reject`.

- [ ] **Step 5: Protect admin fee mutations**

After Task 5 creates `AdminGuard`, come back and change `confirmFeePayment` and `rejectFeePayment` to:

```ts
@UseGuards(AdminGuard)
```

Keep `requestFeePayment` on `WorkspaceGuard`; regular members should be able to request their own payment.

- [ ] **Step 6: Run focused and full server checks**

Run:

```bash
cd server
npm test -- fee.service.spec.ts
npx tsc --noEmit
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/fee/fee.resolver.ts server/src/modules/fee/fee.service.ts server/src/modules/fee/fee.service.spec.ts
git commit -m "fix: scope fee state to workspaces"
```

---

### Task 5: Add Admin Guard For Settings And Payment Confirmation

**Files:**
- Create: `server/src/modules/auth/admin.guard.ts`
- Modify: `server/src/modules/fee/fee.resolver.ts`
- Modify: `server/src/modules/settings/settings.resolver.ts`

- [ ] **Step 1: Add the admin guard**

Create `server/src/modules/auth/admin.guard.ts`:

```ts
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { WorkspaceGuard } from './workspace.guard';

@Injectable()
export class AdminGuard extends WorkspaceGuard {
  constructor(authService: AuthService) {
    super(authService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    if (req.workspaceRole !== 'OWNER') {
      throw new ForbiddenException('Workspace owner role required');
    }

    return true;
  }
}
```

- [ ] **Step 2: Apply the guard to settings mutations**

In `server/src/modules/settings/settings.resolver.ts`, import:

```ts
import { AdminGuard } from '../auth/admin.guard';
```

Change mutation guards:

```ts
@UseGuards(AdminGuard)
async updateMemberRole(...)

@UseGuards(AdminGuard)
async updateStudyStartTime(...)

@UseGuards(AdminGuard)
async updateLateFeeAmount(...)

@UseGuards(AdminGuard)
async updateMonthlyFeeAmount(...)
```

Leave the `settings` query on `WorkspaceGuard`.

- [ ] **Step 3: Apply the guard to admin fee mutations**

In `server/src/modules/fee/fee.resolver.ts`, import:

```ts
import { AdminGuard } from '../auth/admin.guard';
```

Change:

```ts
@UseGuards(AdminGuard)
async confirmFeePayment(...)

@UseGuards(AdminGuard)
async rejectFeePayment(...)
```

Leave `requestFeePayment`, `feeStatus`, and `memberRanking` on `WorkspaceGuard`.

- [ ] **Step 4: Run typecheck**

Run:

```bash
cd server
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/auth/admin.guard.ts server/src/modules/settings/settings.resolver.ts server/src/modules/fee/fee.resolver.ts
git commit -m "fix: require owner role for admin mutations"
```

---

### Task 6: Fail Closed On Database Synchronization

**Files:**
- Modify: `server/src/app.module.ts`

- [ ] **Step 1: Replace implicit synchronize logic**

In `server/src/app.module.ts`, replace:

```ts
synchronize: process.env.NODE_ENV !== 'production',
```

with:

```ts
synchronize: process.env.DB_SYNCHRONIZE === 'true',
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
cd server
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add server/src/app.module.ts
git commit -m "chore: make database sync explicit"
```

---

### Task 7: Validate Persisted Workspace State On App Boot

**Files:**
- Modify: `app/src/shared/store/auth.ts`
- Modify: `app/src/app/_layout.tsx`

- [ ] **Step 1: Add a store helper for stale workspace state**

In `app/src/shared/store/auth.ts`, add to `AuthStore`:

```ts
clearWorkspace: () => void;
```

This method already exists. Ensure it remains the single helper used by boot validation:

```ts
clearWorkspace: () => {
  set({ workspaceId: null, memberId: null });
  AsyncStorage.multiRemove([WORKSPACE_KEY, MEMBER_KEY]);
},
```

- [ ] **Step 2: Add `myWorkspaces` validation query to layout**

In `app/src/app/_layout.tsx`, add imports:

```ts
import { useQuery } from "@apollo/client";
import { graphql } from "@graphql";
```

Add query near the top of the file:

```ts
const MY_WORKSPACES = graphql(`
  query RootMyWorkspaces {
    myWorkspaces {
      workspaceId
      memberId
    }
  }
`);
```

Inside `RootNavigator`, read more store fields:

```ts
const { session, workspaceId, memberId, isLoaded, clearWorkspace } = useAuthStore();
```

Add query:

```ts
const { data, loading: workspaceLoading } = useQuery(MY_WORKSPACES, {
  skip: !session,
  fetchPolicy: "network-only",
});
```

Add stale-state effect before routing:

```ts
useEffect(() => {
  if (!isLoaded || !session || !workspaceId || workspaceLoading) return;

  const stillValid = data?.myWorkspaces?.some(
    (membership) =>
      membership.workspaceId === workspaceId &&
      membership.memberId === memberId,
  );

  if (data && !stillValid) {
    clearWorkspace();
  }
}, [isLoaded, session, workspaceId, memberId, workspaceLoading, data, clearWorkspace]);
```

Update loading gate:

```ts
if (!isLoaded || (session && workspaceId && workspaceLoading)) {
  return (
    <View className="flex-1 bg-bg items-center justify-center">
      <Text className="text-text-subtle">로딩중...</Text>
    </View>
  );
}
```

- [ ] **Step 3: Run app typecheck**

Run:

```bash
cd app
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/src/shared/store/auth.ts app/src/app/_layout.tsx
git commit -m "fix: validate saved workspace on app boot"
```

---

### Task 8: Production Config Fail-Fast

**Files:**
- Modify: `app/app.config.ts`

- [ ] **Step 1: Add required env helper**

In `app/app.config.ts`, add below `IS_DEV`:

```ts
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for production app config`);
  }
  return value;
}
```

- [ ] **Step 2: Replace production fallbacks**

Change the `extra` values:

```ts
extra: {
  apiUrl: IS_DEV
    ? process.env.API_URL || "http://localhost:4000/graphql"
    : requiredEnv("API_URL"),
  supabaseUrl: IS_DEV
    ? process.env.SUPABASE_URL || ""
    : requiredEnv("SUPABASE_URL"),
  supabaseAnonKey: IS_DEV
    ? process.env.SUPABASE_ANON_KEY || ""
    : requiredEnv("SUPABASE_ANON_KEY"),
  eas: {
    projectId: IS_DEV
      ? process.env.EXPO_PROJECT_ID || "7001d543-835f-43b0-8e00-e3d6fa5540b9"
      : requiredEnv("EXPO_PROJECT_ID"),
  },
},
```

- [ ] **Step 3: Run app typecheck**

Run:

```bash
cd app
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/app.config.ts
git commit -m "chore: require production app config env"
```

---

## Final Verification

- [ ] Run server tests:

```bash
cd server
npm test
```

Expected: all Jest tests pass.

- [ ] Run server typecheck:

```bash
cd server
npx tsc --noEmit
```

Expected: no output and exit code 0.

- [ ] Run app typecheck:

```bash
cd app
npx tsc --noEmit
```

Expected: no output and exit code 0.

- [ ] Manual GraphQL smoke checks:

Use a valid token and workspace header for `workspace-1`. Try a `memberId` from `workspace-2`.

```graphql
query CrossWorkspaceCalendar($memberId: ID!) {
  calendar(memberId: $memberId, year: 2026, month: 4) {
    date
    status
  }
}
```

Expected: GraphQL error with message `Member does not belong to this workspace`.

- [ ] Manual admin guard smoke check:

Use a non-owner member token/header and run:

```graphql
mutation UpdateLateFee($amount: Int!) {
  updateLateFeeAmount(amount: $amount) {
    lateFeeAmount
  }
}
```

Expected: GraphQL error with message `Workspace owner role required`.

---

## Self-Review

- Spec coverage:
  - Cross-workspace `memberId` access: covered by Tasks 1-4.
  - Missing `workspaceId` persistence for vacations/fees: covered by Tasks 3-4.
  - Admin-only mutations: covered by Task 5.
  - DB sync production risk: covered by Task 6.
  - Stale app workspace/member state: covered by Task 7.
  - Production app env fallback risk: covered by Task 8.
- Placeholder scan:
  - No placeholder markers or unspecified test steps remain.
- Type consistency:
  - `ensureMemberInWorkspace(memberId, workspaceId)` is introduced in Task 1 and reused consistently.
  - Resolver-to-service signatures consistently place `workspaceId` immediately after `memberId` for mutation methods.
