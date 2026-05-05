import { IsNull } from 'typeorm';
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

function makeMemberService() {
  return {
    ensureMemberInWorkspace: jest.fn().mockResolvedValue({
      id: 'member-1',
      workspaceId: 'workspace-1',
    }),
  };
}

describe('SessionService workspace scope', () => {
  it('checks member workspace before reading an active session', async () => {
    const memberService = makeMemberService();
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
    const memberService = makeMemberService();
    const sessionRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (value) => value),
    });
    const service = new SessionService(
      sessionRepo as any,
      makeRepo() as any,
      makeRepo({ findOne: jest.fn().mockResolvedValue(null) }) as any,
      {
        getSettings: jest
          .fn()
          .mockResolvedValue({ studyStartHour: 10, studyStartMinute: 0 }),
      } as any,
      memberService as any,
    );

    const result = await service.checkIn('member-1', 'workspace-1');

    expect(result.workspaceId).toBe('workspace-1');
    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
  });

  it('checks out only an active session in the current workspace', async () => {
    const memberService = makeMemberService();
    const activeSession = {
      memberId: 'member-1',
      workspaceId: 'workspace-1',
      checkOutTime: null,
    };
    const sessionRepo = makeRepo({
      findOne: jest.fn().mockResolvedValue(activeSession),
      save: jest.fn(async (value) => value),
    });
    const service = new SessionService(
      sessionRepo as any,
      makeRepo() as any,
      makeRepo() as any,
      { getSettings: jest.fn() } as any,
      memberService as any,
    );

    await service.checkOut('member-1', 'workspace-1');

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(sessionRepo.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        checkOutTime: IsNull(),
      }),
    });
  });

  it('checks member workspace before reading day details', async () => {
    const memberService = makeMemberService();
    const sessionRepo = makeRepo({ find: jest.fn().mockResolvedValue([]) });
    const vacationRepo = makeRepo({ findOne: jest.fn().mockResolvedValue(null) });
    const service = new SessionService(
      sessionRepo as any,
      makeRepo() as any,
      vacationRepo as any,
      { getSettings: jest.fn() } as any,
      memberService as any,
    );

    await service.getDayDetail('member-1', '2026-04-25', 'workspace-1');

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(sessionRepo.find).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        date: '2026-04-25',
      },
      order: { checkInTime: 'ASC' },
    });
    expect(vacationRepo.findOne).toHaveBeenCalledWith({
      where: {
        memberId: 'member-1',
        workspaceId: 'workspace-1',
        date: '2026-04-25',
      },
    });
  });

  it('checks member workspace before reading the calendar', async () => {
    const memberService = makeMemberService();
    const sessionRepo = makeRepo({ find: jest.fn().mockResolvedValue([]) });
    const vacationRepo = makeRepo({ find: jest.fn().mockResolvedValue([]) });
    const service = new SessionService(
      sessionRepo as any,
      makeRepo() as any,
      vacationRepo as any,
      { getSettings: jest.fn() } as any,
      memberService as any,
    );

    await service.getCalendar('member-1', 2026, 4, 'workspace-1');

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(sessionRepo.find).toHaveBeenCalledWith({
      where: expect.objectContaining({
        memberId: 'member-1',
        workspaceId: 'workspace-1',
      }),
      order: { checkInTime: 'ASC' },
    });
    expect(vacationRepo.find).toHaveBeenCalledWith({
      where: expect.objectContaining({
        memberId: 'member-1',
        workspaceId: 'workspace-1',
      }),
    });
  });

  it('checks member workspace before reading monthly summary', async () => {
    const memberService = makeMemberService();
    const sessionRepo = makeRepo({ find: jest.fn().mockResolvedValue([]) });
    const vacationRepo = makeRepo({ find: jest.fn().mockResolvedValue([]) });
    const service = new SessionService(
      sessionRepo as any,
      makeRepo() as any,
      vacationRepo as any,
      { getSettings: jest.fn().mockResolvedValue({ lateFeeAmount: 1000 }) } as any,
      memberService as any,
    );

    await service.getMonthlySummary('member-1', 2026, 4, 'workspace-1');

    expect(memberService.ensureMemberInWorkspace).toHaveBeenCalledWith(
      'member-1',
      'workspace-1',
    );
    expect(sessionRepo.find).toHaveBeenCalledWith({
      where: expect.objectContaining({
        memberId: 'member-1',
        workspaceId: 'workspace-1',
      }),
      order: { checkInTime: 'ASC' },
    });
    expect(vacationRepo.find).toHaveBeenCalledWith({
      where: expect.objectContaining({
        memberId: 'member-1',
        workspaceId: 'workspace-1',
      }),
    });
  });
});
